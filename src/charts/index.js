// Placeholder for chart modules (time series, top-N, and heatmap views).
import dayjs from 'dayjs';
import { renderMonthly } from './line_monthly.js';
import { renderTopN } from './bar_topn.js';
import { render7x24 } from './heat_7x24.js';
import {
  fetchMonthlySeriesCity,
  fetchMonthlySeriesBuffer,
  fetchTopTypesBuffer,
  fetch7x24Buffer,
} from '../api/crime.js';

function byMonthRows(rows) {
  return (rows || []).map((r) => ({ m: dayjs(r.m).format('YYYY-MM'), n: Number(r.n) || 0 }));
}

function buildMatrix(dowHrRows) {
  const m = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const r of dowHrRows || []) {
    const d = Number(r.dow);
    const h = Number(r.hr);
    const n = Number(r.n) || 0;
    if (d >= 0 && d <= 6 && h >= 0 && h <= 23) m[d][h] = n;
  }
  return m;
}

/**
 * Fetch and render all charts using the provided filters.
 * @param {{start:string,end:string,types?:string[],center3857:[number,number],radiusM:number}} params
 */
export async function updateAllCharts({ start, end, types = [], center3857, radiusM }) {
  try {
    const [city, buf, topn, heat] = await Promise.all([
      fetchMonthlySeriesCity({ start, end, types }),
      fetchMonthlySeriesBuffer({ start, end, types, center3857, radiusM }),
      fetchTopTypesBuffer({ start, end, center3857, radiusM, limit: 12 }),
      fetch7x24Buffer({ start, end, types, center3857, radiusM }),
    ]);

    const cityRows = Array.isArray(city?.rows) ? city.rows : city;
    const bufRows = Array.isArray(buf?.rows) ? buf.rows : buf;
    const topRows = Array.isArray(topn?.rows) ? topn.rows : topn;
    const heatRows = Array.isArray(heat?.rows) ? heat.rows : heat;

    // Monthly line
    const monthlyEl = document.getElementById('chart-monthly');
    const monthlyCtx = monthlyEl && monthlyEl.getContext ? monthlyEl.getContext('2d') : null;
    if (!monthlyCtx) throw new Error('chart canvas missing: #chart-monthly');
    renderMonthly(monthlyCtx, byMonthRows(cityRows), byMonthRows(bufRows));

    // Top-N bar
    const topEl = document.getElementById('chart-topn');
    const topCtx = topEl && topEl.getContext ? topEl.getContext('2d') : null;
    if (!topCtx) throw new Error('chart canvas missing: #chart-topn');
    renderTopN(topCtx, topRows);

    // 7x24 heat scatter
    const heatEl = document.getElementById('chart-7x24');
    const heatCtx = heatEl && heatEl.getContext ? heatEl.getContext('2d') : null;
    if (!heatCtx) throw new Error('chart canvas missing: #chart-7x24');
    render7x24(heatCtx, buildMatrix(heatRows));
  } catch (e) {
    console.error(e);
    const pane = document.getElementById('charts') || document.body;
    const status = document.getElementById('charts-status') || (() => {
      const d = document.createElement('div');
      d.id = 'charts-status';
      d.style.cssText = 'position:absolute;right:16px;top:16px;padding:8px 12px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1);background:#fff;font:14px/1.4 system-ui';
      pane.appendChild(d);
      return d;
    })();
    status.innerText = 'Charts unavailable: ' + (e.message || e);
    throw e;
  }
}
