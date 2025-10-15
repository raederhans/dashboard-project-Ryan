import './style.css';
import dayjs from 'dayjs';
import { initMap } from './map/initMap.js';
import { getDistrictsMerged } from './map/choropleth_districts.js';
import { renderDistrictChoropleth } from './map/render_choropleth.js';
import { drawLegend } from './map/ui_legend.js';
import { attachHover } from './map/ui_tooltip.js';
import { wirePoints } from './map/wire_points.js';
import { updateAllCharts } from './charts/index.js';
import { store } from './state/store.js';
import { initPanel } from './ui/panel.js';
import { refreshPoints } from './map/points.js';
import { updateCompare } from './compare/card.js';
import { getTractsMerged } from './map/tracts_view.js';
import { renderTractsChoropleth } from './map/render_choropleth_tracts.js';

window.__dashboard = {
  setChoropleth: (/* future hook */) => {},
};

window.addEventListener('DOMContentLoaded', async () => {
  const map = initMap();

  try {
    // Fixed 6-month window demo
    const end = dayjs().format('YYYY-MM-DD');
    const start = dayjs().subtract(6, 'month').format('YYYY-MM-DD');

    // Persist center for buffer-based charts
    const c = map.getCenter();
    store.setCenterFromLngLat(c.lng, c.lat);
    const merged = await getDistrictsMerged({ start, end });

    map.on('load', () => {
      const { breaks, colors } = renderDistrictChoropleth(map, merged);
      drawLegend(breaks, colors, '#legend');
      attachHover(map, 'districts-fill');
    });
  } catch (err) {
    console.warn('Choropleth demo failed:', err);
  }

  // Wire points layer refresh with fixed 6-month filters for now
  wirePoints(map, { getFilters: () => store.getFilters() });

  // Charts: use same 6-month window and a default buffer at map center
  try {
    const { start, end, types, center3857, radiusM } = store.getFilters();
    await updateAllCharts({ start, end, types, center3857, radiusM });
  } catch (err) {
    console.warn('Charts failed to render:', err);
    const pane = document.getElementById('charts') || document.body;
    const status = document.getElementById('charts-status') || (() => {
      const d = document.createElement('div');
      d.id = 'charts-status';
      d.style.cssText = 'position:absolute;right:16px;top:16px;padding:8px 12px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.1);background:#fff;font:14px/1.4 system-ui';
      pane.appendChild(d);
      return d;
    })();
    status.innerText = 'Charts unavailable: ' + (err.message || err);
  }

  // Controls panel
  async function refreshAll() {
    const { start, end, types } = store.getFilters();
    try {
      if (store.adminLevel === 'tracts') {
        const merged = await getTractsMerged({ per10k: store.per10k });
        const { breaks, colors } = renderTractsChoropleth(map, merged);
        drawLegend(breaks, colors, '#legend');
      } else {
        const merged = await getDistrictsMerged({ start, end, types });
        const { breaks, colors } = renderDistrictChoropleth(map, merged);
        drawLegend(breaks, colors, '#legend');
      }
    } catch (e) {
      console.warn('Boundary refresh failed:', e);
    }

    refreshPoints(map, { start, end, types }).catch((e) => console.warn('Points refresh failed:', e));

    const f = store.getFilters();
    updateAllCharts(f).catch((e) => {
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
    });

    // Compare card (A) live
    if (store.center3857) {
      await updateCompare({
        types,
        center3857: store.center3857,
        radiusM: store.radius,
        timeWindowMonths: store.timeWindowMonths,
        adminLevel: store.adminLevel,
      }).catch((e) => console.warn('Compare update failed:', e));
    }
  }

  initPanel(store, { onChange: refreshAll, getMapCenter: () => map.getCenter() });
});
