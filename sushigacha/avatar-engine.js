/* Shared, dependency-free SVG renderer. All interpolated values come from this catalog. */
'use strict';
(() => {
  const INK='#3e332e', SKINS=['#f3d5b1','#d7a47b','#a77051'], HAIRS=['#73503b','#b47a4d','#35424c'];
  const additions=[
    {id:'studio-chef',name:'すし職人の上着',slot:'top',kind:'chef',color:'#fff9ec',accent:'#39877e'},
    {id:'studio-hoodie',name:'放課後パーカー',slot:'top',kind:'hoodie',color:'#ee9857',accent:'#cf7440'},
    {id:'studio-wizard',name:'星のチュニック',slot:'top',kind:'cosmic',color:'#425875',accent:'#e8b557'},
    {id:'studio-headband',name:'職人の鉢巻き',slot:'hat',kind:'headband'},
    {id:'studio-wizard-hat',name:'星のとんがり帽子',slot:'hat',kind:'wizard'},
    {id:'studio-backpack',name:'青緑のリュック',slot:'back',kind:'backpack'},
    {id:'studio-cape',name:'星のマント',slot:'back',kind:'cape'},
    {id:'studio-boots',name:'冒険のブーツ',slot:'shoes',kind:'boots'},
    {id:'studio-sneakers',name:'いつものスニーカー',slot:'shoes',kind:'sneakers'},
    {id:'studio-wand',name:'星の杖',slot:'hand',kind:'wand'},
    {id:'studio-tea',name:'お茶の湯のみ',slot:'hand',kind:'tea'}
  ].map(x=>({...x,rarity:'PREVIEW'}));
  const catalog=[...(typeof ITEMS!=='undefined'?ITEMS:[]),...additions.filter(x=>!(typeof ITEMS!=='undefined'&&ITEMS.some(i=>i.id===x.id)))];
  const slots={top:'トップス',bottom:'ボトムス',hat:'帽子',accessory:'アクセサリー',back:'背中',shoes:'靴',hand:'手持ち',auraEffect:'限定オーラ',eyeStyle:'目',hairStyle:'髪型'};
  const defaults={gender:'male',hair:0,eyes:0,mouth:0,skin:0,hairColor:0,faceShape:0,expression:0,top:'starter',bottom:'basic-bottom',hat:null,accessory:null,back:null,shoes:'studio-sneakers',hand:null,auraEffect:null,eyeStyle:null,hairStyle:null};
  const baseSet={top:'starter',bottom:'basic-bottom',hat:null,accessory:null,back:null,shoes:'studio-sneakers',hand:null,auraEffect:null};
  const sets={basic:{...baseSet},chef:{...baseSet,top:'studio-chef',hat:'studio-headband'},casual:{...baseSet,top:'studio-hoodie',back:'studio-backpack'},wizard:{...baseSet,top:'studio-wizard',hat:'studio-wizard-hat',back:'studio-cape',shoes:'studio-boots',hand:'studio-wand'}};
  const int=(v,n)=>Number.isInteger(v)&&v>=0&&v<n?v:0;
  const item=(id,slot)=>catalog.find(x=>x.id===id&&(!slot||x.slot===slot));
  function normalize(value={}){
    const a={...defaults,...(value&&typeof value==='object'?value:{})};
    if(value?.outfit&&!value.top)a.top=value.outfit;
    for(const k of Object.keys(slots))if(!item(a[k],k))a[k]=defaults[k];
    for(const [k,n] of Object.entries({hair:8,eyes:7,mouth:3,skin:3,hairColor:3,faceShape:4,expression:6,pet:5,aura:5}))a[k]=int(a[k],n);
    a.gender=a.gender==='female'?'female':'male';a.renderStyle=a.renderStyle==='pixel'?'pixel':'normal';return a;
  }
  // Keep the original silhouettes and item IDs; illustration is a material layer.
  // This context exists only during the synchronous render, never in saved avatars.
  let paint=null;
  const fingerprint=text=>{let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0).toString(36);};
  const tint=(hex,target,amount)=>'#'+[0,2,4].map(i=>Math.round(parseInt(hex.slice(i+1,i+3),16)*(1-amount)+target*amount).toString(16).padStart(2,'0')).join('');
  function material(fill){
    if(!paint||!/^#[\da-f]{6}$/i.test(fill)||['#3e332e','#fffdf5','#ffffff'].includes(fill.toLowerCase()))return null;
    const type=SKINS.includes(fill)?'skin':HAIRS.includes(fill)?'hair':/^#(e8b557|f[ef][dbe][\da-f]{3}|[bcd][\da-f][bcd][\da-f][bcd][\da-f])$/i.test(fill)?'metal':/^#(735|8[\da-f]|9[\da-f]|a[\da-f]|b47)/i.test(fill)?'leather':'cloth';
    const key=type+fill,existing=paint.materials.get(key);if(existing)return existing;
    const id=paint.prefix+type+fill.slice(1);
    const hi=tint(fill,255,type==='metal'?.62:type==='skin'?.23:.34),shade=tint(fill,0,type==='hair'?.42:type==='skin'?.19:.32);
    paint.defs.push(type==='skin'?`<radialGradient id="${id}" cx=".32" cy=".3" r=".85"><stop stop-color="${hi}"/><stop offset=".58" stop-color="${fill}"/><stop offset="1" stop-color="${shade}"/></radialGradient>`:`<linearGradient id="${id}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${hi}"/><stop offset=".38" stop-color="${fill}"/><stop offset=".8" stop-color="${shade}"/><stop offset="1" stop-color="${tint(fill,0,.4)}"/></linearGradient>`);
    const m={id,type};paint.materials.set(key,m);return m;
  }
  const path=(d,fill,extra='')=>{
    const m=material(fill),base=`<path d="${d}" fill="${m?`url(#${m.id})`:fill}" ${m?`data-avatar-base="true" data-material="${m.type}"`:''} ${extra}/>`;
    if(!m||m.type==='skin'||extra.includes('stroke="none"'))return base;
    let clip=paint.clips.get(d);if(!clip){clip=paint.prefix+'c'+fingerprint(d);paint.clips.set(d,clip);paint.defs.push(`<clipPath id="${clip}"><path d="${d}"/></clipPath>`);}
    let detail='';
    if(m.type==='hair'){
      for(let x=38;x<130;x+=19)detail+=`<path d="M${x} 25Q${x-18} 48 ${x-8} 76Q${x-8} 49 ${x+9} 36Z" fill="#e6ad72" fill-opacity=".19"/><path d="M${x} 31Q${x-10} 59 ${x+1} 99T${x+5} 147" fill="none" stroke="#fff4d7" stroke-opacity=".12" stroke-width=".8"/><path d="M${x+5} 39Q${x-2} 79 ${x+8} 137" fill="none" stroke="#251a1c" stroke-opacity=".16" stroke-width="1"/>`;
      detail+=`<path d="M38 42Q67 18 108 35" fill="none" stroke="#f2c493" stroke-opacity=".2" stroke-width="4"/>`;
    }
    else if(m.type==='cloth')detail=`<path d="M52 105Q57 119 51 133L60 122Z M102 111L107 146L101 156L99 134Z M60 150Q81 157 103 150L98 154Q79 159 58 154Z" fill="#fff9e9" fill-opacity=".22"/><path d="M35 113Q80 103 125 113M39 137Q80 145 124 137M44 161Q80 169 119 161" fill="none" stroke="#fff9e9" stroke-width="1.1" stroke-opacity=".32"/><path d="M35 116Q80 106 125 116M44 165Q80 171 119 165" fill="none" stroke="#342c35" stroke-width=".65" stroke-opacity=".18" stroke-dasharray="1 2"/>`;
    else if(m.type==='leather')detail=`<path d="M-20 7Q0 3 24 7M-15 15Q0 12 24 15M35 115Q80 104 125 115" fill="none" stroke="#fff1c8" stroke-width=".9" stroke-opacity=".38" stroke-dasharray="1 2"/>`;
    else detail=`<path d="M-20 3L30 16M25 75L130 145M37 77L139 143" fill="none" stroke="#fffdf2" stroke-width="2" stroke-opacity=".28"/>`;
    return base+`<g clip-path="url(#${clip})" stroke="none" pointer-events="none" data-material-detail="${m.type}">${detail}</g>`;
  };
  const group=(s,t='',attr='')=>`<g${t?` transform="${t}"`:''} ${attr}>${s}</g>`;
  const star=(x,y,r=8,fill='#e8b557')=>{let d='';for(let i=0;i<10;i++){let t=(i*36-90)*Math.PI/180,rr=i%2?r*.46:r;d+=(i?'L':'M')+(x+Math.cos(t)*rr).toFixed(2)+' '+(y+Math.sin(t)*rr).toFixed(2);}return path(d+'Z',fill);};
  const circle=(x,y,r,fill,extra='')=>{const m=material(fill);return `<circle cx="${x}" cy="${y}" r="${r}" fill="${m?`url(#${m.id})`:fill}" ${extra}/>`;};
  function collectibleEye(a,x,sign,side,blink,happy){
    const kind=item(a.eyeStyle)?.kind;
    let art='';
    if(blink)art=path('M-5 0H5','none','stroke-width="2"');
    else if(happy||a.expression===1)art=path('M-5 1Q0 -7 5 1','none','stroke-width="2.2"');
    else if(a.expression===4)art=path('M-5 -1Q0 4 5 -1','none','stroke-width="2"');
    else if(kind==='sharp')art=path('M-7 -4L7 -1Q3 6 -4 3Z','#fff9ec','stroke-width="1.7"')+path('M-1 -2L3 -1L2 3H0Z','#538879','stroke="none"')+path('M-7 -4L7 -1','none','stroke-width="2.2"');
    else{
      const red=kind==='redEyes',starry=kind==='starEyes',ry=a.expression===3?8:kind==='anime'?7.5:6.5;
      art=`<ellipse cx="0" cy="0" rx="6" ry="${ry}" fill="#fffdf5" stroke-width="1.3"/><ellipse cx="0" cy="1" rx="4.1" ry="${ry-1}" fill="${red?'#bb3b48':starry?'#655690':'#487d9e'}" stroke="none"/>`;
      art+=starry?star(0,1,4.2,'#ffe294').replace('/>',' stroke="none"/>'):circle(0,1,2.1,red?'#522931':'#243e53','stroke="none"');
      art+=circle(-1.8,-2.7,1.8,'#fffdf5','stroke="none"')+circle(2,3.8,.85,'#fffdf5','stroke="none"')+path(`M-6 -3Q-2 -${ry+2} 5 -4L7 -5`,'none','stroke-width="1.8"');
    }
    return group(art,`translate(${x} 70) scale(${side ? .82 : sign} 1)`,`data-eye-style="${a.eyeStyle}"`);
  }
  // Canonical right-profile art is mirrored only for left; never reuse frontal bangs in profile/back.
  const HAIR_FRONT_MALE=[
    'M45 63L40 54L48 49L43 41L60 39L66 28L81 31L77 21Q94 20 103 34L110 29L111 43L119 47L111 54L114 67L104 76L101 55L91 64L90 51L75 65L73 53L58 67L57 59L50 75Z',
    'M46 68Q35 27 77 28Q117 24 115 65L106 74L102 53Q88 63 61 58L52 74Z',
    'M43 65Q39 24 80 26Q122 25 117 66L106 70L104 57L98 67L95 54L86 65L82 53L73 65L68 54L58 68L54 59L49 74Z',
    'M45 67Q35 30 74 27L80 35L87 27Q123 30 115 69L106 72Q100 44 80 40Q57 46 53 74Z',
    'M45 67Q36 30 68 31L78 22L89 30Q120 30 114 65L105 71L103 50Q76 38 55 56L52 72Z',
    'M47 56Q41 30 80 29Q115 30 114 57L105 58Q78 49 54 62Z',
    'M44 65L42 43L59 38L63 28L79 31L86 22L99 35L112 34L119 55L110 75L103 56L93 68L88 52L74 70L70 55L56 69L51 77Z',
    'M44 66Q32 57 44 47Q37 32 54 33Q56 19 71 29Q83 15 91 29Q110 21 112 39Q126 43 117 58L111 70L101 59Q91 69 84 56Q72 68 66 57L54 71Z'
  ];
  const HAIR_SIDE_MALE=[
    'M48 81L41 67L43 51L38 43L54 40L56 29L70 31L78 21L91 29L99 26L109 39L114 51L104 59L101 49L92 57L88 48L78 60L73 56L70 72L62 78L60 88Z',
    'M46 76Q35 47 49 35Q64 22 84 28Q108 27 113 51L103 59L99 49Q85 61 74 60L68 77L60 86L53 87Z',
    'M44 74Q36 40 57 29Q86 17 106 35Q114 43 113 57L103 60L100 54L93 60L89 55L79 62L73 59L69 79L59 88L49 84Z',
    'M46 77Q36 38 64 28Q75 24 82 31Q99 24 110 41L114 54L104 59L100 48Q89 40 80 40Q69 49 70 65L65 78L57 87L49 83Z',
    'M46 78Q37 40 60 32L74 22L88 25L84 17Q111 20 113 43L106 54L101 47Q89 42 76 47L68 62L66 76L58 86L50 83Z',
    'M46 74Q39 46 53 35Q77 20 100 34Q111 41 110 53L100 55Q82 49 70 58L68 75L59 82L50 81Z',
    'M44 79L38 67L43 49L41 37L55 37L62 26L76 30L86 21L97 34L110 35L114 53L103 59L99 49L89 61L82 53L71 64L69 79L62 87L67 105L54 99L48 104L46 91L36 96Z',
    'M46 80Q35 74 41 63Q30 53 41 45Q34 31 49 32Q52 20 65 28Q78 16 86 28Q103 22 109 38Q122 44 111 57Q105 61 99 54Q90 64 82 56Q75 65 70 62L68 77Q63 89 51 86Z'
  ];
  const HAIR_BACK_MALE=[
    'M44 72L39 55L46 47L42 38L59 36L65 25L79 29L88 20L102 33L113 31L117 46L122 55L114 68L110 83L98 92L87 89L77 93L65 89L52 88Z',
    'M44 69Q35 28 78 27Q120 24 117 67L111 83Q101 96 80 94Q58 95 48 84Z',
    'M43 68Q38 23 81 25Q123 25 117 70L110 86L101 90L95 86L85 93L77 88L66 93L58 87L50 88Z',
    'M44 70Q37 31 71 27L80 31L89 26Q123 30 117 69L109 87Q82 99 51 87Z',
    'M45 71Q38 34 65 29L79 20L91 28Q120 29 116 68L108 86Q81 99 53 88Z',
    'M46 69Q40 29 80 29Q117 29 114 69L107 82Q81 91 54 82Z',
    'M44 71L40 50L45 36L60 35L67 25L81 29L89 21L101 34L114 34L120 54L113 77L116 97L104 94L99 108L87 99L78 106L66 99L54 105L52 92L41 98Z',
    'M43 69Q31 59 42 47Q36 31 53 32Q57 18 71 28Q83 16 93 29Q111 22 113 39Q126 44 117 60Q123 77 111 84Q103 96 92 90Q80 99 68 91Q52 98 47 84Z'
  ];
  const HAIR_FRONT_FEMALE=[
    'M45 68Q35 27 78 27Q121 25 115 70L111 92L103 88L102 53Q86 63 61 56L56 89L47 94Z',
    'M45 68Q37 25 80 26Q122 26 115 68L108 81L103 57L97 61L91 56L84 61L78 56L69 61L63 56L57 60L53 80Z',
    'M44 69Q35 29 73 27Q111 21 116 60L112 88L103 83L101 51Q89 63 78 58L83 45Q68 59 56 64L54 86L47 92Z',
    'M44 69Q36 25 79 26Q123 25 116 69L109 88L103 53Q88 64 62 56L54 90L46 94Z',
    'M46 69Q36 26 80 25Q120 25 114 68L106 76L103 53Q86 60 67 50L57 62L53 77Z',
    'M45 67Q38 24 80 25Q122 25 115 66L107 77L103 57L96 62L90 56L82 62L75 56L67 61L59 56L53 77Z',
    'M45 68Q36 27 74 26L80 32L87 26Q123 29 116 68L107 84L102 59Q88 55 80 42Q71 56 58 61L54 85L47 88Z',
    'M46 65Q39 26 80 26Q118 25 114 65L106 78L103 52Q78 62 56 54L53 78Z'
  ];
  const HAIR_SIDE_FEMALE=[
    'M45 80Q34 44 52 31Q79 17 102 32Q114 41 113 54L103 59L100 51Q84 59 75 58L71 77L68 95Q54 103 43 95Z',
    'M45 78Q35 38 58 29Q83 19 103 34Q114 45 112 57L103 59L100 54L92 59L87 55L77 61L71 74L68 97L53 102L45 94Z',
    'M44 78Q34 40 55 31Q85 16 105 35Q115 44 113 55L103 61L100 52Q88 65 77 62L83 48L71 58L68 82L65 100L46 104Z',
    'M44 80Q35 34 66 27Q95 22 109 41L113 54L103 60L99 52Q87 58 77 58L71 77L69 106L49 110L44 98Z',
    'M47 80Q36 44 53 31Q80 19 102 32Q114 43 112 55L103 59L100 51Q85 56 74 51L68 63L67 76L58 87L50 87Z',
    'M46 79Q37 34 62 28Q88 19 105 36Q114 45 112 57L103 60L99 54L92 60L86 56L77 61L71 69L67 81L57 90L49 86Z',
    'M45 80Q36 39 57 29Q76 23 83 30Q102 27 111 43L114 55L104 61L101 51Q88 42 80 42L71 61L68 84L65 104L47 110Z',
    'M47 80Q37 41 55 31Q80 20 102 34Q113 44 111 55L102 59L98 52Q83 58 73 56L68 70L65 81L57 88L49 84Z'
  ];
  const HAIR_BACK_FEMALE=[
    'M44 65Q37 24 80 25Q122 24 116 65L117 100Q100 111 80 104Q60 111 43 100Z',
    'M44 62Q37 24 80 25Q123 24 116 62L119 131Q80 139 41 131Z',
    'M44 63Q37 24 80 25Q121 23 116 63L117 112L123 124Q102 132 81 124Q59 132 38 123L43 110Z',
    'M44 63Q37 24 80 25Q123 23 116 63L121 148Q101 157 80 149Q58 157 39 148Z',
    'M44 67Q38 23 80 25Q120 24 116 67L108 84Q80 100 52 84Z',
    'M44 67Q38 24 80 25Q121 24 116 67L109 85Q81 100 51 85Z',
    'M44 63Q36 24 80 25Q123 24 116 63L120 129Q101 140 80 131Q59 140 40 129Z',
    'M45 68Q39 24 80 25Q119 24 115 68L107 85Q81 98 53 85Z'
  ];
  const SPIKY={
    front:'M43 71L33 57L44 51L32 38L53 40L46 20L68 28L79 7L89 27L109 16L106 37L127 35L116 52L124 61L112 74L104 52L96 62L87 44L77 60L68 49L58 65L54 54L48 78Z',
    side:'M46 81L35 69L42 56L29 43L51 42L43 21L66 29L76 9L88 29L106 18L104 38L123 37L111 52L104 58L100 48L89 60L81 49L71 62L68 78L58 89Z',
    back:'M43 73L33 58L44 53L32 38L53 40L46 20L68 28L79 7L89 27L109 16L106 37L127 35L116 53L128 60L113 82L103 88L92 89L81 96L69 89L54 90Z'
  };
  function hairLayers(a,h,direction,time,reduced){
    const side=direction==='left'||direction==='right',back=direction==='back',view=back?'back':side?'side':'front';
    const style=item(a.hairStyle)?.kind,key=style||`${a.gender}-${a.hair}`;
    const sway=reduced?0:Math.sin(time*5)*2;
    let rear='',front='',overlay='';
    const lock=(d,angle=0,x=80,y=45)=>group(path(d,h),`rotate(${angle.toFixed(2)} ${x} ${y})`,'data-hair-lock="true"');
    if(style==='spiky')front=path(SPIKY[view],h);
    else if(style==='princess'){
      const curls='M46 64Q34 68 41 79Q29 88 41 98Q29 110 44 121Q55 122 54 110Q44 115 43 106Q58 102 51 91Q58 80 49 75ZM114 64Q126 68 119 79Q131 88 119 98Q131 110 116 121Q105 122 106 110Q116 115 117 106Q102 102 109 91Q102 80 111 75Z';
      if(side){
        rear=lock('M49 57Q27 67 40 80Q24 90 38 101Q25 115 43 126Q57 124 52 111Q44 119 41 110Q53 102 45 91Q53 81 46 74Z',sway,49,57);
        front=path('M46 79Q33 40 56 29Q82 18 103 34Q114 44 111 56L103 61L100 53Q88 60 77 48L71 61L68 78L60 87L50 87Z',h);
        overlay=path('M64 74Q53 80 60 91Q49 100 60 110Q69 115 73 104Q62 108 63 99Q73 93 67 84Z',h,'stroke-width="2"')+path('M60 91Q66 95 68 89','none','stroke-width="1.5"');
      }else if(back){
        front=path('M44 63Q34 22 80 23Q126 22 116 64L119 113Q101 123 80 116Q60 123 41 113Z',h)+path(curls,h,'stroke-width="2"')+path('M66 38Q58 76 66 103M94 38Q102 76 94 103','none','stroke-width="1.5"');
      }else{
        rear=path('M44 61Q35 22 80 23Q126 22 116 66L121 113Q104 124 80 116Q57 124 39 113Z',h);
        front=path('M45 68Q35 23 80 24Q123 23 116 69L106 72L104 49Q91 59 80 43Q68 59 55 49L53 75Z',h)+path(curls,h,'stroke-width="2"')+path('M40 79Q48 85 51 80M41 98Q50 102 52 96M120 79Q112 85 109 80M119 98Q110 102 108 96','none','stroke-width="1.5"');
      }
    }else if(a.gender==='male'){
      front=path((back?HAIR_BACK_MALE:side?HAIR_SIDE_MALE:HAIR_FRONT_MALE)[a.hair],h);
      if(a.hair===6&&!back&&!side)rear=path('M47 55H113L121 100L107 96L101 108L91 99H65L53 105L52 94L40 98Z',h);
      if(back&&[1,3,4,5].includes(a.hair))front+=path('M62 80Q80 89 99 80','none','stroke-width="1.3" stroke-opacity=".45"');
    }else{
      front=path((back?HAIR_BACK_FEMALE:side?HAIR_SIDE_FEMALE:HAIR_FRONT_FEMALE)[a.hair],h);
      if([0,1,2,3,6].includes(a.hair)&&!back){
        const length=[102,131,124,148,0,0,131][a.hair];
        rear=side?path(`M50 49Q33 58 42 86L37 ${length}Q52 ${length+8} 70 ${length-2}L71 74Z`,h):path(`M47 55Q43 26 80 25Q118 25 113 57L119 ${length}Q100 ${length+8} 80 ${length-2}Q60 ${length+8} 41 ${length}Z`,h);
      }
      if(a.hair===4){
        if(side)rear+=circle(48,49,6,h)+lock('M48 51Q20 55 25 82Q28 105 44 113Q39 87 51 65Z',sway,48,51);
        else if(back)overlay+=circle(80,48,6,h)+lock('M79 52Q96 66 91 93Q89 111 76 119Q83 91 69 77Q64 62 79 52Z',sway,80,52);
        else rear+=circle(109,48,5,h)+lock('M112 50Q137 52 134 80Q132 104 119 113Q125 88 109 65Z',-sway,112,50);
      }
      if(a.hair===5){
        if(side)rear+=circle(48,59,5,h)+lock('M47 62Q23 65 29 92Q32 112 47 118Q40 91 51 75Z',sway,47,62);
        else{
          const tails=circle(47,57,5,h)+lock('M46 60Q23 62 29 91Q30 108 42 117Q39 91 51 75Z',sway,46,60)+circle(113,57,5,h)+lock('M114 60Q137 62 131 91Q130 108 118 117Q121 91 109 75Z',-sway,114,60);
          if(back)overlay+=tails;else rear+=tails;
        }
      }
      if(a.hair===6){
        if(back)overlay+=path('M53 48Q80 70 107 48M57 63Q80 81 103 63','none','stroke-width="1.7"')+circle(80,69,4,h)+lock('M79 73Q97 86 87 112Q76 106 73 92Z',sway,80,73);
        else if(side)rear+=circle(49,62,4,h)+lock('M48 64Q32 80 45 110Q53 100 54 82Z',sway,48,64);
      }
      if(a.hair===7){
        const bun=side?circle(49,30,16,h)+path('M39 28Q47 17 58 28M39 34Q51 41 60 31','none','stroke-width="1.4"'):circle(80,24,16,h)+path('M68 23Q80 13 91 25M69 30Q82 36 91 26','none','stroke-width="1.4"');
        if(back)overlay+=bun;else rear+=bun;
      }
      if(back&&[0,1,2,3].includes(a.hair))front+=path(`M65 43Q59 77 63 ${[98,124,117,140][a.hair]}M94 43Q102 77 98 ${[98,124,117,140][a.hair]}`,'none','stroke-width="1.3" stroke-opacity=".5"');
    }
    const marker=`data-hair-key="${key}" data-hair-view="${view}" data-hair-direction="${direction}"`;
    return {rear:group(rear,'',marker+' data-part="hair-rear"'),front:group(front+overlay,'',marker+` data-part="hair-front"${a.hairStyle?` data-hair-style="${a.hairStyle}"`:''}`)};
  }

  function hat(kind,back,side){
    if(kind==='redHood')return path(back?'M37 70Q31 24 73 18L88 18Q127 29 123 72L127 102L108 110L80 102L52 110L34 100Z':side?'M39 95L36 54Q37 25 72 19Q102 20 115 46L119 60L106 57Q101 36 80 38Q58 41 58 67L65 92L82 101L64 108L39 104Z':'M34 96L38 49Q42 19 80 18Q118 19 122 49L126 96L108 107L100 96L108 72Q113 39 80 36Q47 39 52 72L60 96L52 107Z','#b63448')+path(back?'M79 27L79 91M45 95L63 99M99 99L116 94':side?'M43 87L44 54Q45 31 73 26':'M44 78L44 51Q49 25 80 25Q111 25 116 51L116 78','none','stroke="#e06462" stroke-width="3"');
    if(kind==='bunnyEars')return path('M48 43Q30 -1 48 3Q61 6 64 39M95 39Q100 -2 116 9Q124 26 110 48','#fff2f6')+path('M47 12Q43 26 55 39M111 16Q114 28 105 39','none','stroke="#efa5c2" stroke-width="7"')+path('M45 44Q80 32 114 45','none','stroke="#f4bace" stroke-width="8"');
    if(kind==='catEars')return path('M44 47L43 10L69 34M93 34L118 10L116 48','#c7b6ed')+path('M49 34L49 21L60 33M101 33L112 21L111 36','#efacd0');
    if(kind==='pandaEars')return circle(49,29,15,'#404653')+circle(111,29,15,'#404653')+circle(49,29,7,'#7c8391')+circle(111,29,7,'#7c8391')+path('M45 44Q80 31 115 44','none','stroke="#fff9ec" stroke-width="9"');
    if(kind==='visor')return path('M44 40Q80 29 114 41V51Q80 40 45 51Z','#fff9ec')+path(back?'M45 47H114':'M90 46Q127 41 135 52L95 59Z',back?'none':'#e6a1bb');
    if(kind==='headband')return path('M45 42Q80 31 114 44L112 55Q79 44 46 54Z','#ee9857')+path('M111 47L132 49L125 57L135 67L124 70L109 54Z','#ee9857');
    if(kind==='wizard')return path('M43 44L70 5L109 15L111 36L101 27L96 42Z','#425875')+path('M42 35L103 33L110 45L40 48Z','#e8b557')+path('M24 50Q45 32 101 41Q127 43 136 53Q113 64 90 54Q53 49 24 50Z','#425875')+star(110,32,7);
    if(kind==='chef')return path('M46 44Q30 28 48 23Q50 7 67 17Q78 0 91 17Q112 7 116 24Q131 36 113 45L111 56H48Z','#fff9ec')+path('M48 43H112V56H48Z','#fff9ec');
    if(kind==='cap')return path('M43 49Q44 16 81 19Q114 22 114 50Z','#39877e')+path(back?'M43 50H114V57H43Z':'M91 48Q132 46 135 56H89Z','#39877e');
    if(kind==='beanie')return path('M45 48Q42 16 79 17Q115 16 115 48Z','#bd865f')+path('M44 45H115V58H44Z','#d4a37b');
    if(kind==='explorer')return path('M47 44L54 19H103L112 44Z','#b99c70')+path('M47 37H109V46H47Z','#706044')+`<ellipse cx="80" cy="48" rx="51" ry="8" fill="#b99c70"/>`;
    if(kind==='royal')return path('M48 47L42 18L64 32L80 12L98 32L118 18L111 47Z','#e8b557')+circle(80,31,4,'#be6555');
    if(kind==='balaclava')return path('M43 64Q40 21 80 20Q120 21 117 65L109 92Q80 105 51 91Z','#17181b')+(back?'':path('M55 58Q80 43 106 58L103 78Q80 88 57 78Z','#f3d5b1'));
    if(kind==='cheerBow')return path('M78 36Q56 17 47 29Q43 42 72 46L80 41Q88 46 116 37Q117 22 105 22Q91 24 82 35Z','#1767c7')+path('M53 29L72 42M106 27L87 40','none','stroke="#fff" stroke-width="4"')+circle(80,39,6,'#1767c7');
    return '';
  }
  // Every tongue bends independently; all geometry stays behind the character.
  // Use the shared clock so pause, hidden tabs and reduced-motion also stop the fire.
  function blazingAura(time,reduced){
    const t=reduced?0:time;
    const f=n=>n.toFixed(2);
    function tongue(x,width,height,phase,color,opacity){
      const sway=Math.sin(t*4.5+phase)*5+Math.sin(t*7.2+phase)*2;
      const tipY=Math.max(8,184-height+Math.sin(t*5.1+phase)*7);
      const tipX=x+sway,shoulder=tipY+(184-tipY)*.42;
      return `<path data-flame-tongue="true" d="M${f(x-width)} 184 C${f(x-width-7)} 157 ${f(x-width+sway)} ${f(shoulder+20)} ${f(tipX-3)} ${f(shoulder)} Q${f(tipX+8)} ${f(tipY+17)} ${f(tipX)} ${f(tipY)} C${f(tipX+width+8)} ${f(tipY+28)} ${f(x+width-sway)} ${f(shoulder+14)} ${f(x+width)} 158 Q${f(x+width+8)} 178 ${f(x+width)} 184Z" fill="${color}" opacity="${opacity}"/>`;
    }
    const tongues=[[32,10,68],[43,14,111],[59,17,140],[79,19,167],[97,16,144],[116,14,119],[129,10,77]];
    let flame='<ellipse cx="80" cy="181" rx="60" ry="12" fill="#ff6a24" opacity=".22"/>';
    for(let i=0;i<tongues.length;i++){const [x,w,h]=tongues[i];flame+=tongue(x,w,h,i*1.7,'#ed4225',.8);}
    for(let i=0;i<tongues.length;i++){const [x,w,h]=tongues[i];flame+=tongue(x,w*.7,h*.79,i*1.7+.9,'#ffbd2e',.95);}
    flame+='<path d="M47 183Q38 165 49 142L58 156Q54 131 68 111L79 132L89 97L99 135L109 123Q116 150 113 165L122 157Q127 179 113 184Z" fill="#fff2a4"/>';
    for(let i=0;i<10;i++){
      const progress=((t*(.32+(i%3)*.06)+i*.137)%1+1)%1;
      const x=(i%2?135:24)+Math.sin(progress*5+i)*6;
      const y=179-progress*(128+(i%3)*9);
      const opacity=reduced?.6:Math.sin(progress*Math.PI)*.85;
      flame+=`<path data-flame-spark="true" d="M0 -6Q4 -1 0 4Q-3 0 0 -6Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(Math.sin(t*3+i)*18)}) scale(${f(.65+(i%3)*.17)})" fill="${i%3?'#ffce46':'#ff7540'}" opacity="${f(opacity)}"/>`;
    }
    flame+='<ellipse cx="80" cy="187" rx="52" ry="7" fill="#ffc53e" opacity=".3"/>';
    return `<g data-item-art="reward-sushitan-aura" aria-label="烈火のオーラ">${flame}</g>`;
  }

  // The same shoe artwork follows the feet in standing, walking and seated poses.
  function shoeArt(shoe){
    const kind=shoe?.kind||'sneakers',c=shoe?.color||'#fff9ec',ac=shoe?.accent||'#fff9ec';
    let art='';
    if(kind==='boots'||kind==='apocalypseBoots'){
      const dark=kind==='apocalypseBoots';
      art=path('M-8 19H9V29Q20 28 20 38H-10Z',dark?'#26282d':'#916448')+path('M-10 37H20','none','stroke="#403a37" stroke-width="4"')+path('M-6 24H6M-5 29H7','none',`stroke="${dark?'#b8b3a8':'#d9b58a'}" stroke-width="2"`);
      if(dark)art+=path('M-8 20H10V24H-8Z','#6d7078')+circle(10,23,2,'#ddd8c8');
    }else if(kind==='bunnySlippers'||kind==='pawSlippers'){
      art=path('M-10 28Q4 23 15 30Q25 32 21 40Q6 46 -12 40Z',c);
      if(kind==='bunnySlippers')art+=path('M8 31Q3 17 8 17Q13 17 13 29M15 31Q13 18 18 19Q23 21 20 32',ac)+circle(9,35,1.3,INK)+circle(17,35,1.3,INK)+circle(13,38,1.4,'#e287a9');
      else art+=circle(10,36,3.7,ac)+circle(4,32,1.8,ac)+circle(10,30,1.8,ac)+circle(16,32,1.8,ac);
    }else{
      art=path(kind==='highTops'?'M-9 20H9V29L18 33Q22 40 13 41H-11Z':'M-9 28H9L18 33Q22 40 13 41H-11Z',kind==='cheerShoes'?'#fff':c)+path('M-10 38H19','none',`stroke="${kind==='cleats'?'#a9df75':'#dfded7'}" stroke-width="3"`);
      if(kind==='cheerShoes')art+=path('M-7 31L2 34L9 30','none','stroke="#1767c7" stroke-width="3"');
      if(kind==='highTops')art+=path('M-6 23H6M-4 27H7M-2 31H9','none',`stroke="${ac}" stroke-width="2"`)+circle(-5,33,3,ac);
      if(kind==='cleats')art+=path('M-7 41V44M1 41V44M11 41V44','none','stroke="#303d53" stroke-width="3"')+path('M-4 30L0 35M2 30L6 35','none',`stroke="${ac}" stroke-width="2"`);
      if(kind==='running')art+=path('M-7 32L1 35L10 30','none',`stroke="${ac}" stroke-width="3"`)+path('M-8 39H18','none','stroke="#409a83" stroke-width="2"');
      if(kind==='sneakers')art+=path('M-6 31H7','none','stroke="#a9b7bb" stroke-width="2"');
    }
    return group(art,'',`data-part="shoe" data-shoe-kind="${kind}"`);
  }

    // Pixel components use integer coordinates on a 48 x 64 grid.
  function pixelParts(a,side,back,t){
    const ink='#352838',white='#fff2d5',gold='#e6b95c',h=['#79503c','#ba7a45','#354652'][a.hairColor],skin=['#efc392','#c9936c','#9d6554'][a.skin];
    const r=(x,y,w,z,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${z}" fill="${c}"/>`,p=(d,c)=>`<path d="${d}" fill="${c}"/>`;
    const star=(x,y,c=gold)=>p(`M${x} ${y-3}h1v2h2v2h-2v2h-1v-2h-2v-2h2Z`,c);
    const it=s=>item(a[s],s)||{},top=it('top'),bottom=it('bottom'),shoes=it('shoes'),hat=it('hat'),hand=it('hand'),acc=it('accessory'),bk=it('back'),eye=it('eyeStyle'),hair=it('hairStyle');
    const c=top.color||white,ac=top.accent||'#39877e',bc=bottom.color||'#334155';
    let rear='',cloth='',front='',hairRear='',hairFront='',hatArt='',handArt='',effects='',pet='';
    if(bk.kind==='cape'||top.kind==='royal')rear+=p('M17 30H31V34H34V40H37V48H31V50H25V48H20V50H11V47H12V40H15V34H17Z',ink)+p('M18 31H30V35H33V41H35V47H30V49H25V47H20V49H13V46H14V40H16V35H18Z',top.kind==='royal'?'#b4524b':'#425875');
    if(acc.kind==='wings')rear+=p('M17 34L10 29H7V34H8V36H5V39H8V42H15V44H18ZM31 34L38 29H41V34H40V36H43V39H40V42H33V44H30Z',white);
    if(bk.kind==='backpack')rear+=r(side?10:15,32,side?10:19,15,ink)+r(side?11:16,33,side?8:17,13,'#39877e');
    const details={
      tee:()=>r(21,37,7,4,white)+r(20,36,9,2,a.top==='salmon'?white:'#ed955e'),
      stripe:()=>r(16,36,17,2,ac)+r(16,41,17,2,ac)+r(16,46,17,2,ac),
      sweater:()=>r(19,33,10,2,ac)+r(16,46,17,2,ac),
      hoodie:()=>p('M17 32H21V34H27V32H32V35H28V37H21V35H17Z',ac)+r(20,41,9,4,ac)+r(21,36,1,4,ink)+r(27,36,1,4,ink),
      polo:()=>p('M18 32H22V34H26V32H30V35H26V37H22V35H18Z',ac),
      sailor:()=>p('M17 32H21V34H23V36H25V34H27V32H31V34H29V36H27V38H22V36H19V34H17Z',ac)+r(23,38,3,5,'#d97d60'),
      explorer:()=>r(17,37,5,6,ac)+r(27,37,5,6,ac)+r(24,33,1,15,ink),
      chef:()=>r(17,40,15,9,ac)+p('M18 33H21V35H24V37H27V39H25V37H22V35H18Z',ink),
      varsity:()=>r(24,33,1,15,ink)+r(28,37,3,1,ac)+r(28,38,1,3,ac)+r(28,41,3,1,ac)+r(16,47,17,1,ac),
      cosmic:()=>r(24,33,1,14,ac)+r(16,46,17,2,ac)+star(29,39,ac),
      royal:()=>r(17,33,15,2,white)+star(24,36)+r(16,44,17,2,gold),
      basketball:()=>r(17,33,15,1,ac)+r(23,37,5,1,ac)+r(26,38,1,5,ac)+r(16,46,17,2,ac),
      soccer:()=>r(18,34,2,13,ac)+r(29,34,2,13,ac)+r(23,38,1,5,ac)+r(26,38,3,1,ac)+r(26,42,3,1,ac)+r(26,39,1,3,ac)+r(28,39,1,3,ac),
      tennis:()=>r(18,33,5,2,ac)+r(27,33,4,2,ac)+r(16,46,17,2,ac)+r(29,38,2,2,ac),
      apocalypse:()=>p('M16 32H19V35H16ZM29 32H33V35H29Z',ac)+r(18,39,13,1,ac)+r(18,46,13,1,ac),
      cheer:()=>p('M17 33H20V35H23V36H26V35H29V33H32V35H30V37H27V39H22V37H19V35H17Z',white)+r(17,45,15,2,white),
      schoolBlazerM:()=>p('M19 32H29L26 40H23Z',white)+r(24,34,2,6,ac)+r(25,42,1,1,gold)+r(25,45,1,1,gold),
      schoolBlazerF:()=>p('M19 32H29L26 40H23Z',white)+r(21,35,7,2,ac)+r(25,42,1,1,gold)+r(25,45,1,1,gold)
    };
    if(['bunny','cat','panda'].includes(top.kind))cloth+=r(20,37,9,8,ac)+r(22,39,1,2,ink)+r(26,39,1,2,ink)+r(24,43,1,1,ink)+(top.kind==='bunny'?r(21,33,2,5,ac)+r(26,33,2,5,ac):top.kind==='cat'?p('M20 38V34L24 38ZM25 38L29 34V38Z',ac):r(19,36,3,3,ink)+r(27,36,3,3,ink));
    if(details[top.kind])cloth+=details[top.kind]();
    if(back)cloth=top.kind==='cosmic'?star(24,40,ac):top.kind==='stripe'?details.stripe():r(18,46,13,1,ac);
    if(side)cloth=`<g transform="translate(12 0) scale(.6 1)">${cloth}</g>`;
    if(bk.kind==='backpack'&&back)front+=r(16,33,17,15,ink)+r(17,34,15,13,'#39877e')+r(19,41,11,5,'#246258');
    const skirt=['schoolSkirt','tennisSkirt','cheerSkirt'].includes(bottom.kind);
    if(skirt)front+=p('M16 45H32V47H34V52H14V47H16Z',ink)+r(16,46,16,5,bc)+r(18,47,1,4,bottom.accent||white)+r(23,47,1,4,bottom.accent||white)+r(29,47,1,4,bottom.accent||white)+(bottom.kind==='schoolSkirt'?r(16,48,16,1,'#77848b'):'');
    if(acc.kind==='scarf')front+=r(17,30,15,4,'#d97d60')+r(28,33,3,8,'#d97d60');
    if(acc.kind==='bag')front+=p('M17 32H19V34H21V36H23V38H25V40H27V42H25V40H23V38H21V36H19V34H17Z','#916448')+r(27,40,7,7,'#b18a61');
    if(acc.kind==='star'&&!back)front+=r(24,32,1,5,gold)+star(24,39);
    // Hair forms retain separate profile/rear arrangements.
    const fringe=[
      'M14 15V11H17V9H21V7H26V9H30V10H34V16H31V14H29V17H26V14H23V17H20V15H17V19H14Z',
      'M13 16V12H16V9H20V8H29V10H33V13H35V17H30V15H19V16H16V20H13Z',
      'M13 16V11H17V8H30V10H34V16H31V18H28V16H25V18H22V16H19V18H16V21H13Z',
      'M13 19V12H16V9H21V8H23V11H21V13H18V16H16V20ZM25 8H29V10H33V12H35V19H32V16H29V13H26Z',
      'M14 19V12H18V9H22V6H25V8H30V10H34V15H30V13H21V15H18V19Z',
      'M14 15V11H18V9H29V11H33V15H29V13H19V15Z',
      'M12 19V12H15V10H19V7H24V9H28V7H30V11H34V16H32V22H29V16H26V18H23V15H20V19H17V17H15V23H12Z',
      'M12 18V13H14V9H18V8H21V7H25V9H30V8H33V12H35V17H32V19H29V16H26V18H23V16H20V19H17V17H15V21H12Z'
    ];
    const long=a.gender==='female'&&[0,1,2,3,6].includes(a.hair),length=[32,42,39,46,0,0,42,0][a.hair];
    if(long)hairRear+=p(`M13 17H35V${length-3}H36V${length}H29V${length-2}H19V${length}H12V${length-3}Z`,h);
    if(a.gender==='female'&&[4,5,6].includes(a.hair)){const tail=(x,y)=>p(`M${x} ${y}h5v4h2v13h-2v4h-3v-5h-2Z`,h);hairRear+=side?tail(9,17):a.hair===5?tail(8,18)+tail(35,18):back?tail(22,18):tail(35,15);}
    if(a.gender==='female'&&a.hair===7)hairRear+=p(side?'M10 8H12V5H18V7H20V12H17V15H12V12H10Z':'M19 5H21V3H27V5H30V10H27V12H21V10H19Z',h);
    hairFront=back?p('M17 8H31V10H34V13H36V24H33V28H29V29H19V28H15V25H12V15H14V10H17Z',h):p(fringe[a.hair],h);
    if(side&&!back)hairFront=p(["M16 9H21V7H25V9H29V10H33V13H31V16H28V14H26V17H23V15H20V20H18V26H15V25H13V18H12V13H14V11H16Z","M16 10H19V8H28V9H31V11H33V14H30V16H26V15H22V17H20V23H18V27H15V25H13V17H14V12H16Z","M16 9H29V10H32V12H33V16H30V17H27V16H24V18H21V17H20V24H17V28H14V24H13V15H14V11H16Z","M16 10H21V8H24V11H22V13H20V17H19V24H17V27H14V24H13V15H14V12H16ZM25 9H28V10H31V12H33V15H30V14H28V12H25Z","M16 10H20V8H23V5H26V7H30V9H32V13H30V14H26V12H22V14H20V19H18V25H15V26H13V20H13V14H15Z","M16 11H19V9H28V10H31V12H32V15H29V14H23V16H20V20H18V24H15V24H14V16H15V12Z","M16 9H20V7H24V9H28V7H30V10H33V13H31V16H28V14H25V17H22V15H20V21H18V26H20V32H16V30H13V31H14V26H11V28H12V20H13V14H14V11Z","M14 11H16V8H20V9H22V6H26V9H30V8H32V12H34V15H31V17H28V15H25V18H22V16H20V21H18V26H15V25H13V22H12V17H13V14H12V12Z"][a.hair],h);if(back&&a.gender==='male')hairFront=p(["M16 10H20V7H24V9H28V6H31V10H35V14H37V18H34V24H32V28H28V27H25V30H22V28H17V29H14V25H12V18H13V12Z","M16 10H20V8H29V10H33V12H35V17H35V23H33V27H29V29H19V29H15V26H13V20H13V14Z","M16 9H30V10H34V14H35V23H32V27H29V29H26V27H23V30H20V28H17V29H14V25H12V15H14V11Z","M15 11H20V8H23V10H27V8H31V11H34V15H35V24H32V28H27V30H20V29H15V26H13V16Z","M16 11H20V8H23V5H26V8H31V10H34V14H35V23H32V27H28V29H19V29H15V25H13V16Z","M16 11H20V9H29V11H32V14H33V23H30V26H20V27H16V24H14V16Z","M16 10H20V7H24V9H28V6H31V10H35V14H36V21H34V27H36V32H31V30H30V35H26V32H23V34H20V32H16V35H15V30H11V32H13V25H12V17H14V12Z","M15 10H18V8H21V9H23V6H27V9H31V8H33V12H36V15H34V19H36V22H33V26H30V28H27V27H24V30H20V28H16V29H13V25H11V21H13V17H11V14H14Z"][a.hair],h);
    if(hair.kind==='spiky'){hairRear='';hairFront=p('M11 22V18H8V15H12V13H8V9H14V4H18V7H22V1H25V6H30V4H32V10H38V13H35V17H38V20H34V24H31V17H28V20H25V15H22V19H19V16H16V22H14V25Z',h);if(back)hairFront+=r(16,18,16,10,h);else if(side)hairFront=p('M14 25V21H10V17H8V13H13V10H10V6H17V8H21V1H24V7H29V4H31V10H37V12H33V15H30V14H27V17H24V15H21V19H19V25H16V28Z',h);}
    if(hair.kind==='princess'){hairRear=p('M14 10H33V14H35V33H31V36H17V34H11V16Z',h);hairFront=back?r(14,12,20,22,h):side?p('M16 10H29V12H32V15H29V14H26V17H23V15H20V19H18V25H15V23H13V15H15Z',h):p(fringe[3],h);for(const x of side?[12]:[11,33])for(let y=20;y<37;y+=5)hairFront+=r(x,y,4,3,h)+r(x-1,y+3,4,2,h)+r(x+1,y,2,1,'#c99159');}
    if(back&&long)hairFront+=r(14,24,20,length-24,h)+r(18,16,1,length-19,'#a97852')+r(29,16,1,length-19,'#a97852');
    if(!back)hairFront+=r(side?19:18,10,8,1,'#cf9a61');
    const hatMap={
      cap:()=>p('M13 12V9H17V6H29V8H33V12H36V14H29V12Z','#496b79'),
      beanie:()=>p('M13 13V9H16V6H20V5H28V6H32V9H35V15H13Z','#b68c67')+r(13,12,22,3,'#9b7659'),
      chef:()=>p('M14 13V9H11V5H15V2H21V4H26V2H32V5H36V9H33V13Z',white)+r(14,12,20,3,'#e1d7c3'),
      explorer:()=>p('M9 14V12H14V8H18V6H30V8H34V12H39V15H9Z','#b19567')+r(15,11,18,2,'#706044'),
      royal:()=>p('M14 13L12 4L20 8L24 1L28 8L36 4L34 13Z',gold)+r(23,7,3,3,'#b64f4c'),
      wizard:()=>p('M8 15V13H14L22 1H30V4H27L34 13H39V16Z','#56628e')+star(24,8),
      bunnyEars:()=>p('M14 12H12V2H14V1H17V5H19V12ZM28 12V5H30V1H33V3H35V10H33V13Z','#fff2f6')+r(14,4,2,6,'#efa5c2')+r(31,4,2,6,'#efa5c2'),
      catEars:()=>p('M12 14V2L22 11ZM27 11L36 2V14Z','#c7b6ed')+p('M14 10V6L19 11ZM30 11L34 6V10Z','#efacd0'),
      pandaEars:()=>r(11,6,7,7,ink)+r(30,6,7,7,ink)+r(13,8,3,3,'#7c8391')+r(32,8,3,3,'#7c8391'),
      visor:()=>r(13,11,22,3,white)+r(30,14,9,2,'#e6a1bb'),
      headband:()=>r(13,12,22,3,'#ee9857')+p('M33 13H39V15H37V18H40V21H36V17H33Z','#ee9857'),
      cheerBow:()=>p('M20 9L13 5V13L20 11L27 15V6Z','#1767c7')+r(19,8,3,4,white),
      balaclava:()=>p('M17 8H31V10H35V14H36V25H33V29H16V26H12V15H14V10H17Z','#202226')+(!back?r(side?28:16,18,side?7:17,5,skin)+r(side?31:18,19,2,3,ink)+(side?'':r(28,19,2,3,ink)):'')
    };
    if(hatMap[hat.kind])hatArt=hatMap[hat.kind]();
    if(hat.kind==='balaclava'){hairRear='';hairFront='';}
    if(acc.kind==='glasses'&&!back)hatArt+=side?p('M29 18H35V23H29ZM30 19V22H34V19Z',ink):p('M16 18H22V23H16ZM17 19V22H21V19ZM26 18H32V23H26ZM27 19V22H31V19ZM22 20H26V21H22Z',ink);
    if(acc.kind==='headphones')hatArt+=p('M11 22V12H13V8H17V6H31V8H35V12H37V22H34V13H33V10H30V8H18V10H15V13H14V22Z','#35424c')+r(10,18,5,8,'#39877e')+r(34,18,5,8,'#39877e');
    const hx=side?32:35,hy=42;
    const hands={
      wand:()=>r(1,-12,2,23,'#916448')+star(2,-13),
      katana:()=>p('M0 1V-21H1V-27H3V-23H4V1Z','#d6f4ff')+r(1,-23,1,23,'#fff')+r(-2,0,8,2,gold)+r(0,2,4,7,ink)+r(1,4,2,1,gold)+r(1,7,2,1,gold)+r(2,9,2,4,'#b84840'),
      tea:()=>r(-2,-1,7,7,'#39877e')+r(-2,-2,7,2,white),
      basketballBall:()=>p('M-2 -5H5V-3H7V4H5V6H-2V4H-4V-3H-2Z','#e8914c')+r(1,-5,1,11,ink)+r(-4,0,11,1,ink),
      soccerBall:()=>p('M-2 -5H5V-3H7V4H5V6H-2V4H-4V-3H-2Z',white)+r(0,-1,4,4,ink)+r(-3,-4,2,2,ink)+r(4,4,2,2,ink),
      tennisRacket:()=>p('M-2 -15H5V-13H7V-4H5V-2H3V7H1V-2H-2V-4H-4V-13H-2Z','#dd8eaa')+r(-2,-13,7,9,'#e5f6ef')+r(0,-13,1,9,'#94b7ab')+r(-2,-9,7,1,'#94b7ab'),
      cheerPompoms:()=>p('M-4 -3H-1V-6H3V-3H7V0H5V4H1V6H-3V3H-6V0H-4Z','#1767c7')+r(-4,-1,10,1,white)+r(0,-5,1,10,white)
    };
    if(hands[hand.kind])handArt=`<g transform="translate(${hx} ${hy})">${hands[hand.kind]()}</g>`;
    if(hand.kind==='cheerPompoms'&&!side)handArt+=`<g transform="translate(12 42)">${hands.cheerPompoms()}</g>`;
    if(it('auraEffect').kind==='blazing'){for(let i=0;i<7;i++){const x=5+i*6,tip=15+Math.round(Math.sin(t*6+i)*4)+(i%2)*9;effects+=p(`M${x-3} 56V40H${x-2}V${tip+5}H${x}V${tip}H${x+1}V${tip+9}H${x+3}V42H${x+4}V56Z`,'#ed4225')+p(`M${x-1} 55V43H${x}V${tip+12}H${x+1}V45H${x+2}V55Z`,'#ffbd2e');}for(let i=0;i<5;i++)effects+=r(i%2?43:4,Math.round(52-((t*12+i*9)%43)),1,2,gold);}
    else if(a.aura)effects+=star(6,31,['',gold,'#e28a56',gold,'#d9a3ac'][a.aura])+star(42,39,['',gold,'#e28a56',gold,'#d9a3ac'][a.aura]);
    if(a.pet){const pc=['','#c19470',white,'#87ae91','#61917d'][a.pet];pet+=r(36,51,9,7,ink)+r(37,52,7,5,pc)+r(38,53,1,1,ink)+r(42,53,1,1,ink);if(a.pet===1)pet+=p('M36 52V48L40 52ZM42 52L45 48V52Z',pc);if(a.pet===2)pet+=r(36,50,9,3,'#ed955e');if(a.pet===4)pet+=p('M44 54H47V51H48V56H44Z',pc);}
    return {rear,cloth,front,hairRear,hairFront,hatArt,handArt,effects,pet,c,bc,skin,skirt,shoes};
  }

/* Integer-grid sprites: 48 x 64. Shared inventory and dedicated pixel components. */
function renderPixel(a,o={}){
 const side=['left','right'].includes(o.direction),back=o.direction==='back',t=o.reduced?0:Number.isFinite(o.time)?o.time:0,f=o.action==='walk'?Math.floor(t*7)%4:0,step=[0,2,0,-2][f],bob=f%2?1:0;
 const white='#fff2d5',ink='#352838',red='#bc3c50',dark='#792d43',light='#ed7667',cream='#f5dfaf',skin=['#efc392','#c9936c','#9d6554'][a.skin||0],hair=['#79503c','#ba7a45','#354652'][a.hairColor||0];let s='';
 const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
 const p=(d,c)=>`<path d="${d}" fill="${c}"/>`;
 const hood=a.hat==='fairy-red-hood',robe=a.top==='fairy-red-robe';
 const parts=pixelParts(a,side,back,t);let body='';
 // Feet and trousers have a four-frame stepping cycle.
 for(const [x,offset] of [[side?21:17,step],[side?26:27,-step]])body+=r(x,44,5,9,ink)+r(x,45,4,7,parts.skirt||item(a.bottom)?.kind==='sportShorts'?skin:parts.bc)+r(x-1,52+offset,7,3,ink)+r(x,52+offset,5,2,parts.shoes.color||(['boots','apocalypseBoots'].includes(parts.shoes.kind)?'#73503b':'#f5eddd'))+r(x,54+offset,5,1,parts.shoes.accent||'#bdb3a1')+(['boots','apocalypseBoots','highTops'].includes(parts.shoes.kind)?r(x,49+offset,4,3,parts.shoes.color||'#73503b'):'')+(['bunnySlippers','pawSlippers'].includes(parts.shoes.kind)?r(x,51+offset,2,2,parts.shoes.accent||'#efa5c2'):'');
 const legs=o.action==='sit'?p('M16 48H22V51H29V54H16V53H13V50H16ZM27 48H32V50H36V53H33V55H26V52H23V50H27Z',parts.bc)+r(13,53,6,2,'#f5eddd')+r(31,54,6,2,'#f5eddd'):body;body='';
 body+=parts.rear+(hood?'':parts.hairRear);body+=p(side?'M19 31H30V34H32V44H35V49H16V45H17V35H19Z':'M17 31H31V33H34V40H36V48H32V50H26V49H22V50H16V48H12V40H14V34H17Z',ink);
 body+=p(side?'M20 32H29V35H31V44H33V48H18V44H19Z':'M18 32H30V34H33V41H35V47H31V49H26V48H22V49H17V47H13V41H15V35H18Z',robe?red:parts.c);
 if(!robe)body+=r(side?19:16,44,side?13:17,6,parts.bc)+parts.cloth;
 if(robe){body+=p(side?'M20 35H22V41H21V47H18V44H19Z':'M17 36H19V42H17V47H14V42H15V38H17ZM30 36H32V42H34V47H31V43H30Z',dark);if(!back)body+=p(side?'M27 34H29V40H30V46H24V43H25V38H27Z':'M21 34H27V40H28V44H30V47H18V44H20V40H21Z',cream);}
 if(!back)body+=r(side?28:23,32,2,3,'#ffcc76');
 // Arms remain outside the robe; the basket follows the near hand.
 const raised=o.action==='wave'||o.action==='celebrate';const armY=36+(side?step:0);if(!raised)body+=r(side?28:32,armY,5,8,ink)+r(side?29:33,armY,3,5,robe?light:parts.c)+r(side?29:33,armY+5,3,3,skin);
 if(!side)body+=r(12,36-step,4,8,ink)+r(13,37-step,2,4,robe?red:parts.c)+r(13,41-step,2,2,skin);
 body+=parts.front;body+=r(21,27,7,7,ink)+r(22,28,5,5,skin);
 // Distinct front, profile and rear silhouettes, drawn on the pixel grid.
 let head=p(side?'M17 9H29V11H33V15H35V19H37V22H35V26H33V29H27V31H20V29H16V26H14V15H15V11H17Z':'M17 8H31V10H35V13H37V24H35V28H31V30H17V28H13V24H11V14H13V10H17Z',ink);
 head+=p(side?'M18 11H29V13H32V16H34V20H36V21H34V25H32V28H26V29H20V27H17V25H16V15H18Z':'M17 11H31V13H34V16H35V23H33V26H30V28H18V26H15V23H13V16H15V13H17Z',back?hair:skin);
 if(!back&&!hood&&a.faceShape===1)head+=p(side?'M16 20H34V26H32V29H20V27H16Z':'M13 20H35V25H33V28H30V30H18V28H15V25H13Z',skin);
 if(!back&&!hood&&a.faceShape===2){head+=p('M15 25H33V28H29V30H26V32H22V30H19V28H15Z',ink)+p('M16 25H32V27H28V29H25V30H23V29H20V27H16Z',skin);}
 if(!back){
 const ek=item(a.eyeStyle)?.kind,blink=!o.reduced&&t%4.7>4.52,happy=a.expression===1||o.action==='celebrate';
 for(const x of side?[31]:[18,28]){
   if(blink||a.expression===4||a.eyes===3&&!ek)head+=r(x-1,21,4,1,ink);
   else if(happy||a.eyes===2&&!ek)head+=p(`M${x-1} 21v-1h1v-1h2v1h1v1h-1v-1h-2v1Z`,ink);
   else if(ek){const ec=ek==='redEyes'?'#bb3b48':ek==='starEyes'?'#655690':'#487d9e';head+=r(x-1,18,4,5,ink)+r(x,19,2,3,ec)+r(x,19,1,1,white);if(ek==='starEyes')head+=r(x,20,2,1,'#ffe294');if(ek==='sharp')head+=r(x-1,18,4,2,skin);}
   else if([1,4,6].includes(a.eyes))head+=p(a.eyes===4?`M${x-1} 19h2v1h2v1h-4Z`:`M${x-1} 20h2v-1h2v2h-4Z`,ink);else head+=r(x,19,a.eyes===5?1:2,a.expression===3?4:3,ink);
   if([2,5].includes(a.expression))head+=r(x-1,17,3,1,ink);
 }
 const mx=side?32:23;head+=happy||a.mouth===1?r(mx-1,25,4,1,ink)+r(mx,26,2,1,ink):a.expression===3?r(mx,25,2,2,ink):r(mx,25,3,1,ink);
 }

 if(hood&&!back)head+=p(side?'M22 12H30V14H32V16H29V15H27V17H24V15H21Z':'M17 12H31V14H33V16H29V15H27V17H24V15H21V17H18V15H15V14H17Z',hair);
 if(hood){head+=p(back?'M17 6H29V7H33V9H36V12H38V26H39V31H36V34H30V32H18V34H11V31H9V26H10V13H12V9H17Z':side?'M16 6H28V7H32V9H35V12H37V17H34V14H31V12H24V13H20V16H19V23H21V27H25V30H29V32H24V34H16V32H12V29H10V14H12V9H16Z':'M17 6H31V8H35V10H38V15H39V29H37V33H32V31H30V28H33V25H35V16H33V13H30V11H18V13H15V16H13V25H16V28H18V31H16V33H11V30H9V15H11V10H14V8H17Z',ink);
 head+=p(back?'M17 8H29V9H33V11H35V14H36V26H37V30H35V32H30V30H18V32H12V30H11V26H12V14H14V10H17Z':side?'M17 8H28V9H32V11H34V13H31V11H23V12H19V15H17V23H19V28H23V31H26V32H17V30H14V27H12V15H14V10H17Z':'M18 8H30V10H34V12H36V16H37V28H35V31H33V29H35V26H37V16H35V12H31V10H17V12H13V16H11V26H13V29H15V31H12V29H11V15H13V12H15V10H18Z',red);
 head+=back?r(22,10,2,18,light)+r(24,28,8,2,dark):side?p('M16 12H19V10H27V11H20V14H17V23H15V15H16Z',light):p('M17 9H30V10H17ZM14 12H16V15H14V23H12V16H13V13H14ZM35 18H36V27H34V29H32V27H34V24H35Z',light);
 }else{head+=parts.hairFront;}
 head+=parts.hatArt;
 head='<g transform="translate(0 '+(a.faceShape===3?1:0)+')">'+head+'</g>';body+=head;body+=(raised?'<g transform="translate(0 -12)">'+parts.handArt+'</g>':parts.handArt);
 if(a.hand==='fairy-basket'){const x=side?31:34,y=43+(raised?-12:side?step:0);body+=`<g transform="translate(${x} ${y})">`+p('M0 0V-4H2V-6H7V-4H9V0H11V8H9V10H0V8H-2V0Z',ink)+p('M1 0V-3H3V-4H6V-3H8V0H7V-2H2V0Z','#dba666')+r(-1,1,11,6,'#b67c49')+r(0,7,9,2,'#84513c')+r(0,3,9,1,'#edc78c')+r(2,1,1,6,'#edc78c')+r(6,1,1,6,'#edc78c')+'</g>';}
 if(o.action==='wave'||o.action==='celebrate'){body+=p('M34 38H37V33H40V27H37V29H35V34H33Z',ink)+r(36,29,3,5,skin);if(o.action==='celebrate')body+=r(10,29,3,9,skin);}
 body=legs+(o.action==='sit'?'<g transform="translate(0 5)">'+body+'</g>':body);
 s+=r(15,57,19,2,'#ddd4bc');if(o.direction==='left')body=`<g transform="translate(48 0) scale(-1 1)">${body}</g>`;
 return `<svg data-art-style="pixel" data-action="${o.action||'idle'}" data-direction="${o.direction||'front'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" shape-rendering="crispEdges" role="img" aria-label="すし単アバター（ドット） ${o.direction||'front'}"><g transform="translate(0 ${o.action==='celebrate'&&!o.reduced?-(Math.floor(t*6)%2)*3:bob})">${parts.effects}${s}${body}${parts.pet}</g></svg>`;
}

  function render(value={},options={}){
    const a=normalize(value), direction=['front','back','left','right'].includes(options.direction)?options.direction:'front';
    if(a.renderStyle==='pixel')return renderPixel(a,{...options,direction});
    paint=options.style==='classic'?null:{prefix:'avb'+fingerprint(JSON.stringify(a)+direction)+'-',defs:[],materials:new Map(),clips:new Map()};
    const action=['walk','idle','wave','sit','celebrate'].includes(options.action)?options.action:'idle';
    const time=Number.isFinite(options.time)?options.time:0, reduced=!!options.reduced;
    const phase=reduced?0:time*7.8, motionWave=Math.sin(phase), side=direction==='left'||direction==='right', back=direction==='back';
    const top=item(a.top,'top'), bottom=item(a.bottom,'bottom'), skin=SKINS[a.skin], h=HAIRS[a.hairColor], c=top.color||'#fff9ec', accent=top.accent||'#39877e', k=top.kind;
    const accessory=item(a.accessory)?.kind, bk=item(a.back)?.kind, sh=item(a.shoes)?.kind, hand=item(a.hand)?.kind;
    const walking=action==='walk', sitting=action==='sit', happy=action==='celebrate';
    const bounce=reduced?0:walking?-Math.abs(Math.sin(phase))*2:happy?-Math.max(0,Math.sin(time*5))*13:Math.sin(time*2)*.65;
    let torsoY=sitting?29:0;
    const legAngle=walking?motionWave*23:0;
    const shoes=item(a.shoes,'shoes');
    const sportBottom=bottom.kind==='sportShorts'||bottom.kind==='tennisSkirt';
    const leg=(x,angle)=>group(path('M-8 0H9L8 29H-8Z',sportBottom?skin:bottom.color||'#334155')+(sportBottom?path('M-8 0H9V12H-8Z',bottom.color)+path('M-8 21H9V28H-8Z','#fff9ec'):'')+shoeArt(shoes),`translate(${x} 144) rotate(${angle})`);
    let legs=sitting?path('M62 151Q39 153 44 176Q49 187 78 177L93 164L100 150Z',sportBottom?skin:bottom.color||'#334155')+path('M91 151Q118 149 119 171Q115 190 79 181L61 169Z',sportBottom?skin:bottom.color||'#334155')+group(shoeArt(shoes),'translate(53 155) rotate(18) scale(.72)')+group(shoeArt(shoes),'translate(107 157) rotate(-18) scale(.72)'):leg(side?77:66,legAngle)+leg(side?85:95,-legAngle);
    if(bottom.kind==='sportShorts')legs+=path(sitting?'M55 151H105L109 165H87L81 157L73 165H51Z':'M54 140H107L109 158H87L81 148L74 158H52Z',bottom.color)+path(sitting?'M53 164H73M88 164H108':'M53 156H73M88 156H108','none',`stroke="${bottom.accent}" stroke-width="3"`);
    if(bottom.kind==='tennisSkirt')legs+=path(sitting?'M53 153H108L119 171Q82 182 43 170Z':'M54 140H107L114 163Q81 174 46 163Z',bottom.color)+path(sitting?'M67 155L62 173M82 155V177M98 155L104 173':'M62 143L57 164M79 142V169M98 143L105 164','none',`stroke="${bottom.accent}" stroke-width="2"`);
    if(bottom.kind==='cheerSkirt')legs+=path(sitting?'M53 153H108L119 171Q82 182 43 170Z':'M54 140H107L114 163Q81 174 46 163Z',bottom.color)+path(sitting?'M55 158H114M67 155L62 173M82 155V177M98 155L104 173':'M55 146H110M62 143L57 164M79 142V169M98 143L105 164','none','stroke="#fff" stroke-width="3"');
    if(bottom.kind==='apocalypsePants')legs+=path(sitting?'M52 161L69 158M91 160L108 166':'M60 151L72 148M91 149L104 154','none','stroke="#9a6b4d" stroke-width="2.5"');
    if(bottom.kind==='schoolSkirt')legs+=path(sitting?'M53 153H108L120 172Q82 181 42 169Z':'M55 140H106L113 164Q82 172 47 164Z',bottom.color)+path(sitting?'M57 155L52 170M74 156L72 175M92 155L98 174M51 161H112M48 168H116':'M62 146L57 165M78 145V168M96 146L104 165M54 151H109M51 159H111','none','stroke="#77848b" stroke-width="1.5"');
    if(bottom.kind==='schoolSlacks'&&!sitting)legs+=[side?77:66,side?85:95].map((x,i)=>group(path('M0 6V24','none','stroke="#65707b" stroke-width="1.2"'),`translate(${x} 144) rotate(${i?-legAngle:legAngle})`)).join('');
    let rear='';
    if(bk==='cape'||k==='royal')rear+=path(`M57 97L101 97Q110 122 ${125+(reduced?0:motionWave*3)} 151L100 159L80 150L57 158L35 148Z`,k==='royal'?'#b4524b':'#425875')+path('M38 146L57 153L80 145L100 154L121 148','none','stroke="#e8b557"');
    if(accessory==='wings')rear+=path('M62 111Q25 88 30 115L41 126L29 124Q32 145 63 138M100 111Q139 88 132 115L123 126L135 124Q131 145 101 138','#fff9ec');
    if(bk==='backpack')rear+=side?path('M51 102Q37 97 36 116V140Q37 150 56 147L60 113Z','#39877e'):path('M50 104Q47 93 57 92H103Q114 93 113 108V145H49Z','#39877e');
    const torso=side?'M68 99Q86 94 101 104L104 145Q87 151 61 144L62 113Z':'M58 99Q79 92 103 99L108 146Q82 152 53 146Z';
    let body=path(torso,c);
    if(k==='redRobe')body=path(side?'M67 98L98 100L111 162L94 168L50 163Z':'M58 98Q80 107 103 98L118 163L100 170L80 165L60 170L43 163Z',c)+path(side?'M76 112L67 158M94 116L103 158':'M60 117L52 160M100 117L109 160','none','stroke="#752b43" stroke-width="3"')+(!back?path(side?'M89 106L84 153L98 158L101 112Z':'M71 108H90L100 158Q80 164 60 158Z',accent)+path(side?'M89 105L101 103L96 112Z':'M80 106L68 100L66 111L80 108L94 111L92 100Z','#f5c67b'):'');
    if(['bunny','cat','panda'].includes(k)){
      body+=path(side?'M66 98Q70 86 94 96L103 106L90 111Z':'M58 99Q59 87 80 92Q100 86 104 99L91 110L80 101L68 110Z',c)+path('M55 141H107','none',`stroke="${accent}" stroke-width="4"`);
      if(!back&&!side){
        body+=`<ellipse cx="81" cy="124" rx="14" ry="12" fill="${k==='panda'?'#fff':accent}" stroke-width="1.5"/>`;
        if(k==='bunny')body+=path('M72 116Q68 101 73 103L77 114M85 114Q88 101 92 104L91 117',accent);
        if(k==='cat')body+=path('M68 119L68 110L77 114M85 114L94 110L94 119',accent)+path('M65 124H72M90 124H97M65 129L72 127M90 127L97 129','none','stroke-width="1"');
        if(k==='panda')body+=circle(69,115,4,accent)+circle(93,115,4,accent)+circle(75,123,4,accent)+circle(87,123,4,accent);
        body+=circle(75,123,1.5,INK)+circle(87,123,1.5,INK)+path('M78 128Q81 133 84 128','none','stroke-width="1.5"');
      }
    }
    if(k==='basketball'||k==='soccer')body+=path('M66 98Q81 109 96 98M55 141H107','none',`stroke="${accent}" stroke-width="4"`)+(k==='soccer'?path('M65 107V139M97 107V139','none',`stroke="${accent}" stroke-width="5"`):'')+(!side?`<text x="81" y="132" text-anchor="middle" font-family="sans-serif" font-size="25" font-weight="900" fill="${accent}" stroke="none">${k==='basketball'?'7':'10'}</text>`:'');
    if(k==='tennis')body+=path('M66 97L77 108L81 99L86 108L96 97','none',`stroke="${accent}" stroke-width="3"`)+path('M55 138H107','none',`stroke="${accent}" stroke-width="4"`)+(!back?circle(95,116,3,accent):'');
    if(k==='hoodie')body+=path(side?'M66 98Q70 86 94 96L103 106L90 111Z':'M58 99Q59 87 80 92Q100 86 104 99L91 110L80 101L68 110Z',c)+(!back?path(side?'M82 126H98V138H81Z':'M67 125H94L98 140H63Z',c)+path(side?'M90 109V118':'M74 108V118M87 108V118','none',`stroke="${accent}" stroke-width="2"`):'');
    if(k==='sweater')body+=path('M66 98Q80 109 96 98M55 140Q80 146 107 140','none',`stroke="${accent}" stroke-width="3"`)+path('M60 142V147M67 144V148M74 145V149M81 145V149M88 145V149M95 144V148M102 142V147','none',`stroke="${accent}" stroke-width="1.2"`);
    if(k==='chef')body+=back?path('M55 125H106','none',`stroke="${accent}"`):path('M67 98L88 119L99 101M80 112L64 128','none')+path(side?'M76 124H104V149H73Z':'M58 123H103L106 151H54Z',accent)+path('M57 126H105','none')+path('M80 125L72 132L82 130L89 136L90 128Z',accent);
    if(k==='cosmic')body+=path('M58 143H108','none',`stroke="${accent}" stroke-width="5"`)+(!back?path('M81 102V143','none',`stroke="${accent}"`)+star(side?95:95,122,5,accent):star(81,124,9,accent));
    if(k==='royal')body+=path('M60 99Q80 114 101 99L100 108Q81 122 60 108Z','#fff9ec')+star(side?98:81,111,6,'#e8b557')+path('M55 136H107','none','stroke="#b48d41" stroke-width="4"');
    if(k==='stripe')body+=path('M57 113H104M56 124H105M54 136H107','none',`stroke="${accent}" stroke-width="5"`);
    if(k==='sailor')body+=path('M59 99L80 119L102 99L94 98L80 108L68 97Z',accent);
    if(k==='polo')body+=path('M66 97L77 108L81 99L86 108L96 97','none',`stroke="${accent}"`);
    if(k==='explorer')body+=path('M64 110H75V124H64ZM88 110H100V124H88Z',accent)+path('M81 98V146','none');
    if(k==='varsity')body+=path('M67 98Q80 110 94 98M55 141H107','none',`stroke="${accent}" stroke-width="4"`)+path('M81 103V145','none')+(!back?path('M65 116V126H73','none',`stroke="${accent}" stroke-width="3"`)+circle(85,119,1.5,accent)+circle(85,130,1.5,accent):'');
    if(k.startsWith('schoolBlazer'))body+=back?path('M64 107Q81 114 98 107M81 114V146','none'):path('M67 98L79 119L93 98Z','#fff9ec')+path('M64 101L72 122L80 116L88 122L98 101','none')+(k==='schoolBlazerF'?path('M80 107L69 104L70 113L80 109L91 113L91 104Z',accent):path('M78 103H83L85 120L81 124L77 120Z',accent))+path('M80 123V145','none')+circle(87,129,1.7,'#caa551')+circle(87,139,1.7,'#caa551');
    if(k==='apocalypse')body+=path('M58 101L70 96L80 105L91 96L103 102M61 111H101M58 139H106','none','stroke="#b8b3a8" stroke-width="2"')+path('M60 99L54 108L63 110L57 117L68 116M101 99L108 108L99 111L106 118L95 116','#b8b3a8')+circle(66,105,2.4,'#d8d3c8')+circle(95,105,2.4,'#d8d3c8');
    if(k==='cheer')body+=path('M60 101L69 111L80 103L92 111L101 101','none','stroke="#fff" stroke-width="4"')+path('M56 132H106','none','stroke="#fff" stroke-width="5"')+(!back&&!side?'<text x="80" y="126" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="900" fill="#fff" stroke="none">S</text>':'');
    if(k==='tee'&&!back&&!side)body+=`<ellipse cx="81" cy="119" rx="10" ry="5" fill="#fff9ec" stroke-width="1.5"/>`+path('M71 117Q72 107 82 109Q92 109 93 117Z',a.top==='salmon'?'#fff0db':'#ed955e','stroke-width="1.5"')+path('M77 112L81 115M83 111L88 115','none','stroke="#fff0db" stroke-width="1.5"');
    if(bk==='backpack'&&!back)body+=path(side?'M68 100L65 127':'M59 100L62 126M101 100L99 126','none','stroke="#39877e" stroke-width="5"');
    if(bk==='backpack'&&back)body+=path('M53 107Q51 99 62 99H99Q108 101 107 114V147H53Z','#39877e')+path('M59 126H101V142H59Z','#39877e');
    const arm=(x,right)=>{
      let angle=walking?(right?-motionWave:motionWave)*25:0;
      if(action==='wave'&&right)angle=reduced?-140:-140+Math.sin(time*10)*12;
      if(happy)angle=right?-142:142;
      if(sitting)angle=right?25:-25;
      if(right&&hand==='katana')angle=walking?motionWave*6:sitting?5:0;
      let s=path('M-7 0Q0 -5 7 0L9 15H-8Z',k==='varsity'?'#fff9ec':c)+path('M-7 15H7L7 25Q11 27 8 32Q4 37 -2 34Q-8 35 -8 28Z',skin);
      if(right&&hand==='wand')s+=path('M8 8L12 66','none','stroke="#916448" stroke-width="5"')+circle(7,1,12,'#916448')+star(7,1,9);
      if(right&&hand==='katana')s+=`<g data-item-art="reward-sushigiri" transform="translate(5 28) rotate(22)"><path d="M-3 -17L-2 -72Q0 -83 5 -91L7 -23L4 -17Z" fill="#d6f4ff" stroke="#31526c" stroke-width="1.5"/><path d="M1 -22L2 -72L5 -86" fill="none" stroke="#fff" stroke-width="2"/><path d="M-9 -18Q1 -23 11 -18L10 -13H-8Z" fill="#d7ae54" stroke="#5a4229" stroke-width="1.5"/><rect x="-3" y="-13" width="8" height="25" rx="2" fill="#202c3d" stroke="#151e2c" stroke-width="1.5"/><path d="M-2 -9L4 -5L-2 -1L4 3L-2 7" fill="none" stroke="#c7a65b" stroke-width="2"/><path d="M-3 12H5" stroke="#e1bd65" stroke-width="3"/><path d="M1 14Q14 20 10 29M2 14Q-5 21 0 27" fill="none" stroke="#b84840" stroke-width="3"/></g>`;
      if(hand==='cheerPompoms')s+='<g transform="translate(0 31)" stroke="none"><circle cx="0" cy="0" r="12" fill="#1767c7"/><path d="M-12 -7L10 8M-10 9L11 -8M-2 -13L3 13M-13 1L13 -2" stroke="#fff" stroke-width="3"/></g>';
      if(right&&hand==='basketballBall')s+=circle(10,31,13,'#e8914c')+path('M-3 31H23M10 18V44M0 22Q16 31 0 40M20 22Q4 31 20 40','none','stroke-width="1.5"');
      if(right&&hand==='soccerBall')s+=circle(10,31,13,'#fff9ec')+path('M10 25L16 29L14 36H6L4 29Z','#303d53')+path('M10 18V25M23 27L16 29M18 42L14 36M2 42L6 36M-3 27L4 29','none','stroke-width="1.5"');
      if(right&&hand==='tennisRacket')s+=`<g transform="translate(9 10) rotate(18)"><ellipse cx="0" cy="0" rx="12" ry="17" fill="#e5f6ef" stroke="#dd8eaa" stroke-width="4"/><path d="M-9 -10H9M-11 -4H11M-11 3H11M-9 10H9M-5 -15V15M1 -15V15M6 -13V13" stroke="#94b7ab" stroke-width="1" fill="none"/><path d="M-4 17L-2 25H2L4 17" fill="none"/><path d="M0 25V39" stroke="#dd8eaa" stroke-width="5"/></g>`+circle(22,37,5,'#d9ed87');
      if(right&&hand==='basket')s+=group(path('M-3 28Q-4 5 10 5Q25 5 23 28','none','stroke="#ad7848" stroke-width="4"')+path('M-7 23H28L24 46H-3Z','#b67d48')+path('M-4 28H26M-3 35H25M-2 42H24M3 25V44M11 25V44M19 25V44','none','stroke="#e2b97c" stroke-width="2"')+path('M-6 23L4 18L11 23L17 19L27 23','#f4deb0'),'','data-item-art="fairy-basket"');
      if(right&&hand==='tea')s+=path('M0 22H18L16 39H2Z','#39877e')+`<ellipse cx="9" cy="22" rx="9" ry="3" fill="#f3d5b1"/>`;
      return group(s,`translate(${x} 104) rotate(${angle})`);
    };
    const hair=item(a.hat)?.kind==='redHood'?{rear:'',front:back?'':path(side?'M71 38Q96 32 106 52L98 50L94 56L87 47L78 53L70 47Z':'M53 47Q80 29 107 47L105 57L94 51L86 58L77 49L67 57L60 50L53 58Z',h)}:hairLayers(a,h,direction,time,reduced);
    let face=path(side?'M71 88H91V103H71Z':'M69 87H93V103H69Z',skin,'data-part="neck"');
    const blink=!reduced&&time%4.7>4.52, sleepy=a.expression===4;
    const frontFaces=[
      'M46 54Q46 32 80 33Q114 32 114 54L114 72Q113 94 80 95Q47 94 46 72Z',
      'M43 56Q43 32 80 33Q117 32 117 56V73Q117 99 80 99Q43 99 43 73Z',
      'M49 54Q49 32 80 33Q111 32 111 54L109 72Q106 85 80 100Q54 85 51 72Z',
      'M49 53Q49 30 80 31Q111 30 111 53V74Q111 101 80 103Q49 101 49 74Z'
    ];
    const sideFaces=[
      'M51 54Q52 35 80 35Q107 36 111 60L117 69L111 74Q112 93 83 95Q55 94 52 75Z',
      'M48 54Q49 33 80 34Q110 35 113 60L119 69L115 76Q117 99 82 99Q48 99 48 74Z',
      'M54 54Q54 34 80 35Q106 35 109 60L115 69L108 76L87 100Q61 90 55 75Z',
      'M53 54Q53 30 80 31Q109 33 110 60L116 70L111 77Q110 103 83 103Q54 100 53 76Z'
    ];
    face+=path(back?'M68 83H94V98Q81 103 68 98Z':(side?sideFaces:frontFaces)[a.faceShape],skin,`data-part="face" data-shape="${a.faceShape}"`);
    if(!back){
      const eyes=side?[102]:a.faceShape===1?[64,96]:a.faceShape===2?[68,92]:[66,94];
      let features='';
      for(const [index,x] of eyes.entries()){
        const sign=side?1:index===0?1:-1;
        if(a.eyeStyle)features+=collectibleEye(a,x,sign,side,blink,happy);
        else if(blink)features+=path(`M${x-3} 70H${x+3}`,'none','stroke-width="2.2"');
        else if(happy||a.expression===1)features+=path(`M${x-4} 71Q${x} 64 ${x+4} 71`,'none','stroke-width="2.3"');
        else if(sleepy)features+=path(`M${x-3} 69Q${x} 73 ${x+3} 69`,'none','stroke-width="2.3"');
        else if(a.expression===3)features+=`<ellipse cx="${x}" cy="70" rx="3" ry="4.4" fill="${INK}" stroke="none"/>`;
        else if(a.eyes===2)features+=path(`M${x-3} 71Q${x} 67 ${x+3} 71`,'none','stroke-width="2.3"');
        else if(a.eyes===3)features+=path(`M${x-3} 70H${x+3}`,'none','stroke-width="2.3"');
        else if(a.eyes===1||a.eyes===4||a.eyes===6)features+=path(`M${x-3} ${70-sign*(a.eyes===4?-1:1)}L${x+3} ${70+sign*(a.eyes===4?-1:1)}`,'none','stroke-width="2.5"');
        else features+=`<ellipse cx="${x}" cy="70" rx="${a.eyes===5?1.8:2.5}" ry="${a.eyes===5?2.5:3.4}" fill="${INK}" stroke="none"/>`;
        if(a.expression===2)features+=path(`M${x-4} 63L${x+3} ${63+sign*2}`,'none','stroke-width="1.8"');
        if(a.expression===5)features+=path(`M${x-4} ${61-sign*2}L${x+3} ${61+sign*2}`,'none','stroke-width="1.8"');
      }
      const mx=side?105:80;
      features+=a.expression===3?circle(mx,82,3,INK):happy||a.expression===1?path(`M${mx-5} 80Q${mx} 84 ${mx+5} 80Q${mx} 91 ${mx-5} 80Z`,'#be765b','stroke-width="1.7"'):a.expression===2?path(`M${mx-4} 82Q${mx+2} 86 ${mx+5} 79`,'none','stroke-width="2.2"'):sleepy?path(`M${mx-3} 83Q${mx} 81 ${mx+3} 83`,'none','stroke-width="2"'):path(a.expression===5||a.mouth===2?`M${mx-3} 81H${mx+3}`:`M${mx-4} 80Q${mx} ${a.mouth===1?89:85} ${mx+4} 80`,'none','stroke-width="2.2"');
      face+=group(features,'',`data-part="expression" data-expression="${a.expression}"`);
      if(accessory==='glasses')face+=(side?circle(102,70,8,'none'):circle(66,70,9,'none')+circle(94,70,9,'none')+path('M75 70H85','none'));
    }
    face+=hair.front;
    if(side)face+=path('M76 68Q67 64 67 74Q67 83 76 82L80 77','none',`stroke="${skin}" stroke-width="5"`)+path('M76 69Q69 66 69 74Q69 80 75 80M73 72Q76 71 76 76','none','stroke-width="1.5"');
    face+=hat(item(a.hat)?.kind,back,side);
    if(accessory==='headphones')face+=path('M43 64Q37 23 80 24Q121 24 116 64','none','stroke="#35424c" stroke-width="5"')+path('M42 60H50V78H42ZM111 60H119V78H111Z','#39877e');
    let extra='';
    if(accessory==='scarf')extra+=path('M56 95Q80 106 103 95L106 107Q80 117 54 107Z','#d97d60')+path('M98 106L111 132L100 136L88 109Z','#d97d60');
    if(accessory==='star'&&!back)extra+=path('M72 97L80 118L89 97','none')+star(80,120,6);
    if(accessory==='bag')extra+=path('M58 99L101 134','none','stroke="#916448" stroke-width="4"')+path('M93 124H113V144H92Z','#b18a61');
    if(bk==='cape'&&!back)extra+=path('M58 99L77 108L103 99','none','stroke="#e8b557" stroke-width="3"')+star(80,107,5);
    const far=side?arm(69,false):arm(54,false),near=arm(side?97:107,true);
    let upper=rear+hair.rear+far+body+near+face+extra;
    let character=group(legs+group(upper,`translate(0 ${torsoY.toFixed(2)})`),`translate(0 ${sitting?0:bounce.toFixed(2)})`);
    if(direction==='left')character=group(character,'translate(160 0) scale(-1 1)');
    let extras='';
    if(a.pet){const pet=['','ねこ','すし','スライム','恐竜'][a.pet];extras=`<g aria-label="${pet}" transform="translate(123 157)">`+path('M0 14Q-2 1 10 1Q23 1 23 14V24H0Z',a.pet===2?'#fff9ec':a.pet===3?'#87ae91':a.pet===4?'#61917d':'#c19470')+(a.pet===1?path('M0 7L1 -3L9 2M14 2L23 -3L23 8','#c19470'):a.pet===2?path('M0 9Q-1 -3 12 0Q23 -3 24 9Z','#ed955e'):'')+circle(6,12,1.3,INK)+circle(17,12,1.3,INK)+'</g>';}
    if(a.aura&&!a.auraEffect)extras+=group(star(26,106,4,['','#e8b557','#e28a56','#e8b557','#d9a3ac'][a.aura])+star(132,115,4,['','#e8b557','#e28a56','#e8b557','#d9a3ac'][a.aura]),'','opacity=".75"');
    const aura=item(a.auraEffect)?.kind==='blazing'?blazingAura(time,reduced):'';
    const painted=paint,defs=painted?`<defs>${painted.defs.join('')}</defs>`:'';paint=null;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 204" role="img" aria-label="すし単アバター" data-art-style="${painted?'painted-b':'classic'}" data-action="${action}" data-direction="${direction}">${defs}${aura}<ellipse cx="80" cy="190" rx="33" ry="5" fill="#ded8c9"/><g stroke="${INK}" stroke-width="${painted?'1.65':'2.7'}" stroke-linecap="round" stroke-linejoin="round">${character}${extras}</g></svg>`;
  }
  // Incremental DOM updates retain the SVG tree and avoid replacing it every frame.
  function patchNode(target,source){
    if(target.nodeType!==source.nodeType||target.nodeName!==source.nodeName){target.replaceWith(source.cloneNode(true));return;}
    if(target.nodeType===3){if(target.nodeValue!==source.nodeValue)target.nodeValue=source.nodeValue;return;}
    for(const attr of [...target.attributes])if(!source.hasAttribute(attr.name))target.removeAttribute(attr.name);
    for(const attr of source.attributes)if(target.getAttribute(attr.name)!==attr.value)target.setAttribute(attr.name,attr.value);
    while(target.childNodes.length>source.childNodes.length)target.lastChild.remove();
    for(let i=0;i<source.childNodes.length;i++){const t=target.childNodes[i],s=source.childNodes[i];if(!t)target.append(s.cloneNode(true));else patchNode(t,s);}
  }
  function mount(host,avatar,options={}){
    let a=normalize(avatar),o={action:'idle',direction:'front',...options},raf=0,last=0,time=0,dead=false;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const reduced=()=>o.reduced||media.matches;
    function paint(){const template=document.createElement('template');template.innerHTML=render(a,{...o,time,reduced:reduced()});const s=template.content.firstChild;if(host.firstChild)patchNode(host.firstChild,s);else host.append(s);}
    function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
    function loop(t){if(dead||document.hidden||o.paused||reduced()){stop();return;}raf=requestAnimationFrame(loop);if(last&&t-last<(a.renderStyle==='pixel'?125:32))return;time+=last?Math.min((t-last)/1000,.1):0;last=t;paint();}
    function sync(){stop();paint();if(!dead&&!document.hidden&&!o.paused&&!reduced())raf=requestAnimationFrame(loop);}
    document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);sync();
    return {setAvatar(v){a=normalize(v);paint();},setOptions(v){o={...o,...v};sync();},destroy(){dead=true;stop();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);},getState(){return {avatar:{...a},options:{...o},time,running:!!raf};}};
  }
  window.SushiAvatarV2={catalog,slots,defaults,sets,normalize,render,mount,item};
})();






