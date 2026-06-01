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
  path_taken: custom
  quality_override: true
  self_check_answers:
    typed: true
    from_official_starter: false
    conventions: true
    docs_current: false
    can_judge_agent: false
  has_auth: false
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

RecipeFinder targets web MVP first, then App Store and Play Store — making Expo (React Native) the lead starter: a single TypeScript codebase ships to web via Cloudflare Pages now, and to iOS/Android via EAS later with no frontend rewrite. The backend is Hono.js (lightweight, TypeScript-native, multi-runtime) paired with PostgreSQL, hosted on Railway — chosen explicitly to avoid Cloudflare Workers' long-lived TCP connection limits and to keep the stack portable across providers. No auth, payments, realtime, AI, or background jobs are in MVP scope. CI/CD is GitHub Actions with auto-deploy on merge. Three of five self-check points were marked uncertain (official starter familiarity, docs currency, agent-output judgment); extra human review of AI-generated Hono and Expo code is advised until confidence builds.
