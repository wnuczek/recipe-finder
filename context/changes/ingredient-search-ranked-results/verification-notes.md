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

## Repro Command

```bash
node -e 'const samples=20;const url="http://localhost:8787/api/recipes/search";const body=JSON.stringify({ingredients:["ryż","pomidor"]});(async()=>{const vals=[];for(let i=0;i<samples;i++){const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body});const json=await res.json();vals.push(Number(json?.metadata?.durationMs ?? NaN));}const sorted=[...vals].sort((a,b)=>a-b);const idx=Math.ceil(0.95*sorted.length)-1;const p95=sorted[Math.max(0,idx)];console.log({samples,p95,vals});})()'
```
