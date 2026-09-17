/* Shared, local-first learning. No Supabase or reward-ledger writes. */
(function (global) {
  'use strict';
  const VERSION = 1, PREFIX = 'sushitan_learning_v1:', EVENT = PREFIX + 'event:';
  const CONFIG = Object.freeze({wrong:30, correct:8, streakBonus:2, maxBonus:8,
    maxWeakness:100, minimumStreak:4, singleGameStreak:6, staleDays:3, staleBonus:2, maxStaleBonus:20, reviewBatch:20});
  const registry = global.SushiWordRegistry?.words || [];
  const byId = new Map(registry.map(w => [w.word_id, w]));
  const normalize = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const aliases = new Map();
  for (const word of registry) for (const alias of [word.en, ...(word.aliases || [])]) {
    const key = normalize(alias);
    if (aliases.has(key) && aliases.get(key) !== word.word_id) throw new Error('Ambiguous vocabulary alias: ' + key);
    aliases.set(key, word.word_id);
  }
  const events = new Map(), progress = new Map(), wordEvents = new Map(), dirtyWords = new Set();
  let storageError = '', scannedLength = -1, latestAt = 0;
  const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
  const day = time => new Date(Number(time) + 9 * 3600000).toISOString().slice(0,10);
  function resolveWordId(word) {
    if (typeof word === 'object' && word) {
      if (byId.has(word.word_id)) return word.word_id;
      word = word.en || word.word || word.english || (Array.isArray(word) ? word[0] : '');
    }
    return byId.has(word) ? word : aliases.get(normalize(word)) || null;
  }
  function warn(message) {
    if (storageError === message) return;
    storageError = message;
    global.dispatchEvent(new CustomEvent('sushi-learning-storage', {detail:{message}}));
  }
  function valid(event) {
    return event && event.version === VERSION && typeof event.id === 'string' &&
      byId.has(event.word_id) && typeof event.correct === 'boolean' &&
      typeof event.game_id === 'string' && /^[a-z0-9_-]{1,40}$/.test(event.game_id) &&
      Number.isFinite(event.at) && Number.isSafeInteger(event.count) && event.count > 0;
  }
  function ingest(event) {
    if (!valid(event) || events.has(event.id)) return;
    events.set(event.id,event); latestAt=Math.max(latestAt,event.at);
    if(!wordEvents.has(event.word_id))wordEvents.set(event.word_id,[]);
    wordEvents.get(event.word_id).push(event);dirtyWords.add(event.word_id);
  }
  function refresh() {
    try {
      const length=localStorage.length;
      for (let i=0; scannedLength!==length && i<length; i++) {
        const key=localStorage.key(i);
        if (!key?.startsWith(EVENT) || events.has(key.slice(EVENT.length))) continue;
        try {
          const event=JSON.parse(localStorage.getItem(key));
          if (valid(event) && key===EVENT+event.id) ingest(event);
          else warn('読み取れない学習記録を保持しています。既存の記録は上書きしていません。');
        } catch { warn('読み取れない学習記録を保持しています。既存の記録は上書きしていません。'); }
      }
      scannedLength=length;
    } catch { warn('学習履歴をブラウザに保存できません。このページ内だけで記録を続けます。'); }
    for(const id of dirtyWords){
    progress.delete(id);
    for (const event of wordEvents.get(id).sort((a,b)=>a.at-b.at || a.id.localeCompare(b.id))) {
      let p=progress.get(event.word_id);
      if (!p) {
        p={word_id:event.word_id,correct_count:0,wrong_count:0,last_seen:null,last_wrong:null,
          weakness_score:0,status:'new',mastery:0,streak:0,success_games:[],games:Object.create(null),mastered_at:null,review_days:{}};
        progress.set(event.word_id,p);
      }
      const wasWeak=p.wrong_count>0 && p.status!=='mastered';
      const g=p.games[event.game_id] ||= {correct_count:0,wrong_count:0,last_seen:null,last_wrong:null};
      p.last_seen=g.last_seen=event.imported && event.at===0 ? null : new Date(event.at).toISOString();
      if (event.correct) {
        p.correct_count+=event.count; g.correct_count+=event.count; p.streak+=event.count;
        if (!p.success_games.includes(event.game_id)) p.success_games.push(event.game_id);
        p.weakness_score=Math.max(0,p.weakness_score-CONFIG.correct-Math.min(CONFIG.maxBonus,(p.streak-1)*CONFIG.streakBonus));
      } else {
        p.wrong_count+=event.count;g.wrong_count+=event.count;p.streak=0;p.success_games=[];
        p.last_wrong=g.last_wrong=p.last_seen;
        p.weakness_score=Math.min(CONFIG.maxWeakness,p.weakness_score+CONFIG.wrong*event.count);
        p.mastered_at=null;
      }
      const required=p.success_games.length>=2?CONFIG.minimumStreak:CONFIG.singleGameStreak;
      const mastered=p.wrong_count>0 && p.streak>=required && p.weakness_score===0;
      if (mastered && p.status!=='mastered') p.mastered_at=p.last_seen;
      p.status=mastered?'mastered':p.wrong_count?(p.streak?'learning':'weak'):'new';
      p.mastery=p.wrong_count?Math.min(mastered?100:99,Math.round(Math.min(p.streak/required,1)*(100-p.weakness_score))):0;
      if (!event.imported && wasWeak) p.review_days[day(event.at)]=true;
    }
    }
    dirtyWords.clear();
  }
  function persist(event) {
    if(!valid(event)){warn('形式が正しくない学習記録の保存を中止しました。元の記録は保持しています。');return false;}
    ingest(event);
    try {
      const key=EVENT+event.id;
      const existing=localStorage.getItem(key);
      if (existing && existing !== JSON.stringify(event)) { warn('既存の学習記録と衝突したため保存を中止しました。');return false; }
      if (!existing) localStorage.setItem(key,JSON.stringify(event));
      return true;
    } catch { warn('学習履歴をブラウザに保存できません。このページ内だけで記録を続けます。'); return false; }
  }
  function recordAnswer(wordId, isCorrect, gameId) {
    const id=resolveWordId(wordId);
    if (!id || typeof isCorrect!=='boolean' || typeof gameId!=='string' || !/^[a-z0-9_-]{1,40}$/.test(gameId)) return null;
    refresh();const before=clone(progress.get(id));
    const event={version:VERSION,id:global.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),
      word_id:id,correct:isCorrect,game_id:gameId,at:Math.max(Date.now(),latestAt+1),count:1};
    const persisted=persist(event);refresh();const after=clone(progress.get(id));
    const detail={version:VERSION,event:clone(event),progress:after,persisted,
      was_review:!!before?.wrong_count && before.status!=='mastered',
      mastered:before?.status!=='mastered' && after.status==='mastered'};
    global.dispatchEvent(new CustomEvent('sushi-learning-answer',{detail}));
    if (detail.mastered) global.dispatchEvent(new CustomEvent('sushi-learning-mastered',{detail}));
    return after;
  }
  function getWordProgress(id) { refresh();return clone(progress.get(resolveWordId(id))); }
  function getWeakWords() {
    refresh();const now=Date.now();
    return [...progress.values()].filter(p=>p.wrong_count>0 && p.status!=='mastered').map(p=>{
      const overdue=p.last_seen?Math.max(0,Math.floor((now-Date.parse(p.last_seen))/86400000)-CONFIG.staleDays):CONFIG.maxStaleBonus/CONFIG.staleBonus;
      return {...clone(byId.get(p.word_id)),...clone(p),priority:p.weakness_score+Math.min(CONFIG.maxStaleBonus,overdue*CONFIG.staleBonus)};
    }).sort((a,b)=>b.priority-a.priority || (a.last_seen||'').localeCompare(b.last_seen||'') || a.word_id.localeCompare(b.word_id));
  }
  function getReviewWords(count=CONFIG.reviewBatch) { return getWeakWords().slice(0,Math.max(0,Math.floor(Number(count)||0))); }
  function getStats() {
    refresh();const today=day(Date.now());const all=[...progress.values()];
    return {weak:all.filter(p=>p.wrong_count && p.status!=='mastered').length,
      today_review:all.filter(p=>p.wrong_count && p.status!=='mastered' && !p.review_days[today]).length,
      reviewed_today:all.filter(p=>p.review_days[today]).length,
      mastered_today:all.filter(p=>p.status==='mastered' && day(Date.parse(p.mastered_at))===today).length,
      mastered:all.filter(p=>p.status==='mastered').length};
  }
  function importLegacy(source,key,select) {
    const marker=PREFIX+'migration:'+source;
    try {
      if (localStorage.getItem(marker)) return;
      const raw=localStorage.getItem(key);if (!raw) return;
      const data=JSON.parse(raw);const rows=select(data);if (!rows || typeof rows!=='object' || Array.isArray(rows)) return;
      let saved=true;const grouped=new Map();
      for (const row of Object.values(rows)) {
        const id=resolveWordId(row);if (!id) continue;
        const previous=grouped.get(id)||{count:0,at:0};
        previous.count+=Math.max(1,Math.floor(Number(row.misses)||1));
        previous.at=Math.max(previous.at,Date.parse(row.lastMissedAt || row.last_wrong || '')||0);
        grouped.set(id,previous);
      }
      for(const [id,legacy] of grouped){
        const eventId='import-'+source+'-'+id;
        if (localStorage.getItem(EVENT+eventId)) continue;
        saved=persist({version:VERSION,id:eventId,word_id:id,correct:false,game_id:source,
          at:legacy.at,count:legacy.count,imported:true}) && saved;
      }
      if (saved) localStorage.setItem(marker,JSON.stringify({version:VERSION,at:Date.now()}));
    } catch { warn('以前の苦手記録を読み込めませんでした。元データは保持しています。'); }
  }
  refresh();
  importLegacy('sushitan','sushitan_word_review_v1',data=>data);
  // v2 supersedes v1: never import both versions of the same legacy state.
  let hasV2=false;try{hasV2=!!localStorage.getItem('sushian:v2:learningState');}catch{}
  importLegacy('sushian',hasV2?'sushian:v2:learningState':'sushian:v1:learningState',data=>data?.weakWords);
  global.SushiLearning=Object.freeze({version:VERSION,CONFIG,resolveWordId,recordAnswer,getWeakWords,getReviewWords,getWordProgress,getStats,
    getWord:id=>clone(byId.get(resolveWordId(id))),getStorageStatus:()=>({ok:!storageError,message:storageError}),
    exportData:()=>{refresh();return {version:VERSION,registry_version:global.SushiWordRegistry.version,events:clone([...events.values()]),words:clone([...progress.values()])};}});
  global.addEventListener('storage',event=>{if(event.key?.startsWith(PREFIX)){scannedLength=-1;refresh();global.dispatchEvent(new CustomEvent('sushi-learning-change'));}});
})(window);
