export const roles = { reporter: 'Provoz', technician: 'Technik', reviewer: 'Kontrola' };
export const statuses = { open: 'Nová', assigned: 'Převzatá', review: 'Ke kontrole', returned: 'Vrácená', closed: 'Uzavřená' };
export const templates = {
  door: { title: 'Dveře se nedovírají', location: 'Budova A · vstup' },
  lamp: { title: 'Nesvítí stropní svítidlo', location: 'Budova B · sklad' },
  handle: { title: 'Uvolněné madlo', location: 'Budova A · chodba' },
};
export const proofs = {
  reset: 'Kontrola po seřízení',
  replace: 'Fotodokumentace po výměně',
  secure: 'Zkouška po dotažení',
};
export const reasons = { missing: 'Doložte opakovanou zkoušku', area: 'Doložte celý kontrolovaný prostor' };
const opening = '2026-11-20T09:00:00.000Z';

export function initialHandover() {
  return { next: 3, tickets: [
    { id: 'ZAV-DEMO-001', template: 'door', status: 'open', proof: null, history: [
      { role: 'reporter', action: 'Nahlášení závady', at: opening },
    ] },
    { id: 'ZAV-DEMO-002', template: 'lamp', status: 'review', proof: 'replace', history: [
      { role: 'reporter', action: 'Nahlášení závady', at: opening },
      { role: 'technician', action: 'Převzetí závady', at: '2026-11-20T09:15:00.000Z' },
      { role: 'technician', action: 'Předáno ke kontrole · Fotodokumentace po výměně', at: '2026-11-20T10:10:00.000Z' },
    ] },
  ] };
}

const allowed = {
  take: { role: 'technician', from: ['open'], to: 'assigned', label: 'Převzetí závady' },
  submit: { role: 'technician', from: ['assigned', 'returned'], to: 'review', label: 'Předáno ke kontrole' },
  return: { role: 'reviewer', from: ['review'], to: 'returned', label: 'Vráceno k doplnění' },
  close: { role: 'reviewer', from: ['review'], to: 'closed', label: 'Schváleno a uzavřeno' },
};

export function transition(state, { role, action, id, value }, at = new Date().toISOString()) {
  if (action === 'create') {
    if (role !== 'reporter' || !Object.hasOwn(templates, value)) throw new Error('Vyberte závadu v roli Provoz.');
    const id = 'ZAV-DEMO-' + String(state.next).padStart(3, '0');
    const ticket = { id, template: value, status: 'open', proof: null, history: [{ role, action: 'Nahlášení závady', at }] };
    return { active: id, state: { next: state.next + 1, tickets: [ticket, ...state.tickets] } };
  }
  const ticket = state.tickets.find(item => item.id === id);
  const rule = Object.hasOwn(allowed, action) ? allowed[action] : null;
  if (!ticket || !rule || role !== rule.role || !rule.from.includes(ticket.status)) {
    throw new Error('Závada mezitím změnila stav nebo tato role nemá oprávnění.');
  }
  if (action === 'submit' && !Object.hasOwn(proofs, value)) throw new Error('Nejdřív vyberte doklad o opravě.');
  if (action === 'return' && !Object.hasOwn(reasons, value)) throw new Error('Vyberte důvod vrácení.');
  if (action === 'close' && !ticket.proof) throw new Error('Závadu nelze uzavřít bez dokladu o opravě.');
  const proof = action === 'submit' ? value : ticket.proof;
  const suffix = action === 'submit' ? proofs[value] : action === 'return' ? reasons[value] : '';
  const entry = { role, action: rule.label + (suffix ? ' · ' + suffix : ''), at };
  const next = { ...ticket, status: rule.to, proof, history: [...ticket.history, entry] };
  return { active: id, state: { ...state, tickets: state.tickets.map(item => item.id === id ? next : item) } };
}
