import { shell } from './ui.js';
import { initialHandover, proofs, reasons, roles, statuses, templates, transition } from './handover-core.js';

shell('Workflow Lab', 'Správa objektů');
const key = 'aardvarkland:handover:v1';
const view = document.querySelector('#handover');
const timestamp = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });
const safe = text => String(text).replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[value]));
let state = load();
let active = state.tickets[0].id;
let role = 'reporter';

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Number.isInteger(stored?.next) && stored.tickets?.length) return stored;
  } catch {
    // Continue from the original sample data.
  }
  return initialHandover();
}

function options(data) {
  return Object.entries(data).map(([id, name]) => '<option value="' + id + '">' + safe(name) + '</option>').join('');
}

function badge(status) {
  const style = status === 'closed' ? ' ok' : status === 'returned' ? ' warn' : '';
  return '<span class="pill' + style + '">' + statuses[status] + '</span>';
}

function actionForm(ticket) {
  if (role === 'technician' && ticket.status === 'open') {
    return '<button type="button" class="primary" data-action="take">Převzít závadu</button>';
  }
  if (role === 'technician' && ['assigned', 'returned'].includes(ticket.status)) {
    return '<label>Doklad o opravě<select id="proof"><option value="">Vyberte doklad</option>'
      + options(proofs) + '</select></label><div><button type="button" class="primary" data-action="submit">Předat ke kontrole</button></div>';
  }
  if (role === 'reviewer' && ticket.status === 'review') {
    return '<label>Důvod vrácení<select id="reason"><option value="">Vyberte důvod</option>' + options(reasons)
      + '</select></label><div class="row"><button type="button" data-action="return">Vrátit technikovi</button>'
      + '<button type="button" class="primary" data-action="close">Schválit opravu</button></div>';
  }
  const statusTips = { open: 'Čeká na převzetí technikem.', assigned: 'Technik doplňuje doklad o opravě.',
    returned: 'Technik doplňuje podklady podle důvodu vrácení.', review: 'Čeká na kontrolu opravy.', closed: 'Kontrola opravu schválila.' };
  return '<p class="muted">' + statusTips[ticket.status] + '</p>';
}

function render(message = '', failed = false, focus = '') {
  const ticket = state.tickets.find(row => row.id === active) ?? state.tickets[0];
  const template = templates[ticket.template];
  const list = state.tickets.map(row => '<button type="button" class="ticket" data-ticket="' + safe(row.id)
    + '" aria-pressed="' + String(row.id === ticket.id) + '"><span><strong>' + safe(templates[row.template].title)
    + '</strong><small class="small">' + safe(row.id) + '</small></span>' + badge(row.status) + '</button>').join('');
  const log = ticket.history.map(entry => '<li><strong>' + safe(entry.action) + '</strong><br><small class="small">'
    + safe(roles[entry.role]) + ' · ' + timestamp.format(new Date(entry.at)) + '</small></li>').join('');
  const roleOptions = options(roles);
  view.innerHTML = '<div class="page-title"><h1>Předávání závad</h1>'
    + '<p class="lede">Od nahlášení přes opravu až po schválení.</p></div><div class="columns">'
    + '<section class="surface stack"><label>Pracovní role<select id="role">' + roleOptions + '</select></label>'
    + '<h2>Závady</h2>' + list
    + (role === 'reporter' ? '<hr><label>Nová závada<select id="template">' + options(Object.fromEntries(
      Object.entries(templates).map(([id, row]) => [id, row.title]))) + '</select></label>'
      + '<div><button type="button" data-action="create">Nahlásit závadu</button></div>' : '')
    + '</section><section class="surface stack" aria-label="Detail závady"><div class="row"><h2 tabindex="-1" id="ticket-title">'
    + safe(template.title) + '</h2>' + badge(ticket.status) + '</div><p class="muted">' + safe(ticket.id) + ' · ' + safe(template.location) + '</p>'
    + (ticket.proof ? '<div class="evidence"><h3>Doklad o opravě</h3><p class="muted">' + proofs[ticket.proof] + '</p></div>' : '')
    + actionForm(ticket)
    + (message ? '<p class="' + (failed ? 'error" role="alert' : 'notice" role="status') + '">' + safe(message) + '</p>' : '')
    + '<hr><h3>Historie předání</h3><ol class="history">' + log + '</ol></section></div>'
    + '<p class="lede"><button type="button" data-action="reset">Obnovit ukázková data</button></p>';
  document.querySelector('#role').value = role;
  if (focus) document.querySelector(focus)?.focus();
}

async function update(action, value) {
  const save = () => {
    const result = action === 'reset' ? { state: initialHandover(), active: 'ZAV-DEMO-001' }
      : transition(load(), { role, action, id: active, value });
    localStorage.setItem(key, JSON.stringify(result.state));
    state = result.state;
    active = result.active;
  };
  if (navigator.locks) await navigator.locks.request(key, save);
  else save();
}

view.addEventListener('change', event => {
  if (event.target.id !== 'role') return;
  role = event.target.value;
  render('', false, '#role');
});
view.addEventListener('click', async event => {
  const selected = event.target.closest('[data-ticket]');
  if (selected) {
    active = selected.dataset.ticket;
    render('', false, '#ticket-title');
    return;
  }
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const values = { submit: '#proof', return: '#reason', create: '#template' };
  const action = trigger.dataset.action;
  const field = values[action];
  const value = field ? document.querySelector(field).value : null;
  trigger.disabled = true;
  try {
    await update(action, value);
    render(action === 'reset' ? 'Ukázková data obnovena.' : 'Změna uložena.', false, '#ticket-title');
  } catch (error) {
    trigger.disabled = false;
    document.querySelector('#handover-result')?.remove();
    const message = document.createElement('p');
    message.id = 'handover-result';
    message.className = 'error';
    message.setAttribute('role', 'alert');
    message.textContent = error.message;
    (trigger.closest('div.row') ?? trigger.parentElement).after(message);
    if (field) document.querySelector(field)?.focus();
  }
});

window.addEventListener('storage', event => {
  if (event.key === key) {
    state = load();
    render();
  }
});
render();
