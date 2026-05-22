---
description: "Use when editing Expo Router screens or layouts in app/**. Enforces route-safe changes, scaffold-file safety, and existing theme/component patterns."
name: "Expo Router Safety Rules"
applyTo: "app/**/*.tsx"
---

# Expo Router Safety Rules

- Keep file-based routing intact: treat file names and folder groups as route contracts.
- Preserve layout hierarchy unless the task explicitly asks for navigation changes:
  - app/\_layout.tsx
  - app/(tabs)/\_layout.tsx
- Prefer extending existing screen structure over replacing it wholesale.
- Keep imports alias-first with @/ paths when importing project modules.
- Reuse shared primitives from components/ and components/ui/ before adding new custom wrappers.
- Keep theme-aware behavior aligned with existing hooks and constants:
  - hooks/use-color-scheme.ts
  - hooks/use-theme-color.ts
  - constants/theme.ts
- Do not edit any .scaffold file or folder unless the user explicitly requests scaffold updates.
- After non-trivial route/screen edits, run lint and fix surfaced issues:
  - npm run lint

References:

- [Repository Guidelines](../../AGENTS.md)
- [Project README](../../README.md)
