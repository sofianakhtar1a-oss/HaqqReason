import type { Cours } from "../types";

/**
 * Conjugaison, paliers C1 et C2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [a:would].
 */
export const COURS: Record<string, Cours> = {
  "futur-dans-passe": {
    regle:
      "Pour parler d'un futur tel qu'on le voyait depuis un moment du passé, l'anglais recule ses outils du futur d'un cran. {was / were going to} : une intention ou un projet passé, souvent non réalisé ({I was going to call you, but I forgot}). {would} : le futur vu du passé, dans un récit ou au discours indirect ({She knew he would come}). {was about to} : être sur le point de ({We were about to leave when it started to rain}). {was to} : un destin, ce qui allait arriver, plutôt à l'écrit ({He was to become president}).",
    forme: [
      { nom: "Intention passée", modele: "{was} / {were going to} + base", exemple: "[s:I] [a:was going to] [r:tell] you." },
      { nom: "Futur dans un récit", modele: "{would} + base", exemple: "She knew [s:he] [a:would] [r:win]." },
      { nom: "Sur le point de", modele: "{was} / {were about to} + base", exemple: "[s:We] [a:were about to] [r:leave]." },
      { nom: "Le destin", modele: "{was} / {were to} + base", exemple: "[s:They] [a:were to] [r:meet] again years later." },
    ],
    usages: [
      { quand: "Un projet abandonné", en: "We [a:were going to] [r:buy] a house, but prices went up.", fr: "Nous allions acheter une maison, mais les prix ont augmenté." },
      { quand: "Une prévision passée", en: "I never thought it [a:would] [r:be] so hard.", fr: "Je n'aurais jamais cru que ce serait si difficile." },
      { quand: "Au tout dernier moment", en: "I [a:was about to] [r:call] you!", fr: "J'allais justement t'appeler !" },
      { quand: "Un destin raconté", en: "It [a:was to] [r:be] her last concert.", fr: "Ce devait être son dernier concert." },
    ],
    francais:
      "Le français a les mêmes outils : « j'allais t'appeler » (imparfait de « aller »), « je savais qu'il viendrait » (le conditionnel comme futur du passé), « j'étais sur le point de partir », « il devait devenir président ». Le parallèle est presque parfait : « j'allais » + infinitif se dit {was going to}, et le conditionnel d'un récit se dit {would}.",
    pieges: [
      { faux: "I knew she [x:will] come.", juste: "I knew [s:she] [a:would] [r:come].", pourquoi: "Vu depuis le passé ({I knew}), le futur recule : {will} devient {would}." },
      { faux: "I [x:went to] call you, but I forgot.", juste: "I [a:was going to] [r:call] you, but I forgot.", pourquoi: "« J'allais t'appeler » se dit {was going to} ; {went to} voudrait dire « je suis allé à »." },
    ],
    retenir: "Le futur vu d'hier : {was going to}, {would}, {was about to}, {was to}.",
  },

  "ce-quil-aurait-fallu": {
    regle:
      "Modal + {have} + participe passé permet de commenter le passé. {should have} : un reproche ou un regret, ce qu'il aurait fallu faire ({You should have told me}) ; {shouldn't have} : ce qu'il n'aurait pas fallu faire. {could have} : une possibilité non saisie ({You could have won}). {might have} : une possibilité, ou un reproche ({You might have warned me!}). {needn't have} : une action faite pour rien ({You needn't have brought a gift}), alors que {didn't need to} : une action pas nécessaire, en général pas faite.",
    forme: [
      { nom: "Reproche, regret", modele: "{should} / {shouldn't have} + participe", exemple: "[s:You] [a:should have] [p:called]." },
      { nom: "Occasion manquée", modele: "{could have} + participe", exemple: "[s:We] [a:could have] [p:won]." },
      { nom: "Fait pour rien", modele: "{needn't have} + participe", exemple: "[s:You] [a:needn't have] [p:cooked]." },
      { nom: "Pas nécessaire (pas fait)", modele: "{didn't need to} + base", exemple: "[s:I] [a:didn't need to] [r:wait]." },
    ],
    usages: [
      { quand: "Un regret", en: "I [a:should have] [p:listened] to my mother.", fr: "J'aurais dû écouter ma mère." },
      { quand: "Un reproche", en: "You [a:shouldn't have] [p:said] that.", fr: "Tu n'aurais pas dû dire ça." },
      { quand: "Une chance ratée", en: "She [a:could have] [p:been] a great singer.", fr: "Elle aurait pu être une grande chanteuse." },
      { quand: "Un effort pour rien", en: "We [a:needn't have] [p:hurried]: the train was late.", fr: "Ce n'était pas la peine de nous dépêcher : le train avait du retard." },
    ],
    francais:
      "« J'aurais dû » = {I should have} + participe ; « j'aurais pu » = {I could have} + participe. Le français conjugue « devoir » ou « pouvoir » au conditionnel passé ; l'anglais garde le modal tel quel et met le passé sur {have} + participe. La nuance entre {needn't have done} (« je l'ai fait, mais pour rien ») et {didn't need to do} (« inutile, et je ne l'ai pas fait ») n'a pas d'équivalent aussi net en français.",
    pieges: [
      { faux: "You [x:should told] me.", juste: "You [a:should have] [p:told] me.", pourquoi: "Pour le passé, il faut {have} + participe après le modal." },
      { faux: "Sorry, I [x:must have] come earlier.", juste: "Sorry, I [a:should have] [p:come] earlier.", pourquoi: "« J'aurais dû » (regret) se dit {should have} ; {must have} est une déduction (« j'ai dû venir »)." },
      { faux: "You [x:could have be] killed!", juste: "You [a:could have] [p:been] killed!", pourquoi: "Après {have}, le participe passé : {been}." },
    ],
    retenir: "J'aurais dû = {should have} + participe ; j'aurais pu = {could have} + participe ; pour rien = {needn't have} + participe.",
  },

  "infinitifs-composes": {
    regle:
      "L'infinitif peut lui aussi marquer le temps et la voix. {to have} + participe regarde en arrière : l'action est antérieure ({I'm glad to have met you} : je suis content de vous avoir rencontré). {to be} + {-ing} montre une action en cours ({She seems to be sleeping}). {to be} + participe est un infinitif passif ({It needs to be done}), et {to have been} + participe un passif antérieur ({He is said to have been arrested}). On les trouve après {seem}, {appear}, {claim}, {pretend}, {be said}, {be glad}…",
    forme: [
      { nom: "Antérieur", modele: "{to have} + participe", exemple: "I'm happy [a:to have] [p:helped]." },
      { nom: "En cours", modele: "{to be} + verbe en {-ing}", exemple: "He seems [a:to be] [r:work][t:ing]." },
      { nom: "Passif", modele: "{to be} + participe", exemple: "This needs [a:to be] [p:checked]." },
      { nom: "Passif antérieur", modele: "{to have been} + participe", exemple: "She claims [a:to have been] [p:robbed]." },
    ],
    usages: [
      { quand: "Une action déjà faite", en: "He claims [a:to have] [p:met] the Queen.", fr: "Il prétend avoir rencontré la reine." },
      { quand: "Une apparence en ce moment", en: "You seem [a:to be] [r:enjoy][t:ing] yourself.", fr: "Tu as l'air de bien t'amuser." },
      { quand: "Une obligation au passif", en: "The room has [a:to be] [p:cleaned].", fr: "La pièce doit être nettoyée." },
      { quand: "Un « on dit que » de journal", en: "The painting is believed [a:to have been] [p:stolen] in 1990.", fr: "On pense que le tableau a été volé en 1990." },
    ],
    francais:
      "Le français a lui aussi un infinitif passé (« avoir rencontré », « être arrivé »), et l'anglais le construit de la même façon, mais toujours avec {have} : {to have arrived} (être arrivé). La tournure de presse {He is said to have…} correspond à « on dit qu'il a… » ou au conditionnel de l'information non confirmée : « il aurait… ».",
    pieges: [
      { faux: "I'm sorry [x:to be] late yesterday.", juste: "I'm sorry [a:to have been] late yesterday.", pourquoi: "Le retard est passé : infinitif antérieur, {to have been}." },
      { faux: "He is said [x:that he stole] the money.", juste: "He is said [a:to have] [p:stolen] the money.", pourquoi: "Après {He is said}, on enchaîne sur un infinitif : {to have} + participe pour une action passée." },
    ],
    retenir: "{to have} + participe = avant ; {to be} + {-ing} = en cours ; {to be} + participe = passif.",
  },

  irreel: {
    regle:
      "Après certaines expressions, le prétérit ne parle pas du passé : il signale une situation imaginaire, souhaitée ou pas encore réalisée. {It's (high) time} + sujet + prétérit = il est grand temps que ({It's time you went to bed}). {I'd rather} + sujet + prétérit = je préférerais que ({I'd rather you didn't smoke}). {as if} / {as though} + prétérit = comme si ({He talks as if he knew everything}). {Suppose} / {Supposing} + prétérit = et si, imaginons que. Pour un passé imaginaire, on recule encore : {as if he had seen a ghost}.",
    forme: [
      { nom: "Il est temps que", modele: "{It's (high) time} + sujet + prétérit", exemple: "It's time we [p:left]." },
      { nom: "Je préférerais que", modele: "{I'd rather} + sujet + prétérit", exemple: "I'd rather you [p:stayed]." },
      { nom: "Comme si", modele: "{as if} / {as though} + prétérit (ou {had} + participe)", exemple: "She acts as if she [p:owned] the place." },
      { nom: "Imaginons que", modele: "{Suppose} / {Supposing} + prétérit", exemple: "Suppose we [p:missed] the train?" },
    ],
    usages: [
      { quand: "Un reproche", en: "It's high time you [p:found] a job.", fr: "Il serait grand temps que tu trouves un travail." },
      { quand: "Une préférence polie", en: "I'd rather you [a:didn't] [r:tell] anyone.", fr: "Je préférerais que tu ne le dises à personne." },
      { quand: "Une comparaison irréelle", en: "He looked as if he [a:had] [p:seen] a ghost.", fr: "Il avait l'air d'avoir vu un fantôme." },
      { quand: "Une hypothèse", en: "Supposing it [p:rained], what would we do?", fr: "Et s'il pleuvait, qu'est-ce qu'on ferait ?" },
    ],
    francais:
      "Le français met souvent un subjonctif après ces expressions (« il est temps que tu partes », « je préférerais que tu restes »), ou un imparfait après « comme si » et « et si ». L'anglais n'a pas de subjonctif vivant pour cela : il recule le verbe au prétérit. Quand le sujet ne change pas, on dit {I'd rather stay} (base verbale) et {It's time to go} ({to} + base).",
    pieges: [
      { faux: "It's time you [x:go] to bed.", juste: "It's time you [p:went] to bed.", pourquoi: "Après {It's time} + sujet, le verbe se met au prétérit, signe de l'irréel." },
      { faux: "I'd rather you [x:don't] smoke here.", juste: "I'd rather you [a:didn't] [r:smoke] here.", pourquoi: "Après {I'd rather} + autre sujet, le prétérit : {didn't}." },
      { faux: "I'd rather [x:to stay] home.", juste: "I'd rather [r:stay] home.", pourquoi: "Avec le même sujet, {I'd rather} est suivi de la base verbale, sans {to}." },
    ],
    retenir: "Après {It's time}, {I'd rather}, {as if}, {suppose} + sujet : le prétérit dit l'irréel.",
  },

  exigences: {
    regle:
      "Après les verbes et expressions d'exigence ou de recommandation ({insist}, {demand}, {suggest}, {recommend}, {propose}, {require}, {it is essential / vital / important that}), l'anglais soigné, surtout américain, emploie le subjonctif : la base du verbe, sans {-s} même avec {he}, {she}, {it}, et sans {do} à la négation ({not} + base). {Be} reste {be} : {I insist that he be present}. L'anglais britannique courant le remplace souvent par {should} + base.",
    forme: [
      { nom: "Exigence", modele: "{insist} / {demand} / {suggest} + {that} + sujet + base", exemple: "They insisted that she [r:leave]." },
      { nom: "Avec be", modele: "… {that} + sujet + {be}", exemple: "We require that everyone [r:be] on time." },
      { nom: "Négation", modele: "… {that} + sujet + {not} + base", exemple: "I suggest that he [k:not] [r:come]." },
      { nom: "Variante britannique", modele: "… {that} + sujet + {should} + base", exemple: "I suggest that he [a:should] [r:rest]." },
    ],
    usages: [
      { quand: "Une recommandation", en: "The doctor recommended that he [r:stop] smoking.", fr: "Le médecin lui a recommandé d'arrêter de fumer." },
      { quand: "Une règle officielle", en: "It is essential that every passenger [r:wear] a seatbelt.", fr: "Il est indispensable que chaque passager porte sa ceinture." },
      { quand: "Une exigence", en: "She insisted that her son [r:be] home by ten.", fr: "Elle a exigé que son fils soit rentré à dix heures." },
    ],
    francais:
      "Le français emploie le subjonctif après « exiger que », « il faut que », « il est essentiel que » : le réflexe est donc le même ! Mais le subjonctif anglais est presque invisible, puisqu'il ressemble à la base du verbe : on ne le repère qu'avec {he}, {she}, {it} (pas de {-s}), avec {be} et à la négation. Rappel : {suggest} et {recommend} ne se construisent jamais avec une personne + {to}.",
    pieges: [
      { faux: "I insist that he [x:comes] with us.", juste: "I insist that he [r:come] with us.", pourquoi: "Au subjonctif anglais, pas de {-s}, même avec {he}." },
      { faux: "They demanded that the meeting [x:is] postponed.", juste: "They demanded that the meeting [r:be] postponed.", pourquoi: "Après une exigence, {be} reste à la base : {be postponed}." },
      { faux: "He suggested [x:me to apply].", juste: "He suggested that I [r:apply].", pourquoi: "{suggest} + {that} + sujet + base (ou + {-ing}), jamais personne + {to}." },
    ],
    retenir: "Exigence formelle : {that} + sujet + base, sans {-s} ni {do} ({that he be}, {that she not go}).",
  },

  "etats-bougent": {
    regle:
      "Les verbes d'état ({think}, {have}, {see}, {taste}, {smell}, {be}, {look}, {feel}…) refusent normalement la forme en {-ing}. Mais beaucoup ont un second sens, qui décrit une action : ils acceptent alors {-ing}. {I think it's true} (opinion) / {I'm thinking about it} (réfléchir). {She has a car} (possession) / {She's having lunch} (prendre un repas). {This soup tastes good} (le goût) / {He's tasting the soup} (goûter). Et {He's being silly} : il fait l'idiot en ce moment, un comportement passager.",
    forme: [
      { nom: "L'état", modele: "forme simple", exemple: "I [r:think] you're right." },
      { nom: "L'action", modele: "{be} + verbe en {-ing}", exemple: "I [a:am] [r:think][t:ing] about it." },
    ],
    usages: [
      { quand: "{have} : posséder / vivre un moment", en: "We [a:are] [r:hav][t:ing] a great time.", fr: "Nous passons un très bon moment." },
      { quand: "{see} : voir / avoir rendez-vous", en: "She [a:is] [r:see][t:ing] the doctor tomorrow.", fr: "Elle voit le médecin demain." },
      { quand: "{be} : être / se comporter en ce moment", en: "You [a:are] [r:be][t:ing] very kind today.", fr: "Tu es bien gentil aujourd'hui." },
      { quand: "{smell} : avoir une odeur / renifler", en: "Why [a:are] you [r:smell][t:ing] the milk?", fr: "Pourquoi tu renifles le lait ?" },
    ],
    francais:
      "Le français ne fait pas cette différence de forme : « je pense » sert pour l'opinion comme pour la réflexion. En anglais, demande-toi si le verbe décrit une situation (un état) ou quelque chose qu'on fait activement (une action) : seule l'action se met en {-ing}. Le slogan {I'm lovin' it} est volontairement familier : à l'écrit soigné, {love} reste un verbe d'état.",
    pieges: [
      { faux: "I [x:am thinking] you are right.", juste: "I [r:think] you are right.", pourquoi: "{think} au sens d'« avoir une opinion » est un état : forme simple." },
      { faux: "She [x:is having] two brothers.", juste: "She [r:has] two brothers.", pourquoi: "{have} au sens de posséder, d'avoir dans sa famille, est un état." },
      { faux: "Be quiet, I [x:think]!", juste: "Be quiet, I [a:am] [r:think][t:ing]!", pourquoi: "Ici, {think} veut dire « réfléchir » en ce moment : c'est une action, donc {-ing}." },
    ],
    retenir: "Un même verbe : état → forme simple ; action → {be} + {-ing}.",
  },

  "futurs-officiels": {
    regle:
      "L'anglais a quelques futurs plus officiels ou plus précis. {be to} + base : un projet officiel, un programme, une instruction, très présent dans la presse ({The President is to visit China in May}). {be due to} + base : ce qui est prévu à une date ou une heure donnée ({The plane is due to land at 6}). {be bound to} + base : ce qui est certain, inévitable ({It's bound to rain}). {be on the point of} + {-ing} : être sur le point de ({She was on the point of leaving}).",
    forme: [
      { nom: "Programme officiel", modele: "{be to} + base", exemple: "[s:The minister] [a:is to] [r:resign]." },
      { nom: "Prévu pour", modele: "{be due to} + base · {be due} + moment", exemple: "[s:The train] [a:is due to] [r:arrive] at 9." },
      { nom: "Certain", modele: "{be bound to} + base", exemple: "[s:He] [a:is bound to] [r:find] out." },
      { nom: "Imminent", modele: "{be on the point of} + verbe en {-ing}", exemple: "[s:They] [a:were on the point of] [r:giv][t:ing] up." },
    ],
    usages: [
      { quand: "Une annonce officielle", en: "The Queen [a:is to] [r:open] the new hospital.", fr: "La reine doit inaugurer le nouvel hôpital." },
      { quand: "Un calendrier", en: "The report [a:is due to] [r:be] published next week.", fr: "Le rapport doit paraître la semaine prochaine." },
      { quand: "Une certitude", en: "Don't worry, you [a:are bound to] [r:pass].", fr: "Ne t'inquiète pas, tu vas forcément réussir." },
      { quand: "Au bord de", en: "I [a:was on the point of] [r:call][t:ing] the police.", fr: "J'étais sur le point d'appeler la police." },
    ],
    francais:
      "Le français a des équivalents proches : « devoir » au sens de ce qui est prévu (« le ministre doit démissionner »), « être prévu pour », « être sûr de », « être sur le point de ». La difficulté est surtout de construction : {on the point of} est suivi d'un {-ing}, comme toute préposition, alors que {be to}, {be due to} et {be bound to} prennent la base verbale.",
    pieges: [
      { faux: "She is on the point [x:to leave].", juste: "She [a:is on the point of] [r:leav][t:ing].", pourquoi: "{of} est une préposition : il est suivi d'un verbe en {-ing}." },
      { faux: "The flight is due [x:at arriving] at 6.", juste: "The flight [a:is due to] [r:arrive] at 6.", pourquoi: "{be due to} + base verbale." },
    ],
    retenir: "{be to} = programme officiel · {be due to} = prévu à heure fixe · {be bound to} = sûr · {be on the point of} + {-ing} = imminent.",
  },

  "demi-modaux": {
    regle:
      "{Need} et {dare} ont une double vie. Comme verbes ordinaires, ils prennent {-s}, {do} et {to} : {She doesn't need to come}, {He didn't dare to ask}. Comme modaux, surtout à la négation et dans les questions, ils s'emploient sans rien : {You needn't come} (= {you don't need to come}), {How dare you!} (comment oses-tu !), {I daren't tell him}. Enfin, {need} + {-ing} a un sens passif : {The car needs washing} (la voiture a besoin d'être lavée).",
    forme: [
      { nom: "Verbe ordinaire", modele: "{need to} / {don't need to} + base", exemple: "[s:She] [a:doesn't need to] [r:pay]." },
      { nom: "Modal", modele: "{needn't} + base", exemple: "[s:You] [a:needn't] [r:worry]." },
      { nom: "Sens passif", modele: "{need} + verbe en {-ing}", exemple: "The windows [v:need] [r:clean][t:ing]." },
      { nom: "Dare", modele: "{How dare} + sujet + base ! · {daren't} + base", exemple: "How [a:dare] [s:you] [r:speak] to me like that!" },
    ],
    usages: [
      { quand: "Pas la peine", en: "You [a:needn't] [r:bring] anything.", fr: "Tu n'as pas besoin d'apporter quoi que ce soit." },
      { quand: "Une indignation", en: "How [a:dare] [s:she] [r:read] my letters!", fr: "Comment ose-t-elle lire mes lettres !" },
      { quand: "Une réparation à faire", en: "My hair [v:needs] [r:cutt][t:ing].", fr: "J'ai besoin d'une coupe de cheveux." },
      { quand: "Ne pas oser", en: "I [a:didn't dare] (to) [r:say] anything.", fr: "Je n'ai pas osé dire quoi que ce soit." },
    ],
    francais:
      "{needn't} correspond à « ce n'est pas la peine de », « tu n'es pas obligé de » : ne le confonds surtout pas avec {mustn't} (c'est interdit). {How dare you!} est une exclamation figée d'indignation, très forte. Et la tournure {It needs doing} n'a pas d'équivalent direct : le français dit « il faut le faire » ou « ça a besoin d'être fait ».",
    pieges: [
      { faux: "You [x:needn't to] come.", juste: "You [a:needn't] [r:come].", pourquoi: "Le modal {needn't} est suivi de la base, sans {to}. Sinon : {You don't need to come}." },
      { faux: "The grass needs [x:to cut].", juste: "The grass [v:needs] [r:cutt][t:ing].", pourquoi: "L'herbe ne coupe rien : sens passif, {need} + {-ing} (ou {needs to be cut})." },
      { faux: "How [x:do you dare]!", juste: "How [a:dare] [s:you]!", pourquoi: "L'exclamation figée se dit sans {do} : {How dare you!}" },
    ],
    retenir: "{needn't} + base = pas la peine ; {need} + {-ing} = a besoin d'être… ; {How dare you!}",
  },

  "present-raconte": {
    regle:
      "Le présent simple peut raconter le passé ou annoncer l'avenir. Dans une histoire orale, une blague ou le résumé d'un film, il rend l'action vivante ({So this man walks into a bar…}). Les titres de presse ont leurs propres codes : le présent simple pour un événement récent ({Storm hits coast}), {to} + base pour un futur ({PM to visit Japan}), et le participe passé seul pour un passif ({Man arrested}). Les commentaires sportifs et les démonstrations emploient aussi le présent pour ce qui se passe sous nos yeux.",
    forme: [
      { nom: "Récit oral, résumé", modele: "présent simple (et présent continu pour le décor)", exemple: "So I'm walking home, and this guy [r:stop][t:s] me…" },
      { nom: "Titre : fait récent", modele: "présent simple", exemple: "Storm [r:hit][t:s] coast" },
      { nom: "Titre : futur", modele: "{to} + base", exemple: "President [k:to] [r:visit] Paris" },
      { nom: "Titre : passif", modele: "participe passé seul", exemple: "Two men [p:arrested]" },
    ],
    usages: [
      { quand: "Une blague", en: "A man [r:go][t:es] to the doctor and [r:say][t:s]…", fr: "Un homme va chez le médecin et dit…" },
      { quand: "Le résumé d'un film", en: "In the film, a young girl [r:discover][t:s] a secret.", fr: "Dans le film, une jeune fille découvre un secret." },
      { quand: "Un commentaire en direct", en: "He [r:pass][t:es] the ball… and he [r:score][t:s]!", fr: "Il passe le ballon… et il marque !" },
      { quand: "Un titre de journal", en: "Prime Minister [k:to] [r:resign]", fr: "Le Premier ministre va démissionner" },
    ],
    francais:
      "Le français connaît bien le présent de narration (« hier, je marche dans la rue, et là… ») et le présent des titres (« La tempête frappe la côte »). L'anglais va plus loin dans ses titres : il supprime les articles et le verbe {be} ({Man arrested} = un homme a été arrêté) et exprime le futur avec {to} + base. Ce style télégraphique est réservé aux titres, jamais à une phrase ordinaire.",
    pieges: [
      { faux: "Headline: [x:The President will visit] Japan", juste: "Headline: President [k:to] [r:visit] Japan", pourquoi: "Dans un titre, le futur s'écrit {to} + base, sans article." },
      { faux: "Headline: Man [x:was arrested] after chase", juste: "Headline: Man [p:arrested] after chase", pourquoi: "Dans un titre, le passif perd {be} : le participe suffit." },
    ],
    retenir: "Raconter au présent rend vivant. Titres : présent = fait récent, {to} + base = futur, participe = passif.",
  },

  "passe-adoucit": {
    regle:
      "Reculer un verbe dans le passé sert aussi à prendre de la distance, et donc à être plus poli : la demande paraît moins directe, plus facile à refuser. {I was wondering if you could help me} est plus délicat que {Can you help me?} On emploie ainsi {I was wondering}, {I was hoping}, {I wanted to ask}, {Did you want…?}, et le conditionnel : {I would suggest}, {I'd like to}, {Would you mind…?} Les formes continues ({I was wondering}) adoucissent encore davantage.",
    forme: [
      { nom: "Une demande délicate", modele: "{I was wondering if} + sujet + {could} + base", exemple: "I [a:was] [r:wonder][t:ing] if you [a:could] [r:help] me." },
      { nom: "Un espoir poli", modele: "{I was hoping} + {(that)} ou {to}…", exemple: "We [a:were] [r:hop][t:ing] to see you." },
      { nom: "Une offre", modele: "{Did you want} + nom ou {to} + base ?", exemple: "[a:Did] you [r:want] some tea?" },
      { nom: "Une suggestion", modele: "{I would suggest} + {-ing} ou {that}…", exemple: "I [a:would] [r:suggest] waiting." },
    ],
    usages: [
      { quand: "Au travail", en: "I [a:was] [r:wonder][t:ing] if we [a:could] [r:move] the meeting.", fr: "Je me demandais si nous pourrions déplacer la réunion." },
      { quand: "Au restaurant", en: "[a:Did] you [r:want] a dessert?", fr: "Vous désiriez un dessert ?" },
      { quand: "Une critique adoucie", en: "I [a:would] [r:say] it's a bit long.", fr: "Je dirais que c'est un peu long." },
    ],
    francais:
      "Le français fait exactement la même chose avec l'imparfait et le conditionnel de politesse : « je voulais vous demander », « je me demandais si… », « vous désiriez ? ». Ce n'est donc pas du passé : c'est une manière douce de parler au présent. En anglais, ces formules sont presque indispensables dans un e-mail professionnel ou face à un inconnu.",
    pieges: [
      { faux: "[x:I want that you] help me.", juste: "I [a:was] [r:wonder][t:ing] if you [a:could] [r:help] me.", pourquoi: "{I want that you…} est à la fois une faute de construction et une demande trop brutale : la formule reculée passe beaucoup mieux." },
      { faux: "I was wondering if you [x:can] send me the file.", juste: "I was wondering if you [a:could] [r:send] me the file.", pourquoi: "Dans la formule de politesse, on garde la distance jusqu'au bout : {could}." },
    ],
    retenir: "Pour adoucir : {I was wondering if…}, {I was hoping…}, {Did you want…?}, {I would suggest…}",
  },

  "si-sans-si": {
    regle:
      "Dans un style soutenu ou écrit, on peut supprimer {if} et faire passer l'auxiliaire devant le sujet. {Had} + sujet + participe remplace {If} + sujet + {had} + participe : {Had I known, I would have come} (si j'avais su). {Were} + sujet (+ {to} + base) remplace une condition imaginaire : {Were she here, she would agree} ; {Were he to resign…} (s'il venait à démissionner). {Should} + sujet + base exprime une condition peu probable : {Should you need help, call me} (si jamais vous aviez besoin d'aide).",
    forme: [
      { nom: "Passé irréel", modele: "{Had} + sujet + participe, {would have}…", exemple: "[a:Had] [s:I] [p:known], I would have come." },
      { nom: "Présent irréel", modele: "{Were} + sujet…, {would}…", exemple: "[a:Were] [s:I] you, I'd accept." },
      { nom: "Hypothèse lointaine", modele: "{Were} + sujet + {to} + base, {would}…", exemple: "[a:Were] [s:he] [k:to] [r:refuse], we would be lost." },
      { nom: "Si jamais", modele: "{Should} + sujet + base, impératif ou {will}…", exemple: "[a:Should] [s:you] [r:need] anything, call me." },
    ],
    usages: [
      { quand: "Un regret littéraire", en: "[a:Had] [s:we] [p:left] earlier, we would have caught the train.", fr: "Si nous étions partis plus tôt, nous aurions eu le train." },
      { quand: "Une lettre formelle", en: "[a:Should] [s:you] [r:have] any questions, please contact us.", fr: "Si vous avez des questions, n'hésitez pas à nous contacter." },
      { quand: "Une hypothèse", en: "[a:Were] [s:prices] [k:to] [r:rise], sales would fall.", fr: "Si les prix venaient à augmenter, les ventes baisseraient." },
    ],
    francais:
      "Le français a une tournure voisine, très littéraire (« Eussé-je su… », « Serait-il là qu'il serait d'accord »), et plus couramment « si jamais vous aviez besoin de… ». En anglais, l'inversion est très fréquente dans les courriers formels ({Should you require further information…}). Seuls {had}, {were} et {should} se prêtent à ce jeu : on ne dit pas {Did I know…}.",
    pieges: [
      { faux: "[x:If had I known], I would have stayed.", juste: "[a:Had] [s:I] [p:known], I would have stayed.", pourquoi: "Avec l'inversion, {if} disparaît complètement." },
      { faux: "[x:Hadn't I known], I would have left.", juste: "[a:Had] [s:I] not [p:known], I would have left.", pourquoi: "À la négation, {not} se place après le sujet : {Had I not known}, jamais {Hadn't I known}." },
      { faux: "[x:Would you need] help, call me.", juste: "[a:Should] [s:you] [r:need] help, call me.", pourquoi: "« Si jamais » se dit avec {Should} en tête, pas avec {Would}." },
    ],
    retenir: "Sans {if} : {Had I known…}, {Were I you…}, {Should you need…} ; à la négation : {Had I not…}",
  },

  "formules-figees": {
    regle:
      "Quelques expressions anglaises ont gardé un très vieux subjonctif : la base du verbe, même avec un sujet à la troisième personne. On les emploie telles quelles, sans les conjuguer ni les modifier : {Long live the King!} (vive le roi !), {God save the King}, {Be that as it may} (quoi qu'il en soit), {Come what may} (quoi qu'il arrive), {So be it} (ainsi soit-il, soit), {If need be} (si besoin), {Suffice it to say} (il suffit de dire que), {Heaven forbid} (Dieu nous en préserve).",
    forme: [
      { nom: "Un vœu", modele: "{Long live} + nom ! · {God save} + nom", exemple: "Long [r:live] the King!" },
      { nom: "Une concession", modele: "{Be that as it may},…", exemple: "[r:Be] that as it may, we must decide." },
      { nom: "Une détermination", modele: "{Come what may},…", exemple: "[r:Come] what may, I'll be there." },
      { nom: "Une condition", modele: "…, {if need be}", exemple: "We'll work all night, if need [r:be]." },
    ],
    usages: [
      { quand: "Clore un débat", en: "[r:Be] that as it may, the decision is final.", fr: "Quoi qu'il en soit, la décision est définitive." },
      { quand: "Une promesse solennelle", en: "[r:Come] what may, we stay together.", fr: "Quoi qu'il arrive, nous restons ensemble." },
      { quand: "Accepter", en: "You want to leave? So [r:be] it.", fr: "Tu veux partir ? Soit." },
      { quand: "Résumer", en: "Suffice it to [r:say] that he was furious.", fr: "Disons simplement qu'il était furieux." },
    ],
    francais:
      "Le français a exactement les mêmes fossiles : « Vive le roi ! », « Ainsi soit-il », « Advienne que pourra », « Soit ! », « Dieu nous en garde ». Ce sont des subjonctifs figés, eux aussi. Le réflexe est simple : ces formules ne se conjuguent pas, ne prennent jamais de {-s} et ne se mettent pas au passé.",
    pieges: [
      { faux: "Long [x:lives] the King!", juste: "Long [r:live] the King!", pourquoi: "C'est un subjonctif figé : la base du verbe, sans {-s}." },
      { faux: "[x:Be it as it may], we must go.", juste: "[r:Be] that as it may, we must go.", pourquoi: "La formule est figée mot pour mot : {Be that as it may}." },
    ],
    retenir: "Ces formules sont des statues : on les apprend par cœur, et on n'y touche pas.",
  },

  "will-insistant": {
    regle:
      "{Will} ne parle pas toujours du futur. Il peut décrire un caractère, un comportement typique ou une manie ({Boys will be boys}, {He'll sit there for hours doing nothing}), ce qu'un objet peut faire ou refuse de faire ({This car will do 200 km/h}, {The door won't open}), ou une supposition sur le présent ({That'll be the postman} : ça doit être le facteur). Accentué à l'oral, {will} dit l'agacement face à une manie : {She WILL leave the door open!} Au passé, {would} raconte une habitude, et, accentué, une manie agaçante ({He WOULD say that!}).",
    forme: [
      { nom: "Une manie, un caractère", modele: "sujet + {will} + base", exemple: "[s:She][a:'ll] [r:talk] for hours." },
      { nom: "Une supposition", modele: "{That'll be} + nom · {will} + base", exemple: "That[a:'ll] [r:be] Tom at the door." },
      { nom: "Un objet qui refuse", modele: "chose + {won't} + base", exemple: "The door [a:won't] [r:open]." },
      { nom: "Une habitude passée", modele: "{would} + base", exemple: "He [a:would] [r:read] every evening." },
    ],
    usages: [
      { quand: "Un trait de caractère", en: "Cats [a:will] [r:sleep] anywhere.", fr: "Les chats dorment n'importe où (c'est leur nature)." },
      { quand: "Une supposition", en: "You[a:'ll] [r:be] tired after your trip.", fr: "Tu dois être fatigué après ton voyage." },
      { quand: "Un objet récalcitrant", en: "The car [a:won't] [r:start].", fr: "La voiture refuse de démarrer." },
      { quand: "Un agacement", en: "He [a:will] keep [r:interrupt][t:ing] me!", fr: "Il n'arrête pas de m'interrompre !" },
    ],
    francais:
      "Le français emploie parfois le futur de la même façon (« ce sera le facteur », « vous aurez reconnu… »), mais l'anglais va plus loin : {won't} pour un objet qui « refuse » ({The window won't close}), ou {will} accentué pour une manie agaçante. Devant un {will}, demande-toi s'il s'agit vraiment du futur, ou plutôt d'une habitude, d'un caractère ou d'une supposition.",
    pieges: [
      { faux: "The door [x:doesn't want to] open.", juste: "The door [a:won't] [r:open].", pourquoi: "Pour un objet qui « refuse » de fonctionner, l'anglais dit {won't}, pas {doesn't want to}." },
      { faux: "Someone's at the door. — [x:It's maybe] the postman.", juste: "Someone's at the door. — That[a:'ll] [r:be] the postman.", pourquoi: "Pour une supposition presque sûre sur le présent, l'anglais aime {That'll be…} (et « c'est peut-être » se dit {Maybe it's…})." },
    ],
    retenir: "{will} peut dire le caractère, la manie, la supposition ; {won't} = refuser de ; {would} = habitude passée.",
  },

  "nuances-modales": {
    regle:
      "Associés à de petits mots, les modaux règlent la nuance avec précision. {may well} / {might well} + base = c'est tout à fait possible, assez probable ({She may well be right}). {might as well} / {may as well} + base = autant faire ceci, faute de mieux ({We might as well go home}). {could hardly} + base = pouvoir à peine, presque pas ({I could hardly breathe}). {can't help} + {-ing} = ne pas pouvoir s'empêcher de ({I can't help laughing}). {cannot but} + base, très soutenu = ne pouvoir que ({One cannot but admire her}).",
    forme: [
      { nom: "Fort possible", modele: "{may well} / {might well} + base", exemple: "It [a:may well] [r:rain]." },
      { nom: "Autant faire", modele: "{might as well} + base", exemple: "We [a:might as well] [r:wait]." },
      { nom: "À peine", modele: "{could hardly} + base", exemple: "I [a:could hardly] [r:hear] him." },
      { nom: "Ne pas pouvoir s'empêcher", modele: "{can't help} + verbe en {-ing}", exemple: "I [a:can't help] [r:smil][t:ing]." },
      { nom: "Ne pouvoir que", modele: "{cannot but} + base (soutenu)", exemple: "We [a:cannot but] [r:agree]." },
    ],
    usages: [
      { quand: "Une probabilité forte", en: "He [a:might well] [r:change] his mind.", fr: "Il se pourrait bien qu'il change d'avis." },
      { quand: "Faute de mieux", en: "The bus has gone. We [a:may as well] [r:walk].", fr: "Le bus est parti. Autant y aller à pied." },
      { quand: "Presque impossible", en: "She [a:could hardly] [r:believe] it.", fr: "Elle avait du mal à y croire." },
      { quand: "Une réaction irrépressible", en: "I [a:can't help] [r:think][t:ing] about her.", fr: "Je ne peux pas m'empêcher de penser à elle." },
    ],
    francais:
      "Chaque tournure a son équivalent français : « il se peut bien que », « autant… », « à peine », « ne pas pouvoir s'empêcher de », « ne pouvoir que ». Les pièges sont de construction : {hardly} contient déjà une négation (on ne dit pas {couldn't hardly}), et {can't help} est suivi d'un {-ing}, pas d'un infinitif.",
    pieges: [
      { faux: "I [x:couldn't hardly] see.", juste: "I [a:could hardly] [r:see].", pourquoi: "{hardly} est déjà négatif (« à peine ») : pas de {not} en plus." },
      { faux: "I can't help [x:to laugh].", juste: "I [a:can't help] [r:laugh][t:ing].", pourquoi: "{can't help} (« ne pas pouvoir s'empêcher ») est suivi de {-ing}." },
      { faux: "It's late. We [x:may well] go home.", juste: "It's late. We [a:might as well] [r:go] home.", pourquoi: "« Autant rentrer » (faute de mieux) se dit {might as well} ; {may well} veut dire « il est bien possible que »." },
    ],
    retenir: "{may well} = fort possible · {might as well} = autant · {could hardly} = à peine · {can't help} + {-ing} = ne pas pouvoir s'empêcher.",
  },
};
