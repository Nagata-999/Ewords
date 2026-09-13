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
  function directionalHair(a,d,f){
    if(d==='front')return'';
    const h=HAIRS[a.hairColor]||HAIRS[0], n=Number.isInteger(a.hair)?a.hair:0, female=a.gender==='female';
    const side=d==='left'||d==='right', back=d==='back', sway=stride[f]||0;
    if(!female){
      if(back){
        const shapes=[
          '<path d="M43 82Q42 38 80 37Q119 37 117 84L109 101Q80 111 50 101Z"/>',
          '<path d="M42 83Q39 39 80 36Q120 37 119 82L111 104Q80 113 48 103Z"/>',
          '<path d="M40 82Q42 35 80 35Q119 35 121 82Q110 67 100 61Q83 78 45 87Z"/>',
          '<path d="M42 82Q43 37 80 36Q119 36 119 81Q99 58 82 61L76 104Q58 104 46 96Z"/>',
          '<path d="M44 80Q48 39 83 38Q113 39 118 75Q101 61 91 58Q70 74 45 83Z"/>',
          '<path d="M48 77Q52 43 81 42Q110 43 114 76Q80 65 48 77Z"/>',
          '<path d="M42 78Q43 36 81 37Q119 36 120 80L114 115L101 101L91 119L80 103L68 119L57 101L47 113Z"/>',
          '<path d="M41 80Q39 37 80 36Q121 36 120 80Q111 62 101 69Q95 47 84 67Q73 47 64 69Q52 58 41 80Z"/>'
        ];
        return `<g fill="${h}" data-directional-hair="male-${n}">${shapes[n]||shapes[0]}</g>`;
      }
      const shapes=[
        '<path d="M45 80Q47 40 82 38Q112 39 119 72Q104 54 93 53Q91 87 57 101Q46 94 45 80Z"/>',
        '<path d="M44 80Q44 38 82 36Q117 37 120 75Q104 58 92 55Q87 91 56 103Q44 95 44 80Z"/>',
        '<path d="M43 80Q47 34 82 35Q116 35 121 74Q105 57 94 58Q84 79 53 91Q44 89 43 80Z"/>',
        '<path d="M45 80Q49 37 84 36Q117 38 120 74Q102 53 89 58L83 104Q62 105 49 96Z"/>',
        '<path d="M46 78Q53 39 86 39Q115 40 119 73Q100 60 91 58Q70 72 46 84Z"/>',
        '<path d="M50 75Q55 44 83 42Q109 43 114 73Q89 64 50 75Z"/>',
        '<path d="M43 78Q45 35 82 36Q119 36 120 76L112 106L101 94L91 111L80 96L68 110L56 95L47 105Z"/>',
        '<path d="M43 80Q41 37 81 36Q119 36 120 78Q109 61 101 69Q95 49 84 67Q74 48 65 69Q53 58 43 80Z"/>'
      ];
      return `<g fill="${h}" data-directional-hair="male-${n}">${shapes[n]||shapes[0]}</g>`;
    }
    if(back){
      const shapes=[
        '<path d="M42 83Q40 37 80 36Q121 36 119 84L112 112Q80 124 48 112Z"/>',
        '<path d="M40 82Q38 34 80 34Q123 34 121 84L118 151Q80 169 42 151Z"/>',
        '<path d="M40 82Q38 34 80 34Q123 34 121 84L117 139Q80 156 43 139Z"/>',
        '<path d="M39 82Q37 33 80 33Q124 33 122 84L120 170Q80 190 40 170Z"/>',
        `<path d="M40 82Q38 34 80 34Q121 34 120 84L112 112Q80 124 48 112Z"/><circle cx="101" cy="54" r="9"/><path d="M101 58Q135 ${70+sway*3} 128 ${117+sway*5}Q119 ${151+sway*4} 103 133Q113 91 95 65Z"/>`,
        `<path d="M42 82Q40 35 80 35Q120 35 118 84L110 110Q80 122 50 110Z"/><circle cx="57" cy="56" r="8"/><circle cx="103" cy="56" r="8"/><path d="M57 61Q28 ${74-sway*3} 35 ${126-sway*5}Q45 145 55 126Q45 91 63 66Z"/><path d="M103 61Q132 ${74+sway*3} 125 ${126+sway*5}Q115 145 105 126Q115 91 97 66Z"/>`,
        '<path d="M40 82Q38 34 80 34Q122 34 120 84L115 145Q80 160 45 145Z"/><path d="M55 67Q80 48 105 67Q101 87 80 91Q59 87 55 67Z"/>',
        '<path d="M42 83Q40 37 80 36Q120 36 118 84L111 112Q80 124 49 112Z"/><circle cx="80" cy="37" r="20"/>'
      ];
      return `<g fill="${h}" data-directional-hair="female-${n}">${shapes[n]||shapes[0]}</g>`;
    }
    const shapes=[
      '<path d="M44 80Q45 39 82 37Q116 38 120 75Q104 55 93 54Q89 91 55 103Q44 95 44 80Z"/>',
      '<path d="M43 80Q44 36 82 35Q119 36 121 76L113 129Q99 139 96 119Q100 84 93 55Q83 91 54 105Q43 96 43 80Z"/>',
      '<path d="M42 80Q43 35 82 35Q120 35 121 77L116 145Q101 154 98 133Q101 88 93 55Q82 92 53 106Q42 97 42 80Z"/>',
      '<path d="M41 80Q42 34 82 34Q121 34 122 77L118 169Q101 179 98 153Q102 94 93 54Q82 93 52 107Q41 97 41 80Z"/>',
      `<path d="M44 80Q45 38 82 36Q116 37 120 74Q104 55 93 54Q89 89 56 103Q44 95 44 80Z"/><circle cx="55" cy="57" r="9"/><path d="M54 61Q28 ${68-sway*4} 31 ${111-sway*7}Q37 ${137-sway*5} 53 ${123-sway*3}Q44 91 61 65Z"/>`,
      `<path d="M44 80Q45 38 82 36Q116 37 120 74Q104 55 93 54Q89 89 56 103Q44 95 44 80Z"/><circle cx="54" cy="58" r="8"/><path d="M53 62Q29 ${72-sway*3} 35 ${119-sway*5}Q43 137 53 120Q45 91 60 66Z"/><circle cx="105" cy="55" r="7"/>`,
      '<path d="M43 80Q44 36 82 35Q119 36 121 76L114 135Q100 145 97 124Q100 87 93 55Q83 91 54 105Q43 96 43 80Z"/><circle cx="59" cy="59" r="8"/>',
      '<path d="M44 80Q45 39 82 37Q116 38 120 75Q104 55 93 54Q89 91 55 103Q44 95 44 80Z"/><circle cx="66" cy="35" r="20"/>'
    ];
    return `<g fill="${h}" data-directional-hair="female-${n}">${shapes[n]||shapes[0]}</g>`;
  }
  function extras(a,d){
    const side=d==='left'||d==='right', back=d==='back'; let s='';
    if(a.accessory==='acc-headphones') s+=side?'<path d="M52 69Q79 34 108 67" fill="none" stroke="#334155" stroke-width="7"/><rect x="104" y="68" width="10" height="24" rx="5" fill="#334155"/>':'<path d="M49 70Q80 31 111 70" fill="none" stroke="#334155" stroke-width="7"/><rect x="45" y="69" width="10" height="24" rx="5" fill="#334155"/><rect x="105" y="69" width="10" height="24" rx="5" fill="#334155"/>';
    if(a.accessory==='acc-scarf') s+=side?'<path d="M59 111Q83 120 103 107L108 124Q83 134 59 123Z" fill="#e56f61"/><path d="M97 119L112 153L99 150L90 124Z" fill="#d85f54"/>':'<path d="M53 110Q80 124 107 110L110 126Q80 139 50 126Z" fill="#e56f61"/><path d="M99 122L111 158L98 154L90 128Z" fill="#d85f54"/>';
    if(a.accessory==='acc-star') s+='<circle cx="82" cy="132" r="5" fill="#facc15"/><path d="M82 123V112" stroke="#c59b27" stroke-width="2"/>';
    if(a.accessory==='acc-glasses'&&side) s+='<circle cx="106" cy="80" r="9" fill="none" stroke="#374151" stroke-width="3"/><path d="M114 80H121" stroke="#374151" stroke-width="3"/>';
    if(back&&(a.top==='school-blazer-m'||a.top==='school-blazer-f')) s+='<path d="M57 116Q80 129 103 116" fill="none" stroke="#0d1e37" stroke-width="3"/><circle cx="96" cy="143" r="3" fill="#d6b55d"/>';
    if(side&&(a.top==='school-blazer-m'||a.top==='school-blazer-f')) s+='<path d="M73 116L86 133L99 115" fill="#f7f7f2"/><path d="M88 125L91 148" stroke="#9b1f35" stroke-width="5"/>';
    return s;
  }
  function fourFrame(a,o){
    const d=o.direction||'front', f=((o.frame||0)%4+4)%4;
    if(d==='front') return base(a,{direction:d,frame:f});
    let svg=base(a,{direction:d,frame:f%2});
    const amp=stride[f];
    svg=svg.replace('<svg ','<svg data-walk-frame="'+f+'" ');
    if(d==='back') svg=svg.replace('<g transform="translate(0 ',`<g transform="translate(${amp*1.5} `);
    const hair=directionalHair(a,d,f);
    if(hair) svg=svg.replace('</svg>',hair+extras(a,d)+'</svg>'); else svg=svg.replace('</svg>',extras(a,d)+'</svg>');
    return svg;
  }
  window.SushiAvatar2D.render=(a,o={})=>fourFrame(a,o);
})();
