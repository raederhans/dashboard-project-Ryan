# TODO (Single Source of Truth)

## Pending

## In Progress

 ## Completed
 - [x] Bootstrap Vite + deps (maplibre, turf, dayjs) and base folders (ID: A-boot) (owner: codex) - Vite scaffold & deps OK; smoke log: logs/npm_run_dev_*.out.log; 2 moderate dev-only vulnerabilities.
 - [x] Create API layer stubs in src/api/* with signatures from plan (ID: B-api) (owner: codex) - files created: src/config.js, src/utils/{http,sql}.js, src/api/{crime,boundaries,acs}.js, src/state/store.js.
 - [x] Implement SQL builders for endpoints Sec 2.1-2.6 (ID: B-sql) (owner: codex) - SQL builders implemented in src/utils/sql.js.
 - [x] Boundaries: fetch & cache Police Districts GeoJSON (ID: C-districts) (owner: codex) - cached to public/data/police_districts.geojson; logs: logs/fetch_districts_20251014_115926.log, logs/check_districts_20251014_115956.log.
  - [x] Map B (district choropleth) join dc_dist<->DIST_NUMC (ID: D-mapB) (owner: codex) - rendered districts choropleth with legend/tooltip; uses cached or remote boundaries.
  - [x] Map A (points) minimal render + bbox-limited fetch (ID: D-mapA) (owner: codex) - clustered points with bbox+time window; unclustered hidden when >20k; debounce and retry guards.
  - [x] Charts: monthly series (A vs citywide) (ID: E-series) (owner: codex) - chart.js installed; build passed.
  - [x] Charts: Top-N offenses (buffer A) (ID: E-topn) (owner: codex)
  - [x] Charts: 7x24 heatmap (buffer A) (ID: E-7x24) (owner: codex)
  - [x] Controls: address + radius + 3/6/12 months (ID: F-controls1) (owner: codex)
  - [x] Controls: offense groups + drilldown skeleton (ID: F-controls2) (owner: codex)
  - [x] AB compare card (total/per10k/top3/30d delta) (ID: G-compare) (owner: codex) - Compare A uses live count/top3/30d and per-10k (tracts); see logs/compare_queries_*.log.
  - [x] README: sources + limitations + disclaimers (ID: H-readme) (owner: codex) - README expanded with sources, limitations, run steps, caching/performance, compare A/B semantics.
  - [x] V1.1: cache ACS to src/data/acs_tracts_2023_pa101.json (ID: I-acs) (owner: codex) - cached to src/data/acs_tracts_2023_pa101.json; log: logs/fetch_acs_tracts_*.log. Tracts GeoJSON cache attempted: logs/fetch_tracts_*.log.
  - [x] V1.1: Tracts view + ACS join + per-10k (ID: I-tracts) (owner: codex) - tracts choropleth wired; ACS merged; per-10k toggle; population<500 masked.

## Blocked
*(codex writes reason + suggestion)*

