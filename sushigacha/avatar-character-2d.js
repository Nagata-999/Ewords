'use strict';
(() => {
  const TOPS={
    starter:['#f6f1e4','#f4511e'],salmon:['#f48c79','#fff2d6'],tea:['#8baf8d','#d7e7bf'],sky:['#91bbcb','#edf7ef'],lemon:['#eacb64','#fff0ac'],berry:['#b795b7','#ecd8e9'],navy:['#3f657b','#f4ead0'],sailor:['#f5f0df','#32667d'],explorer:['#b99c70','#706044'],chef:['#f7f4e9','#2c5860'],varsity:['#587f6b','#efe0b6'],royal:['#eee0a4','#b4524b'],cosmic:['#56628e','#dfc685'],'school-blazer-m':['#172d4e','#9c1f35'],'school-blazer-f':['#172d4e','#9c1f35']
  };
  const BOTTOMS={'basic-bottom':'#334155','school-slacks-m':'#38414d','school-skirt-f':'#323845'};
  const SKINS=['#f4cfae','#dba77f','#ac7657'];
  const HAIRS=['#493b32','#9b6241','#323b52'];
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function colors(a){const t=TOPS[a.top]||TOPS.starter;return {skin:SKINS[a.skin]||SKINS[0],hair:HAIRS[a.hairColor]||HAIRS[0],top:t[0],accent:t[1],bottom:BOTTOMS[a.bottom]||BOTTOMS['basic-bottom']};}
  function hatBack(a,c){if(!a.hat)return''; if(a.hat==='hat-crown')return `<path d="M50 37L58 18L68 33L80 14L92 33L103 18L110 39Z" fill="#e9c45b" stroke="#9b7425" stroke-width="3"/>`; if(a.hat==='hat-wizard')return `<path d="M44 42Q80 30 116 42L100 8Q78 18 61 42Z" fill="#56628e" stroke="#37416c" stroke-width="3"/>`; if(a.hat==='hat-chef')return `<path d="M48 38Q43 19 58 17Q64 6 77 14Q89 3 98 15Q115 15 111 38Z" fill="#f7f4e9" stroke="#d7d3c8" stroke-width="3"/>`; return `<path d="M46 40Q80 21 114 40L108 27Q80 13 52 27Z" fill="#3f657b" stroke="#2b4656" stroke-width="3"/>`;}
  function accBack(a){if(a.accessory==='acc-wings')return `<g fill="#f5f8ff" stroke="#cad5e6" stroke-width="3"><ellipse cx="39" cy="126" rx="21" ry="38" transform="rotate(25 39 126)"/><ellipse cx="121" cy="126" rx="21" ry="38" transform="rotate(-25 121 126)"/></g>`; if(a.accessory==='acc-bag')return `<path d="M105 124Q127 118 132 139V167H104Z" fill="#b56d4b" stroke="#7d4938" stroke-width="3"/><path d="M70 91Q115 106 121 139" fill="none" stroke="#7d4938" stroke-width="4"/>`; return'';}
  function back(a,frame){const c=colors(a),female=a.gender==='female',step=frame%2?1:-1;const skirt=a.bottom==='school-skirt-f';return `<svg viewBox="0 0 160 220" aria-hidden="true">
    <ellipse cx="80" cy="207" rx="33" ry="7" fill="rgba(15,23,42,.18)"/>
    ${accBack(a)}
    <g transform="translate(0 ${frame%2?-2:0})">
      <g transform="rotate(${step*8} 58 147)"><path d="M60 137L49 174" stroke="${c.top}" stroke-width="15" stroke-linecap="round"/><circle cx="48" cy="177" r="7" fill="${c.skin}"/></g>
      <g transform="rotate(${-step*8} 102 147)"><path d="M100 137L111 174" stroke="${c.top}" stroke-width="15" stroke-linecap="round"/><circle cx="112" cy="177" r="7" fill="${c.skin}"/></g>
      <path d="M56 112Q80 101 104 112L110 166Q80 176 50 166Z" fill="${c.top}" stroke="#354b47" stroke-width="3"/>
      <path d="M61 114Q80 124 99 114" fill="none" stroke="${c.accent}" stroke-width="4" opacity=".9"/>
      ${skirt?`<path d="M50 158H110L117 184Q80 194 43 184Z" fill="${c.bottom}" stroke="#2b3840" stroke-width="3"/>`:`<path d="M49 160H111L106 187H84L80 169L76 187H54Z" fill="${c.bottom}" stroke="#2b3840" stroke-width="3"/>`}
      <g transform="rotate(${-step*11} 67 180)"><path d="M67 178L65 206" stroke="${skirt?c.skin:c.bottom}" stroke-width="14" stroke-linecap="round"/><path d="M58 207H73" stroke="#202733" stroke-width="8" stroke-linecap="round"/></g>
      <g transform="rotate(${step*11} 93 180)"><path d="M93 178L95 206" stroke="${skirt?c.skin:c.bottom}" stroke-width="14" stroke-linecap="round"/><path d="M88 207H103" stroke="#202733" stroke-width="8" stroke-linecap="round"/></g>
      <circle cx="80" cy="82" r="40" fill="${c.skin}" stroke="#8a6651" stroke-width="2"/>
      <path d="M41 83Q38 37 80 37Q122 37 119 84L113 105Q80 118 47 105Z" fill="${c.hair}"/>
      ${hatBack(a,c)}
    </g></svg>`;}
  function side(a,frame,left){const c=colors(a),female=a.gender==='female',step=frame%2?1:-1,flip=left?'scale(-1 1) translate(-160 0)':'';const skirt=a.bottom==='school-skirt-f';return `<svg viewBox="0 0 160 220" aria-hidden="true"><g transform="${flip}">
    <ellipse cx="79" cy="207" rx="29" ry="7" fill="rgba(15,23,42,.18)"/>
    ${a.accessory==='acc-wings'?`<ellipse cx="60" cy="130" rx="15" ry="34" fill="#f5f8ff" stroke="#cad5e6" stroke-width="3" transform="rotate(-28 60 130)"/>`:''}
    <g transform="translate(0 ${frame%2?-2:0})">
      <g transform="rotate(${step*18} 77 144)"><path d="M77 137L61 173" stroke="${c.top}" stroke-width="14" stroke-linecap="round"/><circle cx="59" cy="176" r="7" fill="${c.skin}"/></g>
      <path d="M66 112Q86 104 101 115L100 165Q82 173 64 164Z" fill="${c.top}" stroke="#354b47" stroke-width="3"/>
      ${skirt?`<path d="M61 157H102L108 184Q84 192 57 183Z" fill="${c.bottom}" stroke="#2b3840" stroke-width="3"/>`:`<path d="M61 159H102L98 185H82L76 169L72 185H61Z" fill="${c.bottom}" stroke="#2b3840" stroke-width="3"/>`}
      <g transform="rotate(${-step*18} 74 180)"><path d="M73 178L61 205" stroke="${skirt?c.skin:c.bottom}" stroke-width="13" stroke-linecap="round"/><path d="M53 207H69" stroke="#202733" stroke-width="8" stroke-linecap="round"/></g>
      <g transform="rotate(${step*18} 91 180)"><path d="M91 178L103 204" stroke="${skirt?c.skin:c.bottom}" stroke-width="13" stroke-linecap="round"/><path d="M98 207H114" stroke="#202733" stroke-width="8" stroke-linecap="round"/></g>
      <circle cx="81" cy="82" r="39" fill="${c.skin}" stroke="#8a6651" stroke-width="2"/>
      <path d="M45 79Q47 39 82 38Q113 39 119 72Q104 54 93 53Q91 88 56 101Q45 94 45 79Z" fill="${c.hair}"/>
      <ellipse cx="113" cy="84" rx="5" ry="7" fill="${c.skin}"/><circle cx="106" cy="80" r="3.5" fill="#273444"/>
      ${hatBack(a,c)}
      ${a.accessory==='acc-bag'?`<rect x="51" y="135" width="24" height="30" rx="5" fill="#b56d4b" stroke="#7d4938" stroke-width="3"/>`:''}
    </g></g></svg>`;}
  function front(a){if(typeof window.avatarSVG==='function')return window.avatarSVG(a);return back(a,0);}
  function render(a,opts={}){const direction=opts.direction||'front',frame=opts.frame||0;if(direction==='back')return back(a,frame);if(direction==='left')return side(a,frame,true);if(direction==='right')return side(a,frame,false);return front(a);}
  window.SushiAvatar2D={render};
})();
