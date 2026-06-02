import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/types';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, resume } = await request.json();

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Try Gemini first
    const resumeSummary = buildResumeSummary(resume);
    const prompt = `You are an expert interview coach. Generate 7-9 tailored interview questions based on this resume.

Resume:
${resumeSummary}

Generate a mix of behavioral, technical, leadership, and situational questions. Each question should directly reference specific details from the resume.

Return a JSON array (no markdown wrapping) with objects like:
[
  {
    "id": "q_1",
    "category": "behavioral" | "technical" | "leadership" | "situational",
    "priority": "high" | "medium" | "low",
    "text": "the interview question",
    "suggestedLength": "2-3 minutes",
    "resumeContext": "what part of the resume this relates to"
  }
]

Make questions specific to this person's actual experience, not generic.`;

    const result = await callGemini(prompt);
    if (result.text) {
      const parsed = parseGeminiJSON<Question[]>(result.text);
      if (parsed && Array.isArray(parsed)) {
        return NextResponse.json({
          success: true,
          data: { resumeId, questions: parsed, generatedAt: new Date() },
        });
      }
    }

    // Fallback: generate heuristic questions
    const questions = generateQuestionsFromResume(resume);
    return NextResponse.json({
      success: true,
      data: { resumeId, questions, generatedAt: new Date() },
    });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildResumeSummary(resume: any): string {
  const c = resume.content;
  let text = '';
  if (c.personalInfo?.fullName) text += `Name: ${c.personalInfo.fullName}\n`;
  if (c.personalInfo?.summary) text += `Summary: ${c.personalInfo.summary}\n`;
  if (c.experience?.length) {
    text += '\nExperience:\n';
    c.experience.forEach((e: any) => {
      text += `- ${e.jobTitle} at ${e.company} (${e.duration?.startDate} - ${e.duration?.isCurrently ? 'Present' : e.duration?.endDate})\n  ${e.description}\n`;
    });
  }
  if (c.education?.length) {
    text += '\nEducation:\n';
    c.education.forEach((e: any) => {
      text += `- ${e.degree} in ${e.field} from ${e.institution}\n`;
    });
  }
  if (c.skills?.length) text += `\nSkills: ${c.skills.join(', ')}\n`;
  if (c.projects?.length) {
    text += '\nProjects:\n';
    c.projects.forEach((p: any) => {
      text += `- ${p.title}: ${p.description} (Tech: ${p.technologies?.join(', ') || 'N/A'})\n`;
    });
  }
  return text;
}

function generateQuestionsFromResume(resume: any): Question[] {
  const questions: Question[] = [];
  const { experience, skills, projects } = resume.content;

  if (experience?.length > 0) {
    questions.push({
      id: `q_${Date.now()}_1`,
      category: 'behavioral',
      priority: 'high',
      text: `Tell me about your experience as a ${experience[0].jobTitle} at ${experience[0].company}. What were your key responsibilities and achievements?`,
      suggestedLength: '2-3 minutes',
      resumeContext: `${experience[0].jobTitle} at ${experience[0].company}`,
    });

    if (experience.length > 1) {
      questions.push({
        id: `q_${Date.now()}_2`,
        category: 'behavioral',
        priority: 'high',
        text: `Describe how your career progressed from ${experience[experience.length - 1].jobTitle} to ${experience[0].jobTitle}. What skills did you develop?`,
        suggestedLength: '2 minutes',
        resumeContext: 'Career progression',
      });
    }

    questions.push({
      id: `q_${Date.now()}_3`,
      category: 'behavioral',
      priority: 'medium',
      text: `Based on your work at ${experience[0].company}, describe a challenging project and how you overcame obstacles.`,
      suggestedLength: '2-3 minutes',
      resumeContext: experience[0].description?.substring(0, 100),
    });
  }

  if (skills?.length > 0) {
    questions.push({
      id: `q_${Date.now()}_4`,
      category: 'technical',
      priority: 'high',
      text: `Walk us through your experience with ${skills[0]}. Can you describe a specific problem you solved using it?`,
      suggestedLength: '2-3 minutes',
      resumeContext: `Skill: ${skills[0]}`,
    });

    if (skills.length > 2) {
      questions.push({
        id: `q_${Date.now()}_5`,
        category: 'technical',
        priority: 'medium',
        text: `How would you compare ${skills[0]} and ${skills[1]}? When would you choose one over the other?`,
        suggestedLength: '2 minutes',
        resumeContext: `Skills: ${skills[0]}, ${skills[1]}`,
      });
    }
  }

  if (experience?.some((exp: any) => /lead|manager|senior|head|director/i.test(exp.jobTitle))) {
    questions.push({
      id: `q_${Date.now()}_6`,
      category: 'leadership',
      priority: 'medium',
      text: 'Tell me about a time you led a team through a difficult situation. What was the outcome?',
      suggestedLength: '2-3 minutes',
      resumeContext: 'Leadership experience',
    });
  }

  if (projects?.length > 0) {
    questions.push({
      id: `q_${Date.now()}_7`,
      category: 'technical',
      priority: 'high',
      text: `Tell me about ${projects[0].title}. What problem did it solve and what was the architecture?`,
      suggestedLength: '3 minutes',
      resumeContext: `${projects[0].title}: ${projects[0].description?.substring(0, 80)}`,
    });
  }

  questions.push({
    id: `q_${Date.now()}_8`,
    category: 'situational',
    priority: 'medium',
    text: 'If you discovered a critical bug in production right before a major release, how would you handle it?',
    suggestedLength: '2 minutes',
    resumeContext: 'Problem-solving approach',
  });

  questions.push({
    id: `q_${Date.now()}_9`,
    category: 'situational',
    priority: 'medium',
    text: 'How do you stay current with new technologies and industry trends in your field?',
    suggestedLength: '1-2 minutes',
    resumeContext: 'Continuous learning',
  });

  return questions;
}
