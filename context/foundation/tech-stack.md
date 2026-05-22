---
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
---

## Why this stack

This project is a mobile MVP with a short, after-hours timeline, so the safest path is a battle-tested starter that ships quickly across iOS and Android from one codebase. Expo is the recommended default for mobile in the JavaScript family, clears all agent-friendly quality gates, and has verified scaffolding smoothness. Your requirements focus on ingredient search and recipe scaling, with no explicit auth, payments, realtime, AI, or background jobs in MVP scope, which fits Expo well without extra backend-heavy setup at this stage. You selected Expo Go as the deployment target for fast iteration, with GitHub Actions and auto-deploy-on-merge to keep delivery simple for solo development.