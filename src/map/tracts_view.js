import { fetchTractsCachedFirst } from "../api/boundaries.js";
import { fetchTractStatsCachedFirst } from "../api/acs.js";
import { tractFeatureGEOID } from "../utils/geoids.js";
import { fetchJson } from "../utils/http.js";

/**
 * Merge tract features with ACS stats. Currently uses population as placeholder value,
 * with optional per-10k conversion and masking for population < 500.
 * @param {{per10k?:boolean}} opts
 * @returns {Promise<{geojson: object, values: number[]}>}
 */
export async function getTractsMerged({ per10k = false } = {}) {
  const gj = await fetchTractsCachedFirst();
  const stats = await fetchTractStatsCachedFirst();
  const map = new Map(stats.map((r) => [r.geoid, r]));
  const values = [];

  // Try to load precomputed tract counts if present
  let countsMap = null;
  try {
    const counts = await fetchJson('/src/data/tract_counts_last12m.json', { cacheTTL: 10 * 60_000, retries: 1, timeoutMs: 8000 });
    if (counts?.rows) {
      countsMap = new Map(counts.rows.map((r) => [r.geoid, Number(r.n) || 0]));
    }
  } catch {}

  for (const ft of gj.features || []) {
    const g = tractFeatureGEOID(ft);
    const row = map.get(g);
    let value = 0;
    if (countsMap && countsMap.has(g)) {
      value = countsMap.get(g) || 0;
    } else if (row) {
      // fallback placeholder: population
      value = row.pop || 0;
    }
    ft.properties.__geoid = g;
    ft.properties.__pop = row?.pop ?? null;
    ft.properties.value = per10k && row?.pop > 0 ? Math.round((value / row.pop) * 10000) : value;
    if (ft.properties.__pop === null || ft.properties.__pop < 500) ft.properties.__mask = true;
    values.push(ft.properties.value ?? 0);
  }

  return { geojson: gj, values };
}
