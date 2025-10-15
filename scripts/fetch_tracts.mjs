#!/usr/bin/env node
// Robust tracts GeoJSON fetch with multi-endpoint fallback and normalization.

import fs from 'node:fs/promises';
import path from 'node:path';

const ENDPOINTS = [
  // Esri USA Census Tracts (Philadelphia)
  "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0/query?where=STATE_FIPS='42'%20AND%20COUNTY_FIPS='101'&outFields=FIPS,STATE_FIPS,COUNTY_FIPS,TRACT_FIPS,NAME,POPULATION_2020&returnGeometry=true&f=geojson",
  // TIGERweb fallback (ACS 2023 tracts)
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2023/MapServer/8/query?where=STATE=42%20AND%20COUNTY=101&outFields=STATE,COUNTY,TRACT,NAME,ALAND,AWATER&returnGeometry=true&f=geojson",
];

const OUT_DIR = path.join('public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'tracts_phl.geojson');

const delays = [2000, 4000, 8000];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJson(url) { const r = await fetch(url, { headers: { accept: 'application/geo+json,application/json' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

function validFeature(f) {
  return f && f.geometry && f.properties && (
    'STATE_FIPS' in f.properties || 'STATE' in f.properties
  ) && (
    'COUNTY_FIPS' in f.properties || 'COUNTY' in f.properties
  ) && (
    'TRACT_FIPS' in f.properties || 'TRACT' in f.properties
  );
}

function normalizeFeature(f) {
  const p = { ...(f.properties || {}) };
  const props = {
    STATE_FIPS: p.STATE_FIPS ?? p.STATE ?? p.STATEFP ?? null,
    COUNTY_FIPS: p.COUNTY_FIPS ?? p.COUNTY ?? p.COUNTYFP ?? null,
    TRACT_FIPS: p.TRACT_FIPS ?? p.TRACT ?? p.TRACTCE ?? null,
    NAME: p.NAME ?? p.NAMELSAD ?? '',
    POPULATION_2020: p.POPULATION_2020 ?? p.POP ?? null,
  };
  return { type: 'Feature', geometry: f.geometry, properties: props };
}

function validateAndNormalize(geo, endpoint) {
  if (!geo || geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
    throw new Error(`Invalid GeoJSON from ${endpoint}: bad type/features`);
  }
  if (geo.features.length <= 10) {
    throw new Error(`Invalid GeoJSON from ${endpoint}: too few features (${geo.features.length})`);
  }
  const allValid = geo.features.every(validFeature);
  if (!allValid) {
    throw new Error(`Invalid GeoJSON from ${endpoint}: missing tract properties`);
  }
  const features = geo.features.map(normalizeFeature);
  return { type: 'FeatureCollection', features };
}

async function tryEndpoint(url, log) {
  for (let i = 0; i < delays.length; i++) {
    try {
      const raw = await fetchJson(url);
      const norm = validateAndNormalize(raw, url);
      return norm;
    } catch (e) {
      const last = i === delays.length - 1;
      log.push(`[${new Date().toISOString()}] ${url} attempt ${i + 1} failed: ${e?.message || e}`);
      if (last) break; else await sleep(delays[i]);
    }
  }
  return null;
}

async function main() {
  const log = [];
  for (const url of ENDPOINTS) {
    const data = await tryEndpoint(url, log);
    if (data) {
      await fs.mkdir(OUT_DIR, { recursive: true });
      await fs.writeFile(OUT_FILE, JSON.stringify(data));
      log.push(`[${new Date().toISOString()}] Saved ${OUT_FILE} (${data.features.length} features) from ${url}`);
      break;
    }
  }
  if (!(await exists(OUT_FILE))) {
    log.push('WARN: All endpoints exhausted; no tracts cache written. Runtime will fallback.');
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const logPath = path.join('logs', `fetch_tracts_${ts}.log`);
  await fs.mkdir('logs', { recursive: true });
  await fs.writeFile(logPath, log.join('\n'));
  console.log(`Wrote log ${logPath}`);
}

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

main();
