# Known Issues & Limitations

---

## 🔴 Active Blockers

### BLOCKER: Vite Project Structure — Build Fails (2025-10-15 15:26)

**Status:** ❌ ACTIVE — Prevents production build

**Problem:**
`vite.config.js` sets `root: 'public'`, attempting to treat `public/` as the project root. However, Vite's HTML inline proxy cannot process `<style>` tags when `index.html` is in `public/` directory.

**Error:**
```
[vite:html-inline-proxy] Could not load .../public/index.html?html-proxy&inline-css&index=0.css
No matching HTML proxy module found
```

**Impact:**
- ❌ `npm run build` fails
- ❌ Cannot generate production bundle
- ❌ Cannot test with `npm run preview`
- ❌ Cannot deploy to production
- ✅ `npm run dev` still works (dev mode more forgiving)

**Evidence:** [logs/blocker_vite_structure_20251015_152614.md](../logs/blocker_vite_structure_20251015_152614.md)

**Fix Required:**
1. Move `/public/index.html` → `/index.html` (project root)
2. Edit line 129: change `src="../src/main.js"` to `src="/src/main.js"`
3. Remove `root: 'public'` from `vite.config.js` (OR delete file entirely if only contains root config)
4. Run `npm run build` to verify

**Resolution:** ⏳ Pending codex fix

---

## ✅ Resolved Issues

### offense_groups.json Structure (RESOLVED 2025-10-15 16:13)
**Was:** `"Property": "Thefts"` (STRING)
**Now:** `"Property": ["Thefts"]` (ARRAY)
**Status:** ✅ FIXED via scripts/fix_offense_groups.mjs
**Verification:** [logs/fixes_already_applied_20251015_152614.md](../logs/fixes_already_applied_20251015_152614.md)

### Duplicate index.html (RESOLVED 2025-10-15 12:14)
**Was:** Both `/index.html` AND `/public/index.html` existed
**Now:** Only `/public/index.html` remains (but needs to move to root - see active blocker)
**Status:** ⚠️ PARTIALLY FIXED — Duplicate removed, but location still wrong

---

## ⚠️ Performance & Data Issues

### Tracts GeoJSON Cache Unreliable
- Tracts GeoJSON cache endpoints can be flaky
- Robust multi-endpoint fallback implemented
- Runtime fallback to remote fetch adds 2-3s latency
- **Mitigation:** Use "Districts" mode for faster rendering

### API Rate Limits
- CARTO SQL API may rate-limit (429) and transiently fail (5xx)
- HTTP client includes retry with backoff and de-duplication
- Consider raising TTLs in production for fewer API calls

---

## ℹ️ Known Limitations

### Address Input (A) Not Functional
- Text input exists but no geocoding API integrated
- Only "Select on map" button works
- **Workaround:** Use map selection instead of address entry

### Compare B Not Implemented
- Compare card shows location A only
- No UI for setting second location (B)
- **Workaround:** Use single-location analysis with charts

### Browser Compatibility
- Requires modern browser with ES module support
- Chrome 61+, Firefox 60+, Safari 11+, Edge 79+
- Internet Explorer NOT supported

---

**Last updated:** 2025-10-15 15:26
**Next review:** After Vite structure blocker fixed
