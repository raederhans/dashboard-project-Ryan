import { PD_GEOJSON, TRACTS_GEOJSON } from "../config.js";
import { fetchGeoJson } from "../utils/http.js";

/**
 * Retrieve police district boundaries.
 * @returns {Promise<object>} GeoJSON FeatureCollection.
 */
export async function fetchPoliceDistricts() {
  return fetchGeoJson(PD_GEOJSON);
}

/**
 * Retrieve census tract boundaries filtered to Philadelphia.
 * @returns {Promise<object>} GeoJSON FeatureCollection.
 */
export async function fetchTracts() {
  return fetchGeoJson(TRACTS_GEOJSON);
}

/**
 * Cache-first loader for police districts: tries local cached copy
 * at "/data/police_districts.geojson" before falling back to remote.
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
export async function fetchPoliceDistrictsCachedFirst() {
  // Try cached file served by Vite or static hosting
  try {
    const local = await fetchGeoJson("/data/police_districts.geojson");
    if (
      local &&
      local.type === "FeatureCollection" &&
      Array.isArray(local.features) &&
      local.features.length > 0
    ) {
      return local;
    }
  } catch (_) {
    // swallow and fallback to remote
  }

  // Fallback to live endpoint
  return fetchGeoJson(PD_GEOJSON);
}

/**
 * Cache-first loader for census tracts: tries local cached copy
 * at "/data/tracts_phl.geojson" before falling back to remote.
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
export async function fetchTractsCachedFirst() {
  // memoize for session
  if (fetchTractsCachedFirst._cache) return fetchTractsCachedFirst._cache;

  // 1) Try local cache under /public
  try {
    const local = await fetchGeoJson("/data/tracts_phl.geojson", { cacheTTL: 5 * 60_000 });
    if (isValidTracts(local)) {
      fetchTractsCachedFirst._cache = local;
      return local;
    }
  } catch {}

  // 2) Try endpoints in order, normalize props
  const ENDPOINTS = [
    "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0/query?where=STATE_FIPS='42'%20AND%20COUNTY_FIPS='101'&outFields=FIPS,STATE_FIPS,COUNTY_FIPS,TRACT_FIPS,NAME,POPULATION_2020&returnGeometry=true&f=geojson",
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2023/MapServer/8/query?where=STATE=42%20AND%20COUNTY=101&outFields=STATE,COUNTY,TRACT,NAME,ALAND,AWATER&returnGeometry=true&f=geojson",
  ];
  for (const url of ENDPOINTS) {
    try {
      const raw = await fetchGeoJson(url, { cacheTTL: 10 * 60_000 });
      if (isValidTracts(raw)) {
        const normalized = { type: 'FeatureCollection', features: raw.features.map(normalizeTractFeature) };
        fetchTractsCachedFirst._cache = normalized;
        return normalized;
      }
    } catch {}
  }

  // 3) Fallback to canonical TRACTS_GEOJSON
  const fallback = await fetchGeoJson(TRACTS_GEOJSON, { cacheTTL: 10 * 60_000 });
  fetchTractsCachedFirst._cache = fallback;
  return fallback;
}

function isValidTracts(geo) {
  return geo && geo.type === 'FeatureCollection' && Array.isArray(geo.features) && geo.features.length > 10;
}

function normalizeTractFeature(f) {
  const p = { ...(f.properties || {}) };
  return {
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      STATE_FIPS: p.STATE_FIPS ?? p.STATE ?? p.STATEFP ?? null,
      COUNTY_FIPS: p.COUNTY_FIPS ?? p.COUNTY ?? p.COUNTYFP ?? null,
      TRACT_FIPS: p.TRACT_FIPS ?? p.TRACT ?? p.TRACTCE ?? null,
      NAME: p.NAME ?? p.NAMELSAD ?? '',
      POPULATION_2020: p.POPULATION_2020 ?? p.POP ?? null,
    },
  };
}
