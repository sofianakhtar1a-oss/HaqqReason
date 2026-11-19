import type { Ajout } from "./types";

/*
 * La Cité des mots — leçons ajoutées aux niveaux C1 et C2.
 * Chacune prend place juste après la leçon qu'elle prolonge (« apres »), sans rien retirer.
 */

export const GRAMMAIRE_PLUS_C: Ajout[] = [
  /* ===================== C1 ===================== */
  {
    apres: "ne-pas-repeter",
    lecon: {
      id: "rappels",
      niveau: "C1",
      titre: "Les fils qui relient",
      notion: "La cohésion : this / these + nom, the former / the latter, such, the same",
      heros: "🧵",
      declic: {
        scene: "🧵 🔗 📄",
        image: "Un texte bien écrit est cousu : chaque phrase est rattachée à la précédente par de petits fils de rappel.",
        sens: "This problem, these issues, such a decision, the former, the latter : ces mots renvoient à ce qui vient d'être dit, sans le répéter. Ils évitent la lourdeur et guident le lecteur. C'est une marque de l'anglais écrit de niveau C1.",
      },
      demo: {
        legende: { d: "le mot de rappel", o: "le mot de rappel (pronom)" },
        etapes: [
          { p: "Prices rose by 20%. [d:This] [n:increase] surprised everyone.", n: "this + un nom qui résume l'idée précédente (un « nom-étiquette » : this increase, this problem, this decision)." },
          { p: "We met Paul and Anna. The [o:former] is a doctor, the [o:latter] a lawyer.", n: "the former = le premier des deux, the latter = le second." },
          { p: "He lied to me. [d:Such] [n:behaviour] is unacceptable.", n: "such + nom = un tel, de tels : renvoie à ce qui précède." },
          { p: "I ordered fish, and she did the [o:same].", n: "the same = la même chose." },
          { p: "Some say it's too late. [d:This] [n:view], however, is wrong.", n: "this view, this argument, this approach : reprendre une opinion pour la discuter." },
        ],
      },
      defi: [
        { q: "« Unemployment fell last year. ___ was good news. »", o: ["This", "It's", "These"], i: "Un mot qui résume toute la phrase précédente.", e: "This was good news." },
        { q: "« I like both tea and coffee, but I prefer ___ in the morning. » (le café)", o: ["the latter", "the former", "the last"], i: "Le second des deux.", e: "the latter (coffee)." },
        { q: "« The government raised taxes. ___ measures are never popular. »", o: ["Such", "So", "This"], i: "De telles mesures…", e: "Such measures are never popular." },
        { q: "Complète : « She ordered a salad and I had the ___. »", r: ["same"], i: "la même chose.", e: "I had the same." },
        {
          q: "Quel nom-étiquette résume le mieux : « Many shops closed and jobs were lost. ___ was a disaster for the town. »",
          o: ["This decline", "This sentence", "This shop"],
          i: "Trouve le nom qui résume toute l'idée.",
          e: "This decline (ce déclin) reprend toute l'idée.",
        },
        { q: "Touche les deux mots qui renvoient au premier élément.", p: "Rome and Paris are beautiful, but *the *former is older.", i: "Le premier des deux.", e: "the former = Rome." },
      ],
      secret: {
        titre: "Les noms-étiquettes",
        texte: "Les rédacteurs anglais adorent résumer une phrase par un nom : this problem, this issue, this trend, this approach, this view, this claim, this shift. Au lieu de « this » tout seul (vague), « this trend » dit exactement de quoi on parle. C'est l'outil le plus simple pour rendre un essai fluide.",
        formule: "this / these + nom-étiquette · such + nom · the former / the latter · the same",
      },
    },
  },
  {
    apres: "panneaux",
    lecon: {
      id: "marqueurs-oral",
      niveau: "C1",
      titre: "Les petits mots de la conversation",
      notion: "Les marqueurs de l'oral : actually, anyway, I mean, by the way, mind you",
      heros: "🗨️",
      declic: {
        scene: "🗨️ ☕ 🤝",
        image: "À l'oral, les anglophones sèment de petits mots qui ne disent rien… mais qui disent tout : ils corrigent, changent de sujet, adoucissent.",
        sens: "Actually (en fait) corrige. Anyway (bref, enfin) reprend le fil. I mean (je veux dire) précise. By the way (au fait) change de sujet. Mind you (remarque) ajoute une réserve. Les maîtriser rend ton anglais naturel, comme celui d'un natif.",
      },
      demo: {
        legende: { k: "le marqueur de l'oral" },
        etapes: [
          { p: "I thought he was French. [k:Actually], he's Belgian.", n: "actually = en fait (pas « actuellement » !) : pour corriger ou surprendre." },
          { p: "…and the train was late. [k:Anyway], we got there in the end.", n: "anyway = bref, de toute façon : on revient à l'essentiel." },
          { p: "It's expensive. [k:I mean], really expensive.", n: "I mean = je veux dire : on précise ou on corrige sa propre phrase." },
          { p: "[k:By the way], have you seen Tom?", n: "by the way = au fait : on change de sujet." },
          { p: "The hotel was noisy. [k:Mind you], it was cheap.", n: "mind you = remarque, cela dit : une petite réserve." },
        ],
      },
      defi: [
        { q: "« I don't usually like jazz. ___, I love this song! »", o: ["Mind you", "By the way", "In the way"], i: "Une petite réserve, cela dit…", e: "Mind you, I love this song! (cela dit…)" },
        { q: "Comment dit-on « actuellement » ?", o: ["currently", "actually", "anyway"], i: "Le faux ami !", e: "actuellement = currently / at the moment. actually = en fait." },
        { q: "« We talked for hours about his problems. ___, let's get back to work. »", o: ["Anyway", "Actually", "I mean"], i: "On revient à l'essentiel.", e: "Anyway, let's get back to work." },
        {
          q: "Traduis : « Au fait, tu as appelé ta mère ? »",
          r: ["By the way, did you call your mother", "By the way, have you called your mother", "By the way, did you call your mum", "By the way, have you called your mum", "By the way, did you call your mom", "By the way, have you called your mom"],
          i: "Au fait = by the way.",
          e: "By the way, did you call your mother?",
        },
        { q: "« She's not very friendly. ___, she's quite cold. »", o: ["I mean", "By the way", "Mind you"], i: "On précise sa pensée.", e: "I mean, she's quite cold." },
        { q: "Touche le marqueur qui corrige une idée.", p: "*Actually, the meeting is tomorrow, not today.", i: "En fait…", e: "Actually = en fait." },
      ],
      secret: {
        titre: "Pas partout",
        texte: "Ces mots rendent l'oral naturel, mais à l'écrit formel ils sonnent familiers. Dans un essai, préfère in fact (au lieu de actually), in any case (anyway), that is to say (I mean), incidentally (by the way), nevertheless (mind you). Et évite le « like » toutes les deux secondes, le tic des adolescents anglophones !",
        formule: "actually (en fait) · anyway (bref) · I mean (je veux dire) · by the way (au fait) · mind you (remarque)",
      },
    },
  },
  {
    apres: "couples-inseparables",
    lecon: {
      id: "ponctuation",
      niveau: "C1",
      titre: "La ponctuation qui pense",
      notion: "La virgule, le point-virgule, les deux-points et l'apostrophe en anglais",
      heros: "✒️",
      declic: {
        scene: "✒️ ⏸️ 🧭",
        image: "En anglais, la ponctuation ne sert pas seulement à respirer : elle donne le sens. Une virgule mal placée peut changer une phrase entière.",
        sens: "« Let's eat, Grandma! » (Mangeons, mamie !) et « Let's eat Grandma! » (Mangeons mamie !). L'anglais a ses règles propres : pas de virgule devant that, la virgule d'Oxford dans les listes, le point-virgule entre deux phrases liées, l'apostrophe de possession.",
      },
      demo: {
        legende: { k: "la ponctuation", x: "le piège", n: "le mot à apostrophe" },
        etapes: [
          { p: "I think that he's right. ([x:I think, that he's right] ✗)", n: "Pas de virgule devant that." },
          { p: "I bought apples, pears[k:,] and plums.", n: "La virgule d'Oxford : une virgule avant and dans une liste (facultative au Royaume-Uni, courante aux États-Unis)." },
          { p: "It was late[k:;] we went home.", n: "Le point-virgule relie deux phrases complètes très liées." },
          { p: "She had one goal[k::] to win.", n: "Les deux-points annoncent une explication ou une liste. Pas d'espace avant !" },
          { p: "[n:it's] (it is) ≠ [n:its] (son, sa) · the [n:dog's] bowl · the [n:dogs'] bowls", n: "it's = it is · its = possessif, sans apostrophe ! · 's ou s' pour la possession." },
        ],
      },
      defi: [
        { q: "« Le chien a perdu son jouet. »", o: ["The dog lost its toy.", "The dog lost it's toy.", "The dog lost its' toy."], i: "Le possessif de it n'a pas d'apostrophe.", e: "its toy (it's = it is)." },
        { q: "Quelle phrase est correctement ponctuée ?", o: ["He said that he was tired.", "He said, that he was tired.", "He said that, he was tired."], i: "Pas de virgule autour de that.", e: "He said that he was tired." },
        { q: "« I have three goals ___ health, family and work. »", o: [":", ";", ","], i: "On annonce une liste.", e: "I have three goals: health, family and work." },
        { q: "Où le point-virgule est-il bien employé ?", o: ["It was raining; we stayed inside.", "It was raining; and we stayed inside.", "It; was raining, we stayed inside."], i: "Entre deux phrases complètes, sans mot de liaison.", e: "It was raining; we stayed inside." },
        { q: "Écris avec une apostrophe : « the toys of the children »", r: ["the children's toys", "children's toys"], i: "children est déjà pluriel : 's.", e: "the children's toys." },
        { q: "Touche le mot mal écrit.", p: "*Its raining again.", i: "Ici, on veut dire « it is ».", e: "It's raining (it is)." },
      ],
      secret: {
        titre: "La virgule qui change tout",
        texte: "Une virgule devant une relative change son sens : « My brother who lives in London is a doctor » (j'ai plusieurs frères : celui de Londres) / « My brother, who lives in London, is a doctor » (j'ai un seul frère, et il vit à Londres). Tu as vu cette nuance dans « La relative entre virgules » : à l'écrit, tout se joue à une virgule près.",
        formule: "pas de virgule devant that · liste : a, b(,) and c · ; entre deux phrases · : pour annoncer · it's = it is / its = possessif",
      },
    },
  },

  /* ===================== C2 ===================== */
  {
    apres: "deux-costumes",
    lecon: {
      id: "ce-qui-passe-devant",
      niveau: "C2",
      titre: "Ce qui passe devant",
      notion: "L'antéposition : Strange as it may seem, Much as I like him, Such was his anger that…",
      heros: "🎺",
      declic: {
        scene: "🎺 📜 🎭",
        image: "Pour frapper fort, l'anglais soutenu fait passer en tête ce qui devrait venir après : l'idée importante ouvre la phrase comme une fanfare.",
        sens: "Strange as it may seem, he was right (aussi étrange que cela paraisse). Much as I like him, I can't agree (bien que je l'aime beaucoup). Such was his anger that he left (sa colère était telle que…). Ces tournures sont rares à l'oral, mais elles signent un anglais écrit de haut niveau.",
      },
      demo: {
        legende: { k: "le mot-pivot (as, though, much, such)" },
        etapes: [
          { p: "[j:Strange] [k:as] [s:it] [a:may] [r:seem], he was right.", n: "adjectif + as + sujet + verbe = aussi… que (une concession)." },
          { p: "[k:Much] [k:as] [s:I] [r:like] him, I can't agree.", n: "Much as = bien que, j'ai beau…" },
          { p: "[r:Try] [k:as] [s:she] [a:might], she couldn't open it.", n: "Try as + sujet + might = elle avait beau essayer." },
          { p: "[k:Such] [a:was] [s:his anger] [k:that] he left the room.", n: "Such + be + sujet + that : sa colère était telle que… (inversion)." },
          { p: "[p:Gone] [a:are] [s:the days] when we were young.", n: "Participe + be + sujet : une inversion littéraire (révolu, le temps où…)." },
        ],
      },
      defi: [
        { q: "« ___ it may sound, I'm afraid of butterflies. »", o: ["Silly as", "As silly", "So silly"], i: "L'adjectif, puis as, en tête.", e: "Silly as it may sound… (aussi bête que cela puisse paraître)." },
        { q: "« ___ as I respect him, I think he's wrong. »", o: ["Much", "Very", "So"], i: "Bien que je le respecte beaucoup…", e: "Much as I respect him…" },
        { q: "« Such ___ the noise that nobody could sleep. »", o: ["was", "it was", "were the"], i: "Such + be + sujet.", e: "Such was the noise that nobody could sleep." },
        { q: "Complète : « Try as he ___, he could not forget her. »", r: ["might", "may"], i: "Le modal de cette tournure figée.", e: "Try as he might, he could not forget her." },
        {
          q: "Quel est le sens de « Tired though she was, she kept working » ?",
          o: ["Bien qu'elle fût fatiguée, elle continua à travailler.", "Comme elle était fatiguée, elle arrêta de travailler.", "Elle était fatiguée parce qu'elle travaillait."],
          i: "though marque la concession.",
          e: "Tired though she was = bien qu'elle fût fatiguée.",
        },
        { q: "Touche le verbe qui passe devant son sujet.", p: "Gone *are the days of cheap travel.", i: "be, placé avant the days.", e: "Gone are the days (= The days are gone)." },
      ],
      secret: {
        titre: "Le as qui ne compare pas",
        texte: "Dans « Strange as it seems », as ne compare rien : il veut dire « bien que ». La tournure existe aussi avec though : « Strange though it seems ». En anglais américain, on entend même « As strange as it seems ». La forme la plus soutenue est celle qui commence directement par l'adjectif.",
        formule: "Adj + as / though + sujet + verbe · Much as… · Try as + sujet + might · Such + be + sujet + that · Gone are…",
      },
    },
  },
  {
    apres: "ce-qui-passe-devant",
    lecon: {
      id: "phrase-suspendue",
      niveau: "C2",
      titre: "La phrase suspendue",
      notion: "Les constructions absolues et le piège du participe sans sujet",
      heros: "🪂",
      declic: {
        scene: "🪂 ☁️ 🌤️",
        image: "Une construction absolue est une petite phrase sans verbe conjugué, suspendue au début : elle pose un décor ou une condition en quelques mots.",
        sens: "Weather permitting, we'll go hiking (si le temps le permet). All things considered, it was a success (tout bien considéré). The work done, they went home (le travail fini). Mais attention : un participe en tête doit avoir le même sujet que la phrase, sinon c'est une faute célèbre.",
      },
      demo: {
        legende: { n: "le petit sujet de la construction" },
        etapes: [
          { p: "[n:Weather] [r:permit][t:ting], we'll have lunch outside.", n: "nom + -ing : si le temps le permet." },
          { p: "[n:All things] [p:considered], it was a good year.", n: "nom + participe passé : tout bien considéré." },
          { p: "[n:The meeting] over, everyone left.", n: "nom + adjectif ou adverbe : la réunion terminée, tout le monde partit." },
          { p: "[k:With] [n:prices] [r:ris][t:ing], people spend less.", n: "with + nom + -ing : avec la hausse des prix." },
          { p: "[x:Walking] down the street, [s:I] saw the trees. ([x:Walking down the street, the trees were beautiful] ✗)", n: "Le participe en tête doit avoir le même sujet que la suite : c'est moi qui marche, pas les arbres !" },
        ],
      },
      defi: [
        { q: "« ___, the match will start at 3 pm. »", o: ["Weather permitting", "If weather permitting", "Weather permits"], i: "La construction absolue, sans verbe conjugué.", e: "Weather permitting, the match will start at 3 pm." },
        {
          q: "Quelle phrase est correcte ?",
          o: ["Having finished my homework, I went out.", "Having finished my homework, the TV was on.", "Having finished my homework, it was late."],
          i: "Qui a fini les devoirs ?",
          e: "Having finished my homework, I went out : c'est bien I qui a fini.",
        },
        { q: "« ___ said, I still think you're wrong. »", o: ["That", "This being", "It"], i: "Cela dit…", e: "That said, I still think you're wrong." },
        { q: "Complète : « All things ___, it was a great trip. »", r: ["considered"], i: "tout bien considéré.", e: "All things considered." },
        { q: "« His hands ___, he opened the envelope. »", o: ["shaking", "shook", "were shaking"], i: "Une construction absolue : nom + -ing.", e: "His hands shaking, he opened the envelope (les mains tremblantes)." },
        { q: "Touche le faux sujet qui rend la phrase fautive.", p: "Arriving at the station, the *train had already left.", i: "Qui arrive à la gare ?", e: "Ce n'est pas le train qui arrive à la gare ! Arriving at the station, I found that the train had already left." },
      ],
      secret: {
        titre: "Le participe qui pend",
        texte: "Les Anglais appellent cette faute le « dangling participle » (le participe qui pend). « Being a rainy day, I stayed home » : grammaticalement, c'est « moi » qui suis un jour de pluie ! Corrige-la avec une construction absolue qui a son propre sujet (It being a rainy day, I stayed home) ou avec une proposition complète (As it was a rainy day, I stayed home).",
        formule: "nom + -ing / participe (+ reste), proposition principale · participe en tête = même sujet que la principale",
      },
    },
  },
];
