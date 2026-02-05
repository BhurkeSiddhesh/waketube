import { describe, it, expect } from 'vitest';
import { extractVideoId, isValidYouTubeUrl } from './youtube';

describe('YouTube Utils Security', () => {
  describe('isValidYouTubeUrl', () => {
    it('should validate youtube.com', () => {
        expect(isValidYouTubeUrl('https://youtube.com/watch?v=123')).toBe(true);
    });
    it('should validate www.youtube.com', () => {
        expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=123')).toBe(true);
    });
    it('should validate youtu.be', () => {
        expect(isValidYouTubeUrl('https://youtu.be/123')).toBe(true);
    });
    it('should validate m.youtube.com', () => {
        expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=123')).toBe(true);
    });
    it('should reject fakeyoutube.com', () => {
        expect(isValidYouTubeUrl('https://fakeyoutube.com/watch?v=123')).toBe(false);
    });
    it('should reject evil.com', () => {
        expect(isValidYouTubeUrl('https://evil.com/youtube.com')).toBe(false);
    });
    it('should reject malformed URLs', () => {
        expect(isValidYouTubeUrl('not-a-url')).toBe(false);
    });
  });

  describe('extractVideoId', () => {
    it('should extract ID from valid youtube.com URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from valid youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from v URL', () => {
      const url = 'https://youtube.com/v/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should NOT extract ID from fakeyoutube.com', () => {
      const url = 'https://fakeyoutube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBeNull();
    });

    it('should NOT extract ID from evil.com/youtube.com', () => {
      const url = 'https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBeNull();
    });
  });
});
