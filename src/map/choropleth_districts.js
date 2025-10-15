import { fetchPoliceDistrictsCachedFirst } from '../api/boundaries.js';
import { fetchByDistrict } from '../api/crime.js';
import { joinDistrictCountsToGeoJSON } from '../utils/join.js';

/**
 * Retrieve police districts and join aggregated counts.
 * @param {{start:string,end:string,types?:string[]}} params
 * @returns {Promise<object>} Joined GeoJSON FeatureCollection
 */
export async function getDistrictsMerged({ start, end, types }) {
  const geo = await fetchPoliceDistrictsCachedFirst();
  const resp = await fetchByDistrict({ start, end, types });
  const rows = Array.isArray(resp?.rows) ? resp.rows : resp;
  return joinDistrictCountsToGeoJSON(geo, rows);
}

