# Palette's Journal

This file tracks critical UX and accessibility learnings.

Format: `## YYYY-MM-DD - [Title]
**Learning:** [UX/a11y insight]
**Action:** [How to apply next time]`

## 2025-05-15 - Contextual Labels in Lists
**Learning:** In lists of identical items (like alarms), generic labels like "Edit" or "Delete" are ambiguous for screen reader users. They need context to know *which* item they are acting on.
**Action:** Always include unique identifying information (like time, name, or label) in `aria-label` attributes for actions within list items (e.g., "Delete alarm for 7:30 AM").
