import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';
import { extractSkills } from '@/lib/resume-analysis';

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
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }
  throw new Error('Unsupported resume format');
}

async function structureResume(text: string): Promise<any> {
  const prompt = `Convert this resume text into JSON matching this exact shape. Do not invent facts. Use empty strings/arrays when unavailable. Extract every explicit skill and technology. Treat internships, trainee roles, and volunteer work as experience entries. Map a position/title/role to jobTitle.
{"title":"Untitled Resume","content":{"personalInfo":{"fullName":"","email":"","phone":"","location":"","summary":""},"experience":[{"id":"exp_1","jobTitle":"","company":"","location":"","duration":{"startDate":"","endDate":"","isCurrently":false},"description":""}],"education":[{"id":"edu_1","degree":"","institution":"","field":"","graduationDate":"","gpa":""}],"skills":[],"projects":[{"id":"project_1","title":"","description":"","technologies":[],"link":""}]}}
Resume text:\n${text.slice(0, 30000)}`;
  const result = await callGemini(prompt);
  if (result.text) {
    const parsed = parseGeminiJSON<any>(result.text);
    if (parsed?.content) {
      const normalized = normalizeResume(parsed);
      const fallback = fallbackResume(text);
      return {
        ...normalized,
        content: {
          ...normalized.content,
          experience: hasUsableExperience(normalized.content.experience) ? normalized.content.experience : fallback.content.experience,
          education: normalized.content.education.length ? normalized.content.education : fallback.content.education,
          projects: hasUsableProjects(normalized.content.projects) ? normalized.content.projects : fallback.content.projects,
          skills: Array.from(new Set([...normalized.content.skills, ...fallback.content.skills])),
        },
      };
    }
  }
  return fallbackResume(text);
}

function normalizeResume(value: any) {
  const content = value.content || {};
  const rawExperience = [
    ...(Array.isArray(content.experience) ? content.experience : []),
    ...(Array.isArray(content.internships) ? content.internships : []),
    ...(Array.isArray(content.workExperience) ? content.workExperience : []),
  ];
  const rawEducation = Array.isArray(content.education) ? content.education : [];
  const rawProjects = Array.isArray(content.projects) ? content.projects : [];
  const rawSkills = Array.isArray(content.skills) ? content.skills : [];
  return {
    title: value.title || 'Imported Resume',
    content: {
      personalInfo: { fullName: '', email: '', phone: '', location: '', summary: '', ...(content.personalInfo || {}) },
      experience: rawExperience.map((item: any, index: number) => normalizeExperience(item, index)).filter(hasResumeContent),
      education: rawEducation.map((item: any, index: number) => normalizeEducation(item, index)).filter(hasResumeContent),
      skills: Array.from(new Set([...rawSkills.map((skill: any) => typeof skill === 'string' ? skill : skill?.name), ...extractSkills(JSON.stringify(content))])).filter(Boolean),
      projects: rawProjects.map((item: any, index: number) => normalizeProject(item, index)).filter(hasResumeContent),
    },
  };
}

function fallbackResume(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || '';
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] || '';
  const fullName = lines.find((line) => line.length > 2 && line.length < 60 && !line.includes('@') && !/resume|curriculum vitae/i.test(line)) || '';
  const sections = splitResumeSections(lines);
  return normalizeResume({
    title: fullName ? `${fullName}'s Resume` : 'Imported Resume',
    content: {
      personalInfo: { fullName, email, phone, location: extractLocation(lines), summary: extractSummary(lines, sections) },
      experience: parseExperience(sections.experience),
      education: parseEducation(sections.education),
      skills: [...extractSkills(text), ...parseSkills(sections.skills)],
      projects: parseProjects(sections.projects),
    },
  });
}

function normalizeExperience(item: any, index: number) {
  const duration = item.duration || {};
  return {
    id: item.id || `exp_${index + 1}`,
    jobTitle: item.jobTitle || item.position || item.role || item.title || '',
    company: item.company || item.organization || '',
    location: item.location || '',
    duration: {
      startDate: duration.startDate || item.startDate || '',
      endDate: duration.endDate || item.endDate || '',
      isCurrently: Boolean(duration.isCurrently || item.isCurrently || /present|current/i.test(duration.endDate || item.endDate || '')),
    },
    description: item.description || item.responsibilities || item.achievements || '',
  };
}

