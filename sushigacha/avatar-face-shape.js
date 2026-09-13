'use strict';
(() => {
  if (typeof avatarSVG !== 'function') return;
  if (typeof DEFAULT_AVATAR === 'object' && DEFAULT_AVATAR && DEFAULT_AVATAR.faceShape == null) DEFAULT_AVATAR.faceShape = 0;

  const FACE_SHAPE_NAMES=['標準','丸顔','卵型','シャープ','面長'];
  const baseRender=avatarSVG;
  const faceRe=/<ellipse cx="120" cy="90" rx="48" ry="47" fill="([^"]+)" stroke="#354b47" stroke-width="3"\/>/;

  function shapeMarkup(shape, skin){
    const common=`fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"`;
    switch(shape){
      case 1: // round: forehead/temples/cheeks all wider, chin tucked up
        return `<path d="M120 42 C91 42 69 59 69 87 C69 111 85 132 107 138 C115 140 125 140 133 138 C155 132 171 111 171 87 C171 59 149 42 120 42 Z" ${common}/>`;
      case 2: // egg: narrower temples, fuller middle, gently pointed lower face
        return `<path d="M120 40 C96 40 78 53 74 75 C70 96 78 118 94 132 C103 140 112 145 120 148 C128 145 137 140 146 132 C162 118 170 96 166 75 C162 53 144 40 120 40 Z" ${common}/>`;
      case 3: // sharp: slimmer temples, defined cheekbones and V-line jaw
        return `<path d="M120 41 C99 41 82 52 76 71 C70 89 76 106 88 119 C96 128 106 135 120 146 C134 135 144 128 152 119 C164 106 170 89 164 71 C158 52 141 41 120 41 Z" ${common}/>`;
      case 4: // long: taller/narrower from forehead through jaw, not just chin extension
        return `<path d="M120 36 C98 36 81 49 76 71 C71 94 76 117 90 134 C99 145 109 151 120 154 C131 151 141 145 150 134 C164 117 169 94 164 71 C159 49 142 36 120 36 Z" ${common}/>`;
      default:
        return `<ellipse cx="120" cy="90" rx="48" ry="47" fill="${skin}" stroke="#354b47" stroke-width="3"/>`;
    }
  }

  avatarSVG=function faceShapeAvatarSVG(value=DEFAULT_AVATAR, previewId){
    const a={...DEFAULT_AVATAR,...value};
    let shape=Number.isInteger(a.faceShape)?a.faceShape:0;
    if(shape<0||shape>=FACE_SHAPE_NAMES.length) shape=0;
    const svg=baseRender(value,previewId);
    return svg.replace(faceRe,(_m,skin)=>shapeMarkup(shape,skin));
  };

  window.SushiAvatarFaceShape={names:FACE_SHAPE_NAMES};
})();
