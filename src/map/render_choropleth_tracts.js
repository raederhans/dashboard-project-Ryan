import { quantileBreaks } from './style_helpers.js';

/**
 * Render tracts choropleth, masking low-population tracts via __mask flag.
 * @param {import('maplibre-gl').Map} map
 * @param {{geojson: object, values: number[]}} merged
 * @returns {{breaks:number[], colors:string[]}}
 */
export function renderTractsChoropleth(map, merged) {
  const breaks = quantileBreaks(merged.values || [], 5);
  const colors = ['#fef3c7', '#fdba74', '#fb923c', '#f97316', '#ea580c'];

  const stepExpr = ['step', ['coalesce', ['get', 'value'], 0], colors[0]];
  for (let i = 0; i < breaks.length; i++) {
    stepExpr.push(breaks[i], colors[Math.min(i + 1, colors.length - 1)]);
  }

  const srcId = 'tracts';
  const fillId = 'tracts-fill';
  const lineId = 'tracts-line';

  if (map.getSource(srcId)) {
    map.getSource(srcId).setData(merged.geojson);
  } else {
    map.addSource(srcId, { type: 'geojson', data: merged.geojson });
  }

  const filterUnmasked = ['!', ['get', '__mask']];

  if (!map.getLayer(fillId)) {
    map.addLayer({ id: fillId, type: 'fill', source: srcId, paint: { 'fill-color': stepExpr, 'fill-opacity': 0.75 }, filter: filterUnmasked });
  } else {
    map.setFilter(fillId, filterUnmasked);
    map.setPaintProperty(fillId, 'fill-color', stepExpr);
  }

  if (!map.getLayer(lineId)) {
    map.addLayer({ id: lineId, type: 'line', source: srcId, paint: { 'line-color': '#444', 'line-width': 0.6 } });
  }

  return { breaks, colors };
}

