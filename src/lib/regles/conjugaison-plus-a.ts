import type { Ajout } from "./types";

/*
 * La Machine à voyager dans le temps — leçons ajoutées aux niveaux A1 et A2.
 * Chacune prend place juste après la leçon qu'elle prolonge (« apres »), sans rien retirer.
 */

export const CONJUGAISON_PLUS_A: Ajout[] = [
  /* ===================== A1 ===================== */
  {
    apres: "roi-be",
    lecon: {
      id: "avoir-faim",
      niveau: "A1",
      titre: "Le roi Be vole le verbe avoir",
      notion: "Be là où le français dit « avoir » (hungry, cold, 20 years old)",
      heros: "🍔",
      declic: {
        scene: "🥶 🍔 🎂",
        image: "En anglais, on ne « possède » pas la faim, le froid ou son âge : on « est » affamé, on « est » gelé, on « est » 20 ans.",
        sens: "Le français dit « j'ai faim, j'ai froid, j'ai 20 ans, j'ai raison ». L'anglais utilise be : I am hungry, I am cold, I am 20, I am right. Le verbe have n'a rien à faire ici : c'est le roi Be qui règne.",
      },
      demo: {
        legende: { j: "ce qu'on « est » (faim, froid, raison…)", c: "l'âge" },
        etapes: [
          { p: "[s:I] [a:am] [j:hungry]. · [s:She] [a:is] [j:thirsty].", n: "avoir faim = be hungry · avoir soif = be thirsty." },
          { p: "[s:We] [a:are] [j:cold]. · [s:I][a:'m] [j:hot].", n: "avoir froid = be cold · avoir chaud = be hot. (Il fait froid = it's cold.)" },
          { p: "[s:He] [a:is] [c:twelve] ([c:years old]).", n: "avoir 12 ans = be twelve (years old). Jamais « he has twelve years ». Pour demander : How old are you?" },
          { p: "[s:You] [a:are] [j:right]. · [s:I] [a:am] [j:wrong].", n: "avoir raison = be right · avoir tort = be wrong." },
          { p: "[s:They] [a:are] [j:afraid] [k:of] dogs. · [s:I] [a:am] [j:sleepy].", n: "avoir peur de = be afraid of · avoir sommeil = be sleepy." },
        ],
        machine: { temps: ["presentSimple"], verbes: ["be"] },
      },
      defi: [
        {
          q: "« I ___ hungry. Let's eat! »",
          o: ["am", "have", "do"],
          i: "En anglais, la faim, on la « est ».",
          e: "I am hungry : j'ai faim.",
          io: { have: "« I have hungry » est une traduction mot à mot du français. L'anglais dit I am hungry." },
        },
        { q: "Comment dit-on « Elle a 15 ans » ?", o: ["She is 15.", "She has 15 years.", "She has 15."], i: "L'âge passe par le roi Be.", e: "She is 15 (years old)." },
        { q: "Traduis : « J'ai froid. »", r: ["I am cold"], i: "be + cold.", e: "I'm cold." },
        { q: "« You ___ right, it's a good idea. »", o: ["are", "have", "is"], i: "avoir raison = be right.", e: "You are right." },
        { q: "Touche le mot qu'un francophone met à tort.", p: "My brother *has ten years.", i: "L'âge ne se possède pas en anglais.", e: "My brother is ten (years old) : l'âge se dit avec be." },
        { q: "Pose la question : « Quel âge as-tu ? »", r: ["How old are you"], i: "How old (à quel point vieux) + be.", e: "How old are you? — I'm 20." },
      ],
      secret: {
        titre: "La petite famille du « avoir » devenu « be »",
        texte: "Retiens-la d'un bloc : hungry (faim), thirsty (soif), cold (froid), hot (chaud), afraid (peur), right et wrong (raison et tort), sleepy (sommeil), et l'âge. Avec tous ces mots, le français dit « avoir », l'anglais dit « be ». Et pour la naissance, c'est encore be, au passé : « je suis né en 2010 » = I was born in 2010.",
        formule: "be + hungry / thirsty / cold / hot / afraid / right / wrong · be + âge",
      },
    },
  },
  {
    apres: "majordome-do",
    lecon: {
      id: "reponses-courtes",
      niveau: "A1",
      titre: "Yes, I do !",
      notion: "Les réponses courtes (Yes, I do / No, she isn't)",
      heros: "💬",
      declic: {
        scene: "❓ 👍 👎",
        image: "En anglais, on ne répond pas seulement « yes » ou « no » : on renvoie le moteur de la question, comme un écho.",
        sens: "Do you like tea? — Yes, I do. Is she French? — No, she isn't. Can you swim? — Yes, I can. Répondre juste « yes » peut sembler sec : la réponse courte est polie et naturelle. Le secret : reprendre le même moteur (do, be, can, have…) que dans la question.",
      },
      demo: {
        etapes: [
          { p: "[a:Do] [s:you] like tea? — Yes, [s:I] [a:do]. / No, [s:I] [a:don't].", n: "La question commence par do : la réponse reprend do." },
          { p: "[a:Does] [s:he] play football? — Yes, [s:he] [a:does]. / No, [s:he] [a:doesn't].", n: "Avec he, she, it : does / doesn't." },
          { p: "[a:Is] [s:she] French? — Yes, [s:she] [a:is]. / No, [s:she] [a:isn't].", n: "Avec be, on renvoie be : is / isn't, are / aren't, am / I'm not." },
          { p: "[a:Can] [s:you] swim? — Yes, [s:I] [a:can]. / No, [s:I] [a:can't].", n: "Même jeu avec can, have got, will…" },
          { p: "[a:Are] [s:you] tired? — Yes, [s:I] [a:am]. ([x:Yes, I'm.] ✗)", n: "Dans une réponse « oui », pas de contraction à la fin : Yes, I am. (Mais No, I'm not / No, she isn't.)" },
        ],
      },
      defi: [
        { q: "« Do you speak English? — Yes, I ___. »", o: ["do", "speak", "am"], i: "Quel moteur ouvre la question ?", e: "Yes, I do." },
        { q: "« Is it cold today? — No, it ___. »", o: ["isn't", "doesn't", "don't"], i: "La question commence par is.", e: "No, it isn't." },
        {
          q: "« Are you happy? — Yes, ___. »",
          o: ["I am", "I'm", "I do"],
          i: "Une réponse « oui » ne finit pas par une contraction.",
          e: "Yes, I am.",
          io: { "I'm": "« Yes, I'm. » est impossible : à la fin d'une réponse, on écrit le moteur en entier. Yes, I am." },
        },
        { q: "Réponds « non » : « Does your sister like cats? — No, she ___. »", r: ["doesn't"], i: "La question commence par does.", e: "No, she doesn't." },
        { q: "Réponds « oui » : « Can they come tomorrow? — Yes, they ___. »", r: ["can"], i: "Renvoie le moteur de la question.", e: "Yes, they can." },
        { q: "« Have you got a pen? — Yes, I ___. »", o: ["have", "got", "do"], i: "Le moteur ici, c'est have.", e: "Yes, I have. (No, I haven't.)" },
      ],
      secret: {
        titre: "Le « si » français",
        texte: "Le français a un mot magique pour contredire une question négative : « Tu n'aimes pas le thé ? — Si ! ». L'anglais n'a pas de « si » : il répond avec le moteur, en le mettant en valeur. « You don't like tea? — Yes, I do! » (si, j'aime ça !). Le yes contredit, et le do prononcé fort fait tout le travail.",
        formule: "Yes, + sujet + moteur · No, + sujet + moteur + n't",
      },
    },
  },
  {
    apres: "super-pouvoir",
    lecon: {
      id: "j-aime",
      niveau: "A1",
      titre: "Ce que j'aime, ce que je voudrais",
      notion: "Like, love, hate + -ing ; would like + to",
      heros: "❤️",
      declic: {
        scene: "😍 🙂 😖 🙏",
        image: "J'aime, je déteste : le verbe qui suit porte souvent le costume -ing. Je voudrais : il prend to.",
        sens: "I like swimming (j'aime nager, en général). I hate getting up early (je déteste me lever tôt). Mais pour demander poliment, on utilise would like : I'd like to swim (je voudrais nager, maintenant). Like dit ce qu'on aime ; would like dit ce qu'on veut.",
      },
      demo: {
        etapes: [
          { p: "[s:I] [v:like] [r:swim][t:ming]. · [s:She] [v:loves] [r:danc][t:ing].", n: "like, love, hate + -ing : une activité en général. (I like to swim existe aussi, surtout en américain.)" },
          { p: "[s:He] [v:hates] [r:get][t:ting] up early. · [s:They] [v:enjoy] [r:cook][t:ing].", n: "enjoy (prendre plaisir à) veut toujours -ing." },
          { p: "[s:I][a:'d] [v:like] [k:to] [r:go] to the beach.", n: "would like + to + base : je voudrais (une envie précise, maintenant). 'd = would." },
          { p: "[a:Would] [s:you] [v:like] a coffee? — Yes, please.", n: "Pour proposer poliment : Would you like…? (Voulez-vous… ?)" },
          { p: "[s:I] [v:want] [k:to] [r:eat]. · [s:I][a:'d] [v:like] [k:to] [r:eat].", n: "want = vouloir (direct). would like = je voudrais (poli). Au restaurant, préfère I'd like." },
        ],
      },
      defi: [
        { q: "« I love ___ books. »", o: ["reading", "read", "to reading"], i: "love + une activité en général…", e: "I love reading." },
        {
          q: "Au café : « I ___ a hot chocolate, please. »",
          o: ["'d like", "like", "liking"],
          i: "Tu demandes poliment quelque chose, maintenant.",
          e: "I'd like a hot chocolate, please.",
          io: { like: "« I like a hot chocolate » voudrait dire que tu aimes le chocolat chaud en général, pas que tu en commandes un." },
        },
        { q: "« Would you like ___ with us? »", o: ["to come", "coming", "come"], i: "would like veut to + base.", e: "Would you like to come with us?" },
        { q: "Complète : « She hates (wait). »", r: ["waiting", "she hates waiting"], i: "hate + -ing.", e: "She hates waiting." },
        { q: "Mets la bonne forme : « We enjoy (dance). »", r: ["dancing", "we enjoy dancing"], i: "enjoy + -ing, et dance perd son e.", e: "We enjoy dancing." },
        { q: "Touche le mot qui n'est pas à la bonne forme.", p: "I enjoy *to play tennis.", i: "enjoy n'accepte jamais to.", e: "I enjoy playing tennis." },
      ],
      secret: {
        titre: "Like n'est pas would like",
        texte: "« Do you like coffee? » = est-ce que tu aimes le café (en général) ? « Would you like a coffee? » = veux-tu un café (maintenant) ? Si on te pose la deuxième question et que tu réponds « Yes, I do », c'est bizarre ! La bonne réponse : « Yes, please » ou « Yes, I would ». Le petit mot would change tout : il transforme un goût en envie.",
        formule: "like / love / hate / enjoy + -ing · would like + to + base",
      },
    },
  },

  /* ===================== A2 ===================== */
  {
    apres: "will",
    lecon: {
      id: "verite-si",
      niveau: "A2",
      titre: "Si… toujours",
      notion: "Le conditionnel zéro (if / when + présent, présent)",
      heros: "🧪",
      declic: {
        scene: "🔥 🧊 💧",
        image: "Le conditionnel zéro, c'est une loi de la nature : chaque fois que ceci arrive, cela arrive aussi. Pas de surprise, pas de futur.",
        sens: "If you heat ice, it melts (si on chauffe de la glace, elle fond). C'est vrai hier, aujourd'hui et demain : alors les deux parties restent au present simple. On peut souvent remplacer if par when (chaque fois que).",
      },
      demo: {
        etapes: [
          { p: "[k:If] [s:you] [r:heat] ice, [s:it] [r:melt][t:s].", n: "if + present simple, present simple : une vérité générale." },
          { p: "[k:When] [s:I] [r:drink] coffee at night, [s:I] [a:don't] [r:sleep].", n: "when = chaque fois que. Une habitude personnelle, toujours vraie." },
          { p: "[k:If] [s:you] [r:mix] blue and yellow, [s:you] [r:get] green.", n: "Une règle, une recette : rien ne change selon le jour." },
          { p: "[k:If] [s:you] [a:are] tired, [r:go] to bed!", n: "Variante : if + présent, impératif (un conseil toujours valable)." },
          { p: "[k:If] [s:it] [r:rain][t:s] tomorrow, [s:I] [a:will] [r:stay] home.", n: "Ça, c'est le premier conditionnel : une seule situation, demain, et will apparaît. Le conditionnel zéro parle de « chaque fois »." },
        ],
        machine: { temps: ["presentSimple"], verbes: ["rain", "work", "live"] },
      },
      defi: [
        { q: "« If you put oil in water, it ___. »", o: ["floats", "would float", "floated"], i: "Une loi de la physique : toujours vraie.", e: "If you put oil in water, it floats." },
        { q: "« When I ___ late, my boss gets angry. »", o: ["arrive", "will arrive", "arrived"], i: "Chaque fois que… : present simple des deux côtés.", e: "When I arrive late, my boss gets angry." },
        { q: "Complète : « If plants (not get) water, they die. »", r: ["don't get", "if plants don't get water they die"], i: "Une négation au present simple : don't + base.", e: "If plants don't get water, they die." },
        {
          q: "Quelle phrase est un conditionnel zéro ?",
          o: ["If you press this button, the machine stops.", "If you press this button tomorrow, the machine will stop.", "If you pressed this button, the machine would stop."],
          i: "Cherche la règle toujours vraie, sans will ni would.",
          e: "If you press this button, the machine stops : c'est le mode d'emploi, toujours vrai.",
        },
        { q: "Touche les deux verbes au present simple.", p: "If you *mix red and white, you *get pink.", i: "Deux présents pour une règle.", e: "mix et get : deux present simple, une règle toujours vraie." },
        {
          q: "Traduis : « Si tu chauffes du chocolat, il fond. »",
          r: ["If you heat chocolate, it melts", "When you heat chocolate, it melts", "Chocolate melts if you heat it", "Chocolate melts when you heat it"],
          i: "if + présent, présent (melt prend -s avec it).",
          e: "If you heat chocolate, it melts.",
        },
      ],
      secret: {
        titre: "Le test du « chaque fois »",
        texte: "Tu hésites entre le conditionnel zéro et le premier ? Remplace if par « chaque fois que ». Si la phrase garde son sens, c'est une règle générale : présent + présent (When it rains, the streets get wet). Si tu parles d'une seule situation à venir, c'est le premier conditionnel : If it rains tomorrow, the match will be cancelled.",
        formule: "If / When + present simple, present simple",
      },
    },
  },
  {
    apres: "loi",
    lecon: {
      id: "politesse",
      niveau: "A2",
      titre: "Les mots magiques",
      notion: "Can, could, may, shall : demander, proposer, permettre",
      heros: "🎩",
      declic: {
        scene: "🙋 🤝 🎩",
        image: "Pour demander quelque chose en anglais, le choix du modal règle la politesse, comme un bouton de volume.",
        sens: "Can I…? est simple et amical. Could I / Could you…? est plus poli. May I…? est très poli, presque cérémonieux. Et pour proposer ton aide : Shall I…? (Veux-tu que je… ?).",
      },
      demo: {
        etapes: [
          { p: "[a:Can] [s:I] [r:open] the window? · [a:Can] [s:you] [r:help] me?", n: "can : demander la permission (Can I…?) ou un service (Can you…?), entre amis." },
          { p: "[a:Could] [s:you] [r:close] the door, please?", n: "could : la même demande, en plus poli. Ici, could n'est pas du passé !" },
          { p: "[a:May] [s:I] [r:come] in?", n: "may : demander la permission très poliment. On ne s'en sert pas pour demander un service : pas de « May you… »." },
          { p: "[a:Shall] [s:I] [r:carry] your bag? · [a:Shall] [s:we] [r:dance]?", n: "Shall I…? = Veux-tu que je… ? (proposer). Shall we…? = Et si on… ? (suggérer)." },
          { p: "Yes, of course. · Sure! · I'm afraid you [a:can't].", n: "Pour répondre : Of course / Sure / Go ahead (oui), I'm afraid you can't (non, poliment)." },
        ],
      },
      defi: [
        { q: "À ton professeur : « ___ I leave early today? »", o: ["May", "Shall", "Do"], i: "Tu demandes la permission, très poliment.", e: "May I leave early today?" },
        { q: "Tu proposes de porter la valise : « ___ I carry your suitcase? » (Veux-tu que je… ?)", o: ["Shall", "Do", "Must"], i: "Le modal de la proposition.", e: "Shall I carry your suitcase?" },
        {
          q: "Le plus poli pour demander un service : « ___ you pass me the salt, please? »",
          o: ["Could", "Can", "Shall"],
          i: "Le modal du passé sert ici à adoucir.",
          e: "Could you pass me the salt, please?",
          io: { Can: "« Can you » est correct, mais plus direct. La question demande la forme la plus polie : Could you." },
        },
        { q: "Suggère à un ami : « Et si on allait au cinéma ? » (commence par Shall)", r: ["Shall we go to the cinema", "Shall we go to the movies"], i: "Shall we + base… ?", e: "Shall we go to the cinema?" },
        {
          q: "« May you help me? » est…",
          o: ["incorrect : on dit Could you / Can you help me?", "correct et très poli", "correct mais familier"],
          i: "May sert à demander une permission pour soi.",
          e: "May I…? oui ; May you…? non. Pour un service : Could you…?",
        },
        { q: "Touche le modal qui sert à proposer.", p: "*Shall I make some tea?", i: "Veux-tu que je… ?", e: "Shall I…? = Veux-tu que je… ?" },
      ],
      secret: {
        titre: "Le thermomètre de la politesse",
        texte: "Du plus direct au plus poli : Can you…? → Could you…? → Would you…? → Would you mind + -ing…? (Would you mind opening the window? = Ça vous dérangerait d'ouvrir la fenêtre ?). Attention au piège : à « Would you mind…? », on répond « No, not at all » pour dire oui, car tu réponds à « Ça vous dérange ? ».",
        formule: "Can / Could / May I…? (permission) · Can / Could you…? (service) · Shall I / we…? (proposition)",
      },
    },
  },
  {
    apres: "politesse",
    lecon: {
      id: "conseil",
      niveau: "A2",
      titre: "Le bon conseil",
      notion: "Should, shouldn't, ought to (et If I were you)",
      heros: "🦉",
      declic: {
        scene: "🤒 🦉 💡",
        image: "Should, c'est la petite voix sage qui te souffle ce qui serait bien de faire, sans t'y obliger.",
        sens: "You should see a doctor (tu devrais voir un médecin). Should = devrais, un conseil. Must = un ordre ou une règle. Comme tous les modaux, should ne change jamais : pas de -s, pas de to après.",
      },
      demo: {
        etapes: [
          { p: "[s:You] [a:should] [r:drink] more water.", n: "should + base : tu devrais. Pareil pour tous : I should, she should, they should." },
          { p: "[s:He] [a:shouldn't] [r:eat] so much sugar.", n: "shouldn't = ne devrait pas (should not)." },
          { p: "[a:Should] [s:I] [r:call] her? — Yes, you [a:should].", n: "Pour demander conseil : Should I…? (Est-ce que je devrais… ?)" },
          { p: "[s:You] [a:ought] [k:to] [r:apologise].", n: "ought to = should, un peu plus soutenu. Attention : ought est suivi de to." },
          { p: "[k:If I were you], [s:I][a:'d] [r:take] the job.", n: "À ta place, je… : une autre façon de conseiller (If I were you, I would…)." },
        ],
      },
      defi: [
        { q: "« You look tired. You ___ go to bed. »", o: ["should", "should to", "shoulds"], i: "should + base, sans to.", e: "You should go to bed." },
        { q: "« She ___ drive so fast. It's dangerous. »", o: ["shouldn't", "doesn't should", "shoulds not"], i: "La négation de should.", e: "She shouldn't drive so fast." },
        { q: "Demande conseil : « Est-ce que je devrais acheter cette veste ? »", r: ["Should I buy this jacket", "Should I buy that jacket"], i: "Should + sujet + base… ?", e: "Should I buy this jacket?" },
        { q: "« You ___ to see a dentist. »", o: ["ought", "should", "must"], i: "Le seul de la liste qui accepte to juste après.", e: "You ought to see a dentist (= You should see a dentist)." },
        {
          q: "Quelle phrase donne un conseil (et non une obligation) ?",
          o: ["You should try this restaurant.", "You must wear a seatbelt.", "You have to pay here."],
          i: "Le conseil laisse le choix.",
          e: "should = conseil ; must et have to = obligation.",
        },
        { q: "Complète : « If I ___ you, I'd tell the truth. »", r: ["were"], i: "À ta place… : la forme spéciale de be.", e: "If I were you, I'd tell the truth." },
      ],
      secret: {
        titre: "Devrais ou dois ?",
        texte: "Le français « devoir » cache deux idées. « Tu dois mettre ta ceinture » (c'est la loi) → must / have to. « Tu devrais te reposer » (je te le conseille) → should. Écoute le conditionnel français : « devrais » = should. Pour un conseil urgent, presque une mise en garde, les Anglais disent « You'd better… » (tu ferais mieux de…) : tu le verras au niveau B1.",
        formule: "should / shouldn't / ought to + base · If I were you, I'd…",
      },
    },
  },
];
