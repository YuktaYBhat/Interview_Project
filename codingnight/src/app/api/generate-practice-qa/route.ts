import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'EVALUATE_RESPONSE') return evaluateResponse(body);
    if (body.action !== 'GENERATE_QUESTIONS') return NextResponse.json({ success: false, error: 'A valid action is required' }, { status: 400 });
    if (!body.resumeText) return NextResponse.json({ success: false, error: 'Resume text is required' }, { status: 400 });

    const previousQuestions = Array.isArray(body.previousQuestions) ? body.previousQuestions : [];
    const prompt = `You are Cognitive Architect's Lead Technical Interviewer.
Generate exactly 5 distinct, candidate-specific practice interview questions.

Candidate Resume Text:
${String(body.resumeText).slice(0, 16000)}

Job Description:
${String(body.jobDescription || 'Infer the role from the resume.').slice(0, 12000)}

Target Company / Role: ${body.companyName || 'Target role'}
Exclude Previously Generated Questions:
${previousQuestions.length ? previousQuestions.join('\n') : 'None'}
Session Random Seed: ${body.randomSeed || Date.now()}

Use five distinct categories from: System Architecture, Technical Deep-Dive, Problem Solving & Algorithmic, Behavioral/STAR, Skill Gap/JD Requirement, Role-Specific Scenarios.
Do not repeat or closely paraphrase excluded questions. Reference specific resume tools, projects, achievements, and JD requirements. Never output broken placeholders such as "at .".

Return only JSON in this shape:
{"questions":[{"id":"q1","category":"Category Name","question":"Question text","keyFocus":"What this evaluates"}]}`;
    const result = await callGemini(prompt);
    const parsed = result.text ? parseGeminiJSON<{ questions?: any[] }>(result.text) : null;
    const excluded = new Set(previousQuestions.map((question: unknown) => normalizeQuestion(question)));
    const questions = uniqueQuestions(parsed?.questions || []).filter((question) => !excluded.has(normalizeQuestion(question.question))).slice(0, 5);
    return NextResponse.json({ success: true, data: { questions: questions.length === 5 ? questions : fallbackQuestions(body, previousQuestions), generatedAt: new Date() } });
  } catch (error) {
    console.error('Practice Q&A generation error:', error);
    return NextResponse.json({ success: false, error: 'Could not generate practice questions' }, { status: 500 });
  }
}

async function evaluateResponse(body: any) {
  const draft = typeof body.userDraftAnswer === 'string' ? body.userDraftAnswer.trim() : '';
  if (draft.split(/\s+/).filter(Boolean).length < 15) return NextResponse.json({ is_valid: false, feedback: 'Your response appears too brief or off-topic. Please provide a clear answer using the STAR method (Situation, Task, Action, Result).' });
  const prompt = `You are Cognitive Architect's Lead Technical Interviewer evaluating a draft response.
Question Asked: ${String(body.questionText || '').slice(0, 4000)}
Candidate Draft Answer: ${draft.slice(0, 12000)}

Evaluate relevance and accuracy, identify Situation, Task, Action, and Result, name strengths and actionable improvements, and provide an upgraded sample answer. Return only JSON:
{"is_valid":true,"relevance_score":"8/10","star_breakdown":{"situation":"Present / Missing","task":"Present / Missing","action":"Present / Missing","result":"Present / Missing"},"feedback":"Detailed feedback","improved_sample_answer":"Model STAR response"}`;
  const result = await callGemini(prompt);
  const parsed = result.text ? parseGeminiJSON<any>(result.text) : null;
  return NextResponse.json(parsed?.is_valid !== undefined ? parsed : fallbackEvaluation(draft));
}

function uniqueQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const text = typeof question?.question === 'string' ? question.question.trim() : '';
    const key = text.toLowerCase().replace(/\s+/g, ' ');
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((question, index) => ({ ...question, id: question.id || `q${index + 1}` }));
}

