## 2025-05-20 - [Strict URL Validation]
**Vulnerability:** Loose substring matching for YouTube URLs allowed malicious domains (e.g. `evil.com/youtube.com`) to bypass validation.
**Learning:** `String.prototype.includes()` is insufficient for URL domain validation. Malicious actors can construct paths or subdomains that match the substring.
**Prevention:** Always use the `URL` API and check `hostname` against a strict allowlist.

## 2026-02-10 - [Android Manifest Security]
**Vulnerability:** Explicitly setting `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` allows insecure HTTP traffic, which can be intercepted or modified.
**Learning:** Default Android behavior (API 28+) blocks cleartext traffic. Avoid overriding this unless necessary for local development, and ensure it's disabled in production.
**Prevention:** Remove `android:usesCleartextTraffic` or set it to `false` in production builds.
