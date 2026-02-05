## 2025-05-23 - Insecure URL Validation
**Vulnerability:** The application was using `url.includes('youtube.com')` to validate YouTube URLs, which could be bypassed by malicious domains like `fakeyoutube.com` or `evil.com/youtube.com`.
**Learning:** `includes()` checks are insufficient for URL validation because they match substrings anywhere in the URL.
**Prevention:** Always parse URLs using the `URL` API and strictly check the `hostname` against an allowlist of valid domains.
