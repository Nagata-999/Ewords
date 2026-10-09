'use strict';
/* Declarative achievement definitions; no gem or sync side effects. */
(function(global){
  const tier=(id,title,metric,steps)=>({id,title,metric,stages:steps.map(([threshold,color,points,gems])=>({threshold,color,points,gems}))});
  const seven=[[10,'white',10,10],[100,'yellow',25,25],[1000,'orange',50,50],[5000,'green',75,75],[10000,'blue',100,100],[50000,'purple',200,200],[100000,'black',300,300]];
  const catalog=[
    tier('vocabulary','語彙の達人','correct_vocabulary',seven),
    tier('all_correct','学習の達人','correct_total',[[10,'white',10,10],[500,'yellow',25,25],[2000,'orange',50,50],[5000,'green',75,75],[15000,'blue',100,100],[50000,'purple',200,200],[150000,'black',300,300]]),
    tier('review','七転び八起き','review_correct',[[10,'white',10,10],[100,'yellow',25,25],[1000,'orange',50,50],[5000,'green',100,100]]),
    tier('streak','習慣の力','login_streak',[[3,'white',10,10],[7,'yellow',25,25],[30,'orange',50,50],[100,'blue',100,100],[365,'purple',250,300]]),
    tier('daily','毎日の積み重ね','daily_claims',[[1,'white',10,10],[10,'yellow',25,25],[100,'blue',100,100]]),
    tier('gems','ジェム収集家','gems_earned',[[100,'white',10,10],[1000,'yellow',25,25],[10000,'blue',100,100]]),
    tier('avatar','ファッションリーダー','avatar_items',[[1,'white',10,10],[10,'orange',50,50],[30,'purple',150,150]]),
    tier('giri','伝説の剣士','giri_high_score',[[10000,'yellow',25,25],[30000,'blue',100,100],[50000,'purple',250,300]]),
    tier('blast','ブロック職人','blast_plays',[[10,'yellow',25,25],[100,'blue',100,100]]),
    tier('perfect','パーフェクト！','blast_perfect',[[10,'yellow',25,25],[100,'blue',100,100]]),
    tier('toeic','TOEICマスター','toeic_correct',[[10,'white',10,10],[100,'yellow',25,25],[1000,'purple',250,300]]),
    tier('combo','完璧主義者','correct_streak',[[10,'white',10,10],[50,'orange',50,50],[100,'purple',200,200]])
  ];
  const oneTime=[
    {id:'first_game',title:'初陣',metric:'giri_plays',threshold:1,points:10,gems:10},
    {id:'first_purchase',title:'はじめてのお買い物',metric:'gem_purchases',threshold:1,points:10,gems:10},
    {id:'first_outfit',title:'おしゃれ初心者',metric:'outfit_changes',threshold:1,points:10,gems:10},
    {id:'all_games_day',title:'全部盛り',metric:'distinct_games_in_day',threshold:5,points:100,gems:100,secret:true},
    {id:'resilience',title:'不屈の精神',metric:'repeat_mistake_recovered',threshold:1,points:100,gems:100,secret:true},
    {id:'comeback',title:'奇跡の復活',metric:'comeback_streak',threshold:1,points:100,gems:100,secret:true}
  ];
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
  global.SushiAchievementCatalog=Object.freeze({definitions,evaluate});
})(window);
