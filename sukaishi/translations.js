// eventJa | answerJa | hintJa | English explanation (same factual scope as the Japanese note)
const TRANSLATIONS = {
ancient:`秦による中国統一|始皇帝|中国／最初の皇帝／秦|Qin Shi Huang unified China in 221 BCE. He also standardized writing, weights, and measures.
アウグストゥスの皇帝就任|アウグストゥス|ローマ／オクタウィアヌス／初代皇帝|Octavian received the title Augustus in 27 BCE, marking the beginning of the Roman imperial period.
カエサル暗殺|ユリウス・カエサル|ローマ／独裁官／3月15日|Civil wars continued after Caesar's assassination in 44 BCE. Rome later came under imperial rule.
ガウガメラの戦い|アレクサンドロス大王|マケドニア／ペルシア／紀元前331年|Alexander's victory at Gaugamela in 331 BCE advanced his conquest of the Achaemenid Empire.
ペロポネソス戦争の終結|スパルタ|ギリシア／アテネのライバル／軍事|Athens surrendered in 404 BCE. The long war had weakened the Greek city-states.
カルタゴの滅亡|ローマ|地中海／ポエニ戦争／カルタゴ|Rome destroyed Carthage in the Third Punic War in 146 BCE. Rome was still a republic at this time.
漢の成立|漢|中国／劉邦／秦の後|Liu Bang became emperor in 202 BCE and founded the Han dynasty.
西ローマ帝国の滅亡|西ローマ帝国|ローマ／476年／西側|The deposition of the western emperor in 476 CE conventionally marks the fall of the Western Roman Empire. The Eastern Roman Empire survived.
ミラノ勅令|キリスト教|コンスタンティヌス／ミラノ／313年|The Edict of Milan in 313 CE granted toleration to Christianity. This was different from making it the state religion.
第1回ニケーア公会議|コンスタンティヌス1世|ローマ／キリスト教／ニケーア|Constantine I convened the Council of Nicaea in 325 CE to address disputes over Christian doctrine.
キュロス2世によるメディア征服|アケメネス朝ペルシア|ペルシア／キュロス／イラン|Cyrus the Great defeated the Medes around 550 BCE and expanded Achaemenid power.
ペルシアによるバビロン征服|バビロン|メソポタミア／キュロス／紀元前539年|Cyrus captured Babylon in 539 BCE, bringing the Neo-Babylonian Empire to an end.`,
medieval:`カール大帝の戴冠|カール大帝|フランク王国／教皇／800年|Pope Leo III crowned the Frankish king Charlemagne emperor in Rome in 800.
モンゴル帝国の成立|チンギス・ハン|草原地帯／テムジン／モンゴル|Temujin took the title Genghis Khan in 1206 after uniting the Mongol tribes.
ノルマン人によるイングランド征服|ウィリアム征服王|ノルマンディー／ヘースティングズ／イングランド|William, Duke of Normandy, won the Battle of Hastings in 1066 and became king of England.
マグナ・カルタ（大憲章）|ジョン王|イングランド／貴族／1215年|Under pressure from his barons, King John accepted Magna Carta in 1215. The document limited royal power.
ヒジュラ（聖遷）|メディナ|ヒジュラ（聖遷）／アラビア／622年|The Hijra was Muhammad's migration from Mecca to Medina in 622. This year marks the beginning of the Islamic calendar.
唐の成立|唐|中国／長安／隋の後|Li Yuan founded the Tang dynasty in 618. Its capital, Chang'an, became a major cosmopolitan city.
宋の成立|宋|中国／趙匡胤／960年|Zhao Kuangyin founded the Song dynasty in 960. Its government placed great emphasis on civil officials.
アッバース革命|アッバース朝|バグダード／カリフ政権／750年|The Abbasids overthrew the Umayyads in 750. Baghdad was founded later, in 762.
コンスタンティノープルの陥落|オスマン帝国|メフメト2世／コンスタンティノープル／1453年|Mehmed II captured Constantinople in 1453, ending the Byzantine, or Eastern Roman, Empire.
明の成立|明|中国／洪武帝／1368年|Zhu Yuanzhang founded the Ming dynasty in 1368 and became the Hongwu Emperor.
百年戦争の開始|百年戦争|イングランド／フランス／1337年|The Hundred Years' War was fought intermittently between England and France. It is generally dated from 1337 to 1453.
黒死病のヨーロッパ到来|黒死病（ペスト）|ペスト／ヨーロッパ／人口減少|The Black Death spread through Europe in the fourteenth century, profoundly affecting its population and society.`,
early:`ヴァスコ・ダ・ガマのインド到達|ヴァスコ・ダ・ガマ|ポルトガル／アフリカ／インド|Vasco da Gama reached Calicut in 1498, establishing a sea route from Europe to India around Africa.
ルターの九十五か条の論題|マルティン・ルター|宗教改革／ドイツ／論題|Luther's criticism of indulgences in 1517 became a major catalyst for the Protestant Reformation.
ムガル帝国の成立|バーブル|インド／パーニーパット／ムガル帝国|Babur won the First Battle of Panipat in 1526 and established the Mughal Empire in northern India.
コロンブスのカリブ海到達|クリストファー・コロンブス|大西洋／スペイン／1492年|Columbus's voyage in 1492 was followed by expanding Atlantic exchanges and colonization. Indigenous societies already existed in the Americas.
ウェストファリア条約|ウェストファリア条約|ヨーロッパ／講和／1648年|The Peace of Westphalia ended the Thirty Years' War in 1648.
名誉革命|名誉革命|イングランド／1688年／議会|The Glorious Revolution took place in 1688. The English Bill of Rights followed in 1689.
イングランドの権利の章典|権利の章典|議会／イングランド／権利|The Bill of Rights limited royal authority and affirmed the rights of Parliament in 1689.
テノチティトランの陥落|スペイン|コルテス／テノチティトラン／1521年|Cortes and Spanish forces captured Tenochtitlan in 1521 with the help of Indigenous allies.
清の北京入城|清|満洲人／北京／1644年|The dynasty adopted the name Qing in 1636 and entered Beijing in 1644. These were separate events.
ニュートンの『プリンキピア』刊行|アイザック・ニュートン|重力／運動／プリンキピア|Newton's Principia, published in 1687, explained motion on Earth and in the heavens through laws of motion and universal gravitation.
江戸幕府の成立|徳川家康|日本／江戸／将軍|Tokugawa Ieyasu became shogun in 1603. The Battle of Sekigahara had taken place in 1600.
トルデシリャス条約|トルデシリャス条約|スペイン／ポルトガル／大西洋|The Treaty of Tordesillas set a line dividing Spanish and Portuguese overseas claims in 1494. It was not based on the consent of local peoples.`,
modern:`フランス革命の開始|フランス革命|バスティーユ／フランス／1789年|Financial crisis and resentment of the estate system helped trigger the French Revolution in 1789. It challenged absolute monarchy and the old order.
アメリカ独立宣言|アメリカ合衆国|13植民地／独立宣言／1776年|The thirteen North American colonies declared independence in 1776. Britain recognized their independence in 1783.
ワーテルローの戦い|ナポレオン・ボナパルト|フランス／ワーテルロー／皇帝|Napoleon's defeat at Waterloo in 1815 brought his Hundred Days return to power to an end.
ハイチの独立|ハイチ|カリブ海／革命／1804年|Haiti became independent in 1804 after a revolution in the French colony of Saint-Domingue.
南京条約|南京条約|中国／イギリス／1842年|The Treaty of Nanjing ended the First Opium War in 1842. Its terms included ceding Hong Kong Island and opening five ports.
ドイツ帝国の成立|ドイツ|ビスマルク／プロイセン／ヴェルサイユ|Germany was unified under Prussian leadership in 1871. The emperor was proclaimed at Versailles.
明治維新|明治維新|日本／近代化／1868年|The Meiji Restoration in 1868 replaced shogunal rule with a new government, followed by centralization and modernization.
スエズ運河の開通|スエズ運河|エジプト／地中海／紅海|The Suez Canal opened in 1869, connecting the Mediterranean and Red Seas and shortening the sea route between Europe and Asia.
インド大反乱|インド大反乱|シパーヒー（インド人兵士）／インド／東インド会社|After the Indian Rebellion of 1857, East India Company rule ended. Direct British government rule began in 1858.
ロシアの農奴解放|ロシア|アレクサンドル2世／農奴／1861年|Alexander II issued the emancipation decree in 1861. Peasants continued to face burdens related to land payments.
辛亥革命|辛亥革命|中国／清／共和国|The Xinhai Revolution began in 1911. The Republic of China was established and the Qing emperor abdicated in 1912.
ベルリン会議の開始|ベルリン会議|アフリカ／ヨーロッパ列強／1884年|The Berlin Conference of 1884–1885 discussed rules for European expansion in Africa.`,
contemporary:`国際連合の成立|国際連合|平和／憲章／1945年|The United Nations officially came into existence on 24 October 1945. It is a different organization from the League of Nations.
ヴェルサイユ条約|ヴェルサイユ条約|ドイツ／講和／1919年|The Treaty of Versailles imposed military restrictions, territorial changes, and reparations on Germany in 1919.
十月革命|十月革命|ロシア／レーニン／ボリシェヴィキ|The October Revolution overthrew Russia's Provisional Government in 1917. Its name follows the calendar then used in Russia.
世界恐慌の開始|世界恐慌|ウォール街／失業／1929年|The US stock market crash of 1929 helped trigger a worldwide depression. Production and international trade declined.
インドとパキスタンの独立|インド|南アジア／分離独立／1947年|British India was partitioned into India and Pakistan in 1947. Independence was accompanied by mass migration and violence.
中華人民共和国の成立|中華人民共和国|毛沢東／北京／1949年|Mao Zedong proclaimed the founding of the People's Republic of China on 1 October 1949.
朝鮮戦争の開始|朝鮮戦争|朝鮮半島／冷戦／1950年|The Korean War began in 1950. An armistice was signed in 1953; an armistice is not the same as a peace treaty.
バンドン会議（アジア・アフリカ会議）|バンドン会議|アジア／アフリカ／インドネシア|The Asian-African Conference met in Bandung in 1955 and discussed anti-colonialism and peaceful coexistence.
キューバ危機|キューバ危機|キューバ／ミサイル／冷戦|Soviet missile deployment in Cuba brought the US and USSR into confrontation in 1962. Negotiations averted nuclear war.
ベルリンの壁の開放|ベルリンの壁|ドイツ／冷戦／1989年|The Berlin Wall opened in 1989. German reunification followed in 1990.
ソビエト連邦の解体|ソビエト連邦|ソ連／構成共和国／1991年|The Soviet Union dissolved in 1991, and its constituent republics became independent states.
マンデラの大統領就任|ネルソン・マンデラ|南アフリカ／アパルトヘイト／1994年|Mandela became president after South Africa's first multiracial democratic election in 1994, following the end of apartheid.`
};
const ANSWER_JA={};
for(const [era,raw] of Object.entries(TRANSLATIONS))raw.split('\n').forEach((line,i)=>{
 const [eventJa,answerJa,hintJa,noteEn]=line.split('|');
 const fact=FACTS[era][i];Object.assign(fact,{eventJa,answerJa,hintJa,noteEn});
 ANSWER_JA[fact.answer]=answerJa;
 const question=QUESTIONS.find(q=>q.id===fact.id);Object.assign(question,{eventJa,answerJa,hintJa,noteEn});
});
