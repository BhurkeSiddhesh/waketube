import { useEffect } from 'react';

/**
 * Hook to preload the YouTube IFrame API.
 * This ensures the API code is loaded and ready when an alarm triggers,
 * reducing the delay before the video starts playing.
 */
export const useYouTubePreloader = () => {
  useEffect(() => {
    // Check if the API is already loaded or being loaded
    if (
      (window as any).YT ||
      document.querySelector('script[src*="youtube.com/iframe_api"]')
    ) {
      return;
    }

    // Preload the API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);
};
