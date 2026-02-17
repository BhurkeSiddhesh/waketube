import { GoogleGenAI } from "@google/genai";

interface YouTubeSearchResult {
  title: string;
  url: string;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async searchYouTube(query: string): Promise<YouTubeSearchResult | null> {
    if (!this.client) {
      console.warn("Gemini Service: No API Key provided.");
      return null;
    }

    try {
      const response = await this.client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: query,
        config: {
            systemInstruction: "You are a DJ and music expert. I need you to find a YouTube video that matches the user description. Return JSON: {title, url}."
        }
      });

      const responseText = response.text as string;

      if (!responseText) {
        return null;
      }

      // Simple cleanup if the model adds markdown code blocks despite instructions
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const data = JSON.parse(cleanJson);
        if (data.title && data.url) {
          return {
            title: data.title,
            url: data.url
          };
        }
      } catch (parseError) {
        console.error("Gemini Service: Failed to parse JSON response", parseError);
      }

      return null;

    } catch (error) {
      console.error("Gemini Service: Search failed", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
