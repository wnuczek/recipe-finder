# Verification Notes - recipe-details-navigation

Change: FR-005 recipe details navigation + the FR-006 quantities/units data foundation.
Hard gate (PRD): recipe details open time **p95 ≤ 700 ms**, measured against the Railway
deployment after migration + reseed (per the S-01 hard-gate precedent).

## Automated Verification (2026-06-08)

`npm run validate` — **PASS** (green end-to-end).

Suite breakdown:

- `server:typecheck` — pass
- `server:lint` — pass
- `server:test` — pass (search suite + new `recipe-details` suite: 200 incl. null-amount row, 404, 400 blank id, 500 repo failure)
- `client:test` — pass (search client/state + new `recipe-details-client` [success/404/5xx/network/malformed] + `recipe-details-state` transitions)
- `app:test` — pass (search-results-section + new `recipe-details-screen`: success w/ quantities + "do smaku", not-found w/ back, error w/ retry)
- `typecheck` — pass
- `lint` — pass

Phase commits: `e84559b` (p1 data foundation), `99f58f9` (p2 details endpoint),
`946137c` (p3 navigation + details screen).

## Production Rollout (Railway) — VERIFIED (2026-06-08)

Verified directly against the live Railway deployment:

- [x] Server code deployed — `/health` HTTP 200, existing `GET /api/recipes/search` HTTP 200
- [x] Migration applied + DB reseeded with quantities (confirmed via deployed endpoint payload below)
- [x] `GET https://recipe-finder-production-943b.up.railway.app/api/recipes/r-001` returns title + ingredients with `amount`/`unit`, including a null/null ("to taste") row

Deployed `GET /api/recipes/r-001` response:

```json
{"recipe":{"id":"r-001","title":"Makaron pomidorowy z bazylią","favoritesCount":40,
"ingredients":[{"name":"bazylia","amount":null,"unit":null},{"name":"czosnek","amount":2,"unit":"szt"},
{"name":"makaron","amount":250,"unit":"g"},{"name":"oliwa z oliwek","amount":2,"unit":"łyżka"},
{"name":"pomidor","amount":400,"unit":"g"}]},"metadata":{"durationMs":289.92}}
```

Note: migrate/reseed were confirmed by the populated, alphabetically-ordered quantities in the
deployed payload (run from Railway-side; not executed from this workstation, which lacks the prod URL).

## Performance Sampling Method (p95 hard gate) — MEASURED (2026-06-08)

- Endpoint: `GET /api/recipes/:id`
- Target: Railway deployment (`https://recipe-finder-production-943b.up.railway.app`) — after migration + reseed
- Sample size: 40 sequential requests (1 warmup discarded), cycling ids r-001…r-005
- Metric source: client-measured wall-clock round-trip latency (recipe "open time"); server `metadata.durationMs` recorded as supplementary
- Threshold: p95 ≤ 700 ms

### Observed Values

Wall-clock round-trip (open time, gate metric):

- min: 454.08 ms
- avg: 534.53 ms
- p95: 603.44 ms
- max: 618.67 ms

Server-side `metadata.durationMs` (supplementary):

- min: 288.56 ms
- avg: 289.13 ms
- p95: 289.93 ms
- max: 290.32 ms

Raw wall sequence (ms): 618.67, 603.82, 457.06, 595.14, 468.75, 602.89, 594.84, 603.05, 456.95, 456.03, 598.67, 455.67, 596.77, 455.45, 454.26, 455, 456.09, 454.67, 454.64, 596.69, 603.44, 596.67, 457.15, 455.18, 592.95, 455.21, 601.21, 591.98, 591.76, 594.9, 602.75, 597.25, 454.89, 597.19, 593.02, 597.52, 597.01, 457.3, 454.08, 454.6

### Gate Result

**PASS**: production wall-clock p95 (603.44 ms) is below the required threshold (700 ms).
The ~165 ms gap between wall-clock and server `durationMs` (289.93 ms) is network RTT from the
measuring client to Railway, so the gate metric is a conservative real-client "open time".

### Repro Command

```bash
node -e 'const samples=30;const id="r-001";const url=`https://recipe-finder-production-943b.up.railway.app/api/recipes/${id}`;(async()=>{const vals=[];for(let i=0;i<samples;i++){const t0=performance.now();const res=await fetch(url);await res.json();vals.push(performance.now()-t0);}const sorted=[...vals].sort((a,b)=>a-b);const p95=sorted[Math.max(0,Math.ceil(0.95*sorted.length)-1)];const avg=vals.reduce((a,b)=>a+b,0)/vals.length;console.log({samples,min:sorted[0],avg:Math.round(avg*100)/100,p95:Math.round(p95*100)/100,max:sorted[sorted.length-1]});console.log("raw:",vals.map(v=>Math.round(v*100)/100).join(", "));})()'
```

## Manual End-to-End Pass (deployed web build) — TODO

- [ ] Search → tap result → details opens with quantities → back returns to intact results
- [ ] Browser-refresh of `/recipe/r-001` renders from network alone (no snapshot)
- [ ] `/recipe/nonexistent` → not-found state with working back-to-search link

## Manual Sign-Off — TODO

- Reviewer: _human_
- Date: _YYYY-MM-DD_
- Result: _Approved / Changes requested_
