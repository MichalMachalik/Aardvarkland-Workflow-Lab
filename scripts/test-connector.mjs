import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { verifyDispatch } from '../src/dispatch-core.js';
import fixtures from '../connector/fixtures.json' with { type: 'json' };

const binary = fileURLToPath(new URL('../connector/bin/Debug/net10.0/DispatchConnector.dll', import.meta.url));
const samples = [
  ['EXP-DEMO-351', 'PK-DEMO-611'], ['EXP-DEMO-351', 'PK-DEMO-612'],
  ['EXP-DEMO-351', 'ST-DEMO-802'], ['EXP-DEMO-351', 'MISSING'],
];
const message = (method, id, params) => ({ jsonrpc: '2.0', method, id, params });
const requests = [
  message('initialize', 1, { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'check', version: '1' } }),
  message('notifications/initialized'), message('tools/list', 2),
  ...samples.map(([shipment, document], i) => message('tools/call', i + 3, { name: 'verify_dispatch', arguments: { shipment, document } })),
];
const stdio = spawnSync('dotnet', [binary, '--mcp'], {
  input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
  encoding: 'utf8', timeout: 10000,
});
assert.equal(stdio.status, 0, stdio.stderr);
const replies = stdio.stdout.trim().split(/\r?\n/).map(row => JSON.parse(row));
assert.equal(replies.length, 6);
assert.equal(replies[0].result.protocolVersion, '2025-11-25');
assert.equal(replies[1].result.tools[0].name, 'verify_dispatch');
for (const [[shipment, document], reply] of samples.map((example, i) => [example, replies[i + 2]])) {
  assert.deepEqual(reply.result.structuredContent, verifyDispatch(fixtures, shipment, document));
  assert.equal(reply.result.isError, false);
}
console.log('MCP stdio initialization, listing and verification: 4/4 cases.');

const server = spawn('dotnet', [binary], { stdio: 'pipe', windowsHide: true });
try {
  const origin = 'http://127.0.0.1:4181/api/verify';
  let online = false;
  for (let attempt = 0; attempt < 40 && server.exitCode === null; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.status === 400) { online = true; break; }
    } catch { /* The HTTP server is starting. */ }
    await delay(120);
  }
  assert(online, 'Connector HTTP server failed to start.');
  for (const [shipment, document] of samples) {
    const query = new URLSearchParams({ shipment, document });
    const response = await fetch(origin + '?' + query);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), verifyDispatch(fixtures, shipment, document));
  }
  assert.equal((await fetch(origin + '?shipment=MISSING&document=PK-DEMO-611')).status, 404);
  console.log('REST connector/browser parity: 4/4 cases and one unknown shipment.');
} finally {
  server.kill();
}