function fallbackQuestions(body: any, previous: string[]): any[] {
  const resume = String(body.resumeText || '');
  const role = String(body.companyName || 'this role');
  let resumeContent: any = null;
  try { resumeContent = JSON.parse(resume)?.content || JSON.parse(resume); } catch { resumeContent = null; }
  const project = resumeContent?.projects?.find((item: any) => item?.title)?.title || 'your most relevant project';
  const bank = [
    ['System Architecture', 'Architecture and trade-offs', [
      `Walk through the architecture of ${project} and explain the most important trade-off you made.`,
      `What are the main components of ${project}, how do they communicate, and where would you improve the design?`,
      `How would you redesign ${project} to handle ten times its current traffic?`,
      `What failure point would you expect first in ${project}, and how would you make it resilient?`,
      `Explain how you would separate the frontend, backend, data, and authentication boundaries in ${project}.`,
    ]],
    ['Technical Deep-Dive', 'Technical depth', [
      `Which technical decision in your background best demonstrates readiness for ${role}, and how would you validate it in production?`,
      `Choose one technical decision from your background and explain the alternatives you considered before selecting it for ${role}.`,
      `Which tool or framework in your resume would you defend most strongly in a code review, and why?`,
      `Explain one security, validation, or data-integrity decision you made and the risk it addressed.`,
      `What would you monitor after deploying your most important project, and what would each signal tell you?`,
    ]],
    ['Problem Solving & Algorithmic', 'Problem-solving method', [
      'Describe a difficult technical problem you solved, including how you narrowed the search space and measured the result.',
      'How did you isolate the root cause of a difficult technical issue, and what evidence confirmed your solution?',
      'Tell me about a performance problem you investigated and how you decided which optimization to try first.',
      'Describe a time when your first debugging hypothesis was wrong. How did you adapt?',
      'How would you break an ambiguous engineering requirement into testable steps?',
    ]],
    ['Behavioral/STAR', 'Collaboration and ownership', [
      'Tell me about a time you disagreed with a teammate on an implementation. What did you do and what happened?',
      'Describe a time you had to change your implementation after receiving critical feedback from a teammate.',
      'Tell me about a delivery deadline you had to meet with limited time or resources. What was the result?',
      'Describe a time you took ownership of a problem that was not clearly assigned to you.',
      'Tell me about a mistake in a project and how you communicated and corrected it.',
    ]],
    ['Skill Gap/JD Requirement', 'Self-awareness and learning', [
      `Which requirement for ${role} is the biggest stretch for you, and what concrete plan would you use to close the gap?`,
      `What is one ${role} requirement you are actively improving, and what evidence will show that you have closed the gap?`,
      `Which skill from the job description would you learn first in your first 30 days, and how would you practice it?`,
      `Where does your experience most closely match this role, and where would you need support at the start?`,
      `How would you transfer your existing project experience to a new technical domain in ${role}?`,
    ]],
  ] as Array<[string, string, string[]]>;
  const excluded = new Set(previous.map(normalizeQuestion));
  const seed = Number(body.randomSeed) || Date.now();
  return bank.map(([category, keyFocus, variants], index) => {
    const start = Math.abs(seed + previous.length + index * 7) % variants.length;
    const question = variants.find((_, offset) => !excluded.has(normalizeQuestion(variants[(start + offset) % variants.length]))) || variants[start];
    return { id: `q${index + 1}`, category, question, keyFocus };
  });
}

function normalizeQuestion(question: unknown): string { return String(question || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

function fallbackEvaluation(draft: string) {
  const has = (terms: string[]) => terms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(draft));
  return { is_valid: true, relevance_score: draft.length > 500 ? '8/10' : '6/10', star_breakdown: { situation: has(['when', 'during', 'context']) ? 'Present' : 'Missing', task: has(['responsible', 'needed', 'goal']) ? 'Present' : 'Missing', action: has(['I ', 'implemented', 'created', 'led']) ? 'Present' : 'Missing', result: has(['result', 'increased', 'reduced', 'improved', '%']) ? 'Present' : 'Missing' }, feedback: 'Your answer is relevant enough to evaluate. Add explicit STAR transitions and measurable outcomes.', improved_sample_answer: `${draft}\n\nStrengthen this response by stating the situation, task, actions you personally took, and measurable result.` };
}