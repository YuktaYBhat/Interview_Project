import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';
import { fallbackResume, normalizeResume, type ParsedResume } from '@/utils/resumeParser';

const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Resume must be smaller than 10 MB' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.name, file.type);
    if (!text.trim()) return NextResponse.json({ success: false, error: 'Could not extract text. Try a text-based PDF, DOCX, or TXT file.' }, { status: 422 });

    const resume = await structureResume(text);
    return NextResponse.json({ success: true, data: { resume, extractedText: text.slice(0, 5000), skills: resume.content.skills } });
  } catch (error) {
    console.error('Resume import error:', error);
    return NextResponse.json({ success: false, error: 'Could not import this resume. Please try a PDF, DOCX, or TXT file.' }, { status: 500 });
  }
}

async function extractText(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'txt' || mimeType === 'text/plain') return buffer.toString('utf8');
  if (extension === 'docx' || mimeType.includes('wordprocessingml')) return (await mammoth.extractRawText({ buffer })).value;
  if (extension === 'pdf' || mimeType === 'application/pdf') return (await pdfParse(buffer)).text;
  throw new Error('Unsupported resume format');
}

async function structureResume(text: string): Promise<ParsedResume> {
  const prompt = `Convert this resume text into JSON matching this exact shape. Do not invent facts. Extract every explicit skill and technology. Treat internships, trainee roles, and volunteer work as experience entries. Keep each project as one object; the first project line is its title, explicit Tech/Technologies/Stack lines are technologies, and all other project lines are its description.
{"title":"Untitled Resume","content":{"personalInfo":{"fullName":"","email":"","phone":"","location":"","summary":"","linkedin":"","github":""},"experience":[{"id":"exp_1","jobTitle":"","company":"","location":"","duration":{"startDate":"","endDate":"","isCurrently":false},"description":""}],"education":[{"id":"edu_1","degree":"","institution":"","field":"","graduationDate":"","gpa":""}],"skills":[],"projects":[{"id":"project_1","title":"","description":"","technologies":[],"link":""}],"certifications":[],"achievements":[]}}
Resume text:\n${text.slice(0, 30000)}`;
  const result = await callGemini(prompt);
  if (!result.text) return fallbackResume(text);

  const parsed = parseGeminiJSON<any>(result.text);
  if (!parsed?.content) return fallbackResume(text);
  const normalized = normalizeResume(parsed);
  const fallback = fallbackResume(text);
  return {
    ...normalized,
    content: {
      ...normalized.content,
      experience: hasUsableExperience(normalized.content.experience) ? normalized.content.experience : fallback.content.experience,
      education: normalized.content.education.length ? normalized.content.education : fallback.content.education,
      projects: hasUsableProjects(normalized.content.projects) && normalized.content.projects.length >= fallback.content.projects.length ? normalized.content.projects : fallback.content.projects,
      skills: Array.from(new Set([...normalized.content.skills, ...fallback.content.skills])),
      certifications: normalized.content.certifications.length ? normalized.content.certifications : fallback.content.certifications,
      achievements: normalized.content.achievements.length ? normalized.content.achievements : fallback.content.achievements,
    },
  };
}

function hasUsableExperience(items: Array<Record<string, unknown>>): boolean { return items.some((item) => Boolean(item.jobTitle && (item.company || item.description || (item.duration as any)?.startDate))); }
function hasUsableProjects(items: Array<Record<string, unknown>>): boolean { return items.some((item) => Boolean(item.title && (item.description || (item.technologies as unknown[])?.length))); }
