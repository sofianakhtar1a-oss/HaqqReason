import type { Ajout } from "./types";

/*
 * La Machine à voyager dans le temps — leçons ajoutées aux niveaux C1 et C2.
 * Chacune prend place juste après la leçon qu'elle prolonge (« apres »), sans rien retirer.
 */

export const CONJUGAISON_PLUS_C: Ajout[] = [
  /* ===================== C1 ===================== */
  {
    apres: "ce-quil-aurait-fallu",
    lecon: {
      id: "infinitifs-composes",
      niveau: "C1",
      titre: "L'infinitif voyageur",
      notion: "To have done, to be doing, to be done : les infinitifs composés",
      heros: "🧳",
      declic: {
        scene: "🧳 ⏮️ 🔄",
        image: "L'infinitif aussi sait voyager dans le temps : to have done regarde en arrière, to be doing regarde ce qui est en cours, to be done le met au passif.",
        sens: "He seems to be tired (il a l'air fatigué). He seems to have left (il semble être parti). She is said to be working on a novel (on dit qu'elle travaille à un roman). Ces formes permettent des phrases courtes et précises, très appréciées à l'écrit.",
      },
      demo: {
        etapes: [
          { p: "[s:He] [v:seems] [k:to] [a:have] [p:forgotten] my name.", n: "to have + participe : une action antérieure (il semble avoir oublié)." },
          { p: "[s:She] [v:appears] [k:to] [a:be] [r:sleep][t:ing].", n: "to be + -ing : une action en cours (elle semble être en train de dormir)." },
          { p: "[s:The painting] [a:is] [p:thought] [k:to] [a:have] [a:been] [p:stolen] in 1990.", n: "to have been + participe : passif et antérieur (on pense qu'il a été volé)." },
          { p: "[s:I][a:'d] [v:like] [k:to] [a:have] [p:seen] her face!", n: "Un regret amusé : j'aurais aimé voir sa tête !" },
          { p: "[s:I][a:'m] sorry [k:to] [a:have] [p:kept] you waiting.", n: "Désolé de vous avoir fait attendre : l'attente est déjà passée." },
        ],
      },
      defi: [
        { q: "« He seems ___ a lot of weight. » (c'est déjà fait)", o: ["to have lost", "to lose", "losing"], i: "Une action antérieure à « seems ».", e: "He seems to have lost a lot of weight." },
        { q: "« They are believed ___ in Spain right now. »", o: ["to be living", "to have lived", "living"], i: "Une situation en cours, maintenant.", e: "They are believed to be living in Spain." },
        { q: "« The bridge is said ___ in the 12th century. »", o: ["to have been built", "to be built", "to have built"], i: "Construit (passif), et il y a longtemps (antérieur).", e: "The bridge is said to have been built in the 12th century." },
        { q: "Complète : « I'm sorry (miss) your party. » (c'est passé)", r: ["to have missed"], i: "to have + participe.", e: "I'm sorry to have missed your party." },
        { q: "Réécris : « It seems that she has found a new job. » → She seems…", r: ["She seems to have found a new job", "to have found a new job"], i: "seem + to have + participe.", e: "She seems to have found a new job." },
        { q: "Touche les trois mots de l'infinitif passé.", p: "You were lucky *to *have *escaped unhurt.", i: "to + have + participe.", e: "to have escaped : avoir échappé (c'est déjà arrivé)." },
      ],
      secret: {
        titre: "Le « aurait » des journalistes",
        texte: "La presse adore ces formes pour rester prudente : « The minister is reported to have resigned » (le ministre aurait démissionné). Le conditionnel journalistique français (« aurait », « serait ») se traduit très souvent par is said / reported / believed + infinitif composé.",
        formule: "to have + participe (avant) · to be + -ing (en cours) · to be / to have been + participe (passif)",
      },
    },
  },
  {
    apres: "futurs-officiels",
    lecon: {
      id: "demi-modaux",
      niveau: "C1",
      titre: "Les demi-modaux",
      notion: "Need et dare (needn't, How dare you!, need + -ing)",
      heros: "🌗",
      declic: {
        scene: "🌗 🤔 💪",
        image: "Need et dare ont une double vie : tantôt verbes ordinaires (avec do, -s et to), tantôt modaux (sans rien).",
        sens: "Verbe ordinaire : You don't need to come, Does he dare to say it? Modal : You needn't come, How dare you! La forme modale est surtout britannique et soutenue, et presque uniquement à la négative et en question.",
      },
      demo: {
        etapes: [
          { p: "[s:You] [a:don't] [v:need] [k:to] [r:wait]. = [s:You] [a:needn't] [r:wait].", n: "Pas besoin : don't need to (courant) = needn't (modal, plus britannique)." },
          { p: "[s:She] [v:needs] [k:to] [r:rest].", n: "À l'affirmative, need est presque toujours un verbe ordinaire : needs to." },
          { p: "[k:How] [a:dare] [s:you]!", n: "Comment oses-tu ! dare modal, figé dans cette exclamation." },
          { p: "[s:He] [a:didn't] [v:dare] ([k:to]) [r:speak].", n: "dare verbe ordinaire : le to est facultatif après la négation." },
          { p: "[s:My car] [v:needs] [r:wash][t:ing].", n: "need + -ing = sens passif : ma voiture a besoin d'être lavée." },
        ],
      },
      defi: [
        {
          q: "« You ___ bring anything. We have everything. »",
          o: ["needn't", "needn't to", "don't need"],
          i: "Le modal : pas de to après.",
          e: "You needn't bring anything (= You don't need to bring anything).",
          io: { "don't need": "« don't need » demande to : You don't need to bring anything." },
        },
        { q: "« The grass needs ___. »", o: ["cutting", "cut", "to cutting"], i: "need + -ing, au sens passif.", e: "The grass needs cutting (= needs to be cut)." },
        { q: "« ___ you speak to me like that! »", o: ["How dare", "How dares", "How do dare"], i: "L'exclamation figée.", e: "How dare you speak to me like that!" },
        { q: "Réécris avec needn't : « It isn't necessary for you to call. »", r: ["You needn't call"], i: "needn't + base.", e: "You needn't call." },
        { q: "« She ___ tell her parents the truth. » (elle n'osait pas)", o: ["didn't dare", "dared not to", "doesn't dared"], i: "dare au passé, comme un verbe ordinaire.", e: "She didn't dare (to) tell her parents." },
        { q: "Touche la forme qui montre que need est ici un modal.", p: "He *needn't worry about it.", i: "Ni -s, ni to.", e: "needn't, sans -s et sans to : la forme modale." },
      ],
      secret: {
        titre: "Needn't have ou didn't need to ?",
        texte: "Au passé, la nuance est fine : « I needn't have hurried » = je me suis dépêché, mais c'était inutile. « I didn't need to hurry » = ce n'était pas nécessaire (et en général, je ne l'ai pas fait). Tu as croisé ce duo dans « Ce qu'il aurait fallu faire » : needn't et dare sont ses cousins de la famille des demi-modaux.",
        formule: "needn't + base = don't need to · How dare you! · need + -ing (sens passif)",
      },
    },
  },

  /* ===================== C2 ===================== */
  {
    apres: "si-sans-si",
    lecon: {
      id: "formules-figees",
      niveau: "C2",
      titre: "Les formules de pierre",
      notion: "Le subjonctif figé : Long live…, Be that as it may, Come what may, So be it",
      heros: "🗿",
      declic: {
        scene: "🏛️ 👑 🗿",
        image: "Quelques phrases anglaises sont des statues : elles ont gardé un très vieux subjonctif, et on ne les touche plus.",
        sens: "Long live the King! (Vive le roi !). God save the Queen. Be that as it may (quoi qu'il en soit). Come what may (advienne que pourra). So be it (ainsi soit-il). Le verbe y reste à la base, sans -s, quel que soit le sujet. On les comprend et on les cite, sans en fabriquer de nouvelles.",
      },
      demo: {
        legende: { r: "le verbe figé, toujours à la base" },
        etapes: [
          { p: "Long [r:live] the King!", n: "Vive le roi ! Un souhait : que le roi vive longtemps." },
          { p: "[r:Be] that as it may, we must go on.", n: "Quoi qu'il en soit : pour clore une discussion." },
          { p: "[r:Come] what may, I'll stand by you.", n: "Advienne que pourra : quoi qu'il arrive." },
          { p: "[r:Suffice] it to say that he wasn't happy.", n: "Qu'il suffise de dire… : je n'en dirai pas plus." },
          { p: "If need [r:be], we'll work all night.", n: "Si besoin est : une formule figée, très courante." },
        ],
      },
      defi: [
        { q: "« ___ what may, we'll finish the project. »", o: ["Come", "Comes", "Coming"], i: "Un subjonctif figé : la base.", e: "Come what may (advienne que pourra)." },
        { q: "Quel est le sens de « Be that as it may » ?", o: ["Quoi qu'il en soit", "Que cela soit possible", "Comme il se doit"], i: "On l'utilise pour passer outre un argument.", e: "Be that as it may = quoi qu'il en soit." },
        { q: "« ___ it to say, the evening was a disaster. »", o: ["Suffice", "Suffices", "Sufficing"], i: "La base, même avec it.", e: "Suffice it to say…" },
        { q: "Complète : « If need ___, I can drive you to the airport. »", r: ["be"], i: "Si besoin est.", e: "If need be." },
        { q: "Que signifie « God save the Queen » ?", o: ["Que Dieu protège la reine", "Dieu a sauvé la reine", "Dieu sauve la reine chaque jour"], i: "save sans -s : un souhait.", e: "Un subjonctif de souhait : que Dieu protège la reine." },
        { q: "Touche le verbe au subjonctif figé.", p: "Heaven *forbid that anything should happen to her.", i: "Le verbe sans -s après Heaven.", e: "forbid sans -s : Heaven forbid (à Dieu ne plaise)." },
      ],
      secret: {
        titre: "Le -s qui manque n'est pas une faute",
        texte: "« God save », « Heaven help us », « Long live » : le verbe ne prend pas de -s, car ce n'est pas un présent mais un souhait. Ces formules viennent du vieil anglais et du style biblique. À l'écrit soutenu, elles donnent un ton solennel ou ironique : « Heaven help us if he becomes the boss! »",
        formule: "Long live… · God save… · Be that as it may · Come what may · So be it · If need be · Suffice it to say",
      },
    },
  },
  {
    apres: "will-insistant",
    lecon: {
      id: "nuances-modales",
      niveau: "C2",
      titre: "Les modaux de la nuance",
      notion: "May well, might as well, could hardly, can't help -ing, cannot but",
      heros: "🎚️",
      declic: {
        scene: "🎚️ 🤏 🎯",
        image: "Au sommet de l'anglais, les modaux s'associent à de petits mots pour régler la nuance au millimètre.",
        sens: "She may well be right (il est fort possible qu'elle ait raison). We might as well leave (autant partir). I could hardly breathe (je pouvais à peine respirer). I can't help laughing (je ne peux pas m'empêcher de rire). Ce sont des blocs tout faits, à connaître tels quels.",
      },
      demo: {
        etapes: [
          { p: "[s:She] [a:may] [k:well] [r:be] right.", n: "may well = il est fort possible que (plus probable que may seul)." },
          { p: "The bus isn't coming. [s:We] [a:might] [k:as well] [r:walk].", n: "might as well = autant (faute de mieux)." },
          { p: "[s:I] [a:could] [k:hardly] [r:believe] it.", n: "could hardly = pouvoir à peine (presque pas)." },
          { p: "[s:I] [a:can't] [v:help] [r:laugh][t:ing].", n: "can't help + -ing = ne pas pouvoir s'empêcher de." },
          { p: "[s:One] [a:cannot] [k:but] [r:admire] her courage.", n: "cannot but + base = ne pas pouvoir faire autrement que (très soutenu)." },
        ],
      },
      defi: [
        { q: "« There's nothing on TV. We ___ go to bed. »", o: ["might as well", "may well", "could hardly"], i: "Autant… (faute de mieux).", e: "We might as well go to bed." },
        { q: "« He's tall and fast: he ___ win the race. » (c'est fort possible)", o: ["may well", "might as well", "can't help"], i: "Une forte probabilité.", e: "He may well win the race." },
        { q: "« I can't help ___ about the exam. »", o: ["worrying", "to worry", "worry"], i: "can't help + -ing.", e: "I can't help worrying about the exam." },
        { q: "Traduis : « Je pouvais à peine marcher. »", r: ["I could hardly walk", "I could barely walk", "I could scarcely walk"], i: "could + hardly + base.", e: "I could hardly walk." },
        { q: "Quel est le sens de « You might have told me! » ?", o: ["Tu aurais pu me le dire ! (reproche)", "Tu me l'as peut-être dit.", "Tu me le diras peut-être."], i: "might have + participe, dit avec agacement.", e: "Un reproche : tu aurais pu me prévenir !" },
        { q: "Touche les mots qui veulent dire « autant ».", p: "It's late, so we *might *as *well stay here.", i: "Trois petits mots, un seul sens.", e: "might as well = autant." },
      ],
      secret: {
        titre: "Hardly n'est pas « durement »",
        texte: "Hard = dur, durement (work hard). Hardly = à peine, presque pas (I hardly know him = je le connais à peine). Les deux n'ont rien à voir ! Et comme hardly est déjà négatif, pas de not avec lui : « I could hardly hear », jamais « I couldn't hardly hear ».",
        formule: "may well (fort possible) · might as well (autant) · could hardly (à peine) · can't help + -ing · cannot but + base",
      },
    },
  },
];
