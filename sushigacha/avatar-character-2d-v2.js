'use strict';
(() => {
  if(!window.SushiAvatar2D) return;
  const base=window.SushiAvatar2D.render;
  const SKINS=['#f4cfae','#dba77f','#ac7657'];
  const HAIRS=['#493b32','#9b6241','#323b52'];
  const TOPS={starter:['#f6f1e4','#f4511e'],salmon:['#f48c79','#fff2d6'],tea:['#8baf8d','#d7e7bf'],sky:['#91bbcb','#edf7ef'],lemon:['#eacb64','#fff0ac'],berry:['#b795b7','#ecd8e9'],navy:['#3f657b','#f4ead0'],sailor:['#f5f0df','#32667d'],explorer:['#b99c70','#706044'],chef:['#f7f4e9','#2c5860'],varsity:['#587f6b','#efe0b6'],royal:['#eee0a4','#b4524b'],cosmic:['#56628e','#dfc685'],'school-blazer-m':['#172d4e','#9c1f35'],'school-blazer-f':['#172d4e','#9c1f35']};
  const BOTTOMS={'basic-bottom':'#334155','school-slacks-m':'#38414d','school-skirt-f':'#323845'};
  const stride=[-1,-.38,.38,1];
  function color(a){const t=TOPS[a.top]||TOPS.starter;return{skin:SKINS[a.skin]||SKINS[0],hair:HAIRS[a.hairColor]||HAIRS[0],top:t[0],accent:t[1],bottom:BOTTOMS[a.bottom]||BOTTOMS['basic-bottom']};}
  function extras(a,d){
    const c=color(a), side=d==='left'||d==='right', back=d==='back'; let s='';
    if(a.accessory==='acc-headphones'){
      s+=side?`<path d="M52 69Q79 34 108 67" fill="none" stroke="#334155" stroke-width="7"/><rect x="104" y="68" width="10" height="24" rx="5" fill="#334155"/>`:`<path d="M49 70Q80 31 111 70" fill="none" stroke="#334155" stroke-width="7"/><rect x="45" y="69" width="10" height="24" rx="5" fill="#334155"/><rect x="105" y="69" width="10" height="24" rx="5" fill="#334155"/>`;
    }
    if(a.accessory==='acc-scarf') s+=side?`<path d="M59 111Q83 120 103 107L108 124Q83 134 59 123Z" fill="#e56f61"/><path d="M97 119L112 153L99 150L90 124Z" fill="#d85f54"/>`:`<path d="M53 110Q80 124 107 110L110 126Q80 139 50 126Z" fill="#e56f61"/><path d="M99 122L111 158L98 154L90 128Z" fill="#d85f54"/>`;
    if(a.accessory==='acc-star') s+=`<circle cx="82" cy="132" r="5" fill="#facc15"/><path d="M82 123V112" stroke="#c59b27" stroke-width="2"/>`;
    if(a.accessory==='acc-glasses'&&side) s+=`<circle cx="106" cy="80" r="9" fill="none" stroke="#374151" stroke-width="3"/><path d="M114 80H121" stroke="#374151" stroke-width="3"/>`;
    if(back&&(a.top==='school-blazer-m'||a.top==='school-blazer-f')) s+=`<path d="M57 116Q80 129 103 116" fill="none" stroke="#0d1e37" stroke-width="3"/><circle cx="96" cy="143" r="3" fill="#d6b55d"/>`;
    if(side&&(a.top==='school-blazer-m'||a.top==='school-blazer-f')) s+=`<path d="M73 116L86 133L99 115" fill="#f7f7f2"/><path d="M88 125L91 148" stroke="#9b1f35" stroke-width="5"/>`;
    return s;
  }
  function fourFrame(a,o){
    const d=o.direction||'front', f=((o.frame||0)%4+4)%4;
    if(d==='front') return base(a,{direction:d,frame:f});
    let svg=base(a,{direction:d,frame:f%2});
    const amp=stride[f];
    svg=svg.replace('<svg ','<svg data-walk-frame="'+f+'" ');
    if(d==='back') svg=svg.replace('<g transform="translate(0 ',`<g transform="translate(${amp*1.5} `);
    svg=svg.replace('</svg>',extras(a,d)+'</svg>');
    return svg;
  }
  window.SushiAvatar2D.render=(a,o={})=>fourFrame(a,o);
})();
