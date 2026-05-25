---
project: RecipeFinder
researched_at: 2026-05-25
recommended_platform: Cloudflare Workers
runner_up: Vercel
context_type: greenfield
tech_stack:
  language: JavaScript / TypeScript
  framework: Expo (React Native)
  runtime_mobile: Expo Go → EAS build
  runtime_api: V8 Isolates (Cloudflare Workers)
  database: TBD (D1 is the natural fit if data moves server-side)
  mobile_distribution: EAS (Expo Application Services)
---

## Recommendation

**Cloudflare Workers** for the backend API layer (Layer 2), introduced only when local data storage is no longer sufficient.  
**EAS (Expo Application Services)** for mobile distribution (Layer 1) — this is the primary and most urgent deployment surface for the MVP.

The two layers are independent and can be introduced at different times. Layer 1 (EAS) is needed as soon as the app needs to run outside Expo Go. Layer 2 (Workers) is only needed if a backend API is introduced.

---

## Platform Comparison — Scoring Matrix

Criteria per `references/agent-friendly-criteria.md`. Rated: **Pass / Partial / Fail**.

| Platform               | CLI-first | Managed / Serverless | Agent-readable docs | Stable deploy API | MCP            | Score     |
| ---------------------- | --------- | -------------------- | ------------------- | ----------------- | -------------- | --------- |
| **Cloudflare Workers** | Pass      | Pass                 | Pass                | Pass              | Pass           | **5 / 5** |
| Vercel                 | Pass      | Pass                 | Pass                | Pass              | Partial (beta) | 4.5       |
| Netlify                | Pass      | Pass                 | Partial             | Pass              | Pass (GA)      | 4.5       |
| Railway                | Pass      | Pass                 | Partial             | Pass              | Partial        | 3.5       |
| Render                 | Pass      | Partial              | Partial             | Pass              | Pass (GA)      | 3.5       |
| Fly.io                 | Pass      | Partial              | Pass                | Pass              | Fail           | 3.5       |

**Hard filters applied:**

- No persistent-connection requirement (all 6 qualify).
- Stack runtime: JS/TS only — all 6 qualify.

**Soft-weight adjustments:**

- Cost minimization: penalizes Railway ($5/month floor), Fly.io (no free tier, credit card required from day 1), Render free-tier cold starts (~30s) conflicting with PRD latency guardrail.
- Single region fine: reduces edge-global advantage of Cloudflare but doesn't change the ranking.
- External providers acceptable: no co-location reward applied.

---

## Anti-Bias Cross-Check — Cloudflare Workers

### Devil's Advocate (weaknesses specific to this stack + platform)

1. **V8 isolates ≠ Node.js**: Workers run in a V8 isolate runtime. npm packages relying on `fs`, `path`, `net`, `child_process`, or native bindings fail at import time. Any ingredient-matching or NLP library must be explicitly vetted for Workers compatibility before use.
2. **10ms CPU cap on free plan**: Recipe search with fuzzy matching, ingredient normalization, and result ranking can push individual requests above this threshold. The upgrade to $5/month is cheap but the ceiling is realistic.
3. **`wrangler dev` vs. production divergence**: The local dev server doesn't fully replicate production binding behavior (D1, KV, R2). Bugs tied to binding initialization or caching only surface in production.
4. **No raw TCP connections**: Workers reach external services via HTTP/S `fetch()` only. Native database drivers (PostgreSQL, Redis TCP) don't work without an HTTP-based proxy or switching to Cloudflare-native data products.
5. **Bundle size cap**: Free plan limits the Worker bundle to 1 MB compressed (10 MB paid). A recipe dataset bundled as JSON or a heavy search library can hit this wall with no graceful runtime warning.

### Pre-Mortem (150–200-word failure narrative)

The team deployed the recipe search API on Cloudflare Workers for their MVP. Month one was smooth: simple ingredient-list filtering ran in 3–5 ms of CPU time, well within the 10 ms free-tier cap. By month three the recipe catalog had grown and the ranking logic became more sophisticated — fuzzy substring matching plus score normalization pushed average CPU time to 14 ms. Free-plan requests above the cap started returning `1101` errors silently, without useful diagnostics. Upgrading to $5/month was the obvious fix, but the developer discovered that the ingredient-normalization library needed had a transitive dependency on Node.js's `path` module — unavailable in V8 isolates. Two weeks were spent auditing and replacing the dependency. Meanwhile, the local `wrangler dev` environment wasn't faithfully reproducing the D1 binding behavior introduced for the recipe index, so a subtle cache-invalidation bug only surfaced in production. By month six every feature carried hidden overhead from non-Node.js runtime constraints. The $5/month cost was fine. The velocity cost of fighting the runtime was not.

### Unknown Unknowns

