import { quantileBreaks } from './style_helpers.js';

/**
 * Add or update a districts choropleth from merged GeoJSON.
 * @param {import('maplibre-gl').Map} map
 * @param {object} merged - FeatureCollection with properties.value on each feature
 * @returns {{breaks:number[], colors:string[]}}
 */
export function renderDistrictChoropleth(map, merged) {
  const values = (merged?.features || []).map((f) => Number(f?.properties?.value) || 0);
  const breaks = quantileBreaks(values, 5);
  const colors = ['#f1eef6', '#bdc9e1', '#74a9cf', '#2b8cbe', '#045a8d'];

  // Build step expression: ['step', ['get','value'], c0, b1, c1, b2, c2, ...]
  const stepExpr = ['step', ['coalesce', ['get', 'value'], 0], colors[0]];
  for (let i = 0; i < breaks.length; i++) {
    stepExpr.push(breaks[i], colors[Math.min(i + 1, colors.length - 1)]);
  }

  const sourceId = 'districts';
  const fillId = 'districts-fill';
  const lineId = 'districts-line';
  const labelId = 'districts-label';

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(merged);
  } else {
    map.addSource(sourceId, { type: 'geojson', data: merged });
  }

  if (!map.getLayer(fillId)) {
    map.addLayer({
      id: fillId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': stepExpr,
        'fill-opacity': 0.75,
      },
    });
  } else {
    map.setPaintProperty(fillId, 'fill-color', stepExpr);
  }

  if (!map.getLayer(lineId)) {
    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#333',
        'line-width': 1,
      },
    });
  }

  if (!map.getLayer(labelId)) {
    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'DIST_NUMC']],
        'text-size': 12,
      },
      paint: { 'text-color': '#1f2937', 'text-halo-color': '#fff', 'text-halo-width': 1 }
    });
  }

  return { breaks, colors };
}
