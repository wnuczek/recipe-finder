---
starter_id: expo
package_manager: npm
project_name: recipe-finder
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
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

This project keeps the Expo starter for fast JavaScript iteration, but the MVP release direction is now web-only on Cloudflare. The product scope remains ingredient search plus recipe scaling, with no explicit auth, payments, realtime, AI, or background jobs in MVP scope. Backend work is conditional and should be introduced only if local-flow validation misses NFR guardrails. GitHub Actions with auto-deploy-on-merge remains the default CI flow for a solo, short-horizon delivery setup.
