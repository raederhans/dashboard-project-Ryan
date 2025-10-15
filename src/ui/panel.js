import { expandGroupsToCodes } from '../utils/types.js';

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
  const radiusSel = document.getElementById('radiusSel');
  const twSel = document.getElementById('twSel');
  const groupSel = document.getElementById('groupSel');
  const fineSel = document.getElementById('fineSel');
  const adminSel = document.getElementById('adminSel');
  const rateSel = document.getElementById('rateSel');

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
    try {
      const c = handlers.getMapCenter?.();
      if (c) {
        store.setCenterFromLngLat(c.lng, c.lat);
        if (addrA) addrA.value = `lng ${c.lng.toFixed(5)}, lat ${c.lat.toFixed(5)}`;
        onChange();
      }
    } catch (e) {
      // ignore
    }
  });

  radiusSel?.addEventListener('change', () => {
    store.radius = Number(radiusSel.value) || 400;
    onChange();
  });

  twSel?.addEventListener('change', () => {
    store.timeWindowMonths = Number(twSel.value) || 6;
    onChange();
  });

  groupSel?.addEventListener('change', () => {
    const values = Array.from(groupSel.selectedOptions).map((o) => o.value);
    store.selectedGroups = values;
    onChange();
  });

  fineSel?.addEventListener('change', () => {
    // placeholder for fine-grained codes
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
}
