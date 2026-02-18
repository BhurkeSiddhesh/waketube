# Palette's Journal

## 2025-05-20 - Missing Context in ARIA Label

s
**Learning:** Icon-only buttons (like Edit/Delete in lists) often lack accessible names, making them indistinguishable for screen reader users when multiple items exist.
**Action:** Always include specific context (like the item's time or name) in the `aria-label` (e.g., "Edit alarm for 7:00 AM" instead of just "Edit").

## 2025-02-04 - Accessibility Improvements for AlarmCar

d
**Learning:** Icon-only buttons (like Edit/Delete) are common in this design system but completely invisible to screen readers without explicit `aria-label`s. Using dynamic labels that include context (e.g., "Edit alarm for 7:30 AM") rather than just "Edit" significantly improves the experience for screen reader users by distinguishing between multiple alarms in a list.
**Action:** Always include dynamic, contextual `aria-label`s for repetitive list actions.

## 2025-05-21 - Semantic Grouping for Form Control

s
**Learning:** Complex form inputs like Time (Hour/Minute) and Repeats (Day Selection) are often implemented as separate inputs wrapped in divs. This loses the relationship between the group label and the inputs.
**Action:** Use `<fieldset>` and `<legend>` to semantically group related inputs. This provides a programmatically determined group label for screen readers, improving context for users navigating complex forms.
