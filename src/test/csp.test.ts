import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Security Policy', () => {
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

    it('should have a CSP meta tag', () => {
        expect(htmlContent).toContain('<meta http-equiv="Content-Security-Policy"');
    });

    it('should allow self and youtube.com for scripts', () => {
        const metaTag = htmlContent.match(/<meta http-equiv="Content-Security-Policy" content="(.*?)">/);
        expect(metaTag).toBeTruthy();
        const csp = metaTag![1];
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("https://www.youtube.com");
    });

    it('should allow self and google fonts for styles', () => {
        const metaTag = htmlContent.match(/<meta http-equiv="Content-Security-Policy" content="(.*?)">/);
        const csp = metaTag![1];
        expect(csp).toContain("style-src 'self'");
        expect(csp).toContain("https://fonts.googleapis.com");
    });

    it('should allow self and gstatic for fonts', () => {
        const metaTag = htmlContent.match(/<meta http-equiv="Content-Security-Policy" content="(.*?)">/);
        const csp = metaTag![1];
        expect(csp).toContain("font-src 'self'");
        expect(csp).toContain("https://fonts.gstatic.com");
    });

    it('should allow youtube.com for frames', () => {
        const metaTag = htmlContent.match(/<meta http-equiv="Content-Security-Policy" content="(.*?)">/);
        const csp = metaTag![1];
        expect(csp).toContain("frame-src 'self'");
        expect(csp).toContain("https://www.youtube.com");
    });

    it('should allow youtube.com for connections', () => {
        const metaTag = htmlContent.match(/<meta http-equiv="Content-Security-Policy" content="(.*?)">/);
        const csp = metaTag![1];
        expect(csp).toContain("connect-src 'self'");
        expect(csp).toContain("https://www.youtube.com");
    });
});
