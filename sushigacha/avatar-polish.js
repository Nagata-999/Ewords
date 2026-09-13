'use strict';

// Modern visual layer: softer proportions, expressive eyes, richer hair texture.
(() => {
  const renderBase = avatarSVG;
  function effectiveAvatar(value, previewId){const a={...DEFAULT_AVATAR,...value};if(a.outfit&&!value?.top)a.top=a.outfit;const p=ITEMS.find(x=>x.id===previewId);if(p)a[p.slot]=p.id;if(!['male','female'].includes(a.gender))a.gender='male';return a;}
  function effectiveItem(id,slot,gender,fallback){const x=ITEMS.find(v=>v.id===id&&v.slot===slot);return(!x||(x.gender&&x.gender!==gender))?ITEMS.find(v=>v.id===fallback&&v.slot===slot):x;}
  const insert=(svg,x)=>svg.replace('</svg>',x+'</svg>');
  function bodyShape(svg,g){const old=/<path d="M88 132L66 146L54 180L73 188L88 165L84 216Q120 223 156 216L152 165L167 188L186 180L174 146L152 132Z" fill="([^"]+)" stroke="#354b47" stroke-width="3" stroke-linejoin="round"\/>/;return g==='female'?svg.replace(old,(_m,f)=>`<path d="M92 132L70 147L58 180L76 188L91 165L89 203Q91 215 101 219Q120 224 139 219Q149 215 151 203L149 165L165 188L183 180L171 147L149 132Q136 140 120 140Q104 140 92 132Z" fill="${f}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`):svg.replace(old,(_m,f)=>`<path d="M84 132L61 146L50 180L70 189L86 164L82 216Q120 224 158 216L154 164L170 189L190 180L179 146L156 132Q139 137 120 137Q101 137 84 132Z" fill="${f}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`);}
  function face(a){
    const female=a.gender==='female', n=Number.isInteger(a.eyes)?a.eyes:0;
    const eye=female?'#302d38':'#2b3038', shine='#fff', lash='#453941';
    const styles=female?[
      `<ellipse cx="98" cy="91" rx="7" ry="9" fill="${eye}"/><ellipse cx="142" cy="91" rx="7" ry="9" fill="${eye}"/>`,
      `<path d="M90 92Q98 84 106 92Q98 101 90 92M134 92Q142 84 150 92Q142 101 134 92" fill="${eye}"/>`,
      `<ellipse cx="98" cy="91" rx="8.5" ry="10" fill="${eye}"/><ellipse cx="142" cy="91" rx="8.5" ry="10" fill="${eye}"/>`,
      `<path d="M89 94Q98 84 107 90Q100 100 89 94M133 90Q142 84 151 94Q140 100 133 90" fill="${eye}"/>`,
      `<path d="M90 89Q98 86 106 94Q98 101 90 89M134 94Q142 86 150 89Q142 101 134 94" fill="${eye}"/>`,
      `<ellipse cx="98" cy="91" rx="9" ry="11" fill="${eye}"/><ellipse cx="142" cy="91" rx="9" ry="11" fill="${eye}"/>`,
      `<path d="M90 91Q98 87 106 92Q99 98 90 91M134 92Q142 87 150 91Q141 98 134 92" fill="${eye}"/>`
    ]:[
      `<ellipse cx="98" cy="91" rx="6" ry="7.5" fill="${eye}"/><ellipse cx="142" cy="91" rx="6" ry="7.5" fill="${eye}"/>`,
      `<path d="M90 93L106 88Q100 98 90 93M134 88L150 93Q140 98 134 88" fill="${eye}"/>`,
      `<path d="M91 91Q98 86 105 92Q98 98 91 91M135 92Q142 86 149 91Q142 98 135 92" fill="${eye}"/>`,
      `<path d="M90 92L106 89M134 89L150 92" stroke="${eye}" stroke-width="4" stroke-linecap="round"/>`,
      `<path d="M91 89Q98 88 105 94M135 94Q142 88 149 89" stroke="${eye}" stroke-width="4" stroke-linecap="round"/>`,
      `<path d="M90 94Q98 85 106 90M134 90Q142 85 150 94" stroke="${eye}" stroke-width="4" stroke-linecap="round"/>`
    ];
    return `<g data-modern-face="1">${styles[n]||styles[0]}<circle cx="96" cy="88" r="2" fill="${shine}" opacity=".9"/><circle cx="140" cy="88" r="2" fill="${shine}" opacity=".9"/><path d="M91 78Q98 74 105 78M135 78Q142 74 149 78" fill="none" stroke="${lash}" stroke-width="2.3" stroke-linecap="round"/>${female?'<ellipse cx="86" cy="106" rx="9" ry="3" fill="#e88f92" opacity=".18"/><ellipse cx="154" cy="106" rx="9" ry="3" fill="#e88f92" opacity=".18"/>':''}<path d="M113 111Q120 116 127 111" fill="none" stroke="#a45e58" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  function hair(a){const c=['#493b32','#9b6241','#323b52'][a.hairColor]||'#493b32';const n=Number.isInteger(a.hair)?a.hair:0;const female=a.gender==='female';const accents=female?[
    '<path d="M76 55Q91 35 113 37M132 35Q153 39 164 57"/>','<path d="M75 54Q94 31 119 35M128 34Q151 38 166 61"/>','<path d="M74 53Q94 31 119 34M132 35Q153 40 166 61"/>','<path d="M73 53Q94 29 120 34M133 35Q155 42 167 62"/>','<path d="M76 55Q96 31 120 36M134 37Q151 43 163 59"/>','<path d="M77 55Q96 32 120 36M132 36Q150 42 163 58"/>','<path d="M75 55Q95 31 119 35M132 35Q151 42 164 59"/>','<path d="M78 56Q96 34 119 37M132 37Q150 43 161 59"/>'
  ]:[
    '<path d="M76 57Q89 36 108 37M113 34Q136 32 158 48"/>','<path d="M75 56Q92 33 113 36M121 34Q144 34 161 51"/>','<path d="M76 56Q95 34 119 36M126 35Q149 38 161 54"/>','<path d="M76 55Q98 31 119 37M124 36Q146 37 161 52"/>','<path d="M80 54Q102 31 126 35M132 36Q150 40 160 52"/>','<path d="M82 55Q101 37 121 38M130 38Q148 41 158 53"/>','<path d="M74 55Q93 30 117 35M128 33Q151 37 164 55"/>','<path d="M75 57Q92 32 116 37M126 33Q150 36 164 54"/>'
  ];return `<g data-modern-hair="${n}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".20">${accents[n]||accents[0]}<path d="M89 47Q108 38 128 39" opacity=".55"/></g><g fill="${c}" opacity=".12"><ellipse cx="93" cy="48" rx="14" ry="5" transform="rotate(-25 93 48)"/></g>`;}
  function limbs(a,bottom){const skin=['#f4cfae','#dba77f','#ac7657'][a.skin]||'#f4cfae',f=a.gender==='female';const hands=f?`<g fill="${skin}" stroke="#8d6550" stroke-width="1.4"><path d="M59 184Q65 181 70 187L74 195Q71 204 64 203L57 195Q55 189 59 184Z"/><path d="M181 184Q175 181 170 187L166 195Q169 204 176 203L183 195Q185 189 181 184Z"/></g>`:`<g fill="${skin}" stroke="#8d6550" stroke-width="1.5"><path d="M49 184Q56 180 63 186L69 195Q66 205 58 204L49 196Q46 190 49 184Z"/><path d="M191 184Q184 180 177 186L171 195Q174 205 182 204L191 196Q194 190 191 184Z"/></g>`;let lower=bottom?.kind==='schoolSkirt'?`<path d="M96 241H111L110 263Q103 268 96 263Z" fill="${skin}"/><path d="M130 241H145L147 263Q140 268 133 263Z" fill="${skin}"/><path d="M95 251H111L110 269H95ZM131 251H146L148 269H132Z" fill="#1d2943"/><path d="M88 266Q102 261 115 266L114 276Q102 281 88 275Z" fill="#171c23"/><path d="M126 266Q140 261 153 266L154 275Q140 281 127 276Z" fill="#171c23"/>`:`<path d="M93 252H114L112 266H94ZM127 252H148L147 266H129Z" fill="${skin}"/><path d="M87 263Q102 258 116 264L115 276Q102 282 87 275Z" fill="#171c23"/><path d="M125 264Q140 258 154 263L155 275Q140 282 126 276Z" fill="#171c23"/>`;return hands+lower;}
  function uniform(a,top,bottom){let o='';if(top?.kind==='schoolBlazerM')o+='<path d="M93 136L108 157L120 146L132 157L147 136L140 177L120 164L100 177Z" fill="#f8f7f2" stroke="#101e34" stroke-width="2"/><path d="M117 151L112 181L120 194L128 181L123 151Z" fill="#8f1f34"/>';if(top?.kind==='schoolBlazerF')o+='<path d="M94 136L108 155L120 145L132 155L146 136L140 174L120 163L100 174Z" fill="#fbfaf5" stroke="#101e34" stroke-width="2"/><path d="M104 157L93 164L107 171L120 165L133 171L147 164L136 157L120 164Z" fill="#9c2940"/>';return o;}
  avatarSVG=function(value=DEFAULT_AVATAR,previewId){const a=effectiveAvatar(value,previewId),top=effectiveItem(a.top,'top',a.gender,'starter'),bottom=effectiveItem(a.bottom,'bottom',a.gender,'basic-bottom');let svg=renderBase(value,previewId);svg=bodyShape(svg,a.gender).replace('viewBox="0 0 240 280"','viewBox="0 0 240 292"').replace('<svg ',`<svg data-avatar-gender="${a.gender}" data-avatar-style="modern" `);return insert(svg,uniform(a,top,bottom)+limbs(a,bottom)+face(a)+hair(a));};
})();
