'use strict';

const ITEMS=[
  {id:'starter',name:'すし単Tシャツ',rarity:'STARTER',slot:'top',kind:'tee',color:'#f6f1e4',accent:'#f4511e'},
  {id:'salmon',name:'サーモンTシャツ',rarity:'N',slot:'top',kind:'tee',color:'#f48c79',accent:'#fff2d6'},
  {id:'tea',name:'お茶のスウェット',rarity:'N',slot:'top',kind:'sweater',color:'#8baf8d',accent:'#d7e7bf'},
  {id:'sky',name:'青空ボーダー',rarity:'N',slot:'top',kind:'stripe',color:'#91bbcb',accent:'#edf7ef'},
  {id:'lemon',name:'レモンパーカー',rarity:'N',slot:'top',kind:'hoodie',color:'#eacb64',accent:'#fff0ac'},
  {id:'berry',name:'ベリーニット',rarity:'N',slot:'top',kind:'sweater',color:'#b795b7',accent:'#ecd8e9'},
  {id:'navy',name:'ネイビーポロ',rarity:'N',slot:'top',kind:'polo',color:'#3f657b',accent:'#f4ead0'},
  {id:'sailor',name:'海風セーラー',rarity:'R',slot:'top',kind:'sailor',color:'#f5f0df',accent:'#32667d'},
  {id:'explorer',name:'世界史の探検家',rarity:'R',slot:'top',kind:'explorer',color:'#b99c70',accent:'#706044'},
  {id:'chef',name:'見習いすし職人',rarity:'R',slot:'top',kind:'chef',color:'#f7f4e9',accent:'#2c5860'},
  {id:'varsity',name:'放課後スタジャン',rarity:'R',slot:'top',kind:'varsity',color:'#587f6b',accent:'#efe0b6'},
  {id:'royal',name:'黄金のすしマント',rarity:'SR',slot:'top',kind:'royal',color:'#eee0a4',accent:'#b4524b'},
  {id:'cosmic',name:'星めぐりのローブ',rarity:'SR',slot:'top',kind:'cosmic',color:'#56628e',accent:'#dfc685'},
  {id:'school-blazer-m',name:'制服ブレザー（男子）',rarity:'R',slot:'top',kind:'schoolBlazerM',gender:'male',color:'#172d4e',accent:'#9c1f35'},
  {id:'school-blazer-f',name:'制服ブレザー（女子）',rarity:'R',slot:'top',kind:'schoolBlazerF',gender:'female',color:'#172d4e',accent:'#9c1f35'},
  {id:'basic-bottom',name:'ベーシックボトム',rarity:'STARTER',slot:'bottom',kind:'basicBottom',color:'#334155'},
  {id:'school-slacks-m',name:'制服スラックス（男子）',rarity:'R',slot:'bottom',kind:'schoolSlacks',gender:'male',color:'#38414d'},
  {id:'school-skirt-f',name:'制服チェックスカート（女子）',rarity:'R',slot:'bottom',kind:'schoolSkirt',gender:'female',color:'#323845',accent:'#6e7380'},
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
];

const HAIR_NAMES={
  male:['ショート','ナチュラル','マッシュ','センターパート','アップバング','ベリーショート','ウルフ','ゆるパーマ'],
  female:['ボブ','ストレート','セミロング','ロング','ポニーテール','ツインテール','ハーフアップ','お団子']
};
const EYE_NAMES={
  male:['ノーマル','シャープ','やさしい','クール','たれ目','つり目'],
  female:['ノーマル','やさしい','くりっと','つり目','たれ目','大きめ','おっとり']
};
const DEFAULT_AVATAR={gender:'male',hair:0,eyes:0,mouth:0,skin:0,hairColor:0,top:'starter',bottom:'basic-bottom',hat:null,accessory:null};

function safeIndex(n,len){return Number.isInteger(n)&&n>=0&&n<len?n:0;}
function itemBy(id,slot){return ITEMS.find(x=>x.id===id&&(!slot||x.slot===slot));}
function compatible(item,gender){return !item?.gender||item.gender===gender;}

