# Bump Vitest to Latest (4.x) Implementation Plan

## Overview

Upgrade Vitest from `^2.1.8` (installed 2.1.9) to `^4.1.8`, accepting the transitive Vite 5→6+ bump that vitest 4 forces, and verify both Vitest-driven suites (`server:test`, `client:test`) stay green. Separately, move CI off the now end-of-life Node 20 to the current LTS, Node 24.

## Current State Analysis

- Vitest is pinned at `^2.1.8` (installed 2.1.9) in [package.json:74](package.json#L74) — a point-in-time default from when the test layer was first stood up (commit `afca827`, ~2026-05-26), never revisited. Latest is 4.1.8.
- The entire Vitest surface is **one config file** ([server/vitest.config.ts](server/vitest.config.ts)) using only `root` / `include` / `environment` / `globals` / `coverage.enabled` — **none** of the keys removed in v4 — plus **9 test files** (3 server, 6 client services) that use vanilla `describe/it/expect`, basic matchers, and `vi.fn().mockResolvedValue/mockRejectedValue`. No snapshots, `vi.spyOn`, fake timers, `mockReset`, `expect.extend`, or `test(..., {opts})` — i.e. none of the APIs targeted by the 2→3→4 breaking changes.
- Error assertions use `rejects.toMatchObject` (partial match on plain objects), not Error-prototype `toEqual`, so the v3 stricter-error-equality change does not apply.
- Vite is **purely transitive** via vitest (currently 5.4.21); nothing else in the repo consumes Vite (no `vite.config.*`, no `@vitejs/*`, no plugins). So the forced Vite 5→6+ bump has no build/serve path to break.
- Node: local `v22.16.0`, CI `node-version: 20` ([.github/workflows/deploy-cloudflare-on-tag.yml:39](.github/workflows/deploy-cloudflare-on-tag.yml#L39)). vitest 4.1.8 `engines` = `^20 || ^22 || >=24`. Node 20 reached EOL in April 2026; Node 24 is the current Active LTS.
- The jest-expo component suite ([jest.config.js](jest.config.js), run by `app:test`) is a separate runner and is untouched by a Vitest bump.

Full analysis: [context/changes/bump-vitest-to-latest/research.md](context/changes/bump-vitest-to-latest/research.md).

## Desired End State

- [package.json](package.json) pins `"vitest": "^4.1.8"`; `npm ls vitest` shows a 4.x install pulling Vite 6+.
- `npm run server:test`, `npm run client:test`, `npm run typecheck`, and `npm run lint` all pass on the upgraded runner. `npm run app:test` (jest) still passes, confirming no cross-runner regression.
- CI workflow runs on Node 24 (latest LTS), off the EOL Node 20.

Verification: `npm run validate` (the umbrella script) passes locally, and the next CI run on a tag is green on Node 24.

### Key Discoveries:

- Single config file, no removed keys: [server/vitest.config.ts:1-13](server/vitest.config.ts).
- Error assertions are shape-based (`rejects.toMatchObject`): [services/search-client.test.ts:63](services/search-client.test.ts#L63), [services/recipe-details-client.test.ts:55](services/recipe-details-client.test.ts#L55) — insulated from v3 error-equality tightening.
- `client:test` runs config-less on an explicit file list ([package.json:19](package.json#L19)) — insulated from v4's simplified default `exclude`.
- vitest 4 hard-depends on Vite `^6 || ^7 || ^8`; no other Vite consumer exists in the repo.
- CI Node pin: [.github/workflows/deploy-cloudflare-on-tag.yml:39](.github/workflows/deploy-cloudflare-on-tag.yml#L39).

## What We're NOT Doing

- **Not** staging through 3.x — going direct 2→4 (the repo triggers none of the v3 deprecation warnings, so the runway buys nothing).
- **Not** removing the redundant `globals: true` from the config — kept to minimize diff and risk (all tests import their helpers explicitly anyway).
- **Not** touching `@types/node` (`^22.10.1` already satisfies vitest 4's peer range).
- **Not** adding an `engines` field or `.nvmrc` — out of scope; can be a future change if local/CI Node parity is wanted.
- **Not** changing any test code, test strategy, or quality-gate definitions, and **not** configuring hooks (that's the separate M3L3 lesson scope).
- **Not** touching the jest-expo component suite.

## Implementation Approach

Direct, single-step major bump. Because the repo uses none of the removed/changed APIs and Vite is a leaf dependency, the upgrade is overwhelmingly an install + green-suite verification. The CI Node move is an independent one-line workflow edit, sequenced after the bump is proven locally. If — against the research — a test breaks, the failure will be concrete (a specific matcher or mock behavior) and handled inline; anything deeper would graduate to its own change.

## Phase 1: Bump Vitest to 4.x & Verify

### Overview

Update the version pin, reinstall (accepting the transitive Vite major bump), and prove every suite still passes.

### Changes Required:

#### 1. Vitest version pin

**File**: `package.json`

**Intent**: Bump the Vitest devDependency to the latest 4.x so the project is current and supported.

**Contract**: `devDependencies.vitest` changes from `"^2.1.8"` to `"^4.1.8"`. After `npm install`, the lockfile resolves vitest 4.x and Vite ≥6 transitively (`@vitest/mocker`, `vite-node`/module-runner deduped on the same Vite). No other `package.json` edits (scripts and the `server/vitest.config.ts` config are unchanged).

### Success Criteria:

#### Automated Verification:

- [ ] Install resolves cleanly: `npm install` (no peer/engine errors)
- [ ] Vitest 4.x + Vite ≥6 installed: `npm ls vitest vite`
- [ ] Server suite passes: `npm run server:test`
- [ ] Client suite passes: `npm run client:test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] No cross-runner regression — jest suite still passes: `npm run app:test`

#### Manual Verification:

- [ ] No new deprecation/warning noise in the Vitest output that implies an unhandled API change
- [ ] Spot-check that test counts match pre-bump (no tests silently skipped due to config/glob changes)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Align CI to Node LTS

### Overview

Move the deploy workflow off EOL Node 20 to the current LTS, Node 24.

### Changes Required:

#### 1. CI Node version

**File**: `.github/workflows/deploy-cloudflare-on-tag.yml`

**Intent**: Run CI on a supported Node LTS that satisfies vitest 4's engines, replacing the end-of-life Node 20.

**Contract**: The `actions/setup-node` step's `node-version: 20` becomes `node-version: 24` (line ~39). No other workflow changes.

### Success Criteria:

#### Automated Verification:

- [ ] Workflow YAML is valid (parses; e.g. `npx --yes js-yaml .github/workflows/deploy-cloudflare-on-tag.yml` or equivalent)
- [ ] No remaining `node-version: 20` reference in the workflow: `grep -n "node-version" .github/workflows/deploy-cloudflare-on-tag.yml`

#### Manual Verification:

- [ ] Next tag-triggered CI run completes green on Node 24 (deferred — observed on the next actual push/tag, not gating local work)

**Implementation Note**: CI verification is observed on the next tag push; it does not block local completion of this change.

---

## Testing Strategy

### Unit Tests:

- No new tests. The existing 9 Vitest files and 4 jest files are the regression net — they must pass unchanged on the new runner.

### Integration Tests:

- `npm run validate` exercises the full chain (server typecheck/lint/test → client test → app test → root typecheck/lint) as the end-to-end gate.

### Manual Testing Steps:

1. Run `npm run validate` and confirm all sub-steps pass.
2. Compare Vitest test counts before/after to confirm nothing is silently excluded.
3. Scan Vitest stderr for unexpected deprecation warnings.

## Performance Considerations

None of substance. vitest 4's pool internals were rewritten but the default (`forks`, unchanged since v2.0) is retained; test runtime should be comparable.

## Migration Notes

- The only forced change is transitive Vite 5→6+; delete `node_modules` + reinstall if the lockfile resolution looks inconsistent.
- Rollback is a one-line revert of the `package.json` pin (and lockfile) — no data or schema involved.

## References

- Related research: [context/changes/bump-vitest-to-latest/research.md](context/changes/bump-vitest-to-latest/research.md)
- Config under test: [server/vitest.config.ts](server/vitest.config.ts)
- CI workflow: [.github/workflows/deploy-cloudflare-on-tag.yml:39](.github/workflows/deploy-cloudflare-on-tag.yml#L39)
- Migration guides: <https://vitest.dev/guide/migration>, <https://v3.vitest.dev/guide/migration>

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Bump Vitest to 4.x & Verify

#### Automated

- [x] 1.1 Install resolves cleanly: `npm install`
- [x] 1.2 Vitest 4.x + Vite ≥6 installed: `npm ls vitest vite`
- [x] 1.3 Server suite passes: `npm run server:test`
- [x] 1.4 Client suite passes: `npm run client:test`
- [x] 1.5 Type checking passes: `npm run typecheck`
- [x] 1.6 Linting passes: `npm run lint`
- [x] 1.7 Jest suite still passes: `npm run app:test`

#### Manual

- [x] 1.8 No unhandled-API deprecation/warning noise in Vitest output
- [x] 1.9 Test counts match pre-bump (nothing silently skipped)

### Phase 2: Align CI to Node LTS

#### Automated

- [ ] 2.1 Workflow YAML is valid
- [ ] 2.2 No remaining `node-version: 20` reference in the workflow

#### Manual

- [ ] 2.3 Next tag-triggered CI run is green on Node 24 (deferred)
