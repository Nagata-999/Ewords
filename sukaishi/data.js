// Original practice questions. Era boundaries are learning categories, not universal periodization.
const ERAS = [
 {id:'ancient',name:'古代',en:'ANCIENT',icon:'🏛️',range:'文明の誕生〜5世紀',color:'#b66c39'},
 {id:'medieval',name:'中世',en:'MEDIEVAL',icon:'🏰',range:'6〜15世紀',color:'#6b7195'},
 {id:'early',name:'近世',en:'EARLY MODERN',icon:'⛵',range:'15〜18世紀中頃',color:'#267d79'},
 {id:'modern',name:'近代',en:'MODERN',icon:'🚂',range:'18世紀後半〜第一次世界大戦前',color:'#ae634d'},
 {id:'contemporary',name:'現代',en:'CONTEMPORARY',icon:'🌐',range:'第一次世界大戦〜',color:'#467c9e'}
];
// question | translation | answer | hints | explanation | dated event | year
const RAW = {
ancient:`Who unified China in 221 BCE?|紀元前221年に中国を統一したのは誰？|Qin Shi Huang|China / First emperor / Qin|秦の始皇帝は紀元前221年に中国を統一。文字や度量衡の統一も進めました。|Unification of China under Qin|-221
Who became the first Roman emperor?|ローマの初代皇帝は誰？|Augustus|Rome / Octavian / First emperor|紀元前27年、オクタウィアヌスはアウグストゥスの称号を得ました。|Augustus becomes emperor|-27
Who was assassinated in Rome in 44 BCE?|紀元前44年にローマで暗殺されたのは誰？|Julius Caesar|Rome / Dictator / Ides of March|カエサルの暗殺後も内戦は続き、のちに帝政へ移りました。|Assassination of Julius Caesar|-44
Who defeated the Persian army at Gaugamela?|ガウガメラでペルシア軍を破ったのは誰？|Alexander the Great|Macedonia / Persia / 331 BCE|アレクサンドロスは紀元前331年の勝利によってアケメネス朝征服を進めました。|Battle of Gaugamela|-331
Which city-state won the Peloponnesian War?|ペロポネソス戦争に勝った都市国家は？|Sparta|Greece / Athens rival / Military|紀元前404年にアテネが降伏。ギリシア諸都市は長い戦争で疲弊しました。|End of the Peloponnesian War|-404
Which state destroyed Carthage in 146 BCE?|紀元前146年にカルタゴを滅ぼした国は？|Rome|Mediterranean / Punic Wars / Carthage|第三次ポエニ戦争でローマがカルタゴを破壊し、西地中海の支配を強めました。この時代のローマは共和政です。|Destruction of Carthage|-146
Which dynasty began under Liu Bang?|劉邦が建てた王朝は？|Han|China / Liu Bang / After Qin|劉邦は紀元前202年に皇帝となり、漢王朝を開きました。|Foundation of the Han dynasty|-202
Which empire fell in western Europe in 476 CE?|476年、西ヨーロッパで滅亡した帝国は？|Western Roman Empire|Rome / 476 / Western half|476年の皇帝廃位が西ローマ帝国滅亡の目安です。東ローマ帝国は存続しました。|Fall of the Western Roman Empire|476
Which religion gained legal toleration under the Edict of Milan?|ミラノ勅令で公認された宗教は？|Christianity|Constantine / Milan / 313|313年のミラノ勅令はキリスト教への寛容を認めました。国教化とは別の出来事です。|Edict of Milan|313
Which dynasty was founded by the Sui emperor Wen?|文帝が建てた王朝は？|Sui|China / Emperor Wen / Before Tang|隋の建国は581年。南北の再統一は589年で、建国とは区別します。|Foundation of the Sui dynasty|581
Which empire was founded by Cyrus the Great?|キュロス2世が築いた帝国は？|Achaemenid Empire|Persia / Cyrus / Iran|キュロス2世は紀元前550年頃にメディアを倒し、アケメネス朝の勢力を拡大しました。|Cyrus conquers Media|-550
Which city was captured by Cyrus in 539 BCE?|紀元前539年、キュロス2世が征服した都市は？|Babylon|Mesopotamia / Cyrus / 539 BCE|バビロン征服により新バビロニア王国が滅びました。|Persian conquest of Babylon|-539`,
medieval:`Who was crowned emperor in Rome in 800?|800年、ローマで皇帝に戴冠されたのは誰？|Charlemagne|Franks / Pope / 800|フランク王カール大帝は教皇レオ3世から皇帝冠を受けました。|Coronation of Charlemagne|800
Who founded the Mongol Empire in 1206?|1206年にモンゴル帝国を建てたのは誰？|Genghis Khan|Steppe / Temujin / Mongolia|テムジンは1206年にチンギス・ハンとなり、モンゴルの諸部族を統合しました。|Foundation of the Mongol Empire|1206
Who conquered England in 1066?|1066年にイングランドを征服したのは誰？|William the Conqueror|Normandy / Hastings / England|ノルマンディー公ウィリアムはヘースティングズで勝利し、イングランド王となりました。|Norman conquest of England|1066
Which English king accepted Magna Carta?|マグナ・カルタを認めたイングランド王は？|King John|England / Barons / 1215|1215年、貴族の圧力を受けたジョン王が承認。王権を制限する文書でした。|Magna Carta|1215
Which city did Muhammad migrate to in 622?|622年にムハンマドが移住した都市は？|Medina|Hijra / Arabia / 622|メッカからメディナへの移住をヒジュラと呼び、イスラーム暦の起点となります。|Hijra|622
Which dynasty began in China in 618?|618年に中国で成立した王朝は？|Tang|China / Chang'an / After Sui|李淵が唐を建国。長安は国際色豊かな都として栄えました。|Foundation of the Tang dynasty|618
Which dynasty began in China in 960?|960年に中国で成立した王朝は？|Song|China / Zhao Kuangyin / 960|趙匡胤が宋を建国。文官を重視する統治体制が発展しました。|Foundation of the Song dynasty|960
Which dynasty took power in the Islamic world in 750?|750年にイスラーム世界で成立した王朝は？|Abbasid dynasty|Baghdad / Caliphate / 750|アッバース朝がウマイヤ朝を倒しました。バグダード建設はその後の762年です。|Abbasid Revolution|750
Which empire captured Constantinople in 1453?|1453年にコンスタンティノープルを攻略した帝国は？|Ottoman Empire|Mehmed II / Constantinople / 1453|メフメト2世の攻略により東ローマ（ビザンツ）帝国が滅亡しました。|Fall of Constantinople|1453
Which dynasty replaced Yuan rule in China in 1368?|1368年に中国で元に代わった王朝は？|Ming|China / Hongwu Emperor / 1368|朱元璋が明を建国し、洪武帝となりました。|Foundation of the Ming dynasty|1368
Which war began between England and France in 1337?|1337年、英仏間で始まった戦争は？|Hundred Years' War|England / France / 1337|百年戦争は断続的に続き、一般に1337〜1453年とされます。|Start of the Hundred Years' War|1337
Which epidemic reached Europe in 1347?|1347年にヨーロッパへ広がり始めた疫病は？|Black Death|Plague / Europe / Population loss|黒死病は14世紀のヨーロッパで大流行し、人口や社会に大きな影響を与えました。|Black Death reaches Europe|1347`,
early:`Who reached India by sea around Africa in 1498?|1498年、アフリカ南端を回ってインドに到達したのは誰？|Vasco da Gama|Portugal / Africa / India|ヴァスコ・ダ・ガマはカリカットに到達し、欧州とインドを結ぶ航路を開きました。|Da Gama reaches India|1498
Who published the Ninety-Five Theses in 1517?|1517年に九十五か条の論題を公表したのは誰？|Martin Luther|Reformation / Germany / Theses|ルターの贖宥状批判は宗教改革の大きな契機となりました。|Luther's Ninety-Five Theses|1517
Who founded the Mughal Empire in 1526?|1526年にムガル帝国を建てたのは誰？|Babur|India / Panipat / Mughal|バーブルは第一次パーニーパットの戦いで勝利し、北インドに帝国を築きました。|Foundation of the Mughal Empire|1526
Who reached the Caribbean in 1492?|1492年にカリブ海へ到達したのは誰？|Christopher Columbus|Atlantic / Spain / 1492|コロンブスの航海後、大西洋をまたぐ交流と植民地化が拡大しました。現地には先住民社会がありました。|Columbus reaches the Caribbean|1492
Which agreement ended the Thirty Years' War?|三十年戦争を終結させた講和は？|Peace of Westphalia|Europe / Peace / 1648|1648年のウェストファリア条約は三十年戦争を終結させました。|Peace of Westphalia|1648
Which revolution brought William and Mary to the English throne?|ウィリアムとメアリの即位につながった革命は？|Glorious Revolution|England / 1688 / Parliament|1688年の名誉革命後、1689年に権利の章典が定められました。|Glorious Revolution|1688
Which document was enacted in England in 1689?|1689年、イングランドで制定された文書は？|Bill of Rights|Parliament / England / Rights|権利の章典は国王の権限を制限し、議会の権利を確認しました。|English Bill of Rights|1689
Which empire conquered the Aztec capital in 1521?|1521年にアステカの都を征服した国は？|Spain|Cortes / Tenochtitlan / 1521|コルテスらスペイン勢力は先住民の同盟勢力とともにテノチティトランを攻略しました。|Fall of Tenochtitlan|1521
Which dynasty entered Beijing in 1644?|1644年に北京へ入った王朝は？|Qing|Manchus / Beijing / 1644|清は1636年に国号を定め、1644年に北京へ入りました。建国と入関は別です。|Qing entry into Beijing|1644
Who published the Principia in 1687?|1687年に『プリンキピア』を刊行したのは誰？|Isaac Newton|Gravity / Motion / Principia|ニュートンは運動法則と万有引力によって天体と地上の運動を説明しました。|Publication of Newton's Principia|1687
Which ruler began the Tokugawa shogunate in 1603?|1603年に江戸幕府を開いたのは誰？|Tokugawa Ieyasu|Japan / Edo / Shogun|徳川家康は1603年に征夷大将軍となりました。関ヶ原の戦いは1600年です。|Foundation of the Tokugawa shogunate|1603
Which treaty divided overseas claims between Spain and Portugal in 1494?|1494年、スペインとポルトガルの海外進出の境界を定めた条約は？|Treaty of Tordesillas|Spain / Portugal / Atlantic|トルデシリャス条約は大西洋に境界線を設定。現地の人々の同意に基づくものではありませんでした。|Treaty of Tordesillas|1494`,
modern:`Which revolution began in France in 1789?|1789年にフランスで始まった革命は？|French Revolution|Bastille / France / 1789|財政危機や身分制への不満を背景に革命が始まり、絶対王政と旧制度が揺らぎました。|Start of the French Revolution|1789
Which country declared independence from Britain in 1776?|1776年にイギリスからの独立を宣言した国は？|United States|Thirteen colonies / Declaration / 1776|北米13植民地が独立を宣言しました。イギリスによる独立承認は1783年です。|American Declaration of Independence|1776
Who was defeated at Waterloo in 1815?|1815年のワーテルローで敗れたのは誰？|Napoleon Bonaparte|France / Waterloo / Emperor|ナポレオンはワーテルローで敗北し、百日天下が終わりました。|Battle of Waterloo|1815
Which country achieved independence in 1804 after a slave revolution?|奴隷制への革命を経て1804年に独立した国は？|Haiti|Caribbean / Revolution / 1804|ハイチはフランス植民地サン・ドマングでの革命を経て独立しました。|Haitian independence|1804
Which treaty ended the First Opium War?|第一次アヘン戦争を終わらせた条約は？|Treaty of Nanjing|China / Britain / 1842|南京条約で香港島の割譲や五港の開港などが定められました。|Treaty of Nanjing|1842
Which country was unified as an empire in 1871?|1871年に帝国として統一された国は？|Germany|Bismarck / Prussia / Versailles|プロイセン主導でドイツ帝国が成立。皇帝即位式はヴェルサイユで行われました。|Foundation of the German Empire|1871
Which political change began in Japan in 1868?|1868年に日本で始まった政治変革は？|Meiji Restoration|Japan / Modernization / 1868|明治維新により幕府に代わる政府が成立し、中央集権化や近代化が進みました。|Meiji Restoration|1868
Which canal opened in Egypt in 1869?|1869年にエジプトで開通した運河は？|Suez Canal|Egypt / Mediterranean / Red Sea|スエズ運河は地中海と紅海を結び、欧州とアジアの航路を短縮しました。|Opening of the Suez Canal|1869
Which movement began in India in 1857?|1857年にインドで始まった反乱は？|Indian Rebellion|Sepoys / India / East India Company|インド大反乱の後、東インド会社の統治が終わり、1858年から英政府の直接統治となりました。|Indian Rebellion|1857
Which country abolished serfdom in 1861?|1861年に農奴解放令を出した国は？|Russia|Alexander II / Serfs / 1861|アレクサンドル2世が農奴解放令を公布。農民の土地負担などは残りました。|Emancipation of Russian serfs|1861
Which revolution began in China in 1911?|1911年に中国で始まった革命は？|Xinhai Revolution|China / Qing / Republic|辛亥革命を経て1912年に中華民国が成立し、清の皇帝が退位しました。|Xinhai Revolution|1911
Which conference on Africa began in 1884?|1884年に始まったアフリカ分割に関する会議は？|Berlin Conference|Africa / European powers / 1884|ベルリン会議は1884〜85年に開催され、列強のアフリカ進出のルールを協議しました。|Start of the Berlin Conference|1884`,
contemporary:`Which organization was founded in 1945 to promote international peace?|1945年に国際平和のため設立された組織は？|United Nations|Peace / Charter / 1945|国際連合は1945年10月24日に正式発足しました。国際連盟とは別の組織です。|Foundation of the United Nations|1945
Which treaty with Germany was signed in 1919?|1919年にドイツと結ばれた講和条約は？|Treaty of Versailles|Germany / Peace / 1919|ヴェルサイユ条約はドイツの軍備制限、領土変更、賠償などを定めました。|Treaty of Versailles|1919
Which revolution brought the Bolsheviks to power in 1917?|1917年にボリシェヴィキが政権を握った革命は？|October Revolution|Russia / Lenin / Bolsheviks|十月革命で臨時政府が倒されました。名称は当時のロシアの暦によります。|October Revolution|1917
Which economic crisis began in 1929?|1929年に始まった世界的な経済危機は？|Great Depression|Wall Street / Unemployment / 1929|米国の株価暴落を契機に恐慌が世界へ波及し、生産や貿易が縮小しました。|Start of the Great Depression|1929
Which country became independent from Britain alongside Pakistan in 1947?|1947年、パキスタンとともにイギリスから独立した国は？|India|South Asia / Partition / 1947|英領インドはインドとパキスタンに分離独立し、大規模な人口移動や暴力が起きました。|Independence of India and Pakistan|1947
Which state was founded in mainland China in 1949?|1949年に中国大陸で成立した国家は？|People's Republic of China|Mao Zedong / Beijing / 1949|毛沢東は1949年10月1日に中華人民共和国の成立を宣言しました。|Foundation of the PRC|1949
Which war began on the Korean Peninsula in 1950?|1950年に朝鮮半島で始まった戦争は？|Korean War|Korea / Cold War / 1950|朝鮮戦争は1950年に始まり、1953年に休戦協定が結ばれました。休戦と講和は異なります。|Start of the Korean War|1950
Which conference took place in Indonesia in 1955?|1955年にインドネシアで開かれた会議は？|Bandung Conference|Asia / Africa / Indonesia|アジア・アフリカ会議では反植民地主義や平和共存が話し合われました。|Bandung Conference|1955
Which crisis brought the US and USSR close to nuclear war in 1962?|1962年、米ソが核戦争の危機に近づいた事件は？|Cuban Missile Crisis|Cuba / Missiles / Cold War|キューバへのソ連ミサイル配備をめぐって米ソが対立し、交渉で危機を回避しました。|Cuban Missile Crisis|1962
Which barrier opened in Berlin in 1989?|1989年にベルリンで開放された障壁は？|Berlin Wall|Germany / Cold War / 1989|ベルリンの壁の開放は1989年。ドイツ再統一は翌1990年です。|Opening of the Berlin Wall|1989
Which state dissolved in 1991?|1991年に解体した国家は？|Soviet Union|USSR / Republics / 1991|ソ連は1991年に解体し、構成共和国が独立国家となりました。|Dissolution of the Soviet Union|1991
Who became South Africa's president after the 1994 multiracial election?|1994年の全人種参加選挙後、南アフリカ大統領になったのは誰？|Nelson Mandela|South Africa / Apartheid / 1994|マンデラはアパルトヘイト撤廃後の全人種参加選挙を経て大統領となりました。|Mandela becomes president|1994`
};
// Sui belongs to the medieval learning group: swap it with late-antique Christianity content.
RAW.ancient=RAW.ancient.replace(/Which dynasty was founded by the Sui emperor Wen\?[^\n]+/, 'Which emperor convened the Council of Nicaea in 325?|325年にニケーア公会議を招集した皇帝は？|Constantine I|Rome / Christianity / Nicaea|コンスタンティヌス1世は325年にニケーア公会議を招集し、教義上の対立への対応を図りました。|First Council of Nicaea|325');
const yearText=y=>y<0?`${-y} BCE`:`${y} CE`;
const FACTS=Object.fromEntries(Object.entries(RAW).map(([era,raw])=>[era,raw.split('\n').map((r,i)=>{const [en,ja,answer,hint,note,event,y]=r.split('|');return {id:`${era}-${i}`,era,en,ja,answer,hint,note,event,year:Number(y)};})]));
const QUESTIONS=[];
for(const [era,facts] of Object.entries(FACTS)){
 facts.forEach((f,i)=>{
  const type=i<4?'choice':i<8?'truefalse':'hint';
  const alternatives=[1,3,5].map(n=>facts[(i+n)%facts.length].answer);
  QUESTIONS.push({...f,type,options:[f.answer,...alternatives],truth:i%2===0,claimedYear:i%2===0?f.year:f.year+100});
 });
 for(let i=0;i<4;i++){
  const members=[facts[i],facts[i+4],facts[i+8]];
  QUESTIONS.push({id:`${era}-match-${i}`,era,type:'match',en:'Match each event to the correct answer.',ja:'出来事と、それに対応する答えを組み合わせよう。',members,note:members.map(f=>f.note).join('\n')});
  const ordered=[facts[i*3],facts[i*3+1],facts[i*3+2]].sort((a,b)=>a.year-b.year);
  QUESTIONS.push({id:`${era}-order-${i}`,era,type:'order',en:'Put these events in chronological order.',ja:'古い出来事から順に選ぼう。',members:ordered,note:ordered.map(f=>`${yearText(f.year)} — ${f.event}`).join('\n')});
 }
}
if(typeof module!=='undefined')module.exports={ERAS,FACTS,QUESTIONS};
