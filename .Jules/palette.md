## 2024-01-25 - Inline Destructive Confirmation
**Learning:** Users prefer inline confirmation for destructive actions (like deleting an alarm) over modal dialogs or immediate deletion, as it maintains context and prevents accidental clicks without blocking the flow.
**Action:** Implement a 2-step click pattern (Trigger -> Confirm) for delete buttons with a 3-second auto-revert timer to clear the state if the user changes their mind.
