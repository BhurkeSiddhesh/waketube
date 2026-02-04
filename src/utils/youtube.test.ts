import { describe, it, expect } from 'vitest';
import { extractVideoId, isValidYouTubeUrl } from './youtube';

describe('YouTube Utils', () => {
  describe('extractVideoId', () => {
    it('should extract ID from valid standard URL', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from valid short URL', () => {
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid hostnames (strict check)', () => {
      // These currently PASS in the loose implementation, but we want them to FAIL (return null)
      expect(extractVideoId('https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
      expect(extractVideoId('https://fake-youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
      expect(extractVideoId('https://my-youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    });

    it('should return null for non-YouTube URLs', () => {
      expect(extractVideoId('https://google.com')).toBeNull();
    });
  });

  describe('isValidYouTubeUrl', () => {
    // This function doesn't exist yet, but we'll add it.
    // We can comment this out or leave it to fail compilation if we were running tsc,
    // but vitest will fail at runtime.

    it('should return true for valid URLs', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for invalid hostnames', () => {
      expect(isValidYouTubeUrl('https://evil.com/youtube.com/watch')).toBe(false);
      expect(isValidYouTubeUrl('https://fake-youtube.com/watch')).toBe(false);
      expect(isValidYouTubeUrl('https://youtube.com.evil.com/watch')).toBe(false);
    });
  });
});
