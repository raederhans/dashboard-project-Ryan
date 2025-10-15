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
  try {
    const local = await fetchGeoJson("/data/tracts_phl.geojson");
    if (local && local.type === "FeatureCollection" && Array.isArray(local.features) && local.features.length > 0) {
      return local;
    }
  } catch (_) {
    // ignore and fallback
  }
  return fetchGeoJson(TRACTS_GEOJSON);
}