1. **Workers with zero traffic for 6+ months may be garbage-collected** on the free plan. A low-traffic MVP or idle dev environment can disappear without notice.
2. **`wrangler pages deploy` ≠ `wrangler deploy`**: Cloudflare Pages and Workers-with-static-assets use different project configurations and deployment paths. Picking the wrong model early requires project reconfiguration rather than a simple rename.
3. **`process.env` doesn't work**: Workers env vars are declared as `[vars]` in `wrangler.toml` and accessed as `env.MY_VAR` in the handler, not `process.env.MY_VAR`. Code ported from Node.js patterns requires systematic changes.
4. **Cloudflare beta products gain billing without warning**: D1, KV, and other products spent time as "free during beta" before billing was enabled. Always check current billing status of any non-GA Cloudflare product before building on it.
5. **For the current MVP scope, Workers adds zero value**: if recipe data stays bundled in the app, deploying a Worker is premature. The investment only pays off when a real backend API is introduced.

**User decision after cross-check: proceed with Cloudflare Workers (risks accepted and entered into risk register).**

---

## Operational Story

### Layer 1 — Mobile Distribution (EAS)

| Axis              | Answer                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preview**       | `eas build --profile preview` → Expo Go-compatible build distributed via QR link or TestFlight (iOS) / internal track (Android)                                 |
| **Secrets**       | Managed in EAS dashboard under Project → Secrets; never committed. Referenced in `eas.json` as `$SECRET_NAME`.                                                  |
| **Rollback**      | EAS retains previous builds; re-publish an older build artifact via `eas build:list` + `eas submit` pointing at a prior build ID.                               |
| **Approval gate** | OTA updates (`eas update`) go live immediately on the selected channel. Production channel changes should be reviewed before `eas update --channel production`. |
| **Logs**          | `eas build:view <build-id>` for build logs; runtime logs via Expo's remote logger or React Native Logbox locally.                                               |

### Layer 2 — Backend API (Cloudflare Workers)

| Axis              | Answer                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preview**       | `wrangler dev` for local; `wrangler deploy --env staging` for a named staging environment pointing at a separate Worker route                                                       |
| **Secrets**       | `wrangler secret put SECRET_NAME` — stored in Cloudflare encrypted secret store, never in `wrangler.toml` or committed files. Access via `env.SECRET_NAME` in handler.              |
| **Rollback**      | `wrangler rollback` reverts to the previous deployed version of the Worker.                                                                                                         |
| **Approval gate** | `wrangler deploy` defaults to immediate production deploy. Use `--dry-run` to inspect the bundle before deploying; a staging environment provides the human gate before production. |
| **Logs**          | `wrangler tail` streams live production logs. Structured `console.log()` output is available in Cloudflare dashboard → Workers → your worker → Logs.                                |

---

## Risk Register

| Risk                                                                         | Severity | Source lens      | Mitigation                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V8 isolate runtime incompatibility with Node.js-native npm packages          | High     | Devil's advocate | Audit every new dependency for Workers compatibility before adding it; prefer packages with an `exports.workerd` condition or explicit Workers support.                                                                     |
| 10ms free-tier CPU cap hit by fuzzy search logic                             | Medium   | Devil's advocate | Profile CPU time early with `wrangler dev --local`; upgrade to $5/month paid plan before hitting production `1101` errors.                                                                                                  |
| `wrangler dev` divergence causes production-only bugs                        | Medium   | Devil's advocate | Run integration tests against a deployed staging environment, not only local `wrangler dev`.                                                                                                                                |
| Ingredient-normalization library pulled transitively into non-compatible dep | High     | Pre-mortem       | Resolve full dependency tree of any search/NLP library before committing to it; prefer pure-JS alternatives with no native bindings.                                                                                        |
| Cache-invalidation bugs in D1 bindings only surfacing in production          | Medium   | Pre-mortem       | Test D1 queries against a deployed staging Worker with a copy of production data before promoting to production.                                                                                                            |
| Idle Worker garbage-collected after 6+ months with no traffic                | Low      | Unknown unknowns | Set a lightweight scheduled cron trigger (`[triggers]` in `wrangler.toml`) to keep the Worker warm if long idle periods are expected.                                                                                       |
| Choosing wrong deploy model (Pages vs. Workers) early                        | Medium   | Unknown unknowns | Decide at project start: Workers-only for API-only backends; Pages for static assets + API together. Document the choice in this file. **Decision for RecipeFinder: Workers-only** (no static site served from Cloudflare). |
| `process.env` porting mistakes from Node.js code                             | Low      | Unknown unknowns | Add an ESLint rule or a CI grep to catch `process.env` references in Worker source files.                                                                                                                                   |
| Non-GA Cloudflare product billing surprise                                   | Medium   | Unknown unknowns | Check billing status of D1 / KV before building on them. As of 2026-05-25: D1 is GA with a free tier (5 GB storage, 25M reads/day); KV is GA with a free tier (100k reads/day).                                             |
| Workers irrelevant for current MVP scope                                     | Low      | Research finding | Do not deploy Layer 2 until a backend API is actually needed. Document this decision so it doesn't get built prematurely.                                                                                                   |
