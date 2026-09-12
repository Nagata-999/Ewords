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
      return `<g opacity=".7" fill="none" stroke-linecap="round"><path d="M89 81Q97 77 105 81M135 81Q143 77 151 81" stroke="#59453d" stroke-width="2"/><path d="M84 103L91 105M149 105L156 103" stroke="#d8847c" stroke-width="2" opacity=".65"/></g>`;
    }
    return `<g fill="none" stroke="#493b35" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path d="M89 81Q97 78 105 80M135 80Q143 78 151 81"/></g>`;
  }

  function hairPolish(a) {
    if (a.gender === 'female') {
      return `<g fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" opacity=".16"><path d="M89 43Q110 31 139 40"/><path d="M82 56Q96 48 108 46"/></g>`;
    }
    return `<g fill="none" stroke="#ffffff" stroke-width="2.1" stroke-linecap="round" opacity=".13"><path d="M88 45Q111 32 140 40"/><path d="M102 39Q116 34 128 35"/></g>`;
  }

  function limbPolish(a, bottom) {
    const skin = ['#f4cfae','#dba77f','#ac7657'][a.skin] || '#f4cfae';
    const female = a.gender === 'female';

    // Deliberately protrude well below the sleeves so hands stay obvious even in tiny previews.
    const hands = female ? `
      <g fill="${skin}" stroke="#8d6550" stroke-width="1.6" stroke-linejoin="round">
        <path d="M59 184Q64 181 69 185L75 191L73 201Q68 206 63 202L57 195Q54 189 59 184Z"/>
        <path d="M181 184Q176 181 171 185L165 191L167 201Q172 206 177 202L183 195Q186 189 181 184Z"/>
        <circle cx="66" cy="202" r="3.5"/><circle cx="174" cy="202" r="3.5"/>
      </g>` : `
      <g fill="${skin}" stroke="#8d6550" stroke-width="1.7" stroke-linejoin="round">
        <path d="M49 184Q55 180 62 185L70 192L68 203Q63 208 57 203L49 196Q45 190 49 184Z"/>
        <path d="M191 184Q185 180 178 185L170 192L172 203Q177 208 183 203L191 196Q195 190 191 184Z"/>
        <circle cx="60" cy="204" r="4"/><circle cx="180" cy="204" r="4"/>
      </g>`;

    let lower = '';
    if (bottom?.kind === 'schoolSkirt') {
      lower = `
        <path d="M96 241H111L110 263Q103 268 96 263Z" fill="${skin}" stroke="#8d6550" stroke-width="1"/>
        <path d="M130 241H145L147 263Q140 268 133 263Z" fill="${skin}" stroke="#8d6550" stroke-width="1"/>
        <path d="M95 251H111L110 269H95Z" fill="#1d2943"/>
        <path d="M131 251H146L148 269H132Z" fill="#1d2943"/>
        <path d="M88 266Q102 261 115 266L114 276Q102 281 88 275Z" fill="#171c23" stroke="#0f1218" stroke-width="1.4"/>
        <path d="M126 266Q140 261 153 266L154 275Q140 281 127 276Z" fill="#171c23" stroke="#0f1218" stroke-width="1.4"/>`;
    } else {
      lower = `
        <path d="M93 252H114L112 266H94Z" fill="${skin}" opacity=".95"/>
        <path d="M127 252H148L147 266H129Z" fill="${skin}" opacity=".95"/>
        <path d="M87 263Q102 258 116 264L115 276Q102 282 87 275Z" fill="#171c23" stroke="#0f1218" stroke-width="1.4"/>
        <path d="M125 264Q140 258 154 263L155 275Q140 282 126 276Z" fill="#171c23" stroke="#0f1218" stroke-width="1.4"/>`;
    }
    return hands + lower;
  }

  function uniformPolish(a, top, bottom) {
    let out = '';
    if (top?.kind === 'schoolBlazerM') out += `<g stroke-linejoin="round"><path d="M93 136L108 157L120 146L132 157L147 136L140 177L120 164L100 177Z" fill="#f8f7f2" stroke="#101e34" stroke-width="2"/><path d="M97 137L111 160L101 177M143 137L129 160L139 177" fill="none" stroke="#0b1b31" stroke-width="3"/><path d="M117 151L112 181L120 194L128 181L123 151Z" fill="#8f1f34" stroke="#6f1728" stroke-width="1.5"/><circle cx="121" cy="181" r="2.3" fill="#d8b96a"/><circle cx="121" cy="196" r="2.3" fill="#d8b96a"/></g>`;
    if (top?.kind === 'schoolBlazerF') out += `<g stroke-linejoin="round"><path d="M94 136L108 155L120 145L132 155L146 136L140 174L120 163L100 174Z" fill="#fbfaf5" stroke="#101e34" stroke-width="2"/><path d="M98 137L111 158L102 173M142 137L129 158L138 173" fill="none" stroke="#0b1b31" stroke-width="3"/><path d="M104 157L93 164L107 171L120 165L133 171L147 164L136 157L120 164Z" fill="#9c2940"/><circle cx="120" cy="184" r="2.3" fill="#d8b96a"/><circle cx="120" cy="199" r="2.3" fill="#d8b96a"/></g>`;
    if (bottom?.kind === 'schoolSkirt') out += `<g fill="none" opacity=".85"><path d="M80 214H160M78 228H162M82 240H158" stroke="#a6abb4" stroke-width="1.6"/><path d="M90 207L85 245M105 205L102 249M120 205V251M135 205L139 249M150 207L156 245" stroke="#737985" stroke-width="1.5"/></g>`;
    return out;
  }

  avatarSVG = function polishedAvatarSVG(value=DEFAULT_AVATAR, previewId) {
    const a = effectiveAvatar(value, previewId);
    const top = effectiveItem(a.top, 'top', a.gender, 'starter');
    const bottom = effectiveItem(a.bottom, 'bottom', a.gender, 'basic-bottom');
    let svg = renderBase(value, previewId);
    svg = bodyShape(svg, a.gender);
    // Give feet extra room and force the new render layer to be visible.
    svg = svg.replace('viewBox="0 0 240 280"', 'viewBox="0 0 240 292"');
    svg = svg.replace('<svg ', `<svg data-avatar-gender="${a.gender}" `);
    const polish = uniformPolish(a, top, bottom) + limbPolish(a, bottom) + facePolish(a) + hairPolish(a);
    return insertBeforeClose(svg, polish);
  };
})();
