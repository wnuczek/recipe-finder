---
description: "Use when editing reusable UI components in components/**. Enforces themed component reuse, prop-safe changes, and scaffold-file safety."
name: "Components UI Conventions"
applyTo: "components/**/*.tsx"
---

# Components UI Conventions

- Prefer extending existing primitives before creating new abstractions:
  - components/themed-text.tsx
  - components/themed-view.tsx
  - components/ui/\*
- Keep component APIs additive and backward-compatible when possible.
- Avoid broad prop renames across shared components unless explicitly requested.
- Keep imports alias-first with @/ paths for project modules.
- Keep theme behavior consistent with existing hooks/constants:
  - hooks/use-theme-color.ts
  - hooks/use-color-scheme.ts
  - constants/theme.ts
- Favor small, composable components over large multi-purpose wrappers.
- Do not edit any .scaffold file or folder unless the user explicitly requests scaffold updates.
- After non-trivial component edits, run lint and fix surfaced issues:
  - npm run lint

References:

- [Repository Guidelines](../../AGENTS.md)
- [Project README](../../README.md)
