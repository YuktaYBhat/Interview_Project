import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';
import { extractSkills } from '@/lib/resume-analysis';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, resume, jobDescription, company, mode = 'company', excludeQuestions = [] } = await request.json();

    if (!resume || (mode === 'company' && !company) || (mode === 'jd' && !jobDescription?.trim())) {
      return NextResponse.json(
        { success: false, error: 'Resume and company are required' },
        { status: 400 }
      );
    }

    const hasJobDescription = Boolean(jobDescription?.trim());
    const prompt = `You are an expert interview coach. Generate 6 realistic interview questions that have not appeared in the excluded list.

Resume Summary:
${buildResumeSummary(resume)}

Job Description:
${jobDescription || 'Not provided. Ask popular company-specific questions based on publicly known interview themes and the candidate resume.'}

${mode === 'jd'
  ? `JD MODE: Every question must be traceable to a responsibility, skill, seniority signal, or requirement in the job description. Include technical questions about JD technologies and at least two behavioral questions tied to the role. Do not ask generic company questions.`
  : `COMPANY MODE: Do not use the job description as the primary source. Ask ${company}-specific questions based on widely known interview themes, while tailoring examples to the resume. Include behavioral questions.`}

Excluded questions from earlier sessions:
${Array.isArray(excludeQuestions) && excludeQuestions.length ? excludeQuestions.join('\n') : 'None'}

Provide a tailored "suggested answer strategies" for each question.

Return a JSON array (no markdown wrapping) of objects with this structure:
[
  {
    "id": "faq_1",
    "question": "The specific question tailored to the company and candidate",
    "strategy": "A brief tip or strategy for answering it using the STAR framework or company values",
    "category": "behavioral | technical | system-design | leadership"
  }
]`;

    const result = await callGemini(prompt);
    
    if (result.text) {
      const parsed = parseGeminiJSON<any[]>(result.text);
      if (parsed && Array.isArray(parsed)) {
        const questions = removeExcludedQuestions(parsed, excludeQuestions).slice(0, 7);
        if (!questions.length) return NextResponse.json({ success: false, error: 'No new questions were generated. Please try again.' }, { status: 409 });
        return NextResponse.json({
          success: true,
          data: { company: company || 'Target role', mode, faqs: questions, generatedAt: new Date() },
        });
      }
    }

    // Fallback heuristic if Gemini parsing fails or no key
    const companyFocus: Record<string, string> = {
      Amazon: 'Which Amazon Leadership Principle best describes a difficult decision you made, and what was the measurable result?',
      Google: 'How would you improve the scalability, reliability, and user impact of a system you built?',
      Microsoft: 'Tell us how you collaborate across teams to deliver a customer-focused technical solution.',
      Meta: 'Describe a fast product or engineering decision you made using data and how you measured success.',
      Apple: 'How did you protect quality and user experience while working under a demanding delivery timeline?',
      Netflix: 'How have you used ownership and judgment to make a high-impact decision with limited direction?',
    };
    const companyFaqs = [
      {
        id: `faq_${Date.now()}_1`,
        question: mode === 'jd' ? 'Which responsibility in this job description best matches your experience, and what result did you achieve?' : companyFocus[company] || `How does your background align with the ${company} role and its job requirements?`,
        strategy: mode === 'jd' ? 'Use a resume example and connect your actions and measurable result to the JD requirement.' : `Research ${company}'s core values and connect them to specific items in your resume.`,
        category: "behavioral",
      },
      {
        id: `faq_${Date.now()}_2`,
        question: mode === 'jd' ? 'Which project from your resume best demonstrates the skills required for this role? What trade-offs did you make?' : `Tell me about a project from your resume that best matches the target ${company} role. What trade-offs did you make?`,
        strategy: "Use the STAR method, focusing on flexibility and evaluating trade-offs.",
        category: "behavioral",
      },
      {
        id: `faq_${Date.now()}_3`,
        question: mode === 'jd' ? 'How would you approach the most important technical problem described in this job description?' : `What would you improve first in a system or product relevant to this ${company} role, and why?`,
        strategy: "Focus on scalability, fault tolerance, and bottlenecks. Draw from your most complex project.",
        category: "system-design",
      }
    ];
    const jdSkills = extractSkills(jobDescription || '').slice(0, 4);
    const jdFaqs = [
      ...jdSkills.map((skill, index) => ({
        id: `jd_faq_${Date.now()}_${index}`,
        question: `This role requires ${skill}. Describe how you used ${skill} in a real project and the result you achieved.`,
        strategy: `Use a specific resume example, explain your technical decisions, and quantify the outcome.`,
        category: 'technical',
      })),
      {
        id: `jd_faq_${Date.now()}_behavioral`,
        question: 'Tell me about a time you handled a difficult responsibility from a similar role. What did you do and what was the outcome?',
        strategy: 'Answer with Situation, Task, Action, and Result, connecting the example to this job description.',
        category: 'behavioral',
      },
      {
        id: `jd_faq_${Date.now()}_tradeoff`,
        question: 'Which requirement in this job description would be most challenging for you, and how would you close that gap?',
        strategy: 'Be honest, then give a concrete learning or delivery plan supported by your resume.',
        category: 'situational',
      },
    ];
    const fallbackPool = mode === 'jd' ? jdFaqs : companyFaqs;
    const availableFaqs = removeExcludedQuestions(fallbackPool, excludeQuestions);
    const fallbackFaqs = availableFaqs.length ? availableFaqs : fallbackPool;

    return NextResponse.json({
      success: true,
      data: { company: company || 'Target role', mode, faqs: fallbackFaqs, generatedAt: new Date() },
    });
  } catch (error) {
    console.error('Company FAQs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function removeExcludedQuestions(questions: any[], excluded: unknown): any[] {
  const excludedSet = new Set(
    (Array.isArray(excluded) ? excluded : [])
      .filter((question): question is string => typeof question === 'string')
      .map(normalizeQuestion),
  );
  return questions.filter((question) => typeof question?.question === 'string' && !excludedSet.has(normalizeQuestion(question.question)));
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildResumeSummary(resume: any): string {
  const c = resume?.content;
  if (!c) return '';
  let text = '';
  if (c.personalInfo?.fullName) text += `Name: ${c.personalInfo.fullName}\n`;
  if (c.experience?.length) {
    text += 'Experience:\n';
    c.experience.forEach((e: any) => {
      text += `- ${e.jobTitle} at ${e.company}\n  ${e.description}\n`;
    });
  }
  if (c.skills?.length) text += `Skills: ${c.skills.join(', ')}\n`;
  return text;
}
