/**
 * Minimal shared state placeholder for forthcoming controls and maps.
 */
import dayjs from 'dayjs';
import { expandGroupsToCodes } from '../utils/types.js';

/**
 * @typedef {object} Store
 * @property {string|null} addressA
 * @property {string|null} addressB
 * @property {number} radius
 * @property {number} timeWindowMonths
 * @property {string[]} selectedGroups
 * @property {string[]} selectedTypes
 * @property {string} adminLevel
 * @property {any} mapBbox
 * @property {[number,number]|null} center3857
 * @property {() => {start:string,end:string}} getStartEnd
 * @property {() => {start:string,end:string,types:string[],center3857:[number,number]|null,radiusM:number}} getFilters
 * @property {(lng:number,lat:number) => void} setCenterFromLngLat
 */

export const store = /** @type {Store} */ ({
  addressA: null,
  addressB: null,
  radius: 400,
  timeWindowMonths: 6,
  selectedGroups: [],
  selectedTypes: [],
  adminLevel: 'districts',
  per10k: false,
  mapBbox: null,
  center3857: null,
  getStartEnd() {
    const end = dayjs().format('YYYY-MM-DD');
    const start = dayjs().subtract(this.timeWindowMonths || 6, 'month').format('YYYY-MM-DD');
    return { start, end };
  },
  getFilters() {
    const { start, end } = this.getStartEnd();
    const types = (this.selectedTypes && this.selectedTypes.length)
      ? this.selectedTypes.slice()
      : expandGroupsToCodes(this.selectedGroups || []);
    return { start, end, types, center3857: this.center3857, radiusM: this.radius };
  },
  setCenterFromLngLat(lng, lat) {
    const R = 6378137;
    const x = R * (lng * Math.PI / 180);
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
    this.center3857 = [x, y];
  },
});
