# Recipe Finder

Expo + Hono + Postgres MVP for ranked ingredient-based recipe search.

## Prerequisites

- Node.js 20+
- A Postgres database (local Supabase or hosted)
- `.env` file in project root with `DATABASE_URL`

## Local Setup

1. Install dependencies:

```bash
npm install
```

1. Prepare database schema and seed data:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

1. Start API server:

```bash
npm run server:dev
```

1. In another terminal, start Expo app:

```bash
npm run web
```

## End-to-End Search Verification

1. Confirm ingredients endpoint works:

```bash
curl -sS http://localhost:8787/api/ingredients
```

1. Run ranked search:

```bash
curl -sS -X POST http://localhost:8787/api/recipes/search \
  -H 'content-type: application/json' \
  -d '{"ingredients":["ryż","pomidor"]}'
```

1. Verify app behavior in browser:

- Search button is disabled with no selected ingredient
- Loading, success, empty, and error/retry states render correctly
- Retry preserves selected ingredient chips

## Validation Commands

- Full validation:

```bash
npm run validate
```

- Backend tests only:

```bash
npm run server:test
```

- Frontend/service tests only:

```bash
npm run client:test
```

- Typecheck and lint:

```bash
npm run typecheck
npm run lint
```
