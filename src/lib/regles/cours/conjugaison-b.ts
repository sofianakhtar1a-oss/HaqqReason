import type { Cours } from "../types";

/**
 * Conjugaison, paliers B1 et B2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [a:have].
 */
export const COURS: Record<string, Cours> = {
  pont: {
    regle:
      "Le present perfect ({have} / {has} + participe passé) relie un moment passé au présent. On l'emploie quand ce qui compte, c'est le résultat maintenant ({I have lost my keys} : je ne les ai toujours pas), l'expérience d'une vie jusqu'à aujourd'hui ({She has visited Japan}), ou une période qui n'est pas terminée ({this week}, {today}). Le moment exact de l'action n'est pas donné : s'il l'était, on passerait au prétérit.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {have} / {has} + participe passé", exemple: "[s:I] [a:have] [p:finished]." },
      { nom: "Négation", modele: "sujet + {haven't} / {hasn't} + participe", exemple: "[s:She] [a:hasn't] [p:called]." },
      { nom: "Question", modele: "{Have} / {Has} + sujet + participe ?", exemple: "[a:Have] [s:you] [p:seen] my phone?" },
    ],
    usages: [
      { quand: "Un résultat visible maintenant", en: "I [a:have] [p:broken] my glasses.", fr: "J'ai cassé mes lunettes (et je n'y vois plus rien)." },
      { quand: "Une expérience de vie", en: "[s:We] [a:have] [p:been] to Canada twice.", fr: "Nous sommes allés deux fois au Canada." },
      { quand: "Une période pas encore finie", en: "[s:She] [a:has] [p:drunk] three coffees today.", fr: "Elle a bu trois cafés aujourd'hui." },
      { quand: "Une nouvelle toute fraîche", en: "[s:The price] [a:has] [p:gone] up.", fr: "Le prix a augmenté." },
    ],
    francais:
      "Sa forme ressemble au passé composé ({I have finished} / « j'ai fini »), mais son emploi est plus étroit. Le français prend le passé composé pour tout passé terminé, daté ou non ; l'anglais réserve le present perfect aux actions sans date précise, reliées à maintenant. Et l'anglais utilise toujours {have}, même là où le français prend « être » : {She has left} (elle est partie).",
    pieges: [
      { faux: "My parents [x:are arrived].", juste: "My parents [a:have] [p:arrived].", pourquoi: "L'auxiliaire est toujours {have}, même avec les verbes qui prennent « être » en français." },
      { faux: "I [x:have saw] this film.", juste: "I [a:have] [p:seen] this film.", pourquoi: "Après {have}, il faut le participe passé, la troisième forme : {see} · {saw} · {seen}." },
      { faux: "He [x:have] finished.", juste: "He [a:has] [p:finished].", pourquoi: "Avec {he}, {she}, {it} : {has}." },
    ],
    retenir: "Passé relié à maintenant, sans date : {have} / {has} + participe passé.",
  },

  "piege-mange": {
    regle:
      "La question à se poser : le moment de l'action est-il terminé et précisé ? Si oui ({yesterday}, {in 2015}, {last summer}, {when I was a child}, {two days ago}), c'est le prétérit : {I ate sushi yesterday}. Si le moment n'est pas donné, ou si la période dure encore ({ever}, {never}, {this week}, {so far}), c'est le present perfect : {I have eaten sushi} (dans ma vie). Une conversation passe souvent de l'un à l'autre : on annonce au present perfect, puis on raconte les détails au prétérit.",
    forme: [
      { nom: "Moment fini et précis", modele: "prétérit", exemple: "I [p:saw] her yesterday." },
      { nom: "Sans date, jusqu'à maintenant", modele: "{have} / {has} + participe", exemple: "I [a:have] [p:seen] her." },
    ],
    usages: [
      { quand: "Annoncer, puis détailler", en: "I [a:have] [p:been] to Rome. I [p:went] there in 2019.", fr: "Je suis allé à Rome. J'y suis allé en 2019." },
      { quand: "Une question sur toute la vie", en: "[a:Have] you ever [p:eaten] snails?", fr: "Tu as déjà mangé des escargots ?" },
      { quand: "Une question sur un moment", en: "When [a:did] you [r:arrive]?", fr: "Quand es-tu arrivé ?" },
    ],
    francais:
      "Le français dit « j'ai mangé » dans les deux cas : c'est pour cela que le piège est si fréquent. Retiens ce test : si tu peux répondre à la question « quand ? » par une date ou un moment terminé, l'anglais veut le prétérit. Les questions en {When…?} et {What time…?} sont donc presque toujours au prétérit.",
    pieges: [
      { faux: "I [x:have seen] him last week.", juste: "I [p:saw] him last week.", pourquoi: "{last week} est un moment terminé et précis : prétérit obligatoire." },
      { faux: "When [x:have you arrived]?", juste: "When [a:did] you [r:arrive]?", pourquoi: "{When} demande un moment précis : la question se met au prétérit." },
      { faux: "I [x:didn't finish] yet.", juste: "I [a:haven't] [p:finished] yet.", pourquoi: "{yet} relie l'action au moment présent : present perfect." },
    ],
    retenir: "Une date terminée = prétérit. Pas de date, ou jusqu'à maintenant = present perfect.",
  },

  depuis: {
    regle:
      "Pour une situation qui a commencé dans le passé et qui dure encore, l'anglais emploie le present perfect, là où le français met un présent : {I have lived here for three years} (j'habite ici depuis trois ans). « Depuis » se traduit de deux façons : {for} + une durée ({for ten minutes}, {for two years}) et {since} + un point de départ ({since Monday}, {since 2019}, {since I was a child}). Pour poser la question, on dit {How long have you…?}",
    forme: [
      { nom: "Avec une durée", modele: "{have} + participe + {for} + durée", exemple: "I [a:have] [p:known] her [k:for] ten years." },
      { nom: "Avec un point de départ", modele: "{have} + participe + {since} + date, moment", exemple: "She [a:has] [p:worked] here [k:since] 2020." },
      { nom: "La question", modele: "{How long} + {have} + sujet + participe ?", exemple: "How long [a:have] you [p:been] here?" },
    ],
    usages: [
      { quand: "Une durée", en: "We [a:have] [p:been] married [k:for] twenty years.", fr: "Nous sommes mariés depuis vingt ans." },
      { quand: "Un point de départ", en: "I [a:haven't] [p:seen] him [k:since] Christmas.", fr: "Je ne l'ai pas vu depuis Noël." },
      { quand: "Depuis + une phrase", en: "He [a:has] [p:lived] in Paris [k:since] he [p:was] a student.", fr: "Il vit à Paris depuis l'époque où il était étudiant." },
    ],
    francais:
      "« J'habite ici depuis 3 ans » est au présent en français, parce qu'on y habite encore. L'anglais regarde l'autre bout du pont : la situation a commencé il y a trois ans, donc il prend le present perfect. {I live here since 3 years} est l'une des erreurs les plus typiques des francophones, avec deux fautes en une : le temps et le mot. Et ne confonds pas avec {ago} : {three years ago} (il y a trois ans) est un point fixe du passé, qui va avec le prétérit.",
    pieges: [
      { faux: "I [x:live] here since 2018.", juste: "I [a:have] [p:lived] here [k:since] 2018.", pourquoi: "La situation dure encore depuis un moment du passé : present perfect." },
      { faux: "I have worked here [x:since] five years.", juste: "I [a:have] [p:worked] here [k:for] five years.", pourquoi: "{five years} est une durée : {for}. {since} n'accepte qu'un point de départ." },
      { faux: "[x:Since when do you know] him?", juste: "How long [a:have] you [p:known] him?", pourquoi: "« Depuis quand ? Depuis combien de temps ? » se dit {How long have you…?}" },
    ],
    retenir: "Depuis = {have} + participe, avec {for} + durée ou {since} + point de départ.",
  },

  "trois-horloges": {
    regle:
      "Quatre petits mots accompagnent souvent le present perfect. {just} = à l'instant ({I've just arrived}) ; {already} = déjà, plus tôt que prévu ({She's already left}) ; {yet} = pas encore à la négation ({I haven't finished yet}) et déjà ? dans une question ({Have you finished yet?}) ; {still} = toujours, encore, pour ce qui n'a pas changé ({He still hasn't called}). Place : {just} et {already} entre {have} et le participe, {yet} en fin de phrase, {still} devant {haven't}.",
    forme: [
      { nom: "À l'instant", modele: "{have} + {just} + participe", exemple: "I [a:have] [k:just] [p:eaten]." },
      { nom: "Déjà", modele: "{have} + {already} + participe", exemple: "She [a:has] [k:already] [p:left]." },
      { nom: "Pas encore, déjà ?", modele: "{haven't} + participe… {yet} · {Have}… {yet} ?", exemple: "We [a:haven't] [p:started] [k:yet]." },
      { nom: "Toujours pas", modele: "sujet + {still} + {haven't} + participe", exemple: "He [k:still] [a:hasn't] [p:called]." },
    ],
    usages: [
      { quand: "Une nouvelle toute fraîche", en: "The film [a:has] [k:just] [p:started].", fr: "Le film vient de commencer." },
      { quand: "Plus tôt que prévu", en: "I [a:have] [k:already] [p:done] my homework.", fr: "J'ai déjà fait mes devoirs." },
      { quand: "Une attente", en: "[a:Has] the bus [p:arrived] [k:yet]?", fr: "Le bus est déjà arrivé ?" },
      { quand: "Une impatience", en: "I [k:still] [a:haven't] [p:received] the parcel.", fr: "Je n'ai toujours pas reçu le colis." },
    ],
    francais:
      "« Je viens de manger » se dit {I've just eaten} : pas de verbe « venir » en anglais, c'est {just} qui fait tout le travail. « Pas encore » se dit {not… yet}, avec {yet} tout au bout de la phrase. Et « déjà » se traduit par {already} dans une affirmation, mais par {yet} dans une question où l'on attend quelque chose.",
    pieges: [
      { faux: "I [x:come of] eat.", juste: "I [a:have] [k:just] [p:eaten].", pourquoi: "« Venir de » ne se traduit pas mot à mot : on dit {have just} + participe." },
      { faux: "I [x:have finished not yet].", juste: "I [a:haven't] [p:finished] [k:yet].", pourquoi: "{not} s'attache à {have} ({haven't}), et {yet} se met en fin de phrase." },
      { faux: "She has [x:yet] left.", juste: "She [a:has] [k:already] [p:left].", pourquoi: "Dans une affirmation, « déjà » se dit {already} ; {yet} sert à la négation et à la question." },
    ],
    retenir: "{just} = à l'instant, {already} = déjà, {yet} = pas encore ou déjà ?, {still} = toujours (pas).",
  },

  "premiere-fois": {
    regle:
      "Après {It's the first time} (c'est la première fois que…) et après un superlatif ({the best}, {the most beautiful}, {the worst}…), l'anglais fait le bilan de toute une vie jusqu'à maintenant : il emploie donc le present perfect, souvent avec {ever} (de toute ma vie). Si l'on parle du passé, tout recule d'un cran : {It was the first time I had…}",
    forme: [
      { nom: "La première fois", modele: "{It's the first time} + sujet + {have} + participe", exemple: "It's the first time [s:I] [a:have] [p:seen] snow." },
      { nom: "Le superlatif", modele: "{the best}… + sujet + {have ever} + participe", exemple: "It's the best film [s:I][a:'ve] ever [p:seen]." },
      { nom: "Dans un récit passé", modele: "{It was the first time} + {had} + participe", exemple: "It was the first time [s:she] [a:had] [p:flown]." },
    ],
    usages: [
      { quand: "Une première", en: "It's the first time [s:we] [a:have] [p:been] here.", fr: "C'est la première fois que nous venons ici." },
      { quand: "Un record personnel", en: "This is the most delicious cake [s:I] [a:have] ever [p:eaten].", fr: "C'est le gâteau le plus délicieux que j'aie jamais mangé." },
      { quand: "Au passé", en: "It was the first time [s:he] [a:had] [p:driven] at night.", fr: "C'était la première fois qu'il conduisait de nuit." },
    ],
    francais:
      "Le français dit « c'est la première fois que je vois la neige », au présent. L'anglais compte toutes les fois depuis ta naissance jusqu'à maintenant : zéro avant aujourd'hui, donc present perfect. Même logique pour « le meilleur film que j'aie jamais vu » : le subjonctif français devient {I've ever seen}.",
    pieges: [
      { faux: "It's the first time I [x:see] snow.", juste: "It's the first time [s:I] [a:have] [p:seen] snow.", pourquoi: "Après {It's the first time}, l'anglais veut le present perfect, pas le présent." },
      { faux: "It's the best book I [x:ever read].", juste: "It's the best book [s:I] [a:have] ever [p:read].", pourquoi: "Après un superlatif, c'est un bilan de vie : {have ever} + participe." },
    ],
    retenir: "Première fois ou superlatif : {I have (ever)} + participe.",
  },

  "ca-dure": {
    regle:
      "Le present perfect continu ({have} / {has} + {been} + verbe en {-ing}) parle d'une activité commencée dans le passé qui dure encore, ou qui vient juste de s'arrêter, en insistant sur la durée ou sur l'effort : {I have been waiting for an hour} (j'attends depuis une heure). Il explique aussi une trace visible maintenant : {You're out of breath. Have you been running?} Le present perfect simple insiste plutôt sur le résultat ou sur la quantité : {I have written three emails}.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {have} / {has} + {been} + verbe en {-ing}", exemple: "[s:She] [a:has been] [r:study][t:ing] all day." },
      { nom: "Négation", modele: "sujet + {haven't} / {hasn't} + {been} + {-ing}", exemple: "[s:I] [a:haven't been] [r:sleep][t:ing] well." },
      { nom: "Question", modele: "{How long} + {have} + sujet + {been} + {-ing} ?", exemple: "How long [a:have] [s:you] [a:been] [r:wait][t:ing]?" },
    ],
    usages: [
      { quand: "Une durée qui continue", en: "It [a:has been] [r:rain][t:ing] since this morning.", fr: "Il pleut depuis ce matin." },
      { quand: "La cause d'une trace visible", en: "Your eyes are red. [a:Have] you [a:been] [r:cry][t:ing]?", fr: "Tu as les yeux rouges. Tu as pleuré ?" },
      { quand: "L'effort plutôt que le résultat", en: "I [a:have been] [r:paint][t:ing] the kitchen.", fr: "J'ai passé du temps à repeindre la cuisine." },
    ],
    francais:
      "Le français n'a pas de forme équivalente : il dit « j'attends depuis une heure » (présent) ou « ça fait une heure que j'attends ». Dès que tu vois « depuis » ou « ça fait… que » avec une activité qui dure, pense à {have been} + {-ing}. Les verbes d'état ({know}, {have} au sens de posséder, {like}, {be}) restent au present perfect simple : {I have known her for years}.",
    pieges: [
      { faux: "I [x:wait] for an hour.", juste: "I [a:have been] [r:wait][t:ing] for an hour.", pourquoi: "Une activité qui dure depuis un moment du passé : present perfect continu." },
      { faux: "I have been [x:knowing] him for years.", juste: "I [a:have] [p:known] him for years.", pourquoi: "{know} est un verbe d'état : pas de forme en {-ing}, on garde le present perfect simple." },
      { faux: "She [x:has been writing] five emails.", juste: "She [a:has] [p:written] five emails.", pourquoi: "Quand on compte un résultat (cinq e-mails), on prend le present perfect simple." },
    ],
    retenir: "Une activité qui dure jusqu'à maintenant : {have been} + {-ing}. Un résultat à compter : {have} + participe.",
  },

  "passe-du-passe": {
    regle:
      "Le past perfect ({had} + participe passé) situe une action avant un autre moment du passé. C'est le retour en arrière d'un récit : {When I arrived at the station, the train had left} (le train était déjà parti avant mon arrivée). Il est surtout utile quand l'ordre des événements ne va pas de soi ; avec {before} ou {after}, qui donnent déjà l'ordre, le prétérit suffit souvent. {Had} est le même pour toutes les personnes.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {had} + participe passé", exemple: "[s:The film] [a:had] [p:started]." },
      { nom: "Négation", modele: "sujet + {hadn't} + participe", exemple: "[s:I] [a:hadn't] [p:eaten]." },
      { nom: "Question", modele: "{Had} + sujet + participe ?", exemple: "[a:Had] [s:you] [p:met] him before?" },
    ],
    usages: [
      { quand: "Avant un autre moment passé", en: "When we arrived, the film [a:had] already [p:started].", fr: "Quand nous sommes arrivés, le film avait déjà commencé." },
      { quand: "Expliquer une situation passée", en: "She was tired because she [a:hadn't] [p:slept].", fr: "Elle était fatiguée parce qu'elle n'avait pas dormi." },
      { quand: "Une première fois dans le passé", en: "I [a:had] never [p:seen] the sea before.", fr: "Je n'avais jamais vu la mer auparavant." },
    ],
    francais:
      "Le past perfect correspond au plus-que-parfait (« j'avais mangé », « il était parti ») : l'emploi est presque le même. Seule différence de forme : l'anglais prend toujours {had}, même là où le français dit « était » : {he had left} (il était parti).",
    pieges: [
      { faux: "When I arrived, he [x:left] already.", juste: "When I arrived, he [a:had] already [p:left].", pourquoi: "Il était parti avant mon arrivée : il faut le passé du passé, {had} + participe." },
      { faux: "She [x:was gone out] when I called.", juste: "She [a:had] [p:gone] out when I called.", pourquoi: "L'auxiliaire est toujours {had}, même si le français dit « elle était sortie »." },
    ],
    retenir: "Avant un autre moment du passé : {had} + participe.",
  },

  "be-used-to": {
    regle:
      "{Be used to} veut dire « être habitué à » : c'est un état ({I'm used to the noise}). {Get used to} veut dire « s'habituer à » : c'est le changement, le moment où l'habitude se prend ({I'm getting used to my new job}). Dans les deux cas, {to} est une préposition : il est suivi d'un nom ou d'un verbe en {-ing}, jamais de la base du verbe. À ne pas confondre avec {used to} + base, qui parle d'autrefois.",
    forme: [
      { nom: "Être habitué", modele: "{be used to} + nom ou verbe en {-ing}", exemple: "[s:I] [a:am used to] [r:work][t:ing] at night." },
      { nom: "S'habituer", modele: "{get used to} + nom ou verbe en {-ing}", exemple: "[s:She] [a:is getting used to] the cold." },
      { nom: "À ne pas confondre", modele: "{used to} + base = autrefois", exemple: "[s:I] [a:used to] [r:work] at night." },
    ],
    usages: [
      { quand: "Une habitude installée", en: "He [a:is used to] [r:driv][t:ing] on the left.", fr: "Il a l'habitude de conduire à gauche." },
      { quand: "Une habitude qui se prend", en: "You[a:'ll get used to] it.", fr: "Tu vas t'y habituer." },
      { quand: "Un manque d'habitude", en: "I [a:am not used to] [r:gett][t:ing] up so early.", fr: "Je n'ai pas l'habitude de me lever si tôt." },
    ],
    francais:
      "« J'ai l'habitude de » et « je suis habitué à » se disent {I'm used to} ; « s'habituer à » se dit {get used to}. Le piège vient de {to} : le français y voit un infinitif (« habitué à travailler »), mais ici {to} est une préposition, comme dans {I look forward to seeing you}. D'où la forme en {-ing}.",
    pieges: [
      { faux: "I'm used to [x:work] at night.", juste: "I'm used to [r:work][t:ing] at night.", pourquoi: "Après {be used to}, le verbe prend {-ing}." },
      { faux: "I [x:used to] the noise now.", juste: "I [a:am used to] the noise now.", pourquoi: "Sans {be}, {used to} parle d'un passé révolu. Pour l'habitude actuelle : {I'm used to}." },
      { faux: "She can't [x:be used to] her new city.", juste: "She can't [a:get used to] her new city.", pourquoi: "« S'habituer », le processus, c'est {get used to}." },
    ],
    retenir: "{be used to} + {-ing} = être habitué ; {get used to} + {-ing} = s'habituer ; {used to} + base = autrefois.",
  },

  "quatre-futurs": {
    regle:
      "L'anglais a quatre outils pour parler du futur. {Will} : décision sur le moment, promesse, prédiction d'opinion ({I'll call you}). {Be going to} : projet déjà décidé, prédiction appuyée sur un signe ({I'm going to sell my car}). Le présent continu : rendez-vous organisé, avec une date et souvent d'autres personnes ({I'm meeting Sam at 6}). Le présent simple : horaire officiel, programme fixe ({The train leaves at 7.15}).",
    forme: [
      { nom: "Décision, promesse", modele: "{will} + base", exemple: "[s:I][a:'ll] [r:help] you." },
      { nom: "Projet décidé", modele: "{be going to} + base", exemple: "[s:We] [a:are going to] [r:move]." },
      { nom: "Rendez-vous organisé", modele: "{be} + verbe en {-ing} + moment", exemple: "[s:I] [a:am] [r:see][t:ing] the dentist on Monday." },
      { nom: "Horaire, programme", modele: "présent simple", exemple: "[s:The film] [r:start][t:s] at 8." },
    ],
    usages: [
      { quand: "Une décision à l'instant", en: "It's cold. I[a:'ll] [r:close] the window.", fr: "Il fait froid. Je vais fermer la fenêtre." },
      { quand: "Une intention", en: "I [a:am going to] [r:study] medicine.", fr: "Je vais faire médecine." },
      { quand: "Un rendez-vous dans l'agenda", en: "We [a:are] [r:fly][t:ing] to Rome on Friday.", fr: "Nous partons pour Rome vendredi." },
      { quand: "Un horaire", en: "The shop [r:close][t:s] at 7 tonight.", fr: "Le magasin ferme à 19 h ce soir." },
    ],
    francais:
      "Le français emploie souvent le présent pour le futur (« je pars demain ») ou le futur proche (« je vais partir »). L'anglais a lui aussi ses présents du futur, mais chacun a sa nuance : le présent continu pour ce qui est organisé, le présent simple pour les horaires. Et à l'inverse, le futur simple français ne se traduit pas toujours par {will} : un projet décidé appelle plutôt {going to}.",
    pieges: [
      { faux: "I [x:will see] the doctor tomorrow at 10, I have an appointment.", juste: "I [a:am] [r:see][t:ing] the doctor tomorrow at 10.", pourquoi: "Un rendez-vous fixé dans l'agenda se dit au présent continu." },
      { faux: "The train [x:is leaving] at 7.15 every day.", juste: "The train [r:leave][t:s] at 7.15 every day.", pourquoi: "Un horaire régulier, fixé par d'autres : présent simple." },
      { faux: "The phone's ringing! — I [x:am going to] answer it.", juste: "The phone's ringing! — I[a:'ll] [r:answer] it.", pourquoi: "Décision prise à l'instant : {will}." },
    ],
    retenir: "Décision sur le moment : {will}. Projet : {going to}. Rendez-vous : {be} + {-ing}. Horaire : présent simple.",
  },

  "quand-je-serai": {
    regle:
      "Dans une phrase qui parle du futur, la partie introduite par {when} (quand), {as soon as} (dès que), {until} (jusqu'à ce que), {before} (avant que) ou {after} (après que) reste au présent. Seule l'autre partie prend {will} (ou un impératif, ou {going to}) : {I'll call you when I arrive}. Pour insister sur le fait que l'action sera terminée, on met le present perfect : {I'll tell you as soon as I've finished}. Dans une question, en revanche, {When will you come?} prend bien {will}.",
    forme: [
      { nom: "Futur + quand", modele: "{will} + base + {when} / {as soon as} + présent", exemple: "I[a:'ll] [r:call] you when I [r:arrive]." },
      { nom: "Terminé d'abord", modele: "{will} + base + {after} / {as soon as} + present perfect", exemple: "I[a:'ll] [r:tell] you as soon as I[a:'ve] [p:finished]." },
      { nom: "Dans l'autre sens", modele: "{When} + présent, {will} + base", exemple: "When she [r:get][t:s] home, she[a:'ll] [r:eat]." },
    ],
    usages: [
      { quand: "Un projet lié à un moment", en: "We[a:'ll] [r:have] dinner when Dad [r:come][t:s] back.", fr: "Nous dînerons quand papa rentrera." },
      { quand: "Une attente", en: "Wait here until I [r:come] back.", fr: "Attends ici jusqu'à ce que je revienne." },
      { quand: "Avant que", en: "I[a:'ll] [r:clean] the kitchen before the guests [r:arrive].", fr: "Je nettoierai la cuisine avant que les invités arrivent." },
    ],
    francais:
      "Le français met le futur des deux côtés : « je t'appellerai quand j'arriverai ». L'anglais n'accepte le futur que d'un côté : {when I arrive}, au présent. Même chose après « dès que », « jusqu'à ce que », « avant que », « après que » (où le français met parfois un subjonctif) : en anglais, toujours le présent après ces mots.",
    pieges: [
      { faux: "I'll call you when I [x:will arrive].", juste: "I'll call you when I [r:arrive].", pourquoi: "Après {when}, le futur s'exprime au présent." },
      { faux: "As soon as she [x:will finish], we'll leave.", juste: "As soon as she [r:finish][t:es], we'll leave.", pourquoi: "Après {as soon as}, présent (ou present perfect : {as soon as she has finished})." },
      { faux: "Stay until the film [x:will end].", juste: "Stay until the film [r:end][t:s].", pourquoi: "Même règle avec {until}." },
    ],
    retenir: "{will} ne monte qu'une fois dans la phrase : après {when}, {as soon as}, {until}, {before}, {after}, présent.",
  },

  "si-alors": {
    regle:
      "Le premier conditionnel parle d'une condition réelle et possible dans l'avenir, et de sa conséquence : {If it rains, we will stay at home}. La partie avec {if} se met au présent simple ; la conséquence prend {will} + base (ou un impératif, {can}, {may}, {should}…). On peut commencer par l'une ou l'autre partie ; la virgule n'est obligatoire que si la phrase commence par {if}. {Unless} veut dire « à moins que, sauf si » ({if… not}).",
    forme: [
      { nom: "Condition, résultat", modele: "{If} + présent, {will} + base", exemple: "If it [r:rain][t:s], we[a:'ll] [r:stay] home." },
      { nom: "Dans l'autre sens", modele: "{will} + base + {if} + présent", exemple: "You[a:'ll] [r:miss] the bus if you [a:don't] [r:hurry]." },
      { nom: "Avec un autre modal", modele: "{If} + présent, {can} / {may} / {should} + base", exemple: "If you [a:are] tired, you [a:can] [r:sleep] here." },
    ],
    usages: [
      { quand: "Un projet sous condition", en: "If I [r:have] time, I[a:'ll] [r:visit] you.", fr: "Si j'ai le temps, je te rendrai visite." },
      { quand: "Un avertissement", en: "If you [r:touch] that, you[a:'ll] [r:burn] yourself.", fr: "Si tu touches ça, tu vas te brûler." },
      { quand: "Une promesse", en: "If you [r:pass] your exam, we[a:'ll] [r:celebrate].", fr: "Si tu réussis ton examen, on fêtera ça." },
    ],
    francais:
      "Ici, le français et l'anglais se ressemblent beaucoup : « si + présent, futur ». La règle d'or est la même : jamais de futur juste après « si » (on ne dit pas « si tu viendras »), donc jamais de {will} juste après {if}. Attention seulement à {unless}, qui contient déjà la négation : {unless you hurry} = si tu ne te dépêches pas.",
    pieges: [
      { faux: "If it [x:will rain], we'll stay home.", juste: "If it [r:rain][t:s], we[a:'ll] [r:stay] home.", pourquoi: "Après {if}, le présent ; le {will} va dans l'autre partie." },
      { faux: "Unless you [x:don't hurry], you'll be late.", juste: "Unless you [r:hurry], you[a:'ll] [r:be] late.", pourquoi: "{unless} veut déjà dire « si… ne… pas » : pas de double négation." },
    ],
    retenir: "Condition possible : {If} + présent, {will} + base.",
  },

  "bulle-reve": {
    regle:
      "Le deuxième conditionnel parle d'une situation imaginaire, peu probable ou contraire à la réalité présente : {If I had a million euros, I would travel} (je n'ai pas ce million). On recule le verbe de la condition d'un cran (prétérit), et la conséquence prend {would} + base. Ce recul ne veut pas dire passé : il signale l'irréel. Avec {be}, on emploie {were} à toutes les personnes dans un anglais soigné ({If I were rich…}). {Could} et {might} peuvent remplacer {would}.",
    forme: [
      { nom: "Condition, résultat", modele: "{If} + prétérit, {would} + base", exemple: "If I [p:had] time, I [a:would] [r:help] you." },
      { nom: "Avec be", modele: "{If} + sujet + {were}…, {would} + base", exemple: "If she [a:were] here, she[a:'d] [r:know]." },
      { nom: "Avec could, might", modele: "{If} + prétérit, {could} / {might} + base", exemple: "If we [p:won], we [a:could] [r:buy] a house." },
    ],
    usages: [
      { quand: "Un rêve", en: "If I [p:spoke] Chinese, I [a:would] [r:work] in Shanghai.", fr: "Si je parlais chinois, je travaillerais à Shanghai." },
      { quand: "Le contraire de la réalité", en: "If he [p:lived] closer, we [a:would] [r:see] him more.", fr: "S'il habitait plus près, nous le verrions plus souvent." },
      { quand: "Un conseil", en: "If I [a:were] you, I [a:would] [r:apologise].", fr: "À ta place, je m'excuserais." },
    ],
    francais:
      "C'est exactement « si + imparfait, conditionnel » : « si j'avais…, je ferais… ». Le prétérit anglais joue le rôle de l'imparfait, {would} celui du conditionnel. Comme en français, on ne met jamais le conditionnel après « si » : pas de {would} juste après {if}.",
    pieges: [
      { faux: "If I [x:would have] money, I'd buy it.", juste: "If I [p:had] money, I[a:'d] [r:buy] it.", pourquoi: "Pas de {would} après {if} : la condition se met au prétérit." },
      { faux: "If I [x:am] rich, I would travel.", juste: "If I [a:were] rich, I [a:would] [r:travel].", pourquoi: "Situation imaginaire : le verbe recule d'un cran ({were}). Au présent, on parlerait d'une condition réelle." },
      { faux: "If she knew, she [x:will] be angry.", juste: "If she [p:knew], she [a:would] [r:be] angry.", pourquoi: "Avec une condition imaginaire, la conséquence prend {would}, pas {will}." },
    ],
    retenir: "Imaginaire : {If} + prétérit, {would} + base.",
  },

  "monde-envers": {
    regle:
      "Au passif, on met en avant celui ou ce qui subit l'action : {The house was built in 1900}. On le forme avec {be}, conjugué au temps voulu, suivi du participe passé du verbe. Celui qui fait l'action (l'agent) est introduit par {by} si l'on veut le nommer ({The book was written by Victor Hugo}), mais on l'omet souvent quand il est inconnu, évident ou sans importance. Le passif sert à parler d'un objet, d'un processus, ou de ce qui arrive sans savoir (ou sans dire) qui a agi.",
    forme: [
      { nom: "Présent", modele: "{am} / {is} / {are} + participe passé", exemple: "English [a:is] [p:spoken] here." },
      { nom: "Passé", modele: "{was} / {were} + participe passé", exemple: "The window [a:was] [p:broken]." },
      { nom: "Avec l'agent", modele: "… + {by} + agent", exemple: "The song [a:was] [p:written] by Lennon." },
      { nom: "Question", modele: "{Is} / {Was} + sujet + participe ?", exemple: "[a:Were] you [p:invited]?" },
    ],
    usages: [
      { quand: "L'agent est inconnu", en: "My bike [a:was] [p:stolen] yesterday.", fr: "On m'a volé mon vélo hier." },
      { quand: "Un processus, un fait", en: "Cheese [a:is] [p:made] from milk.", fr: "Le fromage est fabriqué à partir de lait." },
      { quand: "Mettre l'œuvre en avant", en: "This tower [a:was] [p:designed] by Eiffel's company.", fr: "Cette tour a été conçue par l'entreprise d'Eiffel." },
    ],
    francais:
      "Le passif anglais se forme comme le passif français (« être » + participe), mais l'anglais s'en sert beaucoup plus. Là où le français dit « on » (« on m'a volé mon vélo ») ou emploie un verbe pronominal (« ça se mange froid »), l'anglais choisit souvent le passif : {My bike was stolen}, {It is eaten cold}.",
    pieges: [
      { faux: "The letter [x:was wrote] yesterday.", juste: "The letter [a:was] [p:written] yesterday.", pourquoi: "Au passif, il faut le participe passé, la troisième forme : {write} · {wrote} · {written}." },
      { faux: "[x:One speaks] English here.", juste: "English [a:is] [p:spoken] here.", pourquoi: "Le « on » français se traduit très souvent par un passif ; {one} sonne vieilli ou très formel." },
      { faux: "The cake was made [x:of] my mum.", juste: "The cake [a:was] [p:made] by my mum.", pourquoi: "L'agent (« par ») s'introduit avec {by}." },
    ],
    retenir: "Passif = {be} au bon temps + participe passé (+ {by} + agent).",
  },

  "peut-etre": {
    regle:
      "{May}, {might} et {could} + base expriment une possibilité : quelque chose de peut-être vrai maintenant, ou peut-être à venir. {may} est un peu plus probable et plus formel, {might} un peu moins sûr, {could} présente une possibilité parmi d'autres. À la négation, {may not} et {might not} veulent dire « peut-être pas », mais {couldn't} veut dire « impossible ». Le mot {maybe} (en un seul mot) est un adverbe qui se place en début de phrase : {Maybe she's ill}.",
    forme: [
      { nom: "Possibilité", modele: "sujet + {may} / {might} / {could} + base", exemple: "[s:It] [a:might] [r:rain]." },
      { nom: "Peut-être pas", modele: "sujet + {may not} / {might not} + base", exemple: "[s:She] [a:may not] [r:come]." },
      { nom: "L'adverbe", modele: "{Maybe} + phrase complète", exemple: "Maybe [s:he] [a:is] at home." },
    ],
    usages: [
      { quand: "Une hypothèse sur maintenant", en: "Where's Tom? — He [a:may] [r:be] in the garden.", fr: "Où est Tom ? — Il est peut-être dans le jardin." },
      { quand: "Un futur incertain", en: "We [a:might] [r:go] to Spain this summer.", fr: "Nous irons peut-être en Espagne cet été." },
      { quand: "Une possibilité parmi d'autres", en: "It [a:could] [r:be] a mistake.", fr: "Ça pourrait être une erreur." },
    ],
    francais:
      "Le français dit « peut-être » ou « il se peut que » (avec un subjonctif) ; l'anglais préfère souvent un modal : {She might be late} plutôt que {Maybe she is late}, même si les deux sont justes. Ne confonds pas {maybe} (adverbe, « peut-être ») et {may be} (en deux mots, « est peut-être ») : {Maybe it's true} = {It may be true}.",
    pieges: [
      { faux: "She [x:mights] come.", juste: "She [a:might] [r:come].", pourquoi: "Comme tout modal, {might} ne prend jamais de {-s}." },
      { faux: "It [x:maybe] true.", juste: "It [a:may] [r:be] true.", pourquoi: "{maybe} est un adverbe, pas un verbe : il faut {may be} en deux mots, ou {Maybe it is true}." },
      { faux: "He might [x:to] call.", juste: "He [a:might] [r:call].", pourquoi: "Après un modal, verbe nu, sans {to}." },
    ],
    retenir: "Peut-être = {may} / {might} / {could} + base, ou {Maybe} en tête de phrase.",
  },

  "pouvoir-hier": {
    regle:
      "{Can} n'a que deux formes : {can} et {could}. Pour l'emmener ailleurs dans le temps, on emploie {be able to} (être capable de), qui se conjugue partout : {will be able to}, {have been able to}, {to be able to}. Au passé, {could} exprime une capacité générale ({I could swim when I was five}) ; pour une réussite ponctuelle, dans une situation précise, on dit {was able to} ou {managed to} (réussir à) : {I managed to open the door}. À la négation, {couldn't} convient dans les deux cas.",
    forme: [
      { nom: "Capacité passée générale", modele: "{could} + base", exemple: "[s:She] [a:could] [r:read] at four." },
      { nom: "Réussite ponctuelle", modele: "{was able to} / {managed to} + base", exemple: "[s:We] [a:managed to] [r:find] a taxi." },
      { nom: "Futur", modele: "{will be able to} + base", exemple: "[s:You] [a:will be able to] [r:drive] soon." },
      { nom: "Present perfect", modele: "{have been able to} + base", exemple: "[s:I] [a:haven't been able to] [r:sleep]." },
    ],
    usages: [
      { quand: "Un talent d'autrefois", en: "My grandfather [a:could] [r:speak] four languages.", fr: "Mon grand-père parlait quatre langues." },
      { quand: "Une difficulté surmontée", en: "The road was closed, but we [a:were able to] [r:get] home.", fr: "La route était fermée, mais nous avons pu rentrer." },
      { quand: "Une capacité future", en: "One day, robots [a:will be able to] [r:cook].", fr: "Un jour, les robots sauront cuisiner." },
    ],
    francais:
      "Le français dit « pouvoir » ou « réussir à » à tous les temps (je pourrai, j'ai pu). L'anglais doit changer d'outil : {can} n'a ni futur ni present perfect, d'où {will be able to} et {have been able to}. Et « j'ai pu le joindre », une réussite précise, se dit plutôt {I managed to reach him} que {I could reach him}.",
    pieges: [
      { faux: "I [x:will can] help you tomorrow.", juste: "I [a:will be able to] [r:help] you tomorrow.", pourquoi: "Deux modaux ne se suivent jamais : {can} devient {be able to} après {will}." },
      { faux: "After hours of work, we [x:could] fix the car.", juste: "After hours of work, we [a:managed to] [r:fix] the car.", pourquoi: "Pour une réussite précise dans le passé, on préfère {managed to} ou {were able to}." },
      { faux: "I [x:haven't could] sleep.", juste: "I [a:haven't been able to] [r:sleep].", pourquoi: "{can} n'a pas de participe passé : on passe par {been able to}." },
    ],
    retenir: "{could} = savoir faire en général ; {managed to} / {was able to} = avoir réussi une fois ; ailleurs : {be able to}.",
  },

  "mieux-vaut": {
    regle:
      "{Had better} + base (souvent {'d better}) donne un conseil fort, presque un avertissement : si on ne le suit pas, il y aura un problème ({You'd better hurry, or you'll miss the train}). Malgré {had}, il parle du présent ou du futur, et sa négation est {had better not}. {Be supposed to} + base exprime ce qui est prévu, attendu ou exigé par une règle, et souvent ce qui ne se passe pas comme prévu : {You're supposed to be in bed!}",
    forme: [
      { nom: "Conseil fort", modele: "sujet + {had better} ({'d better}) + base", exemple: "[s:You][a:'d better] [r:leave] now." },
      { nom: "Négation", modele: "sujet + {had better not} + base", exemple: "[s:We][a:'d better not] [r:be] late." },
      { nom: "Ce qui est prévu", modele: "sujet + {be supposed to} + base", exemple: "[s:The train] [a:is supposed to] [r:arrive] at 9." },
    ],
    usages: [
      { quand: "Un avertissement", en: "You[a:'d better] [r:take] an umbrella.", fr: "Tu ferais mieux de prendre un parapluie." },
      { quand: "Une règle", en: "You [a:are supposed to] [r:wear] a helmet.", fr: "On est censé porter un casque." },
      { quand: "Ce qui n'a pas eu lieu", en: "He [a:was supposed to] [r:call] me.", fr: "Il était censé m'appeler." },
    ],
    francais:
      "{You'd better} correspond à « tu ferais mieux de » ou « tu as intérêt à » : c'est plus pressant que {should}. {Be supposed to} traduit « être censé » : très courant, très utile pour exprimer un reproche ou une surprise. Retiens la différence de construction : pas de {to} après {better}, mais bien un {to} après {supposed}.",
    pieges: [
      { faux: "You'd better [x:to] go.", juste: "You[a:'d better] [r:go].", pourquoi: "Après {had better}, verbe nu, sans {to}." },
      { faux: "You'd [x:not better] call him.", juste: "You[a:'d better not] [r:call] him.", pourquoi: "La négation se place après {better} : {had better not}." },
      { faux: "You [x:are suppose to] knock.", juste: "You [a:are supposed to] [r:knock].", pourquoi: "On écrit {supposed}, avec un {-d}, même si on ne l'entend presque pas." },
    ],
    retenir: "{had better} + base = tu as intérêt à ; {be supposed to} + base = être censé.",
  },

  "durait-deja": {
    regle:
      "Le past perfect continu ({had been} + verbe en {-ing}) parle d'une activité qui durait déjà depuis un certain temps à un moment du passé : {When I met her, she had been living in Paris for ten years}. Il insiste sur la durée, ou sur la cause d'une situation passée : {He was tired because he had been working all night}. C'est le present perfect continu, reculé d'un cran dans le passé.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {had been} + verbe en {-ing}", exemple: "[s:They] [a:had been] [r:wait][t:ing] for hours." },
      { nom: "Avec une durée", modele: "… + {for} / {since} + …", exemple: "[s:I] [a:had been] [r:work][t:ing] there for two years." },
      { nom: "Question", modele: "{How long had} + sujet + {been} + {-ing} ?", exemple: "How long [a:had] you [a:been] [r:study][t:ing]?" },
    ],
    usages: [
      { quand: "Une durée avant un moment passé", en: "We [a:had been] [r:walk][t:ing] for hours when we found the village.", fr: "Nous marchions depuis des heures quand nous avons trouvé le village." },
      { quand: "La cause d'un état passé", en: "The ground was wet. It [a:had been] [r:rain][t:ing].", fr: "Le sol était mouillé. Il avait plu." },
      { quand: "Dans un récit", en: "She [a:had been] [r:liv][t:ing] alone since her husband died.", fr: "Elle vivait seule depuis la mort de son mari." },
    ],
    francais:
      "Le français dit « je marchais depuis des heures quand… », avec un imparfait et « depuis ». L'anglais voit une activité qui a commencé plus tôt et qui durait encore à ce moment-là : il lui faut {had been} + {-ing}. Comme toujours, les verbes d'état restent à la forme simple : {I had known him for years}.",
    pieges: [
      { faux: "I [x:was waiting] for an hour when the bus came.", juste: "I [a:had been] [r:wait][t:ing] for an hour when the bus came.", pourquoi: "Une durée qui mène jusqu'à un moment passé (« depuis une heure ») : {had been} + {-ing}." },
      { faux: "She [x:had been knowing] him for years.", juste: "She [a:had] [p:known] him for years.", pourquoi: "{know} est un verbe d'état : on garde {had} + participe." },
    ],
    retenir: "Une activité qui durait déjà avant un moment passé : {had been} + {-ing}.",
  },

  recit: {
    regle:
      "Pour raconter une histoire au passé, l'anglais répartit les rôles entre trois temps. Le prétérit simple fait avancer l'action, événement après événement ({She opened the door and screamed}). Le prétérit continu peint le décor, ce qui était en cours ({It was raining}). Le past perfect, simple ou continu, fait les retours en arrière, ce qui s'était passé avant ({Someone had broken the window}).",
    forme: [
      { nom: "L'action", modele: "prétérit simple", exemple: "[s:She] [r:open][t:ed] the door." },
      { nom: "Le décor", modele: "{was} / {were} + {-ing}", exemple: "[s:It] [a:was] [r:rain][t:ing]." },
      { nom: "Le retour en arrière", modele: "{had} + participe · {had been} + {-ing}", exemple: "[s:Someone] [a:had] [p:broken] the window." },
    ],
    usages: [
      { quand: "Planter le décor", en: "The sun [a:was] [r:shin][t:ing] and the birds [a:were] [r:sing][t:ing].", fr: "Le soleil brillait et les oiseaux chantaient." },
      { quand: "Enchaîner les actions", en: "He [p:got] up, [p:took] his coat and [p:left].", fr: "Il s'est levé, a pris son manteau et est parti." },
      { quand: "Revenir en arrière", en: "She [p:recognised] him: they [a:had] [p:met] years before.", fr: "Elle l'a reconnu : ils s'étaient rencontrés des années plus tôt." },
    ],
    francais:
      "Les trois temps correspondent assez bien à ceux d'un récit français : passé simple ou passé composé pour l'action, imparfait pour le décor, plus-que-parfait pour le retour en arrière. Mais l'imparfait d'habitude (« chaque jour, il marchait ») ne devient pas un {-ing} : il se dit au prétérit simple, avec {would} ou avec {used to}.",
    pieges: [
      { faux: "When I arrived, everybody [x:left].", juste: "When I arrived, everybody [a:had] [p:left].", pourquoi: "Ils étaient partis avant mon arrivée : retour en arrière, {had} + participe. Avec {left} seul, ils partent au moment où j'arrive !" },
      { faux: "Every day, he [x:was walking] to school.", juste: "Every day, he [r:walk][t:ed] to school.", pourquoi: "Une habitude passée n'est pas un décor en cours : prétérit simple (ou {used to walk}, {would walk})." },
    ],
    retenir: "Action : prétérit. Décor : {was} + {-ing}. Avant : {had} + participe.",
  },

  "would-autrefois": {
    regle:
      "Pour raconter les habitudes du passé, on peut employer {used to} + base ou {would} + base. {Used to} convient pour les actions répétées comme pour les états ({I used to have long hair}). {Would} ne s'emploie que pour des actions répétées, souvent dans un récit nostalgique, une fois le cadre posé ({Every summer, we would go to the sea}). On ne dit donc pas {I would have long hair} pour un état passé.",
    forme: [
      { nom: "Actions et états", modele: "{used to} + base", exemple: "[s:We] [a:used to] [r:live] in Lyon." },
      { nom: "Actions répétées seulement", modele: "{would} + base", exemple: "[s:My grandma] [a:would] [r:tell] us stories." },
    ],
    usages: [
      { quand: "Un souvenir répété", en: "On Sundays, my father [a:would] [r:make] pancakes.", fr: "Le dimanche, mon père faisait des crêpes." },
      { quand: "Un état passé", en: "This house [a:used to] [r:belong] to my uncle.", fr: "Autrefois, cette maison appartenait à mon oncle." },
      { quand: "Un récit nostalgique", en: "We [a:used to] [r:spend] summers by the sea. We [a:would] [r:swim] every day.", fr: "Nous passions nos étés au bord de la mer. Nous nagions tous les jours." },
    ],
    francais:
      "Les deux traduisent l'imparfait d'habitude (« il faisait », « nous allions »). Le français n'a qu'un temps pour cela ; l'anglais en a deux, plus le prétérit simple. Ne confonds pas ce {would} du souvenir avec le {would} du conditionnel (« je ferais ») : c'est le contexte du récit qui fait la différence.",
    pieges: [
      { faux: "I [x:would have] a dog when I was a child.", juste: "I [a:used to] [r:have] a dog when I was a child.", pourquoi: "Avoir un chien est un état : {would} ne convient pas, il faut {used to} (ou {I had})." },
      { faux: "We [x:would to go] to the beach.", juste: "We [a:would] [r:go] to the beach.", pourquoi: "{would} est un modal : verbe nu, sans {to}." },
    ],
    retenir: "Actions répétées : {used to} ou {would}. États passés : {used to} seulement.",
  },

  "jumelles-futur": {
    regle:
      "Le futur continu ({will be} + verbe en {-ing}) montre une action en cours à un moment précis du futur : {This time tomorrow, I'll be flying to Rome}. Il sert aussi à parler poliment de ce qui est prévu : {Will you be using the car tonight?} Le futur antérieur ({will have} + participe passé) montre une action déjà terminée avant un moment du futur : {By 2030, they will have built the bridge}. {By} (d'ici à, au plus tard) l'accompagne souvent.",
    forme: [
      { nom: "En cours dans le futur", modele: "{will be} + verbe en {-ing}", exemple: "[s:I][a:'ll be] [r:work][t:ing] at 9." },
      { nom: "Déjà fini dans le futur", modele: "{will have} + participe passé", exemple: "[s:She][a:'ll have] [p:finished] by noon." },
      { nom: "Question polie", modele: "{Will} + sujet + {be} + {-ing} ?", exemple: "[a:Will] [s:you] [a:be] [r:com][t:ing] tonight?" },
    ],
    usages: [
      { quand: "Une action à une heure donnée", en: "At 8 tomorrow, I [a:will be] [r:driv][t:ing] to work.", fr: "Demain à 8 h, je serai en route pour le travail." },
      { quand: "Un bilan dans le futur", en: "By June, I [a:will have] [p:saved] enough money.", fr: "D'ici juin, j'aurai économisé assez d'argent." },
      { quand: "Une question délicate", en: "[a:Will] you [a:be] [r:stay][t:ing] for dinner?", fr: "Tu restes dîner ?" },
    ],
    francais:
      "Le futur antérieur (« j'aurai fini ») correspond bien à {will have finished}. Le futur continu n'a pas d'équivalent direct : on dit « je serai en train de… », ou un simple futur. Avec {by} (« d'ici à », « au plus tard »), pense tout de suite au futur antérieur.",
    pieges: [
      { faux: "By Friday, I [x:will finish] the report.", juste: "By Friday, I [a:will have] [p:finished] the report.", pourquoi: "{By Friday} indique que l'action sera terminée avant ce moment : futur antérieur." },
      { faux: "Don't call at 8, I [x:will have] dinner.", juste: "Don't call at 8, I [a:will be] [r:hav][t:ing] dinner.", pourquoi: "À 8 h, le dîner sera en cours : futur continu." },
    ],
    retenir: "En cours à un moment futur : {will be} + {-ing}. Terminé avant : {will have} + participe.",
  },

  regret: {
    regle:
      "Le troisième conditionnel imagine un passé différent, qui n'a pas eu lieu, et sa conséquence, elle aussi passée : {If I had left earlier, I would have caught the train} (je ne suis pas parti tôt, j'ai raté le train). La condition se met au past perfect ({had} + participe), la conséquence prend {would have} + participe. On l'utilise pour les regrets, les reproches et les « et si… » sur le passé. {Could have} et {might have} peuvent remplacer {would have}.",
    forme: [
      { nom: "Condition, résultat", modele: "{If} + {had} + participe, {would have} + participe", exemple: "If you [a:had] [p:asked], I [a:would have] [p:helped]." },
      { nom: "Négation", modele: "{If} + {hadn't} + participe, {wouldn't have} + participe", exemple: "If it [a:hadn't] [p:rained], we [a:wouldn't have] [p:stayed] in." },
      { nom: "Avec could, might", modele: "… {could have} / {might have} + participe", exemple: "If he [a:had] [p:trained], he [a:might have] [p:won]." },
    ],
    usages: [
      { quand: "Un regret", en: "If I [a:had] [p:studied], I [a:would have] [p:passed].", fr: "Si j'avais étudié, j'aurais réussi." },
      { quand: "Un reproche", en: "If you [a:had] [p:told] me, I [a:could have] [p:helped].", fr: "Si tu me l'avais dit, j'aurais pu t'aider." },
      { quand: "Un soulagement", en: "If we [a:hadn't] [p:left] early, we [a:would have] [p:missed] the plane.", fr: "Si nous n'étions pas partis tôt, nous aurions raté l'avion." },
    ],
    francais:
      "C'est le décalque de « si + plus-que-parfait, conditionnel passé » : « si j'avais su, je serais venu » = {If I had known, I would have come}. Une seule vigilance : l'anglais prend toujours {have} dans {would have}, même pour les verbes qui prennent « être » en français. À l'oral, {would have} se contracte en {would've}, que l'on voit parfois mal écrit {would of}.",
    pieges: [
      { faux: "If I [x:would have known], I would have come.", juste: "If I [a:had] [p:known], I [a:would have] [p:come].", pourquoi: "Pas de {would} après {if} : la condition prend {had} + participe." },
      { faux: "If she had called, I [x:would be come].", juste: "If she had called, I [a:would have] [p:come].", pourquoi: "Le conditionnel passé anglais se fait toujours avec {have}." },
      { faux: "I [x:would of] helped you.", juste: "I [a:would have] [p:helped] you.", pourquoi: "{would've} se prononce comme {would of}, mais s'écrit {would have}." },
    ],
    retenir: "Passé imaginaire : {If} + {had} + participe, {would have} + participe.",
  },

  "mondes-melanges": {
    regle:
      "Les conditionnels mixtes mélangent les époques. Une condition passée peut avoir une conséquence dans le présent : {If I had studied medicine, I would be a doctor now} (je n'ai pas étudié la médecine, je ne suis pas médecin). Une situation présente, toujours vraie, peut expliquer une conséquence passée : {If I were braver, I would have said something} (je ne suis pas courageux, je n'ai rien dit). Chaque partie garde la forme de son époque.",
    forme: [
      { nom: "Passé → présent", modele: "{If} + {had} + participe, {would} + base", exemple: "If I [a:had] [p:taken] the job, I [a:would] [r:be] rich now." },
      { nom: "Présent → passé", modele: "{If} + prétérit, {would have} + participe", exemple: "If she [p:spoke] English, she [a:would have] [p:understood]." },
    ],
    usages: [
      { quand: "Un choix passé, un effet présent", en: "If we [a:had] [p:bought] that house, we [a:would] [r:live] by the sea.", fr: "Si nous avions acheté cette maison, nous vivrions au bord de la mer." },
      { quand: "Un trait de caractère, un effet passé", en: "If he [a:weren't] so shy, he [a:would have] [p:asked] her out.", fr: "S'il n'était pas si timide, il l'aurait invitée à sortir." },
    ],
    francais:
      "Le français mélange les temps exactement de la même façon : « si j'avais pris ce poste, je serais riche aujourd'hui », « s'il n'était pas si timide, il l'aurait invitée ». Il suffit donc de suivre le sens : chaque partie garde la forme de son époque, passé irréel ({had} + participe, {would have}) ou présent irréel (prétérit, {would}).",
    pieges: [
      { faux: "If I had won the lottery, I [x:would have been] rich now.", juste: "If I had won the lottery, I [a:would] [r:be] rich now.", pourquoi: "{now} montre que la conséquence est dans le présent : {would} + base." },
      { faux: "If she [x:has] more patience, she would have finished.", juste: "If she [p:had] more patience, she [a:would have] [p:finished].", pourquoi: "Une condition imaginaire sur le présent se met au prétérit, pas au présent." },
    ],
    retenir: "Chaque partie garde son époque : passé irréel = {had} + participe, {would have} ; présent irréel = prétérit, {would}.",
  },

  "sauf-si": {
    regle:
      "Plusieurs mots posent des conditions avec une nuance bien à eux. {Unless} = sauf si, à moins que ({if… not}) ; {as long as} et {provided (that)} = à condition que, pourvu que ; {in case} = au cas où, par précaution (on agit avant, pour être prêt) ; {even if} = même si ; {otherwise} = sinon (il relie deux phrases). Comme après {if}, on emploie le présent pour parler du futur dans la partie qui porte la condition.",
    forme: [
      { nom: "Sauf si", modele: "{unless} + présent (sens positif)", exemple: "I'll go unless it [r:rain][t:s]." },
      { nom: "À condition que", modele: "{as long as} / {provided (that)} + présent", exemple: "You can borrow it as long as you [r:bring] it back." },
      { nom: "Au cas où", modele: "{in case} + présent", exemple: "Take a coat in case it [r:get][t:s] cold." },
      { nom: "Sinon", modele: "phrase. {Otherwise}, phrase", exemple: "Hurry up. Otherwise, we[a:'ll] [r:miss] the bus." },
    ],
    usages: [
      { quand: "Une exception", en: "We'll eat outside unless it [a:is] too cold.", fr: "Nous mangerons dehors, à moins qu'il fasse trop froid." },
      { quand: "Une condition posée", en: "I'll lend you my car provided you [r:drive] carefully.", fr: "Je te prête ma voiture à condition que tu conduises prudemment." },
      { quand: "Une précaution", en: "I always carry water in case I [r:get] thirsty.", fr: "J'ai toujours de l'eau sur moi, au cas où j'aurais soif." },
      { quand: "Même si", en: "I'll finish even if it [r:take][t:s] all night.", fr: "Je finirai, même si ça prend toute la nuit." },
    ],
    francais:
      "Le français met souvent un subjonctif ou un conditionnel après ces mots (« à moins qu'il pleuve », « au cas où il ferait froid ») ; l'anglais garde un simple présent. Attention à la différence entre {in case} et {if} : {Take an umbrella in case it rains} (prends-le maintenant, par précaution) n'est pas {Take an umbrella if it rains} (prends-le seulement s'il pleut).",
    pieges: [
      { faux: "Unless you [x:don't study], you'll fail.", juste: "Unless you [r:study], you[a:'ll] [r:fail].", pourquoi: "{unless} contient déjà la négation : pas de {don't} en plus." },
      { faux: "Take a map in case you [x:will get] lost.", juste: "Take a map in case you [r:get] lost.", pourquoi: "Après {in case}, présent pour parler du futur." },
      { faux: "[x:Even] it rains, we'll go.", juste: "Even if it [r:rain][t:s], we[a:'ll] [r:go].", pourquoi: "« Même si » se dit {even if} ; {even} seul veut dire « même »." },
    ],
    retenir: "{unless} = sauf si · {as long as} = à condition que · {in case} = au cas où · {even if} = même si.",
  },

  "passif-etats": {
    regle:
      "Le passif se met à tous les temps : il suffit de conjuguer {be} au temps voulu, et le participe passé ne change jamais. Present perfect : {has been built} ; présent continu : {is being built} ; futur : {will be built} ; past perfect : {had been built}. Avec un modal ({can}, {must}, {should}, {might}…), on met {be} à la base : {It must be done}. Au passé des modaux : {It should have been done}.",
    forme: [
      { nom: "Présent continu", modele: "{am} / {is} / {are} + {being} + participe", exemple: "The road [a:is being] [p:repaired]." },
      { nom: "Present perfect", modele: "{have} / {has} + {been} + participe", exemple: "The tickets [a:have been] [p:sold]." },
      { nom: "Futur", modele: "{will be} + participe", exemple: "The results [a:will be] [p:published] soon." },
      { nom: "Avec un modal", modele: "modal + {be} + participe", exemple: "This form [a:must be] [p:signed]." },
    ],
    usages: [
      { quand: "Un chantier en cours", en: "A new school [a:is being] [p:built].", fr: "On est en train de construire une nouvelle école." },
      { quand: "Un résultat récent", en: "My car [a:has been] [p:stolen]!", fr: "On m'a volé ma voiture !" },
      { quand: "Une règle", en: "Phones [a:must be] [p:switched] off.", fr: "Les téléphones doivent être éteints." },
      { quand: "Un reproche", en: "The letter [a:should have been] [p:sent] yesterday.", fr: "La lettre aurait dû être envoyée hier." },
    ],
    francais:
      "Le français fait pareil (« a été construit », « sera construit », « doit être signé »). La forme continue, en revanche, n'existe pas en français : {is being built} se traduit par « est en (cours de) construction » ou « on est en train de construire ». Retiens la recette : le temps se lit sur {be}, le sens sur le participe.",
    pieges: [
      { faux: "The bridge [x:is building] now.", juste: "The bridge [a:is being] [p:built] now.", pourquoi: "Le pont ne construit rien : il est construit. Au passif continu, il faut {being} + participe." },
      { faux: "It [x:must done] today.", juste: "It [a:must be] [p:done] today.", pourquoi: "Avec un modal, le passif garde {be} : modal + {be} + participe." },
      { faux: "The house [x:has built] in 1990.", juste: "The house [a:was] [p:built] in 1990.", pourquoi: "Avec une date, prétérit ; et au passif, il faut {be} : {was built}." },
    ],
    retenir: "Le temps se met sur {be}, le participe ne bouge pas : {is being}, {has been}, {will be}, {must be} + participe.",
  },

  "passif-pieges": {
    regle:
      "Avec les verbes à deux compléments ({give}, {send}, {offer}, {show}, {tell}, {teach}, {pay}…), l'anglais peut faire de la personne qui reçoit le sujet du passif : {I was given a present} (on m'a donné un cadeau). À l'oral, {get} remplace souvent {be} pour un changement ou un incident ({He got hurt}, {They got married}). Après une préposition ou un verbe suivi de {-ing}, le passif devient {being} + participe ({She avoids being seen}) ; après un verbe suivi de {to}, il devient {to be} + participe ({She wants to be invited}).",
    forme: [
      { nom: "La personne en sujet", modele: "personne + {be} + participe + chose", exemple: "[s:I] [a:was] [p:given] a watch." },
      { nom: "Passif avec get", modele: "{get} + participe", exemple: "[s:He] [a:got] [p:injured]." },
      { nom: "Après un -ing", modele: "{being} + participe", exemple: "I don't like [a:being] [p:watched]." },
      { nom: "Après to", modele: "{to be} + participe", exemple: "She expects [a:to be] [p:paid]." },
    ],
    usages: [
      { quand: "On m'a dit, on nous a montré", en: "We [a:were] [p:told] to wait.", fr: "On nous a dit d'attendre." },
      { quand: "Un incident", en: "My phone [a:got] [p:stolen] on the bus.", fr: "Je me suis fait voler mon téléphone dans le bus." },
      { quand: "Ce qu'on aime ou non", en: "Nobody likes [a:being] [p:criticised].", fr: "Personne n'aime être critiqué." },
    ],
    francais:
      "Le français ne peut pas mettre la personne qui reçoit en sujet : on ne dit pas « je fus donné un cadeau », on dit « on m'a donné ». L'anglais adore cette tournure : {I was told}, {I was offered a job}, {She was shown the way}. Et « se faire » + infinitif (« se faire voler », « se faire renverser ») se traduit souvent par {get} + participe.",
    pieges: [
      { faux: "I [x:was said] to wait.", juste: "I [a:was] [p:told] to wait.", pourquoi: "Avec {say}, la personne ne peut pas devenir sujet au passif : il faut {tell}, donc {I was told}." },
      { faux: "She avoids [x:be seen].", juste: "She avoids [a:being] [p:seen].", pourquoi: "{avoid} est suivi de {-ing} : au passif, {being} + participe." },
      { faux: "He [x:made himself hit] by a car.", juste: "He [a:got] [p:hit] by a car.", pourquoi: "« Se faire renverser » se dit avec {get} + participe, pas avec {make}." },
    ],
    retenir: "{I was given / told / shown}… ; {get} + participe ; {being} + participe après un {-ing} ; {to be} + participe après {to}.",
  },

  "detective-modal": {
    regle:
      "Les modaux servent aussi à déduire, selon le degré de certitude. {Must} = sûrement, j'en suis presque certain ({He must be tired}) ; {might}, {may}, {could} = peut-être ; {can't} = impossible, sûrement pas ({She can't be at work, I've just seen her in town}). Pour une déduction sur le passé, on ajoute {have} + participe passé : {must have been}, {might have forgotten}, {can't have seen}.",
    forme: [
      { nom: "Sur le présent", modele: "{must} / {might} / {can't} + base", exemple: "[s:He] [a:must] [r:be] at home." },
      { nom: "Sur une action en cours", modele: "{must} / {might} / {can't} + {be} + {-ing}", exemple: "[s:They] [a:must be] [r:sleep][t:ing]." },
      { nom: "Sur le passé", modele: "{must} / {might} / {can't} + {have} + participe", exemple: "[s:She] [a:must have] [p:missed] the bus." },
    ],
    usages: [
      { quand: "Presque sûr", en: "The lights are on. They [a:must] [r:be] at home.", fr: "La lumière est allumée. Ils doivent être chez eux." },
      { quand: "Une hypothèse", en: "He [a:might have] [p:forgotten] the meeting.", fr: "Il a peut-être oublié la réunion." },
      { quand: "Impossible", en: "You [a:can't] [r:be] hungry, you've just eaten!", fr: "Tu ne peux pas avoir faim, tu viens de manger !" },
      { quand: "Impossible, dans le passé", en: "She [a:can't have] [p:seen] me, it was dark.", fr: "Elle n'a pas pu me voir, il faisait nuit." },
    ],
    francais:
      "Le français dit « il doit être fatigué » (déduction) avec le même verbe que « il doit travailler » (obligation) : l'anglais aussi, avec {must}. Mais le contraire de cette déduction n'est pas {mustn't} : c'est {can't} (« ce n'est pas possible »). Pour le passé, l'anglais ne conjugue pas le modal : il garde {must} et ajoute {have} + participe (« il a dû oublier » = {he must have forgotten}).",
    pieges: [
      { faux: "He [x:mustn't] be French, his accent is German.", juste: "He [a:can't] [r:be] French, his accent is German.", pourquoi: "Pour une déduction négative (« ce n'est pas possible »), on emploie {can't}, pas {mustn't}." },
      { faux: "She [x:must forgot] her keys.", juste: "She [a:must have] [p:forgotten] her keys.", pourquoi: "Déduction sur le passé : modal + {have} + participe passé." },
      { faux: "The house was empty: they [x:had to] leave early.", juste: "The house was empty: they [a:must have] [p:left] early.", pourquoi: "« Ils ont dû partir » (déduction) se dit {must have left} ; {had to leave} voudrait dire « ils ont été obligés de partir »." },
    ],
    retenir: "Sûr : {must}. Peut-être : {might}. Impossible : {can't}. Sur le passé : + {have} + participe.",
  },

  "questions-negatives": {
    regle:
      "Une question à la forme négative ({Don't you…?}, {Isn't it…?}, {Haven't you…?}) exprime le plus souvent une émotion : la surprise ({Don't you like chocolate?}), un reproche ({Haven't you finished yet?}) ou une proposition ({Why don't we go out?}). Pour y répondre, l'anglais ne regarde pas la forme de la question mais la réalité : {Yes} si c'est vrai (notre « si »), {No} si c'est faux.",
    forme: [
      { nom: "Question négative", modele: "{Don't} / {Isn't} / {Haven't}… + sujet + … ?", exemple: "[a:Don't] [s:you] [r:remember] me?" },
      { nom: "Proposition", modele: "{Why don't we} / {you} + base ?", exemple: "Why [a:don't] [s:we] [r:take] a taxi?" },
      { nom: "Répondre", modele: "{Yes} = c'est vrai (si) · {No} = c'est faux (non)", exemple: "Isn't it ready? — Yes, it [a:is]!" },
    ],
    usages: [
      { quand: "La surprise", en: "[a:Haven't] you [p:seen] this film? It's a classic!", fr: "Tu n'as pas vu ce film ? C'est un classique !" },
      { quand: "Le reproche", en: "[a:Can't] you [r:be] quiet?", fr: "Tu ne peux pas te taire ?" },
      { quand: "La proposition", en: "Why [a:don't] you [r:come] with us?", fr: "Pourquoi tu ne viens pas avec nous ?" },
      { quand: "Répondre « si »", en: "Don't you speak French? — Yes, I [a:do].", fr: "Tu ne parles pas français ? — Si." },
    ],
    francais:
      "Le français a un mot magique pour contredire une question négative : « si ». L'anglais n'en a pas : il répond {Yes} + l'auxiliaire pour dire « si » ({Yes, I do}), et {No} + l'auxiliaire pour confirmer la négation ({No, I don't} = non, je ne le parle pas). Le réflexe : réponds selon la réalité, pas selon la forme de la question.",
    pieges: [
      { faux: "Don't you like it? — [x:No], I love it!", juste: "Don't you like it? — Yes, I [a:do]! I love it!", pourquoi: "Pour dire « si » (j'aime), l'anglais répond {Yes}, selon la réalité." },
      { faux: "Why [x:we don't] go?", juste: "Why [a:don't] [s:we] [r:go]?", pourquoi: "Dans la question, l'auxiliaire passe devant le sujet : {Why don't we…?}" },
    ],
    retenir: "Question négative : une émotion ou une proposition. Réponse : {Yes} = si (c'est vrai), {No} = non.",
  },

  "genie-regrets": {
    regle:
      "{Wish} (et {if only}, plus fort) exprime un souhait sur une réalité qu'on voudrait différente. Le verbe qui suit recule d'un cran, signe de l'irréel. Regret sur le présent : {wish} + prétérit ({I wish I had more time} : je n'ai pas assez de temps). Regret sur le passé : {wish} + past perfect ({I wish I had studied} : je n'ai pas étudié). Agacement, ou envie qu'une autre personne change de comportement : {wish} + {would} + base ({I wish you would stop}).",
    forme: [
      { nom: "Regret présent", modele: "{wish} + prétérit ({were} pour {be})", exemple: "I wish I [p:had] a car." },
      { nom: "Regret passé", modele: "{wish} + {had} + participe", exemple: "I wish I [a:had] [p:listened]." },
      { nom: "Agacement", modele: "{wish} + sujet + {would} + base", exemple: "I wish it [a:would] [r:stop] raining." },
      { nom: "Plus fort", modele: "{If only} + même structure", exemple: "If only I [a:were] taller!" },
    ],
    usages: [
      { quand: "Un regret sur maintenant", en: "I wish I [p:spoke] Italian.", fr: "J'aimerais tellement parler italien." },
      { quand: "Un regret sur le passé", en: "She wishes she [a:hadn't] [p:sold] her house.", fr: "Elle regrette d'avoir vendu sa maison." },
      { quand: "Un agacement", en: "I wish you [a:would] [r:listen] to me!", fr: "Si seulement tu m'écoutais !" },
    ],
    francais:
      "Le français dit « je voudrais que », « j'aimerais », « je regrette » ou « si seulement » ; l'anglais concentre tout dans {wish}, avec un verbe reculé d'un cran. Piège : {wish} n'est jamais suivi d'un futur. Pour un souhait réaliste, on emploie {hope} ({I hope you win}), et pour des vœux, {wish} + personne + nom ({I wish you a happy birthday}).",
    pieges: [
      { faux: "I wish I [x:have] more time.", juste: "I wish I [p:had] more time.", pourquoi: "Après {wish}, le présent recule au prétérit : c'est le signe de l'irréel." },
      { faux: "I wish I [x:didn't say] that.", juste: "I wish I [a:hadn't] [p:said] that.", pourquoi: "Regret sur le passé : {wish} + {had} + participe." },
      { faux: "I wish you [x:will pass] your exam.", juste: "I [r:hope] you [r:pass] your exam.", pourquoi: "Pour un souhait réaliste sur l'avenir, on dit {hope}, pas {wish}." },
    ],
    retenir: "{wish} + prétérit (présent irréel) · + {had} + participe (passé) · + {would} (agacement).",
  },

  messager: {
    regle:
      "Au discours indirect, on rapporte les paroles de quelqu'un sans les citer mot pour mot. Si le verbe introducteur est au passé ({said}, {told}, {asked}), les verbes reculent en général d'un cran : présent → prétérit, prétérit et present perfect → past perfect, {will} → {would}, {can} → {could}. Les pronoms et les repères de temps et de lieu s'adaptent aussi ({tomorrow} → {the next day}, {here} → {there}). Si ce qui est rapporté reste vrai, on peut garder le temps d'origine.",
    forme: [
      { nom: "Une affirmation", modele: "{say (that)} + phrase · {tell} + personne + {(that)} + phrase", exemple: "She [p:told] me she [p:was] tired." },
      { nom: "Une question fermée", modele: "{ask} + {if} / {whether} + sujet + verbe", exemple: "He [p:asked] if I [p:liked] jazz." },
      { nom: "Une question ouverte", modele: "{ask} + mot interrogatif + sujet + verbe", exemple: "She [p:asked] where I [p:lived]." },
      { nom: "Un ordre", modele: "{tell} / {ask} + personne + {to} + base", exemple: "He [p:told] us [k:to] [r:wait]." },
    ],
    usages: [
      { quand: "Rapporter une déclaration", en: "“I'm hungry.” → He said he [p:was] hungry.", fr: "« J'ai faim. » → Il a dit qu'il avait faim." },
      { quand: "Rapporter une promesse", en: "“I will help.” → She said she [a:would] [r:help].", fr: "« J'aiderai. » → Elle a dit qu'elle aiderait." },
      { quand: "Rapporter une question", en: "“Where do you work?” → He asked where I [p:worked].", fr: "« Où travailles-tu ? » → Il m'a demandé où je travaillais." },
    ],
    francais:
      "Le français fait la même concordance des temps (« il a dit qu'il avait faim »). Les vrais pièges sont ailleurs : {say} ne prend pas de personne directement ({say to me} ou {tell me}, jamais {say me}) ; et dans une question rapportée, l'ordre redevient celui d'une affirmation, sans {do} : {He asked where I lived}, pas {where did I live}.",
    pieges: [
      { faux: "She [x:said me] that she was tired.", juste: "She [p:told] me that she was tired.", pourquoi: "{tell} + personne ; {say} se construit sans personne (ou avec {to} : {said to me})." },
      { faux: "He asked me where [x:did I live].", juste: "He asked me where I [p:lived].", pourquoi: "Dans une question rapportée, plus d'inversion ni de {do} : sujet + verbe." },
      { faux: "She told me [x:that I wait].", juste: "She told me [k:to] [r:wait].", pourquoi: "Un ordre rapporté se construit avec {tell} + personne + {to} + base." },
    ],
    retenir: "Verbe introducteur au passé : un cran en arrière. {say} sans personne, {tell} + personne, question rapportée sans inversion.",
  },

  "verbes-rapporteurs": {
    regle:
      "Au lieu de répéter {said}, on peut choisir un verbe qui résume l'intention des paroles. Chaque verbe a sa construction : {promise}, {refuse}, {offer}, {agree}, {threaten} + {to} + base ; {advise}, {warn}, {remind}, {persuade}, {encourage} + personne + {to} + base ; {deny}, {admit}, {suggest}, {recommend} + verbe en {-ing} ; {accuse} + personne + {of} + {-ing} ; {apologise for}, {insist on} + {-ing}.",
    forme: [
      { nom: "Verbe + to", modele: "{promise} / {refuse} / {offer} + {to} + base", exemple: "He [v:promised] [k:to] [r:call]." },
      { nom: "Verbe + personne + to", modele: "{advise} / {warn} / {remind} + personne + {to} + base", exemple: "She [v:reminded] me [k:to] [r:lock] the door." },
      { nom: "Verbe + -ing", modele: "{deny} / {admit} / {suggest} + verbe en {-ing}", exemple: "He [v:denied] [r:tak][t:ing] the money." },
      { nom: "Préposition + -ing", modele: "{accuse}… {of} · {apologise for} · {insist on} + {-ing}", exemple: "She [v:apologised] for [r:be][t:ing] late." },
    ],
    usages: [
      { quand: "Une promesse", en: "“I'll pay you back.” → He [v:promised] [k:to] [r:pay] me back.", fr: "Il a promis de me rembourser." },
      { quand: "Un conseil", en: "“You should rest.” → The doctor [v:advised] me [k:to] [r:rest].", fr: "Le médecin m'a conseillé de me reposer." },
      { quand: "Un aveu", en: "“Yes, I broke it.” → She [v:admitted] [r:break][t:ing] it.", fr: "Elle a avoué l'avoir cassé." },
      { quand: "Une suggestion", en: "“Let's go out.” → He [v:suggested] [r:go][t:ing] out.", fr: "Il a proposé de sortir." },
    ],
    francais:
      "Le français emploie presque toujours « de » + infinitif (promettre de, refuser de, conseiller de…). En anglais, il faut apprendre la construction avec le verbe. Le piège le plus courant est {suggest} : il ne se construit jamais avec une personne + {to}. On dit {He suggested going} ou {He suggested that I (should) go}.",
    pieges: [
      { faux: "He suggested [x:me to go].", juste: "He [v:suggested] [r:go][t:ing].", pourquoi: "{suggest} + {-ing}, ou {suggest that} + phrase ; jamais personne + {to}." },
      { faux: "She denied [x:to steal] the money.", juste: "She [v:denied] [r:steal][t:ing] the money.", pourquoi: "{deny} est suivi de {-ing}." },
      { faux: "They accused him [x:to lie].", juste: "They [v:accused] him [k:of] [r:ly][t:ing].", pourquoi: "{accuse} + personne + {of} + {-ing} (et {lie} devient {lying})." },
    ],
    retenir: "Un verbe, une construction : {promise to}, {advise someone to}, {deny} + {-ing}, {accuse someone of} + {-ing}.",
  },

  perception: {
    regle:
      "Après les verbes de perception ({see}, {hear}, {watch}, {notice}, {feel}, {smell}), le verbe qui suit la personne a deux formes possibles. La base verbale (sans {to}) montre une action vue ou entendue en entier, du début à la fin : {I saw him cross the street}. La forme en {-ing} montre une action surprise en plein déroulement : {I saw him crossing the street} (il était en train de traverser). Au passif, en revanche, {to} réapparaît : {He was seen to leave}.",
    forme: [
      { nom: "Action entière", modele: "verbe de perception + personne + base", exemple: "I [p:heard] her [r:sing] a song." },
      { nom: "Action en cours", modele: "verbe de perception + personne + verbe en {-ing}", exemple: "I [p:heard] her [r:sing][t:ing]." },
    ],
    usages: [
      { quand: "Témoin de toute l'action", en: "We [p:watched] the plane [r:land].", fr: "Nous avons regardé l'avion atterrir." },
      { quand: "Un moment surpris", en: "I [p:saw] him [r:talk][t:ing] to Anna.", fr: "Je l'ai vu en train de parler à Anna." },
      { quand: "Une sensation", en: "She [p:felt] something [r:touch] her arm.", fr: "Elle a senti quelque chose lui toucher le bras." },
    ],
    francais:
      "Le français dit « je l'ai vu traverser » dans les deux cas. L'anglais précise : la base pour l'action complète, {-ing} pour l'action en cours. Et jamais de {to} entre la personne et le verbe après un verbe de perception à l'actif : {I saw him leave}, pas {I saw him to leave}.",
    pieges: [
      { faux: "I saw him [x:to leave].", juste: "I [p:saw] him [r:leave].", pourquoi: "Après {see}, {hear}, {watch} + personne, le verbe est nu, sans {to}." },
      { faux: "I can smell something [x:burn].", juste: "I can smell something [r:burn][t:ing].", pourquoi: "On sent l'odeur pendant que ça brûle : action en cours, forme en {-ing}." },
    ],
    retenir: "Perception + personne + base = toute l'action ; + {-ing} = en plein milieu.",
  },

  "couteau-get": {
    regle:
      "{Get} est l'un des verbes les plus employés à l'oral, et son sens dépend de ce qui le suit. Suivi d'un nom : obtenir, recevoir, acheter, aller chercher ({get a job}, {get a letter}). Suivi d'un adjectif : devenir ({get tired}, {get dark}). Suivi d'un lieu : arriver ({get home}, {get to work}). Suivi d'un participe passé : un passif ou une action sur soi ({get married}, {get dressed}, {get lost}). Suivi de quelqu'un + {to} : convaincre, faire faire ({I got him to help me}).",
    forme: [
      { nom: "Obtenir", modele: "{get} + nom", exemple: "I [v:got] a new job." },
      { nom: "Devenir", modele: "{get} + adjectif", exemple: "It's [v:getting] dark." },
      { nom: "Arriver", modele: "{get} + lieu ({home}, {to}…)", exemple: "We [v:got] home late." },
      { nom: "Se faire, se mettre à", modele: "{get} + participe passé", exemple: "They [v:got] married in May." },
      { nom: "Faire faire", modele: "{get} + personne + {to} + base", exemple: "I [v:got] my brother [k:to] [r:help] me." },
    ],
    usages: [
      { quand: "Recevoir", en: "Did you [v:get] my message?", fr: "Tu as reçu mon message ?" },
      { quand: "Un changement d'état", en: "The film [v:got] better at the end.", fr: "Le film s'est amélioré à la fin." },
      { quand: "Un trajet", en: "How do you [v:get] to the station?", fr: "Comment va-t-on à la gare ?" },
      { quand: "Une action sur soi", en: "Hurry up and [v:get] dressed!", fr: "Dépêche-toi de t'habiller !" },
    ],
    francais:
      "Le français emploie un verbe différent pour chaque sens (obtenir, devenir, arriver, se faire), là où l'anglais parlé se contente souvent de {get}. Pour comprendre une phrase avec {get}, regarde d'abord le mot qui suit : c'est lui qui décide du sens. Beaucoup de verbes pronominaux français se traduisent par {get} + participe : se marier ({get married}), s'habiller ({get dressed}), se perdre ({get lost}).",
    pieges: [
      { faux: "We [x:married ourselves] last year.", juste: "We [v:got] married last year.", pourquoi: "« Se marier » se dit {get married}, sans pronom réfléchi." },
      { faux: "I arrived [x:to] home at midnight.", juste: "I [v:got] home at midnight.", pourquoi: "Avec {home}, pas de préposition : {get home}, {arrive home}." },
      { faux: "I'll get him [x:help] me.", juste: "I'll [v:get] him [k:to] [r:help] me.", pourquoi: "Au sens de « faire faire », {get} demande {to} devant le verbe (contrairement à {make} et {have})." },
    ],
    retenir: "Le sens de {get} dépend de ce qui suit : un nom, un adjectif, un lieu, un participe, ou une personne + {to}.",
  },
};
