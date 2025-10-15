import { CARTO_SQL_BASE } from "../config.js";
import { fetchJson, logQuery } from "../utils/http.js";
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
  await logQuery('fetchPoints', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `format=GeoJSON&q=${encodeURIComponent(sql)}`,
    cacheTTL: 30_000,
  });
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
  await logQuery('fetchMonthlySeriesCity', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 300_000,
  });
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
  await logQuery('fetchMonthlySeriesBuffer', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 60_000,
  });
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
  await logQuery('fetchTopTypesBuffer', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 60_000,
  });
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
  await logQuery('fetch7x24Buffer', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 60_000,
  });
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
  await logQuery('fetchByDistrict', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 120_000,
  });
}

/**
 * Top offense types within a district code.
 */
export async function fetchTopTypesByDistrict({ start, end, types, dc_dist, limit = 5 }) {
  const sql = Q.buildTopTypesDistrictSQL({ start, end, types, dc_dist, limit });
  await logQuery('fetchTopTypesByDistrict', sql);
  return fetchJson(CARTO_SQL_BASE, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `q=${encodeURIComponent(sql)}`, cacheTTL: 60_000,
  });
}

/**
 * Count incidents within a buffer A for the given time window and optional types.
 * @param {{start:string,end:string,types?:string[],center3857:[number,number]|{x:number,y:number},radiusM:number}} params
 * @returns {Promise<number>} total count
 */
export async function fetchCountBuffer({ start, end, types, center3857, radiusM }) {
  const sql = Q.buildCountBufferSQL({ start, end, types, center3857, radiusM });
  await logQuery('fetchCountBuffer', sql);
  const json = await fetchJson(CARTO_SQL_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(sql)}`,
    cacheTTL: 30_000,
  });
  const rows = json?.rows;
  const n = Array.isArray(rows) && rows.length > 0 ? Number(rows[0]?.n) || 0 : 0;
  return n;
}
