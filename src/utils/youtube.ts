/**
 * Fetches YouTube video title using the oEmbed API.
 * @param url - A valid YouTube video URL.
 * @returns The video title, or null if the fetch fails.
 */
export async function fetchYouTubeTitle(url: string): Promise<string | null> {
    try {
        // Validate that it looks like a YouTube URL
        if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
            return null;
        }

        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oEmbedUrl);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.title || null;
    } catch {
        return null;
    }
}

/**
 * Extracts the video ID from a YouTube URL.
 * Supports youtube.com/watch?v= and youtu.be/ formats.
 */
export function extractVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url);

        // Handle youtube.com/watch?v=VIDEO_ID
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }

        // Handle youtu.be/VIDEO_ID
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }

        return null;
    } catch {
        return null;
    }
}
