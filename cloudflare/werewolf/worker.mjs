
const root = '/api/werewolf/rooms';
const lifetime = 24 * 60 * 60 * 1000;
const tokenFormat = /^[a-f0-9]{64}$/;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const reply = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
function requireThat(ok, status = 400, message = '入力を確認してください。') {
  if (!ok) throw Object.assign(Error(message), { status });
}
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
const statement = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);

// Share a read across nearby clients in the same Worker isolate. Mutations and
// uncertain vote receipts always consult the primary database.
const reads = new Map();
function loadRoom(env, code, fresh) {
  const now = Date.now();
  const select = () => statement(env, 'SELECT * FROM werewolf_rooms WHERE code=? AND expires>?', code, now).first();
  if (fresh) return select();
  const cached = reads.get(code);
  if (cached?.until > now) return cached.row;
  reads.delete(code);
  if (reads.size >= 128) reads.delete(reads.keys().next().value);
  const row = select().catch(error => {
    if (reads.get(code)?.row === row) reads.delete(code);
    throw error;
  });
  reads.set(code, { row, until: now + 1800 });
  return row;
}

function publicPlayers(players) {
  requireThat(Array.isArray(players) && integer(players.length, 1, 20));
  const clean = players.map((p, id) => {
    requireThat(p && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 80 &&
      typeof p.alive === 'boolean' && integer(p.speaks, 0, 10000));
    return { id, name: p.name.trim(), alive: p.alive, speaks: p.speaks };
  });
  requireThat(new Set(clean.map(p => p.name)).size === clean.length, 400, '名簿の名前を区別してください。');
  return clean;
}

function updateGame(room, body) {
  requireThat(integer(body.day, 1, 999) && integer(body.phase, 0, 13));
  room.day = body.day;
  room.phase = body.phase >= 1 && body.phase <= 8 ? 1 : body.phase;
  room.players = publicPlayers(body.players);
}

function view(room, code, key, host) {
  const me = key ? room.members.findIndex(m => m?.key === key) : -1;
  const round = room.round;
  const result = {
    code, game: room.game, closed: room.closed, day: room.day, phase: room.phase, mode: room.mode,
    players: room.closed ? [] : room.players,
    round: round && { id: round.id, status: round.status, candidates: round.candidates },
    result: room.published
  };
  if (me >= 0 && round) result.round.canVote = round.eligible.includes(me) && room.players[me].alive && room.members[me].approved;
  if (me >= 0) result.me = { id: me, approved: room.members[me].approved, proof: room.members[me].proof, receipts: room.members[me].receipts || [],
    voted: round ? Object.hasOwn(round.votes, me) : false };
  if (host) {
    result.members = room.members.map(m => m && ({ approved: m.approved, proof: m.proof }));
    if (round) {
      result.round.received = Object.keys(round.votes).length;
      result.round.eligible = round.eligible.filter(id => room.players[id].alive || Object.hasOwn(round.votes, id)).length;
      if (round.status === 'closed') result.round.totals = totals(round);
    }
  }
  return result;
}
const totals = round => round.candidates.map(id => ({
  id, count: Object.values(round.votes).filter(target => target === id).length
}));

