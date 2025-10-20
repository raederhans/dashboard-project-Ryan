import { quantileBreaks } from './style_helpers.js';
import { updateLegend, hideLegend } from './legend.js';
import { upsertTractsFill, showTractsFill, hideTractsFill } from './tracts_layers.js';

/**
 * Render tracts choropleth, masking low-population tracts via __mask flag.
 * @param {import('maplibre-gl').Map} map
 * @param {{geojson: object, values: number[]}} merged
 * @returns {{breaks:number[], colors:string[]}}
 */
export function renderTractsChoropleth(map, merged) {
  const geojson = merged?.geojson || merged; // Handle both formats
  const values = merged?.values || (geojson?.features || []).map((f) => Number(f?.properties?.value) || 0);

  const allZero = values.length === 0 || values.every((v) => v === 0);
  const breaks = allZero ? [] : quantileBreaks(values, 5);
  const colors = ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26'];

  // Update legend
  if (allZero || breaks.length === 0) {
    hideLegend();
    hideTractsFill(map);
    // Show banner: outlines-only mode
    showOutlinesOnlyBanner();
  } else {
    updateLegend({ title: 'Census Tracts', unit: '', breaks, colors });

    // Build step expression for fill color
    const stepExpr = ['step', ['coalesce', ['get', 'value'], 0], colors[0]];
    for (let i = 0; i < breaks.length; i++) {
      stepExpr.push(breaks[i], colors[Math.min(i + 1, colors.length - 1)]);
    }

    // Update tract fill layer (use new tracts_layers module)
    upsertTractsFill(map, geojson, {
      fillColor: stepExpr,
      fillOpacity: 0.7,
    });
    showTractsFill(map);
    hideOutlinesOnlyBanner();
  }

  return { breaks, colors };
}

/**
 * Show banner: tract outlines only (no choropleth data)
 */
function showOutlinesOnlyBanner() {
  let banner = document.getElementById('tracts-outline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'tracts-outline-banner';
    Object.assign(banner.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 243, 205, 0.95)',
      color: '#92400e',
      padding: '8px 12px',
      border: '1px solid #fbbf24',
      borderRadius: '6px',
      zIndex: '30',
      font: '13px/1.4 system-ui, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    });
    banner.textContent = 'Census tracts: outlines visible. Choropleth requires precomputed counts.';
    document.body.appendChild(banner);
  }
  banner.style.display = 'block';
}

/**
 * Hide outlines-only banner
 */
function hideOutlinesOnlyBanner() {
  const banner = document.getElementById('tracts-outline-banner');
  if (banner) {
    banner.style.display = 'none';
  }
}
