/* Topic-linked, two-exchange everyday conversations. */
(function(root){
  const conversations = [
  {
    "id": "wrong-file",
    "s": "提出ミス",
    "cat": "daily",
    "en": "I sent the wrong file. I screwed up.",
    "ja": "違うファイルを送った。やらかした。",
    "answers": [
      {
        "en": "We all mess up sometimes.",
        "ja": "誰でも時々やらかすよ。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Oof, that’s rough. You can fix this, though.",
        "ja": "うわ、きついね。でもまだ直せるよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "提出ミス・続き",
      "cat": "daily",
      "en": "Should I send the right one now?",
      "ja": "今、正しいファイルを送り直した方がいい？",
      "answers": [
        {
          "en": "Yeah, own up to it and send it.",
          "ja": "うん、ミスを認めて送ろう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Yeah, fix it now. You’ve got this.",
          "ja": "うん、今直そう。きっと大丈夫。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "I’ll send it with a quick apology.",
      "ja": "ひと言謝って送り直すね。"
    },
    "note": "screw up / mess up：失敗する、やらかす。親しい会話で使う。"
  },
  {
    "id": "panic",
    "s": "急な発表",
    "cat": "daily",
    "en": "I freaked out when they called my name.",
    "ja": "名前を呼ばれてすごく焦った。",
    "answers": [
      {
        "en": "I get it. That would freak me out too.",
        "ja": "分かる。自分もそれなら焦る。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Same, I’d be freaking out too.",
        "ja": "分かる、自分も焦るわ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "急な発表・続き",
      "cat": "daily",
      "en": "How can I calm down before my next talk?",
      "ja": "次の発表の前、どう落ち着けばいい？",
      "answers": [
        {
          "en": "Take a breath. You’ve got this.",
          "ja": "深呼吸して。きっとできるよ。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "You got this. Take a sec and breathe.",
          "ja": "大丈夫。ちょっと深呼吸して。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "I’ll take a breath before I start.",
      "ja": "始める前に深呼吸するね。"
    },
    "note": "freak out：ひどく動揺する、パニックになる。"
  },
  {
    "id": "tired",
    "s": "忙しい一日",
    "cat": "daily",
    "en": "I’m wiped out after today.",
    "ja": "今日一日でへとへと。",
    "answers": [
      {
        "en": "Sounds like you need to crash early.",
        "ja": "今日は早く寝た方がよさそう。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Mood. I’d be cooked after that too.",
        "ja": "分かる。自分もそれならへとへと。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "忙しい一日・続き",
      "cat": "daily",
      "en": "Should I skip our movie night?",
      "ja": "今夜の映画は見送っていいかな？",
      "answers": [
        {
          "en": "No worries. Get some rest.",
          "ja": "気にしないで。休んでね。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "All good, bestie. We can watch it later.",
          "ja": "大丈夫だよ。映画はまた今度見よう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks. Let’s watch it this weekend instead.",
      "ja": "ありがとう。代わりに週末見よう。"
    },
    "note": "wiped out：へとへと。crash：くだけた言い方で寝る。"
  },
  {
    "id": "plans",
    "s": "週末の誘い",
    "cat": "daily",
    "en": "Wanna hang out this weekend?",
    "ja": "週末、一緒に遊ばない？",
    "answers": [
      {
        "en": "I’m down. What did you have in mind?",
        "ja": "いいね。何するつもり？",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "Thank you for inviting me. What would you like to do?",
        "ja": "誘ってくれてありがとう。何をしましょうか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Bet. What’s the plan?",
        "ja": "了解。何する？",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "週末の誘い・続き",
      "cat": "daily",
      "en": "How about grabbing a bite near the station?",
      "ja": "駅の近くで軽く食べるのはどう？",
      "answers": [
        {
          "en": "Sounds good. Let’s meet at noon.",
          "ja": "いいね。正午に会おう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. Noon at the station, then.",
          "ja": "了解。じゃあ駅に正午ね。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Perfect. I’ll see you at the station.",
      "ja": "決まり。駅で会おう。"
    },
    "note": "I’m down：賛成、参加したい。grab a bite：軽く食べる。"
  },
  {
    "id": "cancel",
    "s": "予定の変更",
    "cat": "daily",
    "en": "Something came up. Can we rain check?",
    "ja": "用事ができた。また今度にしていい？",
    "answers": [
      {
        "en": "No worries. When are you free?",
        "ja": "大丈夫。いつなら空いてる？",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "That sounds reasonable. Please tell me more.",
        "ja": "なるほど。もう少し教えてください。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "All good, bestie. Another day works.",
        "ja": "大丈夫だよ。また別の日にしよう。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "予定の変更・続き",
      "cat": "daily",
      "en": "Would next Saturday work for you?",
      "ja": "来週の土曜日ならどう？",
      "answers": [
        {
          "en": "Yeah, that works. Let’s pencil it in.",
          "ja": "うん、大丈夫。仮に予定を入れとこう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "For sure. Saturday’s a vibe.",
          "ja": "もちろん。土曜日、楽しみ。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks for being flexible. Saturday it is.",
      "ja": "合わせてくれてありがとう。土曜日にしよう。"
    },
    "note": "rain check：誘いをまたの機会にする。something came up：急用ができた。"
  },
  {
    "id": "disappointed",
    "s": "楽しみにしていたライブ",
    "cat": "daily",
    "en": "The concert got canceled. I’m bummed out.",
    "ja": "ライブが中止。がっかり。",
    "answers": [
      {
        "en": "That sucks. You were really looking forward to it.",
        "ja": "残念だね。すごく楽しみにしてたもんね。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Pain. You were so hyped for it.",
        "ja": "つらい。めっちゃ楽しみにしてたのに。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "楽しみにしていたライブ・続き",
      "cat": "daily",
      "en": "Want to do something else that night?",
      "ja": "その夜、別のことしない？",
      "answers": [
        {
          "en": "Sure. Let’s find something fun.",
          "ja": "もちろん。楽しいことを探そう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "I’m down. Let’s find a new plan.",
          "ja": "賛成。別の予定を考えよう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Cool. A movie might cheer me up.",
      "ja": "いいね。映画なら元気が出そう。"
    },
    "note": "bummed out：がっかりしている。That sucks：それは残念、くだけた共感。"
  },
  {
    "id": "exam",
    "s": "試験への不安",
    "cat": "daily",
    "en": "I’m stressed out about tomorrow’s test.",
    "ja": "明日のテストでストレスがすごい。",
    "answers": [
      {
        "en": "Don’t beat yourself up. You’ve worked hard.",
        "ja": "自分を責めないで。頑張ってきたじゃん。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "You got this, no cap.",
        "ja": "マジで、きっといけるよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "試験への不安・続き",
      "cat": "daily",
      "en": "Can you quiz me for ten minutes?",
      "ja": "10分だけ問題を出してくれる？",
      "answers": [
        {
          "en": "Absolutely. Let’s go over the tricky bits.",
          "ja": "もちろん。難しいところを確認しよう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. Let’s tackle the hard stuff first.",
          "ja": "了解。まず難しいところをやろう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks. A quick review will help.",
      "ja": "ありがとう。少し復習できると助かる。"
    },
    "note": "stressed out：ストレスで参っている。beat yourself up：自分を責める。"
  },
  {
    "id": "success",
    "s": "難しい課題",
    "cat": "daily",
    "en": "I finally pulled it off!",
    "ja": "ついにうまくやれた！",
    "answers": [
      {
        "en": "You nailed it! All that practice paid off.",
        "ja": "やったね！練習の成果が出たね。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "Congratulations. You worked hard for this.",
        "ja": "おめでとう。努力の成果ですね。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Huge W! You absolutely nailed it.",
        "ja": "大勝利！完璧に決めたね。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "難しい課題・続き",
      "cat": "daily",
      "en": "Should we celebrate with some food?",
      "ja": "何か食べてお祝いしない？",
      "answers": [
        {
          "en": "For sure. You’ve earned it.",
          "ja": "もちろん。そのくらいご褒美があっていいよ。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "LET’S GOOO! Food sounds perfect.",
          "ja": "よっしゃ！ご飯、最高。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Let’s go! I know a good place.",
      "ja": "行こう！いい店を知ってる。"
    },
    "note": "pull it off：難しいことを成功させる。pay off：努力が実を結ぶ。"
  },
  {
    "id": "learning",
    "s": "新しいゲーム",
    "cat": "daily",
    "en": "I can’t get the hang of this game.",
    "ja": "このゲームのコツがつかめない。",
    "answers": [
      {
        "en": "You’ll get there. Let’s try one more round.",
        "ja": "そのうちできるよ。もう一回やろう。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "That sounds reasonable. Please tell me more.",
        "ja": "なるほど。もう少し教えてください。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "No cap, we can figure this out together.",
        "ja": "マジで、一緒に考えたらできるよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "新しいゲーム・続き",
      "cat": "daily",
      "en": "Can you show me how that move works?",
      "ja": "その技、どうやるか見せてくれる？",
      "answers": [
        {
          "en": "Sure. Watch this, then give it a shot.",
          "ja": "もちろん。見てからやってみて。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. I’ll show you, then it’s your turn.",
          "ja": "了解。見せるから、そのあとやってみて。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Oh, that makes sense now. Thanks!",
      "ja": "あ、今分かった。ありがとう！"
    },
    "note": "get the hang of：コツをつかむ。give it a shot：やってみる。"
  },
  {
    "id": "mistake",
    "s": "約束を忘れた",
    "cat": "daily",
    "en": "Did you remember to book our tickets?",
    "ja": "チケットを予約してくれた？",
    "answers": [
      {
        "en": "My bad. I totally forgot.",
        "ja": "ごめん。完全に忘れてた。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I apologize. I forgot to book them.",
        "ja": "すみません。予約するのを忘れました。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "My bad, I screwed up. I forgot to book them.",
        "ja": "ごめん、やらかした。予約を忘れてた。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "約束を忘れた・続き",
      "cat": "daily",
      "en": "Can you check if there are any left?",
      "ja": "まだ残っているか確認してくれる？",
      "answers": [
        {
          "en": "I’m on it. I’ll check right now.",
          "ja": "すぐやる。今確認するね。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "I’m on it, no cap. Checking now.",
          "ja": "マジですぐやる。今確認中。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks. Let me know what you find.",
      "ja": "ありがとう。分かったら教えて。"
    },
    "note": "My bad：自分のミスを認める軽い謝罪。I’m on it：今すぐ取りかかる。"
  },
  {
    "id": "money",
    "s": "出費が多い月",
    "cat": "daily",
    "en": "I’m broke until payday.",
    "ja": "給料日までお金がない。",
    "answers": [
      {
        "en": "I feel you. Let’s keep it low-key.",
        "ja": "分かる。お金をかけずにのんびりしよう。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Real. Let’s do something cheap.",
        "ja": "分かる。安く済むことしよう。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "出費が多い月・続き",
      "cat": "daily",
      "en": "How about hanging out at my place?",
      "ja": "うちで過ごすのはどう？",
      "answers": [
        {
          "en": "Works for me. I’ll bring some snacks.",
          "ja": "いいよ。お菓子を持っていくね。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. Snacks and a chill night it is.",
          "ja": "了解。お菓子食べてのんびりしよう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Great. We don’t need to spend much to have fun.",
      "ja": "いいね。お金を使わなくても楽しめるね。"
    },
    "note": "broke：お金がない。low-key：気張らず控えめに、のんびり。"
  },
  {
    "id": "late",
    "s": "待ち合わせに遅れそう",
    "cat": "daily",
    "en": "I’m running late. The train’s delayed.",
    "ja": "遅れそう。電車が遅れてる。",
    "answers": [
      {
        "en": "No biggie. Thanks for the heads-up.",
        "ja": "大丈夫。知らせてくれてありがとう。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "All good. Thanks for keeping me posted.",
        "ja": "大丈夫。状況を教えてくれてありがとう。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "待ち合わせに遅れそう・続き",
      "cat": "daily",
      "en": "Could you grab a table while you wait?",
      "ja": "待っている間に席を取っておいてくれる？",
      "answers": [
        {
          "en": "You bet. Text me when you get here.",
          "ja": "もちろん。着いたらメッセージして。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "You bet. I’ll get us a table.",
          "ja": "もちろん。席を取っておくよ。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Will do. Thanks for waiting.",
      "ja": "そうするね。待ってくれてありがとう。"
    },
    "note": "No biggie：大したことない。heads-up：事前のお知らせ。"
  },
  {
    "id": "argument",
    "s": "友達とのけんか",
    "cat": "daily",
    "en": "I got worked up and snapped at my friend.",
    "ja": "感情的になって友達にきつく言っちゃった。",
    "answers": [
      {
        "en": "That sounds rough. Maybe talk when you’re calmer.",
        "ja": "大変だったね。落ち着いてから話してみたら。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Oof. Give yourself a minute to chill.",
        "ja": "うわ。まずちょっと落ち着こう。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "友達とのけんか・続き",
      "cat": "daily",
      "en": "Should I apologize for how I said it?",
      "ja": "言い方について謝った方がいいかな？",
      "answers": [
        {
          "en": "Yeah. Own up to it and hear them out.",
          "ja": "うん。認めて、相手の話も最後まで聞こう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Yeah, clear the air. Drama’s not worth it.",
          "ja": "うん、わだかまりを解こう。もめ続けても仕方ない。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "You’re right. I’ll talk to them calmly.",
      "ja": "そうだね。落ち着いて話すよ。"
    },
    "note": "worked up：感情が高ぶった。snap at：人にきつく言う。hear out：最後まで聞く。"
  },
  {
    "id": "decision",
    "s": "迷う買い物",
    "cat": "daily",
    "en": "This jacket’s pricey. Should I buy it?",
    "ja": "このジャケット高い。買うべきかな？",
    "answers": [
      {
        "en": "Sleep on it. No need to rush.",
        "ja": "一晩考えてみたら。急がなくていいよ。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "That sounds reasonable. Please tell me more.",
        "ja": "なるほど。もう少し教えてください。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "No cap, that price is wild. Think it over.",
        "ja": "マジで高すぎ。よく考えよう。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "迷う買い物・続き",
      "cat": "daily",
      "en": "Would you help me find a cheaper one?",
      "ja": "もっと安いものを探すのを手伝ってくれる？",
      "answers": [
        {
          "en": "Sure. Let’s shop around first.",
          "ja": "もちろん。まず他の店も見てみよう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Yes, that sounds like a good plan.",
          "ja": "はい、それはいい案ですね。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. Let’s hunt for a better deal.",
          "ja": "了解。もっと安いのを探そう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Good call. I’ll compare a few options.",
      "ja": "いい考え。いくつか比べてみるね。"
    },
    "note": "sleep on it：一晩考える。Good call：いい判断。shop around：店を比べる。"
  },
  {
    "id": "busy",
    "s": "仕事が多すぎる",
    "cat": "daily",
    "en": "I’ve got way too much on my plate.",
    "ja": "やることを抱えすぎてる。",
    "answers": [
      {
        "en": "That’s a lot. Want me to lend a hand?",
        "ja": "大変だね。手伝おうか？",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "You’re cooked. Let me help with something.",
        "ja": "限界じゃん。何か手伝うよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "仕事が多すぎる・続き",
      "cat": "daily",
      "en": "Could you handle the slides for me?",
      "ja": "スライドを担当してくれる？",
      "answers": [
        {
          "en": "Sure. Send me what you’ve got so far.",
          "ja": "もちろん。今できている分を送って。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "I got you. Send me the slides so far.",
          "ja": "任せて。今のスライドを送って。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "That would take a load off. Thank you.",
      "ja": "それなら負担が軽くなる。ありがとう。"
    },
    "note": "on my plate：抱えている仕事や課題。lend a hand：手を貸す。"
  },
  {
    "id": "secret",
    "s": "相談の前に",
    "cat": "daily",
    "en": "Can I tell you something? Keep it between us.",
    "ja": "話していい？二人だけの秘密にしてね。",
    "answers": [
      {
        "en": "Of course. I’m all ears.",
        "ja": "もちろん。ちゃんと聞くよ。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "Certainly. I will respect your privacy.",
        "ja": "もちろん。秘密は守ります。",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Of course, bestie. Your secret’s safe.",
        "ja": "もちろん。秘密は守るよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "相談の前に・続き",
      "cat": "daily",
      "en": "I might switch jobs. Can I bounce some ideas off you?",
      "ja": "転職するかも。考えを聞いてもらっていい？",
      "answers": [
        {
          "en": "Sure. Talk me through what you’re thinking.",
          "ja": "もちろん。どう考えているか話してみて。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Of course. Spill the tea, I’m listening.",
          "ja": "もちろん。聞くから話して。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks. It helps to talk it out.",
      "ja": "ありがとう。話して整理できると助かる。"
    },
    "note": "I’m all ears：しっかり聞くよ。bounce ideas off：人に考えを聞いてもらう。"
  },
  {
    "id": "awkward",
    "s": "気まずいメッセージ",
    "cat": "daily",
    "en": "I sent that message to the wrong group chat.",
    "ja": "違うグループチャットに送っちゃった。",
    "answers": [
      {
        "en": "Oof, that’s awkward. It happens, though.",
        "ja": "うわ、気まずいね。でもそういうことあるよ。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "Oof, that’s a whole mess. It happens.",
        "ja": "うわ、大惨事。でもそういうことあるよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "気まずいメッセージ・続き",
      "cat": "daily",
      "en": "Should I just say it was a mix-up?",
      "ja": "取り違えたって説明すればいいかな？",
      "answers": [
        {
          "en": "Yeah. Clear it up before people get confused.",
          "ja": "うん。みんなが混乱する前に説明しよう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Yeah, explain the mix-up before it gets messy.",
          "ja": "うん、ややこしくなる前に説明しよう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "I’ll send a quick explanation now.",
      "ja": "今、短く説明を送るね。"
    },
    "note": "mix-up：取り違え、混乱。clear it up：誤解を解く。"
  },
  {
    "id": "friend",
    "s": "友達を励ます",
    "cat": "daily",
    "en": "I blew it in the interview.",
    "ja": "面接、失敗しちゃった。",
    "answers": [
      {
        "en": "That’s rough. One interview doesn’t define you.",
        "ja": "つらいね。でも一度の面接で全部は決まらないよ。",
        "tags": [
          "casual",
          "daily",
          "friendly",
          "empathy",
          "positive",
          "relatable"
        ]
      },
      {
        "en": "I’m sorry about that. How can I help?",
        "ja": "大変でしたね。何か手伝えますか？",
        "tags": [
          "polite",
          "honest",
          "careful",
          "safe",
          "formal"
        ]
      },
      {
        "en": "That’s rough, but you’re not done yet.",
        "ja": "きついね。でもまだ終わりじゃないよ。",
        "tags": [
          "slang",
          "internet",
          "meme",
          "hype",
          "friendly"
        ]
      },
      {
        "en": "Whatever. That’s your problem.",
        "ja": "どうでもいい。君の問題でしょ。",
        "tags": [
          "rude",
          "cold"
        ]
      }
    ],
    "followup": {
      "s": "友達を励ます・続き",
      "cat": "daily",
      "en": "Will you help me practice for the next one?",
      "ja": "次のために練習を手伝ってくれる？",
      "answers": [
        {
          "en": "Definitely. Let’s figure out what tripped you up.",
          "ja": "もちろん。何につまずいたか考えよう。",
          "tags": [
            "casual",
            "daily",
            "friendly",
            "empathy",
            "positive",
            "relatable"
          ]
        },
        {
          "en": "Certainly. I would be happy to help with that.",
          "ja": "もちろん。喜んで協力します。",
          "tags": [
            "polite",
            "honest",
            "careful",
            "safe",
            "formal"
          ]
        },
        {
          "en": "Bet. We’ll level up your answers together.",
          "ja": "了解。一緒に答えをレベルアップしよう。",
          "tags": [
            "slang",
            "internet",
            "meme",
            "hype",
            "friendly"
          ]
        },
        {
          "en": "Whatever. That’s your problem.",
          "ja": "どうでもいい。君の問題でしょ。",
          "tags": [
            "rude",
            "cold"
          ]
        }
      ]
    },
    "ending": {
      "en": "Thanks. I’ll give it another shot.",
      "ja": "ありがとう。また挑戦するよ。"
    },
    "note": "blow it：失敗する。trip someone up：人をつまずかせる。"
  }
];
  if(typeof module === "object" && module.exports) module.exports=conversations;
  else root.SushiTalkConversations=conversations;
})(typeof window !== "undefined" ? window : globalThis);
