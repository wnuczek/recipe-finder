# Verification Notes - ingredient-search-ranked-results

## Performance Sampling Method

- Endpoint: `POST /api/recipes/search`
- Query payload: `{ "ingredients": ["ryż", "pomidor"] }`
- Sample size: 20 sequential requests
- Metric source: `metadata.durationMs` from response body

## Observed Values

- min: 42.81 ms
- avg: 47.75 ms
- p95: 52.59 ms
- max: 52.60 ms

Raw sequence (ms):

- 52.60, 48.95, 45.36, 49.59, 46.51, 50.80, 46.20, 46.99, 52.59, 46.70, 48.82, 48.27, 48.14, 46.01, 46.88, 46.70, 42.81, 47.81, 46.18, 47.19

## Gate Result

PASS: Local p95 (52.59 ms) is below required threshold (1200 ms).

## Expanded Sampling Profiles (2026-05-26)

Method:

- Endpoint: `POST /api/recipes/search`
- Threshold: p95 <= 1200 ms
- Profiles: 3 sequential payload sets + 1 small concurrent run

Results:

- `single-ingredient` payload `{ "ingredients": ["ryż"] }`, samples=20, concurrent=1
  - min: 44.29 ms
  - avg: 107.53 ms
  - p95: 49.62 ms
  - max: 1256.75 ms
- `two-ingredients` payload `{ "ingredients": ["ryż", "pomidor"] }`, samples=20, concurrent=1
  - min: 44.33 ms
  - avg: 46.99 ms
  - p95: 49.67 ms
  - max: 50.41 ms
- `rare-ingredient` payload `{ "ingredients": ["imbir"] }`, samples=20, concurrent=1
  - min: 44.44 ms
  - avg: 47.01 ms
  - p95: 49.37 ms
  - max: 50.26 ms
- `concurrent-two-ingredients` payload `{ "ingredients": ["ryż", "pomidor"] }`, samples=25, concurrent=5
  - min: 44.58 ms
  - avg: 88.93 ms
  - p95: 300.75 ms
  - max: 310.07 ms

Interpretation:

- All measured p95 values stay below 1200 ms.
- A single outlier above threshold appeared in the `single-ingredient` profile (`max=1256.75 ms`), but did not affect p95.

## Repro Command

```bash
node -e 'const samples=20;const url="http://localhost:8787/api/recipes/search";const body=JSON.stringify({ingredients:["ryż","pomidor"]});(async()=>{const vals=[];for(let i=0;i<samples;i++){const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body});const json=await res.json();vals.push(Number(json?.metadata?.durationMs ?? NaN));}const sorted=[...vals].sort((a,b)=>a-b);const idx=Math.ceil(0.95*sorted.length)-1;const p95=sorted[Math.max(0,idx)];console.log({samples,p95,vals});})()'
```

## Manual Sign-Off (2026-05-26)

- Reviewer: project maintainer (human)
- Scope approved: Phase 1.5-1.7, 2.5-2.7, 3.5-3.7, 4.5-4.7 manual checkpoints
- Result: Approved for implementation review completion
