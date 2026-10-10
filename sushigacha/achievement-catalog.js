'use strict';
/* Declarative achievement definitions; no gem or sync side effects. */
(function(global){
  const tier=(id,title,metric,steps)=>({id,title,metric,stages:steps.map(([threshold,color,points,gems])=>({threshold,color,points,gems}))});
  const seven=[[10,'white',10,10],[100,'yellow',25,25],[1000,'orange',50,50],[5000,'green',75,75],[10000,'blue',100,100],[50000,'purple',200,200],[100000,'black',300,300]];
  const catalog=[
    tier('vocabulary','語彙の達人','correct_vocabulary',seven),
    tier('all_correct','学習の達人','correct_total',[[10,'white',10,10],[500,'yellow',25,25],[2000,'orange',50,50],[5000,'green',75,75],[15000,'blue',100,100],[50000,'purple',200,200],[150000,'black',300,300]]),
    tier('review','七転び八起き','review_correct',[[10,'white',10,10],[100,'yellow',25,25],[1000,'orange',50,50],[5000,'green',100,100]]),
    tier('practice','Practice makes perfect!','login_visit_streak',[[7,'white',10,10],[14,'yellow',25,25],[21,'orange',50,50],[28,'green',75,75],[35,'blue',100,100],[42,'purple',200,200],[49,'black',300,300]]),
    tier('streak','習慣の力','login_streak',[[3,'white',10,10],[7,'yellow',25,25],[30,'orange',50,50],[100,'blue',100,100],[365,'purple',250,300]]),
    tier('daily','毎日の積み重ね','daily_claims',[[1,'white',10,10],[10,'yellow',25,25],[100,'blue',100,100]]),
    tier('gems','ジェム収集家','gems_earned',[[100,'white',10,10],[1000,'yellow',25,25],[10000,'blue',100,100]]),
    tier('avatar','ファッションリーダー','avatar_items',[[1,'white',10,10],[10,'orange',50,50],[30,'purple',150,150]]),
    tier('giri','伝説の剣士','giri_high_score',[[10000,'yellow',25,25],[30000,'blue',100,100],[50000,'purple',250,300]]),
    tier('blast','ブロック職人','blast_high_score',[[1000,'white',10,10],[5000,'yellow',25,25],[10000,'blue',100,100],[20000,'purple',200,200]]),
    tier('toeic','TOEICマスター','toeic_correct',[[10,'white',10,10],[100,'yellow',25,25],[1000,'purple',250,300]]),
    tier('combo','完璧主義者','correct_streak',[[10,'white',10,10],[50,'orange',50,50],[100,'purple',200,200]])
  ];
  const oneTime=[
    {id:'login_03',secret:true,title:'こんな時間に勉強？',metric:'login_03',threshold:1,points:10,gems:10},
    {id:'login_05',secret:true,title:'一日の初めに勉強',metric:'login_05',threshold:1,points:10,gems:10},
    {id:'login_23',secret:true,title:'まだ勉強するの？',metric:'login_23',threshold:1,points:10,gems:10},
    {id:'first_purchase',title:'はじめてのお買い物',metric:'gem_purchases',threshold:1,points:10,gems:10},
    {id:'first_outfit',title:'おしゃれ初心者',metric:'outfit_changes',threshold:1,points:10,gems:10},
    {id:'all_games_day',title:'全部盛り',metric:'distinct_games_in_day',threshold:5,points:100,gems:100,secret:true},
    {id:'resilience',title:'不屈の精神',metric:'repeat_mistake_recovered',threshold:1,points:100,gems:100,secret:true},
    {id:'comeback',title:'奇跡の復活',metric:'comeback_streak',threshold:1,points:100,gems:100,secret:true}
  ];
  const descriptions=Object.freeze({
    vocabulary:n=>`すし単で英単語を累計${n.toLocaleString()}問正解する`,
    all_correct:n=>`対象の英語学習ゲームで累計${n.toLocaleString()}問正解する`,
    review:n=>`苦手単語の復習で累計${n.toLocaleString()}問正解する`,
    practice:n=>`サイトに${n}日連続でログインする（日本時間・日付は0時に切り替え）`,
    login_03:()=> '日本時間の午前3時台（3:00〜3:59）にログインする',
    login_05:()=> '日本時間の午前5時台（5:00〜5:59）にログインする',
    login_23:()=> '日本時間の午後11時台（23:00〜23:59）にログインする',
    streak:n=>`ログインボーナスを${n.toLocaleString()}日連続で達成する`,
    daily:n=>`デイリークエストの報酬を累計${n.toLocaleString()}回受け取る`,
    gems:n=>`ジェムを累計${n.toLocaleString()}個獲得する`,
    avatar:n=>`アバターのアイテムを${n.toLocaleString()}種類集める`,
    giri:n=>`すし斬りで1回のプレイ中に${n.toLocaleString()}点以上獲得する`,
    blast:n=>`ブロックブラすしで1回のプレイ中に${n.toLocaleString()}点以上獲得する`,
    toeic:n=>`すしTOEICで累計${n.toLocaleString()}問正解する`,
    combo:n=>`英語の問題に${n.toLocaleString()}問連続で正解する`,
    first_purchase:()=> 'ジェムを使って初めて買い物をする',
    first_outfit:()=> 'アバターの衣装を初めて変更する',
    all_games_day:()=> '同じ日に5種類のゲームで学習する',
    resilience:()=> '繰り返し間違えた問題を正解する',
    comeback:()=> '連続正解が途切れた後に再び連続正解する'
  });
  function describe(id,threshold){return descriptions[id]?.(threshold)||'実績条件を達成する'}
  const definitions=Object.freeze([...catalog,...oneTime]);
  function evaluate(metrics={}){
    return definitions.map(d=>{
      const value=Math.max(0,Number(metrics[d.metric])||0);
      const stages=d.stages||[{threshold:d.threshold,points:d.points,gems:d.gems}];
      const reached=stages.filter(s=>value>=s.threshold);
      return {id:d.id,title:d.title,secret:!!d.secret,metric:d.metric,value,
        reached:reached.length,stageCount:stages.length,next:stages[reached.length]||null,
        claimIds:reached.map(s=>`achievement:${d.id}:${s.threshold}`)};
    });
  }
  global.SushiAchievementCatalog=Object.freeze({definitions,evaluate,describe});
})(window);
