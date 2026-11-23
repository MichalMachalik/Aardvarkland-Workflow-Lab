import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../connector/fixtures.json' with { type: 'json' };
import { verifyDispatch } from '../src/dispatch-core.js';
import { initialHandover, transition } from '../src/handover-core.js';
import { createReceipt, quote } from '../wordpress/aardvarkland-booking/booking.js';

test('a packing protocol is accepted only for its own shipment', () => {
  assert.equal(verifyDispatch(data, 'EXP-DEMO-351', 'PK-DEMO-611').status, 'Připraveno k expedici');
  assert.deepEqual(verifyDispatch(data, 'EXP-DEMO-351', 'PK-DEMO-612'),
    { code: 'unrelated', shipmentId: 'EXP-DEMO-351', status: null, evidence: null });
  assert.equal(verifyDispatch(data, 'EXP-DEMO-351', 'ST-DEMO-802').code, 'insufficient');
  assert.equal(verifyDispatch(data, 'EXP-DEMO-351', 'MISSING').code, 'missing');
  assert.throws(() => verifyDispatch(data, 'NOSHIPMENT', 'PK-DEMO-611'));
});

test('price uses one trip and a validated count and service area', () => {
  assert.equal(quote({ units: '3', district: 'p5', slot: 'am' }).total, 3850);
  assert.equal(quote({ units: '3', district: 'p6', slot: 'pm' }).total, 3600);
  assert.equal(quote({ units: 5, district: 'p4', slot: 'pm' }).total, 6400);
  assert.throws(() => quote({ units: '5.5', district: 'p5', slot: 'am' }));
  assert.throws(() => quote({ units: 1, district: 'constructor', slot: 'am' }));
});

test('resubmission returns the same booking receipt and conversion identifier', () => {
  const input = { units: 3, district: 'p5', slot: 'am' };
  const created = createReceipt(input);
  const repeated = createReceipt(input, created.receipts);
  assert.equal(repeated.added, false);
  assert.equal(repeated.receipt.id, created.receipt.id);
  assert.equal(repeated.receipts.length, 1);
  assert.equal(createReceipt({ ...input, slot: 'pm' }, repeated.receipts).receipts.length, 2);
});

test('handover requires proof, limits transitions by role, and preserves the return trail', () => {
  let state = initialHandover();
  const id = 'ZAV-DEMO-001';
  const move = (role, action, value) => transition(state, { role, action, id, value }).state;
  assert.throws(() => move('reporter', 'take'));
  state = move('technician', 'take');
  assert.throws(() => move('technician', 'submit'));
  assert.throws(() => move('reviewer', 'close'));
  state = move('technician', 'submit', 'reset');
  assert.throws(() => move('reviewer', 'return'));
  state = move('reviewer', 'return', 'missing');
  state = move('technician', 'submit', 'secure');
  state = move('reviewer', 'close');
  const ticket = state.tickets.find(row => row.id === id);
  assert.equal(ticket.status, 'closed');
  assert.equal(ticket.proof, 'secure');
  assert.deepEqual(ticket.history.map(entry => entry.role), ['reporter', 'technician', 'technician', 'reviewer', 'technician', 'reviewer']);
  assert.match(ticket.history[3].action, /opakovanou zkoušku/);
  assert.throws(() => move('reviewer', 'close'));
  const created = transition(state, { role: 'reporter', action: 'create', value: 'handle' });
  assert.equal(created.active, 'ZAV-DEMO-003');
  assert.equal(created.state.tickets.length, 3);
});
