---
description: "Create a new Expo Router screen in app/** with route-safe wiring, themed UI, and lint verification."
name: "Create New Screen"
argument-hint: "Screen route + purpose (example: /favorites - saved recipes list)"
agent: "agent"
---

Create one new screen for this Expo Router project.

Use the user argument as the source of truth for:

- route path (for example: /favorites)
- screen purpose and required UI elements

Requirements:

- Follow project rules in [AGENTS.md](../../AGENTS.md).
- Follow route safety conventions in [expo-router-safety.instructions.md](../instructions/expo-router-safety.instructions.md).
- If reusable UI is added or changed, follow [components-ui-conventions.instructions.md](../instructions/components-ui-conventions.instructions.md).
- Implement only the minimal files needed for the requested screen.
- Keep file-based routing and existing layout hierarchy intact.
- Use alias imports (`@/...`) for project modules.
- Reuse existing themed components and hooks when possible.
- Do not edit any `.scaffold` file or folder.

Execution checklist:

1. Inspect `app/_layout.tsx` and `app/(tabs)/_layout.tsx` to decide whether the new route is tab-based or stack/modal.
2. Create the screen file in `app/**` at the correct route location.
3. Add only required route wiring if needed (for example adding a tab entry).
4. Keep changes small and consistent with existing patterns.
5. Run `npm run lint`.
6. Return:
   - files changed
   - route path created
   - any follow-up options (for example adding navigation links from Home)
