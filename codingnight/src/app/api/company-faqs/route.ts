import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, resume, jobDescription, company } = await request.json();

    if (!resume || !company) {
      return NextResponse.json(
        { success: false, error: 'Resume and company are required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert interview coach for top tech companies. 
Based on the following candidate resume and the target job description, generate a list of 5-7 realistic, frequently asked interview questions (FAQs) specifically for "${company}".

Resume Summary:
${buildResumeSummary(resume)}

Job Description:
${jobDescription || 'Not provided'}

Make sure the questions reflect "${company}"'s specific interview style (e.g. Amazon's Leadership Principles, Google's Googlyness/System Design, Meta's execution focus, etc.) combined with the candidate's actual experience and the JD.

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
        return NextResponse.json({
          success: true,
          data: { company, faqs: parsed, generatedAt: new Date() },
        });
      }
    }

    // Fallback heuristic if Gemini parsing fails or no key
    const faqs = [
      {
        id: `faq_${Date.now()}_1`,
        question: `Why do you want to work at ${company}, and how does your background align with our mission?`,
        strategy: `Research ${company}'s core values and connect them to specific items in your resume.`,
        category: "behavioral",
      },
      {
        id: `faq_${Date.now()}_2`,
        question: `Tell me about a time you had to pivot your technical approach midway through a project.`,
        strategy: "Use the STAR method, focusing on flexibility and evaluating trade-offs.",
        category: "behavioral",
      },
      {
        id: `faq_${Date.now()}_3`,
        question: `How would you design a system at ${company} scale for the role described in the job description?`,
        strategy: "Focus on scalability, fault tolerance, and bottlenecks. Draw from your most complex project.",
        category: "system-design",
      }
    ];

    return NextResponse.json({
      success: true,
      data: { company, faqs, generatedAt: new Date() },
    });
  } catch (error) {
    console.error('Company FAQs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
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
