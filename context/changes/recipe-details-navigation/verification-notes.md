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

## Production Rollout (Railway) — TODO (manual)

Deploy order (backward-compatible code → migrate → reseed → measure):

- [ ] Server code deployed to Railway
- [ ] `npm run db:migrate` applied against the production DB (additive: `amount`, `unit` nullable columns)
- [ ] `npm run db:seed` reseeded with quantities
- [ ] `curl https://recipe-finder-production-943b.up.railway.app/api/recipes/r-001` returns title + ingredients with `amount`/`unit`

Confirmation: _record date + outcome here_

## Performance Sampling Method (p95 hard gate) — TODO (manual)

- Endpoint: `GET /api/recipes/:id`
- Target: Railway deployment (`https://recipe-finder-production-943b.up.railway.app`) — **after** migration + reseed
- Sample size: ≥ 30 sequential requests
- Metric source: client-measured wall-clock round-trip latency (recipe "open time")
- Threshold: p95 ≤ 700 ms

### Observed Values — TODO

- min: _ms_
- avg: _ms_
- p95: _ms_
- max: _ms_

Raw sequence (ms): _paste here_

### Gate Result — TODO

_PASS/FAIL: production p95 (___ ms) vs required threshold (700 ms). A failing value blocks close-out._

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