function change(room, body, key, host) {
  const { action, id } = body;
  const round = room.round;
  requireThat(!room.closed, 410, '部屋は閉鎖されました。');
  requireThat(key, 403);
  if (action === 'join') {
    requireThat(!host && room.players[id] && Number.isInteger(id), 403);
    const previous = room.members.findIndex(m => m?.key === key);
    requireThat(previous < 0 || previous === id, 409, 'この端末は別の名前で参加済みです。');
    requireThat(!room.members[id] || previous === id, 409, 'この名前は参加申請済みです。先生に確認してください。');
    room.members[id] ??= { key, approved: false, proof: String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0') };
    return;
  }
  if (action === 'vote') {
    const voter = room.members.findIndex(m => m?.approved && m.key === key);
    requireThat(voter >= 0, 403, '参加承認が必要です。');
    requireThat(round && round.id === body.round, 409, '投票回が変わりました。');
    if (Object.hasOwn(round.votes, voter)) {
      requireThat(round.votes[voter] === id, 409, '投票は確定済みです。');
      return;
    }
    requireThat(round.status === 'open' && room.mode === 'online', 409, '投票は受付時間外です。');
    requireThat(room.players[voter].alive && round.eligible.includes(voter), 403, 'この回の投票権がありません。');
    requireThat(round.candidates.includes(id) && room.players[id].alive, 409, '投票先を確認してください。');
    round.votes[voter] = id;
    (room.members[voter].receipts ??= []).push(round.id);
    return;
  }
  requireThat(host, 403, 'GM権限が必要です。');
  switch (action) {
    case 'sync': {
      const names = room.players.map(p => p.name);
      updateGame(room, body);
      requireThat(room.players.length === names.length && room.players.every((p, i) => p.name === names[i]), 409, '開催中は名簿を変更できません。');
      break;
    }
    case 'approve':
    case 'reject':
      requireThat(Number.isInteger(id) && room.members[id] && !room.members[id].approved &&
        room.members[id].proof === body.proof, 409, '参加申請が更新されました。');
      if (action === 'approve') room.members[id].approved = true;
      else room.members[id] = null;
      break;
    case 'mode':
      requireThat(['point', 'online'].includes(body.mode) && round?.status !== 'open', 409, '投票を締め切ってから変更してください。');
      room.mode = body.mode;
      break;
    case 'open': {
      requireThat(room.mode === 'online' && round?.status !== 'open', 409, '投票方式と受付状況を確認してください。');
      const alive = room.players.filter(p => p.alive).map(p => p.id);
      let candidates = alive;
      if (body.runoff) {
        requireThat(round?.status === 'closed' && room.published?.id === round.id, 409, '結果を公開してから決選投票を開始してください。');
        const counts = totals(round);
        const highest = Math.max(...counts.map(x => x.count));
        candidates = counts.filter(x => x.count === highest && alive.includes(x.id)).map(x => x.id);
        requireThat(highest > 0 && candidates.length >= 2, 409, '決選投票の対象がありません。');
      }
      const eligible = alive.filter(id => room.members[id]?.approved);
      requireThat(candidates.length && eligible.length, 409, '生存中の候補者と承認済みの生存者が必要です。');
      room.round = { id: (round?.id ?? 0) + 1, status: 'open', candidates, eligible, votes: {} };
      room.published = null;
      break;
    }
    case 'close':
      requireThat(round?.id === body.round && round.status === 'open', 409, '受付中の投票回を確認してください。');
      round.status = 'closed';
      break;
    case 'publish':
      requireThat(round?.id === body.round && round.status === 'closed', 409, '先に投票を締め切ってください。');
      room.published = { id: round.id, totals: totals(round) };
      break;
    case 'end':
      room.closed = true;
      room.players = [];
      room.members = [];
      room.round = null;
      room.published = null;
      break;
    default:
      requireThat(false);
  }
}

async function create(env, key, body) {
  requireThat(key, 403);
  const room = { game: crypto.randomUUID(), closed: false, mode: 'point', round: null, published: null };
  updateGame(room, body);
  room.members = room.players.map(() => null);
  for (let attempt = 0; attempt < 12; attempt++) {
    const existing = await statement(env, 'SELECT code, data FROM werewolf_rooms WHERE host=? AND expires>?', key, Date.now()).first();
    if (existing) return reply(view(JSON.parse(existing.data), existing.code, key, true));
    const code = String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
    const result = await statement(env, 'INSERT OR IGNORE INTO werewolf_rooms(code, host, expires, data) VALUES (?, ?, ?, ?)',
      code, key, Date.now() + lifetime, JSON.stringify(room)).run();
    if (result.meta.changes) {
      reads.delete(code);
      return reply(view(room, code, key, true), 201);
    }
  }
  return reply({ message: '部屋を作成できませんでした。再試行してください。' }, 503);
}

export default {
  async fetch(request, bindings) {
    try {
      const url = new URL(request.url);
      const code = url.pathname.startsWith(root + '/') ? url.pathname.slice(root.length + 1) : '';
      const post = request.method === 'POST';
      requireThat(/^\d{6}$/.test(code) || (post && url.pathname === root), 404);
      requireThat(post || request.method === 'GET', 405);
      if (post) requireThat(request.headers.get('Origin') === (bindings.PUBLIC_ORIGIN || url.origin), 403);
      const raw = request.headers.get('X-Werewolf-Token') || '';
      requireThat(!raw || tokenFormat.test(raw), 403);
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      if (bindings.ROOM_LIMIT) {
        const limit = post && !code ? 'create:' + ip : raw || 'public:' + ip;
        requireThat((await bindings.ROOM_LIMIT.limit({ key: limit })).success, 429, '少し待ってから再試行してください。');
      }
      const key = raw && await digest(raw);
      const env = { DB: bindings.DB.withSession('first-primary') };
      let body;
      if (post) {
        requireThat(request.headers.get('Content-Type')?.startsWith('application/json'), 415);
        const reader = request.body?.getReader();
        requireThat(reader, 400);
        const decoder = new TextDecoder();
        let input = '', size = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8192) { await reader.cancel(); requireThat(false, 413); }
          input += decoder.decode(value, { stream: true });
        }
        try { body = JSON.parse(input + decoder.decode()); } catch { requireThat(false); }
        requireThat(body && typeof body === 'object' && !Array.isArray(body));
      }
      if (!code) return await create(env, key, body);
      for (let attempt = 0; attempt < 40; attempt++) {
        const row = await loadRoom(env, code, post || url.searchParams.has('fresh'));
        requireThat(row && row.expires > Date.now(), 404, '部屋が見つかりません。コードまたは有効期限を確認してください。');
        const room = JSON.parse(row.data);
        const host = !!key && key === row.host;
        if (!post) return reply(view(room, code, key, host));
        change(room, body, key, host);
        const update = await statement(env,
          'UPDATE werewolf_rooms SET data=?, revision=revision+1 WHERE code=? AND revision=? AND expires>?',
          JSON.stringify(room), code, row.revision, Date.now()).run();
        if (update.meta.changes) {
          reads.delete(code);
          return reply(view(room, code, key, host));
        }
      }
      return reply({ message: '通信が集中しています。再試行してください。' }, 503);
    } catch (error) {
      return reply({ message: error.status ? error.message : 'サーバーに接続できません。' }, error.status || 500);
    }
  },
  async scheduled(_event, env) {
    reads.clear();
    await statement(env, 'DELETE FROM werewolf_rooms WHERE expires<=?', Date.now()).run();
  }
};