import type { Ajout } from "./types";

/*
 * La Machine à voyager dans le temps — leçons ajoutées aux niveaux B1 et B2.
 * Chacune prend place juste après la leçon qu'elle prolonge (« apres »), sans rien retirer.
 */

export const CONJUGAISON_PLUS_B: Ajout[] = [
  /* ===================== B1 ===================== */
  {
    apres: "trois-horloges",
    lecon: {
      id: "premiere-fois",
      niveau: "B1",
      titre: "C'est la première fois",
      notion: "It's the first time I've…, the best… I've ever…",
      heros: "🥇",
      declic: {
        scene: "🛫 🗼 ✨",
        image: "Après « c'est la première fois que » et après un superlatif, l'anglais fait le bilan de toute ta vie jusqu'à maintenant : il lui faut le pont du present perfect.",
        sens: "Le français dit « C'est la première fois que je viens ici » (au présent). L'anglais dit It's the first time I've been here : depuis ta naissance jusqu'à aujourd'hui, c'est une expérience nouvelle. Même logique avec « le meilleur film que j'aie jamais vu » : the best film I've ever seen.",
      },
      demo: {
        etapes: [
          { p: "It's the first time [s:I][a:'ve] [p:been] here.", n: "It's the first / second / third time + present perfect. Jamais « It's the first time I come »." },
          { p: "This is the first time [s:she][a:'s] [p:driven] a car.", n: "Le sujet change, la règle reste : has + participe." },
          { p: "It's the best pizza [s:I][a:'ve] [k:ever] [p:eaten].", n: "Superlatif + present perfect + ever : de toute ma vie." },
          { p: "It was the first time [s:I] [a:had] [p:seen] snow.", n: "Raconté au passé, le pont recule d'un cran : past perfect (had + participe)." },
          { p: "[s:I] [a:have] [k:never] [p:tasted] anything like it!", n: "Même idée avec never : jamais de ma vie, jusqu'à maintenant." },
        ],
        machine: { temps: ["presentPerfect", "pastPerfect"], verbes: ["be", "see", "eat"] },
      },
      defi: [
        {
          q: "« It's the first time I ___ sushi. »",
          o: ["have eaten", "eat", "am eating"],
          i: "C'est la première fois… : toute ta vie jusqu'à maintenant.",
          e: "It's the first time I've eaten sushi.",
          io: { eat: "Traduction mot à mot du présent français. L'anglais veut le present perfect : I've eaten." },
        },
        { q: "« This is the most beautiful place I ___. »", o: ["have ever visited", "ever visit", "visited ever"], i: "Un superlatif appelle le pont du present perfect.", e: "the most beautiful place I've ever visited." },
        {
          q: "Traduis : « C'est la première fois que je viens ici. »",
          r: [
            "It's the first time I've been here",
            "It is the first time I have been here",
            "This is the first time I've been here",
            "It's the first time I've come here",
            "It is the first time I have come here",
            "This is the first time I've come here",
          ],
          i: "It's the first time + I've + participe de be (ou de come).",
          e: "It's the first time I've been here.",
        },
        { q: "« It was the first time she ___ a horse. »", o: ["had ridden", "has ridden", "rides"], i: "Le récit est au passé : le pont recule.", e: "It was the first time she had ridden a horse." },
        { q: "Complète avec le participe de see : « It's the worst film I've ever ___. »", r: ["seen"], i: "see, saw, …", e: "the worst film I've ever seen." },
        { q: "Touche les deux mots qui forment le present perfect.", p: "It's the second time we *have *met.", i: "have + participe.", e: "we have met : le pont du present perfect." },
      ],
      secret: {
        titre: "Le présent français, le pont anglais",
        texte: "Trois phrases françaises au présent demandent le present perfect en anglais : « Je te connais depuis des années » (I've known you for years), « C'est la première fois que je vois ça » (It's the first time I've seen this), et « C'est le meilleur gâteau que j'aie jamais mangé » (the best cake I've ever eaten). Dès que tu fais le bilan d'une vie jusqu'à maintenant, construis le pont.",
        formule: "It's the first time + present perfect · the best… + I've ever + participe",
      },
    },
  },
  {
    apres: "passe-du-passe",
    lecon: {
      id: "be-used-to",
      niveau: "B1",
      titre: "Prendre le pli",
      notion: "Be used to, get used to + -ing (à ne pas confondre avec used to)",
      heros: "🧦",
      declic: {
        scene: "🇬🇧 🚗 ↔️",
        image: "« Be used to », c'est une vieille paire de chaussons : on y est habitué, on ne la sent même plus. « Get used to », c'est le moment où des chaussons neufs commencent à se faire.",
        sens: "I'm used to driving on the left (j'ai l'habitude, c'est facile pour moi). I'm getting used to it (je m'y habitue, petit à petit). Rien à voir avec « I used to drive » (avant, je conduisais). Ici, le petit mot to est une préposition : il est suivi d'un nom ou d'un verbe en -ing.",
      },
      demo: {
        etapes: [
          { p: "[s:I] [a:am] [v:used] [k:to] [r:work][t:ing] at night.", n: "be used to + -ing : j'ai l'habitude de (ce n'est plus difficile)." },
          { p: "[s:She] [a:isn't] [v:used] [k:to] the cold.", n: "Après to, un nom marche aussi : the cold, spicy food, the noise." },
          { p: "[s:We][a:'re] [v:getting] [v:used] [k:to] [r:liv][t:ing] in London.", n: "get used to : s'habituer (le changement est en cours)." },
          { p: "[s:You][a:'ll] [v:get] [v:used] [k:to] it.", n: "Tu t'y feras ! get used to se conjugue à tous les temps." },
          { p: "[s:I] [v:used] [k:to] [r:smoke]. ≠ [s:I][a:'m] [v:used] [k:to] [r:smok][t:ing].", n: "used to + base = avant, je fumais (c'est fini). be used to + -ing = j'ai l'habitude de fumer." },
        ],
      },
      defi: [
        { q: "« He's from Canada, so he's used to ___ in the snow. »", o: ["driving", "drive", "drove"], i: "be used to : to est une préposition.", e: "be used to driving." },
        { q: "« When I was young, I ___ play the piano. » (je n'en joue plus)", o: ["used to", "am used to", "got used to"], i: "Une habitude passée, terminée.", e: "I used to play the piano." },
        { q: "« It's hard at first, but you'll ___ it. »", o: ["get used to", "use to", "be use to"], i: "Le changement : s'habituer.", e: "You'll get used to it." },
        { q: "Complète : « I'm not used to (get) up so early. »", r: ["getting"], i: "Après be used to, le verbe prend -ing.", e: "I'm not used to getting up so early." },
        {
          q: "Traduis : « Elle s'habitue à son nouveau travail. »",
          r: ["She is getting used to her new job", "She's getting used to her new job", "She is getting used to her new work", "She's getting used to her new work"],
          i: "be + getting used to + nom.",
          e: "She's getting used to her new job.",
        },
        { q: "Touche le mot qui est mal formé.", p: "I'm used to *work late.", i: "Après la préposition to…", e: "I'm used to working late (to + -ing)." },
      ],
      secret: {
        titre: "Le test du nom",
        texte: "Pour savoir si to est une préposition, essaie de mettre un nom à la place du verbe. « I'm used to the noise » fonctionne : to est une préposition, donc le verbe prendra -ing (I'm used to sleeping with noise). Même test pour look forward to et object to : I look forward to seeing you, jamais « to see you ».",
        formule: "be / get used to + nom ou verbe-ing · used to + base (autrefois)",
      },
    },
  },
  {
    apres: "quatre-futurs",
    lecon: {
      id: "quand-je-serai",
      niveau: "B1",
      titre: "Le rail du futur",
      notion: "Le futur après when, as soon as, until, before, after",
      heros: "🚆",
      declic: {
        scene: "🎓 ⏳ ✈️",
        image: "Dans une phrase sur le futur, will ne monte qu'une seule fois dans le train : la partie avec when, as soon as ou until reste au présent.",
        sens: "Le français dit « Quand je serai grand, je serai pilote » : deux futurs. L'anglais dit When I grow up, I'll be a pilot : un seul futur. Après when, as soon as, before, after, until, once ou by the time, on met le present simple (ou le present perfect si l'action sera finie).",
      },
      demo: {
        etapes: [
          { p: "[k:When] [s:I] [r:grow] up, [s:I][a:'ll] [r:be] a pilot.", n: "when + présent, puis will : jamais « when I will grow up »." },
          { p: "[r:Call] me [k:as soon as] [s:you] [r:arrive].", n: "as soon as = dès que. Le français dit « dès que tu arriveras »." },
          { p: "[s:We][a:'ll] [r:wait] [k:until] [s:she] [r:come][t:s] back.", n: "until = jusqu'à ce que. Le présent, là aussi." },
          { p: "[s:I][a:'ll] [r:tell] you [k:when] [s:I] [a:have] [p:finished].", n: "Si l'action sera finie : present perfect (quand j'aurai fini)." },
          { p: "[k:Before] [s:you] [r:leave], [r:close] the windows.", n: "before, after, once, by the time : même règle." },
        ],
        machine: { temps: ["presentSimple", "presentPerfect", "futureSimple"], verbes: ["arrive", "finish", "come"] },
      },
      defi: [
        {
          q: "« I'll phone you when I ___ home. »",
          o: ["get", "will get", "got"],
          i: "Après when, au futur, on met…",
          e: "when I get home.",
          io: { "will get": "C'est le réflexe français (« quand j'arriverai »). Après when, l'anglais met le présent." },
        },
        { q: "« As soon as she ___ her exams, she'll travel. » (quand elle les aura finis)", o: ["has finished", "will have finished", "will finish"], i: "L'action sera terminée avant l'autre.", e: "As soon as she has finished her exams, she'll travel." },
        { q: "Complète : « Stay here until I (come) back. »", r: ["come"], i: "until + present simple.", e: "Stay here until I come back." },
        {
          q: "Traduis : « Quand je serai riche, j'achèterai une maison. »",
          r: ["When I am rich, I will buy a house", "I will buy a house when I am rich"],
          i: "Un seul will, dans la partie sans when.",
          e: "When I'm rich, I'll buy a house.",
        },
        { q: "Touche le mot en trop.", p: "We'll start the meeting when everybody *will arrive.", i: "Le futur ne s'écrit qu'une fois.", e: "when everybody arrives." },
        { q: "« By the time you ___ this letter, I'll be in Paris. »", o: ["read", "will read", "would read"], i: "By the time (d'ici à ce que) fait partie de la famille de when.", e: "By the time you read this letter, I'll be in Paris." },
      ],
      secret: {
        titre: "Une seule fois « will »",
        texte: "Le présent n'est obligatoire que si when, as soon as ou until introduisent un moment. Si when ouvre une vraie question, will revient : « When will you arrive? » (Quand arriveras-tu ?). Et dans « I don't know when he will come » (je ne sais pas quand il viendra), when introduit une question indirecte : will y est permis.",
        formule: "When / as soon as / until / before / after + présent (ou present perfect), will + base",
      },
    },
  },
  {
    apres: "monde-envers",
    lecon: {
      id: "peut-etre",
      niveau: "B1",
      titre: "Peut-être…",
      notion: "May, might, could : le possible",
      heros: "🎲",
      declic: {
        scene: "🌤️ ☔ 🤷",
        image: "May, might et could sont les modaux du « peut-être » : ils ouvrent une porte sans promettre qu'on la franchira.",
        sens: "It might rain this afternoon (il se peut qu'il pleuve). She may be at home (elle est peut-être chez elle). Comme tous les modaux : pas de -s, pas de to, toujours suivis de la base. Plus on est sûr, plus on monte : might → may → will.",
      },
      demo: {
        etapes: [
          { p: "[s:It] [a:might] [r:rain] this afternoon.", n: "might + base : c'est possible, sans plus." },
          { p: "[s:She] [a:may] [r:be] at home.", n: "may : un peu plus probable que might, et un peu plus soutenu." },
          { p: "[s:We] [a:could] [r:go] to the beach tomorrow.", n: "could : une possibilité, souvent une idée qu'on propose." },
          { p: "[s:I] [a:might] [k:not] [r:come]. · [s:He] [a:may] [k:not] [r:know].", n: "La négation : might not, may not (peut-être pas). Attention : couldn't = impossible, ce n'est pas la même idée !" },
          { p: "[k:Maybe] he's right. = [s:He] [a:may] [r:be] right.", n: "maybe (adverbe, un seul mot, en tête) = peut-être. may be (modal + be, deux mots) = il se peut qu'il soit." },
        ],
      },
      defi: [
        { q: "« Take an umbrella. It ___ rain later. »", o: ["might", "mights", "might to"], i: "Un modal ne prend ni -s ni to.", e: "It might rain later." },
        { q: "« ___ she's at the library. »", o: ["Maybe", "May be", "Might"], i: "En tête de phrase, devant un sujet et un verbe, il faut l'adverbe.", e: "Maybe she's at the library = She may be at the library." },
        { q: "« I'm not sure, but I ___ go to the party. »", o: ["may", "must", "will"], i: "Tu n'es pas sûr.", e: "I may go to the party (peut-être)." },
        { q: "Traduis avec might : « Il se peut qu'ils soient en retard. »", r: ["They might be late"], i: "might + be.", e: "They might be late." },
        {
          q: "Quelle phrase dit que c'est impossible ?",
          o: ["She can't be at home: I've just seen her in town.", "She might not be at home.", "She may not be at home."],
          i: "might not / may not = peut-être pas. Il faut le modal de l'impossible.",
          e: "can't = impossible ; might not / may not = peut-être pas.",
        },
        { q: "Touche le modal du « peut-être ».", p: "We *might move to Spain next year.", i: "Le modal le plus prudent.", e: "might = peut-être." },
      ],
      secret: {
        titre: "Le thermomètre de la certitude",
        texte: "Range les modaux comme sur un thermomètre : will (sûr) → should (probable) → may (possible) → might / could (possible, sans plus) → might not (peut-être pas) → can't (impossible). Ajouter well renforce la probabilité : « It may well rain » = il y a de fortes chances qu'il pleuve.",
        formule: "may / might / could + base = peut-être · maybe = adverbe",
      },
    },
  },
  {
    apres: "peut-etre",
    lecon: {
      id: "pouvoir-hier",
      niveau: "B1",
      titre: "Le pouvoir dans le temps",
      notion: "Could, was able to, managed to, will be able to",
      heros: "🦸",
      declic: {
        scene: "👶 🏊 🏆",
        image: "Can est un super-pouvoir qui ne sait pas voyager seul. Pour l'emmener dans le futur ou au present perfect, il emprunte un costume : be able to.",
        sens: "Can n'existe qu'au présent, et could sert pour le passé en général. Pour le futur ou le present perfect, on utilise be able to : I'll be able to drive next year, I haven't been able to sleep. Et pour une réussite précise, une fois dans le passé : was able to ou managed to (réussir à).",
      },
      demo: {
        etapes: [
          { p: "[s:She] [a:could] [r:read] when she was four.", n: "could : une capacité générale dans le passé (elle savait lire)." },
          { p: "[s:I] [a:was] [a:able] [k:to] [r:open] the door. · [s:I] [r:manag][t:ed] [k:to] [r:open] it.", n: "Une réussite précise, une fois, malgré une difficulté : was able to / managed to, pas could." },
          { p: "[s:He] [a:couldn't] [r:find] his keys.", n: "À la négative, couldn't marche partout, même pour une fois précise." },
          { p: "[s:You][a:'ll] [a:be] [a:able] [k:to] [r:speak] English soon.", n: "Le futur de can : will be able to (jamais « will can »)." },
          { p: "[s:I] [a:haven't] [a:been] [a:able] [k:to] [r:sleep] lately.", n: "Au present perfect : have been able to." },
        ],
      },
      defi: [
        { q: "« Next year, I ___ drive. »", o: ["will be able to", "will can", "can will"], i: "can ne voyage pas seul vers le futur.", e: "I will be able to drive." },
        {
          q: "« The fire was huge, but everybody ___ escape. »",
          o: ["managed to", "could", "can"],
          i: "Une réussite précise, une fois, malgré la difficulté.",
          e: "Everybody managed to escape (ou was able to escape).",
          io: { could: "could = une capacité générale (savoir faire). Pour une réussite précise, une fois : managed to ou was able to." },
        },
        { q: "« When I was a child, I ___ swim very well. »", o: ["could", "managed to", "will be able to"], i: "Une capacité générale, pendant toute une période.", e: "I could swim very well." },
        { q: "Mets au present perfect : « I (not / be able to) call you. »", r: ["haven't been able to", "I haven't been able to call you"], i: "have + been able to.", e: "I haven't been able to call you." },
        { q: "Traduis avec managed : « Elle a réussi à trouver un appartement. »", r: ["She managed to find an apartment", "She managed to find a flat"], i: "managed + to + base.", e: "She managed to find a flat (an apartment)." },
        { q: "Touche l'erreur.", p: "I *will can help you tomorrow.", i: "Deux modaux ne se suivent jamais.", e: "I will be able to help you tomorrow (ou simplement : I can help you tomorrow)." },
      ],
      secret: {
        titre: "Savoir et réussir",
        texte: "Le français dit « je pouvais » (capacité) et « j'ai pu » (réussite). L'anglais fait la même différence : I could ski (je savais skier) / I was able to ski down the black slope yesterday (j'ai pu, j'ai réussi). Avec les verbes des sens (see, hear, smell…), could reste naturel même pour une seule fois : I could see the sea from my room.",
        formule: "could (passé général) · was able to / managed to (réussite précise) · will be able to · have been able to",
      },
    },
  },
  {
    apres: "pouvoir-hier",
    lecon: {
      id: "mieux-vaut",
      niveau: "B1",
      titre: "Tu ferais mieux de…",
      notion: "Had better, be supposed to",
      heros: "⚠️",
      declic: {
        scene: "⏰ 🏃 ⚠️",
        image: "« You'd better » est un conseil avec un panneau danger : si tu ne le suis pas, il y aura un problème.",
        sens: "You'd better hurry, or you'll miss the train (tu ferais mieux de te dépêcher). Had better est plus fort que should : il annonce une conséquence. Et « be supposed to » dit ce qui est prévu ou attendu : I'm supposed to work today (je suis censé travailler).",
      },
      demo: {
        etapes: [
          { p: "[s:You][a:'d] [a:better] [r:hurry]!", n: "'d better = had better + base. Malgré « had », ce n'est pas du passé : ça parle de maintenant." },
          { p: "[s:We][a:'d] [a:better] [k:not] [r:be] late.", n: "La négation : had better not + base (pas « hadn't better »)." },
          { p: "[s:I][a:'m] [v:supposed] [k:to] [r:start] at nine.", n: "be supposed to = être censé : c'est la règle, ou ce qui est prévu." },
          { p: "[s:You] [a:aren't] [v:supposed] [k:to] [r:smoke] here.", n: "Au négatif : ce n'est pas permis (on n'est pas censé…)." },
          { p: "[s:The film] [a:was] [v:supposed] [k:to] [r:be] good, but it was boring.", n: "Au passé : c'était censé… mais ça ne s'est pas passé comme prévu." },
        ],
      },
      defi: [
        { q: "« It's going to rain. You ___ take an umbrella. »", o: ["'d better", "had better to", "better had"], i: "had better + base, sans to.", e: "You'd better take an umbrella." },
        { q: "« You'd better ___ tell him. It's a secret. »", o: ["not", "don't", "not to"], i: "La négation de had better.", e: "You'd better not tell him." },
        { q: "« I'm ___ to be at work at 8, but I'm always late! »", o: ["supposed", "suppose", "supposing"], i: "être censé = be + participe passé + to.", e: "I'm supposed to be at work at 8." },
        {
          q: "Traduis : « Tu n'es pas censé utiliser ton téléphone ici. »",
          r: ["You're not supposed to use your phone here", "You aren't supposed to use your phone here", "You are not supposed to use your phone here"],
          i: "be not supposed to + base.",
          e: "You're not supposed to use your phone here.",
        },
        { q: "Complète : « It was ___ to be a surprise! » (censé)", r: ["supposed"], i: "was + supposed + to.", e: "It was supposed to be a surprise!" },
        { q: "Touche le mot de trop.", p: "You'd better *to go now.", i: "had better + base.", e: "You'd better go now." },
      ],
      secret: {
        titre: "Should, ought to, had better",
        texte: "Trois conseils, trois tons. Should : un conseil tranquille (You should read this book). Ought to : pareil, un peu plus soutenu. Had better : un conseil urgent, pour éviter un ennui (You'd better leave now or you'll miss the bus). Ne l'emploie pas pour une vérité générale : « Children had better eat vegetables » sonne comme une menace !",
        formule: "had better (not) + base · be supposed to + base",
      },
    },
  },

  /* ===================== B2 ===================== */
  {
    apres: "durait-deja",
    lecon: {
      id: "recit",
      niveau: "B2",
      titre: "Raconter une histoire",
      notion: "Les temps du récit : past simple, past continuous, past perfect",
      heros: "📖",
      declic: {
        scene: "🌧️ 🚪 😱",
        image: "Un bon récit en anglais se tourne comme un film : le décor (past continuous), l'action (past simple), et les retours en arrière (past perfect).",
        sens: "It was raining (le décor). Suddenly, someone knocked at the door (l'action). I hadn't heard a car (le retour en arrière). Chaque temps a son rôle à l'écran. Les combiner avec précision, c'est ce qui rend une histoire claire et vivante.",
      },
      demo: {
        etapes: [
          { p: "[s:It] [a:was] [r:rain][t:ing] and [s:the wind] [a:was] [r:blow][t:ing].", n: "Past continuous : le décor, ce qui était en cours." },
          { p: "[k:Suddenly], [s:someone] [r:knock][t:ed] at the door.", n: "Past simple : l'action principale, le fil de l'histoire." },
          { p: "[s:I] [a:had] [k:not] [p:heard] a car.", n: "Past perfect : un retour en arrière, avant le moment raconté." },
          { p: "[s:She] [a:had] [a:been] [r:wait][t:ing] for hours.", n: "Past perfect continuous : ça durait déjà avant l'action." },
          { p: "[s:I] [r:open][t:ed] the door, [p:saw] her and [r:scream][t:ed].", n: "Une suite d'actions rapides : une série de past simple." },
        ],
        machine: { temps: ["pastSimple", "pastContinuous", "pastPerfect", "pastPerfectContinuous"], verbes: ["walk", "see", "wait"] },
      },
      defi: [
        { q: "« While I ___ through the park, I saw a fox. »", o: ["was walking", "walked", "had walked"], i: "Le décor, ce qui était en cours.", e: "While I was walking through the park, I saw a fox." },
        { q: "« When we arrived at the cinema, the film ___. »", o: ["had already started", "already started", "was already starting"], i: "C'était fait avant notre arrivée.", e: "the film had already started." },
        { q: "« Her eyes were red, but now she was smiling. She ___. »", o: ["had been crying", "cried", "was crying"], i: "Une action longue, avant le moment raconté, qui a laissé une trace.", e: "She had been crying (on en voit la trace)." },
        { q: "Mets le verbe au bon temps : « I (read) when the lights went out. »", r: ["was reading", "I was reading when the lights went out"], i: "Une action en cours, interrompue.", e: "I was reading when the lights went out." },
        { q: "Complète avec le past perfect : « By the time the police arrived, the thief (escape). »", r: ["had escaped", "had already escaped"], i: "had + participe.", e: "the thief had escaped." },
        { q: "Touche les deux mots du verbe qui pose le décor.", p: "The sun *was *shining when Tom opened the window.", i: "Le past continuous.", e: "was shining : le décor." },
      ],
      secret: {
        titre: "La caméra des temps",
        texte: "Imagine une caméra : le past continuous filme en plan large (ce qui se passait), le past simple fait avancer l'histoire image par image, le past perfect est un flash-back. Astuce : une fois le flash-back installé avec un ou deux past perfect, la suite du souvenir peut repasser au past simple, pour que le texte respire.",
        formule: "décor : was / were + -ing · action : past simple · avant : had + participe (had been + -ing)",
      },
    },
  },
  {
    apres: "recit",
    lecon: {
      id: "would-autrefois",
      niveau: "B2",
      titre: "Le temps des souvenirs",
      notion: "Would et used to pour les habitudes passées",
      heros: "🕰️",
      declic: {
        scene: "👵 🍪 🌳",
        image: "Would, c'est la voix d'une grand-mère qui raconte : « tous les dimanches, on allait à la mer… ». Used to dit aussi l'autrefois, mais would ne raconte que des actions.",
        sens: "Every summer, we would go to the sea (nous allions). We used to go to the sea (nous allions, avant). Les deux traduisent l'imparfait d'habitude. Mais pour un état (avoir, être, aimer, habiter), seul used to marche : I used to have long hair, jamais « I would have long hair ».",
      },
      demo: {
        etapes: [
          { p: "Every Sunday, [s:we] [a:would] [r:visit] my grandmother.", n: "would + base : une action répétée autrefois. Très fréquent dans les souvenirs." },
          { p: "[s:She] [a:would] [r:bake] cookies and [s:we][a:'d] [r:eat] them all.", n: "'d = would. Une fois le décor posé, would enchaîne les souvenirs." },
          { p: "[s:I] [v:used] [k:to] [r:live] in Rome.", n: "Un état (live, have, be, like, know) : used to, jamais would." },
          { p: "[s:He] [v:used] [k:to] [r:be] shy. ([x:He would be shy] ✗)", n: "Être timide est un état : would est impossible avec ce sens." },
          { p: "[s:I] [a:didn't] [r:use] [k:to] [r:like] fish.", n: "La négation : didn't use to (sans d)." },
        ],
        machine: { temps: ["usedTo"], verbes: ["live", "play", "work"] },
      },
      defi: [
        { q: "« When I was a child, my father ___ read me a story every night. »", o: ["would", "will", "was"], i: "Une action répétée autrefois.", e: "my father would read me a story (ou used to read)." },
        {
          q: "« I ___ have a dog called Max. »",
          o: ["used to", "would", "use to"],
          i: "Avoir un chien est un état.",
          e: "I used to have a dog.",
          io: { would: "have (posséder) est un état : would ne peut pas exprimer un état passé. Il faut used to." },
        },
        {
          q: "Quelle phrase est incorrecte ?",
          o: ["We would live in a small village.", "We used to live in a small village.", "We would play in the river every day."],
          i: "Cherche l'état passé exprimé avec would.",
          e: "live est un état : We used to live in a small village.",
        },
        { q: "Mets à la négative : « I used to like coffee. »", r: ["I didn't use to like coffee"], i: "didn't + use (sans d) + to.", e: "I didn't use to like coffee." },
        { q: "Complète avec would : « Every morning, he (walk) to school. »", r: ["would walk", "every morning he would walk to school"], i: "would + base.", e: "Every morning, he would walk to school." },
        { q: "Touche le verbe qui empêche d'utiliser would.", p: "My grandmother would *own a big house.", i: "Un verbe d'état.", e: "own (posséder) est un état : My grandmother used to own a big house." },
      ],
      secret: {
        titre: "Would ou imparfait ?",
        texte: "Would ne traduit pas tous les imparfaits. « Il pleuvait » (décor) → It was raining. « J'habitais à Lyon » (état) → I lived / used to live in Lyon. « Le dimanche, j'allais à la piscine » (habitude) → I would / used to go to the pool. Et would n'ouvre pas un récit : on pose d'abord le cadre (avec used to ou une date), puis would prend le relais.",
        formule: "would + base (actions répétées) · used to + base (actions et états)",
      },
    },
  },
  {
    apres: "mondes-melanges",
    lecon: {
      id: "sauf-si",
      niveau: "B2",
      titre: "Les conditions déguisées",
      notion: "Unless, as long as, provided that, in case, otherwise, even if",
      heros: "🎭",
      declic: {
        scene: "🔑 ⚖️ 🎭",
        image: "If n'est pas le seul à poser des conditions : unless, as long as, provided that et in case sont ses cousins déguisés, chacun avec sa nuance.",
        sens: "Unless = à moins que (sauf si). As long as / provided (that) = à condition que. In case = au cas où (par précaution). Comme avec if, après ces mots le futur reste au présent : I'll come unless it rains.",
      },
      demo: {
        etapes: [
          { p: "[s:I][a:'ll] [r:go] [k:unless] [s:it] [r:rain][t:s].", n: "unless = if… not : à moins qu'il pleuve. Jamais de not après unless." },
          { p: "[s:You] [a:can] [r:borrow] my car [k:as long as] [s:you] [r:drive] carefully.", n: "as long as / so long as = tant que, à condition que." },
          { p: "[s:We][a:'ll] [r:sign] [k:provided] ([k:that]) [s:they] [r:pay] in advance.", n: "provided (that) / providing : à condition que (plus formel)." },
          { p: "[r:Take] an umbrella [k:in case] [s:it] [r:rain][t:s].", n: "in case = au cas où : on agit par précaution, avant de savoir." },
          { p: "[r:Hurry] up, [k:otherwise] [s:we][a:'ll] [r:miss] the bus.", n: "otherwise = sinon. Et even if = même si." },
        ],
      },
      defi: [
        { q: "« I won't go ___ you come with me. »", o: ["unless", "if", "in case"], i: "à moins que…", e: "I won't go unless you come with me." },
        { q: "« Take some money ___ you need a taxi. »", o: ["in case", "unless", "otherwise"], i: "Par précaution.", e: "in case you need a taxi." },
        {
          q: "Réécris avec unless : « If you don't hurry, you'll be late. »",
          r: ["Unless you hurry, you'll be late", "You'll be late unless you hurry"],
          i: "unless remplace if… not.",
          e: "Unless you hurry, you'll be late.",
        },
        { q: "« You can stay ___ you're quiet. »", o: ["as long as", "unless", "in case"], i: "à condition que…", e: "You can stay as long as you're quiet." },
        { q: "« I'll buy it ___ it's expensive. I love it! »", o: ["even if", "unless", "provided"], i: "Peu importe la condition.", e: "even if it's expensive (même si)." },
        { q: "Touche le mot qui fait double emploi.", p: "Unless you *don't study, you'll fail.", i: "unless contient déjà une négation.", e: "Unless you study, you'll fail." },
      ],
      secret: {
        titre: "In case n'est pas if",
        texte: "If : on agit seulement si la chose arrive. In case : on agit avant, par précaution. « I'll take a coat if it gets cold » (je le prendrai s'il fait froid). « I'll take a coat in case it gets cold » (je le prends maintenant, au cas où). Devant un nom, on dit in case of : In case of fire, use the stairs (en cas d'incendie).",
        formule: "unless = if… not · as long as / provided (that) = à condition que · in case = au cas où · otherwise = sinon",
      },
    },
  },
  {
    apres: "passif-etats",
    lecon: {
      id: "passif-pieges",
      niveau: "B2",
      titre: "Le passif dans les coins",
      notion: "Passif à deux compléments (I was given), passif avec get, being + participe, to be + participe",
      heros: "🔄",
      declic: {
        scene: "🎁 👤 🔄",
        image: "Le passif anglais sait faire une acrobatie impossible en français : la personne qui reçoit devient le sujet.",
        sens: "On m'a donné un livre → I was given a book. Le français dit « on » ; l'anglais met la personne au début. Le passif se cache aussi derrière get (got stolen), derrière -ing (being told) et derrière to (to be invited).",
      },
      demo: {
        etapes: [
          { p: "[s:I] [a:was] [p:given] a book. · [s:She] [a:was] [p:told] the truth.", n: "give, tell, send, offer, show, teach, pay : la personne devient sujet (on m'a donné… → I was given…)." },
          { p: "[s:My bike] [a:got] [p:stolen] last night.", n: "get + participe : un passif familier, souvent pour un événement inattendu ou désagréable." },
          { p: "[s:I] [v:hate] [a:being] [p:told] what to do.", n: "-ing au passif : being + participe (je déteste qu'on me dise…)." },
          { p: "[s:Everyone] [v:wants] [k:to] [a:be] [p:loved].", n: "Infinitif au passif : to be + participe." },
          { p: "[s:This house] [v:needs] [r:paint][t:ing]. = …[v:needs] [k:to] [a:be] [p:painted].", n: "need + -ing a un sens passif : cette maison a besoin d'être peinte." },
        ],
        machine: { temps: ["passivePast", "passivePresentPerfect"], verbes: ["steal", "tell", "build"] },
      },
      defi: [
        { q: "« On m'a offert un emploi. »", o: ["I was offered a job.", "It was offered me a job.", "Me was offered a job."], i: "La personne devient le sujet.", e: "I was offered a job." },
        { q: "« He doesn't like ___ at. »", o: ["being laughed", "be laughed", "to laughing"], i: "like + -ing, au passif.", e: "He doesn't like being laughed at." },
        { q: "« Our car ___ damaged in the storm. »", o: ["got", "has", "did"], i: "Le passif familier, pour un événement soudain.", e: "Our car got damaged in the storm." },
        { q: "Mets au passif : « They told us the news. » (commence par We)", r: ["We were told the news"], i: "were + participe de tell.", e: "We were told the news." },
        { q: "Complète : « She hopes (choose) for the team. » (être choisie)", r: ["to be chosen"], i: "hope + to, au passif : to be + participe.", e: "She hopes to be chosen for the team." },
        { q: "Touche les deux mots du passif.", p: "The children *were *shown the museum.", i: "be + participe.", e: "were shown : on a montré le musée aux enfants." },
      ],
      secret: {
        titre: "« On » se traduit souvent par un passif",
        texte: "Le pronom « on » n'a pas d'équivalent parfait. « On m'a volé mon sac » → My bag was stolen / I had my bag stolen. « On dit qu'il est riche » → He is said to be rich. « On parle anglais ici » → English is spoken here. Quand « on » ne désigne personne en particulier, pense au passif.",
        formule: "sujet = la personne : I was given / told / shown… · get + participe · being + participe · to be + participe",
      },
    },
  },
  {
    apres: "detective-modal",
    lecon: {
      id: "questions-negatives",
      niveau: "B2",
      titre: "La question à l'envers",
      notion: "Les questions négatives (Don't you…? Isn't it…?) et la réponse « si »",
      heros: "🙃",
      declic: {
        scene: "🤨 ❓ 😮",
        image: "Une question négative cache presque toujours une émotion : la surprise, le reproche, ou une proposition.",
        sens: "Don't you like chocolate? (Tu n'aimes pas le chocolat ? Ça m'étonne !) Isn't it beautiful? (N'est-ce pas magnifique ?) Why don't we go out? (Et si on sortait ?) Pour répondre, oublie le « si » français : Yes, I do (si) / No, I don't (non).",
      },
      demo: {
        etapes: [
          { p: "[a:Don't] [s:you] [r:like] chocolate?", n: "La surprise : tu ne l'aimes pas ? Vraiment ?" },
          { p: "[a:Isn't] [s:it] beautiful?", n: "On attend un « oui » : n'est-ce pas magnifique ?" },
          { p: "[a:Haven't] [s:you] [p:finished] yet?", n: "Le reproche ou l'impatience : tu n'as toujours pas fini ?" },
          { p: "[k:Why] [a:don't] [s:we] [r:go] for a walk?", n: "Why don't we / you…? = une suggestion (Et si on… ?)." },
          { p: "Don't you like it? — [k:Yes], [s:I] [a:do]! (= si) / [k:No], [s:I] [a:don't].", n: "La réponse suit la réalité, pas la forme de la question : Yes = j'aime (si), No = je n'aime pas." },
        ],
      },
      defi: [
        { q: "« You don't speak Spanish? — ___, I do! I lived in Madrid. »", o: ["Yes", "No", "Si"], i: "Tu parles espagnol : la réponse est positive.", e: "Yes, I do = Si, je le parle." },
        { q: "Pour proposer d'aller au cinéma : « ___ we go to the cinema? »", o: ["Why don't", "Why not", "Don't"], i: "Et si on… ?", e: "Why don't we go to the cinema?" },
        { q: "« ___ you tired? You worked all night! »", o: ["Aren't", "Don't", "Isn't"], i: "be + you, à la négative.", e: "Aren't you tired?" },
        { q: "Transforme en question de surprise : « Do you know him? »", r: ["Don't you know him", "Do you not know him"], i: "do + n't + sujet.", e: "Don't you know him?" },
        { q: "« Isn't she coming? » — Elle ne vient pas. Que réponds-tu ?", o: ["No, she isn't.", "Yes, she isn't.", "No, she is."], i: "La réponse suit la réalité.", e: "No, she isn't (non, elle ne vient pas)." },
        { q: "Touche les deux mots qui transforment la question en suggestion.", p: "*Why *don't you call her?", i: "Et si tu… ?", e: "Why don't you…? = Et si tu… ? / Tu devrais…" },
      ],
      secret: {
        titre: "Le piège du « si »",
        texte: "Le français a « si » pour contredire une négation. L'anglais n'en a pas : il répond toujours selon la réalité. « You didn't call me! — Yes, I did! » (Si, je t'ai appelé !). Pour renforcer, on accentue le moteur : « I DID call you! ». Et dans une question négative très formelle, le not se détache : « Do you not agree? ».",
        formule: "Don't / Isn't / Haven't + sujet…? · Why don't we…? · Yes (si) / No, selon la réalité",
      },
    },
  },
  {
    apres: "messager",
    lecon: {
      id: "verbes-rapporteurs",
      niveau: "B2",
      titre: "Le messager choisit ses mots",
      notion: "Les verbes de rapport : promise, refuse, advise, warn, deny, suggest, accuse…",
      heros: "📯",
      declic: {
        scene: "🗣️ 📯 📝",
        image: "Un bon messager ne répète pas « il a dit, elle a dit » : il choisit le verbe qui résume l'intention (promettre, refuser, nier, conseiller).",
        sens: "« I'll help you. » → He promised to help me. « I didn't steal it! » → She denied stealing it. Chaque verbe de rapport a sa construction : to + base, -ing, that…, ou une personne + to. Les connaître rend ton anglais précis et élégant.",
      },
      demo: {
        legende: { o: "la personne visée" },
        etapes: [
          { p: "[s:He] [r:promis][t:ed] [k:to] [r:help] me. · [s:She] [r:refus][t:ed] [k:to] [r:pay].", n: "verbe + to + base : promise, refuse, agree, offer, threaten, decide." },
          { p: "[s:He] [r:advis][t:ed] [o:me] [k:to] [r:rest]. · [s:They] [r:warn][t:ed] [o:us] [k:not] [k:to] [r:go].", n: "verbe + personne + to : advise, tell, ask, warn, remind, encourage, persuade." },
          { p: "[s:She] [r:deni][t:ed] [r:steal][t:ing] the money. · [s:He] [r:admitt][t:ed] [r:ly][t:ing].", n: "verbe + -ing : deny, admit, suggest, recommend." },
          { p: "[s:They] [r:accus][t:ed] [o:him] [k:of] [r:cheat][t:ing]. · [s:I] [r:apologis][t:ed] [k:for] [r:be][t:ing] late.", n: "verbe + préposition + -ing : accuse of, apologise for, insist on, congratulate on." },
          { p: "[s:She] [r:suggest][t:ed] [r:go][t:ing] out. / …[k:that] [s:we] [r:go] out.", n: "suggest + -ing, ou suggest that + sujet + verbe. Jamais « suggest someone to »." },
        ],
      },
      defi: [
        { q: "« Don't touch the dog! » → He warned me ___ the dog.", o: ["not to touch", "to not touching", "don't touch"], i: "warn + personne + (not) to.", e: "He warned me not to touch the dog." },
        { q: "« I didn't break the vase. » → She denied ___ the vase.", o: ["breaking", "to break", "that break"], i: "deny + -ing.", e: "She denied breaking the vase." },
        { q: "« Let's eat out tonight. » → He ___ eating out.", o: ["suggested", "advised", "told"], i: "Let's… est une proposition.", e: "He suggested eating out." },
        {
          q: "Rapporte : « I'll call you tomorrow », she said. → She promised…",
          r: ["She promised to call me the next day", "She promised to call me the following day", "She promised to call me tomorrow", "to call me the next day", "to call me the following day", "to call me tomorrow"],
          i: "promise + to + base.",
          e: "She promised to call me the next day.",
        },
        {
          q: "Quelle phrase est correcte ?",
          o: ["She suggested that we leave early.", "She suggested us to leave early.", "She suggested to leave us early."],
          i: "suggest n'accepte pas personne + to.",
          e: "She suggested that we leave early (ou She suggested leaving early).",
        },
        { q: "Touche la préposition qui accompagne accuse.", p: "They accused her *of lying.", i: "accuse someone ___ + -ing.", e: "accuse someone of + -ing." },
      ],
      secret: {
        titre: "Moins de say, plus de sens",
        texte: "Au lieu de « He said that he would help », écris « He offered to help ». Au lieu de « She said it wasn't her », écris « She denied it ». Ces verbes résument une phrase entière en un mot. Dans un rapport, un article ou une rédaction d'examen, ils valent de l'or.",
        formule: "promise / refuse / offer + to · advise / warn / tell + qqn + to · deny / admit / suggest + -ing · accuse of / apologise for + -ing",
      },
    },
  },
  {
    apres: "verbes-rapporteurs",
    lecon: {
      id: "perception",
      niveau: "B2",
      titre: "Ce que j'ai vu",
      notion: "See, hear, watch, feel + quelqu'un + base ou -ing",
      heros: "👀",
      declic: {
        scene: "👀 👂 🎬",
        image: "Après les verbes des sens, le verbe qui suit choisit : la base pour une action vue en entier, -ing pour une action surprise en plein milieu.",
        sens: "I saw him cross the road (je l'ai vu traverser : du début à la fin). I saw him crossing the road (je l'ai vu en train de traverser : un morceau de l'action). Dans les deux cas, pas de to !",
      },
      demo: {
        legende: { o: "la personne ou la chose perçue" },
        etapes: [
          { p: "[s:I] [p:saw] [o:him] [r:cross] the street.", n: "Base verbale : l'action complète, du début à la fin." },
          { p: "[s:I] [p:saw] [o:him] [r:cross][t:ing] the street.", n: "-ing : l'action en cours, vue un instant." },
          { p: "[s:We] [p:heard] [o:her] [r:sing]. · [s:I] [p:heard] [o:someone] [r:shout][t:ing].", n: "hear, listen to, watch, notice, feel : même règle." },
          { p: "[s:She] [p:felt] [o:the ground] [r:shake].", n: "Une sensation : feel + base ou -ing." },
          { p: "[s:He] [a:was] [p:seen] [k:to] [r:leave].", n: "Au passif, le to revient : He was seen to leave (ou leaving)." },
        ],
      },
      defi: [
        { q: "« I heard the baby ___ all night. » (sans arrêt)", o: ["crying", "to cry", "cried"], i: "Une action en cours, qui dure.", e: "I heard the baby crying all night." },
        { q: "« We watched the plane ___ off. » (du début à la fin)", o: ["take", "to take", "took"], i: "L'action complète, et jamais de to.", e: "We watched the plane take off." },
        { q: "« Did you notice anyone ___ the room? »", o: ["leave", "to leave", "left"], i: "notice + personne + base.", e: "Did you notice anyone leave the room?" },
        { q: "Traduis : « Je l'ai entendu claquer la porte. » (him, slam)", r: ["I heard him slam the door"], i: "hear + him + base.", e: "I heard him slam the door." },
        { q: "Mets au passif : « They saw him enter the bank. » (He was seen…)", r: ["He was seen to enter the bank", "He was seen entering the bank"], i: "Au passif, la base reprend to.", e: "He was seen to enter the bank." },
        { q: "Touche le mot interdit.", p: "I saw her *to dance.", i: "Après see + personne, pas de to.", e: "I saw her dance (ou dancing)." },
      ],
      secret: {
        titre: "Le to qui disparaît… et qui revient",
        texte: "Les verbes des sens (see, hear, watch, feel, notice) et make font tomber le to à l'actif. Mais au passif, il revient : « They made me wait » → I was made to wait. « They saw her leave » → She was seen to leave. Retiens-les comme une paire : actif sans to, passif avec to.",
        formule: "see / hear / watch + qqn + base (action entière) ou -ing (action en cours)",
      },
    },
  },
  {
    apres: "perception",
    lecon: {
      id: "couteau-get",
      niveau: "B2",
      titre: "Get, le couteau suisse",
      notion: "Les sens de get : obtenir, devenir, arriver, se faire…",
      heros: "🔧",
      declic: {
        scene: "🔧 🔑 🎁",
        image: "Get est le couteau suisse de l'anglais parlé : un seul verbe, une dizaine de lames selon ce qui le suit.",
        sens: "get + nom = obtenir (get a job). get + adjectif = devenir (get tired). get + lieu = arriver (get home). get + participe = un changement (get married, get lost). Il est irrégulier : get, got, got (gotten en américain).",
      },
      demo: {
        etapes: [
          { p: "[s:I] [p:got] a new job. · [r:Get] some bread, please.", n: "get + nom = obtenir, recevoir, aller chercher, acheter." },
          { p: "[s:It][a:'s] [r:get][t:ting] dark. · [s:She] [p:got] angry.", n: "get + adjectif = devenir (un changement)." },
          { p: "[s:We] [p:got] home at midnight. · How do I [r:get] to the station?", n: "get + lieu = arriver, se rendre (get home, get to work)." },
          { p: "[s:They] [p:got] married. · [s:We] [p:got] lost.", n: "get + participe : se marier, se perdre, s'habiller (get dressed)…" },
          { p: "[s:I] [p:got] [o:him] [k:to] [r:help] me.", n: "get + personne + to = convaincre quelqu'un de faire." },
        ],
        machine: { temps: ["pastSimple", "presentContinuous"], verbes: ["get"] },
      },
      defi: [
        { q: "« It's ___ cold. Close the window. »", o: ["getting", "becoming to", "having"], i: "devenir, petit à petit.", e: "It's getting cold." },
        {
          q: "« What time did you get ___ last night? »",
          o: ["home", "to home", "at home"],
          i: "Pas de préposition devant home.",
          e: "What time did you get home?",
          io: { "to home": "Avec home, pas de to : get home, go home, come home." },
        },
        { q: "« They ___ married in June. »", o: ["got", "get", "getted"], i: "Le past simple de get.", e: "They got married in June." },
        { q: "Traduis : « Je me suis perdu. »", r: ["I got lost"], i: "get + participe (lose, lost, lost).", e: "I got lost." },
        { q: "Complète : « I finally got my sister (help) me. »", r: ["to help"], i: "get + personne + to + base.", e: "I finally got my sister to help me." },
        { q: "Touche les deux mots qui veulent dire « suis arrivé à ».", p: "When I *got *to the station, the train had left.", i: "get + to + lieu.", e: "get to + lieu = arriver à." },
      ],
      secret: {
        titre: "Get à l'américaine",
        texte: "Les Américains disent « gotten » comme participe (I've gotten better), les Britanniques « got » (I've got better). Et « have got » (posséder) est surtout britannique : I've got a car = I have a car. Get est partout à l'oral, mais à l'écrit soutenu on préfère un verbe plus précis : obtain, become, arrive, receive.",
        formule: "get + nom (obtenir) · + adjectif (devenir) · + lieu (arriver) · + participe (se faire) · + qqn + to (convaincre)",
      },
    },
  },
];
