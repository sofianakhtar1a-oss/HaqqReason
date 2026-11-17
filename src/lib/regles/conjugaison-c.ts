import type { Lecon } from "./types";

/* La Machine à voyager dans le temps (verbes anglais) — niveaux C1 et C2. */

export const CONJUGAISON_C: Lecon[] = [
  /* ===================== C1 ===================== */
  {
    id: "futur-dans-passe",
    niveau: "C1",
    titre: "Le futur vu du passé",
    notion: "Was going to, would, was about to, was to",
    heros: "🔙",
    declic: {
      scene: "📜 🔭 🔙",
      image: "Imagine un personnage du passé qui regarde son propre avenir. Ce qu'il voit, c'est le futur… mais raconté depuis hier.",
      sens: "I was going to call you, but I forgot (j'allais t'appeler : un projet du passé qui ne s'est pas réalisé). He knew he would win (il savait qu'il gagnerait). They were about to leave (ils étaient sur le point de partir). She was never to see him again (elle ne devait jamais le revoir : le destin).",
    },
    demo: {
      etapes: [
        { p: "[s:I] [a:was] [k:going to] [r:call] you, but [s:I] [p:forgot].", n: "was going to : une intention passée, souvent non réalisée." },
        { p: "[s:She] [p:knew] [s:she] [a:would] [r:succeed].", n: "would : le futur vu depuis un moment passé (le « futur du passé »)." },
        { p: "[s:We] [a:were] [k:about to] [r:go] out when it started to rain.", n: "was / were about to : juste sur le point de." },
        { p: "[s:He] [a:was] [k:never to] [r:return] to his country.", n: "was to : le destin, dans un style de récit. Il ne devait jamais revenir." },
      ],
    },
    defi: [
      { q: "« I ___ you, but my phone died. »", o: ["was going to text", "will text", "would texting"], i: "Une intention passée qui n'a pas eu lieu.", e: "was going to text : je comptais t'écrire." },
      { q: "« In 1990, nobody knew the internet ___ the world. »", o: ["would change", "will change", "changes"], i: "Le futur vu depuis 1990.", e: "would change : le futur du passé." },
      { q: "« The film was ___ start when the power went off. »", o: ["about to", "going", "to about"], i: "Juste sur le point de.", e: "was about to start." },
      { q: "Écris : « J'allais partir quand tu es arrivé. » (I…)", r: ["I was going to leave when you arrived", "I was about to leave when you arrived"], i: "was going to (ou about to) + base, puis le past simple.", e: "I was going to leave when you arrived." },
      { q: "Quelle phrase raconte un destin, dans un style littéraire ?", o: ["She was to become a famous writer.", "She will become a famous writer.", "She becomes a famous writer."], i: "La tournure était + to, dans un récit.", e: "was to become : elle allait devenir (le destin)." },
    ],
    secret: {
      titre: "La politesse du passé",
      texte: "« I was going to ask you something » adoucit une demande : on la présente comme une idée passée, moins directe. Les Anglais utilisent beaucoup ce recul pour paraître moins insistants. Tu le retrouveras au niveau C2 dans « Le passé qui adoucit ».",
      formule: "was going to · would · was about to · was to + base",
    },
  },
  {
    id: "ce-quil-aurait-fallu",
    niveau: "C1",
    titre: "Ce qu'il aurait fallu faire",
    notion: "Should have, could have, needn't have, didn't need to",
    heros: "🔁",
    declic: {
      scene: "🔁 🤦 📝",
      image: "Les modaux + have + participe sont la machine à refaire le passé : on y range les reproches, les occasions manquées et les efforts inutiles.",
      sens: "You should have told me (tu aurais dû me le dire). I could have helped (j'aurais pu aider). I needn't have bought bread (j'ai acheté du pain pour rien : il y en avait). I didn't need to buy bread (ce n'était pas nécessaire, donc je n'en ai pas acheté).",
    },
    demo: {
      etapes: [
        { p: "[s:You] [a:should] [a:have] [r:call][t:ed] me.", n: "should have + participe : le reproche, le conseil trop tard." },
        { p: "[s:She] [a:could] [a:have] [p:won].", n: "could have : une possibilité passée qui ne s'est pas réalisée." },
        { p: "[s:I] [a:need][k:n't] [a:have] [r:hurr][t:ied]. The train was late.", n: "needn't have + participe : je l'ai fait, mais c'était inutile." },
        { p: "[s:I] [a:did][k:n't] [r:need] [k:to] [r:hurry], so [s:I] [r:walk][t:ed] slowly.", n: "didn't need to : ce n'était pas nécessaire (et en général, je ne l'ai pas fait)." },
        { p: "[s:You] [a:might] [a:have] [r:warn][t:ed] me!", n: "might have, dans un reproche : tu aurais quand même pu me prévenir !" },
      ],
    },
    defi: [
      { q: "« I failed. I ___ harder. »", o: ["should have studied", "should studied", "must study"], i: "Un reproche sur le passé.", e: "should have studied : j'aurais dû étudier davantage." },
      { q: "« I took an umbrella, but it didn't rain. I ___ it. »", o: ["needn't have taken", "didn't need to take", "mustn't have taken"], i: "Je l'ai pris, pour rien.", e: "needn't have taken : action faite mais inutile." },
      { q: "« We had plenty of time, so we ___. We walked. »", o: ["didn't need to rush", "needn't have rushed", "shouldn't rush"], i: "Pas nécessaire, et ils ne se sont pas pressés.", e: "didn't need to rush : on ne l'a pas fait." },
      { q: "Écris : « Tu aurais pu te blesser ! » (You…)", r: ["You could have hurt yourself", "You could've hurt yourself"], i: "could + have + participe. hurt, hurt, hurt.", e: "You could have hurt yourself!" },
      { q: "Touche le mot qui fait voyager le modal dans le passé.", p: "He shouldn't *have said that.", i: "modal + … + participe.", e: "« have » : shouldn't have said." },
    ],
    secret: {
      titre: "La nuance qui fait les grands lecteurs",
      texte: "La différence entre « needn't have done » et « didn't need to do » est l'une des plus fines de l'anglais. Le premier dit toujours que tu l'as fait (pour rien). Le second dit seulement que ce n'était pas nécessaire. Maîtrise-la, et tu liras les romans anglais sans perdre une nuance.",
      formule: "should / could / might / needn't + have + participe",
    },
  },
  {
    id: "irreel",
    niveau: "C1",
    titre: "Le passé qui n'est pas du passé",
    notion: "It's time, I'd rather, as if, suppose + past",
    heros: "🎭",
    declic: {
      scene: "🎭 🕰️ 💭",
      image: "Certaines expressions mettent un masque de passé sur le verbe, pour dire « ce n'est pas la réalité ».",
      sens: "It's time we went home (il est temps qu'on rentre : on ne l'a pas encore fait). I'd rather you stayed (je préférerais que tu restes). He acts as if he owned the place (comme s'il était le propriétaire). Le verbe est au passé, mais on parle du présent.",
    },
    demo: {
      etapes: [
        { p: "It's (high) time [s:you] [p:got] a job.", n: "It's time + sujet + past : il serait grand temps (reproche)." },
        { p: "[s:I][a:'d] rather [s:you] [a:did][k:n't] [r:smoke] here.", n: "I'd rather + autre sujet + past : je préférerais que tu…" },
        { p: "[s:She] talks [k:as if] [s:she] [p:knew] everything.", n: "as if / as though + past : une comparaison irréelle." },
        { p: "[k:Suppose] [s:you] [p:lost] your job. What would you do?", n: "Suppose / imagine + past : une hypothèse imaginaire." },
        { p: "It's time [k:to] [r:go]. / It's time [s:we] [p:went].", n: "Sans autre sujet, on garde to + base." },
      ],
    },
    defi: [
      { q: "« It's time you ___ to bed. »", o: ["went", "go", "will go"], i: "It's time + sujet : le masque du passé.", e: "It's time you went to bed." },
      { q: "« I'd rather you ___ me the truth. »", o: ["told", "tell", "to tell"], i: "Préférence sur ce qu'un autre fait : passé.", e: "I'd rather you told me." },
      { q: "« He spends money as if he ___ a millionaire. »", o: ["were", "is", "would be"], i: "Il ne l'est pas : comparaison irréelle.", e: "as if he were : were pour tous dans l'irréel." },
      { q: "Complète : « I'd rather (go) by train. » (moi-même)", r: ["go"], i: "Même sujet : pas de masque, juste la base.", e: "I'd rather go : quand le sujet ne change pas, would rather + base." },
      { q: "Touche le verbe au masque de passé.", p: "Suppose you *met the Queen. What would you say?", i: "On imagine une situation présente.", e: "« met » : une hypothèse, pas un passé réel." },
    ],
    secret: {
      titre: "Le passé, outil de l'imaginaire",
      texte: "Tu as maintenant vu le même principe partout : if I were, I wish I knew, it's time we left, I'd rather you stayed, as if he owned. En anglais, le passé ne sert pas seulement à raconter hier : c'est la couleur grammaticale de l'irréel. Une fois cette idée comprise, toutes ces tournures deviennent une seule règle.",
      formule: "it's time / I'd rather / as if / suppose + sujet + past",
    },
  },
  {
    id: "exigences",
    niveau: "C1",
    titre: "Le mode des exigences",
    notion: "Le subjonctif anglais (I insist that he be…)",
    heros: "📜",
    declic: {
      scene: "📜 ⚖️ 🖋️",
      image: "Après les verbes d'exigence, l'anglais formel utilise un mode rare : la base du verbe, même avec he ou she, sans -s.",
      sens: "The doctor recommended that she rest (pas « rests »). It is essential that he be on time (pas « is »). C'est le subjonctif anglais : on le trouve dans les contrats, les règlements, les discours officiels. En anglais britannique courant, on dit aussi « that she should rest ».",
    },
    demo: {
      etapes: [
        { p: "[s:I] insist that [s:he] [r:pay].", n: "Après insist, demand, suggest, recommend, propose : that + sujet + base." },
        { p: "It is vital that [s:she] [r:be] informed.", n: "Après it is essential / vital / important that : la base de be, c'est « be »." },
        { p: "[s:They] suggested that [s:we] [k:not] [r:go].", n: "La négation : not + base, sans do." },
        { p: "[s:They] suggested that [s:we] [a:should] [k:not] [r:go].", n: "La version britannique plus courante : should + base." },
      ],
    },
    defi: [
      { q: "« The teacher demanded that he ___ the room. »", o: ["leave", "leaves", "left"], i: "Après demand that : la base, sans -s.", e: "demanded that he leave : le subjonctif." },
      { q: "« It is essential that every student ___ present. »", o: ["be", "is", "are"], i: "La base de be.", e: "that every student be present." },
      { q: "« I suggest that she ___ a lawyer. »", o: ["consult", "consults", "to consult"], i: "Le subjonctif ne prend jamais de -s.", e: "suggest that she consult." },
      { q: "Écris la version avec should : « They recommend that he stay. » → « They recommend that he ___ stay. »", r: ["should"], i: "La version britannique courante.", e: "that he should stay." },
      { q: "Touche le verbe au subjonctif.", p: "We request that the payment *be made today.", i: "La base de be, après request that.", e: "« be » : subjonctif passif (be made)." },
    ],
    secret: {
      titre: "Les fossiles du subjonctif",
      texte: "Le subjonctif survit aussi dans des expressions figées que tu entends tous les jours : God save the King, Long live the Queen, Be that as it may (quoi qu'il en soit), Come what may (advienne que pourra), If need be (si besoin est), So be it (ainsi soit-il). Ce sont des fossiles vivants de l'anglais ancien.",
      formule: "insist / suggest / demand that + sujet + base",
    },
  },
  {
    id: "etats-bougent",
    niveau: "C1",
    titre: "Quand les verbes d'état bougent",
    notion: "Les verbes d'état à la forme -ing",
    heros: "🎚️",
    declic: {
      scene: "🧠 🎚️ 🎬",
      image: "Les verbes d'état refusent le -ing… sauf quand ils changent de sens et deviennent une action.",
      sens: "I think it's a good idea (une opinion, un état) / I'm thinking about the problem (une réflexion en cours, une action). I have a car (posséder) / I'm having lunch (prendre son déjeuner). You are silly (c'est ton caractère) / You're being silly (tu fais l'idiot en ce moment).",
    },
    demo: {
      etapes: [
        { p: "[s:I] [r:think] [s:you][a:'re] right. / [s:I][a:'m] [r:think][t:ing] of moving.", n: "think = penser (opinion) / think of, about = réfléchir (action)." },
        { p: "[s:She] [p:has] two kids. / [s:She][a:'s] [r:hav][t:ing] a shower.", n: "have = posséder / have + repas, bain, fête, temps = une action." },
        { p: "This soup [r:taste][t:s] good. / [s:He][a:'s] [r:tast][t:ing] the soup.", n: "taste, smell, look : ce que perçoivent les sens / l'action volontaire de goûter." },
        { p: "[s:He] [p:is] rude. / [s:He][a:'s] [a:being] rude today.", n: "be + -ing : un comportement temporaire, inhabituel." },
        { p: "[s:I][a:'m] [r:lov][t:ing] this holiday!", n: "Usage familier moderne : un plaisir intense, en ce moment." },
      ],
      machine: { temps: ["presentSimple", "presentContinuous"], verbes: ["think", "have", "taste", "be", "see"] },
    },
    defi: [
      { q: "« I ___ that he's lying. » (c'est mon opinion)", o: ["think", "am thinking", "'m think"], i: "Une opinion est un état.", e: "I think : opinion → forme simple." },
      { q: "« Sorry, I can't talk now. We ___ dinner. »", o: ["'re having", "have", "'re have"], i: "have + repas = une action en cours.", e: "We're having dinner : on est en train de dîner." },
      { q: "« Why ___ so selfish today? You're not usually like this. »", o: ["are you being", "are you", "do you be"], i: "Un comportement temporaire.", e: "are you being : un comportement inhabituel, en ce moment." },
      { q: "« This cake ___ delicious. »", o: ["smells", "is smelling", "smell"], i: "Ce que perçoivent les sens : un état.", e: "It smells delicious : état." },
      { q: "Touche le verbe d'état utilisé comme une action.", p: "I'm *seeing the doctor at five.", i: "Ici, ce n'est pas « voir avec les yeux ».", e: "« seeing » = avoir rendez-vous avec : une action." },
    ],
    secret: {
      titre: "Le test de l'action",
      texte: "Demande-toi : est-ce que je pourrais filmer ce qui se passe ? « Je suis en train d'avoir une voiture » : impossible à filmer. « Je suis en train de prendre une douche » : oui. Si on peut le filmer, le -ing est permis, même pour un verbe d'état. Sinon, forme simple.",
      formule: "état → forme simple · le même verbe en action → -ing",
    },
  },
  {
    id: "futurs-officiels",
    niveau: "C1",
    titre: "Les futurs officiels",
    notion: "Be to, be due to, be on the point of, be bound to",
    heros: "🏛️",
    declic: {
      scene: "🏛️ 📢 🗓️",
      image: "Les journaux et les institutions ont leurs propres futurs : plus solennels, plus précis.",
      sens: "The President is to visit China next month (c'est prévu officiellement). The plane is due to land at 6 (c'est prévu selon l'horaire). She's bound to win (elle va forcément gagner). They're on the point of signing (ils sont sur le point de signer).",
    },
    demo: {
      etapes: [
        { p: "The Prime Minister [a:is] [k:to] [r:meet] the King tomorrow.", n: "be to + base : un événement officiel, programmé. Très fréquent dans la presse." },
        { p: "The train [a:is] [k:due to] [r:arrive] at 10.", n: "be due to : selon l'horaire prévu." },
        { p: "[s:You] [a:are] [k:bound to] [r:like] it.", n: "be bound to : c'est certain, forcément." },
        { p: "[s:I] [a:was] [k:on the point of] [r:giv][t:ing] up.", n: "be on the point of + -ing : à deux doigts de." },
        { p: "[s:You] [a:are] [k:not to] [r:leave] this room!", n: "be not to : un ordre ou une interdiction, très ferme." },
      ],
    },
    defi: [
      { q: "« The new law ___ come into force next year. » (style presse)", o: ["is to", "is going", "will to"], i: "Un futur officiel et programmé.", e: "is to come into force : c'est décidé officiellement." },
      { q: "« The baby is ___ be born in March. »", o: ["due to", "bound for", "about"], i: "Selon le calendrier prévu.", e: "is due to be born : la naissance est prévue en mars." },
      { q: "« Don't worry, it's ___ happen sooner or later. »", o: ["bound to", "due", "to about"], i: "C'est inévitable.", e: "bound to happen : ça va forcément arriver." },
      { q: "Complète : « They were on the point of (sell) the house. »", r: ["selling"], i: "on the point of + -ing.", e: "on the point of selling." },
      { q: "Quel sens a « You are not to touch this »?", o: ["Une interdiction ferme.", "Une prédiction.", "Une possibilité."], i: "be not to : comme un règlement.", e: "Tu ne dois pas y toucher : c'est un ordre." },
    ],
    secret: {
      titre: "Les titres de journaux",
      texte: "Dans les gros titres, « to » seul suffit pour annoncer un futur officiel : « PM to visit Paris » = The Prime Minister is to visit Paris. Le verbe be disparaît pour gagner de la place. Lire la presse anglaise devient beaucoup plus facile quand on connaît ce code.",
      formule: "be to · be due to · be bound to + base · be on the point of + -ing",
    },
  },

  /* ===================== C2 ===================== */
  {
    id: "present-raconte",
    niveau: "C2",
    titre: "Le présent qui raconte",
    notion: "Le présent narratif, les titres de presse, le commentaire",
    heros: "🎙️",
    declic: {
      scene: "🎙️ 📰 ⚽",
      image: "Les grands conteurs savent tricher avec le temps : ils racontent le passé au présent pour te mettre au cœur de l'action.",
      sens: "So I'm walking down the street, and this guy comes up to me and says… (une anecdote racontée à l'oral). « Fire destroys historic library » (un titre de presse pour un événement passé). « Smith passes to Jones, who shoots… and scores! » (le commentaire sportif).",
    },
    demo: {
      etapes: [
        { p: "So [s:I][a:'m] [r:sit][t:ting] in a café, and this woman [r:walk][t:s] in…", n: "Anecdote orale : present continuous pour le décor, present simple pour les événements." },
        { p: "Scientists [r:discover] new planet.", n: "Titre de presse : present simple pour un événement récent, sans articles." },
        { p: "Messi [r:take][t:s] the ball, [r:beat][t:s] two defenders… and [r:score][t:s]!", n: "Commentaire en direct : present simple pour les actions rapides." },
        { p: "In 1492, Columbus [r:sail][t:s] west…", n: "Le présent historique, dans les documentaires et les résumés de livres et de films." },
      ],
    },
    defi: [
      { q: "Un titre de presse annonce un événement d'hier. Lequel est le plus naturel ?", o: ["Earthquake hits Japan", "An earthquake hit Japan yesterday", "Earthquake has hit Japan yesterday"], i: "Les titres sont courts et au présent.", e: "Earthquake hits Japan : présent, sans article." },
      { q: "Dans une anecdote, « So I'm waiting for the bus, and this man ___ me for money. »", o: ["asks", "asked to", "has asked"], i: "Le présent narratif garde le présent pour les événements.", e: "asks : la suite de l'histoire, au présent." },
      { q: "Un résumé de film : « In the end, the hero ___ the princess. »", o: ["saves", "saved by", "has save"], i: "Les résumés de livres et de films utilisent le présent.", e: "saves : on résume une histoire au présent." },
      { q: "Que signifie le titre « PM to resign »?", o: ["Le Premier ministre va démissionner.", "Le Premier ministre a démissionné.", "Le Premier ministre démissionne en ce moment."], i: "to + base, dans un titre.", e: "to = is to : un futur annoncé." },
      { q: "Touche le verbe au présent narratif.", p: "Then the door opens and a stranger *walks in.", i: "Un événement passé, raconté au présent.", e: "« walks » : le conteur te place dans la scène." },
    ],
    secret: {
      titre: "Le code des gros titres",
      texte: "Les titres anglais suivent trois règles : présent simple pour le passé récent (Fire destroys…), to + base pour le futur (PM to visit…), participe seul pour le passif (Man arrested = a man has been arrested). Les articles et le verbe be disparaissent. Avec ce code, tu lis la presse anglaise d'un seul coup d'œil.",
      formule: "présent = passé récent · to + base = futur · participe = passif",
    },
  },
  {
    id: "passe-adoucit",
    niveau: "C2",
    titre: "Le passé qui adoucit",
    notion: "Le passé de distance (politesse)",
    heros: "🕊️",
    declic: {
      scene: "🕊️ 🎩 🙏",
      image: "En anglais, reculer dans le temps, c'est aussi prendre de la distance… et donc être plus poli.",
      sens: "I was wondering if you could help me (je me demandais si…) est bien plus doux que « Can you help me? ». On ne parle pas du passé : on met une distance respectueuse. Le continuous adoucit encore plus : I was hoping…, Were you wanting a table?",
    },
    demo: {
      etapes: [
        { p: "[s:I] [a:was] [r:wonder][t:ing] [k:if] [s:you] [a:could] [r:help] me.", n: "La demande la plus polie de l'anglais britannique." },
        { p: "[s:I] [a:was] [r:hop][t:ing] [s:we] [a:could] [r:talk].", n: "I was hoping : on présente son souhait avec délicatesse." },
        { p: "[a:Did] [s:you] [r:want] anything else?", n: "Un serveur au présent, poliment reculé au passé." },
        { p: "[s:I] [r:thought] [s:you] [a:might] [r:like] this.", n: "On propose sans imposer." },
        { p: "[s:I] [a:would] [r:suggest] that…", n: "would + verbe d'opinion : une opinion présentée avec modestie." },
      ],
    },
    defi: [
      { q: "Quelle demande est la plus polie ?", o: ["I was wondering if I could leave early.", "Can I leave early?", "I want to leave early."], i: "Le recul dans le temps adoucit.", e: "I was wondering if… : la formule de politesse par excellence." },
      { q: "Le passé dans « I was hoping you could help » parle :", o: ["du présent, avec politesse", "d'un espoir disparu", "d'un événement d'hier"], i: "C'est une distance, pas une date.", e: "On parle de maintenant, mais avec délicatesse." },
      { q: "Un vendeur te demande poliment : « ___ you looking for anything in particular? »", o: ["Were", "Did", "Have"], i: "Le past continuous de politesse.", e: "Were you looking for…? : très courtois." },
      { q: "Écris la demande polie : « Je me demandais si tu étais libre ce soir. » (I was…)", r: ["I was wondering if you were free tonight", "I was wondering if you were free this evening", "I was wondering whether you were free tonight", "I was wondering whether you were free this evening"], i: "I was wondering if + sujet + past.", e: "I was wondering if you were free tonight." },
      { q: "Touche le mot qui rend la proposition plus modeste.", p: "I *would argue that the plan is too expensive.", i: "Le modal qui adoucit une opinion.", e: "« would » : une opinion présentée avec prudence." },
    ],
    secret: {
      titre: "L'échelle de la politesse",
      texte: "Du plus direct au plus délicat : Can you…? → Could you…? → Would you mind…? → I wonder if you could… → I was wondering if you could… → I was just wondering whether you might possibly… Plus on recule dans le temps et plus on ajoute de modaux, plus on est poli. Choisis le bon barreau selon la personne.",
      formule: "I was wondering / hoping … · Did you want …? · I would suggest …",
    },
  },
  {
    id: "si-sans-si",
    niveau: "C2",
    titre: "Si… sans « if »",
    notion: "L'inversion conditionnelle (Had I known, Were he to, Should you)",
    heros: "🔃",
    declic: {
      scene: "🔃 🎩 ✒️",
      image: "Dans le style soutenu, « if » s'efface : le moteur passe devant le sujet et porte la condition à lui tout seul.",
      sens: "Had I known = If I had known. Were she to ask = If she asked (si jamais elle demandait). Should you need anything = If you need anything (si vous aviez besoin de quoi que ce soit). C'est l'anglais des lettres officielles, des discours et des romans.",
    },
    demo: {
      etapes: [
        { p: "[a:Had] [s:I] [p:known], [s:I] [a:would] [a:have] [r:help][t:ed].", n: "Had + sujet + participe = If + sujet + had + participe." },
        { p: "[a:Were] [s:he] [k:to] [r:resign], the company would collapse.", n: "Were + sujet + to + base : une hypothèse lointaine (si jamais il démissionnait)." },
        { p: "[a:Should] [s:you] [r:need] help, please call us.", n: "Should + sujet + base : si par hasard (très courant dans les courriels professionnels)." },
        { p: "[a:Had] [s:we] [k:not] [r:arrive][t:d] in time…", n: "La négation reste non contractée : Had we not…, jamais Hadn't we…" },
      ],
    },
    defi: [
      { q: "« ___ I known about the problem, I would have called you. »", o: ["Had", "If", "Have"], i: "Sans if, le moteur passe devant.", e: "Had I known = If I had known." },
      { q: "« ___ you have any questions, do not hesitate to contact us. »", o: ["Should", "Would", "Will"], i: "La formule des lettres professionnelles.", e: "Should you have any questions = If you have any questions." },
      { q: "« Were she ___ the truth, she would be shocked. »", o: ["to learn", "learn", "learned"], i: "Were + sujet + to + base.", e: "Were she to learn the truth = If she learned the truth." },
      { q: "Réécris sans « if » : « If I had seen him, I would have told you. »", r: ["Had I seen him, I would have told you", "Had I seen him I would have told you", "Had I seen him, I'd have told you", "Had I seen him I'd have told you"], i: "Had + sujet + participe.", e: "Had I seen him, I would have told you." },
      { q: "Quelle forme négative est juste ?", o: ["Had it not been for you, I'd have failed.", "Hadn't it been for you, I'd have failed.", "Had it been not for you, I'd have failed."], i: "En inversion, la négation ne se contracte pas.", e: "Had it not been for you : sans toi, j'aurais échoué." },
    ],
    secret: {
      titre: "« But for » et « Had it not been for »",
      texte: "« Had it not been for your help, I would have failed » (sans ton aide, j'aurais échoué) peut se raccourcir en « But for your help, I would have failed ». Ces formules sont l'élégance même de l'anglais écrit. À utiliser dans une lettre de motivation ou un discours de remerciement.",
      formule: "Had + S + p · Were + S + to + base · Should + S + base",
    },
  },
  {
    id: "will-insistant",
    niveau: "C2",
    titre: "Will l'insistant",
    notion: "Will et would pour le caractère, l'habitude et la supposition",
    heros: "🧦",
    declic: {
      scene: "🧦 😤 🔔",
      image: "Will ne parle pas toujours du futur : il peut décrire un caractère, une manie, ou une supposition sur le présent.",
      sens: "He will leave his socks everywhere! (c'est sa manie, et ça m'agace : on accentue « will »). When I was little, my grandfather would tell me stories (il avait l'habitude de). The doorbell! That'll be the postman (ça doit être le facteur).",
    },
    demo: {
      etapes: [
        { p: "[s:She] [a:will] [r:talk] for hours if you let her.", n: "will : un comportement typique, une tendance du caractère." },
        { p: "[s:He] [a:WILL] [r:interrupt] me all the time!", n: "will accentué à l'oral : une manie agaçante." },
        { p: "Every summer, [s:we] [a:would] [r:go] to the sea.", n: "would : une habitude passée, avec nostalgie (comme used to, mais pas pour les états)." },
        { p: "That [a:will] [r:be] Sarah at the door.", n: "will : une supposition sûre sur le présent." },
        { p: "Boys [a:will] [r:be] boys.", n: "Un proverbe : c'est dans leur nature." },
      ],
    },
    defi: [
      { q: "« When we were kids, my dad ___ us to the park every Sunday. »", o: ["would take", "will take", "would took"], i: "Une habitude passée, racontée avec nostalgie.", e: "would take : il nous emmenait (habitude)." },
      { q: "« Someone's knocking. — That ___ the delivery man. »", o: ["'ll be", "be", "'s going be"], i: "Une supposition sur le présent.", e: "That'll be… : ça doit être le livreur." },
      { q: "« I ___ have a car. » (avant, j'avais une voiture : un état)", o: ["used to", "would", "will"], i: "Would refuse les états (have, be, live, know).", e: "used to : would ne s'utilise que pour des actions répétées.", io: { would: "Would ne marche que pour des actions répétées, pas pour un état comme posséder." } },
      { q: "Que veut dire « He will keep asking stupid questions! »?", o: ["Il n'arrête pas de poser des questions bêtes, ça m'agace.", "Il posera des questions bêtes demain.", "Il veut poser des questions bêtes."], i: "Will accentué : une manie.", e: "Une manie agaçante, pas un futur." },
      { q: "Touche le modal qui décrit une habitude passée.", p: "On rainy days, she *would sit by the window for hours.", i: "Une action répétée autrefois.", e: "« would » : elle avait l'habitude de s'asseoir." },
    ],
    secret: {
      titre: "Would ou used to ?",
      texte: "Les deux décrivent des habitudes passées, mais would ne marche qu'avec des actions répétées (would go, would tell). Pour un état passé (be, have, live, know, like), seul used to fonctionne : I used to live in Rome, jamais « I would live in Rome ». Et il faut souvent planter le décor d'abord avec used to, puis continuer avec would.",
      formule: "will = caractère, supposition · would = habitude passée (actions)",
    },
  },
];
