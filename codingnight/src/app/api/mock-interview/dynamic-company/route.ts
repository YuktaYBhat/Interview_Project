import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { targetCompany, jobDescriptionText, resumeText } = await request.json();
    if (!String(targetCompany || '').trim() || !resumeText) return NextResponse.json({ success: false, error: 'Company and resume are required' }, { status: 400 });
    const prompt = `You are an Executive Technical Interviewer specializing in interviewing candidates for ${targetCompany}.
Target Company: ${targetCompany}
Job Description: ${String(jobDescriptionText || 'Not provided').slice(0, 12000)}
Candidate Resume: ${String(resumeText).slice(0, 16000)}

Deduce the company's primary domain and use well-known domain, technical, leadership, and collaboration themes without inventing confidential facts. Generate exactly 5 questions:
1. Background and fit with a resume project
2. Core technical requirement from the job description
3. Domain-specific real-world technical challenge
4. Behavioral or leadership STAR question
5. Company alignment and skill-gap bridge

Return only JSON:
{"company":"${targetCompany}","industryFocus":"Deduced domain","questions":[{"questionNumber":1,"type":"Project Architecture / Technical Fit","question":"Question text","evaluationCriteria":"What a top response must include"}]}`;
    const result = await callGemini(prompt);
    const parsed = result.text ? parseGeminiJSON<any>(result.text) : null;
    const questions = Array.isArray(parsed?.questions) ? parsed.questions.slice(0, 5) : fallbackQuestions(targetCompany, jobDescriptionText);
    const faqs = questions.map((question: any, index: number) => ({ id: `dynamic_${Date.now()}_${index}`, question: question.question, strategy: question.evaluationCriteria, category: categoryFor(question.type) }));
    return NextResponse.json({ success: true, data: { company: targetCompany, industryFocus: parsed?.industryFocus || 'Role-specific technical domain', questions, faqs, generatedAt: new Date() } });
  } catch (error) {
    console.error('Dynamic company interview error:', error);
    return NextResponse.json({ success: false, error: 'Could not generate the company interview' }, { status: 500 });
  }
}

function categoryFor(type: string): string { return /behavior|leadership/i.test(type) ? 'behavioral' : /technical|architecture|domain/i.test(type) ? 'technical' : 'situational'; }
function fallbackQuestions(company: string, jobDescription: string): any[] { return [
  { questionNumber: 1, type: 'Project Architecture / Technical Fit', question: `Which project best prepares you for a role at ${company}, and what architecture decisions did you make?`, evaluationCriteria: 'Specific project context, decisions, trade-offs, and outcome.' },
  { questionNumber: 2, type: 'Core Technical', question: `Which technical requirement in this role would you demonstrate first, and how?`, evaluationCriteria: `Connect a concrete resume example to the job description: ${String(jobDescription || 'the role').slice(0, 180)}.` },
  { questionNumber: 3, type: 'Domain Technical Challenge', question: `Describe how you would investigate a production issue affecting a system relevant to ${company}.`, evaluationCriteria: 'Structured diagnosis, safe mitigation, observability, and prevention.' },
  { questionNumber: 4, type: 'Behavioral / Leadership', question: 'Tell me about a time you resolved a disagreement while delivering under pressure.', evaluationCriteria: 'Clear STAR structure, collaboration, ownership, and result.' },
  { questionNumber: 5, type: 'Company Alignment', question: `Why ${company}, and how would you close any skill gap in your first 90 days?`, evaluationCriteria: 'Specific motivation, honest gap, and concrete learning plan.' },
] as any[]; }