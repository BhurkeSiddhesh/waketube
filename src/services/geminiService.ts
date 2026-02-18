export interface YouTubeSearchResult {
  title: string;
  url: string;
}

export class GeminiService {
  isAvailable(): boolean {
    return false;
  }

  async searchYouTube(_query: string): Promise<YouTubeSearchResult | null> {
    console.warn("Gemini Service: disabled (no Gemini client configured).");
    return null;
  }
}

export const geminiService = new GeminiService();
