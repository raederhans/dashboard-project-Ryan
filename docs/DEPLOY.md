# Deployment & Run Modes

> **⚠️ CRITICAL WARNING:** Do NOT open `index.html` directly in your browser (file:// protocol). This application REQUIRES Vite's dev server or a production build to function. See "What Does NOT Work" section below.

This document explains how to run the Crime Dashboard application in different modes and why certain methods work while others fail.

## Prerequisites

```bash
npm install
```

Ensure all dependencies are installed before running any mode.

---

## Development Mode (Recommended for Local Work)

**Command:**
```bash
npm run dev
```

**What it does:**
- Starts Vite development server on `http://localhost:5173`
- Enables hot module replacement (HMR) for instant updates
- Serves with proper ESM module resolution
- Injects Vite client for dev tools

**Why it's required:**
- The application uses **ES modules** (`import`/`export`) extensively
- Vite handles module path resolution (e.g., `/src/main.js` → actual file)
- Bare module specifiers like `'maplibre-gl'` need bundler resolution
- `@turf/turf`, `dayjs`, `chart.js` cannot be loaded without a bundler

**Access:**
- Open browser to `http://localhost:5173/`
- Map should render immediately with basemap tiles
- Console should be error-free (check DevTools)

---

## Production Preview Mode

**Command:**
```bash
npm run build
npm run preview
```

**What it does:**
- `build`: Bundles all code into optimized static assets in `dist/`
- `preview`: Serves the `dist/` folder on `http://localhost:4173`

**Why it's different from dev:**
- Production bundle is minified and tree-shaken
- All imports are resolved to bundled chunks
- No HMR or dev tools overhead
- Simulates how the app would behave on a static host (Netlify, Vercel, etc.)

**Current status (2025-10-15 15:26):**
- ⚠️ **Build currently fails** with HTML inline proxy error
- **Root cause:** `vite.config.js` sets `root: 'public'`, but Vite cannot process inline `<style>` tags in `public/` directory
- **Fix required:** Remove `vite.config.js` `root` setting and move `/public/index.html` → `/index.html` (project root)
- See [logs/blocker_vite_structure_20251015_152614.md](../logs/blocker_vite_structure_20251015_152614.md) for details

**Access (once fixed):**
- Open browser to `http://localhost:4173/`

---

## ❌ What Does NOT Work: Raw File Opening

**DO NOT:**
- Double-click `index.html` to open in browser (`file:///C:/Users/.../index.html`)
- Use arbitrary static servers like `python -m http.server` or `npx serve .`

**Why it fails:**

1. **ESM module path resolution breaks:**
   - Browser sees `<script type="module" src="/src/main.js"></script>`
   - Without Vite, browser looks for `file:///src/main.js` (doesn't exist)
   - Bare imports like `import maplibregl from 'maplibre-gl'` fail (browser can't resolve node_modules)

2. **CORS issues with local files:**
   - `file://` protocol cannot load modules or make XHR/fetch requests
   - External assets (OSM tiles, API calls) blocked

3. **No bundler = no dependency resolution:**
   - `@turf/turf`, `dayjs`, `chart.js` are installed in `node_modules/`
   - Browser has no way to find them without import maps or a bundler

**Error you'll see:**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```
or
```
Uncaught TypeError: Failed to resolve module specifier "maplibre-gl"
```

---

## Recommended Workflow

### For Development:
```bash
npm run dev
```
Leave it running, edit code, browser auto-refreshes.

### For Testing Production Build:
```bash
npm run build
npm run preview
```
Check that minified bundle works as expected.

### For Deployment:
1. Run `npm run build` locally or in CI
2. Upload `dist/` folder to static host (Netlify, Vercel, GitHub Pages, etc.)
3. Host must serve `dist/index.html` at root and resolve routes correctly

---

## Troubleshooting

### Map doesn't appear in dev mode:
- Check browser console for errors
- Verify `#map` div has nonzero height (should be `position: absolute; inset: 0`)
- Ensure maplibre-gl.css is loaded: `<link href="https://unpkg.com/maplibre-gl@^4.5.0/dist/maplibre-gl.css" rel="stylesheet" />`

### Build fails with "HTML proxy" error:
- **Cause (Current):** `vite.config.js` has `root: 'public'`, but inline `<style>` tags cannot be processed in `public/` directory
- **Fix:** Remove `root: 'public'` from `vite.config.js` and move `/public/index.html` → `/index.html`. Update script tag from `../src/main.js` to `/src/main.js`
- **Why:** Vite expects `index.html` at project root. The `public/` folder is for static assets copied as-is, not processed HTML

### Preview mode shows blank page:
- Check `dist/index.html` exists
- Check browser console for 404s on assets
- Ensure base path in `vite.config.js` matches deployment URL

### API calls fail in production:
- Check CORS headers on API server
- Verify API URLs are absolute (not relative `http://localhost:3000`)
- Consider environment variables for API base URL

---

## Quick Checklist: Dev vs Preview

**Before you start:**
- [ ] `npm install` completed successfully
- [ ] `index.html` is in **project root** (NOT in `public/`)
- [ ] `vite.config.js` does NOT set `root: 'public'`
- [ ] Script tag uses `/src/main.js` (absolute path, NOT `../src/main.js`)

**For development:**
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173/`
- [ ] Map renders with controls
- [ ] No console errors

**For production preview:**
- [ ] Run `npm run build` (must succeed without errors)
- [ ] Run `npm run preview`
- [ ] Open `http://localhost:4173/`
- [ ] Verify all features work in minified bundle

---

## Summary Table

| Mode | Command | Use Case | ESM Support | Hot Reload | Minified |
|------|---------|----------|-------------|------------|----------|
| **Dev** | `npm run dev` | Local development | ✅ | ✅ | ❌ |
| **Preview** | `npm run build && npm run preview` | Test production build | ✅ | ❌ | ✅ |
| **Raw File** | Open `index.html` | ❌ NOT SUPPORTED | ❌ | ❌ | ❌ |

---

For questions or issues, see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) or check the console logs in `logs/`.
