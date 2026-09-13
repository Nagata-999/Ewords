'use strict';
(() => {
  if (typeof avatarSVG !== 'function') return;
  if (typeof DEFAULT_AVATAR === 'object' && DEFAULT_AVATAR) {
    if(DEFAULT_AVATAR.faceShape == null) DEFAULT_AVATAR.faceShape = 0;
    if(DEFAULT_AVATAR.pet == null) DEFAULT_AVATAR.pet = 0;
    if(DEFAULT_AVATAR.aura == null) DEFAULT_AVATAR.aura = 0;
  }

  const FACE_SHAPE_NAMES=['標準','丸顔','シャープ'];
  const PETS=['なし','ねこ','すし','スライム','恐竜'];
  const AURAS=['なし','キラキラ','炎','電気','桜'];
  const baseRender=avatarSVG;
  const faceRe=/<ellipse cx="120" cy="90" rx="48" ry="47" fill="([^"]+)" stroke="#354b47" stroke-width="3"\/>/;

  function shapeMarkup(shape, skin){
    const common=`fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"`;
    switch(shape){
      case 1:return `<path d="M120 41 C86 41 64 61 64 88 C64 111 79 128 99 135 C106 138 113 139 120 139 C127 139 134 138 141 135 C161 128 176 111 176 88 C176 61 154 41 120 41 Z" ${common}/>`;
      case 2:return `<path d="M120 42 C96 42 78 56 75 80 C73 99 80 115 93 127 C101 134 110 138 120 140 C130 138 139 134 147 127 C160 115 167 99 165 80 C162 56 144 42 120 42 Z" ${common}/>`;
      default:return `<ellipse cx="120" cy="90" rx="48" ry="47" fill="${skin}" stroke="#354b47" stroke-width="3"/>`;
    }
  }

  function adjustFeatures(svg, shape){
    if(shape===1)return svg.replace(/cx="98" cy="91"/g,'cx="96" cy="90"').replace(/cx="142" cy="91"/g,'cx="144" cy="90"');
    if(shape===2)return svg.replace(/cx="98" cy="91"/g,'cx="100" cy="91"').replace(/cx="142" cy="91"/g,'cx="140" cy="91"');
    return svg;
  }

  function extras(a){
    const p=Math.max(0,Math.min(PETS.length-1,Number(a.pet)||0));
    const u=Math.max(0,Math.min(AURAS.length-1,Number(a.aura)||0));
    let s='';
    if(u===1)s+='<g font-size="18"><text x="39" y="62">✦</text><text x="184" y="90">✨</text><text x="45" y="177">✧</text><text x="177" y="205">✦</text></g>';
    if(u===2)s+='<g font-size="23"><text x="38" y="178">🔥</text><text x="178" y="178">🔥</text><text x="57" y="229">🔥</text><text x="159" y="229">🔥</text></g>';
    if(u===3)s+='<g font-size="21"><text x="43" y="102">⚡</text><text x="180" y="128">⚡</text><text x="50" y="218">⚡</text></g>';
    if(u===4)s+='<g font-size="18"><text x="43" y="72">🌸</text><text x="181" y="112">🌸</text><text x="50" y="201">🌸</text></g>';
    if(p){const icon=['','🐱','🍣','🟢','🦖'][p];s+=`<g><ellipse cx="194" cy="251" rx="25" ry="7" fill="#000" opacity=".09"/><text x="174" y="247" font-size="35">${icon}</text></g>`;}
    return s;
  }

  avatarSVG=function enhancedAvatarSVG(value=DEFAULT_AVATAR, previewId){
    const a={...DEFAULT_AVATAR,...value};
    let shape=Number.isInteger(a.faceShape)?a.faceShape:0;
    if(shape>2)shape=2;if(shape<0)shape=0;
    let svg=baseRender(value,previewId);
    svg=svg.replace(faceRe,(_m,skin)=>shapeMarkup(shape,skin));
    svg=adjustFeatures(svg,shape);
    const extra=extras(a);
    return extra?svg.replace(/<\/svg>\s*$/,extra+'</svg>'):svg;
  };

  window.SushiAvatarFaceShape={names:FACE_SHAPE_NAMES};
  window.SushiAvatarFun={pets:PETS,auras:AURAS};
})();
