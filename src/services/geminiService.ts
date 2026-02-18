export interface YouTubeSearchResult {
  title: string;
  url: string;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const SYSTEM_PROMPT = 'You are a DJ and music expert. I need you to find a YouTube video that matches the user description. Return JSON exactly in this format: {"title":"...","url":"..."}.';

const isAllowedYouTubeUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();
    return hostname === 'youtu.be' || hostname === 'www.youtube.com' || hostname.endsWith('.youtube.com');
  } catch {
    return false;
  }
};

export class GeminiService {
  private apiKey: string | null;

  constructor() {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    this.apiKey = typeof key === 'string' && key.trim() ? key.trim() : null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async searchYouTube(query: string): Promise<YouTubeSearchResult | null> {
    if (!this.apiKey) {
      console.warn('Gemini Service: No API key provided.');
      return null;
    }

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(this.apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              parts: [{ text: query }],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('Gemini Service: API request failed', response.status);
        return null;
      }

      const payload = (await response.json()) as GeminiApiResponse;
      const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as Partial<YouTubeSearchResult>;

      if (!parsed.title || !parsed.url || !isAllowedYouTubeUrl(parsed.url)) {
        return null;
      }

      return {
        title: parsed.title,
        url: parsed.url,
      };
    } catch (error) {
      console.error('Gemini Service: Search failed', error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
