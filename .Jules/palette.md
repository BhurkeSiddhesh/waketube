## 2025-02-04 - Accessibility Improvements for AlarmCard
**Learning:** Icon-only buttons (like Edit/Delete) are common in this design system but completely invisible to screen readers without explicit `aria-label`s. Using dynamic labels that include context (e.g., "Edit alarm for 7:30 AM") rather than just "Edit" significantly improves the experience for screen reader users by distinguishing between multiple alarms in a list.
**Action:** Always include dynamic, contextual `aria-label`s for repetitive list actions.