function avatarSVG(value=DEFAULT_AVATAR,previewId){
  const a={...DEFAULT_AVATAR,...value};
  if(a.outfit&&!value.top)a.top=a.outfit;
  const preview=itemBy(previewId);
  if(preview)a[preview.slot]=preview.id;
  if(!['male','female'].includes(a.gender))a.gender='male';
  const hairNames=HAIR_NAMES[a.gender],eyeNames=EYE_NAMES[a.gender];
  a.hair=safeIndex(a.hair,hairNames.length);a.eyes=safeIndex(a.eyes,eyeNames.length);
  let top=itemBy(a.top,'top')||itemBy('starter','top');
  let bottom=itemBy(a.bottom,'bottom')||itemBy('basic-bottom','bottom');
  if(!compatible(top,a.gender))top=itemBy('starter','top');
  if(!compatible(bottom,a.gender))bottom=itemBy('basic-bottom','bottom');
  const skin=['#f4cfae','#dba77f','#ac7657'][a.skin]||'#f4cfae';
  const hair=['#493b32','#9b6241','#323b52'][a.hairColor]||'#493b32';
  const c=top.color||'#f6f1e4',ac=top.accent||'#d8d0bb',k=top.kind;
  const female=a.gender==='female';
  const maleBack=['','','','','','', '<path d="M67 75Q61 25 120 26Q177 25 174 82L180 126Q160 139 150 126H88Q72 138 61 124Z"/>','<path d="M70 70Q63 28 120 27Q174 29 171 74Q185 59 184 89Q180 108 163 113H78Q58 103 59 84Q60 65 70 70Z"/>'];
  const femaleBack=['<path d="M69 72Q63 25 120 27Q177 25 173 78L180 139Q159 151 150 133H87Q68 151 58 133Z"/>','<path d="M66 74Q61 21 120 24Q180 23 176 82L187 174Q159 188 149 164L88 169Q67 187 52 170Z"/>','<path d="M67 72Q61 23 120 25Q177 24 175 80L184 156Q159 169 151 150H85Q65 170 55 153Z"/>','<path d="M66 72Q59 20 120 24Q181 22 176 81L188 184Q158 198 150 171H87Q67 198 50 180Z"/>','<path d="M153 45Q205 28 194 88L184 153Q167 163 164 144Q180 91 159 72Z"/><circle cx="166" cy="50" r="14"/>','<path d="M76 62Q38 49 44 101L51 154Q64 165 76 146M164 62Q202 49 196 101L189 154Q176 165 164 146Z"/>','<path d="M68 74Q62 22 120 25Q180 23 176 82L183 147Q160 162 151 143H87Q66 162 56 144Z"/>','<path d="M68 71Q63 25 120 27Q176 25 174 78L179 127Q159 140 150 126H89Q72 140 61 126Z"/><circle cx="163" cy="47" r="20"/>'];
  const backHair=`<g fill="${hair}">${(female?femaleBack:maleBack)[a.hair]||''}</g>`;
  const legs=female?`<path d="M95 212L112 212L109 255Q102 261 94 255Z" fill="${skin}"/><path d="M130 212L147 212L148 255Q140 261 132 255Z" fill="${skin}"/>`:`<path d="M92 211H116L112 258H94Z" fill="${skin}"/><path d="M125 211H149L147 258H129Z" fill="${skin}"/>`;
  let bottomSvg='';
  if(bottom.kind==='schoolSkirt')bottomSvg=`<path d="M82 204H158L165 242Q120 256 75 242Z" fill="${bottom.color}" stroke="#2b3840" stroke-width="3"/><path d="M87 208L83 243M102 206L99 247M119 206V250M137 206L141 247M153 208L159 243" stroke="${bottom.accent}" stroke-width="3" opacity=".8"/><path d="M76 220H164M78 233H162" stroke="#9da1aa" stroke-width="2" opacity=".7"/>`;
  else{const bc=bottom.color||'#334155';bottomSvg=`<path d="M82 205H158L153 255H128L120 219L112 255H87Z" fill="${bc}" stroke="#2b3840" stroke-width="3"/><path d="M120 219V253" stroke="#202933" stroke-width="2"/>`;}
  const body=`<path d="M88 132L66 146L54 180L73 188L88 165L84 216Q120 223 156 216L152 165L167 188L186 180L174 146L152 132Z" fill="${c}" stroke="#354b47" stroke-width="3" stroke-linejoin="round"/>`;
  let detail='';
  if(k==='tee')detail=`<rect x="108" y="164" width="24" height="14" rx="7" fill="white"/><path d="M106 165Q120 152 135 165L132 169H108Z" fill="${ac}"/>`;
  if(k==='stripe')detail=`<path d="M87 160H153M87 180H153M86 200H155" stroke="${ac}" stroke-width="8"/>`;
  if(k==='hoodie')detail=`<path d="M91 133Q120 158 151 133L145 153L120 162L95 153Z" fill="${ac}"/><path d="M110 151V174M130 151V174" stroke="#786b3f" stroke-width="2"/>`;
  if(k==='sweater')detail=`<path d="M93 138Q120 154 148 138M87 209H155" stroke="${ac}" stroke-width="5"/>`;
  if(k==='polo')detail=`<path d="M96 135L111 157L120 144L131 157L146 135" fill="${ac}"/><path d="M120 147V177" stroke="${ac}" stroke-width="3"/>`;
  if(k==='sailor')detail=`<path d="M89 135L120 173L152 135L144 158L120 181L96 158Z" fill="${ac}"/><path d="M118 170L104 187L118 183L125 199L129 172Z" fill="#d77161"/>`;
  if(k==='explorer')detail=`<path d="M98 136L108 151L98 163M143 136L132 151L143 163M120 151V217" fill="none" stroke="${ac}" stroke-width="3"/><rect x="93" y="173" width="19" height="23" rx="3" fill="${ac}"/><rect x="130" y="173" width="19" height="23" rx="3" fill="${ac}"/>`;
  if(k==='chef')detail=`<path d="M98 137L144 157V216" fill="none" stroke="${ac}" stroke-width="2"/><g fill="${ac}"><circle cx="109" cy="168" r="3"/><circle cx="134" cy="168" r="3"/><circle cx="109" cy="190" r="3"/><circle cx="134" cy="190" r="3"/></g>`;
  if(k==='varsity')detail=`<path d="M83 139L65 150L56 178L72 185L86 160M156 140L175 150L184 178L168 185L154 160" fill="${ac}"/><path d="M120 143V219" stroke="${ac}" stroke-width="4"/><text x="131" y="176" font-family="sans-serif" font-size="20" font-weight="900" fill="${ac}">S</text>`;
  if(k==='royal')detail=`<path d="M87 134Q120 157 154 134L145 154L120 166L96 154Z" fill="white"/><path d="M120 166V215" stroke="#c5a452" stroke-width="4"/><circle cx="120" cy="166" r="7" fill="#b54d49"/>`;
  if(k==='cosmic')detail=`<path d="M91 135L120 172L150 135M120 172V215" fill="none" stroke="${ac}" stroke-width="5"/>`;
  if(k==='schoolBlazerM')detail=`<path d="M96 133L113 154L120 143L128 154L145 133L139 171L120 160L101 171Z" fill="#f7f7f2"/><path d="M119 151L113 182L120 194L127 182L121 151Z" fill="#9b1f35"/><path d="M120 160V216" stroke="#0d1e37" stroke-width="2"/><circle cx="121" cy="183" r="3" fill="#d8b34b"/><circle cx="121" cy="198" r="3" fill="#d8b34b"/>`;
  if(k==='schoolBlazerF')detail=`<path d="M95 133L112 154L120 144L129 154L146 133L140 171L120 160L100 171Z" fill="#f7f7f2"/><path d="M103 157Q120 146 137 157L129 168L120 162L111 168Z" fill="#9b1f35"/><path d="M120 160V216" stroke="#0d1e37" stroke-width="2"/><circle cx="121" cy="184" r="3" fill="#d8b34b"/><circle cx="121" cy="199" r="3" fill="#d8b34b"/>`;
  const cape=['royal','cosmic'].includes(k)?`<path d="M82 132Q54 165 54 223Q120 240 189 223L161 132Z" fill="${ac}" stroke="#273c3d" stroke-width="3"/>`:'';
  const accessory=itemBy(a.accessory,'accessory')?.kind;
  const wings=accessory==='wings'?'<path d="M91 153Q45 106 31 123Q24 139 43 147Q20 142 25 158Q28 168 49 172Q35 180 47 189Q60 197 89 179M151 153Q194 106 210 123Q217 139 198 147Q221 142 216 158Q213 168 192 172Q206 180 194 189Q181 197 152 179" fill="#f7f3dc" stroke="#c4ba83" stroke-width="3"/>':'';
  const maleEyes=['<ellipse cx="97" cy="90" rx="5" ry="7"/><ellipse cx="143" cy="90" rx="5" ry="7"/>','<path d="M89 87L105 91M135 91L151 87" stroke="#39392e" stroke-width="3"/><ellipse cx="99" cy="92" rx="4" ry="5"/><ellipse cx="141" cy="92" rx="4" ry="5"/>','<path d="M89 93Q97 82 105 93M135 93Q143 82 151 93" fill="none" stroke="#39392e" stroke-width="4" stroke-linecap="round"/>','<path d="M89 86L105 88M135 88L151 86" stroke="#39392e" stroke-width="4"/><ellipse cx="99" cy="92" rx="3" ry="5"/><ellipse cx="141" cy="92" rx="3" ry="5"/>','<path d="M89 88Q97 84 105 91M135 91Q143 84 151 88" fill="none" stroke="#39392e" stroke-width="3"/><circle cx="99" cy="93" r="3"/><circle cx="141" cy="93" r="3"/>','<path d="M89 93L105 87M135 87L151 93" stroke="#39392e" stroke-width="3"/><ellipse cx="99" cy="92" rx="4" ry="5"/><ellipse cx="141" cy="92" rx="4" ry="5"/>'];
  const femaleEyes=['<ellipse cx="97" cy="91" rx="6" ry="8"/><ellipse cx="143" cy="91" rx="6" ry="8"/><path d="M90 83L86 80M104 83L108 80M136 83L132 80M150 83L154 80" stroke="#39392e" stroke-width="2"/>','<path d="M88 94Q97 81 106 94M134 94Q143 81 152 94" fill="none" stroke="#39392e" stroke-width="4" stroke-linecap="round"/>','<ellipse cx="97" cy="91" rx="7" ry="9"/><ellipse cx="143" cy="91" rx="7" ry="9"/><circle cx="99" cy="88" r="2" fill="white"/><circle cx="145" cy="88" r="2" fill="white"/>','<path d="M88 92L106 86M134 86L152 92" stroke="#39392e" stroke-width="3"/><ellipse cx="99" cy="92" rx="5" ry="6"/><ellipse cx="141" cy="92" rx="5" ry="6"/>','<path d="M88 87Q97 84 106 93M134 93Q143 84 152 87" fill="none" stroke="#39392e" stroke-width="3"/><circle cx="99" cy="94" r="4"/><circle cx="141" cy="94" r="4"/>','<ellipse cx="97" cy="91" rx="8" ry="10"/><ellipse cx="143" cy="91" rx="8" ry="10"/><circle cx="100" cy="87" r="2.3" fill="white"/><circle cx="146" cy="87" r="2.3" fill="white"/>','<path d="M88 92Q97 85 106 92M134 92Q143 85 152 92" fill="none" stroke="#39392e" stroke-width="3"/><ellipse cx="99" cy="93" rx="4" ry="5"/><ellipse cx="141" cy="93" rx="4" ry="5"/>'];
  const eyes=`<g fill="#39392e">${(female?femaleEyes:maleEyes)[a.eyes]||''}</g>`;
  const mouth=['<path d="M112 109Q120 117 129 109" fill="none" stroke="#9a5a45" stroke-width="3" stroke-linecap="round"/>','<path d="M110 107H130Q130 123 120 123Q110 123 110 107Z" fill="#9a5a45"/><path d="M112 108H128V112H112Z" fill="white"/>','<path d="M114 111H127" stroke="#9a5a45" stroke-width="3" stroke-linecap="round"/>'][safeIndex(a.mouth,3)];
  const maleFront=[`<path d="M70 84Q58 32 105 30Q170 20 173 83L158 66L148 73L142 56Q113 80 94 63L80 82Z" fill="${hair}"/>`,`<path d="M69 81Q61 30 119 27Q177 28 173 82L157 63Q132 75 91 61L79 85Z" fill="${hair}"/>`,`<path d="M68 80Q62 27 120 27Q178 28 173 83L151 67L147 55L132 74L116 56L99 75L89 58L78 84Z" fill="${hair}"/>`,`<g fill="${hair}"><path d="M70 82Q59 31 112 28L120 38Q87 47 82 83Z"/><path d="M120 38L129 28Q183 28 173 83L157 69Q141 44 120 38Z"/></g>`,`<path d="M70 75Q66 31 120 29Q173 31 172 75L157 58Q120 45 84 60Z" fill="${hair}"/>`,`<path d="M72 69Q72 31 120 31Q169 31 169 69Q145 52 121 54Q95 51 72 69Z" fill="${hair}"/>`,`<path d="M68 84Q60 27 119 26Q180 25 173 87L158 67L149 72L142 52L128 70L116 52L100 74L88 57L78 86Z" fill="${hair}"/>`,`<g fill="${hair}"><circle cx="83" cy="57" r="18"/><circle cx="104" cy="48" r="19"/><circle cx="128" cy="48" r="20"/><circle cx="153" cy="57" r="19"/></g>`];
  const femaleFront=[`<path d="M68 80Q63 25 120 27Q178 28 173 82L155 58Q129 76 89 61L78 88Z" fill="${hair}"/>`,`<path d="M68 82Q60 26 120 26Q179 27 173 87L155 64L151 51Q128 73 108 56L95 75L82 59L77 87Z" fill="${hair}"/>`,`<path d="M69 80Q63 26 120 27Q177 26 173 84L157 65Q132 74 89 61L79 86Z" fill="${hair}"/>`,`<path d="M68 82Q59 24 120 25Q181 25 174 88L156 65Q130 77 88 61L78 88Z" fill="${hair}"/>`,`<path d="M69 80Q64 28 120 28Q176 28 173 84L155 63Q127 76 90 62L79 87Z" fill="${hair}"/>`,`<path d="M69 82Q62 26 120 27Q179 26 174 86L155 65Q126 77 89 62L78 88Z" fill="${hair}"/>`,`<path d="M68 81Q61 25 120 26Q179 25 174 86L156 64Q131 76 90 61L78 87Z" fill="${hair}"/>`,`<g fill="${hair}"><path d="M69 79Q63 30 120 28Q174 29 172 80L155 61Q132 74 90 61L79 85Z"/><circle cx="164" cy="46" r="20"/></g>`];
  const frontHair=(female?femaleFront:maleFront)[a.hair];
  const hat=itemBy(a.hat,'hat')?.kind;
  let hatSvg='';
  if(hat==='cap')hatSvg=`<path d="M75 44Q120 14 166 44L158 55Q120 40 82 55Z" fill="#496b79" stroke="#314b55" stroke-width="3"/><path d="M158 49Q183 49 186 57Q167 60 154 56Z" fill="#496b79"/>`;
  if(hat==='beanie')hatSvg=`<path d="M78 53Q81 15 120 12Q160 15 163 53Z" fill="#9b7659" stroke="#5d5145" stroke-width="3"/><rect x="76" y="49" width="89" height="15" rx="7" fill="#b68c67"/>`;
  if(hat==='chef')hatSvg=`<path d="M84 53Q68 31 90 23Q97 5 118 18Q136 2 146 22Q169 26 156 53Z" fill="#fbfaf1" stroke="#8c9289" stroke-width="3"/><rect x="83" y="49" width="75" height="16" rx="4" fill="#fbfaf1"/>`;
  if(hat==='explorer')hatSvg=`<path d="M76 52Q83 18 120 18Q157 18 164 52Z" fill="#9d8059" stroke="#5c513f" stroke-width="3"/><ellipse cx="120" cy="53" rx="58" ry="10" fill="#b19567" stroke="#5c513f" stroke-width="3"/>`;
  if(hat==='royal')hatSvg=`<path d="M90 47L82 17L105 31L120 9L136 31L160 17L151 48Z" fill="#dfbd55" stroke="#7d6630" stroke-width="3"/><circle cx="120" cy="23" r="5" fill="#b64f4c"/>`;
  if(hat==='wizard')hatSvg=`<path d="M89 51L118 5L145 51Z" fill="#59618a" stroke="#343a5f" stroke-width="3"/><ellipse cx="117" cy="53" rx="45" ry="9" fill="#59618a"/><path d="M111 28l3 6 7 2-7 3-3 6-3-6-7-3 7-2Z" fill="#dfc685"/>`;
  let accSvg='';
  if(accessory==='glasses')accSvg='<g fill="none" stroke="#39434a" stroke-width="3"><circle cx="96" cy="91" r="12"/><circle cx="144" cy="91" r="12"/><path d="M108 91H132"/></g>';
  if(accessory==='scarf')accSvg='<path d="M94 130Q120 144 147 130L151 151Q120 161 90 150Z" fill="#dc765f"/><path d="M137 147L151 190L137 188L128 151Z" fill="#dc765f"/>';
  if(accessory==='headphones')accSvg='<path d="M76 84Q72 48 120 46Q168 48 164 84" fill="none" stroke="#4b5c68" stroke-width="8"/><rect x="68" y="78" width="15" height="29" rx="7" fill="#6f8390"/><rect x="157" y="78" width="15" height="29" rx="7" fill="#6f8390"/>';
  if(accessory==='bag')accSvg='<path d="M151 157Q174 155 180 177L177 214H148L145 177Q147 166 151 157Z" fill="#97785b" stroke="#5d5145" stroke-width="3"/><path d="M151 157Q152 137 168 137Q180 139 180 160" fill="none" stroke="#5d5145" stroke-width="4"/>';
  if(accessory==='star')accSvg='<path d="M120 162l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#e4bd55" stroke="#8b7233" stroke-width="2"/><path d="M120 131V162" stroke="#8b7233" stroke-width="2"/>';
  return `<svg viewBox="0 0 240 280" role="img" aria-label="アバター"><g>${wings}${backHair}${cape}${legs}${bottomSvg}${body}${detail}<ellipse cx="120" cy="90" rx="48" ry="47" fill="${skin}" stroke="#354b47" stroke-width="3"/>${eyes}${mouth}${frontHair}${hatSvg}${accSvg}</g></svg>`;
}
