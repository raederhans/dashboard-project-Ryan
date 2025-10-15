import { CARTO_SQL_BASE } from "../config.js";
import { fetchJson } from "../utils/http.js";
import * as Q from "../utils/sql.js";

/**
 * Fetch crime point features for Map A.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {xmin:number, ymin:number, xmax:number, ymax:number}} [params.bbox] - Map bounding box in EPSG:3857.
 * @returns {Promise<object>} GeoJSON FeatureCollection.
 */
export async function fetchPoints({ start, end, types, bbox }) {
  const sql = Q.buildCrimePointsSQL({ start, end, types, bbox });
  const url = `${CARTO_SQL_BASE}?format=GeoJSON&q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Fetch citywide monthly totals.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {string[]} [params.types] - Optional offense filters.
 * @returns {Promise<object>} Aggregated results keyed by month.
 */
export async function fetchMonthlySeriesCity({ start, end, types }) {
  const sql = Q.buildMonthlyCitySQL({ start, end, types });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Fetch buffer-based monthly totals for comparison.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {x:number, y:number}} params.center3857 - Buffer center in EPSG:3857.
 * @param {number} params.radiusM - Buffer radius in meters.
 * @returns {Promise<object>} Aggregated results keyed by month.
 */
export async function fetchMonthlySeriesBuffer({
  start,
  end,
  types,
  center3857,
  radiusM,
}) {
  const sql = Q.buildMonthlyBufferSQL({
    start,
    end,
    types,
    center3857,
    radiusM,
  });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Fetch top-N offense categories within buffer A.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {number[] | {x:number, y:number}} params.center3857 - Buffer center in EPSG:3857.
 * @param {number} params.radiusM - Buffer radius in meters.
 * @param {number} [params.limit] - Optional limit override.
 * @returns {Promise<object>} Aggregated offense counts.
 */
export async function fetchTopTypesBuffer({
  start,
  end,
  center3857,
  radiusM,
  limit,
}) {
  const sql = Q.buildTopTypesSQL({
    start,
    end,
    center3857,
    radiusM,
    limit,
  });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Fetch 7x24 heatmap aggregates for buffer A.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {x:number, y:number}} params.center3857 - Buffer center in EPSG:3857.
 * @param {number} params.radiusM - Buffer radius in meters.
 * @returns {Promise<object>} Aggregated hour/day buckets.
 */
export async function fetch7x24Buffer({
  start,
  end,
  types,
  center3857,
  radiusM,
}) {
  const sql = Q.buildHeatmap7x24SQL({
    start,
    end,
    types,
    center3857,
    radiusM,
  });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Fetch crime counts aggregated by police district.
 * @param {object} params
 * @param {string} params.start - Inclusive ISO start datetime.
 * @param {string} params.end - Exclusive ISO end datetime.
 * @param {string[]} [params.types] - Optional offense filters.
 * @returns {Promise<object>} Aggregated district totals.
 */
export async function fetchByDistrict({ start, end, types }) {
  const sql = Q.buildByDistrictSQL({ start, end, types });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  return fetchJson(url);
}

/**
 * Count incidents within a buffer A for the given time window and optional types.
 * @param {{start:string,end:string,types?:string[],center3857:[number,number]|{x:number,y:number},radiusM:number}} params
 * @returns {Promise<number>} total count
 */
export async function fetchCountBuffer({ start, end, types, center3857, radiusM }) {
  const sql = Q.buildCountBufferSQL({ start, end, types, center3857, radiusM });
  const url = `${CARTO_SQL_BASE}?q=${encodeURIComponent(sql)}`;
  const json = await fetchJson(url);
  const rows = json?.rows;
  const n = Array.isArray(rows) && rows.length > 0 ? Number(rows[0]?.n) || 0 : 0;
  return n;
}
