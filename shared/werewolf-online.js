
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const student = params.has('student'), screen = params.has('screen');
  const hostKey = 'sushitan-werewolf-online-gm';
  const read = (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const make = (tag, text) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const button = (label, handler) => {
    const el = make('button', label);
    el.type = 'button';
    el.onclick = handler;
    return el;
  };
  const select = (label, choices) => {
    const el = make('select');
    el.setAttribute('aria-label', label);
    for (const [value, name] of choices) {
      const opt = make('option', name);
      opt.value = value;
      el.append(opt);
    }
    return el;
  };
  const href = (mode, code) => new URL(location.pathname + '?' + mode + '=1&room=' + code, location.origin).href;
  const phrases = [
    ['Suspicion', [
      ['I think ___ is a werewolf because ...', '…なので、___さんは人狼だと思います。'],
      ['I suspect ___ because ...', '…なので、___さんを疑っています。'],
      ['Something about ___ seems suspicious.', '___さんはどこか怪しいです。']]],
    ['Defense', [
      ['I am not a werewolf.', '私は人狼ではありません。'],
      ['I can explain why I did that.', 'なぜそうしたか説明できます。'],
      ['You have no evidence against me.', '私を疑う証拠はありません。']]],
    ['Questions', [
      ['Why do you suspect ___?', 'なぜ___さんを疑っているのですか？'],
      ['What makes you think that?', 'どうしてそう思うのですか？'],
      ['Can you explain your reasoning?', 'その理由を説明してくれますか？']]],
    ['Agreement / Disagreement', [
      ['I agree with ___ because ...', '…なので、___さんに賛成です。'],
      ['I disagree with that idea because ...', '…なので、その考えには反対です。'],
      ["That doesn't necessarily mean ___ is a werewolf.", 'それだけで___さんが人狼だとは限りません。']]],
    ['Logical Reasoning', [
      ['If ___ is telling the truth, then ...', 'もし___さんが本当のことを言っているなら、…。'],
      ['There is a contradiction in what ___ said.', '___さんの発言には矛盾があります。'],
      ['We should consider another possibility.', '別の可能性も考えましょう。']]]
  ];
  function speaking(root, players) {
    root.replaceChildren(make('h2', '英語発言補助'));
    const names = select('文に入れる名前', [['', '文に入れる名前を選ぶ'], ...players.map(p => [p.name, p.name])]);
    const entries = [];
    root.append(names);
    for (const [category, examples] of phrases) {
      const group = make('details');
      group.append(make('summary', category));
      for (const [en, ja] of examples) {
        const p = make('p'), line = make('strong', en), translation = make('small', ja);
        line.lang = 'en';
        p.append(line, make('br'), translation);
        group.append(p);
        entries.push({ en, ja, line, translation });
      }
      root.append(group);
    }
    root.querySelector('details').open = true;
    names.onchange = () => {
      for (const { en, ja, line, translation } of entries) {
        line.textContent = en.replace('___', () => names.value || '___');
        translation.textContent = ja.replace('___', () => names.value || '___');
      }
    };
  }
  function notes(root, snapshot) {
    root.replaceChildren(make('h2', '推理メモ'), make('p', 'この端末だけに保存されます。'));
    const grid = make('div');
    grid.className = 'student-grid';
    const key = 'sushitan-werewolf-notes:' + snapshot.game + ':' + snapshot.me.id;
    const saved = read(key, {});
    for (const p of snapshot.players) {
      const article = make('article');
      const mark = select(p.name + ' の判定', [['unknown', '❔ Unknown（不明）'], ['white', '⚪ White（村人）'], ['black', '⚫ Black（人狼）']]);
      const memo = make('textarea');
      memo.setAttribute('aria-label', p.name + ' の推理メモ');
      memo.placeholder = '理由・発言・気づいたこと';
      memo.rows = 3;
      mark.value = saved[p.id]?.mark || 'unknown';
      memo.value = saved[p.id]?.memo || '';
      const save = () => {
        try { put(key, { ...read(key, {}), [p.id]: { mark: mark.value, memo: memo.value } }); }
        catch { byId('wwConnection').textContent = 'メモを端末に保存できません。'; }
      };
      mark.onchange = save;
      memo.oninput = save;
      article.append(make('strong', p.name), mark, memo);
      grid.append(article);
    }
    root.append(grid);
  }

  window.initWerewolfOnline = local => {
    const panel = byId(screen ? 'wwScreen' : student ? 'wwStudent' : 'wwGM');
    const connection = make('p');
    connection.setAttribute('role', 'status');
    connection.id = 'wwConnection';
    const controls = make('div'), privateNotes = make('section'), help = make('section');
    panel.append(connection, controls, privateNotes, help);
    privateNotes.className = help.className = 'panel';
    privateNotes.hidden = help.hidden = true;

    let code = (student || screen) ? params.get('room') || '' : '';
    let credentials = !student && !screen ? read(hostKey, {}) : {};
    if (!student && !screen) code = credentials.code || '';
    let current, busy = false, timer, linkedGame, controlsFingerprint, pendingSync = false, uncertainVote;
    let failures = 0;
    let dirty = !student && !screen && !!code;
    const isGM = !student && !screen;
    const active = () => isGM && !!code;
    const memberKey = () => 'sushitan-werewolf-member:' + code;
    const status = text => { if (connection.textContent !== text) connection.textContent = text; };
    const privateToken = () => isGM ? credentials.token : student ? read(memberKey()) : null;
    const receiptKey = () => memberKey() + ':unconfirmed-vote';
    function resolveVote() {
      uncertainVote = undefined;
      localStorage.removeItem(receiptKey());
    }
    if (student && /^\d{6}$/.test(code)) {
      if (!privateToken()) put(memberKey(), token());
      uncertainVote = read(receiptKey());
    }

    async function request(body, creating = false) {
      const auth = privateToken();
      const response = await fetch('/api/werewolf/rooms' + (creating ? '' : '/' + code + (!body && uncertainVote ? '?fresh=1' : '')), {
        method: body ? 'POST' : 'GET',
        headers: { ...(body && { 'Content-Type': 'application/json' }), ...(auth && { 'X-Werewolf-Token': auth }) },
        body: body && JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(Error(data.message || '通信に失敗しました。'), { status: response.status });
      return data;
    }
    function setSnapshot(snapshot) {
      current = snapshot;
      if (snapshot.closed) {
        if (isGM) {
          code = '';
          credentials = {};
          dirty = false;
          localStorage.removeItem(hostKey);
          local.lock(false);
          current = null;
        }
        render();
        return;
      }
      if (uncertainVote && snapshot.me?.receipts.includes(uncertainVote.round)) {
        status('投票を受理しました。');
        resolveVote();
      }
      render();
    }
    function schedule() {
      clearTimeout(timer);
      const interval = failures ? Math.min(30000, 3000 * 2 ** failures) :
        current?.round?.status === 'open' || uncertainVote ? 2800 : 5500;
      if (code && !current?.closed && !document.hidden) timer = setTimeout(poll, interval + Math.random() * 600);
    }
    async function sync() {
      if (!dirty || !active()) return;
      dirty = false;
      try { setSnapshot(await request({ action: 'sync', ...local.snapshot() })); }
      catch (error) { dirty = true; throw error; }
    }
    async function poll() {
      if (busy || !code || current?.closed || document.hidden) return;
      busy = true;
      try {
        if (dirty && isGM && current) {
          await sync();
          failures = 0;
          status('接続中');
          return;
        }
        const snapshot = await request();
        failures = 0;
        if (isGM && !snapshot.members) throw Object.assign(Error('GMセッションが終了しました。'), { status: 404 });
        setSnapshot(snapshot);
        await sync();
        if (uncertainVote) {
          if (snapshot.round?.id === uncertainVote.round) {
            status('この回の投票は未受理です。受付中なら再送信できます。');
            resolveVote();
          } else {
            status('前の投票は未受理です。');
            resolveVote();
          }
        } else if (!connection.textContent.startsWith('投票を受理') && !connection.textContent.includes('未受理')) {
          status(snapshot.closed ? '部屋は閉鎖されました。' : '接続中');
        }
      } catch (error) {
        failures++;
        if (error.status === 404 && isGM) {
          credentials = {};
          code = '';
          dirty = false;
          current = null;
          localStorage.removeItem(hostKey);
          local.lock(false);
          render();
        }
        status(error.status === 404 ? error.message : '接続できません。自動で再接続します。');
      } finally { busy = false; schedule(); }
    }
    async function submit(body, creating = false) {
      if (busy) {
        if (pendingSync) return;
        // Keep the user's click when it overlaps a poll.
        pendingSync = true;
        while (busy) await new Promise(resolve => setTimeout(resolve, 50));
        pendingSync = false;
      }
      busy = true;
      controls.setAttribute('aria-busy', 'true');
      try {
        if (creating) {
          credentials.token ||= token();
          put(hostKey, credentials);
        }
        if (body.action === 'join' && !privateToken()) put(memberKey(), token());
        await sync();
        if (body.action === 'vote') {
          uncertainVote = body;
          put(receiptKey(), body);
        }
        const snapshot = await request(body, creating);
        if (creating) {
          code = credentials.code = snapshot.code;
          put(hostKey, credentials);
          local.lock(true);
          if (JSON.stringify(body.players) !== JSON.stringify(local.snapshot().players) ||
              body.day !== local.snapshot().day || body.phase !== local.snapshot().phase) dirty = true;
        }
        if (body.action === 'vote') resolveVote();
        status(body.action === 'vote' ? '投票を受理しました。' : snapshot.closed ? '部屋を閉鎖しました。' : '接続中');
        setSnapshot(snapshot);
        await sync();
      } catch (error) {
        if (body.action === 'vote' && (!error.status || error.status >= 500)) {
          uncertainVote = body;
          status('投票の受理を確認しています。再接続をお待ちください。');
        } else {
          if (body.action === 'vote') resolveVote();
          status(error.status ? error.message : '通信を確認できませんでした。再接続するか再試行してください。');
        }
      } finally { busy = false; controls.removeAttribute('aria-busy'); schedule(); }
    }

    function enter(mode) {
      const form = make('form'), input = make('input');
      input.placeholder = '6桁の参加コード';
      input.setAttribute('aria-label', '参加コード');
      input.inputMode = 'numeric';
      input.pattern = '[0-9]{6}';
      input.maxLength = 6;
      input.required = true;
      const submit = make('button', '部屋を開く');
      form.append(input, submit);
      form.onsubmit = event => {
        event.preventDefault();
        location.href = href(mode, input.value);
      };
      return form;
    }
    function result(snapshot, values) {
      const list = make('ul');
      for (const { id, count } of values) list.append(make('li', snapshot.players[id].name + ' — ' + count + '票'));
      return list;
    }
    function drawGM(snapshot, root) {
      if (!snapshot) {
        if (!code) root.append(button('オンラインゲームを作成', () => {
          if (!local.canStart()) return;
          submit({ action: 'create', ...local.snapshot() }, true);
        }));
        return;
      }
      const roomLinks = make('div');
      const join = make('a', '生徒の参加URL');
      join.href = href('student', code);
      const projection = make('a', '投影画面を開く');
      projection.href = href('screen', code);
      projection.target = '_blank';
      projection.rel = 'noopener';
      roomLinks.append(join, document.createTextNode('　'), projection);
      if (typeof window.qrcode === 'function') {
        const qr = window.qrcode(0, 'M');
        qr.addData(join.href);
        qr.make();
        const image = make('img');
        image.src = qr.createDataURL(4, 16);
        image.alt = '生徒用参加QRコード';
        image.style.display = 'block';
        roomLinks.append(image);
      }
      root.append(make('h3', '参加コード ' + code), roomLinks);
      const mode = select('投票方式', [['point', '指さし投票'], ['online', 'オンライン投票']]);
      mode.value = snapshot.mode;
      mode.disabled = snapshot.round?.status === 'open';
      mode.onchange = () => {
        const value = mode.value;
        mode.value = snapshot.mode;
        submit({ action: 'mode', mode: value });
      };
      root.append(mode);
      const round = snapshot.round;
      if (snapshot.mode === 'online') {
        if (round?.status === 'open') {
          root.append(make('p', round.received + ' / ' + round.eligible + ' 人が投票済み'),
            button('投票を締め切る', () => submit({ action: 'close', round: round.id })));
        } else {
          if (round?.status === 'closed') {
            root.append(result(snapshot, round.totals));
            if (snapshot.result?.id !== round.id) root.append(button('結果を公開', () => submit({ action: 'publish', round: round.id })));
            else {
              const highest = Math.max(...round.totals.map(x => x.count));
              if (highest && round.totals.filter(x => x.count === highest && snapshot.players[x.id].alive).length >= 2)
                root.append(button('同票者で決選投票', () => submit({ action: 'open', runoff: true })));
            }
          }
          root.append(button('オンライン投票を開始', () => {
            if (local.canStart() && (!round || snapshot.result || confirm('前回の結果を公開せずに次の投票を開始しますか？')))
              submit({ action: 'open' });
          }));
        }
      }
      root.append(make('h3', '参加状況 ' + snapshot.members.filter(m => m?.approved).length + ' / ' + snapshot.players.length));
      const list = make('ul');
      snapshot.players.forEach((p, i) => {
        const m = snapshot.members[i];
        const item = make('li', p.name + ' — ' + (m?.approved ? '承認済み' : m ? '確認番号 ' + m.proof : '未参加'));
        if (m && !m.approved) item.append(
          button('番号を照合して承認', () => {
            if (confirm(p.name + 'さんの端末に ' + m.proof + ' が表示されていますか？'))
              submit({ action: 'approve', id: i, proof: m.proof });
          }),
          button('却下', () => submit({ action: 'reject', id: i, proof: m.proof })));
        list.append(item);
      });
      root.append(list, button('部屋を閉鎖', () => {
        if (confirm('この部屋を閉鎖しますか？')) submit({ action: 'end' });
      }));
    }
    function drawStudent(snapshot, root) {
      if (!snapshot?.me) {
        if (!snapshot) return;
        const names = select('自分の名前', [['', '自分の名前を選ぶ'], ...snapshot.players.map(p => [p.id, p.name])]);
        const join = button('参加を申請', () => {
          if (names.value !== '') submit({ action: 'join', id: Number(names.value) });
        });
        root.append(names, join);
        return;
      }
      const player = snapshot.players[snapshot.me.id];
      if (!snapshot.me.approved) {
        root.append(make('p', player.name + ' — 先生に確認番号 ' + snapshot.me.proof + ' を見せてください。'));
        return;
      }
      root.append(make('h3', player.name + ' — ' + (player.alive ? 'ALIVE（生存）' : 'DEAD（退場）')));
      const round = snapshot.round;
      if (round?.status === 'open' && !snapshot.me.voted && player.alive && round.canVote) {
        const options = select('投票先', [['', '投票先を選ぶ'], ...round.candidates.filter(id => snapshot.players[id].alive).map(id => [id, snapshot.players[id].name])]);
        root.append(options, button('投票を確定', () => {
          if (options.value !== '' && confirm(options.selectedOptions[0].textContent + 'さんに投票しますか？確定後は変更できません。'))
            submit({ action: 'vote', id: Number(options.value), round: round.id });
        }));
      } else if (snapshot.me.voted) root.append(make('p', 'この回は投票済みです。'));
      else if (round?.status === 'open') root.append(make('p', 'この回の投票権はありません。'));
      if (linkedGame !== snapshot.game) {
        linkedGame = snapshot.game;
        privateNotes.hidden = help.hidden = false;
        byId('studentView').querySelectorAll(':scope > section:not(#wwStudent)').forEach(el => { el.hidden = true; });
        notes(privateNotes, snapshot);
        speaking(help, snapshot.players);
      }
    }
    function render() {
      const snapshot = current;
      if (isGM) local.script(snapshot?.mode, snapshot?.round?.status);
      if (screen && snapshot && !snapshot.closed) local.paint(snapshot);
      // Ignore speech-counter changes when rendering form controls, so selections retain focus.
      const fingerprint = JSON.stringify([code, snapshot && { ...snapshot, phase: null,
        day: null, players: snapshot.players.map(({ speaks, ...player }) => player) }]);
      if (fingerprint === controlsFingerprint) return;
      controlsFingerprint = fingerprint;
      controls.replaceChildren();
      if (!code && !isGM) {
        if (!screen || params.has('lobby')) controls.append(enter(student ? 'student' : 'screen'));
        return;
      }
      if (snapshot?.closed) {
        privateNotes.hidden = help.hidden = true;
        if (screen) local.clearScreen();
        controls.append(make('p', '部屋は閉鎖されました。'), enter(student ? 'student' : 'screen'));
        return;
      }
      if (isGM) drawGM(snapshot, controls);
      if (student) drawStudent(snapshot, controls);
      if ((student || screen) && snapshot) {
        controls.append(make('p', snapshot.round?.status === 'open' ? 'オンライン投票 受付中' :
          snapshot.round?.status === 'closed' ? 'オンライン投票 締切' : '投票受付なし'));
        if (snapshot.result) controls.append(make('h3', '公開された投票結果'), result(snapshot, snapshot.result.totals));
      }
    }

    if (student) {
      const offline = byId('studentView').querySelectorAll(':scope > section:not(#wwStudent)');
      if (code) offline.forEach(el => { el.hidden = true; });
      else speaking(offline[1], local.snapshot().players);
    }
    if (screen && !code && params.has('lobby')) local.clearScreen();
    if (active()) local.lock(true);
    render();
    if (code) poll();
    window.addEventListener('online', poll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else poll(); });
    return {
      active,
      projector: () => code ? href('screen', code) : location.pathname + '?screen=1&local=1',
      sync() {
        if (!active()) return;
        dirty = true;
        if (!busy) poll();
      },
      script: () => local.script(current?.mode, current?.round?.status)
    };
  };
})();