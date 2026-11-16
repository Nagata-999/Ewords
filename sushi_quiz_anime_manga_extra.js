// Thirty additional well-known anime and manga questions.
(()=>{
const EXTRA=[
  {
    "cat": "Anime & Manga",
    "q": "In \"One Piece\", what is the name of Luffy's pirate crew?",
    "choices": [
      "Straw Hat Pirates",
      "Heart Pirates",
      "Red Hair Pirates",
      "Blackbeard Pirates"
    ],
    "ans": 0,
    "exp": "Straw Hat Pirates is correct in \"One Piece\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"One Piece\", who is the swordsman of the Straw Hat Pirates?",
    "choices": [
      "Roronoa Zoro",
      "Sanji",
      "Usopp",
      "Franky"
    ],
    "ans": 0,
    "exp": "Roronoa Zoro is correct in \"One Piece\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Naruto\", which village is Naruto Uzumaki from?",
    "choices": [
      "Hidden Leaf Village",
      "Hidden Sand Village",
      "Hidden Mist Village",
      "Hidden Cloud Village"
    ],
    "ans": 0,
    "exp": "Hidden Leaf Village is correct in \"Naruto\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Naruto\", what is the name of Naruto's rival and teammate?",
    "choices": [
      "Sasuke Uchiha",
      "Shikamaru Nara",
      "Rock Lee",
      "Gaara"
    ],
    "ans": 0,
    "exp": "Sasuke Uchiha is correct in \"Naruto\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Dragon Ball\", what is Goku's Saiyan birth name?",
    "choices": [
      "Kakarot",
      "Vegeta",
      "Raditz",
      "Bardock"
    ],
    "ans": 0,
    "exp": "Kakarot is correct in \"Dragon Ball\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Dragon Ball\", what item is used to summon Shenron?",
    "choices": [
      "Dragon Balls",
      "Poké Balls",
      "Chaos Emeralds",
      "Infinity Stones"
    ],
    "ans": 0,
    "exp": "Dragon Balls is correct in \"Dragon Ball\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Demon Slayer\", what is the name of Tanjiro's sister?",
    "choices": [
      "Nezuko",
      "Shinobu",
      "Mitsuri",
      "Kanao"
    ],
    "ans": 0,
    "exp": "Nezuko is correct in \"Demon Slayer\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Demon Slayer\", which breathing style does Zenitsu use?",
    "choices": [
      "Thunder Breathing",
      "Water Breathing",
      "Flame Breathing",
      "Wind Breathing"
    ],
    "ans": 0,
    "exp": "Thunder Breathing is correct in \"Demon Slayer\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Attack on Titan\", what is the name of the walled district breached at the start of the story?",
    "choices": [
      "Shiganshina",
      "Trost",
      "Stohess",
      "Orvud"
    ],
    "ans": 0,
    "exp": "Shiganshina is correct in \"Attack on Titan\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Attack on Titan\", who is Eren Yeager's childhood friend and adoptive sister?",
    "choices": [
      "Mikasa Ackerman",
      "Annie Leonhart",
      "Historia Reiss",
      "Sasha Braus"
    ],
    "ans": 0,
    "exp": "Mikasa Ackerman is correct in \"Attack on Titan\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"My Hero Academia\", what is the hero name of Izuku Midoriya?",
    "choices": [
      "Deku",
      "Dynamight",
      "Shoto",
      "Ingenium"
    ],
    "ans": 0,
    "exp": "Deku is correct in \"My Hero Academia\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"My Hero Academia\", what is All Might's Quirk called?",
    "choices": [
      "One For All",
      "All For One",
      "Explosion",
      "Erasure"
    ],
    "ans": 0,
    "exp": "One For All is correct in \"My Hero Academia\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Jujutsu Kaisen\", who is Yuji Itadori's teacher at Tokyo Jujutsu High?",
    "choices": [
      "Satoru Gojo",
      "Kento Nanami",
      "Suguru Geto",
      "Aoi Todo"
    ],
    "ans": 0,
    "exp": "Satoru Gojo is correct in \"Jujutsu Kaisen\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Jujutsu Kaisen\", what is the name of the cursed spirit inside Yuji Itadori?",
    "choices": [
      "Ryomen Sukuna",
      "Mahito",
      "Jogo",
      "Hanami"
    ],
    "ans": 0,
    "exp": "Ryomen Sukuna is correct in \"Jujutsu Kaisen\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Death Note\", what is the name of the shinigami who drops the notebook?",
    "choices": [
      "Ryuk",
      "Rem",
      "Gelus",
      "Sidoh"
    ],
    "ans": 0,
    "exp": "Ryuk is correct in \"Death Note\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Death Note\", what alias does Light Yagami become known by?",
    "choices": [
      "Kira",
      "L",
      "Near",
      "Mello"
    ],
    "ans": 0,
    "exp": "Kira is correct in \"Death Note\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Fullmetal Alchemist\", what is the name of Edward Elric's younger brother?",
    "choices": [
      "Alphonse",
      "Roy",
      "Maes",
      "Ling"
    ],
    "ans": 0,
    "exp": "Alphonse is correct in \"Fullmetal Alchemist\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Fullmetal Alchemist\", what is Edward Elric's state alchemist title?",
    "choices": [
      "Fullmetal Alchemist",
      "Flame Alchemist",
      "Strong Arm Alchemist",
      "Crimson Alchemist"
    ],
    "ans": 0,
    "exp": "Fullmetal Alchemist is correct in \"Fullmetal Alchemist\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Spy x Family\", what is the name of the Forger family's telepathic daughter?",
    "choices": [
      "Anya",
      "Becky",
      "Yor",
      "Fiona"
    ],
    "ans": 0,
    "exp": "Anya is correct in \"Spy x Family\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Spy x Family\", what is Loid Forger's spy codename?",
    "choices": [
      "Twilight",
      "Nightfall",
      "Garden",
      "Handler"
    ],
    "ans": 0,
    "exp": "Twilight is correct in \"Spy x Family\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Haikyu!!\", what position does Tobio Kageyama play?",
    "choices": [
      "Setter",
      "Libero",
      "Middle blocker",
      "Wing spiker"
    ],
    "ans": 0,
    "exp": "Setter is correct in \"Haikyu!!\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Haikyu!!\", which high school volleyball team does Shoyo Hinata join?",
    "choices": [
      "Karasuno",
      "Nekoma",
      "Aoba Johsai",
      "Shiratorizawa"
    ],
    "ans": 0,
    "exp": "Karasuno is correct in \"Haikyu!!\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Sailor Moon\", what is Usagi Tsukino's superhero identity?",
    "choices": [
      "Sailor Moon",
      "Sailor Mars",
      "Sailor Venus",
      "Sailor Jupiter"
    ],
    "ans": 0,
    "exp": "Sailor Moon is correct in \"Sailor Moon\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Sailor Moon\", what kind of animal is Luna?",
    "choices": [
      "Cat",
      "Rabbit",
      "Fox",
      "Owl"
    ],
    "ans": 0,
    "exp": "Cat is correct in \"Sailor Moon\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Detective Conan\", what is Conan Edogawa's original name?",
    "choices": [
      "Shinichi Kudo",
      "Heiji Hattori",
      "Kogoro Mori",
      "Tooru Amuro"
    ],
    "ans": 0,
    "exp": "Shinichi Kudo is correct in \"Detective Conan\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Detective Conan\", what is the name of the detective who takes Conan into his home?",
    "choices": [
      "Kogoro Mori",
      "Hiroshi Agasa",
      "Heiji Hattori",
      "Shuichi Akai"
    ],
    "ans": 0,
    "exp": "Kogoro Mori is correct in \"Detective Conan\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Frieren: Beyond Journey's End\", what race is Frieren?",
    "choices": [
      "Elf",
      "Dwarf",
      "Human",
      "Demon"
    ],
    "ans": 0,
    "exp": "Elf is correct in \"Frieren: Beyond Journey's End\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Frieren: Beyond Journey's End\", what is the name of Frieren's young mage apprentice?",
    "choices": [
      "Fern",
      "Stark",
      "Himmel",
      "Eisen"
    ],
    "ans": 0,
    "exp": "Fern is correct in \"Frieren: Beyond Journey's End\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Chainsaw Man\", what is the name of Denji's chainsaw devil companion?",
    "choices": [
      "Pochita",
      "Power",
      "Aki",
      "Beam"
    ],
    "ans": 0,
    "exp": "Pochita is correct in \"Chainsaw Man\"."
  },
  {
    "cat": "Anime & Manga",
    "q": "In \"Chainsaw Man\", which organization employs Denji as a devil hunter?",
    "choices": [
      "Public Safety",
      "Hero Association",
      "Survey Corps",
      "Soul Society"
    ],
    "ans": 0,
    "exp": "Public Safety is correct in \"Chainsaw Man\"."
  }
];
if(typeof QUESTIONS==='undefined'||!Array.isArray(QUESTIONS))return;
const existing=new Set(QUESTIONS.map(q=>q.cat+'::'+q.q));
for(const q of EXTRA){const key=q.cat+'::'+q.q;if(!existing.has(key)){QUESTIONS.push(q);existing.add(key);}}
if(typeof renderCategoryCards==='function') ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
})();
