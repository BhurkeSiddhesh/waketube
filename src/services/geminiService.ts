import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Use import.meta.env for Vite compatibility, fallback to process.env if defined via config
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const searchYouTubeVideos = async (query: string): Promise<{ url: string; title: string }[]> => {
  try {
    const client = getClient();
    if (!client) {
      console.warn("No Gemini API Key found. AI features are disabled.");
      return [];
    }

    // We use search grounding to find real YouTube links
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash", // Use 1.5-flash for speed and grounding accuracy
      contents: `Find 5 different valid YouTube video URLs for the following request: "${query}". 
      Return a list of URLs followed by their titles. Format: 
      - [URL] | [TITLE]`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const results: { url: string; title: string }[] = [];

    // Extract results from text
    const lines = text.split('\n').filter(l => l.includes('youtube.com') || l.includes('youtu.be'));

    for (const line of lines) {
      const urlMatch = line.match(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+|https?:\/\/youtu\.be\/[\w-]+)/);
      if (urlMatch) {
        const url = urlMatch[0];
        let title = line.split('|')[1]?.trim() || line.replace(url, '').replace(/^[-[\] ]+/, '').trim();

        // Cleanup title
        title = title.replace(/^\|/, '').trim();

        if (!title) {
          // Try to find title in grounding metadata
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const matchingChunk = chunks?.find(c => c.web?.uri === url);
          title = matchingChunk?.web?.title || query;
        }

        if (!results.some(r => r.url === url)) {
          results.push({ url, title });
        }
      }
    }

    // Fallback: Check grounding chunks directly if text didn't yield enough
    if (results.length < 3) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        for (const chunk of chunks) {
          if (chunk.web?.uri && (chunk.web.uri.includes('youtube.com') || chunk.web.uri.includes('youtu.be'))) {
            const url = chunk.web.uri;
            if (!results.some(r => r.url === url)) {
              results.push({
                url: url,
                title: chunk.web.title || query
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};

export const suggestMusicVideo = async (query: string): Promise<{ url: string; title: string } | null> => {
  const results = await searchYouTubeVideos(query);
  return results.length > 0 ? results[0] : null;
};