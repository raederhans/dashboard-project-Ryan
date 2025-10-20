const DATE_FLOOR = "2015-01-01";

/**
 * Ensure the provided ISO date is not earlier than the historical floor.
 * @param {string} value - ISO date string.
 * @returns {string} ISO date string clamped to the floor.
 */
export function dateFloorGuard(value) {
  const iso = ensureIso(value, "start");
  return iso < DATE_FLOOR ? DATE_FLOOR : iso;
}

/**
 * Clean and deduplicate offense type strings.
 * @param {string[]} [types] - Array of offense labels.
 * @returns {string[]} Sanitized values safe for SQL literal usage.
 */
export function sanitizeTypes(types) {
  if (!Array.isArray(types)) {
    return [];
  }

  const cleaned = types
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0)
    .map((value) => value.replace(/'/g, "''"));

  return Array.from(new Set(cleaned));
}

/**
 * Build the spatial envelope clause for a bounding box.
 * @param {number[] | {xmin:number, ymin:number, xmax:number, ymax:number}} bbox - Map bounding box in EPSG:3857.
 * @returns {string} SQL clause prefixed with AND or an empty string.
 */
export function envelopeClause(bbox) {
  if (!bbox) {
    return "";
  }

  const values = Array.isArray(bbox)
    ? bbox
    : [
        bbox.xmin ?? bbox.minX,
        bbox.ymin ?? bbox.minY,
        bbox.xmax ?? bbox.maxX,
        bbox.ymax ?? bbox.maxY,
      ];

  if (!Array.isArray(values) || values.length !== 4) {
    return "";
  }

  const numbers = values.map((value) => Number(value));
  if (numbers.some((value) => !Number.isFinite(value))) {
    return "";
  }

  const [xmin, ymin, xmax, ymax] = numbers;
  return `AND the_geom && ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 3857)`;
}

/**
 * Build SQL for point requests with optional type and bbox filters (§2.1).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {xmin:number, ymin:number, xmax:number, ymax:number}} [params.bbox] - Bounding box in EPSG:3857.
 * @returns {string} SQL statement.
 */
export function buildCrimePointsSQL({ start, end, types, bbox, dc_dist }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = baseTemporalClauses(startIso, endIso, types);

  const bboxClause = envelopeClause(bbox);
  if (bboxClause) {
    clauses.push(`  ${bboxClause}`);
  }
  if (dc_dist) {
    clauses.push(`  ${buildDistrictFilter(dc_dist)}`);
  }

  return [
    "SELECT the_geom, dispatch_date_time, text_general_code, ucr_general, dc_dist, location_block",
    "FROM incidents_part1_part2",
    ...clauses,
  ].join("\n");
}

/**
 * Build SQL for the citywide monthly series (§2.2).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {string[]} [params.types] - Optional offense filters.
 * @returns {string} SQL statement.
 */
export function buildMonthlyCitySQL({ start, end, types, dc_dist }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = baseTemporalClauses(startIso, endIso, types);
  if (dc_dist) clauses.push(`  ${buildDistrictFilter(dc_dist)}`);

  return [
    "SELECT date_trunc('month', dispatch_date_time) AS m, COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    "GROUP BY 1 ORDER BY 1",
  ].join("\n");
}

/**
 * Build SQL for the buffer-based monthly series (§2.3).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {x:number, y:number}} params.center3857 - Center point (EPSG:3857).
 * @param {number} params.radiusM - Buffer radius in meters.
 * @returns {string} SQL statement.
 */
export function buildMonthlyBufferSQL({
  start,
  end,
  types,
  center3857,
  radiusM,
}) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = baseTemporalClauses(startIso, endIso, types);
  clauses.push(`  ${dWithinClause(center3857, radiusM)}`);

  return [
    "SELECT date_trunc('month', dispatch_date_time) AS m, COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    "GROUP BY 1 ORDER BY 1",
  ].join("\n");
}

/**
 * Build SQL for top-N offense types within buffer (§2.4).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {number[] | {x:number, y:number}} params.center3857 - Center in EPSG:3857.
 * @param {number} params.radiusM - Buffer radius in meters.
 * @param {number} [params.limit=12] - LIMIT clause.
 * @returns {string} SQL statement.
 */
export function buildTopTypesSQL({
  start,
  end,
  center3857,
  radiusM,
  limit = 12,
}) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = [
    ...baseTemporalClauses(startIso, endIso, undefined, { includeTypes: false }),
    `  ${dWithinClause(center3857, radiusM)}`,
  ];

  const limitValue = ensurePositiveInt(limit, "limit");

  return [
    "SELECT text_general_code, COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    `GROUP BY 1 ORDER BY n DESC LIMIT ${limitValue}`,
  ].join("\n");
}

/**
 * Build SQL for 7x24 heatmap aggregations (§2.5).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {string[]} [params.types] - Optional offense filters.
 * @param {number[] | {x:number, y:number}} params.center3857 - Center in EPSG:3857.
 * @param {number} params.radiusM - Buffer radius in meters.
 * @returns {string} SQL statement.
 */
export function buildHeatmap7x24SQL({
  start,
  end,
  types,
  center3857,
  radiusM,
}) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = baseTemporalClauses(startIso, endIso, types);
  clauses.push(`  ${dWithinClause(center3857, radiusM)}`);

  return [
    "SELECT EXTRACT(DOW  FROM dispatch_date_time AT TIME ZONE 'America/New_York') AS dow,",
    "       EXTRACT(HOUR FROM dispatch_date_time AT TIME ZONE 'America/New_York') AS hr,",
    "       COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    "GROUP BY 1,2 ORDER BY 1,2",
  ].join("\n");
}

