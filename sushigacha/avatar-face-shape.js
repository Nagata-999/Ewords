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

  function petMarkup(p){
    if(!p)return '';
    const shadow='<ellipse cx="194" cy="254" rx="20" ry="5" fill="#000" opacity=".10"/>';
    if(p===1)return `<g>${shadow}<ellipse cx="194" cy="239" rx="14" ry="15" fill="#f2b56b" stroke="#6b5141" stroke-width="2"/><path d="M181 230 L184 215 L191 226 M207 230 L204 215 L197 226" fill="#f2b56b" stroke="#6b5141" stroke-width="2" stroke-linejoin="round"/><circle cx="189" cy="234" r="2" fill="#354b47"/><circle cx="199" cy="234" r="2" fill="#354b47"/><path d="M192 240 Q194 242 196 240" fill="none" stroke="#8b4f43" stroke-width="1.7" stroke-linecap="round"/><path d="M181 245 Q173 240 176 231" fill="none" stroke="#6b5141" stroke-width="3" stroke-linecap="round"/></g>`;
    if(p===2)return `<g>${shadow}<ellipse cx="194" cy="243" rx="18" ry="10" fill="#fff" stroke="#6b5141" stroke-width="2"/><rect x="178" y="235" width="32" height="10" rx="5" fill="#ef6b63"/><rect x="190" y="234" width="8" height="12" rx="2" fill="#2f5c4d"/></g>`;
    if(p===3)return `<g>${shadow}<path d="M176 246 Q176 224 194 222 Q212 224 212 246 Q207 252 194 252 Q181 252 176 246Z" fill="#7fd68a" stroke="#4d7454" stroke-width="2"/><circle cx="188" cy="238" r="2" fill="#354b47"/><circle cx="200" cy="238" r="2" fill="#354b47"/><path d="M190 244 Q194 247 198 244" fill="none" stroke="#4d7454" stroke-width="1.7"/></g>`;
    return `<g>${shadow}<path d="M179 248 Q176 233 184 224 Q193 216 203 224 Q213 233 207 249 Q197 253 179 248Z" fill="#78b86b" stroke="#456a42" stroke-width="2"/><path d="M184 225 L178 215 L190 222 M202 225 L208 216 L207 230" fill="#78b86b" stroke="#456a42" stroke-width="2" stroke-linejoin="round"/><circle cx="188" cy="236" r="2" fill="#354b47"/><circle cx="199" cy="236" r="2" fill="#354b47"/><path d="M191 243 Q195 246 199 242" fill="none" stroke="#456a42" stroke-width="1.7"/></g>`;
  }

  function extras(a){
    const p=Math.max(0,Math.min(PETS.length-1,Number(a.pet)||0));
    const u=Math.max(0,Math.min(AURAS.length-1,Number(a.aura)||0));
    let s='';
    if(u===1)s+='<g font-size="18"><text x="39" y="62">✦</text><text x="184" y="90">✨</text><text x="45" y="177">✧</text><text x="177" y="205">✦</text></g>';
    if(u===2)s+='<g font-size="23"><text x="38" y="178">🔥</text><text x="178" y="178">🔥</text><text x="57" y="229">🔥</text><text x="159" y="229">🔥</text></g>';
    if(u===3)s+='<g font-size="21"><text x="43" y="102">⚡</text><text x="180" y="128">⚡</text><text x="50" y="218">⚡</text></g>';
    if(u===4)s+='<g font-size="18"><text x="43" y="72">🌸</text><text x="181" y="112">🌸</text><text x="50" y="201">🌸</text></g>';
    s+=petMarkup(p);
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
