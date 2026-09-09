'use strict';
const ITEMS=[
 {id:'starter',name:'すし単Tシャツ',rarity:'STARTER',color:'#f6f1e4',kind:'tee',accent:'#f4511e'},
 {id:'salmon',name:'サーモンTシャツ',rarity:'N',color:'#f48c79',kind:'tee',accent:'#fff2d6'},
 {id:'tea',name:'お茶のスウェット',rarity:'N',color:'#8baf8d',kind:'sweater',accent:'#d7e7bf'},
 {id:'sky',name:'青空ボーダー',rarity:'N',color:'#91bbcb',kind:'stripe',accent:'#edf7ef'},
 {id:'lemon',name:'レモンパーカー',rarity:'N',color:'#eacb64',kind:'hoodie',accent:'#fff0ac'},
 {id:'berry',name:'ベリーニット',rarity:'N',color:'#b795b7',kind:'sweater',accent:'#ecd8e9'},
 {id:'navy',name:'ネイビーポロ',rarity:'N',color:'#3f657b',kind:'polo',accent:'#f4ead0'},
 {id:'sailor',name:'海風セーラー',rarity:'R',color:'#f5f0df',kind:'sailor',accent:'#32667d'},
 {id:'explorer',name:'世界史の探検家',rarity:'R',color:'#b99c70',kind:'explorer',accent:'#706044'},
 {id:'chef',name:'見習いすし職人',rarity:'R',color:'#f7f4e9',kind:'chef',accent:'#2c5860'},
 {id:'varsity',name:'放課後スタジャン',rarity:'R',color:'#587f6b',kind:'varsity',accent:'#efe0b6'},
 {id:'royal',name:'黄金のすしマント',rarity:'SR',color:'#eee0a4',kind:'royal',accent:'#b4524b'},
 {id:'cosmic',name:'星めぐりのローブ',rarity:'SR',color:'#56628e',kind:'cosmic',accent:'#dfc685'}
];
ITEMS.forEach(i=>i.slot='outfit');
ITEMS.push(
 {id:'hat-cap',name:'おでかけキャップ',rarity:'N',slot:'hat',kind:'cap'},
 {id:'hat-beanie',name:'あったかニット帽',rarity:'N',slot:'hat',kind:'beanie'},
 {id:'hat-chef',name:'すし職人の帽子',rarity:'R',slot:'hat',kind:'chef'},
 {id:'hat-explorer',name:'探検家のハット',rarity:'R',slot:'hat',kind:'explorer'},
 {id:'hat-crown',name:'黄金の王冠',rarity:'SR',slot:'hat',kind:'royal'},
 {id:'hat-wizard',name:'星空のとんがり帽',rarity:'SR',slot:'hat',kind:'wizard'},
 {id:'acc-glasses',name:'まるめがね',rarity:'N',slot:'accessory',kind:'glasses'},
 {id:'acc-scarf',name:'サーモンマフラー',rarity:'N',slot:'accessory',kind:'scarf'},
 {id:'acc-headphones',name:'音楽ヘッドホン',rarity:'R',slot:'accessory',kind:'headphones'},
 {id:'acc-bag',name:'おでかけポシェット',rarity:'R',slot:'accessory',kind:'bag'},
 {id:'acc-star',name:'きらめく星のペンダント',rarity:'SR',slot:'accessory',kind:'star'},
 {id:'acc-wings',name:'夢みる天使の羽',rarity:'SR',slot:'accessory',kind:'wings'}
);
const HAIR_NAMES=['ショート','ボブ','おだんご','センターパート','ベリーショート','ふんわりカール','ロング','ポニーテール','ツインテール','サイド三つ編み'];
const DEFAULT_AVATAR={gender:'male',hair:0,eyes:0,mouth:0,skin:0,hairColor:0,outfit:'starter',hat:null,accessory:null};
function avatarSVG(a=DEFAULT_AVATAR,previewId){a={...DEFAULT_AVATAR,...a};const preview=ITEMS.find(x=>x.id===previewId);if(preview)a[preview.slot]=preview.id;const item=ITEMS.find(x=>x.id===a.outfit&&x.slot==='outfit')||ITEMS[0];const skin=['#f4cfae','#dba77f','#ac7657'][a.skin]||'#f4cfae',hair=['#493b32','#9b6241','#454e66'][a.hairColor]||'#493b32';const c=item.color,k=item.kind,ac=item.accent;
 const hairBack=[
 '',
 '<path d="M68 71Q65 26 120 29Q176 26 173 78L183 137Q167 149 151 136H83Q64 149 58 132Z"/>',
 '<circle cx="75" cy="47" r="22"/><circle cx="160" cy="48" r="22"/>',
 '', '',
 '<circle cx="74" cy="53" r="19"/><circle cx="89" cy="33" r="20"/><circle cx="115" cy="25" r="20"/><circle cx="143" cy="29" r="22"/><circle cx="166" cy="47" r="20"/><circle cx="172" cy="69" r="16"/>',
 '<path d="M67 74Q62 23 119 25Q177 23 175 81L185 172Q157 184 151 164L87 168Q68 185 53 169Z"/>',
 '<path d="M156 43Q205 27 194 84L184 151Q167 160 166 145Q181 90 160 73Z"/><circle cx="166" cy="51" r="14"/>',
 '<path d="M75 62Q34 47 43 99L50 153Q63 166 76 146L77 80M166 62Q204 47 198 99L190 153Q174 166 165 146L163 80Z"/>',
 '<path d="M66 75Q63 27 121 26Q175 25 175 78L175 129L152 145L146 113H75Z"/><ellipse cx="166" cy="138" rx="13" ry="14"/><ellipse cx="166" cy="157" rx="12" ry="13"/><ellipse cx="164" cy="175" rx="10" ry="12"/><path d="M157 182L167 182L170 198L151 196Z"/>'
 ][a.hair]||'';
 const backHair='<g fill="'+hair+'">'+hairBack+'</g>';
 const accessory=ITEMS.find(x=>x.id===a.accessory&&x.slot==='accessory')?.kind;
 const wings=accessory==='wings'?'<path d="M91 153Q45 106 31 123Q24 139 43 147Q20 142 25 158Q28 168 49 172Q35 180 47 189Q60 197 89 179M151 153Q194 106 210 123Q217 139 198 147Q221 142 216 158Q213 168 192 172Q206 180 194 189Q181 197 152 179" fill="#f7f3dc" stroke="#c4ba83" stroke-width="3"/>':'';
 const cape=['royal','cosmic'].includes(k)?`<path d="M82 132Q54 165 54 223Q120 240 189 223L161 132Z" fill="${ac}" stroke="#273c3d" stroke-width="3"/><path d="M89 139L69 219M155 139L175 219" stroke="${c}" stroke-width="5"/>`:'';
 const body=`<path d="M88 132L65 147L54 179L73 188L87 166L84 216Q120 223 156 216L153 166L167 188L186 179L175 147L152 132Z" fill="${c}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`;
 let detail='';if(k==='tee')detail=`<rect x="108" y="164" width="24" height="14" rx="7" fill="white"/><path d="M106 165Q120 152 135 165L132 169H108Z" fill="${ac}"/><path d="M116 160L121 164M123 158L128 164" stroke="#fff6df" stroke-width="2"/>`;
 if(k==='stripe')detail=`<path d="M87 161H153M87 180H153M86 199H155" stroke="${ac}" stroke-width="8"/>`;
 if(k==='hoodie')detail=`<path d="M91 133Q120 158 151 133L145 153L120 162L95 153Z" fill="${ac}"/><path d="M110 151V174M130 151V174M102 186H138L143 202H98Z" fill="none" stroke="#786b3f" stroke-width="2"/>`;
 if(k==='sweater')detail=`<path d="M93 138Q120 154 148 138M87 209H155" stroke="${ac}" stroke-width="5"/><path d="M110 167l10 10 10-10-10-10Z" fill="${ac}"/>`;
 if(k==='polo')detail=`<path d="M96 135L111 157L120 144L131 157L146 135" fill="${ac}"/><path d="M120 147V177" stroke="${ac}" stroke-width="3"/>`;
 if(k==='sailor')detail=`<path d="M89 135L120 173L152 135L144 158L120 181L96 158Z" fill="${ac}"/><path d="M118 170L104 187L118 183L125 199L129 172Z" fill="#d77161"/>`;
 if(k==='explorer')detail=`<path d="M98 136L108 151L98 163M143 136L132 151L143 163M120 151V217" fill="none" stroke="${ac}" stroke-width="3"/><rect x="93" y="173" width="19" height="23" rx="3" fill="${ac}"/><rect x="130" y="173" width="19" height="23" rx="3" fill="${ac}"/><path d="M84 205H156" stroke="#4d4638" stroke-width="7"/><rect x="116" y="201" width="10" height="8" fill="#dbc784"/>`;
 if(k==='chef')detail=`<path d="M98 137L144 157V216" fill="none" stroke="${ac}" stroke-width="2"/><g fill="${ac}"><circle cx="109" cy="168" r="3"/><circle cx="134" cy="168" r="3"/><circle cx="109" cy="190" r="3"/><circle cx="134" cy="190" r="3"/></g><path d="M84 208H156" stroke="${ac}" stroke-width="6"/>`;
 if(k==='varsity')detail=`<path d="M83 139L65 150L56 178L72 185L86 160M156 140L175 150L184 178L168 185L154 160" fill="${ac}"/><path d="M120 143V219" stroke="${ac}" stroke-width="4"/><text x="131" y="176" font-family="sans-serif" font-size="20" font-weight="900" fill="${ac}">S</text>`;
 if(k==='royal')detail=`<path d="M87 134Q120 157 154 134L145 154L120 166L96 154Z" fill="white"/><path d="M120 166V215" stroke="#c5a452" stroke-width="4"/><circle cx="120" cy="166" r="7" fill="#b54d49" stroke="#d6b05d" stroke-width="3"/>`;
 if(k==='cosmic')detail=`<path d="M91 135L120 172L150 135M120 172V215" fill="none" stroke="${ac}" stroke-width="5"/><g fill="${ac}"><path d="M98 169l3 7 7 2-7 3-3 7-3-7-7-3 7-2Z"/><path d="M141 188l3 7 7 2-7 3-3 7-3-7-7-3 7-2Z"/></g>`;
 const eyes=[`<ellipse cx="97" cy="90" rx="5" ry="7"/><ellipse cx="143" cy="90" rx="5" ry="7"/><g fill="white"><circle cx="98" cy="88" r="1.7"/><circle cx="144" cy="88" r="1.7"/></g>`,`<path d="M89 93Q97 80 105 93M135 93Q143 80 151 93" fill="none" stroke="#39392e" stroke-width="4" stroke-linecap="round"/>`,`<path d="M89 85L105 89M135 89L151 85" stroke="#39392e" stroke-width="3" stroke-linecap="round"/><ellipse cx="99" cy="92" rx="4" ry="5"/><ellipse cx="141" cy="92" rx="4" ry="5"/>`][a.eyes]||'';
 const mouth=[`<path d="M112 109Q120 117 129 109" fill="none" stroke="#9a5a45" stroke-width="3" stroke-linecap="round"/>`,`<path d="M110 107H130Q130 123 120 123Q110 123 110 107Z" fill="#9a5a45"/><path d="M112 108H128V112H112Z" fill="white"/>`,`<path d="M114 111H127" stroke="#9a5a45" stroke-width="3" stroke-linecap="round"/>`][a.mouth]||'';
 const frontHair=[`<path d="M70 84Q58 32 105 30Q170 20 173 83L158 66L148 73L142 56Q113 80 94 63L80 82Z" fill="${hair}"/>`,`<path d="M68 78Q63 24 120 27Q178 28 173 81L155 58Q129 76 89 61L78 88Z" fill="${hair}"/>`,`<path d="M70 78Q65 30 121 28Q173 29 173 81L151 71L148 57L133 76L118 57L99 75L89 58L79 84Z" fill="${hair}"/>`,
`<g fill="${hair}"><path d="M70 82Q59 31 112 28L120 38Q87 47 82 83ZM120 38L129 28Q183 28 173 83L157 69Q141 44 120 38Z"/></g>`,
`<g fill="${hair}"><path d="M70 75Q65 31 120 29Q173 31 172 75L157 58Q119 45 84 60Z"/></g>`,
`<g fill="${hair}"><circle cx="83" cy="56" r="18"/><circle cx="103" cy="49" r="19"/><circle cx="128" cy="47" r="20"/><circle cx="153" cy="55" r="19"/></g>`,
`<g fill="${hair}"><path d="M68 82Q60 26 120 26Q179 27 173 87L155 64L151 51Q125 80 87 67L79 88Z"/></g>`,
`<g fill="${hair}"><path d="M69 83Q61 28 120 29Q174 24 173 82L153 63Q125 55 96 70L82 82Z"/></g>`,
`<g fill="${hair}"><path d="M69 83Q63 26 120 27Q177 27 173 83L156 64L144 73L120 57L98 73L86 63Z"/></g>`,
`<g fill="${hair}"><path d="M68 83Q63 27 120 27Q179 28 172 86L151 55Q124 84 86 70L78 90Z"/></g>`][a.hair]||'';

 const hatKind=ITEMS.find(x=>x.id===a.hat&&x.slot==='hat')?.kind;
 const hat=hatKind==='chef'?`<path d="M88 44V24Q71 10 88 2Q98-6 109 4Q120-12 133 2Q149-3 156 8Q169 23 153 29V44Z" fill="#fffdf5" stroke="#354b47" stroke-width="3"/><path d="M89 33H153" stroke="#ded7c7" stroke-width="3"/>`:hatKind==='royal'?`<path d="M89 39L82 10L106 25L120 4L135 25L158 10L150 39Z" fill="#e4bd58" stroke="#a27b36" stroke-width="3"/><circle cx="120" cy="28" r="5" fill="#c25956"/>`:hatKind==='explorer'?`<path d="M77 46L87 17Q120 3 150 18L162 46Z" fill="${c}" stroke="#354b47" stroke-width="3"/><path d="M73 44Q122 35 169 45L176 52Q119 63 64 52Z" fill="${c}" stroke="#354b47" stroke-width="3"/>`:'';
 const extraHat=hatKind==='cap'?'<path d="M69 64Q65 17 120 21Q169 20 173 63Z" fill="#6c9c8d" stroke="#354b47" stroke-width="3"/><path d="M94 61Q152 48 186 65L180 77Q143 70 96 72Z" fill="#4e7b6d" stroke="#354b47" stroke-width="3"/><text x="109" y="49" font-size="23" fill="#faf0d2" font-weight="900">S</text>':hatKind==='beanie'?'<path d="M66 68Q65 15 120 17Q174 15 174 68Z" fill="#c899ae" stroke="#795c71" stroke-width="3"/><path d="M77 56Q78 27 101 23M97 57L105 22M120 57V20M143 56L135 22M162 57Q160 29 143 25" stroke="#ac7c96" stroke-width="3" fill="none"/><rect x="64" y="56" width="112" height="18" rx="7" fill="#dfb9c8" stroke="#795c71" stroke-width="3"/>':hatKind==='wizard'?'<path d="M80 46L117-9L147 5L137 9L163 46Z" fill="#59638f" stroke="#3e4568" stroke-width="3"/><ellipse cx="120" cy="47" rx="62" ry="12" fill="#69759f" stroke="#3e4568" stroke-width="3"/><path d="M115 10L118 19L127 21L118 24L115 33L112 24L103 21L112 19Z" fill="#edd89a"/>':'';
 const accessoryFront=accessory==='glasses'?'<g fill="none" stroke="#735c43" stroke-width="3"><circle cx="97" cy="93" r="15"/><circle cx="143" cy="93" r="15"/><path d="M112 91Q120 87 128 91M82 90L72 87M158 90L169 87"/></g>':accessory==='scarf'?'<path d="M94 127Q120 140 148 127L152 142Q120 158 90 141Z" fill="#db806d" stroke="#b35f50" stroke-width="2"/><path d="M131 144L146 145L154 189L137 188Z" fill="#db806d" stroke="#b35f50" stroke-width="2"/><path d="M137 179L151 179" stroke="#efb09a" stroke-width="5"/>':accessory==='headphones'?'<path d="M63 88V70Q61 17 120 17Q180 17 178 71V88" fill="none" stroke="#546b79" stroke-width="9"/><rect x="57" y="78" width="19" height="32" rx="9" fill="#e5ba6e" stroke="#546b79" stroke-width="3"/><rect x="165" y="78" width="19" height="32" rx="9" fill="#e5ba6e" stroke="#546b79" stroke-width="3"/>':accessory==='bag'?'<path d="M92 144L154 204" stroke="#966d4f" stroke-width="6"/><rect x="136" y="188" width="37" height="31" rx="8" fill="#d7a77d" stroke="#966d4f" stroke-width="3"/><path d="M138 197H171" stroke="#966d4f" stroke-width="2"/><circle cx="155" cy="201" r="3" fill="#f9e4ac"/>':accessory==='star'?'<path d="M99 141L120 177L142 141" fill="none" stroke="#c8a352" stroke-width="3"/><path d="M120 166L125 177L137 179L128 187L130 199L120 193L109 199L111 187L102 179L115 177Z" fill="#e8c865" stroke="#b69545" stroke-width="2"/>':'';
 const lashes=a.gender==='female'?'<path d="M89 86L86 83M151 86L154 83" stroke="#39392e" stroke-width="2" stroke-linecap="round"/>':'';
 return `<svg viewBox="0 -15 240 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="着せ替えアバター"><ellipse cx="120" cy="246" rx="61" ry="8" fill="#314a4215"/>${backHair}${wings}${cape}<path d="M91 205L88 239H111L119 214L130 240H153L148 205" fill="#50656a" stroke="#354b47" stroke-width="3"/><path d="M87 234H110V247H79Q74 236 87 234M132 234H153Q166 237 162 247H132Z" fill="#f5efdf" stroke="#354b47" stroke-width="3"/><ellipse cx="63" cy="183" rx="12" ry="13" fill="${skin}"/><ellipse cx="177" cy="183" rx="12" ry="13" fill="${skin}"/><g transform="${a.gender==='female'?'translate(6 0) scale(.95 1)':''}">${body}${detail}</g><path d="M105 122V138Q120 151 135 138V122" fill="${skin}"/><circle cx="70" cy="91" r="12" fill="${skin}"/><circle cx="170" cy="91" r="12" fill="${skin}"/><rect x="70" y="42" width="101" height="89" rx="44" fill="${skin}"/>${frontHair}<g fill="#39392e">${eyes}</g><ellipse cx="87" cy="106" rx="8" ry="4" fill="#e8a095" opacity=".6"/><ellipse cx="154" cy="106" rx="8" ry="4" fill="#e8a095" opacity=".6"/>${mouth}${lashes}${hat}${extraHat}${accessoryFront}</svg>`;
}
if(typeof module!=='undefined')module.exports={ITEMS,DEFAULT_AVATAR,HAIR_NAMES,avatarSVG};
