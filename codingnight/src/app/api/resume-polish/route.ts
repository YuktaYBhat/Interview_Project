import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { description, jobTitle } = await req.json();

    const prompt = `You are an expert resume writer. Polish the following job description for a "${jobTitle || 'Professional'}" role. 
Make it sound professional, use strong action verbs (Architected, Spearheaded, Orchestrated, Synthesized, etc.), include quantifiable achievements where possible, and ensure it would pass an ATS scanner while sounding genuinely human-written (not AI-generated).

Keep the same meaning but make it more impactful. Return ONLY the polished text, nothing else.

Original description:
"${description}"`;

    const result = await callGemini(prompt);

    if (result.text) {
      return NextResponse.json({ polished: result.text.trim() });
    }

    // Fallback heuristic when no API key
    let polished = description || '';
    const actionVerbs = ['Spearheaded', 'Architected', 'Orchestrated', 'Synthesized', 'Championed'];
    const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    
    if (polished.length > 20) {
      // Simple but effective transformation
      polished = polished
        .replace(/^Led\b/i, randomVerb)
        .replace(/^Managed\b/i, 'Orchestrated')
        .replace(/^Created\b/i, 'Architected')
        .replace(/^Helped\b/i, 'Facilitated')
        .replace(/^Worked on\b/i, 'Drove')
        .replace(/^Built\b/i, 'Engineered');
      
      if (!polished.match(/\d+%|\d+ /)) {
        polished += ' Drove measurable improvements in key performance metrics.';
      }
    }

    return NextResponse.json({ polished });
  } catch (error) {
    console.error('Resume polish error:', error);
    return NextResponse.json({ error: 'Failed to polish resume' }, { status: 500 });
  }
}
