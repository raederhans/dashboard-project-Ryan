Add a readme for your dashboard here. Include content overview, data citations, and any relevant technical details.

## How to Run

- dev: `npm run dev` (default http://localhost:5173/)
- build: `npm run build`
- preview: `npm run preview`
- note: see logs/npm_run_dev_*.log for prior smoke test output

### Basemap & CSS

- The base map uses OpenStreetMap raster tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
- The MapLibre GL CSS is linked via unpkg in `public/index.html` to keep setup simple:
  `<link href="https://unpkg.com/maplibre-gl@^4.5.0/dist/maplibre-gl.css" rel="stylesheet" />`
- Attribution: © OpenStreetMap contributors.

### Charts

- Charts are implemented with Chart.js v4. Before running the app, install dependencies:
  `npm i`
- First run may download ~1–2 MB of packages.
- Rebuild anytime with `npm run build`.
 - Requires `npm i` to install chart.js; see `logs/vite_build_*.log` for bundling status.

## Data Sources

- CARTO SQL API (City of Philadelphia): https://phl.carto.com/api/v2/sql
- Police Districts (GeoJSON):
  https://policegis.phila.gov/arcgis/rest/services/POLICE/Boundaries/MapServer/1/query?where=1=1&outFields=*&f=geojson
- Census Tracts (Philadelphia subset, GeoJSON):
  https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0/query?where=STATE_FIPS='42'%20AND%20COUNTY_FIPS='101'&outFields=FIPS,STATE_FIPS,COUNTY_FIPS,TRACT_FIPS,POPULATION_2020&f=geojson
- ACS 2023 5‑Year (population/tenure/income):
  https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E,B25003_001E,B25003_003E,B19013_001E&for=tract:*&in=state:42%20county:101
- ACS 2023 5‑Year Subject (poverty rate):
  https://api.census.gov/data/2023/acs/acs5/subject?get=NAME,S1701_C03_001E&for=tract:*&in=state:42%20county:101

## Limitations

- UCR categories are generalized for reporting and do not reflect full incident coding.
- Incident locations are rounded to the hundred block; exact addresses are not provided.
- Counts in this tool may differ from official UCR reports due to methodology and updates.

## Caching & Boundaries

- Police Districts are cached at `public/data/police_districts.geojson` when available.
- At runtime, the app loads the cached file first; if not present or invalid, it falls back to the live ArcGIS service above.

## Performance Policies

- Never fetch the full incidents table; all requests are constrained by a time window and, when the map is visible, the current map bounding box.
- If a points query returns more than 20,000 features, the app hides individual points and prompts the user to zoom, showing clusters instead.
- Clustering is enabled for point sources to improve rendering performance and legibility.

## Compare A/B Semantics

- “A vs B” compares buffer‑based totals around two centers using the same time window and offense filters.
- Per‑10k rates are only computed when the Tracts layer and ACS population are loaded for the relevant geography; otherwise per‑10k is omitted.

## Tracts + ACS (per‑10k)

- The "Tracts" admin level uses cached tracts geometry and ACS 2023 tract stats.
- Per‑10k rates are computed as (value / population) * 10,000 when population data is available.
- Tracts with population < 500 are masked from the choropleth to avoid unstable rates.