/**
 * Build SQL for district aggregations (§2.6).
 * @param {object} params
 * @param {string} params.start - Inclusive start ISO date.
 * @param {string} params.end - Exclusive end ISO date.
 * @param {string[]} [params.types] - Optional offense filters.
 * @returns {string} SQL statement.
 */
export function buildByDistrictSQL({ start, end, types }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, "end");
  const clauses = baseTemporalClauses(startIso, endIso, types);

  return [
    "SELECT dc_dist, COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    "GROUP BY 1 ORDER BY 1",
  ].join("\n");
}

/**
 * Top types for a given district code.
 * @param {{start:string,end:string,types?:string[],dc_dist:string,limit?:number}} p
 */
export function buildTopTypesDistrictSQL({ start, end, types, dc_dist, limit = 5 }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, 'end');
  const clauses = baseTemporalClauses(startIso, endIso, types);
  const dist = String(dc_dist).padStart(2, '0').replace(/'/g, "''");
  clauses.push(`  AND dc_dist = '${dist}'`);
  return [
    'SELECT text_general_code, COUNT(*) AS n',
    'FROM incidents_part1_part2',
    ...clauses,
    `GROUP BY 1 ORDER BY n DESC LIMIT ${ensurePositiveInt(limit,'limit')}`,
  ].join('\n');
}

/**
 * 7x24 heatmap aggregates filtered by district code.
 * @param {{start:string,end:string,types?:string[],dc_dist:string}} p
 */
export function buildHeatmap7x24DistrictSQL({ start, end, types, dc_dist }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, 'end');
  const clauses = baseTemporalClauses(startIso, endIso, types);
  const dist = String(dc_dist).padStart(2, '0').replace(/'/g, "''");
  clauses.push(`  AND dc_dist = '${dist}'`);
  return [
    "SELECT EXTRACT(DOW  FROM dispatch_date_time AT TIME ZONE 'America/New_York') AS dow,",
    "       EXTRACT(HOUR FROM dispatch_date_time AT TIME ZONE 'America/New_York') AS hr,",
    "       COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
    "GROUP BY 1,2 ORDER BY 1,2",
  ].join('\n');
}

/**
 * District filter helper.
 */
export function buildDistrictFilter(districtCode) {
  const dist = String(districtCode).padStart(2, '0').replace(/'/g, "''");
  return `AND dc_dist = '${dist}'`;
}

/**
 * Build SQL to count incidents within a buffer (no GROUP BY).
 * @param {object} params
 * @param {string} params.start
 * @param {string} params.end
 * @param {string[]} [params.types]
 * @param {number[]|{x:number,y:number}} params.center3857
 * @param {number} params.radiusM
 * @returns {string}
 */
export function buildCountBufferSQL({ start, end, types, center3857, radiusM }) {
  const startIso = dateFloorGuard(start);
  const endIso = ensureIso(end, 'end');
  const clauses = baseTemporalClauses(startIso, endIso, types);
  clauses.push(`  ${dWithinClause(center3857, radiusM)}`);
  return [
    "SELECT COUNT(*) AS n",
    "FROM incidents_part1_part2",
    ...clauses,
  ].join("\n");
}

function ensureIso(value, label) {
  if (!value) {
    throw new Error(`Missing required ISO date for ${label}.`);
  }
  const iso = String(value);
  if (!iso.match(/^\d{4}-\d{2}-\d{2}/)) {
    throw new Error(`Invalid ISO date for ${label}: ${value}`);
  }
  return iso;
}

function ensurePositiveInt(value, label) {
  const num = Number.parseInt(String(value), 10);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return num;
}

function ensureCenter(center) {
  if (!center) {
    throw new Error("center3857 is required.");
  }

  if (Array.isArray(center) && center.length >= 2) {
    const [x, y] = center.map((value) => Number(value));
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return [x, y];
    }
  } else if (typeof center === "object") {
    const x = Number(center.x ?? center.lon ?? center.lng);
    const y = Number(center.y ?? center.lat);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return [x, y];
    }
  }

  throw new Error("center3857 must supply numeric x and y coordinates.");
}

function ensureRadius(radius) {
  const value = Number(radius);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("radiusM must be a positive number.");
  }
  return value;
}

function dWithinClause(center, radius) {
  const [x, y] = ensureCenter(center);
  const distance = ensureRadius(radius);
  return `AND ST_DWithin(the_geom, ST_SetSRID(ST_Point(${x}, ${y}), 3857), ${distance})`;
}

function baseTemporalClauses(startIso, endIso, types, { includeTypes = true } = {}) {
  const clauses = [
    "WHERE dispatch_date_time >= '2015-01-01'",
    `  AND dispatch_date_time >= '${startIso}'`,
    `  AND dispatch_date_time < '${endIso}'`,
  ];

  if (includeTypes) {
    const sanitizedTypes = sanitizeTypes(types);
    if (sanitizedTypes.length > 0) {
      clauses.push(
        `  AND text_general_code IN (${sanitizedTypes
          .map((value) => `'${value}'`)
          .join(", ")})`
      );
    }
  }

  return clauses;
}
