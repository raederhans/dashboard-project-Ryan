import { expandGroupsToCodes, getCodesForGroups } from '../utils/types.js';

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
    // Derive selected offense codes from groups
    store.selectedTypes = expandGroupsToCodes(store.selectedGroups || []);
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

  groupSel?.addEventListener('change', () => {
    const values = Array.from(groupSel.selectedOptions).map((o) => o.value);
    store.selectedGroups = values;
    // populate drilldown options
    if (fineSel) {
      const codes = getCodesForGroups(values);
      fineSel.innerHTML = '';
      for (const c of codes) {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c; fineSel.appendChild(opt);
      }
    }
    onChange();
  });

  fineSel?.addEventListener('change', () => {
    const codes = Array.from(fineSel.selectedOptions).map((o) => o.value);
    store.selectedTypes = codes; // override when present
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

  // initialize defaults
  if (radiusSel) radiusSel.value = String(store.radius || 400);
  if (twSel) twSel.value = String(store.timeWindowMonths || 6);
  if (adminSel) adminSel.value = String(store.adminLevel || 'districts');
  if (rateSel) rateSel.value = store.per10k ? 'per10k' : 'counts';
  if (startMonth && store.startMonth) startMonth.value = store.startMonth;
  if (durationSel) durationSel.value = String(store.durationMonths || 6);

  startMonth?.addEventListener('change', () => { store.startMonth = startMonth.value || null; onChange(); });
  durationSel?.addEventListener('change', () => { store.durationMonths = Number(durationSel.value) || 6; onChange(); });
  preset6?.addEventListener('click', () => { const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; store.startMonth = ym; store.durationMonths = 6; onChange(); });
  preset12?.addEventListener('click', () => { const d = new Date(); const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; store.startMonth = ym; store.durationMonths = 12; onChange(); });
}
