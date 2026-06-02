// Gemini API Integration Helper
// Uses Google Gemini API for all AI-powered features

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiResponse {
  text: string;
  error?: string;
}

export async function callGemini(prompt: string): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    // Fallback to intelligent heuristic when no API key
    return { text: '', error: 'NO_API_KEY' };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return { text: '', error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return { text: '', error: 'Network error' };
  }
}

// Helper to parse JSON from Gemini response (it sometimes wraps in markdown)
export function parseGeminiJSON<T>(text: string): T | null {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
