import type { Lecon } from "./types";

/* La Machine à voyager dans le temps — niveaux C1 et C2. */

export const CONJUGAISON_C: Lecon[] = [
  /* ===================== C1 ===================== */
  {
    id: "il-etait-une-fois",
    niveau: "C1",
    titre: "Il était une fois",
    notion: "Le passé simple",
    heros: "📜",
    declic: {
      scene: "📜 🏰 🐉",
      image: "Le passé simple est le temps des contes, des romans et des livres d'histoire. On ne le parle presque jamais, mais on le lit partout.",
      sens: "Trois grandes familles de costumes : -a (les verbes en -er), -i (finir, prendre…), -u (vouloir, courir…). « Il marcha, il prit son épée et il courut. »",
    },
    demo: {
      machine: { temps: ["passeSimple"], verbes: ["marcher", "finir", "prendre", "vouloir", "courir", "venir"] },
      etapes: [
        { p: "[s:Il] [r:march][t:a] vers la forêt.", n: "Famille A : tous les verbes en -er. Jamais de lettre muette avec il : il marcha." },
        { p: "[s:Il] [r:pr][t:it] son épée.", n: "Famille I : finir, prendre, dire, faire (il fit), voir (il vit)…" },
        { p: "[s:Il] [r:cour][t:ut] longtemps.", n: "Famille U : courir, vouloir, pouvoir (il put), savoir (il sut), boire, lire, vivre…" },
        { p: "[s:Ils] [r:chant][t:èrent] · [s:ils] [r:fin][t:irent] · [s:ils] [r:voul][t:urent]", n: "Avec ils : -èrent, -irent, -urent." },
        { p: "[s:Il] [r:v][t:int] · [s:il] [r:t][t:int]", n: "Famille IN, toute petite : venir, tenir et leurs cousins." },
      ],
    },
    defi: [
      { q: "Le prince ___ la princesse. (regarder)", o: ["regarda", "regardit", "regardat"], i: "Verbe en -er : famille A, sans lettre muette avec il.", e: "Le prince regarda." },
      { q: "Les chevaliers ___ au château. (arriver)", o: ["arrivèrent", "arrivirent", "arrivaient"], i: "Verbes en -er avec ils : -èrent.", e: "Ils arrivèrent." },
      { q: "Elle ___ ses bagages. (faire)", o: ["fit", "fut", "faisa"], i: "Faire est de la famille I.", e: "Elle fit ses bagages." },
      { q: "Soudain, le loup ___ . (venir)", r: ["vint"], i: "Famille IN, la plus rare.", e: "Le loup vint." },
      { q: "Ils ___ partir. (vouloir)", o: ["voulurent", "voulirent", "voulèrent"], i: "Vouloir est de la famille U.", e: "Ils voulurent partir." },
      { q: "Je ___ heureux. (être)", o: ["fus", "fut", "étis"], i: "Être au passé simple appartient à la famille U, et avec je : s.", e: "Je fus heureux." },
    ],
    secret: {
      titre: "Le piège -ai / -ais",
      texte: "« Je chantai » (passé simple, une fois, fini) et « je chantais » (imparfait, le décor) se confondent à l'oreille. Change de personne : passe à « il ». Il chanta → passé simple → -ai. Il chantait → imparfait → -ais.",
      formule: "il chanta → je chantai · il chantait → je chantais",
    },
  },
  {
    id: "dragons",
    niveau: "C1",
    titre: "Les métamorphoses légendaires",
    notion: "Le passé simple des verbes irréguliers",
    heros: "🐉",
    declic: {
      scene: "🐉 ✨ 📖",
      image: "Au passé simple, certains verbes se transforment comme des dragons de légende : naître devient naquit, mourir devient mourut, vivre devient vécut.",
      sens: "Ces métamorphoses sont rares mais célèbres. Elles reviennent dans toutes les biographies et tous les contes : les reconnaître, c'est lire les grands livres sans trébucher.",
    },
    demo: {
      machine: { temps: ["passeSimple"], verbes: ["naître", "mourir", "vivre", "être", "avoir", "voir", "mettre", "craindre", "conduire"] },
      etapes: [
        { p: "[s:Il] [v:naquit] en 1802 et [v:mourut] en 1885.", n: "Naître → naquit (le q surprise). Mourir → mourut." },
        { p: "[s:Il] [v:vécut] cent ans.", n: "Vivre → vécut." },
        { p: "[s:Elle] [v:fut] reine. [s:Elle] [v:eut] trois enfants.", n: "Être → fut, avoir → eut." },
        { p: "[s:Ils] [v:craignirent] le pire. [s:Il] [v:conduisit] le char.", n: "-indre → -gnit ; -uire → -uisit." },
        { p: "[s:Il] [v:mit] · [s:il] [v:vit] · [s:il] [v:dit]", n: "Mettre → mit, voir → vit, dire → dit." },
      ],
    },
    defi: [
      { q: "Victor Hugo ___ en 1802. (naître)", o: ["naquit", "naissa", "naîtit"], i: "Le dragon naître cache un q.", e: "Victor Hugo naquit en 1802." },
      { q: "Ils ___ heureux longtemps. (vivre)", o: ["vécurent", "vivèrent", "vivirent"], i: "Vivre se métamorphose en véc-.", e: "Ils vécurent heureux." },
      { q: "Elle ___ peur. (avoir)", r: ["eut"], i: "Deux lettres seulement, famille U.", e: "Elle eut peur." },
      { q: "Le roi ___ la couronne sur sa tête. (mettre)", o: ["mit", "metta", "mettit"], i: "Mettre perd presque tout : trois lettres.", e: "Le roi mit la couronne." },
      { q: "Ils ___ l'orage. (craindre)", o: ["craignirent", "craindirent", "craindèrent"], i: "Les verbes en -indre font -gn- (comme « nous craignons »).", e: "Ils craignirent l'orage." },
    ],
    secret: {
      titre: "Le chapeau de « nous » et « vous »",
      texte: "Au passé simple, nous et vous portent toujours un chapeau : nous chantâmes, vous finîtes, nous fûmes. Et au subjonctif imparfait, c'est « il » qui le porte : qu'il chantât, qu'il fût. Ne confonds pas « il fut » (passé simple) et « qu'il fût » (subjonctif imparfait) : le chapeau fait la différence.",
      formule: "nous -âmes · -îmes · -ûmes",
    },
  },
  {
    id: "miroir-piege",
    niveau: "C1",
    titre: "Le miroir piégé",
    notion: "L'accord du participe des verbes pronominaux",
    heros: "🪞",
    declic: {
      scene: "🪞 🧲 ❓",
      image: "Avec les verbes pronominaux, l'aimant d'être est un faux ami : il obéit en secret aux règles d'avoir.",
      sens: "« Elle s'est lavée » mais « Elle s'est lavé les mains ». Remplace être par avoir et cherche le COD : s'il est avant, accord ; sinon, rien.",
    },
    demo: {
      legende: { c: "le COD", p: "le participe" },
      etapes: [
        { p: "Elle [c:s']est [p:lavée].", n: "Elle a lavé qui ? s' (elle-même), placé avant → accord." },
        { p: "Elle s'est [p:lavé] [c:les mains].", n: "Elle a lavé quoi ? les mains, après → pas d'accord." },
        { p: "Ils se sont [p:parlé].", n: "Ils ont parlé À qui ? À eux : pas de COD → pas d'accord. Même chose : se sourire, se plaire, se succéder, se nuire, se mentir." },
        { p: "Elles se sont [p:enfuies].", n: "Les verbes qui n'existent qu'avec « se » (s'enfuir, s'évanouir, se souvenir) s'accordent toujours avec le sujet." },
        { p: "[c:Les mains] [c:qu']elle s'est [p:lavées].", n: "Le COD revient avant : accord !" },
      ],
    },
    defi: [
      { q: "Elles se sont ___ les cheveux. (couper)", o: ["coupé", "coupées", "coupés"], i: "Elles ont coupé quoi ? Le COD est après.", e: "Elles se sont coupé les cheveux." },
      { q: "Ils se sont ___ toute la soirée. (téléphoner)", o: ["téléphoné", "téléphonés", "téléphonées"], i: "On téléphone À quelqu'un : pas de COD.", e: "Ils se sont téléphoné." },
      { q: "Elle s'est ___ dans la foule. (perdre)", o: ["perdue", "perdu", "perdus"], i: "Elle a perdu qui ? Elle-même (s'), placé avant.", e: "Elle s'est perdue." },
      { q: "Les rois se sont ___ sur le trône. (succéder)", o: ["succédé", "succédés", "succédées"], i: "On succède À quelqu'un.", e: "Les rois se sont succédé." },
      { q: "Elles se sont ___ . (s'évanouir)", o: ["évanouies", "évanoui", "évanouis"], i: "S'évanouir n'existe qu'avec « se » : accord avec le sujet.", e: "Elles se sont évanouies." },
    ],
    secret: {
      titre: "La transformation en avoir",
      texte: "Face à un pronominal, transforme la phrase : « Elle s'est lavé les mains » → « Elle a lavé les mains à elle ». Puis applique la règle d'avoir : COD avant → accord. Ce tour de magie résout presque tous les cas. Les autres : les verbes toujours pronominaux (s'enfuir, se souvenir…), qui s'accordent avec le sujet.",
      formule: "s'est → a, puis règle d'avoir",
    },
  },
  {
    id: "participes-falaise",
    niveau: "C1",
    titre: "Les participes au bord de la falaise",
    notion: "Le participe passé suivi d'un infinitif, avec « en », « coûté », « valu »",
    heros: "🧗",
    declic: {
      scene: "🧗 ⛰️ ❓",
      image: "Certains participes hésitent au bord d'une falaise : un infinitif, un « en » ou un verbe de mesure les fait basculer.",
      sens: "« Les chanteurs que j'ai entendus chanter » (ce sont eux qui chantent → accord) / « Les chansons que j'ai entendu chanter » (elles ne chantent pas, on les chante → pas d'accord). « Fait » + infinitif ne s'accorde jamais. Avec « en », pas d'accord.",
    },
    demo: {
      etapes: [
        { p: "Les oiseaux que j'ai [p:entendus] chanter.", n: "Les oiseaux chantent eux-mêmes → accord." },
        { p: "Les airs que j'ai [p:entendu] chanter.", n: "Les airs ne chantent pas → pas d'accord." },
        { p: "Elle s'est [p:fait] couper les cheveux. Les robes qu'elle a [p:fait] faire.", n: "« Fait » + infinitif : toujours invariable. Depuis 1990, « laissé » aussi." },
        { p: "Des pommes ? J'[o:en] ai [p:mangé].", n: "Avec « en », pas d'accord." },
        { p: "Les 20 euros que ce livre m'a [p:coûté]. / Les efforts que ce travail m'a [p:coûtés].", n: "Coûter au sens d'un prix : invariable. Au sens d'efforts (« causer ») : accord." },
      ],
    },
    defi: [
      { q: "La maison que j'ai ___ construire.", o: ["vu", "vue", "vus"], i: "Est-ce la maison qui construit ?", e: "La maison que j'ai vu construire (elle ne construit pas)." },
      { q: "Les enfants que j'ai ___ jouer étaient heureux.", o: ["vus", "vu", "vues"], i: "Ce sont les enfants qui jouent eux-mêmes.", e: "Les enfants que j'ai vus jouer." },
      { q: "Elle s'est ___ teindre les cheveux.", o: ["fait", "faite", "faits"], i: "« Fait » + infinitif : la règle la plus simple du monde.", e: "Elle s'est fait teindre les cheveux." },
      { q: "Des fraises ? J'en ai ___ beaucoup. (cueillir)", o: ["cueilli", "cueillies", "cueillis"], i: "Avec « en », l'aimant ne marche pas.", e: "J'en ai cueilli beaucoup." },
      { q: "Les heures qu'il a ___ . (dormir)", o: ["dormi", "dormies", "dormis"], i: "Les heures ne sont pas « dormies » : c'est une durée, pas un COD.", e: "Les heures qu'il a dormi." },
    ],
    secret: {
      titre: "Le test de l'action",
      texte: "Devant un participe suivi d'un infinitif, demande-toi : le mot placé avant fait-il l'action de l'infinitif ? Les violonistes que j'ai entendus jouer (ils jouent) → accord. La symphonie que j'ai entendu jouer (elle ne joue pas) → invariable. Et « fait » + infinitif : ne réfléchis même pas, il ne s'accorde jamais.",
      formule: "il fait l'action → accord · il la subit → invariable",
    },
  },
  {
    id: "pouvoirs-caches",
    niveau: "C1",
    titre: "Les pouvoirs cachés des temps",
    notion: "Les valeurs des temps",
    heros: "🎭",
    declic: {
      scene: "🎭 ⏳ 🪄",
      image: "Chaque temps a des pouvoirs secrets : le présent peut raconter le passé, l'imparfait peut être poli, le futur peut adoucir un ordre.",
      sens: "Présent de narration (En 1492, Colomb découvre l'Amérique), présent de vérité générale (L'eau bout à 100 °C), imparfait de politesse (Je voulais vous demander…), futur de politesse (Vous fermerez la porte), conditionnel des journalistes, futur historique (Il mourra dix ans plus tard).",
    },
    demo: {
      etapes: [
        { p: "En 1492, Christophe Colomb [v:découvre] l'Amérique.", n: "Présent de narration : le passé devient vivant, comme en direct." },
        { p: "La Terre [v:tourne] autour du Soleil.", n: "Présent de vérité générale : vrai hier, aujourd'hui, demain." },
        { p: "Je [v:voulais] vous demander un service.", n: "Imparfait de politesse : il adoucit la demande." },
        { p: "Vous [v:fermerez] la porte en sortant.", n: "Futur d'ordre poli." },
        { p: "Né en 1769, Napoléon [v:mourra] à Sainte-Hélène.", n: "Futur historique : on se place dans le passé et on regarde vers l'avant." },
      ],
    },
    defi: [
      { q: "« Je venais vous parler de mon projet. » Quelle valeur ?", o: ["la politesse", "le décor du passé", "l'habitude"], i: "La personne est là, maintenant : elle parle du présent avec douceur.", e: "Imparfait de politesse." },
      { q: "« Qui dort dîne. » Le présent exprime :", o: ["une vérité générale", "une action en cours", "un futur proche"], i: "Un proverbe : vrai pour toujours.", e: "Présent de vérité générale." },
      { q: "« En 1789, le peuple prend la Bastille. »", o: ["le présent de narration", "le présent d'habitude", "le présent de vérité générale"], i: "Un événement du passé raconté comme en direct.", e: "Présent de narration." },
      { q: "« Vous voudrez bien patienter. »", o: ["un ordre poli", "une prédiction", "un regret"], i: "Le futur rend l'ordre plus doux.", e: "Futur de politesse." },
      { q: "« Le suspect serait âgé de trente ans. »", o: ["une information non confirmée", "une condition", "une politesse"], i: "Le conditionnel des journalistes.", e: "Conditionnel d'information non confirmée." },
    ],
    secret: {
      titre: "Le temps n'est pas l'époque",
      texte: "Dans un texte, ne lis pas un temps à son nom : demande-toi ce qu'il fait. Un présent dans un récit au passé ? C'est la caméra qui zoome pour rendre l'action vivante. Un imparfait dans une demande ? C'est de la politesse. Comprendre ces valeurs, c'est lire comme un écrivain.",
      formule: "temps ≠ époque",
    },
  },
  {
    id: "verbes-troues",
    niveau: "C1",
    titre: "Les verbes troués",
    notion: "Les verbes défectifs",
    heros: "🧩",
    declic: {
      scene: "🧩 🕳️ 🧩",
      image: "Certains verbes ont perdu des morceaux en route : ils ne se conjuguent pas à tous les temps ni à toutes les personnes.",
      sens: "falloir (seulement « il »), pleuvoir (« il », et « ils » au figuré : les coups pleuvent), clore (pas de « nous »), frire (je fris, il frit, mais pas « nous »), éclore, choir, gésir (ci-gît). On les contourne avec un autre verbe : faire frire, fermer.",
    },
    demo: {
      machine: { temps: ["present", "futur"], verbes: ["clore", "frire", "falloir", "pleuvoir"] },
      etapes: [
        { p: "[s:Il] [v:faut]. ✗ [x:je faux]", n: "Falloir n'existe qu'avec « il »." },
        { p: "[s:Je] [v:fris] · [s:il] [v:frit] · nous [x:faisons frire]", n: "Frire n'a pas de « nous » : on appelle « faire » à l'aide." },
        { p: "La porte est [v:close]. · Les fleurs [v:sont écloses].", n: "Clore et éclore vivent surtout au participe." },
        { p: "[v:Ci-gît] un brave chevalier.", n: "Gésir (être couché), sur les tombes. Il ne reste presque que « gît » et « gisait »." },
      ],
    },
    defi: [
      { q: "Nous ___ les frites. (frire)", o: ["faisons frire", "frisons", "fririons"], i: "Frire n'a pas de « nous » : demande de l'aide à « faire ».", e: "Nous faisons frire les frites." },
      { q: "Les poussins ___ ce matin. (éclore)", o: ["sont éclos", "ont éclos", "éclosèrent"], i: "Éclore se conjugue surtout avec être, et s'accorde.", e: "Les poussins sont éclos." },
      { q: "Il ___ que tu partes.", o: ["faut", "faux", "fault"], i: "Le verbe fantôme, avec un t.", e: "Il faut que tu partes." },
      { q: "« Ci-___ Jean de la Forêt. »", o: ["gît", "git", "gis"], i: "Le verbe des tombes, avec son chapeau.", e: "Ci-gît (depuis 1990, « git » sans accent est aussi accepté)." },
      { q: "Les questions ___ sur le professeur. (pleuvoir, présent)", o: ["pleuvent", "pleut", "pleuvaient"], i: "Au sens figuré, pleuvoir accepte « ils ».", e: "Les questions pleuvent." },
    ],
    secret: {
      titre: "L'art de contourner",
      texte: "Un vrai expert ne force jamais un verbe défectif : il le contourne avec élégance. Pas de « nous clorons » courant ? On dit « nous fermerons ». Pas de « nous frisons » ? « Nous faisons frire ». Savoir éviter un piège, c'est aussi maîtriser la langue.",
      formule: "frire → faire frire · clore → fermer",
    },
  },
  {
    id: "verbes-sans-passager",
    niveau: "C1",
    titre: "Les verbes sans passager",
    notion: "L'infinitif passé et le participe passé composé",
    heros: "🎒",
    declic: {
      scene: "✅ ➡️ 🚪",
      image: "« Après avoir fini ses devoirs, il sortit » : l'infinitif passé est un verbe sans passager qui a déjà terminé son travail.",
      sens: "Après + infinitif passé (après avoir mangé, après être parti). Ayant + participe : une action finie avant, ou une cause (Ayant tout compris, il sourit).",
    },
    demo: {
      etapes: [
        { p: "[k:Après] [a:avoir] [p:mangé], il sortit.", n: "« Après » est suivi de l'infinitif passé, jamais de l'infinitif présent à l'écrit." },
        { p: "[k:Après] [a:être] [p:partie], elle a pleuré.", n: "Avec être, l'aimant marche encore." },
        { p: "[a:Ayant] [p:fini] son travail, il se reposa.", n: "Ayant + participe : c'était fini avant." },
        { p: "[a:Étant] [p:arrivés] en retard, ils furent punis.", n: "Étant + participe des verbes de la maison d'Être." },
      ],
    },
    defi: [
      { q: "Après ___ , il a fait la vaisselle.", o: ["avoir mangé", "manger", "avoir manger"], i: "« Après » veut un infinitif passé.", e: "Après avoir mangé." },
      { q: "Après être ___ , elles ont dîné. (rentrer)", o: ["rentrées", "rentré", "rentrer"], i: "Être + participe : l'aimant s'active avec « elles ».", e: "Après être rentrées." },
      { q: "___ tout compris, il sourit. (avoir, participe)", r: ["Ayant"], i: "Le participe présent d'avoir.", e: "Ayant tout compris, il sourit." },
      { q: "Merci de nous ___ ! (aider)", o: ["avoir aidés", "avoir aider", "aider avoir"], i: "L'aide est déjà faite : infinitif passé. Et « nous » est un COD placé avant.", e: "Merci de nous avoir aidés : le COD « nous » est placé avant → accord." },
      { q: "Il regrette d'___ . (partir)", o: ["être parti", "avoir parti", "partir avoir"], i: "Partir habite la maison d'Être.", e: "Il regrette d'être parti." },
    ],
    secret: {
      titre: "Le piège « après »",
      texte: "« Après manger » se dit à l'oral, mais à l'écrit soigné, après + infinitif demande la forme passée : après avoir mangé, après être sorti. Logique : on ne peut faire quelque chose après une action que si cette action est terminée.",
      formule: "après + avoir/être + participe",
    },
  },

  /* ===================== C2 ===================== */
  {
    id: "tenue-de-soiree",
    niveau: "C2",
    titre: "La tenue de soirée",
    notion: "Le subjonctif imparfait et plus-que-parfait",
    heros: "🖋️",
    declic: {
      scene: "🎩 🖋️ 📚",
      image: "Le subjonctif imparfait, c'est la tenue de soirée de la langue : on le croise chez Proust, Flaubert ou Hugo, rarement dans la rue.",
      sens: "Dans un récit soutenu au passé, le subjonctif suit le temps : « Il fallait qu'il vînt » (au lieu de « qu'il vienne »). Recette : passé simple avec « il », on retire la dernière lettre, on ajoute -sse, -sses, -ˆt, -ssions, -ssiez, -ssent.",
    },
    demo: {
      machine: { temps: ["subjonctifImparfait", "subjonctifPlusQueParfait"], verbes: ["venir", "être", "avoir", "aimer", "finir"] },
      etapes: [
        { p: "[s:il] [r:vin][m:t] → que je [r:vin][t:sse]", n: "Le corps vient du passé simple." },
        { p: "Il fallait qu'il [v:vînt].", n: "Il porte un chapeau avec « il » : vînt." },
        { p: "Je voulais qu'elle [v:chantât].", n: "Même recette pour les verbes en -er." },
        { p: "Bien qu'il [a:eût] [p:fini], il resta.", n: "Plus-que-parfait du subjonctif : eût + participe." },
        { p: "Il [v:eût] été plus sage de partir.", n: "Bonus : « eût été » remplace parfois « aurait été » (le conditionnel passé 2e forme)." },
      ],
    },
    defi: [
      { q: "Il fallait qu'il ___ . (partir, langue soutenue)", o: ["partît", "partit", "parte"], i: "Le chapeau distingue le subjonctif imparfait du passé simple.", e: "Il fallait qu'il partît." },
      { q: "Je craignais qu'elle ne ___ en retard. (être, langue soutenue)", o: ["fût", "fut", "étais"], i: "Concordance soutenue : être au subjonctif imparfait, avec chapeau.", e: "Qu'elle ne fût en retard (en langue courante : qu'elle soit)." },
      { q: "Quoiqu'il ___ raison, on ne l'écouta pas. (avoir)", o: ["eût", "eut", "ayait"], i: "Subjonctif imparfait d'avoir avec « il » : un chapeau.", e: "Quoiqu'il eût raison." },
      { q: "Il eût ___ partir plus tôt. (falloir)", r: ["fallu"], i: "Le participe passé de falloir.", e: "Il eût fallu partir plus tôt." },
      { q: "« Je voulais qu'il … » : quelle forme ?", o: ["chantât", "chanta"], i: "Après « je voulais que », c'est le monde des souhaits.", e: "Qu'il chantât (subjonctif) ; « il chanta » est le passé simple." },
    ],
    secret: {
      titre: "Le chapeau qui change tout",
      texte: "« Il fut » (passé simple) / « qu'il fût » (subjonctif imparfait) / « il eût fallu » (conditionnel passé 2e forme). Seul l'accent circonflexe les sépare. Astuce d'expert : remplace par « qu'il ait été » ou « il aurait fallu ». Si ça fonctionne, mets le chapeau. Sinon, retire-le.",
      formule: "il fut ≠ qu'il fût",
    },
  },
  {
    id: "monstres",
    niveau: "C2",
    titre: "Les monstres de la forêt",
    notion: "Les verbes les plus irréguliers",
    heros: "👹",
    declic: {
      scene: "🌲 👹 🌲",
      image: "Au fond de la forêt vivent les monstres : résoudre, acquérir, vaincre, émouvoir, haïr. Ils font peur… jusqu'à ce qu'on connaisse leur secret.",
      sens: "Résoudre : je résous (s, pas de d), nous résolvons, résolu. Acquérir : j'acquiers, nous acquérons, ils acquièrent, acquis. Vaincre : il vainc (sans t !), nous vainquons. Mouvoir : mû. Haïr : je hais (sans tréma), nous haïssons.",
    },
    demo: {
      machine: { temps: ["present", "passeCompose"], verbes: ["résoudre", "acquérir", "vaincre", "coudre", "haïr", "émouvoir"] },
      etapes: [
        { p: "[s:Il] [v:résout] · [s:nous] [v:résolvons] · [p:résolu]", n: "-soudre perd son d au présent." },
        { p: "[s:Il] [v:vainc].", n: "Vaincre ne prend pas de t : le c suffit." },
        { p: "[s:J'][v:acquiers] · [s:nous] [v:acquérons] · [s:ils] [v:acquièrent] · [p:acquis]", n: "Acquérir change de corps trois fois." },
        { p: "[s:Je] [v:hais] · [s:nous] [v:haïssons]", n: "Le tréma disparaît avec je, tu, il (on prononce « è »)." },
        { p: "[s:Il] [v:coud] · [s:nous] [v:cousons] · [s:nous] [v:moulons]", n: "Coudre et moudre gardent leur d avec il, puis changent de corps." },
      ],
    },
    defi: [
      { q: "Ce problème, je le ___ . (résoudre)", o: ["résous", "résouds", "résoud"], i: "-soudre perd son d au présent.", e: "Je le résous." },
      { q: "Le meilleur ___ toujours. (vaincre)", o: ["vainc", "vainct", "vaint"], i: "Vaincre garde son c, sans rien ajouter.", e: "Le meilleur vainc." },
      { q: "Ils ___ de l'expérience. (acquérir)", o: ["acquièrent", "acquérissent", "acquiérent"], i: "Acquérir change de corps avec ils, accent grave.", e: "Ils acquièrent." },
      { q: "Je ___ le mensonge. (haïr, présent)", r: ["hais"], i: "Avec je, le tréma tombe.", e: "Je hais le mensonge." },
      { q: "Le participe de « mouvoir » est :", o: ["mû", "mu", "mouvu"], i: "Il garde un chapeau au masculin singulier.", e: "Mû, mais mue, mus, mues sans chapeau." },
      { q: "Elle ___ un bouton. (coudre)", o: ["coud", "cout", "cous"], i: "Coudre garde son d avec elle.", e: "Elle coud un bouton." },
    ],
    secret: {
      titre: "Absous, absoute",
      texte: "Absoudre et dissoudre ont un participe étrange : absous, absoute ; dissous, dissoute (un t apparaît au féminin !). Mais résoudre fait « résolu » (un problème résolu). Les rectifications de 1990 proposent « absout, dissout » au masculin pour tout simplifier. Les deux sont acceptés aujourd'hui.",
      formule: "dissous → dissoute · résolu",
    },
  },
  {
    id: "chefs-du-verbe",
    niveau: "C2",
    titre: "Le verbe et ses chefs",
    notion: "L'accord du verbe avec des sujets complexes",
    heros: "🎩",
    declic: {
      scene: "🎩 👥 ❓",
      image: "Parfois, le verbe a plusieurs chefs à la fois, ou un chef qui cache une foule. Qui commande vraiment ?",
      sens: "« Ma sœur et moi sommes » (moi gagne : nous). « Toi et lui êtes » (vous). « Plus d'un élève est venu » (singulier !), « Moins de deux élèves sont venus » (pluriel). « C'est moi qui suis » (le verbe suit « moi »).",
    },
    demo: {
      etapes: [
        { p: "[s:Ma sœur et moi] [v:sommes] prêts.", n: "Moi + quelqu'un = nous." },
        { p: "[s:Toi et lui] [v:êtes] invités.", n: "Toi + quelqu'un = vous." },
        { p: "C'est [s:moi] qui [v:suis] le chef.", n: "« Qui » prend la personne du mot qu'il remplace." },
        { p: "[s:Plus d'un] élève [v:a] ri. [s:Moins de deux] élèves [v:ont] ri.", n: "Le verbe écoute le nombre écrit, pas la logique !" },
        { p: "[s:La plupart] des gens [v:pensent]…", n: "La plupart : pluriel." },
        { p: "[s:Le chien], ainsi que le chat, [v:dort].", n: "Ainsi que, comme, de même que : le premier commande seul." },
      ],
    },
    defi: [
      { q: "Paul et moi ___ amis.", o: ["sommes", "sont", "suis"], i: "Moi + Paul = …", e: "Paul et moi sommes amis." },
      { q: "C'est toi qui ___ raison.", o: ["as", "a", "ont"], i: "« Qui » remplace « toi ».", e: "C'est toi qui as raison." },
      { q: "Plus d'un enfant ___ la réponse. (savoir, imparfait)", o: ["savait", "savaient", "savions"], i: "« Un » commande.", e: "Plus d'un enfant savait." },
      { q: "La plupart des élèves ___ contents.", o: ["sont", "est", "êtes"], i: "La plupart = pluriel.", e: "La plupart des élèves sont contents." },
      { q: "Ni Paul ni Marie ne ___ venus.", o: ["sont", "est", "êtes"], i: "Les deux sont absents : le pluriel est la règle la plus courante.", e: "Ni Paul ni Marie ne sont venus." },
      { q: "Le professeur, avec ses élèves, ___ au musée.", o: ["va", "vont", "allons"], i: "« Avec » entre virgules ne fait pas un groupe : le professeur commande seul.", e: "Le professeur, avec ses élèves, va au musée." },
    ],
    secret: {
      titre: "La hiérarchie des personnes",
      texte: "Quand plusieurs passagers se partagent un verbe, la 1re personne commande la 2e, qui commande la 3e. Moi + toi = nous. Toi + lui = vous. Lui + elle = ils. C'est la même logique que dans un vote : celui qui parle compte toujours.",
      formule: "1re > 2e > 3e",
    },
  },
  {
    id: "rectifications-1990",
    niveau: "C2",
    titre: "L'atelier rangé",
    notion: "Les rectifications orthographiques de 1990",
    heros: "🔧",
    declic: {
      scene: "🔧 🧰 ✨",
      image: "En 1990, des savants ont rangé l'atelier de la langue : quelques outils tordus ont été redressés. Les deux formes, l'ancienne et la nouvelle, sont aujourd'hui acceptées.",
      sens: "Accent grave au futur des verbes comme céder (je cèderai), è pour les verbes en -eler et -eter (il ruissèle, il époussète), sauf appeler et jeter et leurs familles, et accent circonflexe facultatif sur i et u (il parait, il connait), sauf quand il évite une confusion.",
    },
    demo: {
      etapes: [
        { p: "[s:Je] [v:céderai] → [s:je] [v:cèderai]", n: "Le futur s'écrit comme on l'entend." },
        { p: "[s:Il] [v:ruisselle] → [s:il] [v:ruissèle]", n: "Les -eler et -eter prennent è, sauf appeler et jeter (et leurs familles)." },
        { p: "[s:Il] [v:paraît] → [s:il] [v:parait]", n: "Le circonflexe sur i et u devient facultatif…" },
        { p: "[x:dû] · [x:mûr] · [x:sûr] · nous [x:fûmes]", n: "… sauf quand il évite une confusion (du/dû) et dans les terminaisons." },
      ],
    },
    defi: [
      { q: "Selon les rectifications de 1990, laquelle de ces formes est acceptée ?", o: ["il cèdera", "il cédra", "il céderra"], i: "Le futur s'écrit comme on l'entend : « è ».", e: "Il cèdera (et « il cédera » reste juste)." },
      { q: "Quel verbe garde sa consonne double en 1990 ?", o: ["appeler (il appelle)", "étinceler", "ruisseler"], i: "Deux familles gardent la consonne double.", e: "Appeler et jeter : il appelle, il jette." },
      { q: "Le circonflexe reste obligatoire dans :", o: ["un devoir dû", "il connaît", "une boîte"], i: "Il évite une confusion avec un petit mot.", e: "Dû (pour ne pas confondre avec « du »)." },
      { q: "« Nous fûmes » peut-il perdre son accent ?", o: ["Non, jamais", "Oui, depuis 1990", "Seulement au pluriel"], i: "Les terminaisons du passé simple et du subjonctif gardent leur chapeau.", e: "Non : nous fûmes, qu'il fût gardent leur accent." },
      { q: "Laquelle de ces formes est correcte ?", o: ["les deux : il paraît / il parait", "seulement il paraît", "seulement il parait"], i: "1990 propose, mais n'impose pas.", e: "Les deux formes sont correctes." },
    ],
    secret: {
      titre: "Les deux sont justes",
      texte: "Un expert ne corrige jamais « il connait » sans accent : c'est la forme recommandée depuis 1990, et l'Éducation nationale la considère comme la référence. Mais l'ancienne forme reste juste. Ton seul devoir : être cohérent dans un même texte.",
      formule: "ancienne forme ✓ · nouvelle forme ✓ · mélange ✗",
    },
  },
];
