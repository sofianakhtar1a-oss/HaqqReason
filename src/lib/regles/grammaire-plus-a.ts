import type { Ajout } from "./types";

/*
 * La Cité des mots — leçons ajoutées aux niveaux A1 et A2.
 * Chacune prend place juste après la leçon qu'elle prolonge (« apres »), sans rien retirer.
 */

export const GRAMMAIRE_PLUS_A: Ajout[] = [
  /* ===================== A1 ===================== */
  {
    apres: "train-des-mots",
    lecon: {
      id: "ecrire-anglais",
      niveau: "A1",
      titre: "Écrire à l'anglaise",
      notion: "Les majuscules et la ponctuation anglaises",
      heros: "✍️",
      declic: {
        scene: "🅰️ 📅 🗺️",
        image: "L'anglais aime les majuscules : il en met aux jours, aux mois, aux langues, aux nationalités… et à « I ».",
        sens: "Monday, January, English, French, I. En français, on écrit lundi, janvier, anglais, français en minuscules. En anglais, ces mots portent toujours une majuscule. Côté ponctuation, une seule règle à retenir : jamais d'espace avant ? ! : ;",
      },
      demo: {
        legende: { n: "le mot qui prend une majuscule", j: "la nationalité (majuscule aussi)", x: "la ponctuation, collée au mot" },
        etapes: [
          { p: "[s:I] live in Paris and [s:I] speak [n:French].", n: "I (je) et les langues (French, English, Spanish) : majuscule." },
          { p: "See you on [n:Monday], the 3rd of [n:May].", n: "Les jours et les mois : Monday, Tuesday… January, February…" },
          { p: "She's [j:Italian] and her husband is [j:English].", n: "Les nationalités aussi, même devant un nom : an Italian city." },
          { p: "Where are you[x:?] · Wow[x:!] · Note[x::] it's free.", n: "Pas d'espace avant ? ! : ; (le français, lui, en met une)." },
          { p: "[n:The] [n:Lord] of the [n:Rings] · [n:Pride] and [n:Prejudice]", n: "Dans les titres, une majuscule à chaque mot important (pas aux petits mots comme of, the, and)." },
        ],
      },
      defi: [
        { q: "Quelle phrase est bien écrite ?", o: ["I speak English on Mondays.", "i speak english on mondays.", "I speak english on Mondays."], i: "Je, la langue et le jour.", e: "I speak English on Mondays." },
        { q: "« She is ___. » (française)", o: ["French", "french", "Frenchs"], i: "Une nationalité.", e: "She is French." },
        { q: "Touche les mots qui devraient avoir une majuscule.", p: "My friend is *spanish and she arrives on *friday.", i: "Une nationalité et un jour.", e: "Spanish (nationalité) et Friday (jour)." },
        { q: "Quelle phrase a la ponctuation anglaise ?", o: ["Wow! It's amazing!", "Wow ! It's amazing !", "Wow ! It's amazing!"], i: "Regarde l'espace avant le point d'exclamation.", e: "En anglais, pas d'espace avant ? ! : ;" },
        { q: "Touche les deux mots mal écrits.", p: "In *july I visited *england.", i: "Un mois et un pays.", e: "July et England prennent une majuscule." },
        { q: "Quel mot prend toujours une majuscule en anglais, même au milieu d'une phrase ?", o: ["I (je)", "you (tu)", "me (moi)"], i: "Le plus petit pronom.", e: "I s'écrit toujours en majuscule." },
      ],
      secret: {
        titre: "Les guillemets anglais",
        texte: "L'anglais n'utilise pas les guillemets « ». Il écrit “Hello,” she said : des guillemets courbes, sans espace à l'intérieur. La virgule ou le point se placent souvent à l'intérieur des guillemets, surtout en américain. Pour une citation dans une citation, on alterne : “He said ‘no’ to me.”",
        formule: "Majuscule : I · jours · mois · langues · nationalités · pays · pas d'espace avant ? ! : ;",
      },
    },
  },
  {
    apres: "mots-questions",
    lecon: {
      id: "nombres-dates",
      niveau: "A1",
      titre: "Compter, dater, donner l'heure",
      notion: "Les nombres ordinaux, les dates et l'heure",
      heros: "📅",
      declic: {
        scene: "🔢 📅 🕒",
        image: "Pour les dates, l'anglais compte avec des rangs (first, second, third), comme sur un podium : le 3 mai, c'est le troisième jour de mai.",
        sens: "Le français dit « le 3 mai ». L'anglais dit the third of May (ou May 3rd, May the third). Pour l'heure, on regarde le cadran : half past three (3 h 30), a quarter to four (3 h 45). Et pour les années, on coupe en deux : 1999 = nineteen ninety-nine.",
      },
      demo: {
        legende: { n: "le nombre, l'heure ou la date", k: "le petit mot qui l'accompagne" },
        etapes: [
          { p: "[n:first] (1st) · [n:second] (2nd) · [n:third] (3rd) · [n:fourth] (4th) · [n:twenty-first] (21st)", n: "Les ordinaux : -st, -nd, -rd pour 1, 2, 3 (et 21, 22, 23…), -th pour les autres (4th, 11th, 12th, 13th)." },
          { p: "My birthday is [k:on] the [n:fifth] [k:of] May. · May [n:5th]", n: "La date : on + the + ordinal + of + mois. On l'écrit souvent 5 May ou May 5th." },
          { p: "It's [n:half] [k:past] three. · It's [n:a quarter] [k:to] four.", n: "past = après l'heure, to = avant. half past three = 3 h 30, a quarter to four = 3 h 45." },
          { p: "It's ten [k:o'clock]. · It's [n:seven fifteen] (7:15).", n: "o'clock pour l'heure pile. On peut aussi lire les chiffres : seven fifteen." },
          { p: "[n:1999] (nineteen ninety-nine) · [n:2026] (twenty twenty-six)", n: "Les années se lisent par paires. 2006 = two thousand and six." },
        ],
      },
      defi: [
        { q: "Comment dit-on « le 2 juin » ?", o: ["the second of June", "the two of June", "the second June of"], i: "Un ordinal, puis of.", e: "the second of June (June 2nd)." },
        { q: "Il est 4 h 30.", o: ["It's half past four.", "It's half to four.", "It's four and half."], i: "past = après l'heure.", e: "It's half past four (ou four thirty)." },
        { q: "Écris en lettres le nombre ordinal « 3rd ».", r: ["third"], i: "1st first, 2nd second, 3rd…", e: "third." },
        { q: "Il est 8 h 45.", o: ["It's a quarter to nine.", "It's a quarter past eight.", "It's nine less a quarter."], i: "15 minutes avant 9 h.", e: "a quarter to nine." },
        { q: "Comment lit-on l'année 1984 ?", o: ["nineteen eighty-four", "one thousand nine hundred eighty-four", "nineteen hundred eighty-four"], i: "Par paires de chiffres.", e: "nineteen eighty-four." },
        { q: "Touche la préposition qui va devant une date.", p: "I was born *on the 12th of March.", i: "La même que devant un jour de la semaine.", e: "on + jour ou date : on Monday, on the 12th of March." },
      ],
      secret: {
        titre: "Le piège américain des dates",
        texte: "Aux États-Unis, la date s'écrit mois / jour / année : 04/07/2026 veut dire le 7 avril, pas le 4 juillet ! Au Royaume-Uni, c'est comme en France : jour / mois / année. En cas de doute, écris le mois en lettres : 4 July 2026. Et à l'oral, on dit the Fourth of July pour la fête nationale américaine.",
        formule: "the + ordinal + of + mois · half past · a quarter past / to · o'clock",
      },
    },
  },

  /* ===================== A2 ===================== */
  {
    apres: "some-any",
    lecon: {
      id: "il-y-avait",
      niveau: "A2",
      titre: "Il y avait, il y aura",
      notion: "There was, there were, there will be, there has been",
      heros: "🏚️",
      declic: {
        scene: "🏰 ⏳ 🏙️",
        image: "« There is » sait voyager dans le temps : il suffit de conjuguer be, le petit there ne bouge jamais.",
        sens: "There was a castle here (il y avait un château). There were many trees (il y avait beaucoup d'arbres). There will be a party (il y aura une fête). There has been an accident (il y a eu un accident). Le verbe s'accorde avec ce qui suit : was pour un seul, were pour plusieurs.",
      },
      demo: {
        legende: { k: "there, qui ne bouge jamais" },
        etapes: [
          { p: "[k:There] [a:was] [d:a] [n:castle] here.", n: "Au passé, un seul : there was." },
          { p: "[k:There] [a:were] [d:many] [n:trees].", n: "Au passé, plusieurs : there were." },
          { p: "[k:There] [a:will] [a:be] [d:a] [n:party] on Saturday.", n: "Au futur : there will be (jamais « there will have »)." },
          { p: "[k:There] [a:has] [a:been] [d:an] [n:accident].", n: "Au present perfect : there has been / there have been (il y a eu)." },
          { p: "[a:Was] [k:there] [d:any] [n:milk]? — No, [k:there] [a:wasn't].", n: "Question et négation : on inverse there et le verbe." },
        ],
      },
      defi: [
        { q: "« ___ a lot of people at the concert last night. »", o: ["There were", "There was", "It was"], i: "Au passé, et beaucoup de personnes.", e: "There were a lot of people." },
        { q: "« ___ a storm tomorrow. »", o: ["There will be", "There will have", "It will have"], i: "Le futur de there is.", e: "There will be a storm tomorrow." },
        { q: "Complète : « There ___ an old cinema in my town, but it closed. »", r: ["was", "used to be"], i: "Au passé, un seul.", e: "There was an old cinema." },
        { q: "« ___ any problems yesterday? »", o: ["Were there", "There were", "Was there"], i: "Une question au passé, au pluriel.", e: "Were there any problems yesterday?" },
        { q: "Traduis : « Il y a eu un accident. »", r: ["There has been an accident", "There's been an accident", "There was an accident"], i: "there + has been.", e: "There has been an accident." },
        { q: "Touche le mot qui ne convient pas.", p: "There *was ten students in the class.", i: "Ten students : plusieurs.", e: "There were ten students." },
      ],
      secret: {
        titre: "Il y a… trois fois",
        texte: "« Il y avait un château » (existence) → there was. Mais « il y a deux ans » (le temps passé) → two years ago. Et « ça fait deux heures que j'attends » ou « j'attends depuis deux heures » → I've been waiting for two hours. Trois « il y a » français, trois tournures anglaises : there is / ago / for.",
        formule: "there was / were · there will be · there has / have been",
      },
    },
  },
  {
    apres: "podium",
    lecon: {
      id: "pareil-different",
      niveau: "A2",
      titre: "Pareil ou différent ?",
      notion: "As… as, the same as, similar to, different from, like ou as",
      heros: "👯",
      declic: {
        scene: "👯 ⚖️ 🔍",
        image: "Comparer, ce n'est pas seulement dire « plus » : c'est aussi dire « autant », « pareil », « différent ».",
        sens: "She's as tall as her brother (aussi grande que). It's the same as mine (le même que le mien). My phone is different from yours (différent du tien). Et pour « comme » : like + nom (He runs like a rabbit), as + métier ou rôle (He works as a waiter).",
      },
      demo: {
        etapes: [
          { p: "[s:Tom] is [k:as] [j:tall] [k:as] [s:his father].", n: "as + adjectif + as = aussi… que." },
          { p: "[s:This film] [a:isn't] [k:as] [j:good] [k:as] the book.", n: "not as… as = moins… que (pas aussi… que)." },
          { p: "Your bag is [k:the same as] mine. · It's [k:similar to] mine.", n: "the same as = pareil que · similar to = semblable à." },
          { p: "French is [k:different] [k:from] English.", n: "different from (ou different to au Royaume-Uni). Jamais « different of »." },
          { p: "He swims [k:like] a fish. · She works [k:as] a nurse.", n: "like = comme (une comparaison). as = en tant que (un vrai rôle)." },
        ],
      },
      defi: [
        { q: "« My sister is ___ me. » (même taille)", o: ["as tall as", "as tall than", "tall as"], i: "aussi… que.", e: "as tall as me." },
        { q: "« This exam was ___ the last one. »", o: ["different from", "different of", "different than of"], i: "different + quelle préposition ?", e: "different from." },
        {
          q: "« She works ___ a teacher. » (c'est son métier)",
          o: ["as", "like", "same"],
          i: "Un vrai rôle, un métier.",
          e: "She works as a teacher.",
          io: { like: "« like a teacher » voudrait dire « comme un prof » (sans l'être)." },
        },
        { q: "Complète : « Your shoes are the same ___ mine. »", r: ["as"], i: "the same + ?", e: "the same as mine." },
        { q: "« He sings ___ an angel. »", o: ["like", "as", "than"], i: "Une comparaison : il n'est pas un ange.", e: "He sings like an angel." },
        { q: "Touche le mot qui doit être « as ».", p: "My car isn't as fast *than yours.", i: "as… as, jusqu'au bout.", e: "not as fast as yours." },
      ],
      secret: {
        titre: "Like ou as ?",
        texte: "« He talks like a teacher » : il parle comme un prof (mais il ne l'est pas). « He talks as a teacher » : il parle en tant que prof (il l'est). Et devant un sujet et un verbe, l'anglais soigné préfère as : « As I said » (comme je l'ai dit). À l'oral, beaucoup disent « like I said ».",
        formule: "as + adj + as · not as… as · the same as · similar to · different from · like (comparaison) / as (rôle)",
      },
    },
  },
  {
    apres: "remplacants",
    lecon: {
      id: "aussi-non-plus",
      niveau: "A2",
      titre: "Moi aussi, moi non plus",
      notion: "Too, also, either ; So do I, Neither do I",
      heros: "🤝",
      declic: {
        scene: "🙋 🙋‍♀️ 🤝",
        image: "Pour dire « moi aussi », l'anglais a deux portes : la simple (me too) et l'élégante (so do I), qui réutilise le moteur de la phrase.",
        sens: "I love pizza. — Me too! / So do I! I don't like rain. — Me neither! / Neither do I! Too s'utilise à l'affirmative, either à la négative. Et also se place avant le verbe : I also love pizza.",
      },
      demo: {
        etapes: [
          { p: "I like jazz. — [o:Me] [k:too]. / [k:So] [a:do] [s:I].", n: "Accord sur du positif : Me too, ou So + moteur + sujet." },
          { p: "I can't swim. — [o:Me] [k:neither]. / [k:Neither] [a:can] [s:I].", n: "Accord sur du négatif : Me neither, ou Neither + moteur + sujet (ou Nor can I)." },
          { p: "She's tired, and [s:I] [a:am] [k:too]. · [s:I] [k:also] [r:play] tennis.", n: "too en fin de phrase. also avant le verbe principal (mais après be)." },
          { p: "He doesn't eat meat, and [s:I] [a:don't] [k:either].", n: "either en fin de phrase négative (pas « too »)." },
          { p: "I went to Rome. — [k:So] [a:did] [s:I]!", n: "Le moteur suit le temps : went → did, have been → have, will → will." },
        ],
      },
      defi: [
        { q: "« I'm hungry. — So ___ I. »", o: ["am", "do", "have"], i: "Le moteur de « I'm hungry ».", e: "So am I." },
        { q: "« I don't like horror films. — ___ do I. »", o: ["Neither", "So", "Too"], i: "Accord sur une phrase négative.", e: "Neither do I." },
        { q: "« She didn't come, and her brother didn't come ___. »", o: ["either", "too", "also"], i: "Fin de phrase négative.", e: "and her brother didn't come either." },
        { q: "Réponds avec So : « I've finished my homework. — So ___ I. »", r: ["have"], i: "Le moteur : have.", e: "So have I." },
        { q: "Réponds avec Neither : « We can't drive. — Neither ___ they. »", r: ["can"], i: "Le moteur : can.", e: "Neither can they." },
        { q: "Touche le mot mal placé.", p: "I play *also the guitar.", i: "also aime se placer avant le verbe.", e: "I also play the guitar." },
      ],
      secret: {
        titre: "Le moteur caché",
        texte: "Quand la phrase n'a pas de moteur visible (present simple ou past simple), c'est le majordome do qui sort : « She likes tea. — So do I. » « He called me. — So did I. » Et pour dire le contraire : « I like coffee. — I don't! » (moi pas !), « I can't dance. — I can! » (moi si !).",
        formule: "So + moteur + sujet (positif) · Neither / Nor + moteur + sujet (négatif) · too / either en fin de phrase",
      },
    },
  },
  {
    apres: "horloge-calendrier",
    lecon: {
      id: "mouvement",
      niveau: "A2",
      titre: "Le chemin du chat",
      notion: "Les prépositions de mouvement : into, out of, across, through, along…",
      heros: "🐈",
      declic: {
        scene: "🐈 🌉 🏠",
        image: "Les prépositions de lieu disent où est le chat ; les prépositions de mouvement racontent son trajet.",
        sens: "The cat went into the house (il entre), out of the box (il sort), across the road (il traverse une surface), through the tunnel (il traverse un volume), along the wall (il longe), up the tree, down the stairs. Le verbe dit juste « aller » ou « courir » : c'est la préposition qui dessine le chemin.",
      },
      demo: {
        legende: { k: "la préposition qui dessine le chemin" },
        etapes: [
          { p: "The cat jumped [k:into] the box. · It climbed [k:out of] the box.", n: "into = vers l'intérieur. out of = vers l'extérieur." },
          { p: "It ran [k:across] the road. · It walked [k:through] the forest.", n: "across = d'un côté à l'autre d'une surface (route, rivière). through = au travers d'un volume (forêt, tunnel)." },
          { p: "It walked [k:along] the river. · It went [k:past] the shop.", n: "along = en longeant. past = en passant devant." },
          { p: "It climbed [k:up] the tree and jumped [k:onto] the roof.", n: "up / down = monter / descendre. onto = sur (avec un mouvement)." },
          { p: "It went [k:from] the garden [k:to] the kitchen, [k:towards] its bowl.", n: "from… to = de… à. towards = vers (en direction de)." },
        ],
      },
      defi: [
        { q: "« The children ran ___ the park to the gate. »", o: ["across", "along of", "into of"], i: "D'un côté à l'autre d'une surface.", e: "across the park." },
        { q: "« The train went ___ a long tunnel. »", o: ["through", "across", "over"], i: "Un volume, avec des murs autour.", e: "through a long tunnel." },
        { q: "« She walked ___ the kitchen and opened the fridge. »", o: ["into", "in to", "at"], i: "Elle entre dans la pièce.", e: "She walked into the kitchen." },
        { q: "Complète : « He took his keys ___ his pocket. » (il les sort, deux mots)", r: ["out of"], i: "Le contraire de into.", e: "out of his pocket." },
        { q: "« We walked ___ the beach for hours. » (en la longeant)", o: ["along", "across", "through"], i: "On suit la ligne de la plage.", e: "along the beach." },
        { q: "Touche la préposition de mouvement.", p: "The dog jumped *over the fence.", i: "Par-dessus.", e: "over = par-dessus." },
      ],
      secret: {
        titre: "Le français dit le verbe, l'anglais dit le chemin",
        texte: "« Il a traversé la rivière à la nage » → He swam across the river. « Elle est entrée en courant » → She ran in. Le français met le trajet dans le verbe (traverser, entrer) et la manière à côté ; l'anglais met la manière dans le verbe (swim, run) et le trajet dans la préposition. Un vrai renversement !",
        formule: "into / out of · across / through · along / past · up / down · onto · from… to · towards",
      },
    },
  },
  {
    apres: "ponts",
    lecon: {
      id: "exclamations",
      niveau: "A2",
      titre: "Quelle merveille !",
      notion: "Les exclamations : What a…!, How…!, so, such",
      heros: "🤩",
      declic: {
        scene: "🌅 😮 🤩",
        image: "Pour s'exclamer, l'anglais a deux formules magiques : What pour un nom, How pour un adjectif.",
        sens: "What a beautiful day! (Quelle belle journée !) How beautiful! (Que c'est beau !) Et dans une phrase : It's so cold! (Il fait tellement froid !) It's such a nice house! (C'est une si belle maison !).",
      },
      demo: {
        legende: { k: "le mot de l'exclamation" },
        etapes: [
          { p: "[k:What] [d:a] [j:beautiful] [n:day]!", n: "What a + (adjectif) + nom singulier." },
          { p: "[k:What] [j:lovely] [n:flowers]! · [k:What] [j:awful] [n:weather]!", n: "Au pluriel ou avec un indénombrable : What, sans a." },
          { p: "[k:How] [j:kind] of you! · [k:How] [j:interesting]!", n: "How + adjectif : Que c'est… ! Comme c'est… !" },
          { p: "It's [k:so] [j:hot]! · You're [k:so] [j:funny]!", n: "so + adjectif seul : tellement." },
          { p: "It's [k:such] [d:a] [j:good] [n:idea]!", n: "such (a) + adjectif + nom : un(e) si…" },
        ],
      },
      defi: [
        { q: "« ___ a great idea! »", o: ["What", "How", "So"], i: "Devant a + nom.", e: "What a great idea!" },
        { q: "« ___ delicious! »", o: ["How", "What", "What a"], i: "Un adjectif seul.", e: "How delicious!" },
        {
          q: "« What ___ weather! »",
          o: ["terrible", "a terrible", "an terrible"],
          i: "weather est indénombrable.",
          e: "What terrible weather!",
          io: { "a terrible": "weather ne se compte pas : pas de a. What terrible weather!" },
        },
        { q: "Complète : « It's ___ a long film! » (un si long film)", r: ["such"], i: "Devant a + adjectif + nom.", e: "It's such a long film!" },
        { q: "Traduis : « Que c'est beau ! »", r: ["How beautiful", "How beautiful it is", "How nice", "How lovely"], i: "How + adjectif.", e: "How beautiful!" },
        { q: "Touche le mot qui ne va pas.", p: "*How a beautiful house!", i: "Devant a + nom, il faut l'autre mot.", e: "What a beautiful house! (How + adjectif seul.)" },
      ],
      secret: {
        titre: "Le « a » qu'on oublie",
        texte: "Les francophones oublient souvent le a : « Quelle idée ! » → What an idea! « Quel dommage ! » → What a pity! / What a shame! Avec un nom dénombrable au singulier, le a est obligatoire après What, même si le français n'a pas d'article.",
        formule: "What a (adj) + nom ! · What (adj) + pluriel / indénombrable ! · How + adj ! · so + adj · such a + adj + nom",
      },
    },
  },
];
