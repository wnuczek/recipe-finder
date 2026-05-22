# Repository Guidelines

## High-Signal Rules For Agents

- Treat `app/` as source of truth for active routes and screens.
- Do not edit `.scaffold` files/directories unless the user explicitly asks.
- Keep imports alias-first (`@/...`) using the path mapping in `tsconfig.json`.
- Preserve Expo Router file-based routing conventions (route files and `_layout.tsx` hierarchy).
- Run npm run lint after any change to app//_.tsx, components//_.tsx, route wiring, imports, or shared component props
- If a task needs tests, note that no test runner is configured yet; propose one before adding broad test suites.

## Known Pitfalls

- `npm run reset-project` is interactive and can remove or move directories; do not run it unless requested.
- This repo contains both active files and scaffold copies; verify path targets before editing.
- There is no backend in this repo yet; avoid inventing server contracts unless asked.

## Quick Commands

- Install deps: `npm install`
- Start dev server: `npm run start`
- Open on iOS: `npm run ios`
- Open on Android: `npm run android`
- Open web preview: `npm run web`
- Lint: `npm run lint`
- Reset scaffold: `npm run reset-project` (interactive, destructive/move operation)

## Architecture Map

- Routing and navigation:
  - `app/_layout.tsx` root stack and theme provider.
  - `app/(tabs)/_layout.tsx` tab navigator setup.
  - `app/(tabs)/index.tsx` and `app/(tabs)/explore.tsx` current screens.
  - `app/modal.tsx` modal route.
- Reusable UI primitives:
  - `components/` and `components/ui/`.
- Theme and styling:
  - `constants/theme.ts` for colors/fonts.
  - `hooks/use-color-scheme.ts` and `hooks/use-theme-color.ts` for theme-aware behavior.
- Utility scripts:
  - `scripts/reset-project.js` can move/delete starter directories and recreate `app/`.

## Project Snapshot

- App type: Expo React Native mobile app (Expo Router).
- Language: TypeScript with strict mode enabled.
- Package manager: npm.
- Current state: scaffolded starter with `.scaffold` reference files still present.

## Project-Specific Context

- Product intent is documented in `context/foundation/prd.md` (RecipeFinder MVP).
- Stack rationale and constraints are in `context/foundation/tech-stack.md`.
- Bootstrap/audit notes are in `context/changes/bootstrap-verification/verification.md`.

## Link-First Policy

- Prefer linking to existing docs over duplicating them in instructions:
  - `README.md`
  - `context/foundation/prd.md`
  - `context/foundation/tech-stack.md`
  - `context/changes/bootstrap-verification/verification.md`
