---
date: 2026-06-11T13:08:29+0200
researcher: WNUK Paweł
git_commit: fdeac67bd187718835833cfdad185ddaa1d87a64
branch: M3L1
repository: recipe-finder
topic: "Bump Vitest from 2.1.9 to latest (4.x) — surface area, breaking changes, migration path"
tags: [research, codebase, vitest, vite, test-infra, dependency-bump]
status: complete
last_updated: 2026-06-11
last_updated_by: WNUK Paweł
---

# Research: Bump Vitest from 2.1.9 to latest (4.x)

**Date**: 2026-06-11T13:08:29+0200
**Researcher**: WNUK Paweł
**Git Commit**: fdeac67bd187718835833cfdad185ddaa1d87a64
**Branch**: M3L1
**Repository**: recipe-finder

## Research Question

Why is the project on an old Vitest (`^2.1.8`, resolving to 2.1.9), and what is involved in bumping it to the latest (4.x)? Map the repo's Vitest surface area, the breaking changes across the 2→3→4 majors, dependency/peer constraints, and a recommended migration path.

## Summary

**The bump is low-risk for this repo.** Vitest is pinned at `^2.1.8` (installed 2.1.9) purely by inertia — it was the version chosen when the test layer was first stood up (commit `afca827`, 2026-05-26), and nothing in the codebase documents or requires staying on 2.x. Latest is **4.1.8**.

Three facts make this an easy upgrade:

1. **Tiny, vanilla surface.** 9 test files use only `describe/it/expect`, plain `vi.fn().mockResolvedValue/mockRejectedValue`, and basic matchers. **Zero** snapshots, custom matchers, `setupFiles`, `vi.spyOn`, `vi.useFakeTimers`, `mockReset`, or `expect.extend`. The single config file ([server/vitest.config.ts](server/vitest.config.ts)) uses only `root`, `include`, `environment`, `globals`, `coverage.enabled` — **none** of the config keys that v4 removed.
2. **No hard blocker.** Local Node is **22.16.0**, CI Node is **20**; both satisfy vitest 4.1.8's `engines` (`^20 || ^22 || >=24`). The only forced transitive change is **Vite 5.4.21 → Vite 6+** (vitest 4 hard-depends on `vite ^6 || ^7 || ^8`) — and **nothing else in the repo consumes Vite**, so that bump's blast radius is the test runner alone.
3. **The repo dodges the documented behavior changes.** The v3 stricter error-equality change is moot here (errors are asserted via `rejects.toMatchObject`, not Error-prototype `toEqual`); the v3 `mockReset`/`spyOn`/fake-timer changes are moot (none used); the v4 `getMockName`/snapshot/`invocationCallOrder` changes are moot (no snapshots, no order assertions).

The app/component suite runs under **jest-expo** ([jest.config.js](jest.config.js)) and is fully isolated — a Vitest bump does not touch it.

**Recommendation:** a direct **2 → 4.x** jump is reasonable given the clean surface. Stage through **latest 3.x first** only if you want the deprecation-warning runway as a safety net (see Migration Path). Verification = run `server:test`, `client:test`, and `typecheck` green.

## Detailed Findings

### Area 1 — Repo Vitest surface (what a bump touches)

**Config — one file only.** [server/vitest.config.ts](server/vitest.config.ts):
- `root: "."`, `include: ["server/src/**/*.test.ts"]`, `environment: "node"`, `globals: true`, `coverage: { enabled: false }`.
- Uses **none** of the v4-removed keys (`workspace`, `environmentMatchGlobs`, `poolMatchGlobs`, `deps.inline/external`, `poolOptions.*`, `coverage.all/extensions/...`). No `setupFiles`, no custom `exclude`.
- `globals: true` is effectively **redundant** here — every test file imports `{ describe, it, expect, vi }` from `vitest` explicitly, so they don't rely on globals. (Optional cleanup, not required by the bump.)

