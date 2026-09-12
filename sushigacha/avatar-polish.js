'use strict';

// Visual polish layer for the existing avatar renderer.
// Loaded after avatar.js and before gacha.js so every preview uses the refined design.
(() => {
  const renderBase = avatarSVG;

  function effectiveAvatar(value, previewId) {
    const a = {...DEFAULT_AVATAR, ...value};
    if (a.outfit && !value?.top) a.top = a.outfit;
    const preview = ITEMS.find(x => x.id === previewId);
    if (preview) a[preview.slot] = preview.id;
    if (!['male','female'].includes(a.gender)) a.gender = 'male';
    return a;
  }

  function effectiveItem(id, slot, gender, fallback) {
    const item = ITEMS.find(x => x.id === id && x.slot === slot);
    if (!item || (item.gender && item.gender !== gender)) {
      return ITEMS.find(x => x.id === fallback && x.slot === slot);
    }
    return item;
  }

  function insertBeforeClose(svg, extra) {
    return svg.replace('</svg>', extra + '</svg>');
  }

  function bodyShape(svg, gender) {
    const old = /<path d="M88 132L66 146L54 180L73 188L88 165L84 216Q120 223 156 216L152 165L167 188L186 180L174 146L152 132Z" fill="([^"]+)" stroke="#354b47" stroke-width="3" stroke-linejoin="round"\/>/;
    if (gender === 'female') {
      return svg.replace(old, (_m, fill) => `<path d="M92 132L70 147L58 180L76 188L91 165L89 203Q91 215 101 219Q120 224 139 219Q149 215 151 203L149 165L165 188L183 180L171 147L149 132Q136 140 120 140Q104 140 92 132Z" fill="${fill}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`);
    }
    return svg.replace(old, (_m, fill) => `<path d="M84 132L61 146L50 180L70 189L86 164L82 216Q120 224 158 216L154 164L170 189L190 180L179 146L156 132Q139 137 120 137Q101 137 84 132Z" fill="${fill}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`);
  }

  function facePolish(a) {
    if (a.gender === 'female') {
      return `
        <g opacity=".7" fill="none" stroke-linecap="round">
          <path d="M89 81Q97 77 105 81M135 81Q143 77 151 81" stroke="#59453d" stroke-width="2"/>
          <path d="M84 103L91 105M149 105L156 103" stroke="#d8847c" stroke-width="2" opacity=".65"/>
        </g>`;
    }
    return `
      <g fill="none" stroke="#493b35" stroke-width="2.2" stroke-linecap="round" opacity=".8">
        <path d="M89 81Q97 78 105 80M135 80Q143 78 151 81"/>
      </g>`;
  }

  function hairPolish(a) {
    if (a.gender === 'female') {
      return `<g fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" opacity=".16">
        <path d="M89 43Q110 31 139 40"/><path d="M82 56Q96 48 108 46"/>
      </g>`;
    }
    return `<g fill="none" stroke="#ffffff" stroke-width="2.1" stroke-linecap="round" opacity=".13">
      <path d="M88 45Q111 32 140 40"/><path d="M102 39Q116 34 128 35"/>
    </g>`;
  }

  function limbPolish(a, bottom) {
    const skin = ['#f4cfae','#dba77f','#ac7657'][a.skin] || '#f4cfae';
    const female = a.gender === 'female';
    const hands = female ? `
      <g fill="${skin}" stroke="#8d6550" stroke-width="1.4" stroke-linejoin="round">
        <path d="M58 178Q62 176 67 179L75 187Q77 192 73 196Q69 199 65 195L57 188Q54 183 58 178Z"/>
        <path d="M182 178Q178 176 173 179L165 187Q163 192 167 196Q171 199 175 195L183 188Q186 183 182 178Z"/>
      </g>
      <g fill="none" stroke="#8d6550" stroke-width="1" opacity=".7">
        <path d="M61 184L68 190M179 184L172 190"/>
      </g>` : `
      <g fill="${skin}" stroke="#8d6550" stroke-width="1.5" stroke-linejoin="round">
        <path d="M49 178Q55 175 61 180L70 188Q73 193 69 197Q65 201 60 197L50 189Q46 184 49 178Z"/>
        <path d="M191 178Q185 175 179 180L170 188Q167 193 171 197Q175 201 180 197L190 189Q194 184 191 178Z"/>
      </g>
      <g fill="none" stroke="#8d6550" stroke-width="1.1" opacity=".7">
        <path d="M53 184L62 191M187 184L178 191"/>
      </g>`;

    let lower = '';
    if (bottom?.kind === 'schoolSkirt') {
      lower = `
        <path d="M96 241L111 241L109 260Q103 264 97 260Z" fill="${skin}"/>
        <path d="M130 241L145 241L146 260Q140 264 133 260Z" fill="${skin}"/>
        <path d="M95 246L111 246L109 263Q103 267 96 263Z" fill="#1d2943"/>
        <path d="M130 246L146 246L147 263Q140 267 133 263Z" fill="#1d2943"/>
        <path d="M91 259Q102 256 113 260L112 268Q102 273 90 268Z" fill="#171c23" stroke="#0f1218" stroke-width="1.2"/>
        <path d="M128 260Q139 256 150 259L151 268Q140 273 129 268Z" fill="#171c23" stroke="#0f1218" stroke-width="1.2"/>`;
    } else {
      lower = female ? `
        <path d="M92 249L113 249L111 263H94Z" fill="#f4cfae" opacity=".9"/>
        <path d="M127 249L148 249L147 263H129Z" fill="#f4cfae" opacity=".9"/>
        <path d="M89 259Q102 255 114 260L113 269Q102 273 89 268Z" fill="#20252c" stroke="#11161c" stroke-width="1.2"/>
        <path d="M126 260Q139 255 151 259L152 268Q140 273 127 269Z" fill="#20252c" stroke="#11161c" stroke-width="1.2"/>` : `
        <path d="M89 256Q102 252 115 256L113 268Q102 273 88 268Z" fill="#171c23" stroke="#0f1218" stroke-width="1.3"/>
        <path d="M126 256Q139 252 152 256L153 268Q140 273 127 268Z" fill="#171c23" stroke="#0f1218" stroke-width="1.3"/>`;
    }
    return hands + lower;
  }

  function uniformPolish(a, top, bottom) {
    let out = '';
    if (top?.kind === 'schoolBlazerM') {
      out += `
        <g stroke-linejoin="round">
          <path d="M93 136L108 157L120 146L132 157L147 136L140 177L120 164L100 177Z" fill="#f8f7f2" stroke="#101e34" stroke-width="2"/>
          <path d="M97 137L111 160L101 177M143 137L129 160L139 177" fill="none" stroke="#0b1b31" stroke-width="3"/>
          <path d="M117 151L112 181L120 194L128 181L123 151Z" fill="#8f1f34" stroke="#6f1728" stroke-width="1.5"/>
          <path d="M115 157L124 164M114 168L125 175" stroke="#172d4e" stroke-width="2" opacity=".9"/>
          <circle cx="121" cy="181" r="2.3" fill="#d8b96a"/><circle cx="121" cy="196" r="2.3" fill="#d8b96a"/>
          <path d="M140 159l7 3-2 9-8-2z" fill="#d4af58" stroke="#6e5a2e" stroke-width="1"/>
          <path d="M141 162l3 1-1 4-3-1z" fill="#172d4e"/>
        </g>`;
    }
    if (top?.kind === 'schoolBlazerF') {
      out += `
        <g stroke-linejoin="round">
          <path d="M94 136L108 155L120 145L132 155L146 136L140 174L120 163L100 174Z" fill="#fbfaf5" stroke="#101e34" stroke-width="2"/>
          <path d="M98 137L111 158L102 173M142 137L129 158L138 173" fill="none" stroke="#0b1b31" stroke-width="3"/>
          <path d="M105 155L120 164L135 155L130 171L120 167L110 171Z" fill="#8f1f34" stroke="#6f1728" stroke-width="1.5"/>
          <path d="M104 157L93 164L107 171L120 165L133 171L147 164L136 157L120 164Z" fill="#9c2940"/>
          <circle cx="120" cy="184" r="2.3" fill="#d8b96a"/><circle cx="120" cy="199" r="2.3" fill="#d8b96a"/>
          <path d="M139 159l7 3-2 9-8-2z" fill="#d4af58" stroke="#6e5a2e" stroke-width="1"/>
          <path d="M140 162l3 1-1 4-3-1z" fill="#172d4e"/>
          <path d="M96 207Q120 214 144 207" fill="none" stroke="#0e1f38" stroke-width="2" opacity=".75"/>
        </g>`;
    }

    if (bottom?.kind === 'schoolSkirt') {
      out += `
        <g fill="none" opacity=".85">
          <path d="M80 214H160M78 228H162M82 240H158" stroke="#a6abb4" stroke-width="1.6"/>
          <path d="M90 207L85 245M105 205L102 249M120 205V251M135 205L139 249M150 207L156 245" stroke="#737985" stroke-width="1.5"/>
          <path d="M97 206L94 246M128 206L130 249M145 208L150 244" stroke="#d7dbe0" stroke-width="1" opacity=".75"/>
        </g>`;
    }
    if (bottom?.kind === 'schoolSlacks') {
      out += `<path d="M87 207Q120 213 153 207" fill="none" stroke="#232c36" stroke-width="2" opacity=".7"/>`;
    }
    return out;
  }

  avatarSVG = function polishedAvatarSVG(value=DEFAULT_AVATAR, previewId) {
    const a = effectiveAvatar(value, previewId);
    const top = effectiveItem(a.top, 'top', a.gender, 'starter');
    const bottom = effectiveItem(a.bottom, 'bottom', a.gender, 'basic-bottom');
    let svg = renderBase(value, previewId);

    svg = bodyShape(svg, a.gender);
    svg = svg.replace('<svg ', `<svg data-avatar-gender="${a.gender}" `);

    const polish = uniformPolish(a, top, bottom) + limbPolish(a, bottom) + facePolish(a) + hairPolish(a);
    return insertBeforeClose(svg, polish);
  };
})();
