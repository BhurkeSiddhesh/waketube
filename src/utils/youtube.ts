/**
 * Checks if a URL is a valid YouTube URL (strict hostname check).
 */
export function isValidYouTubeUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        // Allow valid YouTube domains
        const validDomains = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'];
        return validDomains.includes(hostname);
    } catch {
        return false;
    }
}

/**
 * Fetches YouTube video title using the oEmbed API.
 * @param url - A valid YouTube video URL.
 * @returns The video title, or null if the fetch fails.
 */
export async function fetchYouTubeTitle(url: string): Promise<string | null> {
    if (!isValidYouTubeUrl(url)) {
        return null;
    }

    try {
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
    if (!isValidYouTubeUrl(url)) {
        return null;
    }

    try {
        const urlObj = new URL(url);

        // Handle youtu.be/VIDEO_ID
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }

        // Handle youtube.com/watch?v=VIDEO_ID (and m.youtube.com, music.youtube.com)
        const vParam = urlObj.searchParams.get('v');
        if (vParam) {
            return vParam;
        }

        // Handle youtube.com/embed/VIDEO_ID
        if (urlObj.pathname.startsWith('/embed/')) {
            return urlObj.pathname.split('/')[2];
        }

        // Handle youtube.com/v/VIDEO_ID
        if (urlObj.pathname.startsWith('/v/')) {
            return urlObj.pathname.split('/')[2];
        }

        return null;
    } catch {
        return null;
    }
}
