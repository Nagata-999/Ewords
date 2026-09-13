'use strict';
(() => {
  if (typeof avatarSVG !== 'function') return;
  if (typeof DEFAULT_AVATAR === 'object' && DEFAULT_AVATAR && DEFAULT_AVATAR.faceShape == null) DEFAULT_AVATAR.faceShape = 0;

  const FACE_SHAPE_NAMES=['標準','丸顔','卵型','シャープ','面長'];
  const baseRender=avatarSVG;
  const faceRe=/<ellipse cx="120" cy="90" rx="48" ry="47" fill="([^"]+)" stroke="#354b47" stroke-width="3"\/>/;

  function shapeMarkup(shape, skin){
    switch(shape){
      case 1: // round
        return `<circle cx="120" cy="90" r="48" fill="${skin}" stroke="#354b47" stroke-width="3"/>`;
      case 2: // oval / egg
        return `<path d="M120 42C91 42 72 59 72 87C72 115 90 136 120 142C150 136 168 115 168 87C168 59 149 42 120 42Z" fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`;
      case 3: // sharp
        return `<path d="M120 43C91 43 73 59 72 87C72 111 86 128 101 136L120 145L139 136C154 128 168 111 168 87C167 59 149 43 120 43Z" fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`;
      case 4: // long
        return `<path d="M120 39C93 39 76 56 75 86C74 116 91 139 120 148C149 139 166 116 165 86C164 56 147 39 120 39Z" fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`;
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
