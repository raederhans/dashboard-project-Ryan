# Changelog

All notable changes to this project will be documented in this file.

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

## 2025-10-15 12:19 — Attempted Build Fixes

2025-10-15 16:13:00Z - Added offense groups fixer/validator; normalized JSON.
2025-10-15T12:14:13 - Removed root index.html; added vite.config.js for public/ root; updated public/index.html script path.
2025-10-15T12:16:53 - Fixed invalid optional chaining in main.js; added instant radius overlay via buffer_overlay; panel radius input wired.
2025-10-15T12:19:45 - Removed root index.html; configured Vite root=public; build succeeded(?); preview logs captured.
2025-10-15T12:19:45 - Added buffer_overlay and panel radius input handler for instant circle updates.
