---
bootstrapped_at: 2026-05-21T14:55:00Z
starter_id: expo
starter_name: Expo (React Native)
project_name: recipe-finder
language_family: js
package_manager: npm
cwd_strategy: subdir-then-move
bootstrapper_confidence: verified
phase_3_status: ok
audit_command: npm audit --json
---

## Hand-off

```yaml
starter_id: expo
package_manager: npm
project_name: recipe-finder
hints:
  language_family: js
  team_size: solo
  deployment_target: expo-go
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: false
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

### Why this stack

This project is a mobile MVP with a short, after-hours timeline, so the safest path is a battle-tested starter that ships quickly across iOS and Android from one codebase. Expo is the recommended default for mobile in the JavaScript family, clears all agent-friendly quality gates, and has verified scaffolding smoothness. Your requirements focus on ingredient search and recipe scaling, with no explicit auth, payments, realtime, AI, or background jobs in MVP scope, which fits Expo well without extra backend-heavy setup at this stage. You selected Expo Go as the deployment target for fast iteration, with GitHub Actions and auto-deploy-on-merge to keep delivery simple for solo development.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
| ------------------ | ---------------------------------- | -------- | ---------------------------------- |
| npm package | create-expo-app v4.0.0 published 2026-05-15 | fresh | resolved from cmd_template |
| GitHub repo | not run | — | docs_url is https://docs.expo.dev (not a GitHub URL) |

## Scaffold log

**Resolved invocation**: `npx create-expo-app .bootstrap-scaffold --yes --template default`
**Strategy**: subdir-then-move (scaffold into temp directory then move files up)
**Exit code**: 0
**Files moved**: 0 (all scaffold files already existed in cwd)
**Conflicts (.scaffold siblings)**: app.json.scaffold, eslint.config.js.scaffold, package-lock.json.scaffold, tsconfig.json.scaffold, app.scaffold, assets.scaffold, components.scaffold, constants.scaffold, hooks.scaffold, scripts.scaffold, .claude.scaffold, .vscode.scaffold
**.gitignore handling**: append-merged (identical content, no new lines added)
**.bootstrap-scaffold cleanup**: deleted

## Post-scaffold audit

**Tool**: npm audit --json
**Summary**: 0 CRITICAL, 0 HIGH, 4 MODERATE, 0 LOW
**Direct vs transitive**: 1 direct (expo - moderate) of total 4 moderate

#### MODERATE findings

- **expo** (direct) — via @expo/cli, @expo/metro-config; fix available: expo@55.0.26 (major)
- **@expo/cli** (transitive) — via @expo/metro-config
- **@expo/metro-config** (transitive) — via postcss (CVE, CVSS:6.1, XSS)
- **postcss** (transitive) — PostCSS XSS via unescaped `</style>` in CSS Stringify Output; GHSA-qx2v-qp2m-jg93; fix: postcss >=8.5.10

#### LOW / INFO findings

None.

## Hints recorded but not acted on

| Hint | Value |
| -------------------------- | ---------------------------------- |
| bootstrapper_confidence | verified |
| quality_override | false |
| path_taken | standard |
| self_check_answers | null |
| team_size | solo |
| deployment_target | expo-go |
| ci_provider | github-actions |
| ci_default_flow | auto-deploy-on-merge |
| has_auth | false |
| has_payments | false |
| has_realtime | false |
| has_ai | false |
| has_background_jobs | false |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log.