**Scripts** ([package.json](package.json)):
- `server:test` → `vitest run --config server/vitest.config.ts` (explicit config).
- `client:test` → `vitest run services/<6 files>.test.ts` — **no `--config` flag**. It runs from repo root where there is **no** root `vitest.config.*`/`vite.config.*`, so it uses **default config**. This is fine: the 6 files are enumerated explicitly (default `include`/`exclude` don't apply), tests import their globals explicitly, and `environment` defaults to `node`. The v4 "simplified default exclude" change therefore has no effect on `client:test`.
- `app:test` → `jest ...` (separate runner; out of scope).

**Test files & API inventory** (9 files, all low-risk):
- Server (run by `server:test`): [server/src/routes/recipe-details.test.ts](server/src/routes/recipe-details.test.ts), [server/src/routes/search.test.ts](server/src/routes/search.test.ts), [server/src/search/rank-recipes.test.ts](server/src/search/rank-recipes.test.ts).
- Client services (run by `client:test`): [services/search-client.test.ts](services/search-client.test.ts), [services/search-state.test.ts](services/search-state.test.ts), [services/recipe-details-client.test.ts](services/recipe-details-client.test.ts), [services/recipe-details-state.test.ts](services/recipe-details-state.test.ts), [services/recipe-scaling.test.ts](services/recipe-scaling.test.ts), [services/ingredient-match.test.ts](services/ingredient-match.test.ts).
- APIs used: `describe/it/expect` + matchers (`toBe`, `toEqual`, `toMatchObject`, `toContain(Equal)`, `toHaveLength`, `toBeCloseTo`, `toBeGreater/LessThan`, `toBeNull`, `toHaveBeenCalledWith`, `rejects.toMatchObject`). Mocking limited to `vi.fn().mockResolvedValue(...)` / `.mockRejectedValue(...)` in the two client-fetch tests.
- **Not used anywhere**: snapshots, `expect.extend`, `vi.spyOn`, `vi.mock`, `vi.hoisted`, fake timers, `mockReset`/`mockRestore`, `test(..., {opts})` third-arg, `invocationCallOrder`. This is exactly the set that the 3→4 breaking changes target — so they don't apply.

**Verified error/equality assertion shapes** (relevant to the v3 stricter-error-equality change): error cases use `rejects.toMatchObject({...})` (partial match on plain error objects) at [services/search-client.test.ts:63](services/search-client.test.ts#L63), [services/recipe-details-client.test.ts:55](services/recipe-details-client.test.ts#L55) and siblings. `toEqual` is used only on plain values/arrays and `expect.any(Number)` ([server/src/routes/search.test.ts:115](server/src/routes/search.test.ts#L115)) — never on `Error` instances. → v3 error-equality tightening does not affect this repo.

### Area 2 — Dependency & peer constraints

Installed tree today:
```
vitest@2.1.9
├─ @vitest/mocker@2.1.9 → vite@5.4.21 (deduped)
├─ vite-node@2.1.9       → vite@5.4.21 (deduped)
└─ vite@5.4.21
```
- `npm view vitest@4.1.8`: `dependencies.vite` and `peerDependencies.vite` = `^6.0.0 || ^7.0.0 || ^8.0.0` (vite is a **hard dep** of vitest 4 → installing it pulls Vite 6+). `engines.node` = `^20.0.0 || ^22.0.0 || >=24.0.0`. `peerDependencies['@types/node']` = `^20 || ^22 || >=24`.
- Latest Vite major is **8** (`vite@8.0.16`); vitest 4 will resolve the newest compatible Vite.
- **No other Vite consumer in the repo**: no direct `vite`/`@vitejs/*`/vite plugins in [package.json](package.json); no `vite.config.*`; no workspaces or `server/package.json`. Vite is purely transitive via vitest. → the Vite 5→6+ bump can't break a build/serve path because there isn't one.
- **Node**: local `v22.16.0` satisfies `^22.0.0`. `@types/node@^22.10.1` satisfies the peer range. **No blocker.**
- **CI**: [.github/workflows/deploy-cloudflare-on-tag.yml:39](.github/workflows/deploy-cloudflare-on-tag.yml#L39) pins `node-version: 20` — satisfies vitest 4's `^20`. No CI change strictly required. (Local 22 vs CI 20 is a pre-existing, harmless skew.)
- No `.nvmrc`; no `engines` field in `package.json`.
- **Coverage**: no `@vitest/coverage-v8`/`-istanbul` installed and `coverage.enabled: false`, so the v4 coverage-provider changes and same-major package coupling are non-issues here.

### Area 3 — Breaking changes across 2 → 3 → 4 (external, with applicability)

Sourced from the official Vitest migration guides and v3.0.0/v4.0.0 release notes (URLs in Code References). Each item tagged with whether it affects *this* repo.

**v2 → v3 (mostly behavior changes; config items only deprecated):**
- `spy.mockReset()` now restores original impl instead of a noop. → **N/A** (not used).
- `vi.spyOn` reuses an existing mock; `mockRestore` reverts to original. → **N/A** (not used).
- Fake timers: no default `toFake`; mocks all timer APIs incl. `performance.now()`. → **N/A**.
- Stricter `toEqual`/`toThrowError` error equality (compares `name`/`message`/`cause`/prototype). → **N/A** (errors asserted via `toMatchObject`).
- `test`/`describe` object-as-third-arg now **warns**. → **N/A** (not used).
- Coverage: test files always excluded. → **N/A** (coverage off).
- Requires **Vite 6**.

**v3 → v4 (the removals land here):**
- `workspace` → `projects`; `environmentMatchGlobs`/`poolMatchGlobs` **removed**. → **N/A** (not used).
- `deps.inline/external/fallbackCJS` → `server.deps.*`; `deps.optimizer.web` → `.client`. → **N/A**.
- `poolOptions` flattened (`maxThreads`/`maxForks` → `maxWorkers`, etc.); `minWorkers`, `threads.useAtomics` removed. → **N/A**.
- Coverage opts removed (`all`, `extensions`, `ignoreEmptyLines`, `experimentalAstAwareRemapping`); v8 provider now AST-based by default. → **N/A** (coverage off).
- Default `exclude` simplified to just `node_modules`/`.git`. → **N/A** (explicit file lists / `include`).
- `test`/`describe` object-third-arg **removed** (v3 warning → error). → **N/A**.
- Spying rewrite: `getMockName()` returns `"vi.fn()"`; `invocationCallOrder` starts at 1; automock getter changes. → **N/A** (no snapshots / order assertions).
- Snapshots: obsolete snapshots fail on CI; shadow-root printing. → **N/A** (no snapshots).
- Reporter API legacy hooks removed; `basic`/old `verbose` changed. → **N/A** (default reporter).
- `vite-node` → module runner; `vitest/execute` removed. → internal; **N/A**.
- Requires **Vite ≥6, Node ≥20** (4.0.0 baseline; 4.1.8 `engines` = `^20 || ^22 || >=24`).

**Net:** every documented breaking change across both majors lands on a feature this repo doesn't use. The only material change we actually absorb is the transitive **Vite 5 → 6+** bump.

## Code References

- `package.json:74` — `"vitest": "^2.1.8"` (the pin to bump); `package.json:18-20` — `server:test` / `client:test` / `app:test` scripts.
- `server/vitest.config.ts:1-13` — the single Vitest config; uses no v4-removed keys.
- `services/search-client.test.ts:63`, `services/recipe-details-client.test.ts:55` — `rejects.toMatchObject` error assertions (confirm v3 error-equality change is N/A).
- `jest.config.js:1-7` — separate jest-expo runner (out of scope).
- `.github/workflows/deploy-cloudflare-on-tag.yml:39` — CI `node-version: 20` (satisfies vitest 4 `^20`).
- Migration sources: <https://vitest.dev/guide/migration> (v4), <https://v3.vitest.dev/guide/migration> (v3), <https://vitest.dev/blog/vitest-3>, <https://vitest.dev/blog/vitest-4>, <https://github.com/vitest-dev/vitest/releases/tag/v3.0.0>, <https://github.com/vitest-dev/vitest/releases/tag/v4.0.0>.

## Architecture Insights

- **Two Vitest entry points, two config strategies.** `server:test` pins an explicit config; `client:test` runs config-less on an explicit file list. The bump must keep both green. The config-less `client:test` is actually *more* robust to v4's config-default changes, not less, because it leans on explicit file enumeration rather than default `include`/`exclude`.
- **Vitest is a leaf dependency.** Because no app/build path uses Vite, the usual scary part of a Vitest major bump (a forced Vite major) is de-risked here — there's no Vite plugin ecosystem or app config to reconcile.
- **Explicit imports over globals.** All test files import from `vitest`, making `globals: true` redundant. Worth noting because it means the suite is insulated from any future change to globals injection.

## Historical Context (from prior changes)

- Vitest was introduced in `afca827` (`feat(ingredient-search-ranked-results): persistence foundation`), with later hardening in `f09a16e` (`p4`), ~2026-05-26. The `^2.1.8` pin was a point-in-time default, never revisited — no rationale recorded in `context/`.
- The pure-module + Vitest pattern (services tested headlessly, components under jest-expo) is the established convention, referenced across `context/archive/2026-06-05-editable-ingredient-quantities/plan.md` and `context/archive/2026-06-09-autocomplete-improvement/plan.md`. The bump must preserve this split.
- [context/foundation/test-plan.md:114](context/foundation/test-plan.md#L114) lists Vitest among the frameworks whose official docs are the doc-MCP/`WebFetch` fallback — consistent with treating a version bump as a doc-grounded change.
- [context/foundation/lessons.md](context/foundation/lessons.md) — the open characterization tests in `services/recipe-scaling.test.ts` (non-finite-input behavior) must still pass post-bump; they assert plain numeric/`NaN` behavior via `toBe`/`toBeCloseTo`, unaffected by any 3/4 change.

## Related Research

- None prior for test-infra versioning. This is the first change scoped to the Vitest runner version itself. Adjacent test-strategy context lives in `context/foundation/test-plan.md` and the `testing-scaling-correctness` archived rollout.

## Open Questions

1. **Target version: pin to `^4.1.8`, or float (`latest`)?** Recommend a concrete caret pin (`^4.1.8`) for reproducibility, matching how the rest of `devDependencies` are pinned.
2. **Direct 2→4 vs. staged via latest 3.x?** Given the clean surface, direct is fine. Stage only if a CI gate wants the v3 deprecation-warning runway. (Decision belongs in the plan.)
3. **Bump `@types/node` / CI Node?** Not required — current values satisfy vitest 4. Leave as-is unless a future change wants local/CI Node parity.
4. **Drop the now-redundant `globals: true`?** Optional cleanup; could fold into this change or leave alone. Out-of-scope risk is nil either way.
