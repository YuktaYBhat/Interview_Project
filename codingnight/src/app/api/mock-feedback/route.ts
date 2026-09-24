import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { company, mode = 'company', jobDescription, resume, answers } = await request.json();
    if (!resume || !Array.isArray(answers) || answers.length === 0 || (mode === 'jd' && !jobDescription?.trim())) {
      return NextResponse.json({ success: false, error: 'Interview answers are required' }, { status: 400 });
    }
    const prompt = `Evaluate this ${mode === 'jd' ? 'JD-aligned' : 'company'} mock interview${company ? ` for ${company}` : ''}. Return only JSON: {"score":0,"strengths":[],"improvements":[],"perQuestion":[{"question":"","score":0,"feedback":""}]}.
${mode === 'jd' ? 'For JD MODE, score every answer against the exact job description requirements and resume evidence. Penalize answers that do not address the role.' : 'For COMPANY MODE, score company-theme relevance, behavioral structure, technical reasoning, and use of resume evidence. Do not penalize the candidate for a missing JD.'}
Job description: ${jobDescription || 'Not provided'}
Resume: ${JSON.stringify(resume.content).slice(0, 12000)}
Answers: ${JSON.stringify(answers).slice(0, 20000)}`;
    const result = await callGemini(prompt);
    const parsed = result.text ? parseGeminiJSON<any>(result.text) : null;
    if (parsed?.score !== undefined) return NextResponse.json({ success: true, data: parsed });
    return NextResponse.json({ success: true, data: fallbackScore(answers) });
  } catch (error) {
    console.error('Mock interview feedback error:', error);
    return NextResponse.json({ success: false, error: 'Could not score the interview' }, { status: 500 });
  }
}

function fallbackScore(answers: Array<{ question: string; answer: string }>) {
  const perQuestion = answers.map((item) => {
    const length = item.answer.trim().length;
    const score = length >= 350 ? 85 : length >= 180 ? 70 : length >= 80 ? 55 : 35;
    return { question: item.question, score, feedback: length >= 180 ? 'Good detail. Add measurable outcomes and clarify your individual contribution.' : 'Expand the answer with Situation, Task, Action, Result, and a concrete outcome.' };
  });
  const score = Math.round(perQuestion.reduce((sum, item) => sum + item.score, 0) / perQuestion.length);
  return { score, strengths: ['Completed the interview practice.', 'Addressed questions using personal context.'], improvements: ['Use specific metrics and outcomes.', 'Structure behavioral answers with STAR.'], perQuestion };
}
