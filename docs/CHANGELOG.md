# Changelog

All notable changes to this project will be documented in this file.

## 2025-10-20 11:07 — Acceptance Test PASS

**Status:** ✅ All blockers resolved, production deployment ready

### Tests Passed
- ✅ **Dev mode:** `npm run dev` → Server starts, HTTP 200 OK ([logs/acc_dev_20251020_110731.log](../logs/acc_dev_20251020_110731.log))
- ✅ **Build:** `npm run build` → Succeeds without errors ([logs/acc_build_20251020_110731.log](../logs/acc_build_20251020_110731.log))
- ✅ **Preview:** `npm run preview` → Server starts, HTTP 200 OK ([logs/acc_http_preview_20251020_110731_retry.log](../logs/acc_http_preview_20251020_110731_retry.log))

### Structure Verified
- ✅ `/index.html` at project root (moved from public/)
- ✅ `public/` contains only static assets (police_districts.geojson)
- ✅ `vite.config.js` simplified to `{ build: { outDir: 'dist' } }` (no root override)
- ✅ Script tag uses absolute path `/src/main.js`

### Code Verified
- ✅ `offense_groups.json` — All values are arrays (Property: ["Thefts"])
- ✅ Point guard active — `MAX_UNCLUSTERED = 20000` with "Too many points" banner
- ✅ Buffer overlay — `turf.circle` creates immediate visual feedback
- ✅ Panel debounce — 300ms delay on data refresh

### Artifacts Status
- ⚠️ `public/data/tracts_phl.geojson` — Not present (remote fallback +2-3s)
- ⚠️ `src/data/tract_counts_last12m.json` — Not present (live aggregation slower)
- **Recommendation:** Run `node scripts/fetch_tracts.mjs` and `node scripts/precompute_tract_counts.mjs` periodically

### Updated Documentation
- [docs/KNOWN_ISSUES.md](KNOWN_ISSUES.md) — Moved Vite blocker to Resolved, updated timestamp
- [docs/CHANGELOG.md](CHANGELOG.md) — This entry

---

## 2025-10-15 15:26 local — Diagnostic Re-Check + Blocker Update

### Summary
Re-validated the dashboard after initial blocker fixes were attempted. Found that while `offense_groups.json` structure is now correct and duplicate `index.html` removed, a **new blocker emerged**: Vite's `root: 'public'` configuration causes HTML inline proxy failures during build.

### Fixes Already Applied (Between First and Second Diagnostic)
1. ✅ **offense_groups.json structure normalized** — "Property" key changed from STRING to ARRAY `["Thefts"]` (line 10-12)
2. ✅ **Root index.html removed** — Duplicate `/index.html` deleted, only `/public/index.html` remains
3. ⚠️ **vite.config.js added** — Configured `root: 'public'` to accommodate index.html location, but this causes build failures

### Current Blocker (Active)
**Build still fails** with HTML inline proxy error:
```
[vite:html-inline-proxy] Could not load .../public/index.html?html-proxy&inline-css&index=0.css
```

**Root Cause:** Vite's `root: 'public'` configuration is incompatible with HTML inline style processing. The `public/` directory is intended for static assets copied as-is, not processed source files.

**Evidence:** [logs/blocker_vite_structure_20251015_152614.md](../logs/blocker_vite_structure_20251015_152614.md)

**Fix Required:** Remove `vite.config.js` `root` setting and move `/public/index.html` → `/index.html` (project root). Update script path from `../src/main.js` to `/src/main.js`.

### Documentation Updates (This Session)
- **logs/blocker_vite_structure_20251015_152614.md** — Detailed evidence of Vite structure blocker with file locations, error messages, and fix steps
- **logs/fixes_already_applied_20251015_152614.md** — Status report on offense_groups.json and duplicate HTML fixes
- **logs/diag_build_20251015_152614.log** — Build failure log showing HTML proxy error
- **docs/CHANGELOG.md** — Updated with current blocker status and fix timeline

### Links to Logs
- Build failure: [logs/diag_build_20251015_152614.log](../logs/diag_build_20251015_152614.log)
- Vite structure blocker: [logs/blocker_vite_structure_20251015_152614.md](../logs/blocker_vite_structure_20251015_152614.md)
- Fixes timeline: [logs/fixes_already_applied_20251015_152614.md](../logs/fixes_already_applied_20251015_152614.md)

---

## 2025-10-15 16:04 — Static Repository Audit

**Type:** Read-only structural analysis (no code execution, no source edits)

### Deliverables
- **[docs/STRUCTURE_AUDIT.md](STRUCTURE_AUDIT.md)** — Comprehensive audit report: Vite structure verdict (3 blockers), subsystem mapping (controls/maps/charts/API/SQL), risks table, data artifact validation, call paths
- **[docs/FILE_MAP.md](FILE_MAP.md)** — Quick reference "What to Edit" index for common changes (offense groups, colors, TTLs, legends, SQL, controls, etc.)
- **[docs/EDIT_POINTS.md](EDIT_POINTS.md)** — Step-by-step how-to guide with 12 example scenarios (add group, change colors, adjust cache, add popup field, etc.) — all patches are suggestions, not applied
- **[logs/STATIC_AUDIT_20251015_160419.md](../logs/STATIC_AUDIT_20251015_160419.md)** — Raw audit notes: inventory, trees, grep results, JSON validation, orphan module checks

### Key Findings
- ✅ offense_groups.json valid (all arrays)
- ✅ ACS tract data loaded (381 tracts)
- ✅ SQL SRID consistent (EPSG:3857 throughout)
- 🔴 3 BLOCKERS: Vite structure violated (`root: 'public'`, HTML in wrong location, relative script path)
- ⚠️ Missing: tracts GeoJSON cache, precomputed tract counts

**No source files modified in this session.**

---

## 2025-10-15 12:19 — Attempted Build Fixes

2025-10-15 16:13:00Z - Added offense groups fixer/validator; normalized JSON.
2025-10-15T12:14:13 - Removed root index.html; added vite.config.js for public/ root; updated public/index.html script path.
2025-10-15T12:16:53 - Fixed invalid optional chaining in main.js; added instant radius overlay via buffer_overlay; panel radius input wired.
2025-10-15T12:19:45 - Removed root index.html; configured Vite root=public; build succeeded(?); preview logs captured.
2025-10-15T12:19:45 - Added buffer_overlay and panel radius input handler for instant circle updates.
2025-10-20T11:01:59.5319407-04:00 - Vite structure fixed (single /index.html at root; simplified vite.config.js).
2025-10-20T11:02:28.1260704-04:00 - Build PASS with root index.html; preview check to follow.
2025-10-20T11:03:28.7172823-04:00 - Tracts cache fetch attempted; endpoints flaky (no local cache written).
2025-10-20T11:03:50.1000618-04:00 - Precompute script ran; output missing or partial (see logs).
2025-10-20T11:04:10.8518999-04:00 - Added >20k points guard constant and banner message; prevents freezes when zoomed out.
2025-10-20T11:04:25.7628502-04:00 - README Quick Start updated for root index.html and dev/preview steps.
2025-10-20T11:04:44.9790206-04:00 - Added docs/DEPLOY.md with Quick Start note.
2025-10-20T12:08:43.8832032-04:00 - Coverage probe script added and executed; coverage log written.
2025-10-20T12:09:39.6438250-04:00 - Default time window aligned to dataset coverage (auto from MAX date).
2025-10-20T12:09:39.6468266-04:00 - Charts guarded until center is chosen (status tip shown).
2025-10-20T12:09:39.6491974-04:00 - Districts empty-window banner implemented.
