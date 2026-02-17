import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Security Policy', () => {
  it('should be present in index.html', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Extract CSP meta tag content
    const cspMatch = htmlContent.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["'](.*?)["']\s*\/?>/i);

    expect(cspMatch, 'CSP meta tag not found').not.toBeNull();

    if (cspMatch) {
      const cspContent = cspMatch[1];

      // Check directives
      expect(cspContent).toContain("default-src 'self'");

      expect(cspContent).toMatch(/script-src[^;]*'self'/);
      expect(cspContent).toMatch(/script-src[^;]*https:\/\/www\.youtube\.com/);
      expect(cspContent).toMatch(/script-src[^;]*https:\/\/s\.ytimg\.com/);

      expect(cspContent).toMatch(/style-src[^;]*'self'/);
      expect(cspContent).toMatch(/style-src[^;]*'unsafe-inline'/);
      expect(cspContent).toMatch(/style-src[^;]*https:\/\/fonts\.googleapis\.com/);

      expect(cspContent).toMatch(/font-src[^;]*'self'/);
      expect(cspContent).toMatch(/font-src[^;]*https:\/\/fonts\.gstatic\.com/);

      expect(cspContent).toMatch(/img-src[^;]*'self'/);
      expect(cspContent).toMatch(/img-src[^;]*data:/);
      expect(cspContent).toMatch(/img-src[^;]*https:\/\/i\.ytimg\.com/);

      expect(cspContent).toMatch(/connect-src[^;]*'self'/);
      expect(cspContent).toMatch(/connect-src[^;]*https:\/\/www\.youtube\.com/);

      expect(cspContent).toMatch(/frame-src[^;]*'self'/);
      expect(cspContent).toMatch(/frame-src[^;]*https:\/\/www\.youtube\.com/);
    }
  });
});
