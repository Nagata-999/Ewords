'use strict';
(() => {
  if (typeof avatarSVG !== 'function') return;
  if (typeof DEFAULT_AVATAR === 'object' && DEFAULT_AVATAR && DEFAULT_AVATAR.faceShape == null) DEFAULT_AVATAR.faceShape = 0;

  // Keep this deliberately small for now. These three shapes are intentionally
  // exaggerated enough to remain visible underneath the classic hairstyles.
  const FACE_SHAPE_NAMES=['標準','丸顔','シャープ'];
  const baseRender=avatarSVG;
  const faceRe=/<ellipse cx="120" cy="90" rx="48" ry="47" fill="([^"]+)" stroke="#354b47" stroke-width="3"\/>/;

  function shapeMarkup(shape, skin){
    const common=`fill="${skin}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"`;
    switch(shape){
      case 1: // round: broad visible cheeks + short, soft chin
        return `<path d="M120 41 C86 41 64 61 64 88 C64 111 79 128 99 135 C106 138 113 139 120 139 C127 139 134 138 141 135 C161 128 176 111 176 88 C176 61 154 41 120 41 Z" ${common}/>`;
      case 2: // sharp: visible cheekbones + narrow V jaw
        return `<path d="M120 41 C94 41 75 55 70 78 C67 94 73 108 85 118 C94 126 101 130 108 135 L120 149 L132 135 C139 130 146 126 155 118 C167 108 173 94 170 78 C165 55 146 41 120 41 Z" ${common}/>`;
      default:
        return `<ellipse cx="120" cy="90" rx="48" ry="47" fill="${skin}" stroke="#354b47" stroke-width="3"/>`;
    }
  }

  // Small eye-position compensation makes the perceived face width change too,
  // instead of only changing the jaw silhouette.
  function adjustFeatures(svg, shape){
    if(shape===1){
      // round: eyes slightly wider and a touch higher
      return svg
        .replace(/cx="98" cy="91"/g,'cx="96" cy="90"')
        .replace(/cx="142" cy="91"/g,'cx="144" cy="90"');
    }
    if(shape===2){
      // sharp: eyes slightly closer and lower
      return svg
        .replace(/cx="98" cy="91"/g,'cx="100" cy="92"')
        .replace(/cx="142" cy="91"/g,'cx="140" cy="92"');
    }
    return svg;
  }

  avatarSVG=function faceShapeAvatarSVG(value=DEFAULT_AVATAR, previewId){
    const a={...DEFAULT_AVATAR,...value};
    let shape=Number.isInteger(a.faceShape)?a.faceShape:0;
    // Old saved values 3/4 are mapped to sharp rather than breaking avatars.
    if(shape>2) shape=2;
    if(shape<0) shape=0;
    let svg=baseRender(value,previewId);
    svg=svg.replace(faceRe,(_m,skin)=>shapeMarkup(shape,skin));
    return adjustFeatures(svg,shape);
  };

  window.SushiAvatarFaceShape={names:FACE_SHAPE_NAMES};
})();
