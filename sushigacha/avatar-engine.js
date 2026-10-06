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
  const slots={top:'トップス',bottom:'ボトムス',hat:'帽子',accessory:'アクセサリー',back:'背中',shoes:'靴',hand:'手持ち',auraEffect:'限定オーラ'};
  const defaults={gender:'male',hair:0,eyes:0,mouth:0,skin:0,hairColor:0,faceShape:0,expression:0,top:'starter',bottom:'basic-bottom',hat:null,accessory:null,back:null,shoes:'studio-sneakers',hand:null,auraEffect:null};
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
  function hairBack(a,h){
    if(a.gender==='female'){
      const length=[104,132,123,148,104,104,127,104][a.hair];
      let s=path(`M48 66Q43 24 80 25Q118 25 112 67L119 ${length}Q106 ${length+10} 94 ${length-3}H65Q49 ${length+10} 41 ${length}Z`,h);



      return s;
    }
    return a.hair===6?path('M47 55H113L121 100L107 96L101 108L91 99H65L53 105L52 94L40 98Z',h):'';
  }
  function femaleTail(a,h,direction,time,reduced){
    if(a.gender!=='female'||![4,5,6,7].includes(a.hair))return '';
    const side=direction==='left'||direction==='right', back=direction==='back';
    const sway=reduced?0:Math.sin(time*5)*3;
    if(a.hair===4){
      // The engine draws right-facing side art, then mirrors the whole avatar for left.
      // Keep the pony anchored behind the skull (left side in the unmirrored side view).
      if(back)return circle(80,43,7,h)+path(`M79 48Q91 ${62+sway} 86 ${91+sway}Q81 111 70 103Q78 77 79 48Z`,h);
      if(side)return circle(53,47,6,h)+path(`M54 50Q24 ${54+sway} 29 ${84+sway}Q33 104 46 98Q38 72 54 50Z`,h);
      return '';
    }
    if(a.hair===5){
      if(back)return circle(55,51,6,h)+circle(105,51,6,h)+path(`M54 55Q31 ${62+sway} 36 ${94+sway}Q40 108 50 101Q43 76 54 55Z`,h)+path(`M106 55Q129 ${62-sway} 124 ${94-sway}Q120 108 110 101Q117 76 106 55Z`,h);
      // In profile, the far tail is mostly hidden by the head; show one rear tail only.
      if(side)return circle(52,50,5,h)+path(`M52 53Q27 ${61+sway} 33 ${94+sway}Q38 108 48 99Q40 74 52 53Z`,h);
      return '';
    }
    if(a.hair===6){
      if(back)return path('M55 46Q80 30 105 46L103 72Q98 104 80 116Q61 104 56 72Z',h)+path('M61 49Q80 64 99 49','none','stroke="#fff" stroke-opacity=".12"');
      if(side)return path(`M104 45Q127 48 124 ${77+sway}Q121 102 108 111Q113 77 104 45Z`,h);
      return path('M53 49Q80 37 107 49L105 70Q101 96 94 107Q96 72 80 57Q64 72 66 107Q57 95 55 70Z',h);
    }
    if(a.hair===7){
      if(back)return circle(80,24,17,h)+circle(80,28,8,h);
      if(side)return circle(105,27,16,h)+circle(101,31,7,h);
      return circle(80,24,16,h);
    }
    return '';
  }
  function hairFront(a,h,back,side=false){
    if(back){
      const backs=[
        'M45 62L41 48L48 43L45 34L60 35L68 23L80 28L89 20L103 32L112 29L114 43L120 50L113 62L108 78L97 87L82 84L65 88L50 79Z',
        'M45 64Q38 27 79 27Q119 25 116 64L108 79Q81 91 51 79Z',
        'M43 64Q39 24 80 26Q121 25 117 65L109 79L99 70L94 82L84 72L75 84L66 72L55 82L49 73Z',
        'M44 64Q36 30 73 27L80 34L88 27Q124 30 116 67L107 78Q99 47 80 40Q59 47 52 79Z',
        'M45 65Q36 29 68 31L78 22L90 30Q121 30 115 65L105 78L102 51Q77 38 55 56L52 78Z',
        'M46 58Q40 29 80 29Q116 29 115 59L105 69Q80 57 54 70Z',
        'M43 64L42 42L59 37L64 27L79 31L87 21L100 34L113 33L120 54L111 76L102 58L93 70L87 55L74 72L68 56L55 71L50 78Z',
        'M44 65Q33 57 44 47Q37 31 54 33Q57 18 71 29Q83 15 92 29Q111 21 113 39Q127 43 117 59L110 75L100 62Q91 71 83 58Q72 70 65 59L53 73Z'
      ];
      return path(backs[a.hair],h);
    }
    if(side){
      const sides=[
        'M47 63L43 51L49 45L47 36L61 37L68 25L82 29L91 23L104 35L113 35L117 51L111 69L102 78L99 56L91 66L88 52L76 68L71 55L58 69L54 78Z',
        'M47 69Q37 30 78 29Q112 28 115 58L121 63L113 72L106 78L102 54Q87 64 60 59L53 76Z',
        'M45 66Q39 25 80 27Q116 27 117 58L122 64L113 72L105 70L103 58L97 68L93 55L84 67L80 54L70 67L65 56L54 70L50 77Z',
        'M46 68Q37 31 74 28L81 35L89 28Q118 31 116 58L122 65L112 72L105 73Q99 46 81 41Q60 47 53 76Z',
        'M47 68Q37 31 69 32L79 23L90 31Q117 31 115 58L121 64L111 72L104 72L102 51Q78 39 56 57L53 75Z',
        'M48 58Q41 31 80 30Q111 30 115 53L121 59L111 65Q81 51 55 64Z',
        'M45 66L43 44L59 39L64 29L79 32L87 23L100 36L112 35L119 54L123 62L111 76L103 57L94 69L89 53L75 71L70 56L56 70L51 78Z',
        'M45 67Q34 58 45 48Q38 33 55 34Q57 20 72 30Q84 17 92 30Q110 23 113 40Q124 43 121 56L125 63L112 72L102 61Q92 70 84 57Q73 69 66 58L54 72Z'
      ];
      return path(sides[a.hair],h);
    }
    const shapes=[
      'M45 63L40 54L48 49L43 41L60 39L66 28L81 31L77 21Q94 20 103 34L110 29L111 43L119 47L111 54L114 67L104 76L101 55L91 64L90 51L75 65L73 53L58 67L57 59L50 75Z',
      'M46 68Q35 27 77 28Q117 24 115 65L106 74L102 53Q88 63 61 58L52 74Z',
      'M43 65Q39 24 80 26Q122 25 117 66L106 70L104 57L98 67L95 54L86 65L82 53L73 65L68 54L58 68L54 59L49 74Z',
      'M45 67Q35 30 74 27L80 35L87 27Q123 30 115 69L106 72Q100 44 80 40Q57 46 53 74Z',
      'M45 67Q36 30 68 31L78 22L89 30Q120 30 114 65L105 71L103 50Q76 38 55 56L52 72Z',
      'M47 56Q41 30 80 29Q115 30 114 57L105 58Q78 49 54 62Z',
      'M44 65L42 43L59 38L63 28L79 31L86 22L99 35L112 34L119 55L110 75L103 56L93 68L88 52L74 70L70 55L56 69L51 77Z',
      'M44 66Q32 57 44 47Q37 32 54 33Q56 19 71 29Q83 15 91 29Q110 21 112 39Q126 43 117 58L111 70L101 59Q91 69 84 56Q72 68 66 57L54 71Z'
    ];
    if(a.gender==='female')return path([shapes[1],shapes[2],shapes[0],shapes[1],shapes[4],shapes[2],shapes[3],shapes[5]][a.hair],h);
    return path(shapes[a.hair],h);
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
    let face='';
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
    face+=path((side?sideFaces:frontFaces)[a.faceShape],skin,`data-part="face" data-shape="${a.faceShape}"`);
    if(!back){
      const eyes=side?[102]:a.faceShape===1?[64,96]:a.faceShape===2?[68,92]:[66,94];
      let features='';
      for(const [index,x] of eyes.entries()){
        const sign=side?1:index===0?1:-1;
        if(blink)features+=path(`M${x-3} 70H${x+3}`,'none','stroke-width="2.2"');
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
    face+=hairFront(a,h,back,side);
    face+=hat(item(a.hat)?.kind,back);
    if(accessory==='headphones')face+=path('M43 64Q37 23 80 24Q121 24 116 64','none','stroke="#35424c" stroke-width="5"')+path('M42 60H50V78H42ZM111 60H119V78H111Z','#39877e');
    let extra='';
    if(accessory==='scarf')extra+=path('M56 95Q80 106 103 95L106 107Q80 117 54 107Z','#d97d60')+path('M98 106L111 132L100 136L88 109Z','#d97d60');
    if(accessory==='star'&&!back)extra+=path('M72 97L80 118L89 97','none')+star(80,120,6);
    if(accessory==='bag')extra+=path('M58 99L101 134','none','stroke="#916448" stroke-width="4"')+path('M93 124H113V144H92Z','#b18a61');
    if(bk==='cape'&&!back)extra+=path('M58 99L77 108L103 99','none','stroke="#e8b557" stroke-width="3"')+star(80,107,5);
    const far=side?arm(69,false):arm(54,false),near=arm(side?97:107,true);
    const rearHair=(a.gender==='female'&&side)?'':hairBack(a,h);
    let upper=rear+rearHair+femaleTail(a,h,direction,time,reduced)+far+body+near+face+extra;
    let character=group(legs+group(upper,`translate(0 ${torsoY.toFixed(2)})`),`translate(0 ${sitting?0:bounce.toFixed(2)})`);
    if(direction==='left')character=group(character,'translate(160 0) scale(-1 1)');
    let extras='';
    if(a.pet){const pet=['','ねこ','すし','スライム','恐竜'][a.pet];extras=`<g aria-label="${pet}" transform="translate(123 157)">`+path('M0 14Q-2 1 10 1Q23 1 23 14V24H0Z',a.pet===2?'#fff9ec':a.pet===3?'#87ae91':a.pet===4?'#61917d':'#c19470')+(a.pet===1?path('M0 7L1 -3L9 2M14 2L23 -3L23 8','#c19470'):a.pet===2?path('M0 9Q-1 -3 12 0Q23 -3 24 9Z','#ed955e'):'')+circle(6,12,1.3,INK)+circle(17,12,1.3,INK)+'</g>';}
    if(a.aura&&!a.auraEffect)extras+=group(star(26,106,4,['','#e8b557','#e28a56','#e8b557','#d9a3ac'][a.aura])+star(132,115,4,['','#e8b557','#e28a56','#e8b557','#d9a3ac'][a.aura]),'','opacity=".75"');
    const heat=reduced?0:Math.sin(time*2.4);
    const aura=item(a.auraEffect)?.kind==='blazing'?`<g data-item-art="reward-sushitan-aura" aria-label="烈火のオーラ" transform="translate(80 188) scale(1 ${(1+heat*.015).toFixed(3)}) translate(-80 -188)">
      <path d="M35 184Q9 155 20 124L13 107L32 121Q18 85 40 55L38 86Q49 62 55 28L67 47L80 8L93 49L107 29L106 69L126 48Q123 90 139 109L131 112L145 143Q143 172 125 184Z" fill="#e7512f" opacity=".76"/>
      <path d="M40 183Q20 155 35 122L30 110L43 113Q37 89 52 64L53 90L70 54L79 28L91 69L100 57L109 98L122 81L119 123L132 137Q140 164 118 183Z" fill="#ffb82e" opacity=".9"/>
      <path d="M49 184Q31 161 45 129L53 140L57 100L68 122L80 74L94 122L104 104L112 143L123 136Q127 167 112 184Z" fill="#fff1a1"/>
      <ellipse cx="80" cy="187" rx="52" ry="7" fill="#ffc53e" opacity=".3"/>
      <path d="M22 79L17 67L26 71M135 63L142 51L141 69M19 158L12 148M140 174L148 163" fill="none" stroke="#e99e22" stroke-width="3" stroke-linecap="round"/>
    </g>`:'';
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


