# Bump Vitest to Latest (4.x) — Plan Brief

> Full plan: `context/changes/bump-vitest-to-latest/plan.md`
> Research: `context/changes/bump-vitest-to-latest/research.md`

## What & Why

Vitest is pinned at `^2.1.8` (installed 2.1.9) purely by inertia — two majors behind latest (4.1.8), with no documented reason to stay. This change brings the test runner current and supported, and moves CI off the now end-of-life Node 20.

## Starting Point

One Vitest config ([server/vitest.config.ts](server/vitest.config.ts)) using only non-removed keys, plus 9 test files (3 server, 6 client services) using vanilla `describe/it/expect` + `vi.fn().mockResolvedValue/Rejected`. No snapshots, spies, fake timers, or removed config — none of the APIs the 2→3→4 breaking changes target. Vite is purely transitive (5.4.21); nothing else in the repo consumes it. CI runs Node 20.

## Desired End State

`package.json` pins `vitest ^4.1.8`; the install pulls Vite 6+ transitively; `server:test`, `client:test`, `typecheck`, `lint`, and the separate jest `app:test` all pass. CI runs on Node 24 (latest LTS).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Upgrade path | Direct 2 → 4.x | Repo triggers none of the v3 deprecation warnings, so staging buys nothing | Plan |
| Version pin | `^4.1.8` (caret) | Matches the repo's devDependency convention; reproducible | Plan |
| Node / CI | CI → Node 24 (latest LTS) | Node 20 is EOL (April 2026); Node 24 satisfies vitest 4's `>=24` engines | Plan |
| `globals: true` | Leave as-is | Smallest diff, zero risk; tests import helpers explicitly anyway | Plan |
| Vite bump | Accept transitive 5→6+ | Forced by vitest 4; no other Vite consumer to break | Research |

## Scope

**In scope:**
- Bump `vitest` `^2.1.8` → `^4.1.8` and reinstall (accept transitive Vite 5→6+).
- Verify both Vitest suites + typecheck + lint + jest suite stay green.
- Update CI `node-version: 20` → `24`.

**Out of scope:**
- Staging through 3.x; removing `globals: true`; touching `@types/node`; adding `engines`/`.nvmrc`.
- Any test code, test strategy, hooks (M3L3), or the jest-expo suite.

## Architecture / Approach

A direct single-step major bump. Because the repo uses none of the removed/changed APIs and Vite is a leaf dependency behind the runner, the work is essentially install + green-suite verification. The CI Node change is an independent one-line workflow edit, sequenced after the bump is proven locally.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Bump & verify | vitest 4.x installed, all suites green | A latent API/behavior change slips past the research (low — surface is vanilla) |
| 2. CI Node LTS | CI on Node 24 | CI-only verification is deferred to the next tag push |

**Prerequisites:** Local Node ≥20 (have 22.16.0); clean working tree on a feature branch.
**Estimated effort:** ~1 short session, 2 phases.

## Open Risks & Assumptions

- Research indicates zero applicable breaking changes; risk is a behavior change not surfaced by the docs. Mitigated by running the full `validate` suite + comparing test counts.
- Local dev (Node 22) and CI (Node 24) will run different LTS majors — both supported, both satisfy vitest 4; harmless skew, noted not fixed.
- Assumes the transitive Vite major bump introduces no resolution conflict (none expected — no other Vite consumer).

## Success Criteria (Summary)

- `npm run validate` passes on vitest 4.x with no silently skipped tests.
- `npm ls vitest vite` shows vitest 4.x and Vite ≥6.
- CI workflow targets Node 24 and the next tag run is green.
