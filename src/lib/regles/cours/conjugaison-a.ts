import type { Cours } from "../types";

/**
 * Conjugaison, paliers A1 et A2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [a:does].
 */
export const COURS: Record<string, Cours> = {
  "verbe-voyageur": {
    regle:
      "Le verbe est le mot qui dit ce qu'on fait ({work}, {eat}, {sleep}) ou ce qu'on est ({be}). Pour le trouver à coup sûr, change le moment de la phrase en ajoutant {yesterday} (hier) ou {tomorrow} (demain) : le seul mot qui doit changer de forme, c'est le verbe. {I play} devient {I played}, puis {I will play}, alors que les autres mots ne bougent pas. Dans une phrase anglaise simple, il y a un seul verbe conjugué, placé juste après le sujet.",
    forme: [{ nom: "L'ordre habituel", modele: "sujet + verbe + complément", exemple: "[s:Tom] [v:plays] football." }],
    usages: [
      { quand: "Une action", en: "We [v:watch] a film.", fr: "Nous regardons un film." },
      { quand: "Un état ({be}, {have}, {like}…)", en: "She [v:is] tired.", fr: "Elle est fatiguée." },
      { quand: "Le test du temps : on passe à hier", en: "Yesterday, we [v:watched] a film.", fr: "Hier, nous avons regardé un film." },
    ],
    francais:
      "En français, le verbe change à presque chaque personne (je mange, nous mangeons, vous mangez) et à chaque temps. En anglais, il change beaucoup moins avec les personnes : {I eat}, {you eat}, {we eat}, {they eat}. Ce qui le fait bouger, c'est surtout le temps. Repérer le verbe est donc la première chose à faire avant de conjuguer : c'est lui qui voyage dans le temps.",
    pieges: [
      { faux: "Yesterday I [x:play] tennis.", juste: "Yesterday I [r:play][t:ed] tennis.", pourquoi: "Avec {yesterday}, le verbe doit passer au passé : c'est justement le mot qui change." },
      { faux: "I [x:am agree] with you.", juste: "I [v:agree] with you.", pourquoi: "{agree} est déjà un verbe (être d'accord) : on n'ajoute pas {am}. Une phrase simple n'a qu'un verbe conjugué." },
    ],
    retenir: "Pour trouver le verbe, change le jour de la phrase : le mot qui bouge, c'est lui.",
  },

  "six-passagers": {
    regle:
      "Les pronoms sujets remplacent celui qui fait l'action. Il y en a sept : {I} (je), {you} (tu ou vous), {he} (il, pour un homme ou un garçon), {she} (elle, pour une femme ou une fille), {it} (pour une chose, un animal, une idée), {we} (nous) et {they} (ils ou elles). {I} s'écrit toujours avec une majuscule, même au milieu d'une phrase. Et {you} sert pour une personne comme pour plusieurs, qu'on la tutoie ou qu'on la vouvoie.",
    forme: [
      { nom: "Une personne", modele: "{I} · {you} · {he} / {she} / {it}", exemple: "[s:She] is my sister." },
      { nom: "Plusieurs", modele: "{we} · {you} · {they}", exemple: "[s:They] are my friends." },
    ],
    usages: [
      { quand: "Un homme, un garçon → {he}", en: "My dad? [s:He] is a teacher.", fr: "Mon père ? Il est professeur." },
      { quand: "Une chose, un animal → {it}", en: "The table is old. [s:It] is from 1920.", fr: "La table est vieille. Elle date de 1920." },
      { quand: "Plusieurs personnes ou choses → {they}", en: "The keys? [s:They] are on the table.", fr: "Les clés ? Elles sont sur la table." },
    ],
    francais:
      "En français, une chose est « il » ou « elle » selon son genre : la table devient « elle ». En anglais, les choses n'ont pas de genre : une table, un livre, une idée deviennent tous {it}. Seules les personnes (et souvent les animaux de compagnie) sont {he} ou {she}. Au pluriel, plus aucun choix à faire : « ils » et « elles » donnent tous les deux {they}.",
    pieges: [
      { faux: "The car is new. [x:She] is red.", juste: "The car is new. [s:It] is red.", pourquoi: "« La voiture » est féminin en français, mais en anglais une chose est toujours {it}." },
      { faux: "My brother and [x:i] are here.", juste: "My brother and [s:I] are here.", pourquoi: "{I} prend toujours une majuscule, où qu'il soit dans la phrase." },
    ],
    retenir: "Une personne : {he} ou {she}. Tout le reste au singulier : {it}. Plusieurs : {they}.",
  },

  "roi-be": {
    regle:
      "{Be} veut dire « être ». C'est le verbe le plus irrégulier de l'anglais : au présent, il a trois formes. {am} va seulement avec {I} ; {is} va avec une seule personne ou chose ({he}, {she}, {it}, {my mum}, {the dog}) ; {are} va avec tous les autres ({you}, {we}, {they} et tous les pluriels). À l'oral, on le contracte presque toujours : {I'm}, {she's}, {we're}.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {am} / {is} / {are}", exemple: "[s:I] [a:am] ready." },
      { nom: "Négation", modele: "sujet + {am} / {is} / {are} + {not}", exemple: "[s:He] [a:isn't] here." },
      { nom: "Question", modele: "{Am} / {Is} / {Are} + sujet… ?", exemple: "[a:Are] [s:you] OK?" },
    ],
    usages: [
      { quand: "Dire qui l'on est, ce qu'on fait", en: "[s:I] [a:am] a student.", fr: "Je suis étudiant." },
      { quand: "Décrire", en: "[s:The house] [a:is] big.", fr: "La maison est grande." },
      { quand: "Dire où l'on est", en: "[s:We] [a:are] at home.", fr: "Nous sommes à la maison." },
    ],
    francais:
      "Le français a six formes pour « être » au présent (suis, es, est, sommes, êtes, sont) ; l'anglais n'en a que trois. Bonne nouvelle : avec {be}, pas besoin du majordome {do} pour la question ou la négation. On inverse simplement le sujet et le verbe, exactement comme dans « Êtes-vous prêt ? » : {You are} devient {Are you…?}",
    pieges: [
      { faux: "[x:I is] happy.", juste: "[s:I] [a:am] happy.", pourquoi: "{I} a sa forme à lui : {am}, et seulement {am}." },
      { faux: "[x:Do you be] tired?", juste: "[a:Are] [s:you] tired?", pourquoi: "{Be} pose ses questions tout seul, sans {do} : on met simplement {are} devant le sujet." },
      { faux: "My parents [x:is] French.", juste: "My parents [a:are] French.", pourquoi: "Plusieurs personnes, c'est {are}, même quand le sujet n'est pas un pronom." },
    ],
    retenir: "{I am}, {he / she / it is}, et pour tous les autres : {are}.",
  },

  "avoir-faim": {
    regle:
      "Pour la faim, la soif, le froid, le chaud, la peur, l'âge, ou pour dire qu'on a raison ou tort, l'anglais n'emploie pas {have} mais {be}, suivi d'un adjectif : {I am hungry} (j'ai faim, littéralement « je suis affamé »). Le français dit qu'on possède la faim ; l'anglais dit qu'on est dans cet état. Pour l'âge, on met le nombre juste après {be} : {She is twenty}, ou {twenty years old}, mais jamais {years} tout seul.",
    forme: [
      { nom: "Un état", modele: "sujet + {be} + adjectif", exemple: "[s:I] [a:am] hungry." },
      { nom: "L'âge", modele: "sujet + {be} + nombre (+ {years old})", exemple: "[s:He] [a:is] ten (years old)." },
      { nom: "Demander l'âge", modele: "{How old} + {be} + sujet ?", exemple: "How old [a:are] [s:you]?" },
    ],
    usages: [
      { quand: "La faim, la soif", en: "[s:We] [a:are] thirsty.", fr: "Nous avons soif." },
      { quand: "Le froid, le chaud", en: "[s:I] [a:am] cold.", fr: "J'ai froid." },
      { quand: "Avoir raison, avoir tort", en: "[s:You] [a:are] right.", fr: "Tu as raison." },
      { quand: "Avoir peur", en: "[s:She] [a:is] afraid of dogs.", fr: "Elle a peur des chiens." },
    ],
    francais:
      "C'est l'un des pièges les plus fréquents pour un francophone : traduire mot à mot « j'ai faim » par {I have hunger}. En anglais, ces sensations ne se possèdent pas, elles se vivent : on les décrit avec {be} et un adjectif ({hungry}, {thirsty}, {cold}, {hot}, {afraid}, {right}, {wrong}). Pour l'âge, c'est la même logique : on n'« a » pas 20 ans, on « est » 20 ans.",
    pieges: [
      { faux: "I [x:have] 15 years.", juste: "I [a:am] 15 (years old).", pourquoi: "L'âge se dit avec {be}. Et si l'on dit {years}, il faut {old} derrière : {15 years old}." },
      { faux: "She [x:has] cold.", juste: "She [a:is] cold.", pourquoi: "Avoir froid, c'est être gelé : {be cold}. ({She has a cold} veut dire « elle a un rhume » !)" },
      { faux: "You [x:have] right.", juste: "You [a:are] right.", pourquoi: "Avoir raison = {be right} ; avoir tort = {be wrong}." },
    ],
    retenir: "Faim, soif, froid, chaud, peur, raison, tort et âge : en anglais, on les « est », avec {be}.",
  },

  "have-got": {
    regle:
      "Pour dire ce qu'on possède (un objet, de la famille, un trait physique, une maladie), l'anglais a deux façons qui veulent dire la même chose : {have} (qui devient {has} avec {he}, {she}, {it}) et {have got} ({has got}). {Have got} est très courant à l'oral britannique ; {have} seul passe partout, et c'est le seul possible au passé ({had}). Les deux ne se construisent pas pareil : {have} appelle le majordome {do} pour la négation et la question, {have got} s'en passe.",
    forme: [
      { nom: "Avec have", modele: "sujet + {have} / {has}", exemple: "[s:She] [a:has] a cat." },
      { nom: "Négation (have)", modele: "sujet + {don't} / {doesn't} + {have}", exemple: "[s:She] [a:doesn't have] a cat." },
      { nom: "Avec have got", modele: "sujet + {have} / {has} + {got}", exemple: "[s:She] [a:has got] a cat." },
      { nom: "Négation (have got)", modele: "sujet + {haven't} / {hasn't} + {got}", exemple: "[s:She] [a:hasn't got] a cat." },
      { nom: "Question", modele: "{Do you have…?} ou {Have you got…?}", exemple: "[a:Have] [s:you] got a pen?" },
    ],
    usages: [
      { quand: "Un objet", en: "I [a:have] a new phone.", fr: "J'ai un nouveau téléphone." },
      { quand: "La famille", en: "[s:He] [a:has got] two sisters.", fr: "Il a deux sœurs." },
      { quand: "Une description", en: "[s:She] [a:has] long hair.", fr: "Elle a les cheveux longs." },
    ],
    francais:
      "« Avoir » se traduit par {have}, mais le français n'a rien qui ressemble à {have got}. Retiens simplement que c'est le même sens : {I have a bike} = {I've got a bike}. Attention aux cheveux : {hair} est un nom qu'on ne compte pas, on dit donc {long hair}, sans {s}. Et beaucoup d'expressions françaises avec « avoir » ne prennent pas {have} : avoir faim, avoir 20 ans… (voir la leçon sur le roi Be).",
    pieges: [
      { faux: "He [x:have] a dog.", juste: "He [a:has] a dog.", pourquoi: "Avec {he}, {she}, {it}, {have} devient {has}." },
      { faux: "I [x:haven't] a car.", juste: "I [a:don't have] a car.", pourquoi: "Sans {got}, {have} a besoin de {do} pour la négation : {don't have}. Ou alors : {I haven't got a car}." },
      { faux: "[x:Has she] a brother?", juste: "[a:Does] [s:she] have a brother?", pourquoi: "La question se fait avec {does}… ou avec {got} : {Has she got a brother?}" },
    ],
    retenir: "{have} prend {do} pour nier et questionner ; {have got} se débrouille seul.",
  },

  "s-qui-siffle": {
    regle:
      "Au présent simple, le verbe garde sa forme de base ({work}, {play}) avec {I}, {you}, {we}, {they}. Avec {he}, {she}, {it}, ou un nom au singulier comme {my sister}, on ajoute un {-s} : {she works}. Quelques règles d'orthographe : après {-s}, {-sh}, {-ch}, {-x} et {-o}, on ajoute {-es} ({watches}, {goes}) ; une consonne suivie de {y} donne {-ies} ({study} → {studies}) ; et {have} devient {has}.",
    forme: [
      { nom: "I, you, we, they", modele: "sujet + base du verbe", exemple: "[s:They] [r:play] tennis." },
      { nom: "He, she, it", modele: "sujet + base + {-s}", exemple: "[s:He] [r:play][t:s] tennis." },
      { nom: "Orthographe", modele: "{-es} après s, sh, ch, x, o · consonne + {y} → {-ies}", exemple: "[s:She] [r:watch][t:es] TV and [r:stud][t:ies]." },
    ],
    usages: [
      { quand: "Une habitude", en: "[s:My dad] [r:cook][t:s] on Sundays.", fr: "Mon père cuisine le dimanche." },
      { quand: "Un fait, une vérité", en: "[s:Water] [r:boil][t:s] at 100 degrees.", fr: "L'eau bout à 100 degrés." },
      { quand: "Un goût, un état", en: "[s:She] [r:like][t:s] chocolate.", fr: "Elle aime le chocolat." },
    ],
    francais:
      "Le français change la fin du verbe à presque toutes les personnes (je parle, nous parlons, vous parlez). L'anglais ne garde qu'une seule terminaison au présent : le {-s} de la troisième personne du singulier. C'est donc la seule chose à ne jamais oublier… et c'est l'erreur numéro un des francophones, à l'écrit comme à l'oral.",
    pieges: [
      { faux: "She [x:work] in a bank.", juste: "She [r:work][t:s] in a bank.", pourquoi: "{She}, c'est la troisième personne du singulier : le {-s} est obligatoire." },
      { faux: "They [x:works] hard.", juste: "They [r:work] hard.", pourquoi: "Le {-s} n'est que pour {he}, {she}, {it}. Au pluriel, le verbe reste nu." },
      { faux: "He [x:gos] to school.", juste: "He [r:go][t:es] to school.", pourquoi: "Après un {o}, on écrit {-es} : {goes}, {does}." },
    ],
    retenir: "{He}, {she}, {it} : le verbe siffle avec un {-s}. Tous les autres : verbe nu.",
  },

  "majordome-do": {
    regle:
      "Au présent simple, un verbe ordinaire ne sait ni se nier ni se mettre en question tout seul. Il appelle un assistant : {do}, ou {does} avec {he}, {she}, {it}. Pour la négation, on place {don't} ou {doesn't} devant le verbe ; pour la question, on met {Do} ou {Does} devant le sujet. C'est alors {does} qui porte le {-s} : le verbe principal revient à sa base.",
    forme: [
      { nom: "Négation", modele: "sujet + {don't} / {doesn't} + base", exemple: "[s:She] [a:doesn't] [r:like] fish." },
      { nom: "Question", modele: "{Do} / {Does} + sujet + base ?", exemple: "[a:Does] [s:he] [r:live] here?" },
      { nom: "Avec un mot interrogatif", modele: "{Where} / {What}… + {do} / {does} + sujet + base ?", exemple: "Where [a:do] [s:you] [r:work]?" },
    ],
    usages: [
      { quand: "Dire ce qu'on ne fait pas", en: "I [a:don't] [r:eat] meat.", fr: "Je ne mange pas de viande." },
      { quand: "Poser une question fermée", en: "[a:Do] [s:you] [r:speak] English?", fr: "Tu parles anglais ?" },
      { quand: "Demander une information", en: "What time [a:does] [s:the shop] [r:open]?", fr: "À quelle heure ouvre le magasin ?" },
    ],
    francais:
      "En français, il suffit d'encadrer le verbe (ne… pas), d'inverser le sujet (parles-tu ?) ou simplement de monter la voix (tu parles anglais ?). L'anglais exige {do} : on ne dit pas {I not like}, et {You speak English?} ne passe qu'à l'oral, pour marquer la surprise. Ici, {do} n'a pas de sens à lui (il ne veut pas dire « faire ») : c'est un outil de construction.",
    pieges: [
      { faux: "He [x:doesn't likes] tea.", juste: "He [a:doesn't] [r:like] tea.", pourquoi: "Le {-s} est déjà dans {does} : le verbe reste à la base. Jamais deux {-s}." },
      { faux: "I [x:not like] tea.", juste: "I [a:don't] [r:like] tea.", pourquoi: "{not} ne se place jamais seul devant un verbe ordinaire : il lui faut {do}." },
      { faux: "[x:Speak you] English?", juste: "[a:Do] [s:you] [r:speak] English?", pourquoi: "On n'inverse pas un verbe ordinaire avec son sujet : c'est {do} qui passe devant." },
    ],
    retenir: "Pour dire non ou poser une question au présent : {do} / {does}, puis le verbe à la base.",
  },

  "reponses-courtes": {
    regle:
      "Aux questions fermées (celles qui attendent oui ou non), les anglophones répondent rarement par {yes} ou {no} tout seuls, ce qui peut paraître sec. Ils reprennent le sujet et le « moteur » de la question, c'est-à-dire l'auxiliaire ({do}, {does}, {is}, {are}, {can}, {have}…), sans répéter le verbe principal : {Do you like tea? — Yes, I do.} À la négation, ce moteur prend {n't} : {No, I don't.}",
    forme: [
      { nom: "Oui", modele: "{Yes,} + pronom + auxiliaire", exemple: "Yes, [s:she] [a:does]." },
      { nom: "Non", modele: "{No,} + pronom + auxiliaire + {n't}", exemple: "No, [s:they] [a:aren't]." },
    ],
    usages: [
      { quand: "Question avec {do}", en: "Do you play chess? — Yes, [s:I] [a:do].", fr: "Tu joues aux échecs ? — Oui." },
      { quand: "Question avec {be}", en: "Is he French? — No, [s:he] [a:isn't].", fr: "Il est français ? — Non." },
      { quand: "Question avec {can}", en: "Can you swim? — Yes, [s:I] [a:can].", fr: "Tu sais nager ? — Oui." },
    ],
    francais:
      "En français, on répond « oui », « non » ou « si ». L'anglais répond par un écho de la question : l'auxiliaire montre qu'on a bien suivi. Deux détails : dans la réponse courte affirmative, on ne contracte jamais ({Yes, I am}, pas {Yes, I'm}) ; et le pronom remplace le nom de la question : {Is your mum here? — Yes, she is.}",
    pieges: [
      { faux: "Do you like it? — Yes, I [x:like].", juste: "Do you like it? — Yes, [s:I] [a:do].", pourquoi: "On reprend l'auxiliaire de la question ({do}), pas le verbe principal." },
      { faux: "Are you ready? — Yes, [x:I'm].", juste: "Are you ready? — Yes, [s:I] [a:am].", pourquoi: "En fin de réponse courte affirmative, pas de contraction : {I am}, {he is}, {we are}." },
      { faux: "Can he drive? — No, he [x:doesn't].", juste: "Can he drive? — No, [s:he] [a:can't].", pourquoi: "On renvoie le même moteur que la question : question avec {can}, réponse avec {can't}." },
    ],
    retenir: "Dans la réponse courte, on renvoie le moteur de la question : {Yes, I do} / {No, she can't}.",
  },

  "en-direct": {
    regle:
      "Le présent continu (on dit aussi progressif) décrit une action en train de se dérouler au moment où l'on parle, ou une situation provisoire. On le fabrique avec {be} au présent ({am}, {is}, {are}) suivi du verbe en {-ing}. C'est l'équivalent de « être en train de » : {I am reading} = je suis en train de lire. Pour la négation, on ajoute {not} après {be} ; pour la question, on place {be} devant le sujet.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {am} / {is} / {are} + verbe en {-ing}", exemple: "[s:She] [a:is] [r:read][t:ing]." },
      { nom: "Négation", modele: "sujet + {be} + {not} + verbe en {-ing}", exemple: "[s:They] [a:aren't] [r:listen][t:ing]." },
      { nom: "Question", modele: "{Am} / {Is} / {Are} + sujet + verbe en {-ing} ?", exemple: "[a:Are] [s:you] [r:sleep][t:ing]?" },
      { nom: "Orthographe", modele: "le {e} final tombe ({make} → {making}) · consonne doublée ({run} → {running})", exemple: "[s:He] [a:is] [v:running]." },
    ],
    usages: [
      { quand: "Ce qui se passe maintenant", en: "Shh! The baby [a:is] [r:sleep][t:ing].", fr: "Chut ! Le bébé dort." },
      { quand: "Une situation provisoire", en: "I [a:am] [r:stay][t:ing] with friends this week.", fr: "Je loge chez des amis cette semaine." },
      { quand: "Une évolution en cours", en: "The climate [a:is] [r:chang][t:ing].", fr: "Le climat change." },
    ],
    francais:
      "Le français n'a qu'un présent : « je lis » peut vouloir dire « je lis souvent » ou « je lis en ce moment ». L'anglais sépare les deux : {I read} (en général) et {I am reading} (en ce moment). Quand tu peux dire « être en train de » en français, pense au présent continu. Et n'oublie jamais {be} : la forme en {-ing} toute seule n'est pas un verbe conjugué.",
    pieges: [
      { faux: "I [x:reading] a book.", juste: "I [a:am] [r:read][t:ing] a book.", pourquoi: "La forme en {-ing} a toujours besoin de {be} devant elle." },
      { faux: "Look! It [x:rains].", juste: "Look! It [a:is] [r:rain][t:ing].", pourquoi: "{Look!} montre que ça se passe sous nos yeux : présent continu." },
      { faux: "She is [x:writeing].", juste: "She is [v:writing].", pourquoi: "Le {e} muet final tombe devant {-ing} : {write} → {writing}, {make} → {making}." },
    ],
    retenir: "En ce moment = {am} / {is} / {are} + verbe en {-ing}.",
  },

  telecommande: {
    regle:
      "L'impératif sert à donner un ordre, un conseil, une consigne ou une invitation. En anglais, c'est la forme la plus simple qui soit : la base du verbe, sans sujet ({Sit down.}). Elle ne change pas, qu'on parle à une personne ou à plusieurs, qu'on la tutoie ou qu'on la vouvoie. Pour interdire, on met {Don't} devant ; pour proposer de faire quelque chose ensemble, on emploie {Let's} + base.",
    forme: [
      { nom: "Ordre, conseil", modele: "base du verbe", exemple: "[r:Open] the window, please." },
      { nom: "Interdiction", modele: "{Don't} + base", exemple: "[a:Don't] [r:touch] that!" },
      { nom: "Ensemble (nous)", modele: "{Let's} + base", exemple: "[a:Let's] [r:go]!" },
    ],
    usages: [
      { quand: "Une consigne", en: "[r:Read] the text and [r:answer] the questions.", fr: "Lisez le texte et répondez aux questions." },
      { quand: "Un conseil", en: "[a:Don't] [r:worry].", fr: "Ne t'inquiète pas." },
      { quand: "Une invitation", en: "[r:Come] in and [r:sit] down.", fr: "Entrez et asseyez-vous." },
      { quand: "Une proposition", en: "[a:Let's] [r:have] a break.", fr: "Faisons une pause." },
    ],
    francais:
      "Le français a trois formes d'impératif (viens, venons, venez) ; l'anglais n'en a qu'une : {come}. Le « nous » de « venons » se dit avec {let's} ({Let's go!} = Allons-y !). Pour rester poli, l'anglais adoucit souvent l'ordre avec {please}, ou le transforme en question : {Can you close the door, please?}",
    pieges: [
      { faux: "[x:Not] touch!", juste: "[a:Don't] [r:touch]!", pourquoi: "L'impératif négatif se fait toujours avec {don't}, même avec {be} : {Don't be late!}" },
      { faux: "[x:Let's to go]!", juste: "[a:Let's] [r:go]!", pourquoi: "Après {let's}, le verbe est à la base, sans {to}." },
      { faux: "[x:Don't be worry].", juste: "[a:Don't] [r:worry].", pourquoi: "{worry} est un verbe : {don't} se place directement devant. On garde {be} seulement avec un adjectif : {Don't be sad.}" },
    ],
    retenir: "Ordre = base du verbe. Interdiction = {Don't} + base. Ensemble = {Let's} + base.",
  },

  "super-pouvoir": {
    regle:
      "{Can} exprime ce qu'on est capable de faire (savoir, pouvoir) et ce qu'on a le droit de faire. C'est un modal, une famille de verbes aux règles très simples : même forme avec tous les sujets (jamais de {-s}), suivi de la base du verbe sans {to}, et capable de se nier ({can't}, ou {cannot} en un seul mot) et de poser une question (on le place devant le sujet) sans l'aide de {do}.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {can} + base", exemple: "[s:She] [a:can] [r:swim]." },
      { nom: "Négation", modele: "sujet + {can't} / {cannot} + base", exemple: "[s:I] [a:can't] [r:come]." },
      { nom: "Question", modele: "{Can} + sujet + base ?", exemple: "[a:Can] [s:you] [r:help] me?" },
    ],
    usages: [
      { quand: "Une capacité (savoir faire)", en: "My son [a:can] [r:read].", fr: "Mon fils sait lire." },
      { quand: "Une possibilité", en: "You [a:can] [r:see] the sea from here.", fr: "On voit la mer d'ici." },
      { quand: "Une permission", en: "You [a:can] [r:park] here.", fr: "Vous pouvez vous garer ici." },
      { quand: "Une demande", en: "[a:Can] [s:I] [r:open] the window?", fr: "Je peux ouvrir la fenêtre ?" },
    ],
    francais:
      "Le français distingue « savoir » (savoir nager) et « pouvoir » (pouvoir venir) ; l'anglais emploie {can} pour les deux. Autre différence : avec les verbes de perception, l'anglais aime ajouter {can} là où le français s'en passe : {I can hear music} = j'entends de la musique ; {I can't see anything} = je ne vois rien.",
    pieges: [
      { faux: "He [x:cans] swim.", juste: "He [a:can] [r:swim].", pourquoi: "Un modal ne prend jamais de {-s}, même avec {he}, {she}, {it}." },
      { faux: "I can [x:to] drive.", juste: "I [a:can] [r:drive].", pourquoi: "Après {can}, le verbe est nu, sans {to}." },
      { faux: "[x:Do you can] help me?", juste: "[a:Can] [s:you] [r:help] me?", pourquoi: "{Can} n'a jamais besoin de {do} : il passe lui-même devant le sujet." },
    ],
    retenir: "{can} + verbe nu, pour tout le monde : sans {-s}, sans {to}, sans {do}.",
  },

  "j-aime": {
    regle:
      "Après les verbes de goût ({like}, {love}, {enjoy}, {hate}, {don't mind}), l'activité se met le plus souvent en {-ing} : {I love swimming} (j'adore nager). Pour exprimer un souhait poli, « je voudrais », on dit {I would like}, presque toujours contracté en {I'd like}, suivi de {to} + base ({I'd like to swim}) ou d'un nom ({I'd like a coffee}). {Like} = aimer en général ; {would like} = avoir envie maintenant ou bientôt.",
    forme: [
      { nom: "Un goût", modele: "{like} / {love} / {hate} / {enjoy} + verbe en {-ing}", exemple: "I [v:love] [r:danc][t:ing]." },
      { nom: "Un souhait", modele: "{would like} ({'d like}) + {to} + base", exemple: "[s:I] [a:would like] [k:to] [r:dance]." },
      { nom: "Une proposition", modele: "{Would you like} + nom ou {to} + base ?", exemple: "[a:Would] [s:you] like a tea?" },
    ],
    usages: [
      { quand: "Parler de ses goûts", en: "She [v:enjoy][t:s] [r:read][t:ing].", fr: "Elle aime lire." },
      { quand: "Commander, demander", en: "[s:I][a:'d like] a glass of water, please.", fr: "Je voudrais un verre d'eau, s'il vous plaît." },
      { quand: "Inviter", en: "[a:Would] you like [k:to] [r:come]?", fr: "Tu veux venir ?" },
    ],
    francais:
      "Le français dit « j'aime nager » avec un infinitif. L'anglais préfère l'{-ing} après les verbes de goût ({I like swimming}). {I like to swim} existe aussi, surtout en anglais américain, mais {enjoy} et {don't mind} n'acceptent que l'{-ing}. Attention aussi à « je voudrais » : on ne le traduit pas par {I want}, trop direct, presque impoli au restaurant, mais par {I'd like}.",
    pieges: [
      { faux: "I enjoy [x:to cook].", juste: "I [v:enjoy] [r:cook][t:ing].", pourquoi: "{enjoy} est toujours suivi de la forme en {-ing}." },
      { faux: "I would like [x:go] out.", juste: "I [a:would like] [k:to] [r:go] out.", pourquoi: "Après {would like}, il faut {to} devant le verbe." },
      { faux: "[x:I want] a coffee, please.", juste: "[s:I][a:'d like] a coffee, please.", pourquoi: "Pour commander poliment, on dit {I'd like} ; {I want} sonne comme un ordre." },
    ],
    retenir: "J'aime faire = {like} + {-ing}. Je voudrais faire = {I'd like to} + base.",
  },

  "habitude-ou-direct": {
    regle:
      "Le présent simple parle de ce qui est vrai en général : habitudes, vérités, goûts, situations durables ({I work in a bank}). Le présent continu parle de ce qui se passe maintenant, ou en ce moment de la vie, pour un temps limité ({I'm working from home this week}). Les petits mots aident : {usually}, {every day}, {often}, {never} appellent le simple ; {now}, {right now}, {at the moment}, {today}, {Look!} appellent le continu. Enfin, les verbes d'état ({know}, {like}, {want}, {understand}, {believe}) restent presque toujours au présent simple.",
    forme: [
      { nom: "L'album (d'habitude)", modele: "sujet + verbe (+ {-s} avec {he}, {she}, {it})", exemple: "[s:He] [r:drive][t:s] to work." },
      { nom: "La caméra (en ce moment)", modele: "sujet + {am} / {is} / {are} + verbe en {-ing}", exemple: "[s:He] [a:is] [r:walk][t:ing] today." },
    ],
    usages: [
      { quand: "Une habitude", en: "I usually [r:drink] tea.", fr: "D'habitude, je bois du thé." },
      { quand: "Une exception aujourd'hui", en: "But today I [a:am] [r:drink][t:ing] coffee.", fr: "Mais aujourd'hui, je bois du café." },
      { quand: "Un verbe d'état, même maintenant", en: "I [r:understand] you now.", fr: "Je te comprends, maintenant." },
    ],
    francais:
      "Comme le français n'a qu'un présent, il faut se poser la question à chaque phrase : « d'habitude » ou « en ce moment » ? Si tu peux ajouter « en train de » sans changer le sens, c'est le continu. Mais avec les verbes qui décrivent un état plutôt qu'une action (savoir, aimer, vouloir, comprendre, croire, appartenir), on garde le simple, même quand c'est vrai maintenant.",
    pieges: [
      { faux: "I [x:am knowing] the answer.", juste: "I [r:know] the answer.", pourquoi: "{know} est un verbe d'état : il ne se met pas en {-ing}." },
      { faux: "Every morning I [x:am taking] the bus.", juste: "Every morning I [r:take] the bus.", pourquoi: "{every morning} décrit une habitude : présent simple." },
      { faux: "Be quiet! I [x:work].", juste: "Be quiet! I [a:am] [r:work][t:ing].", pourquoi: "{Be quiet!} : l'action a lieu en ce moment même, on prend le continu." },
    ],
    retenir: "D'habitude = présent simple. En ce moment = {be} + {-ing}. Les verbes d'état restent simples.",
  },

  "was-were": {
    regle:
      "Au passé, {be} n'a que deux formes : {was} avec {I}, {he}, {she}, {it} (et un nom au singulier) ; {were} avec {you}, {we}, {they} (et les pluriels). Comme au présent, {be} n'a pas besoin de {did} : pour la négation, on ajoute {not} ({wasn't}, {weren't}) ; pour la question, on inverse ({Were you…?}). {Was} et {were} traduisent à la fois « j'étais » et « j'ai été ».",
    forme: [
      { nom: "Affirmation", modele: "sujet + {was} / {were}", exemple: "[s:It] [a:was] cold." },
      { nom: "Négation", modele: "sujet + {wasn't} / {weren't}", exemple: "[s:We] [a:weren't] at home." },
      { nom: "Question", modele: "{Was} / {Were} + sujet… ?", exemple: "[a:Were] [s:you] tired?" },
    ],
    usages: [
      { quand: "Décrire le passé", en: "The film [a:was] great.", fr: "Le film était génial." },
      { quand: "Dire où l'on était", en: "[s:We] [a:were] in London last week.", fr: "Nous étions à Londres la semaine dernière." },
      { quand: "Avec {there} (il y avait)", en: "There [a:were] a lot of people.", fr: "Il y avait beaucoup de monde." },
    ],
    francais:
      "Le français distingue « j'étais » (imparfait) et « j'ai été » (passé composé) ; l'anglais dit {I was} dans les deux cas. Et attention à « je suis né » : la naissance est un événement passé, donc l'anglais dit {I was born}, jamais {I am born}.",
    pieges: [
      { faux: "I [x:am born] in 2005.", juste: "I [a:was] born in 2005.", pourquoi: "La naissance appartient au passé : {was born}." },
      { faux: "They [x:was] late.", juste: "They [a:were] late.", pourquoi: "{they}, comme {you} et {we}, va avec {were}." },
      { faux: "[x:Did you be] at home?", juste: "[a:Were] [s:you] at home?", pourquoi: "{be} se met en question tout seul, sans {did}." },
    ],
    retenir: "{I / he / she / it was}, {you / we / they were}. Et je suis né = {I was born}.",
  },

  "ed-magique": {
    regle:
      "Le prétérit (le {past simple}) raconte une action terminée dans le passé, à un moment précis ou révolu ({yesterday}, {last week}, {in 2010}, {two days ago}). Pour les verbes réguliers, on ajoute {-ed} à la base, et c'est la même forme pour toutes les personnes : {I worked}, {she worked}, {they worked}. Orthographe : un {e} final donne seulement {-d} ({liked}) ; consonne + {y} donne {-ied} ({studied}) ; un verbe court en consonne-voyelle-consonne double sa dernière consonne ({stopped}).",
    forme: [
      { nom: "Règle générale", modele: "base + {-ed}", exemple: "[s:I] [r:walk][t:ed] home." },
      { nom: "Verbe en -e", modele: "base + {-d}", exemple: "[s:She] [r:smile][t:d]." },
      { nom: "Consonne + y", modele: "{y} → {-ied}", exemple: "[s:They] [r:stud][t:ied] all night." },
      { nom: "Consonne doublée", modele: "{stop} → {stopped}, {plan} → {planned}", exemple: "[s:The bus] [v:stopped]." },
    ],
    usages: [
      { quand: "Un fait passé daté", en: "We [r:visit][t:ed] Rome in 2019.", fr: "Nous avons visité Rome en 2019." },
      { quand: "Une suite d'actions", en: "He [r:open][t:ed] the door and [r:look][t:ed] outside.", fr: "Il a ouvert la porte et il a regardé dehors." },
      { quand: "Avec {ago} (il y a)", en: "She [r:call][t:ed] two hours ago.", fr: "Elle a appelé il y a deux heures." },
    ],
    francais:
      "Le prétérit traduit le plus souvent le passé composé (« j'ai travaillé ») et le passé simple des livres (« il travailla »). Dès qu'un moment passé précis est donné ({yesterday}, {last year}, {ago}), c'est lui. À l'oral, le {-ed} se prononce de trois façons : /t/ ({walked}), /d/ ({played}) et /ɪd/, une vraie syllabe en plus, seulement après t ou d ({wanted}, {needed}).",
    pieges: [
      { faux: "Yesterday I [x:have worked].", juste: "Yesterday I [r:work][t:ed].", pourquoi: "Avec un moment passé précis ({yesterday}), on prend le prétérit, pas {have} + participe, même si le français dit « j'ai travaillé »." },
      { faux: "She [x:studyed] English.", juste: "She [r:stud][t:ied] English.", pourquoi: "Consonne + {y} : le {y} devient {i}, puis on ajoute {-ed}." },
      { faux: "We [x:planed] the trip.", juste: "We [v:planned] the trip.", pourquoi: "{plan} finit par consonne-voyelle-consonne : on double le {n}. Sinon, on lit un autre verbe, {plane} (raboter) !" },
    ],
    retenir: "Passé terminé et verbe régulier : base + {-ed}, pour tout le monde.",
  },

  rebelles: {
    regle:
      "Environ 150 verbes courants refusent le {-ed} : ce sont les verbes irréguliers. Chacun a trois formes à connaître : la base ({go}), le prétérit ({went}) et le participe passé ({gone}). Le prétérit s'emploie seul ({I went}) ; le participe passé s'emploie après {have} ({I have gone}) ou après {be} ({it was written}). Bonne nouvelle : ce sont souvent les verbes les plus fréquents, donc ceux qu'on entend le plus.",
    forme: [
      { nom: "Trois formes", modele: "base · prétérit · participe passé", exemple: "[r:go] · [p:went] · [p:gone]" },
      { nom: "Trois fois pareil", modele: "{put} · {put} · {put}, comme {cut}, {cost}, {let}…", exemple: "[r:cut] · [p:cut] · [p:cut]" },
      { nom: "Prétérit = participe", modele: "{buy} · {bought} · {bought}, comme {make}, {find}…", exemple: "[r:buy] · [p:bought] · [p:bought]" },
    ],
    usages: [
      { quand: "Au prétérit", en: "We [p:went] to the beach.", fr: "Nous sommes allés à la plage." },
      { quand: "Après {have}", en: "I have [p:seen] this film.", fr: "J'ai déjà vu ce film." },
      { quand: "Dans un récit", en: "She [p:took] her bag and [p:left].", fr: "Elle a pris son sac et elle est partie." },
    ],
    francais:
      "Le français a lui aussi ses rebelles (aller : je vais, j'allai, je suis allé). L'avantage de l'anglais : une fois la forme apprise, elle sert à toutes les personnes. Astuce : apprends-les par familles qui se ressemblent ({sing} · {sang} · {sung}, {ring} · {rang} · {rung}, {drink} · {drank} · {drunk}) et toujours à voix haute, comme une comptine.",
    pieges: [
      { faux: "I [x:goed] to school.", juste: "I [p:went] to school.", pourquoi: "{go} est irrégulier : son prétérit est {went}." },
      { faux: "She has [x:went] home.", juste: "She has [p:gone] home.", pourquoi: "Après {have}, on prend la troisième forme, le participe passé : {gone}." },
      { faux: "He [x:buyed] a car.", juste: "He [p:bought] a car.", pourquoi: "{buy} · {bought} · {bought} : pas de {-ed}." },
    ],
    retenir: "Un verbe irrégulier s'apprend en trois formes, à voix haute : {go} · {went} · {gone}.",
  },

  did: {
    regle:
      "Au prétérit, la négation et la question appellent {did}, le passé de {do}. {Did} porte à lui seul la marque du passé : le verbe principal revient donc à sa base, sans {-ed} et sans forme irrégulière. Négation : {didn't} + base ; question : {Did} + sujet + base. C'est la même chose pour toutes les personnes. Seul {be} fait exception : {wasn't}, {Were you…?}",
    forme: [
      { nom: "Négation", modele: "sujet + {didn't} + base", exemple: "[s:I] [a:didn't] [r:see] him." },
      { nom: "Question", modele: "{Did} + sujet + base ?", exemple: "[a:Did] [s:you] [r:enjoy] the film?" },
      { nom: "Question ouverte", modele: "mot interrogatif + {did} + sujet + base ?", exemple: "Where [a:did] [s:she] [r:go]?" },
    ],
    usages: [
      { quand: "Dire ce qui ne s'est pas passé", en: "We [a:didn't] [r:go] out last night.", fr: "Nous ne sommes pas sortis hier soir." },
      { quand: "Vérifier une information", en: "[a:Did] [s:he] [r:call] you?", fr: "Il t'a appelé ?" },
      { quand: "Demander un détail", en: "What [a:did] [s:you] [r:buy]?", fr: "Qu'est-ce que tu as acheté ?" },
    ],
    francais:
      "Le français garde le verbe au passé dans la négation (« je ne suis pas allé »). L'anglais, lui, met le passé dans {did} et laisse le verbe à la base : {I didn't go}. C'est exactement la mécanique du présent avec {do}, un cran en arrière dans le temps.",
    pieges: [
      { faux: "I didn't [x:went] there.", juste: "I [a:didn't] [r:go] there.", pourquoi: "Le passé est déjà dans {didn't} : le verbe revient à la base." },
      { faux: "Did you [x:saw] it?", juste: "[a:Did] [s:you] [r:see] it?", pourquoi: "Après {did}, toujours la base : {see}, pas {saw}." },
      { faux: "Where [x:you went]?", juste: "Where [a:did] [s:you] [r:go]?", pourquoi: "La question au passé a besoin de {did} entre le mot interrogatif et le sujet." },
    ],
    retenir: "{did} garde le passé pour lui : après {did} ou {didn't}, verbe à la base.",
  },

  decor: {
    regle:
      "Le prétérit continu ({was} / {were} + verbe en {-ing}) décrit une action en cours à un moment du passé, comme un décor : {At 8 o'clock, I was having dinner}. On l'associe souvent au prétérit simple : le continu pour l'action longue qui servait de fond, le simple pour l'événement bref qui l'a interrompue. {While} (pendant que) introduit en général l'action longue, {when} (quand) l'événement.",
    forme: [
      { nom: "Le décor", modele: "sujet + {was} / {were} + verbe en {-ing}", exemple: "[s:They] [a:were] [r:play][t:ing]." },
      { nom: "Décor + événement", modele: "{was} / {were} + {-ing}… {when} + prétérit", exemple: "I [a:was] [r:cook][t:ing] when the phone [p:rang]." },
      { nom: "Deux actions en parallèle", modele: "{while} + prétérit continu, prétérit continu", exemple: "While he [a:was] [r:read][t:ing], she [a:was] [r:sleep][t:ing]." },
    ],
    usages: [
      { quand: "Une action en cours à une heure donnée", en: "At midnight, I [a:was] [r:sleep][t:ing].", fr: "À minuit, je dormais." },
      { quand: "Le décor d'un récit", en: "It [a:was] [r:rain][t:ing] and the wind [a:was] [r:blow][t:ing].", fr: "Il pleuvait et le vent soufflait." },
      { quand: "Une action interrompue", en: "We [a:were] [r:watch][t:ing] TV when the lights [p:went] out.", fr: "Nous regardions la télé quand la lumière s'est éteinte." },
    ],
    francais:
      "Le prétérit continu correspond souvent à l'imparfait qui décrit une action en cours (« je mangeais quand… »). Mais tous les imparfaits ne deviennent pas des {-ing} : pour une habitude passée (« je jouais au foot le samedi »), l'anglais prend le prétérit simple ou {used to}, pas le continu.",
    pieges: [
      { faux: "As a child, I [x:was playing] football every Saturday.", juste: "As a child, I [r:play][t:ed] football every Saturday.", pourquoi: "Une habitude passée n'est pas un décor en cours : prétérit simple (ou {used to play})." },
      { faux: "I was cooking when the phone [x:was ringing].", juste: "I was cooking when the phone [p:rang].", pourquoi: "L'événement bref qui interrompt se met au prétérit simple." },
      { faux: "They [x:was] sleeping.", juste: "They [a:were] sleeping.", pourquoi: "Même règle que pour {be} au passé : {they were}." },
    ],
    retenir: "Le décor en cours = {was} / {were} + {-ing} ; l'événement qui surgit = prétérit simple.",
  },

  "going-to": {
    regle:
      "{Be going to} + base sert à parler d'un projet déjà décidé avant le moment où l'on parle ({I'm going to visit my aunt this weekend}), ou d'une prédiction appuyée sur un signe visible maintenant ({Look at those clouds, it's going to rain}). {Be} se conjugue ({am}, {is}, {are}) et c'est lui qui s'occupe de la négation et de la question.",
    forme: [
      { nom: "Affirmation", modele: "sujet + {am} / {is} / {are} + {going to} + base", exemple: "[s:We] [a:are going to] [r:move]." },
      { nom: "Négation", modele: "sujet + {be} + {not going to} + base", exemple: "[s:She] [a:isn't going to] [r:come]." },
      { nom: "Question", modele: "{Am} / {Is} / {Are} + sujet + {going to} + base ?", exemple: "[a:Are] [s:you] [a:going to] [r:call] him?" },
    ],
    usages: [
      { quand: "Un projet décidé", en: "I [a:am going to] [r:learn] Spanish next year.", fr: "Je vais apprendre l'espagnol l'année prochaine." },
      { quand: "Une prédiction visible", en: "Be careful, you [a:are going to] [r:fall]!", fr: "Attention, tu vas tomber !" },
      { quand: "Une intention négative", en: "We [a:aren't going to] [r:buy] a car.", fr: "Nous n'allons pas acheter de voiture." },
    ],
    francais:
      "C'est le cousin direct du futur proche « je vais + infinitif ». La grande différence : en anglais, il faut {be} devant {going to}. Et après {going to}, le verbe est à la base. À l'oral familier, tu entendras {gonna} ({I'm gonna call}), à ne pas écrire dans un texte soigné.",
    pieges: [
      { faux: "I [x:going to] study tonight.", juste: "I [a:am going to] [r:study] tonight.", pourquoi: "{going to} a besoin de {be} : {I am}, {she is}, {they are}." },
      { faux: "She is going to [x:visits] us.", juste: "She [a:is going to] [r:visit] us.", pourquoi: "Après {to}, le verbe reste à la base, sans {-s}." },
      { faux: "I [x:go to] call him tomorrow.", juste: "I [a:am going to] [r:call] him tomorrow.", pourquoi: "« Je vais l'appeler » ne se traduit pas par {I go to} : il faut toute la forme {be going to}." },
    ],
    retenir: "Projet décidé ou signe visible : {am} / {is} / {are} + {going to} + base.",
  },

  will: {
    regle:
      "{Will} + base exprime le futur sous plusieurs visages : une décision prise à l'instant où l'on parle ({I'll take this one}), une promesse ou une offre ({I'll help you}), une prédiction fondée sur une opinion ({I think it will be fine}), ou un fait futur ({She will be 30 next month}). Comme {can}, c'est un modal : même forme avec tous les sujets, et il gère seul la négation ({won't}) et la question ({Will you…?}).",
    forme: [
      { nom: "Affirmation", modele: "sujet + {will} ({'ll}) + base", exemple: "[s:I][a:'ll] [r:call] you." },
      { nom: "Négation", modele: "sujet + {won't} + base", exemple: "[s:It] [a:won't] [r:take] long." },
      { nom: "Question", modele: "{Will} + sujet + base ?", exemple: "[a:Will] [s:you] [r:marry] me?" },
    ],
    usages: [
      { quand: "Une décision sur le moment", en: "The phone is ringing. — [s:I][a:'ll] [r:answer] it!", fr: "Le téléphone sonne. — Je réponds !" },
      { quand: "Une promesse", en: "[s:I] [a:won't] [r:tell] anyone.", fr: "Je ne le dirai à personne." },
      { quand: "Une prédiction (une opinion)", en: "I think [s:you] [a:will] [r:love] this book.", fr: "Je pense que tu vas adorer ce livre." },
    ],
    francais:
      "{Will} correspond au futur simple (« je viendrai »), mais il sert aussi là où le français dit « je vais », ou même un présent : « Je réponds ! » quand le téléphone sonne se dit {I'll get it!}. Faux ami : {will} n'a rien à voir avec « vouloir ». Et après {when} (quand), l'anglais ne met pas de futur : {When I arrive, I'll call you}.",
    pieges: [
      { faux: "I will [x:to go].", juste: "I [a:will] [r:go].", pourquoi: "Modal oblige : après {will}, le verbe est nu, sans {to}." },
      { faux: "When I [x:will arrive], I'll call you.", juste: "When I [r:arrive], I'll call you.", pourquoi: "Après {when} (et {if}, {as soon as}), l'anglais garde le présent pour parler du futur." },
      { faux: "She [x:wills] help.", juste: "She [a:will] [r:help].", pourquoi: "Jamais de {-s} sur un modal." },
    ],
    retenir: "Décision sur le moment, promesse, prédiction : {will} + base. Négation : {won't}.",
  },

  "verite-si": {
    regle:
      "Le conditionnel zéro exprime une vérité générale, une loi, une règle ou un réflexe : chaque fois que la condition est remplie, le résultat suit. On met le présent simple des deux côtés : {If you heat ice, it melts}. {If} (si) peut être remplacé par {when} (quand) sans changer le sens, puisque c'est toujours vrai.",
    forme: [
      { nom: "Condition, résultat", modele: "{If} / {When} + présent simple, présent simple", exemple: "If you [r:mix] red and blue, you [r:get] purple." },
      { nom: "Dans l'autre sens", modele: "présent simple + {if} / {when} + présent simple (sans virgule)", exemple: "Plants [r:die] if they [a:don't] [r:get] water." },
    ],
    usages: [
      { quand: "Une loi de la nature", en: "If you [r:heat] water to 100°C, it [r:boil][t:s].", fr: "Si on chauffe l'eau à 100 °C, elle bout." },
      { quand: "Une règle, un mode d'emploi", en: "If the light [a:is] red, you [r:stop].", fr: "Si le feu est rouge, on s'arrête." },
      { quand: "Un réflexe personnel", en: "When I [a:am] tired, I [r:drink] coffee.", fr: "Quand je suis fatigué, je bois du café." },
    ],
    francais:
      "Le français fait pareil : « si on chauffe la glace, elle fond », présent et présent. Le seul réflexe à prendre : ne jamais mettre {will} juste après {if} pour exprimer la condition. Et la virgule ne se met que lorsque la phrase commence par {if} ou {when}.",
    pieges: [
      { faux: "If you [x:will press] this button, the machine stops.", juste: "If you [r:press] this button, the machine [r:stop][t:s].", pourquoi: "Pas de {will} juste après {if} : la condition se met au présent." },
      { faux: "When water [x:freeze], it becomes ice.", juste: "When water [r:freeze][t:s], it becomes ice.", pourquoi: "{water} est un sujet singulier : le présent simple prend son {-s}." },
    ],
    retenir: "Toujours vrai : {If} / {When} + présent, présent.",
  },

  "used-to": {
    regle:
      "{Used to} + base parle d'une habitude ou d'un état du passé qui n'existe plus aujourd'hui : {I used to live in Paris} (avant, je vivais à Paris ; plus maintenant). La forme {used to} est la même pour toutes les personnes. À la négation et à la question, on emploie {did}, et {used} perd alors son {d} : {didn't use to}, {Did you use to…?}",
    forme: [
      { nom: "Affirmation", modele: "sujet + {used to} + base", exemple: "[s:She] [a:used to] [r:smoke]." },
      { nom: "Négation", modele: "sujet + {didn't use to} + base", exemple: "[s:I] [a:didn't use to] [r:like] olives." },
      { nom: "Question", modele: "{Did} + sujet + {use to} + base ?", exemple: "[a:Did] [s:you] [a:use to] [r:play] the piano?" },
    ],
    usages: [
      { quand: "Une habitude disparue", en: "We [a:used to] [r:go] camping every summer.", fr: "Avant, nous allions camper chaque été." },
      { quand: "Un état passé", en: "There [a:used to] [r:be] a cinema here.", fr: "Avant, il y avait un cinéma ici." },
      { quand: "Un goût qui a changé", en: "I [a:didn't use to] [r:like] coffee, but now I love it.", fr: "Avant, je n'aimais pas le café, mais maintenant j'adore ça." },
    ],
    francais:
      "{Used to} correspond à l'imparfait d'habitude, souvent accompagné de « avant » ou « autrefois » : « je jouais au tennis (avant) ». Le français n'a pas de forme spéciale, l'anglais si. Ne le confonds pas avec {be used to} + {-ing}, qui veut dire « être habitué à » : {I'm used to getting up early} (j'ai l'habitude de me lever tôt).",
    pieges: [
      { faux: "I [x:use to] live in Lyon.", juste: "I [a:used to] [r:live] in Lyon.", pourquoi: "À l'affirmative, c'est toujours {used}, avec un {d}." },
      { faux: "When I was young, I [x:was used to] play the guitar.", juste: "When I was young, I [a:used to] [r:play] the guitar.", pourquoi: "{be used to} veut dire « être habitué à » ; l'habitude passée, c'est {used to} tout seul." },
      { faux: "Did you [x:used to] swim?", juste: "[a:Did] [s:you] [a:use to] [r:swim]?", pourquoi: "Après {did}, le {d} disparaît : {use to}." },
    ],
    retenir: "Avant, mais plus maintenant : {used to} + base (et {didn't use to} à la négation).",
  },

  loi: {
    regle:
      "{Must} et {have to} expriment tous les deux une obligation. {Must} vient plutôt de celui qui parle, une obligation qu'il ressent ou qu'il impose ({I must call my mum}) ; {have to} vient plutôt d'une règle extérieure ({I have to wear a uniform}). À la négation, ils se séparent complètement : {mustn't} = c'est interdit ; {don't have to} = ce n'est pas obligatoire, tu as le choix. Au passé, seul {have to} fonctionne : {had to}.",
    forme: [
      { nom: "Obligation", modele: "{must} + base · {have to} / {has to} + base", exemple: "[s:You] [a:must] [r:stop] here." },
      { nom: "Interdiction", modele: "{mustn't} + base", exemple: "[s:You] [a:mustn't] [r:smoke] here." },
      { nom: "Pas d'obligation", modele: "{don't} / {doesn't have to} + base", exemple: "[s:You] [a:don't have to] [r:pay]." },
      { nom: "Au passé", modele: "{had to} + base", exemple: "[s:We] [a:had to] [r:wait]." },
    ],
    usages: [
      { quand: "Une obligation personnelle", en: "I [a:must] [r:remember] her birthday.", fr: "Il faut que je pense à son anniversaire." },
      { quand: "Une règle extérieure", en: "She [a:has to] [r:start] work at 7.", fr: "Elle doit commencer le travail à 7 h." },
      { quand: "Un interdit", en: "Children [a:mustn't] [r:play] here.", fr: "Les enfants n'ont pas le droit de jouer ici." },
      { quand: "Pas besoin", en: "It's Sunday, I [a:don't have to] [r:get] up early.", fr: "C'est dimanche, je ne suis pas obligé de me lever tôt." },
    ],
    francais:
      "Le français dit « devoir » ou « il faut » dans tous les cas. Le grand piège, c'est la négation : « tu ne dois pas » (c'est interdit) se dit {you mustn't}, mais « tu n'es pas obligé » se dit {you don't have to}. Les confondre change complètement le sens de la phrase. Et {have to} se conjugue comme un verbe ordinaire : {she has to}, {does she have to?}",
    pieges: [
      { faux: "It's free, you [x:mustn't] pay.", juste: "It's free, you [a:don't have to] [r:pay].", pourquoi: "Gratuit = pas obligé de payer : {don't have to}. {Mustn't} voudrait dire qu'il est interdit de payer !" },
      { faux: "Yesterday I [x:must] work late.", juste: "Yesterday I [a:had to] [r:work] late.", pourquoi: "{must} n'a pas de passé : on dit {had to}." },
      { faux: "He [x:have to] go.", juste: "He [a:has to] [r:go].", pourquoi: "{have to} se conjugue : {he has to}." },
    ],
    retenir: "{mustn't} = interdit ; {don't have to} = pas obligé.",
  },

  politesse: {
    regle:
      "Pour demander la permission, on dit {Can I…?} (simple et courant), {Could I…?} (plus poli) ou {May I…?} (très poli, un peu formel). Pour demander un service : {Can you…?} ou, plus poliment, {Could you…?}. Pour proposer son aide ou une idée : {Shall I…?} (je… ?) et {Shall we…?} (on… ?). Dans tous les cas, le verbe qui suit est à la base, sans {to}.",
    forme: [
      { nom: "Demander la permission", modele: "{Can} / {Could} / {May} + {I} + base ?", exemple: "[a:May] [s:I] [r:come] in?" },
      { nom: "Demander un service", modele: "{Can} / {Could} + {you} + base ?", exemple: "[a:Could] [s:you] [r:help] me?" },
      { nom: "Proposer", modele: "{Shall} + {I} / {we} + base ?", exemple: "[a:Shall] [s:I] [r:open] the window?" },
    ],
    usages: [
      { quand: "Entre amis", en: "[a:Can] [s:I] [r:borrow] your pen?", fr: "Je peux emprunter ton stylo ?" },
      { quand: "Avec un inconnu", en: "[a:Could] [s:you] [r:tell] me the way to the station?", fr: "Pourriez-vous m'indiquer le chemin de la gare ?" },
      { quand: "Proposer une sortie", en: "[a:Shall] [s:we] [r:go] to the cinema?", fr: "On va au cinéma ?" },
    ],
    francais:
      "Le français règle la politesse avec « tu » ou « vous » et avec le conditionnel (« pourriez-vous »). L'anglais n'a qu'un seul {you} : la politesse passe donc par le choix du modal ({could} plutôt que {can}) et par {please}. Ici, {could} n'a rien de passé : c'est la version adoucie de {can}, comme notre « pourriez-vous ».",
    pieges: [
      { faux: "[x:Do you can] help me?", juste: "[a:Can] [s:you] [r:help] me?", pourquoi: "Les modaux posent leurs questions seuls, sans {do}." },
      { faux: "Could you [x:to close] the door?", juste: "[a:Could] [s:you] [r:close] the door?", pourquoi: "Après un modal, le verbe est nu, sans {to}." },
      { faux: "[x:Will I] open the window?", juste: "[a:Shall] [s:I] [r:open] the window?", pourquoi: "Pour proposer de faire quelque chose (« je… ? »), l'anglais dit {Shall I…?}" },
    ],
    retenir: "Permission : {Can / Could / May I…?} Service : {Could you…?} Proposition : {Shall I / we…?}",
  },

  conseil: {
    regle:
      "{Should} + base donne un conseil ou un avis sur ce qui serait bien : {You should rest} (tu devrais te reposer). C'est un modal : même forme pour tous, pas de {to} après, négation {shouldn't}, question {Should I…?}. {Ought to} a le même sens, en un peu plus formel ({You ought to rest}). Pour un conseil très personnel, on dit aussi {If I were you, I'd…} (à ta place, je…).",
    forme: [
      { nom: "Conseil", modele: "sujet + {should} + base", exemple: "[s:You] [a:should] [r:see] a doctor." },
      { nom: "Conseil négatif", modele: "sujet + {shouldn't} + base", exemple: "[s:You] [a:shouldn't] [r:eat] so much sugar." },
      { nom: "Demander conseil", modele: "{Should} + sujet + base ?", exemple: "[a:Should] [s:I] [r:call] her?" },
      { nom: "À ta place", modele: "{If I were you, I'd} + base", exemple: "If I [a:were] you, I[a:'d] [r:wait]." },
    ],
    usages: [
      { quand: "Un conseil amical", en: "You [a:should] [r:try] this restaurant.", fr: "Tu devrais essayer ce restaurant." },
      { quand: "Une critique douce", en: "He [a:shouldn't] [r:drive] so fast.", fr: "Il ne devrait pas conduire si vite." },
      { quand: "Se mettre à la place de l'autre", en: "If I [a:were] you, I[a:'d] [r:accept] the job.", fr: "À ta place, j'accepterais le poste." },
    ],
    francais:
      "{Should} traduit exactement « devrait », le conditionnel de devoir : c'est un conseil, pas une obligation. Pour l'obligation, on revient à {must} ou {have to}. Dans {If I were you}, l'anglais soigné met {were} même avec {I} : c'est une forme figée, comme notre « si j'étais toi ».",
    pieges: [
      { faux: "You should [x:to] sleep more.", juste: "You [a:should] [r:sleep] more.", pourquoi: "{should} est un modal : verbe nu derrière. Seul {ought} prend {to} : {ought to sleep}." },
      { faux: "If I [x:was] you, I'd go.", juste: "If I [a:were] you, I[a:'d] [r:go].", pourquoi: "Dans cette expression, la forme soignée est {were}, même avec {I}." },
      { faux: "She [x:shoulds] study.", juste: "She [a:should] [r:study].", pourquoi: "Un modal ne prend jamais de {-s}." },
    ],
    retenir: "Conseil = {should} + base ; à ta place = {If I were you, I'd} + base.",
  },
};
