import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Use import.meta.env for Vite compatibility, fallback to process.env if defined via config
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestMusicVideo = async (query: string): Promise<{ url: string; title: string } | null> => {
  try {
    const client = getClient();
    if (!client) {
      console.warn("No Gemini API Key found. AI features are disabled.");
      return null;
    }
    
    // We use search grounding to find a real YouTube link
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find a valid YouTube video URL for the following request: "${query}". 
      Return ONLY the raw YouTube URL. If you find a specific title, mention it briefly after the URL on a new line.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for this
      },
    });

    const text = response.text || "";
    
    // Simple regex to extract youtube link
    const urlMatch = text.match(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+|https?:\/\/youtu\.be\/[\w-]+)/);
    
    if (urlMatch) {
      const url = urlMatch[0];
      // Try to extract title from remaining text or grounding metadata if possible, 
      // but for now, we'll just use the user's query as a fallback title if the model doesn't output one clearly.
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const titleLine = lines.find(l => !l.includes(url)) || query;
      
      return {
        url,
        title: titleLine.replace(/^[-: ]+/, '').trim()
      };
    }
    
    // Fallback: Check grounding chunks directly if the text didn't explicitly output a clean URL
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.web?.uri && (chunk.web.uri.includes('youtube.com') || chunk.web.uri.includes('youtu.be'))) {
          return {
            url: chunk.web.uri,
            title: chunk.web.title || query
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return null;
  }
};