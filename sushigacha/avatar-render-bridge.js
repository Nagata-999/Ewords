'use strict';
(() => {
  if(!window.SushiAvatarV2)return;
  window.avatarSVG=function(value,previewId){const a=SushiAvatarV2.normalize(value),i=SushiAvatarV2.item(previewId);if(i)a[i.slot]=i.id;return SushiAvatarV2.render(a);};
  window.SushiAvatar2D={render(value,o={}){return SushiAvatarV2.render(value,{direction:o.direction,action:o.action||'walk',time:(Number(o.frame)||0)*.135});}};
})();
