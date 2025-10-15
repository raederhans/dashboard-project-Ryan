#!/usr/bin/env node
// Download Philadelphia 2020 census tracts GeoJSON and cache under public/data.

import fs from 'node:fs/promises';
import path from 'node:path';

const URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0/query?where=STATE_FIPS='42'%20AND%20COUNTY_FIPS='101'&outFields=FIPS,STATE_FIPS,COUNTY_FIPS,TRACT_FIPS,NAME,POPULATION_2020&f=geojson";
const OUT_DIR = path.join('public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'tracts_phl.geojson');

const delays = [2000, 4000, 8000];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function countFeatures(geo) { return (geo && geo.type === 'FeatureCollection' && Array.isArray(geo.features)) ? geo.features.length : -1; }

async function fetchJson(url) { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

async function attempt() {
  const data = await fetchJson(URL);
  const n = countFeatures(data);
  if (n <= 0) throw new Error('Invalid GeoJSON');
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(data));
  console.log(`Saved ${OUT_FILE} (${n} features)`);
}

async function main() {
  for (let i = 0; i < delays.length; i++) {
    try { await attempt(); return; }
    catch (e) {
      const last = i === delays.length - 1;
      console.warn(`Attempt ${i + 1} failed: ${e?.message || e}`);
      if (last) { console.warn('WARN: tracts fetch exhausted. Runtime will fallback to live endpoint.'); return; }
      await sleep(delays[i]);
    }
  }
}

main();