function normalizeEducation(item: any, index: number) {
  return {
    id: item.id || `edu_${index + 1}`,
    degree: item.degree || item.qualification || '',
    institution: item.institution || item.school || item.university || '',
    field: item.field || item.major || item.specialization || '',
    graduationDate: item.graduationDate || item.endDate || '',
    gpa: item.gpa || '',
  };
}

function normalizeProject(item: any, index: number) {
  return {
    id: item.id || `project_${index + 1}`,
    title: item.title || item.name || '',
    description: item.description || '',
    technologies: Array.isArray(item.technologies) ? item.technologies : item.technology ? [item.technology] : [],
    link: item.link || item.url || '',
  };
}

function hasResumeContent(item: any): boolean {
  return Object.values(item).some((value) => Array.isArray(value) ? value.length > 0 : value && typeof value === 'object' ? Object.values(value).some(Boolean) : Boolean(value));
}

function hasUsableExperience(items: any[]): boolean {
  return items.some((item) => item.jobTitle && (item.company || item.description || item.duration?.startDate));
}

function hasUsableProjects(items: any[]): boolean {
  return items.some((item) => item.title && (item.description || item.technologies?.length));
}

function splitResumeSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { experience: [], education: [], projects: [], skills: [], summary: [] };
  let current = 'summary';
  for (const line of lines) {
    const heading = line.replace(/[:\-]/g, '').trim().toLowerCase();
    if (/^(experience|work experience|employment|internships?|professional experience)$/.test(heading)) current = 'experience';
    else if (/^(education|academic background|qualifications)$/.test(heading)) current = 'education';
    else if (/^(projects?|personal projects|academic projects)$/.test(heading)) current = 'projects';
    else if (/^(skills?|technical skills|competencies|technologies)$/.test(heading)) current = 'skills';
    else if (/^(summary|profile|objective|about me)$/.test(heading)) current = 'summary';
    else sections[current].push(line);
  }
  return sections;
}

function parseExperience(lines: string[]): any[] {
  const entries: any[] = [];
  for (const line of lines) {
    if (/^[-*•]/.test(line) && entries.length) {
      entries[entries.length - 1].description = `${entries[entries.length - 1].description} ${line.replace(/^[-*•]\s*/, '')}`.trim();
      continue;
    }
    entries.push(createExperienceEntry(line, entries.length));
  }
  return entries;
}

function createExperienceEntry(line: string, index: number): any {
    const parts = line.split(/\s+\|\s+|\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
    const dates = line.match(/((?:19|20)\d{2}|[A-Z][a-z]{2,9}\s+(?:19|20)\d{2}).*?(present|current|(?:19|20)\d{2}|[A-Z][a-z]{2,9}\s+(?:19|20)\d{2})/i);
    return { id: `exp_${index + 1}`, jobTitle: parts[0] || line, company: parts[1] || '', duration: { startDate: dates?.[1] || '', endDate: dates?.[2] || '', isCurrently: /present|current/i.test(dates?.[2] || '') }, description: '' };
}

function parseEducation(lines: string[]): any[] {
  return parseEntries(lines, (line, index) => {
    const parts = line.split(/\s+\|\s+|\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
    return { id: `edu_${index + 1}`, degree: parts[0] || line, institution: parts[1] || '', field: '', graduationDate: line.match(/(?:19|20)\d{2}/)?.[0] || '' };
  });
}

function parseProjects(lines: string[]): any[] {
  return parseEntries(lines, (line, index) => {
    const parts = line.split(/\s+\|\s+/).map((part) => part.trim()).filter(Boolean);
    return { id: `project_${index + 1}`, title: parts[0] || line, description: parts.slice(1).join(' | '), technologies: extractSkills(line) };
  });
}

function parseEntries(lines: string[], createEntry: (line: string, index: number) => any): any[] {
  return lines.filter((line) => !/^[-*•]/.test(line) && line.length > 2).map((line, index) => createEntry(line.replace(/^[-*•]\s*/, ''), index));
}

function parseSkills(lines: string[]): string[] {
  return lines.flatMap((line) => line.split(/[,|•]/)).map((skill) => skill.trim()).filter((skill) => skill.length > 1);
}

function extractLocation(lines: string[]): string {
  return lines.find((line) => /\b(remote|[A-Za-z .'-]+,\s*[A-Z]{2,})\b/.test(line) && line.length < 80) || '';
}

function extractSummary(lines: string[], sections: Record<string, string[]>): string {
  return sections.summary.filter((line) => line !== lines[0]).slice(0, 3).join(' ');
}
