
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import vm from 'node:vm';
import worker from '../cloudflare/werewolf/worker.mjs';

const file = path => readFileSync(new URL(path, import.meta.url), 'utf8');
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(file('../cloudflare/werewolf/schema.sql'));
  const DB = {
    withSession(mode) { assert.equal(mode, 'first-primary'); return DB; },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() { return sqlite.prepare(sql).get(...args); },
            async run() { return { meta: sqlite.prepare(sql).run(...args) }; }
          };
        }
      };
    }
  };
  return { sqlite, DB };
}
const token = () => randomBytes(32).toString('hex');

test('17 students, concurrent room operations, private state and runoff', async () => {
  const { sqlite, DB } = database();
  let reads = 0;
  const prepare = DB.prepare;
  DB.prepare = sql => { if (sql.startsWith('SELECT *')) reads++; return prepare(sql); };
  const origin = 'https://school.example';
  const host = token();
  const students = Array.from({ length: 17 }, token);
  const players = students.map((_, id) => ({ name: 'Player ' + (id + 1), alive: true, speaks: 0 }));
  let code = '';
  async function call(key, body, expected = 200) {
    const path = '/api/werewolf/rooms' + (code ? '/' + code : '');
    const response = await worker.fetch(new Request(origin + path, {
      method: body ? 'POST' : 'GET',
      headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Werewolf-Token': key },
      body: body && JSON.stringify(body)
    }), { DB });
    const data = await response.json();
    assert.equal(response.status, expected, JSON.stringify(data));
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    return data;
  }
  const snapshot = { day: 1, phase: 2, players: players.map(p => ({ ...p, role: 'SECRET' })) };
  const created = await call(host, snapshot, 201);
  const replay = await call(host, snapshot);
  assert.equal(created.code, replay.code);
  code = created.code;
  assert.match(code, /^\d{6}$/);
  const projected = await call('');
  assert.equal(projected.phase, 1);
  assert.equal(projected.members, undefined);
  assert.equal(projected.me, undefined);
  assert.equal(projected.players.length, 17);
  const before = reads;
  await Promise.all(students.map(key => call(key)));
  assert.equal(reads, before, 'polls reuse the same read within one isolate');
  assert.doesNotMatch(JSON.stringify(projected), /SECRET|role|proof/);
  const pending = await Promise.all(students.map((key, id) => call(key, { action: 'join', id })));
  await call(token(), { action: 'join', id: 0 }, 409);
  await call(students[0], { action: 'join', id: 1 }, 409);
  await call(students[0], { action: 'approve', id: 0, proof: pending[0].me.proof }, 403);
  await call(students[0], { action: 'vote', id: 1, round: 1 }, 403);
  await Promise.all(pending.map((s, id) => call(host, { action: 'approve', id, proof: s.me.proof })));
  assert.equal((await call(students[10])).me.id, 10);
  await call(students[0], { action: 'vote', id: 0, round: 1 }, 409);
  await call(students[0], { action: 'sync', ...snapshot }, 403);
  players[16].alive = false;
  players[0].speaks = 2;
  await call(host, { action: 'sync', day: 2, phase: 12, players });
  await call(host, { action: 'open' }, 409);
  await call(host, { action: 'mode', mode: 'online' });
  await call(host, { action: 'open' });
  await call(students[16], { action: 'vote', id: 0, round: 1 }, 403);
  await call(students[0], { action: 'vote', id: 16, round: 1 }, 409);
  await Promise.all(students.slice(0, 16).map((key, index) => call(key, { action: 'vote', id: index % 2, round: 1 })));
  await call(students[0], { action: 'vote', id: 0, round: 1 });
  await call(students[0], { action: 'vote', id: 1, round: 1 }, 409);
  const during = await call(host);
  assert.equal(during.round.received, 16);
  assert.equal(during.round.eligible, 16);
  assert.equal(during.round.totals, undefined);
  const reconnected = await call(students[0]);
  assert.equal(reconnected.me.voted, true);
  assert.deepEqual(reconnected.me.receipts, [1]);
  assert.equal(reconnected.round.received, undefined);
  assert.equal(reconnected.players[0].speaks, 2);
  await call(host, { action: 'close', round: 1 });
  assert.equal((await call('')).result, null);
  assert.deepEqual((await call(host)).round.totals.slice(0, 2), [{ id: 0, count: 8 }, { id: 1, count: 8 }]);
  await call(host, { action: 'publish', round: 1 });
  assert.equal((await call('')).result.totals[0].count, 8);
  const runoff = await call(host, { action: 'open', runoff: true });
  assert.deepEqual(runoff.round.candidates, [0, 1]);
  assert.equal(runoff.result, null);
  await call(students[0], { action: 'vote', id: 2, round: 2 }, 409);
  await call(students[0], { action: 'vote', id: 0, round: 1 }, 409);
  await call(host, { action: 'close', round: 2 });
  await call(students[0], { action: 'vote', id: 1, round: 2 }, 409);
  await call(students[0], { action: 'end' }, 403);
  await call(host, { action: 'end' });
  assert.deepEqual((await call('')).players, []);
  const stored = sqlite.prepare('SELECT * FROM werewolf_rooms').get();
  assert.doesNotMatch(JSON.stringify(stored), /Player |SECRET/);
  sqlite.exec('UPDATE werewolf_rooms SET expires=0');
  await worker.scheduled({}, { DB });
  await call('', null, 404);
  sqlite.close();
});

test('legacy names and storage keys, scripts and offline QR bundle', () => {
  const html = file('../werewolf.html');
  assert.match(html, /Three, two, one, POINT!/);
  assert.match(html, /sushitan-werewolf-classroom-v1/);
  assert.match(html, /sushitan-werewolf-private-roles-v1/);
  assert.match(html, /sushi-topics-classroom-v1/);
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  new vm.Script(file('../shared/werewolf-online.js'));
  const context = vm.createContext({});
  vm.runInContext(file('../shared/werewolf-qr.js'), context);
  const qr = context.qrcode(0, 'M');
  qr.addData('https://sushitan.net/werewolf.html?student=1&room=123456');
  qr.make();
  assert.match(qr.createDataURL(4, 16), /^data:image\/gif;base64,/);
});