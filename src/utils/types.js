/**
 * Map offense text_general_code into coarse groups with colors.
 * This is a lightweight, file-local mapping; adjust as needed.
 * @param {string} name
 * @returns {string} hex color
 */
export function groupColor(name) {
  const n = (name || '').toUpperCase();
  if (n.includes('HOMICIDE')) return '#8b0000';
  if (n.includes('ROBBERY')) return '#d97706';
  if (n.includes('ASSAULT')) return '#ef4444';
  if (n.includes('BURGLARY')) return '#a855f7';
  if (n.includes('THEFT FROM VEHICLE')) return '#0ea5e9';
  if (n.includes('MOTOR VEHICLE THEFT')) return '#0891b2';
  if (n.includes('THEFT')) return '#22c55e';
  if (n.includes('NARCOTIC')) return '#10b981';
  if (n.includes('VANDALISM') || n.includes('CRIMINAL MISCHIEF')) return '#6366f1';
  return '#999999';
}

/**
 * Return an array of [matchKey, color] pairs for common categories.
 * Used to build a MapLibre match expression for unclustered points.
 */
export function categoryColorPairs() {
  return [
    ['HOMICIDE', '#8b0000'],
    ['ROBBERY FIREARM', '#d97706'],
    ['ROBBERY', '#d97706'],
    ['AGGRAVATED ASSAULT', '#ef4444'],
    ['SIMPLE ASSAULT', '#ef4444'],
    ['BURGLARY', '#a855f7'],
    ['THEFT FROM VEHICLE', '#0ea5e9'],
    ['MOTOR VEHICLE THEFT', '#0891b2'],
    ['THEFT', '#22c55e'],
    ['NARCOTICS', '#10b981'],
    ['DRUG', '#10b981'],
    ['VANDALISM', '#6366f1'],
    ['CRIMINAL MISCHIEF', '#6366f1'],
  ];
}

// Offense groups for controls
export const offenseGroups = groups;

/**
 * Expand selected group keys into a flat list of text_general_code values.
 * @param {string[]} selectedGroups
 * @returns {string[]}
 */
export function expandGroupsToCodes(selectedGroups = []) {
  const out = [];
  for (const key of selectedGroups) {
    const k = key.replace(/[- ]/g, '_');
    const arr = offenseGroups[key] || offenseGroups[k] || offenseGroups[key?.toUpperCase?.()] || offenseGroups[key?.toLowerCase?.()];
    if (Array.isArray(arr)) out.push(...arr);
  }
  // de-duplicate
  return Array.from(new Set(out));
}

export function getCodesForGroups(groups) { return expandGroupsToCodes(groups); }
import groups from '../data/offense_groups.json' assert { type: 'json' };
