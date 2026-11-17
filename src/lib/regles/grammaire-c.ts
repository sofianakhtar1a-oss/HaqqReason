import type { Lecon } from "./types";

/* La Cité des mots (grammaire anglaise) — niveaux C1 et C2. */

export const GRAMMAIRE_C: Lecon[] = [
  /* ===================== C1 ===================== */
  {
    id: "phrase-envers",
    niveau: "C1",
    titre: "La phrase à l'envers",
    notion: "L'inversion après un adverbe négatif",
    heros: "🔃",
    declic: {
      scene: "🎺 🔃 🎩",
      image: "Quand une phrase commence par un mot négatif fort (never, rarely, not only…), le moteur saute devant le sujet, comme dans une question. Effet dramatique garanti.",
      sens: "I have never seen such a mess → Never have I seen such a mess! C'est l'anglais des discours, des écrits soutenus et des examens C1. La phrase n'est pas une question, mais elle en prend l'ordre pour frapper fort.",
    },
    demo: {
      etapes: [
        { p: "[k:Never] [a:have] [s:I] [p:seen] anything like it.", n: "Never en tête → have passe devant I." },
        { p: "[k:Rarely] [a:does] [s:she] [r:complain].", n: "Sans moteur visible, le majordome revient : Rarely does she…" },
        { p: "[k:Not only] [a:did] [s:he] [r:lie], but he also stole.", n: "Not only… but also : l'inversion porte sur la première partie." },
        { p: "[k:Hardly] [a:had] [s:I] [r:arrive][t:d] [k:when] the phone rang.", n: "Hardly / Scarcely … when, No sooner … than : à peine… que." },
        { p: "[k:Under no circumstances] [a:should] [s:you] [r:open] this door.", n: "Under no circumstances, In no way, At no time : une interdiction solennelle." },
      ],
    },
    defi: [
      { q: "« Never ___ such a beautiful sunset. »", o: ["have I seen", "I have seen", "I saw"], i: "Never en tête : le moteur passe devant.", e: "Never have I seen…" },
      { q: "« Not only ___ the exam, but she also got the best mark. »", o: ["did she pass", "she passed", "she did pass"], i: "Pas de moteur visible au passé : le majordome.", e: "Not only did she pass…" },
      { q: "« No sooner had we sat down ___ the lights went out. »", o: ["than", "when", "that"], i: "No sooner va avec un comparatif…", e: "No sooner … than." },
      { q: "Réécris en commençant par « Rarely » : « He rarely goes out. »", r: ["Rarely does he go out"], i: "Rarely + does + sujet + base.", e: "Rarely does he go out." },
      { q: "Touche le mot qui déclenche l'inversion.", p: "*Seldom have I felt so happy.", i: "Le mot négatif placé en tête.", e: "« Seldom » (rarement) : le moteur passe devant." },
    ],
    secret: {
      titre: "Only après…",
      texte: "Les expressions avec « only » déclenchent aussi l'inversion, mais seulement dans la phrase principale : « Only then did I understand », « Only when he left did I realise », « Only after the meeting will we know ». Note que l'inversion se fait après la première partie (Only when he left / did I realise).",
      formule: "Never / Rarely / Not only / Hardly + moteur + sujet + verbe",
    },
  },
  {
    id: "ne-pas-repeter",
    niveau: "C1",
    titre: "L'art de ne pas répéter",
    notion: "L'ellipse et la substitution",
    heros: "✂️",
    declic: {
      scene: "💬 ✂️ 💬",
      image: "Un anglophone déteste répéter. Il remplace des morceaux entiers de phrase par un petit mot : so, do, one, to.",
      sens: "« I love pizza. — So do I! » (moi aussi). « Will it rain? — I hope not. » (j'espère que non). « Would you like to come? — I'd love to. » (avec plaisir). Chaque fois, un mot minuscule remplace toute une idée.",
    },
    demo: {
      etapes: [
        { p: "I'm tired. — [k:So] [a:am] [s:I]. / I'm not tired. — [k:Neither] [a:am] [s:I].", n: "So / Neither + moteur + sujet : moi aussi, moi non plus. Le moteur reprend celui de la phrase." },
        { p: "She plays the piano, and [k:so] [a:does] [s:her] brother.", n: "Sans moteur visible : do, does, did." },
        { p: "Is he coming? — I think [k:so]. / I don't think [k:so]. / I hope [k:not].", n: "so / not remplacent toute une réponse après think, hope, suppose, expect." },
        { p: "Do you want to dance? — I'd love [k:to].", n: "Le « to » seul remplace le verbe déjà dit." },
        { p: "I don't like the red shirt. I prefer the blue [k:one].", n: "one / ones remplacent un nom dénombrable déjà mentionné." },
      ],
    },
    defi: [
      { q: "« I can't swim. — ___ can I. » (moi non plus)", o: ["Neither", "So", "Either"], i: "Une réponse négative.", e: "Neither can I." },
      { q: "« She went to Rome last year, and so ___ I. »", o: ["did", "went", "was"], i: "Pas de moteur visible au passé.", e: "so did I." },
      { q: "« Will you pass? — I hope ___. »", o: ["so", "it", "yes"], i: "On remplace « I will pass ».", e: "I hope so." },
      { q: "« These shoes are too small. Have you got bigger ___? »", o: ["ones", "one", "them"], i: "Un pluriel dénombrable déjà mentionné.", e: "bigger ones." },
      { q: "Complète : « Can you come tomorrow? — I'd like ___, but I can't. »", r: ["to"], i: "Un petit mot remplace « to come ».", e: "I'd like to." },
    ],
    secret: {
      titre: "Le moteur caché",
      texte: "Pour répondre « moi aussi » ou « moi non plus », cherche le moteur de la phrase d'origine : I've finished → So have I. She can drive → So can I. He likes jazz (moteur caché : does) → So do I. Le français dit toujours « moi aussi » ; l'anglais exige le bon moteur à chaque fois.",
      formule: "So + moteur + sujet · Neither + moteur + sujet · I think so · I'd love to",
    },
  },
  {
    id: "relatives-luxe",
    niveau: "C1",
    titre: "Les relatives de luxe",
    notion: "Whom, préposition + which, whereby, whoever, whatever",
    heros: "💎",
    declic: {
      scene: "💎 📜 🖋️",
      image: "Dans les beaux quartiers de la Cité, les relatives s'habillent avec élégance : préposition en tête, whom, whereby.",
      sens: "The man to whom I spoke = The man (who) I spoke to (l'homme à qui j'ai parlé). The system by which… = whereby (par lequel). Dans l'anglais courant, la préposition va à la fin ; dans l'anglais soutenu, elle passe devant le relatif.",
    },
    demo: {
      etapes: [
        { p: "The person [k:to whom] this letter is addressed…", n: "Préposition + whom : très soutenu. Après une préposition, jamais « who »." },
        { p: "The person (who) this letter is addressed [k:to]…", n: "La même idée, en anglais courant : la préposition à la fin." },
        { p: "The house [k:in which] I grew up.", n: "Préposition + which pour une chose. Jamais « in that »." },
        { p: "a system [k:whereby] students can vote online", n: "whereby = par lequel, grâce auquel (style administratif)." },
        { p: "[k:Whoever] wins will get a prize. [k:Whatever] you do, don't panic.", n: "whoever (quiconque), whatever (quoi que), wherever, whenever." },
      ],
    },
    defi: [
      { q: "« The colleague with ___ I work is very helpful. »", o: ["whom", "who", "that"], i: "Après une préposition, en style soutenu.", e: "with whom." },
      { q: "« The company ___ she works is in London. »", o: ["for which", "for that", "which for"], i: "Préposition devant le relatif.", e: "for which." },
      { q: "« ___ you go, I'll follow you. »", o: ["Wherever", "Whatever", "Whoever"], i: "Où que…", e: "Wherever you go." },
      { q: "Réécris en style courant : « the girl to whom I gave the book » → « the girl I gave the book ___ »", r: ["to"], i: "La préposition passe à la fin.", e: "the girl I gave the book to." },
      { q: "« They signed an agreement ___ prices would be fixed. »", o: ["whereby", "whereas", "wherever"], i: "Par lequel (style officiel).", e: "an agreement whereby…" },
    ],
    secret: {
      titre: "Whom est-il mort ?",
      texte: "À l'oral, whom a presque disparu : on dit « Who did you see? ». Il survit dans trois cas : après une préposition (to whom, with whom), dans les lettres formelles (To whom it may concern : à qui de droit), et dans les quantités (some of whom, all of whom, many of whom). Connaître ces trois cas suffit.",
      formule: "préposition + whom / which · whereby · whoever / whatever",
    },
  },
  {
    id: "verbe-devient-nom",
    niveau: "C1",
    titre: "Quand le verbe devient nom",
    notion: "La nominalisation (style formel)",
    heros: "🏛️",
    declic: {
      scene: "🗣️ ➡️ 📑",
      image: "Pour écrire comme un rapport officiel, on transforme les actions (verbes) en choses (noms). La phrase devient plus dense, plus objective.",
      sens: "« The prices increased quickly, which worried people » → The rapid increase in prices caused concern. Les verbes (increase, worry) deviennent des noms (increase, concern). C'est le style des essais, des articles scientifiques et des examens C1.",
    },
    demo: {
      etapes: [
        { p: "They [v:decided] to close the factory. → The [n:decision] to close the factory…", n: "decide → decision." },
        { p: "Prices [v:rose] sharply. → a sharp [n:rise] in prices", n: "L'adverbe (sharply) devient un adjectif (sharp)." },
        { p: "If you [v:fail] to pay… → [n:Failure] to pay will result in…", n: "Typique des contrats et règlements." },
        { p: "We [v:analysed] the data carefully. → A careful [n:analysis] of the data shows…", n: "Le sujet humain disparaît : le texte paraît plus objectif." },
      ],
    },
    defi: [
      { q: "Le nom de « arrive » :", o: ["arrival", "arrivement", "arrivance"], i: "Le suffixe -al.", e: "arrive → arrival." },
      { q: "Le nom de « fail » :", o: ["failure", "failment", "failness"], i: "Le suffixe -ure.", e: "fail → failure." },
      { q: "Version formelle de « Unemployment rose dramatically » :", o: ["There was a dramatic rise in unemployment.", "Unemployment was rising dramatic.", "A dramatically rise of unemployment."], i: "Le verbe devient nom, l'adverbe devient adjectif.", e: "a dramatic rise in unemployment." },
      { q: "Écris le nom de « develop ».", r: ["development"], i: "Le suffixe -ment.", e: "develop → development." },
      { q: "Écris le nom de « refuse ».", r: ["refusal"], i: "Le même suffixe que arrival.", e: "refuse → refusal." },
    ],
    secret: {
      titre: "Avec modération",
      texte: "La nominalisation impressionne dans un essai, mais en excès, elle rend le texte lourd et flou. Les bons écrivains alternent : une phrase nominale pour résumer une idée, une phrase verbale pour raconter. Les guides de style anglais (comme ceux des journaux) conseillent même de préférer les verbes. Sache faire les deux, et choisis selon le lecteur.",
      formule: "-tion · -ment · -al · -ure · -ance / -ence · -ness",
    },
  },
  {
    id: "nuance",
    niveau: "C1",
    titre: "L'art de la nuance",
    notion: "La prudence dans l'expression (hedging)",
    heros: "🌫️",
    declic: {
      scene: "📢 🌫️ 🤔",
      image: "En anglais universitaire et professionnel, on évite d'affirmer trop fort. On enveloppe ses idées dans une brume de prudence.",
      sens: "« This is wrong » sonne agressif. « This would seem to be somewhat inaccurate » sonne sérieux et respectueux. Les anglophones adorent l'atténuation : seem, tend to, arguably, it could be argued that, to some extent.",
    },
    demo: {
      etapes: [
        { p: "The results [k:seem to] confirm the theory.", n: "seem to / appear to : on ne dit pas que c'est sûr." },
        { p: "Young people [k:tend to] spend more online.", n: "tend to : une tendance générale, pas une règle absolue." },
        { p: "This is [k:arguably] his best novel.", n: "arguably : on peut défendre l'idée que…" },
        { p: "[k:It could be argued that] the plan is too ambitious.", n: "Une critique présentée comme une hypothèse." },
        { p: "This is [k:to some extent] true.", n: "to some extent, in a sense, largely : on limite la portée." },
      ],
    },
    defi: [
      { q: "Quelle phrase est la plus nuancée ?", o: ["The data suggest that the policy may have failed.", "The data prove the policy failed.", "The policy failed, obviously."], i: "Cherche les mots de prudence.", e: "suggest + may have : prudence académique." },
      { q: "« Women ___ live longer than men. » (en général)", o: ["tend to", "must", "always"], i: "Une tendance, pas une règle.", e: "tend to : en général." },
      { q: "« This is ___ the most important discovery of the century. » (on peut le soutenir)", o: ["arguably", "argued", "arguing"], i: "Un adverbe.", e: "arguably." },
      { q: "Adoucis : « You are wrong. » → « I'm not ___ that's right. »", r: ["sure", "convinced", "certain"], i: "On exprime un doute plutôt qu'une accusation.", e: "I'm not sure that's right." },
      { q: "Touche le mot qui atténue l'affirmation.", p: "The method is *largely effective.", i: "Il limite la portée de l'affirmation.", e: "« largely » : en grande partie, pas totalement." },
    ],
    secret: {
      titre: "La politesse britannique décodée",
      texte: "Quand un Britannique dit « That's an interesting idea », il pense parfois « je ne suis pas d'accord ». « Not bad » peut vouloir dire « très bien », et « quite good » seulement « correct ». L'art de la nuance est aussi un art de décoder.",
      formule: "seem to · tend to · arguably · it could be argued that · to some extent",
    },
  },
  {
    id: "panneaux",
    niveau: "C1",
    titre: "Les panneaux de l'argumentation",
    notion: "Les connecteurs logiques avancés",
    heros: "🪧",
    declic: {
      scene: "🪧 ➡️ 🧭",
      image: "Dans un texte argumenté, les connecteurs sont des panneaux indicateurs : ils disent au lecteur où va la pensée.",
      sens: "Ajouter : moreover, furthermore, in addition. Opposer : nevertheless, nonetheless, on the other hand. Conséquence : therefore, consequently, thus, hence. Condition : provided that, as long as, unless. Avec eux, ton anglais écrit passe au niveau supérieur.",
    },
    demo: {
      etapes: [
        { p: "The plan is expensive. [k:Moreover], it is risky.", n: "Moreover / Furthermore : de plus (on ajoute un argument)." },
        { p: "It was difficult. [k:Nevertheless], we succeeded.", n: "Nevertheless / Nonetheless : néanmoins." },
        { p: "Sales fell; [k:consequently], jobs were cut.", n: "Consequently / Therefore / Thus : par conséquent." },
        { p: "You can borrow my car [k:provided that] you drive carefully.", n: "provided (that) / as long as : à condition que." },
        { p: "[k:On the one hand], it's cheap. [k:On the other hand], it's slow.", n: "La structure d'un débat équilibré." },
      ],
    },
    defi: [
      { q: "« The hotel was cheap. ___, it was close to the beach. » (de plus)", o: ["Moreover", "Nevertheless", "Therefore"], i: "On ajoute un avantage.", e: "Moreover : de plus." },
      { q: "« He had no experience. ___, he got the job. »", o: ["Nevertheless", "Furthermore", "Thus"], i: "Une opposition surprenante.", e: "Nevertheless : néanmoins." },
      { q: "« You can go out ___ you're back by midnight. »", o: ["as long as", "unless", "whereas"], i: "À condition que.", e: "as long as / provided that." },
      { q: "« The road was icy; ___, the race was cancelled. »", o: ["therefore", "however", "moreover"], i: "Une conséquence.", e: "therefore : donc." },
      { q: "Complète : « On the one hand, cities are exciting. On the ___ hand, they're noisy. »", r: ["other"], i: "La deuxième main.", e: "On the other hand." },
    ],
    secret: {
      titre: "Le faux ami « on the contrary »",
      texte: "« On the other hand » présente un autre aspect (d'un autre côté). « On the contrary » contredit totalement ce qui précède : « Is he lazy? — On the contrary, he works all the time! ». Les francophones disent « au contraire » à la place de « en revanche », mais en anglais, on the contrary est une vraie contradiction.",
      formule: "moreover · nevertheless · therefore · provided that · on the other hand",
    },
  },
  {
    id: "couples-inseparables",
    niveau: "C1",
    titre: "Les couples inséparables",
    notion: "Les collocations",
    heros: "💞",
    declic: {
      scene: "💞 ☕ 🌧️",
      image: "Dans la Cité, certains mots vivent toujours en couple. Les séparer, ça ne se fait pas : la phrase reste compréhensible, mais elle sonne étrangère.",
      sens: "On dit « strong coffee » (pas « powerful coffee »), « heavy rain » (pas « strong rain »), « make a decision » (bien plus courant que « take a decision »), « highly likely », « deeply sorry ». Ces couples, les collocations, sont le secret d'un anglais naturel.",
    },
    demo: {
      etapes: [
        { p: "[j:heavy] [n:rain] · [j:heavy] [n:traffic] · a [j:heavy] [n:smoker]", n: "heavy pour l'intensité de certaines choses." },
        { p: "[j:strong] [n:coffee] · a [j:strong] [n:accent] · [j:strong] [n:wind]", n: "strong pour d'autres." },
        { p: "[v:make] a decision · [v:pay] attention · [v:take] a photo · [v:catch] a cold", n: "Des verbes qui vont avec certains noms." },
        { p: "[k:highly] likely · [k:deeply] sorry · [k:bitterly] cold · [k:fully] aware", n: "Des adverbes qui renforcent certains adjectifs." },
      ],
    },
    defi: [
      { q: "« There was ___ rain all night. »", o: ["heavy", "strong", "big"], i: "La pluie forte.", e: "heavy rain." },
      { q: "« Please ___ attention to the instructions. »", o: ["pay", "do", "make"], i: "Faire attention.", e: "pay attention." },
      { q: "« It's ___ likely that he'll win. »", o: ["highly", "strongly", "heavily"], i: "Très probable.", e: "highly likely." },
      { q: "« I think I've ___ a cold. »", o: ["caught", "taken", "made"], i: "Attraper un rhume.", e: "catch a cold." },
      { q: "Complète : « She has a ___ French accent. » (fort)", r: ["strong", "heavy", "thick"], i: "Un accent marqué.", e: "a strong (ou heavy, thick) accent." },
      { q: "Touche le mot qui ne forme pas un bon couple.", p: "I drink *powerful coffee every morning.", i: "Le café fort.", e: "strong coffee." },
    ],
    secret: {
      titre: "Apprends les mots par deux",
      texte: "Au lieu de noter « decision = décision », note « make a decision », « a difficult decision », « reach a decision ». Les dictionnaires de collocations (comme l'Oxford Collocations Dictionary) sont l'outil secret des traducteurs. Chaque nouveau mot appris avec ses partenaires vaut trois mots appris seuls.",
      formule: "heavy rain · strong coffee · make a decision · highly likely",
    },
  },

  /* ===================== C2 ===================== */
  {
    id: "deux-costumes",
    niveau: "C2",
    titre: "Les deux costumes de l'anglais",
    notion: "Le registre : formel et familier",
    heros: "🎩",
    declic: {
      scene: "👕 🎩 🔁",
      image: "L'anglais a deux garde-robes : les mots courts d'origine germanique pour le quotidien, et les mots longs d'origine latine pour le formel.",
      sens: "« We need to find out » (familier) / « We need to ascertain » (formel). « Put off » / « postpone ». « Get » / « obtain ». « Buy » / « purchase ». Le francophone a un avantage : les mots formels ressemblent au français. Mais s'il ne parle qu'avec eux, il sonne comme un dictionnaire.",
    },
    demo: {
      etapes: [
        { p: "[v:find out] ↔ [v:discover] · [v:put off] ↔ [v:postpone] · [v:go up] ↔ [v:increase]", n: "Le phrasal verb (familier) et son jumeau latin (formel)." },
        { p: "[v:get] ↔ [v:obtain] · [v:help] ↔ [v:assist] · [v:ask] ↔ [v:enquire] · [v:need] ↔ [v:require]", n: "Les mots courts sont plus chaleureux, les longs plus distants." },
        { p: "I'm sorry I can't come. ↔ I regret that I am unable to attend.", n: "Le formel évite les contractions et préfère les tournures impersonnelles." },
        { p: "Thanks a lot! ↔ I would be most grateful.", n: "Choisis le costume selon la situation : un ami, ou un recruteur." },
      ],
    },
    defi: [
      { q: "Le jumeau formel de « put off » :", o: ["postpone", "put down", "delay off"], i: "Reporter, en style officiel.", e: "put off = postpone." },
      { q: "Le jumeau familier de « tolerate » :", o: ["put up with", "put on", "take in"], i: "Un phrasal verb à trois éléments.", e: "tolerate = put up with." },
      { q: "Dans une lettre de motivation, laquelle est la mieux adaptée ?", o: ["I would welcome the opportunity to discuss my application.", "I'd love to chat about the job!", "Wanna talk about it?"], i: "Le costume formel.", e: "Pas de contraction, vocabulaire soutenu." },
      { q: "Le jumeau familier de « purchase » :", r: ["buy"], i: "Un verbe très court.", e: "purchase = buy." },
      { q: "Touche le mot trop formel pour un message à un ami.", p: "Hey, can you *assist me with my homework?", i: "Entre amis, on prend le mot court.", e: "help me." },
    ],
    secret: {
      titre: "L'héritage de 1066",
      texte: "Après la conquête normande de 1066, l'élite d'Angleterre parlait français pendant que le peuple parlait anglais. D'où les paires : cow (l'animal, au champ) / beef (la viande, à table, du français « bœuf »), pig / pork, sheep / mutton. Aujourd'hui encore, les mots d'origine française sonnent plus « chics ». Ton français est un super-pouvoir pour le registre formel.",
      formule: "familier : germanique, phrasal verbs · formel : latin, mots longs",
    },
  },
  {
    id: "images-parlent",
    niveau: "C2",
    titre: "Les images qui parlent",
    notion: "Les expressions idiomatiques",
    heros: "🐘",
    declic: {
      scene: "🌧️ 🐈 🐕",
      image: "Les idioms sont des images folles que personne ne prend au pied de la lettre : « it's raining cats and dogs » (il pleut des cordes).",
      sens: "Chaque langue a ses images. Le français « coûter les yeux de la tête » devient « cost an arm and a leg » (un bras et une jambe). Comprendre les idioms, c'est comprendre l'humour, les films et les conversations entre natifs.",
    },
    demo: {
      etapes: [
        { p: "It [k:costs an arm and a leg].", n: "Ça coûte les yeux de la tête." },
        { p: "Let's [k:call it a day].", n: "On s'arrête là pour aujourd'hui." },
        { p: "You [k:hit the nail on the head].", n: "Tu as mis le doigt dessus (exactement)." },
        { p: "It's [k:a piece of cake].", n: "C'est du gâteau (très facile). La même image qu'en français !" },
        { p: "Don't [k:beat around the bush].", n: "Ne tourne pas autour du pot." },
      ],
    },
    defi: [
      { q: "Que veut dire « to break the ice » ?", o: ["Détendre l'atmosphère, briser la glace.", "Casser quelque chose.", "Avoir froid."], i: "La même image qu'en français.", e: "break the ice = briser la glace." },
      { q: "« I'm feeling a bit ___ the weather. » (pas en forme)", o: ["under", "over", "below"], i: "Sous la météo…", e: "under the weather = patraque." },
      { q: "Que veut dire « Once in a blue moon » ?", o: ["Très rarement.", "La nuit.", "Toujours."], i: "Une lune bleue, c'est rare.", e: "once in a blue moon = tous les trente-six du mois." },
      { q: "« Coûter les yeux de la tête » se dit :", o: ["cost an arm and a leg", "cost the eyes of the head", "cost a fortune of eyes"], i: "Une autre partie du corps.", e: "cost an arm and a leg." },
      { q: "Complète : « Break a ___! » (bonne chance, au théâtre)", r: ["leg"], i: "Une superstition : on ne souhaite jamais « good luck » aux acteurs.", e: "Break a leg! = merde ! (au théâtre)." },
    ],
    secret: {
      titre: "Ne les traduis jamais mot à mot",
      texte: "« Il pleut des cordes » → it's raining ropes ? Non ! it's pouring / raining cats and dogs. « Avoir un chat dans la gorge » → have a frog in one's throat (une grenouille). Les idioms se traduisent par l'image, jamais par les mots. Et utilise-les avec modération : trop d'idioms dans une phrase sonne comique.",
      formule: "image anglaise ≠ image française : traduis le sens, pas les mots",
    },
  },
  {
    id: "mots-cameleons",
    niveau: "C2",
    titre: "Les mots caméléons",
    notion: "La conversion et la formation des mots",
    heros: "🦎",
    declic: {
      scene: "🦎 🔁 🔤",
      image: "En anglais, un mot peut changer de classe sans changer de forme : un nom devient verbe, un verbe devient nom. Un vrai caméléon.",
      sens: "a google → to google. an email → to email. to run → a run. a must (un incontournable). Et avec les préfixes et suffixes, on fabrique des familles entières : happy, unhappy, happiness, happily.",
    },
    demo: {
      etapes: [
        { p: "I'll [v:email] you. · Let's [v:google] it. · She [v:texted] me.", n: "Un nom devient verbe, sans rien changer." },
        { p: "Let's go for a [n:run]. · Give it a [n:try]. · That film is a [n:must].", n: "Un verbe devient nom." },
        { p: "[k:un]happy · [k:dis]agree · [k:mis]understand · [k:over]sleep · [k:re]write", n: "Les préfixes : un- (contraire), dis-, mis- (mal), over- (trop), re- (de nouveau)." },
        { p: "kind[k:ness] · child[k:hood] · friend[k:ship] · use[k:less] · wash[k:able]", n: "Les suffixes : -ness, -hood, -ship (noms), -less (sans), -able (qu'on peut)." },
        { p: "the [x:haves] and the [x:have-nots]", n: "Même des verbes deviennent des noms : les nantis et les démunis." },
      ],
    },
    defi: [
      { q: "Dans « Can you text me later? », « text » est :", o: ["un verbe", "un nom", "un adjectif"], i: "Il suit « can you ».", e: "text est utilisé comme verbe : envoyer un SMS." },
      { q: "Le contraire de « possible » :", o: ["impossible", "unpossible", "dispossible"], i: "Comme en français.", e: "impossible." },
      { q: "Le nom formé sur « friend » qui veut dire « amitié » :", o: ["friendship", "friendness", "friendhood"], i: "Le suffixe des relations.", e: "friendship." },
      { q: "Écris l'adjectif « sans espoir » (hope + suffixe).", r: ["hopeless"], i: "-less = sans.", e: "hopeless." },
      { q: "« I ___ the instructions. » (j'ai mal compris)", o: ["misunderstood", "disunderstood", "ununderstood"], i: "Le préfixe qui veut dire « mal ».", e: "misunderstood." },
    ],
    secret: {
      titre: "La langue qui s'invente chaque jour",
      texte: "La conversion est la façon la plus rapide dont l'anglais crée des mots : to Zoom, to friend (sur un réseau social), to adult (se comporter en adulte). Si tu entends un nom utilisé comme verbe, ne t'étonne pas : c'est l'anglais en train de vivre. Shakespeare lui-même l'a fait des centaines de fois.",
      formule: "nom ↔ verbe sans changement · préfixes un-, dis-, mis-, re- · suffixes -ness, -less, -ship",
    },
  },
  {
    id: "deux-rives",
    niveau: "C2",
    titre: "Les deux rives de l'Atlantique",
    notion: "Anglais britannique et anglais américain",
    heros: "🌊",
    declic: {
      scene: "🇬🇧 🌊 🇺🇸",
      image: "Une seule langue, deux rives : l'anglais britannique et l'anglais américain se comprennent parfaitement, mais ont chacun leurs habitudes.",
      sens: "Vocabulaire : flat / apartment, lift / elevator, holiday / vacation. Orthographe : colour / color, centre / center, travelled / traveled. Grammaire : Have you got…? / Do you have…?, I've just eaten / I just ate. Choisis une rive, et reste cohérent.",
    },
    demo: {
      etapes: [
        { p: "🇬🇧 [n:flat] · [n:lift] · [n:biscuit] · [n:autumn] → 🇺🇸 [n:apartment] · [n:elevator] · [n:cookie] · [n:fall]", n: "Le vocabulaire du quotidien." },
        { p: "🇬🇧 col[k:our] · cent[k:re] · organi[k:se] → 🇺🇸 col[k:or] · cent[k:er] · organi[k:ze]", n: "L'orthographe : -our / -or, -re / -er, -ise / -ize." },
        { p: "🇬🇧 Have you [k:got] a car? → 🇺🇸 Do you [k:have] a car?", n: "La possession." },
        { p: "🇬🇧 I've [k:just] eaten. → 🇺🇸 I [k:just] ate.", n: "Les Américains utilisent plus souvent le past simple avec just, already, yet." },
        { p: "🇬🇧 The team [k:are] winning. → 🇺🇸 The team [k:is] winning.", n: "Les noms collectifs : souvent pluriel en Grande-Bretagne, singulier aux États-Unis." },
      ],
    },
    defi: [
      { q: "Le mot américain pour « lift » (ascenseur) :", o: ["elevator", "escalator", "raiser"], i: "Il élève les gens.", e: "elevator (US) = lift (UK)." },
      { q: "L'orthographe britannique de « color » :", o: ["colour", "coulor", "colore"], i: "-or devient -our.", e: "colour (UK)." },
      { q: "Le mot britannique pour « vacation » :", o: ["holiday", "leave day", "break time"], i: "Les Britanniques partent en…", e: "holiday (UK) = vacation (US)." },
      { q: "Écris le mot américain pour « autumn ».", r: ["fall"], i: "Les feuilles tombent…", e: "fall (US) = autumn (UK)." },
      { q: "Quelle phrase est typiquement américaine ?", o: ["Did you eat yet?", "Have you got a pen?", "I've already finished."], i: "Le past simple avec yet.", e: "Did you eat yet? : très américain. Les Britanniques diraient « Have you eaten yet? »." },
    ],
    secret: {
      titre: "Les pièges entre les rives",
      texte: "Quelques mots changent complètement de sens : pants = pantalon (US) mais slip (UK) ! chips = frites (UK) mais chips (US, qui disent fries pour les frites). first floor = premier étage (UK) mais rez-de-chaussée (US). Un dernier conseil : aucune rive n'est « la bonne ». Choisis-en une pour écrire, et comprends les deux.",
      formule: "UK : colour, flat, holiday · US : color, apartment, vacation",
    },
  },
];
