## 2025-05-20 - [Strict URL Validation]
**Vulnerability:** Loose substring matching for YouTube URLs allowed malicious domains (e.g. `evil.com/youtube.com`) to bypass validation.
**Learning:** `String.prototype.includes()` is insufficient for URL domain validation. Malicious actors can construct paths or subdomains that match the substring.
**Prevention:** Always use the `URL` API and check `hostname` against a strict allowlist.
