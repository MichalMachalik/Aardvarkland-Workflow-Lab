export const districts = {
  p6: { label: 'Praha 6', travel: 0 },
  p5: { label: 'Praha 5', travel: 250 },
  p4: { label: 'Praha 4', travel: 400 },
};

export const slots = { am: 'Dopoledne', pm: 'Odpoledne' };
const key = 'aardvarkland:service-booking:v1';
const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });

export function quote(input) {
  const units = Number(input.units);
  if (!Number.isInteger(units) || units < 1 || units > 5 || !Object.hasOwn(districts, input.district) || !Object.hasOwn(slots, input.slot)) {
    throw new Error('Zkontrolujte počet jednotek, městskou část a preferovaný čas.');
  }
  const work = units * 1200;
  const travel = districts[input.district].travel;
  return { units, district: input.district, slot: input.slot, work, travel, total: work + travel };
}

export function createReceipt(input, previous = []) {
  const estimate = quote(input);
  const identity = [estimate.units, estimate.district, estimate.slot].join('-');
  const existing = previous.find(receipt => receipt.identity === identity);
  const receipt = existing ?? { ...estimate, identity, id: 'SERV-DEMO-' + identity.toUpperCase() };
  return { receipt, added: !existing, receipts: existing ? previous : [...previous, receipt] };
}

function bind(root) {
  const form = root.querySelector('form');
  const section = root.querySelector('[data-receipt]');
  const status = root.querySelector('[data-booking-status]');
  const values = () => Object.fromEntries(new FormData(form));
  const load = () => {
    const data = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(data) ? data : [];
  };

  function refreshPrice() {
    const estimate = quote(values());
    root.querySelector('[data-work]').textContent = money.format(estimate.work);
    root.querySelector('[data-travel]').textContent = money.format(estimate.travel);
    root.querySelector('[data-total]').textContent = money.format(estimate.total);
  }

  function show(receipt) {
    section.querySelector('[data-receipt-text]').textContent = receipt.id + ' · ' + districts[receipt.district].label + ' · '
      + slots[receipt.slot] + ' · ' + money.format(receipt.total);
    section.querySelector('[data-event]').textContent = JSON.stringify({
      event: 'request_created', requestId: receipt.id, units: receipt.units, value: receipt.total, currency: 'CZK',
    });
    section.hidden = false;
  }

  form.addEventListener('change', () => {
    status.textContent = '';
    section.hidden = true;
    refreshPrice();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = createReceipt(values(), load());
      if (result.added) localStorage.setItem(key, JSON.stringify(result.receipts));
      show(result.receipt);
      status.textContent = result.added ? 'Poptávka je uložená v tomto prohlížeči.' : 'Stejná poptávka už existuje.';
    } catch {
      status.textContent = 'Poptávku se nepodařilo uložit.';
    }
  });
  root.querySelector('[data-booking-reset]').addEventListener('click', () => {
    try {
      localStorage.removeItem(key);
      section.hidden = true;
      status.textContent = 'Uložené poptávky byly vymazány.';
      form.querySelector('button').focus();
    } catch {
      status.textContent = 'Uložené poptávky se nepodařilo vymazat.';
    }
  });
  try {
    const recent = load().at(-1);
    if (recent) {
      form.elements.units.value = String(recent.units);
      form.elements.district.value = recent.district;
      form.elements.slot.value = recent.slot;
      show(recent);
    }
  } catch {
    status.textContent = 'Místní uložené poptávky nejsou dostupné.';
  }
  refreshPrice();
}

export function bindBookings() {
  for (const form of document.querySelectorAll('[data-booking]:not([data-bound])')) {
    form.dataset.bound = 'true';
    bind(form);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindBookings, { once: true });
  else bindBookings();
}
