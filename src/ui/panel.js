import { expandGroupsToCodes, getCodesForGroups } from '../utils/types.js';
import { fetchAvailableCodesForGroups } from '../api/crime.js';

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Wire the side panel controls to the store and notify on changes.
 * @param {import('../state/store.js').Store} store
 * @param {{ onChange: Function, getMapCenter: Function }} handlers
 */
export function initPanel(store, handlers) {
  const addrA = document.getElementById('addrA');
  const useCenterBtn = document.getElementById('useCenterBtn');
  const useMapHint = document.getElementById('useMapHint');
  const queryModeSel = document.getElementById('queryModeSel');
  const queryModeHelp = document.getElementById('queryModeHelp');
  const clearSelBtn = document.getElementById('clearSelBtn');
  const bufferSelectRow = document.getElementById('bufferSelectRow');
  const bufferRadiusRow = document.getElementById('bufferRadiusRow');
  const radiusSel = document.getElementById('radiusSel');
  const twSel = document.getElementById('twSel');
  const groupSel = document.getElementById('groupSel');
  const fineSel = document.getElementById('fineSel');
  const adminSel = document.getElementById('adminSel');
  const rateSel = document.getElementById('rateSel');
  const startMonth = document.getElementById('startMonth');
  const durationSel = document.getElementById('durationSel');
  const preset6 = document.getElementById('preset6');
  const preset12 = document.getElementById('preset12');

  const onChange = debounce(() => {
    // Derive selected offense codes from groups (unless drilldown overrides)
    if (!store.selectedDrilldownCodes || store.selectedDrilldownCodes.length === 0) {
      store.selectedTypes = expandGroupsToCodes(store.selectedGroups || []);
    }
    handlers.onChange?.();
  }, 300);

  addrA?.addEventListener('input', () => {
    store.addressA = addrA.value;
    onChange();
  });

  useCenterBtn?.addEventListener('click', () => {
    if (store.selectMode !== 'point') {
      store.selectMode = 'point';
      useCenterBtn.textContent = 'Cancel';
      if (useMapHint) useMapHint.style.display = 'block';
      document.body.style.cursor = 'crosshair';
    } else {
      store.selectMode = 'idle';
      useCenterBtn.textContent = 'Select on map';
      if (useMapHint) useMapHint.style.display = 'none';
      document.body.style.cursor = '';
    }
  });

  const radiusImmediate = () => {
    store.radius = Number(radiusSel.value) || 400;
    handlers.onRadiusInput?.(store.radius);
    onChange();
  };
  radiusSel?.addEventListener('change', radiusImmediate);
  radiusSel?.addEventListener('input', radiusImmediate);

  twSel?.addEventListener('change', () => {
    store.timeWindowMonths = Number(twSel.value) || 6;
    onChange();
  });

  groupSel?.addEventListener('change', async () => {
    const values = Array.from(groupSel.selectedOptions).map((o) => o.value);
    store.selectedGroups = values;
    store.selectedDrilldownCodes = []; // Clear drilldown when parent groups change

    // populate drilldown options (filtered by time window availability)
    if (fineSel) {
      if (values.length === 0) {
        // No parent groups selected
        fineSel.innerHTML = '<option disabled>Select a group first</option>';
        fineSel.disabled = true;
      } else {
        fineSel.disabled = false;
        fineSel.innerHTML = '<option disabled>Loading...</option>';

        try {
          const { start, end } = store.getStartEnd();
          const availableCodes = await fetchAvailableCodesForGroups({ start, end, groups: values });

          fineSel.innerHTML = '';
          if (availableCodes.length === 0) {
            fineSel.innerHTML = '<option disabled>No sub-codes in this window</option>';
          } else {
            for (const c of availableCodes) {
              const opt = document.createElement('option');
              opt.value = c; opt.textContent = c; fineSel.appendChild(opt);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch available codes:', err);
          fineSel.innerHTML = '<option disabled>Error loading codes</option>';
        }
      }
    }
    onChange();
  });

  fineSel?.addEventListener('change', () => {
    const codes = Array.from(fineSel.selectedOptions).map((o) => o.value);
    store.selectedDrilldownCodes = codes; // Drilldown overrides parent groups
    onChange();
  });

  adminSel?.addEventListener('change', () => {
    store.adminLevel = adminSel.value;
    onChange();
  });

  rateSel?.addEventListener('change', () => {
    store.per10k = rateSel.value === 'per10k';
    onChange();
  });

  function applyModeUI() {
    const mode = store.queryMode || 'buffer';
    const isBuffer = mode === 'buffer';
    if (bufferSelectRow) bufferSelectRow.style.display = isBuffer ? '' : 'none';
    if (bufferRadiusRow) bufferRadiusRow.style.display = isBuffer ? '' : 'none';
    if (useMapHint) useMapHint.style.display = (isBuffer && store.selectMode === 'point') ? 'block' : 'none';
    if (clearSelBtn) clearSelBtn.style.display = isBuffer ? 'none' : '';
    if (queryModeHelp) {
      queryModeHelp.textContent = (
        mode === 'buffer'
          ? 'Buffer mode: click “Select on map”, then click map to set center.'
          : mode === 'district'
            ? 'District mode: click a police district on the map to select it.'
            : 'Tract mode: click a census tract to select it.'
      );
    }
  }

  // Mode selection
  queryModeSel?.addEventListener('change', () => {
    const old = store.queryMode;
    const mode = queryModeSel.value;
    store.queryMode = mode;
    if (mode === 'buffer') {
      // keep center/radius; clear polygon selections
      store.selectedDistrictCode = null;
      store.selectedTractGEOID = null;
    } else if (mode === 'district') {
      // clear buffer; clear tract selection
      store.center3857 = null; store.centerLonLat = null; store.selectMode = 'idle';
      store.selectedTractGEOID = null;
    } else if (mode === 'tract') {
      // clear buffer; clear district selection
      store.center3857 = null; store.centerLonLat = null; store.selectMode = 'idle';
      store.selectedDistrictCode = null;
    }
    applyModeUI();
    onChange();
  });

  // Clear selection
  clearSelBtn?.addEventListener('click', () => {
    store.selectedDistrictCode = null;
    store.selectedTractGEOID = null;
    applyModeUI();
    onChange();
  });

  // Esc exits transient selection mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.selectMode === 'point') {
      store.selectMode = 'idle';
      if (useCenterBtn) useCenterBtn.textContent = 'Select on map';
      if (useMapHint) useMapHint.style.display = 'none';
      document.body.style.cursor = '';
    }
  });

  // initialize defaults
  if (radiusSel) radiusSel.value = String(store.radius || 400);
  if (twSel) twSel.value = String(store.timeWindowMonths || 6);
  if (adminSel) adminSel.value = String(store.adminLevel || 'districts');
  if (rateSel) rateSel.value = store.per10k ? 'per10k' : 'counts';
  if (queryModeSel) queryModeSel.value = store.queryMode || 'buffer';
  if (startMonth && store.startMonth) startMonth.value = store.startMonth;
  if (durationSel) durationSel.value = String(store.durationMonths || 6);

  // Initialize drilldown select (disabled until groups are selected)
  if (fineSel) {
    fineSel.innerHTML = '<option disabled>Select a group first</option>';
    fineSel.disabled = true;
  }

  applyModeUI();

  startMonth?.addEventListener('change', () => { store.startMonth = startMonth.value || null; onChange(); });
  durationSel?.addEventListener('change', () => { store.durationMonths = Number(durationSel.value) || 6; onChange(); });
  preset6?.addEventListener('click', () => { const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; store.startMonth = ym; store.durationMonths = 6; onChange(); });
  preset12?.addEventListener('click', () => { const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; store.startMonth = ym; store.durationMonths = 12; onChange(); });
}
