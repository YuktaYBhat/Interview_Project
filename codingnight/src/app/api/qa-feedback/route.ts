import { NextResponse } from 'next/server';
import { callGemini, parseGeminiJSON } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { draft, question, resumeContext } = await req.json();

    const prompt = `You are an expert interview coach. Evaluate this interview answer.

Question: "${question}"
Resume context: "${resumeContext || 'Not provided'}"

Candidate's answer:
"${draft}"

Respond with a JSON object (no markdown wrapping) with:
{
  "score": <number 0-100>,
  "positives": [<array of 2-3 specific strengths>],
  "improvements": [<array of 2-3 specific areas to improve>]
}

Be specific and constructive. Reference the STAR method. Score based on completeness, specificity, relevance to the question, and professional communication.`;

    const result = await callGemini(prompt);
    
    if (result.text) {
      const parsed = parseGeminiJSON<{ score: number; positives: string[]; improvements: string[] }>(result.text);
      if (parsed) {
        return NextResponse.json(parsed);
      }
    }

    // Heuristic fallback
    const textLength = draft?.length || 0;
    let score = 60;
    let positives: string[] = [];
    let improvements: string[] = [];

    if (textLength > 300) {
      score = 85;
      positives = [
        'Detailed response with good depth.',
        'Shows structured thinking.',
        'Provides context relevant to the question.',
      ];
      improvements = ['Could include more specific metrics or outcomes.'];
    } else if (textLength > 100) {
      score = 68;
      positives = ['Good starting point.', 'Addresses the question directly.'];
      improvements = [
        'Expand the Action and Result sections.',
        'Include a specific quantitative outcome.',
      ];
    } else {
      score = 40;
      positives = ['Shows initiative in practicing.'];
      improvements = [
        'Response is too brief for a comprehensive evaluation.',
        'Use the STAR method: Situation, Task, Action, Result.',
        'Aim for 200+ words for behavioral questions.',
      ];
    }

    return NextResponse.json({ score, positives, improvements });
  } catch (error) {
    console.error('QA feedback error:', error);
    return NextResponse.json({ error: 'Failed to analyze response' }, { status: 500 });
  }
}
