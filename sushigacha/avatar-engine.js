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
    a.gender=a.gender==='female'?'female':'male';return a;
  }
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const group=(s,t='',attr='')=>`<g${t?` transform="${t}"`:''} ${attr}>${s}</g>`;
  const star=(x,y,r=8,fill='#e8b557')=>{let d='';for(let i=0;i<10;i++){let t=(i*36-90)*Math.PI/180,rr=i%2?r*.46:r;d+=(i?'L':'M')+(x+Math.cos(t)*rr).toFixed(2)+' '+(y+Math.sin(t)*rr).toFixed(2);}return path(d+'Z',fill);};
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
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

  function hat(kind,back){
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

  function render(value={},options={}){
    const a=normalize(value), direction=['front','back','left','right'].includes(options.direction)?options.direction:'front';
    const action=['walk','idle','wave','sit','celebrate'].includes(options.action)?options.action:'idle';
    const time=Number.isFinite(options.time)?options.time:0, reduced=!!options.reduced;
    const phase=reduced?0:time*7.8, motionWave=Math.sin(phase), side=direction==='left'||direction==='right', back=direction==='back';
    const top=item(a.top,'top'), bottom=item(a.bottom,'bottom'), skin=SKINS[a.skin], h=HAIRS[a.hairColor], c=top.color||'#fff9ec', accent=top.accent||'#39877e', k=top.kind;
    const accessory=item(a.accessory)?.kind, bk=item(a.back)?.kind, sh=item(a.shoes)?.kind, hand=item(a.hand)?.kind;
    const walking=action==='walk', sitting=action==='sit', happy=action==='celebrate';
    const bounce=reduced?0:walking?-Math.abs(Math.sin(phase))*2:happy?-Math.max(0,Math.sin(time*5))*13:Math.sin(time*2)*.65;
    let torsoY=sitting?29:0;
    const legAngle=walking?motionWave*23:0;
    const leg=(x,angle)=>group(path('M-8 0H9L8 29H-8Z',bottom.color||'#334155')+path(sh==='boots'?'M-8 19H9V29Q20 28 20 38H-10Z':'M-9 28H9L18 33Q22 40 13 41H-11Z',sh==='boots'?'#916448':'#fff9ec')+(sh==='boots'?path('M-8 24H9','none'):path('M-10 36H19','none')),`translate(${x} 144) rotate(${angle})`);
    let legs=sitting?path('M62 151Q39 153 44 176Q49 187 78 177L93 164L100 150Z',bottom.color||'#334155')+path('M91 151Q118 149 119 171Q115 190 79 181L61 169Z',bottom.color||'#334155')+path('M54 174Q44 173 44 182Q48 190 65 183L69 176Z',sh==='boots'?'#916448':'#fff9ec')+path('M104 177Q120 174 118 184Q109 191 96 185L94 179Z',sh==='boots'?'#916448':'#fff9ec'):leg(side?77:66,legAngle)+leg(side?85:95,-legAngle);
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
      if(right&&hand==='tea')s+=path('M0 22H18L16 39H2Z','#39877e')+`<ellipse cx="9" cy="22" rx="9" ry="3" fill="#f3d5b1"/>`;
      return group(s,`translate(${x} 104) rotate(${angle})`);
    };
    const hair=hairLayers(a,h,direction,time,reduced);
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
    face+=hat(item(a.hat)?.kind,back);
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
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 204" role="img" aria-label="すし単アバター" data-action="${action}" data-direction="${direction}">${aura}<ellipse cx="80" cy="190" rx="33" ry="5" fill="#ded8c9"/><g stroke="${INK}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${character}${extras}</g></svg>`;
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
    function loop(t){if(dead||document.hidden||o.paused||reduced()){stop();return;}raf=requestAnimationFrame(loop);if(last&&t-last<32)return;time+=last?Math.min((t-last)/1000,.1):0;last=t;paint();}
    function sync(){stop();paint();if(!dead&&!document.hidden&&!o.paused&&!reduced())raf=requestAnimationFrame(loop);}
    document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);sync();
    return {setAvatar(v){a=normalize(v);paint();},setOptions(v){o={...o,...v};sync();},destroy(){dead=true;stop();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);},getState(){return {avatar:{...a},options:{...o},time,running:!!raf};}};
  }
  window.SushiAvatarV2={catalog,slots,defaults,sets,normalize,render,mount,item};
})();





