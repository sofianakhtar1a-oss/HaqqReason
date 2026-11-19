import type { Cours } from "../types";

/**
 * Grammaire, paliers C1 et C2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [k:never].
 */
export const COURS: Record<string, Cours> = {
  "phrase-envers": {
    regle:
      "Dans un style soutenu, ou pour un effet dramatique, une phrase peut commencer par une expression négative ou restrictive : {Never}, {Rarely}, {Seldom}, {Hardly… when}, {No sooner… than}, {Not only… but also}, {Under no circumstances}, {Only then}, {Little}. L'auxiliaire passe alors devant le sujet, comme dans une question : {Never have I seen such a mess}. S'il n'y a pas d'auxiliaire, on ajoute {do}, {does} ou {did} : {Rarely does he complain}.",
    forme: [
      { nom: "L'inversion", modele: "expression négative + auxiliaire + sujet + verbe", exemple: "[k:Never] [a:have] [s:I] [p:seen] this." },
      { nom: "Sans auxiliaire", modele: "expression + {do} / {does} / {did} + sujet + base", exemple: "[k:Rarely] [a:does] [s:she] [r:complain]." },
      { nom: "À peine… que", modele: "{Hardly} + {had} + sujet + participe + {when}…", exemple: "[k:Hardly] [a:had] [s:we] [p:arrived] when it rained." },
      { nom: "Non seulement", modele: "{Not only} + auxiliaire + sujet…, {but}… {also}", exemple: "[k:Not only] [a:is] [s:it] cheap, but it's also fast." },
    ],
    usages: [
      { quand: "Un discours", en: "[k:Never] before [a:have] [s:we] [p:faced] such a challenge.", fr: "Jamais auparavant nous n'avions affronté un tel défi." },
      { quand: "Une consigne officielle", en: "[k:Under no circumstances] [a:should] [s:you] [r:open] this door.", fr: "Vous ne devez en aucun cas ouvrir cette porte." },
      { quand: "Une succession immédiate", en: "[k:No sooner] [a:had] [s:he] [p:left] than she called.", fr: "À peine était-il parti qu'elle a appelé." },
      { quand: "Un ajout fort", en: "[k:Not only] [a:did] [s:she] [r:win], she broke the record.", fr: "Non seulement elle a gagné, mais elle a battu le record." },
    ],
    francais:
      "Le français connaît cette inversion après « à peine », « peut-être », « sans doute », « aussi » (« À peine était-il parti que… »). L'anglais l'applique à toute une série d'expressions négatives ou restrictives placées en tête. Le piège : oublier {do} quand il n'y a pas d'auxiliaire ({Rarely he complains} est faux), ou inverser alors que l'expression n'ouvre pas la phrase.",
    pieges: [
      { faux: "Never [x:I have seen] such a thing.", juste: "[k:Never] [a:have] [s:I] [p:seen] such a thing.", pourquoi: "Après {Never} en tête, l'auxiliaire passe devant le sujet." },
      { faux: "Rarely [x:he goes] out.", juste: "[k:Rarely] [a:does] [s:he] [r:go] out.", pourquoi: "Sans auxiliaire, on ajoute {does}, et le verbe revient à la base." },
      { faux: "Not only [x:she sings], but she also dances.", juste: "[k:Not only] [a:does] [s:she] [r:sing], but she also dances.", pourquoi: "Après {Not only} en tête, inversion avec {does}." },
    ],
    retenir: "Expression négative en tête → auxiliaire + sujet, comme une question : {Never have I…}",
  },

  "ne-pas-repeter": {
    regle:
      "L'anglais évite les répétitions en remplaçant des morceaux de phrase par de petits mots. L'auxiliaire seul remplace tout le groupe verbal ({She can swim, and so can I} ; {I didn't call him, but Anna did}). {so} remplace une proposition après {think}, {hope}, {expect}, {suppose}, {be afraid} ({I think so}, {I hope so}), et {not} la remplace à la négation ({I hope not}, {I'm afraid not}). {one} / {ones} remplacent un nom comptable ({I prefer the red one}). Et {to} seul remplace un infinitif déjà connu ({I'd love to}).",
    forme: [
      { nom: "L'auxiliaire seul", modele: "… + sujet + auxiliaire", exemple: "I can't drive, but my sister [a:can]." },
      { nom: "So et not", modele: "{I think} / {hope} + {so} · {I hope} / {I'm afraid} + {not}", exemple: "Will it rain? — I hope [k:not]." },
      { nom: "One, ones", modele: "adjectif + {one} / {ones}", exemple: "Which bag? — The blue [o:one]." },
      { nom: "To seul", modele: "verbe + {to}", exemple: "Do you want to come? — I'd love [k:to]." },
    ],
    usages: [
      { quand: "Ne pas répéter un verbe", en: "He said he'd call, but he [a:didn't].", fr: "Il a dit qu'il appellerait, mais il ne l'a pas fait." },
      { quand: "Répondre à une question", en: "Is she coming? — I think [k:so].", fr: "Elle vient ? — Je crois que oui." },
      { quand: "Choisir", en: "I don't like these shoes. I prefer the black [o:ones].", fr: "Je n'aime pas ces chaussures. Je préfère les noires." },
      { quand: "Accepter une invitation", en: "Would you like to join us? — I'd love [k:to]!", fr: "Tu veux te joindre à nous ? — Avec plaisir !" },
    ],
    francais:
      "Le français évite la répétition grâce à « le » (« je le pense », « je l'espère ») ou à « oui » et « non » (« je crois que oui », « j'espère que non ») ; l'anglais dit {I think so}, {I hope not}. Et « les noires », « la rouge » (pour un objet) ont besoin de {one} ou {ones} : on ne dit pas {the black} tout seul pour une chose.",
    pieges: [
      { faux: "Is it true? — I think [x:yes].", juste: "Is it true? — I think [k:so].", pourquoi: "« Je pense que oui » se dit {I think so}." },
      { faux: "Which car? — The [x:red].", juste: "Which car? — The red [o:one].", pourquoi: "Un adjectif seul ne remplace pas un nom comptable : il faut {one}." },
      { faux: "Is he coming? — I don't think [x:not].", juste: "Is he coming? — I don't [v:think] [k:so].", pourquoi: "Avec {think}, la négation porte sur {think} : {I don't think so}." },
    ],
    retenir: "On ne répète pas : l'auxiliaire seul, {so} / {not}, {one} / {ones}, {to} seul.",
  },

  rappels: {
    regle:
      "Un texte bien construit relie chaque phrase à la précédente par des mots de rappel. {this} / {these} + un nom qui résume ce qui vient d'être dit ({this problem}, {these changes}, {this decision}) : c'est plus clair qu'un simple {it}. {such} + nom = un tel, de ce genre ({such behaviour}). {the former} (le premier des deux) et {the latter} (le second) renvoient à deux éléments déjà cités. {the same} reprend un élément identique. Ces rappels évitent les répétitions et guident le lecteur.",
    forme: [
      { nom: "Résumer", modele: "{this} / {these} + nom-étiquette", exemple: "[d:This] [n:decision] surprised everyone." },
      { nom: "Un tel", modele: "{such} (+ {a}) + nom", exemple: "[k:Such] [n:mistakes] are common." },
      { nom: "Le premier, le second", modele: "{the former} · {the latter}", exemple: "Tea or coffee? I prefer [k:the latter]." },
    ],
    usages: [
      { quand: "Reprendre une idée", en: "Prices rose by 20%. [d:This] [n:increase] worried consumers.", fr: "Les prix ont augmenté de 20 %. Cette hausse a inquiété les consommateurs." },
      { quand: "Généraliser", en: "He shouted at the waiter. [k:Such] [n:behaviour] is unacceptable.", fr: "Il a crié sur le serveur. Un tel comportement est inacceptable." },
      { quand: "Distinguer deux éléments", en: "Paris and Lyon are big cities; [k:the former] is the capital.", fr: "Paris et Lyon sont de grandes villes ; la première est la capitale." },
    ],
    francais:
      "Le français fait la même chose avec « ce problème », « de tels changements », « le premier… le second », « celui-ci… celui-là ». L'anglais formel adore le nom-étiquette ({this issue}, {this approach}), qui résume un paragraphe entier en deux mots. Attention : {such} se place avant {a} ({such a problem} : un tel problème), et {the latter} ne s'emploie que lorsqu'il y a exactement deux éléments.",
    pieges: [
      { faux: "It was [x:a such] good idea.", juste: "It was [k:such] a good idea.", pourquoi: "{such} se place avant l'article : {such a}." },
      { faux: "I met Tom, Sam and Ben; [x:the latter] is my cousin.", juste: "I met Tom, Sam and Ben; [k:Ben] is my cousin.", pourquoi: "{the latter} ne vaut que pour deux éléments ; avec trois, on nomme la personne (ou on dit {the last one})." },
    ],
    retenir: "{this} + nom-étiquette pour résumer, {such} pour généraliser, {the former} / {the latter} pour deux éléments.",
  },

  "relatives-luxe": {
    regle:
      "Dans un anglais soigné, les relatives se font plus élégantes. {whom} remplace {who} quand le relatif est complément, surtout après une préposition ({the person to whom I spoke}). La préposition peut passer devant le relatif : {the house in which I grew up} (au lieu de {the house I grew up in}). {whereby} = par lequel, grâce auquel ({a system whereby users pay monthly}). Et {whoever} (quiconque, qui que ce soit), {whatever} (quoi que, tout ce que) et {whichever} (n'importe lequel) introduisent une relative sans antécédent.",
    forme: [
      { nom: "Préposition + whom", modele: "nom + préposition + {whom}", exemple: "the man [k:to whom] I wrote" },
      { nom: "Préposition + which", modele: "nom + préposition + {which}", exemple: "the city [k:in which] she lives" },
      { nom: "Par lequel", modele: "nom + {whereby} + phrase", exemple: "a scheme [k:whereby] students borrow money" },
      { nom: "Quiconque, quoi que", modele: "{whoever} / {whatever} / {whichever} + verbe", exemple: "[k:Whoever] [v:wins] gets a prize." },
    ],
    usages: [
      { quand: "Une lettre formelle", en: "The person [k:to whom] this letter is addressed…", fr: "La personne à qui cette lettre est adressée…" },
      { quand: "Un texte écrit", en: "The period [k:during which] he lived in Paris was crucial.", fr: "La période pendant laquelle il a vécu à Paris a été décisive." },
      { quand: "Un mécanisme", en: "They signed an agreement [k:whereby] both sides cut prices.", fr: "Ils ont signé un accord par lequel les deux parties baissent leurs prix." },
      { quand: "Tout ce que", en: "Take [k:whatever] you need.", fr: "Prends tout ce dont tu as besoin." },
    ],
    francais:
      "Le français place toujours la préposition devant le relatif (« la ville dans laquelle », « la personne à qui ») : l'anglais soutenu fait pareil ({the city in which}, {the person to whom}), alors que l'anglais courant la rejette à la fin ({the city she lives in}). Après une préposition, on emploie {whom} pour une personne et {which} pour une chose, jamais {who} ni {that}.",
    pieges: [
      { faux: "the man to [x:who] I spoke", juste: "the man [k:to whom] I spoke", pourquoi: "Directement après une préposition, on emploie {whom}, jamais {who}." },
      { faux: "the house in [x:that] I was born", juste: "the house [k:in which] I was born", pourquoi: "Après une préposition, {which}, jamais {that}." },
      { faux: "[x:Who] arrives first wins.", juste: "[k:Whoever] [v:arrives] first wins.", pourquoi: "Sans antécédent (« celui qui », « quiconque »), on dit {whoever}." },
    ],
    retenir: "Préposition + {whom} (personne) ou {which} (chose) ; {whereby} = par lequel ; {whoever}, {whatever} = quiconque, quoi que.",
  },

  "verbe-devient-nom": {
    regle:
      "Dans un style formel (rapports, articles, écrits universitaires), on transforme souvent les verbes et les adjectifs en noms : {decide} → {decision}, {develop} → {development}, {arrive} → {arrival}, {fail} → {failure}, {perform} → {performance}, {aware} → {awareness}. La phrase devient plus dense et plus impersonnelle : {Prices increased rapidly} → {There was a rapid increase in prices}. Les suffixes les plus courants : {-tion}, {-ment}, {-al}, {-ure}, {-ance} / {-ence}, {-ness}, {-ity}.",
    forme: [
      { nom: "Verbe → nom", modele: "{-tion} · {-ment} · {-al} · {-ure} · {-ance}", exemple: "[r:decide] → [n:decision]" },
      { nom: "Adjectif → nom", modele: "{-ness} · {-ity} · {-ence}", exemple: "[j:aware] → [n:awareness]" },
      { nom: "La phrase transformée", modele: "{There was a} + adjectif + nom + {in}…", exemple: "There was a [j:sharp] [n:rise] in prices." },
    ],
    usages: [
      { quand: "Un rapport", en: "The [n:introduction] of the new tax caused protests.", fr: "L'introduction du nouvel impôt a provoqué des manifestations." },
      { quand: "Un résumé", en: "Her [n:arrival] changed everything.", fr: "Son arrivée a tout changé." },
      { quand: "Un style objectif", en: "There has been a [j:significant] [n:improvement] in sales.", fr: "Les ventes se sont nettement améliorées." },
    ],
    francais:
      "Le français administratif aime aussi la nominalisation (« la mise en place », « l'amélioration de ») : le mécanisme est familier. En anglais, l'adjectif remplace l'adverbe ({rapidly} → {a rapid increase}) et la préposition qui suit le nom est fixe ({an increase in}, {a demand for}, {an effect on}). Et les suffixes ne correspondent pas toujours au français : {arrival} (arrivée), {failure} (échec), {refusal} (refus).",
    pieges: [
      { faux: "There was a rapid increase [x:of] prices.", juste: "There was a rapid [n:increase] [k:in] prices.", pourquoi: "On dit {an increase in}, {a rise in}, {a fall in} + ce qui change." },
      { faux: "His [x:arrive] surprised us.", juste: "His [n:arrival] surprised us.", pourquoi: "Le nom de {arrive} est {arrival}." },
      { faux: "a [x:rapidly] growth", juste: "a [j:rapid] [n:growth]", pourquoi: "Devant un nom, l'adverbe devient adjectif : {rapidly} → {rapid}." },
    ],
    retenir: "Style formel : verbe → nom ({-tion}, {-ment}, {-al}…), adverbe → adjectif, et la bonne préposition.",
  },

  nuance: {
    regle:
      "En anglais universitaire et professionnel, on évite les affirmations trop catégoriques. On adoucit avec des verbes ({seem to}, {appear to}, {tend to}, {suggest}, {indicate}), des modaux ({may}, {might}, {could}), des adverbes ({arguably}, {possibly}, {probably}, {relatively}, {largely}) et des formules impersonnelles ({It could be argued that…}, {It is likely that…}, {To some extent…}). Cette prudence n'est pas de la faiblesse : elle montre qu'on pèse ses mots et qu'on laisse une place aux autres avis.",
    forme: [
      { nom: "Un verbe prudent", modele: "{seem to} / {appear to} / {tend to} + base", exemple: "Prices [v:tend to] [r:rise] in summer." },
      { nom: "Un adverbe", modele: "{arguably} · {probably} · {largely} + …", exemple: "It is [k:arguably] the best solution." },
      { nom: "Une formule impersonnelle", modele: "{It could be argued that} / {It is likely that} + phrase", exemple: "[k:It is likely that] costs will rise." },
    ],
    usages: [
      { quand: "Un résultat d'étude", en: "The results [v:seem to] [r:suggest] a link.", fr: "Les résultats semblent indiquer un lien." },
      { quand: "Une opinion nuancée", en: "[k:To some extent], this is true.", fr: "Dans une certaine mesure, c'est vrai." },
      { quand: "Une critique polie", en: "This approach [k:may not] be the most effective.", fr: "Cette approche n'est peut-être pas la plus efficace." },
    ],
    francais:
      "Le français a les mêmes outils (« il semblerait que », « dans une certaine mesure », « on pourrait soutenir que »), mais l'anglais professionnel les emploie beaucoup plus systématiquement. Un {This is wrong} trop direct peut paraître agressif dans un e-mail ou un rapport ; {This may not be entirely accurate} passe beaucoup mieux.",
    pieges: [
      { faux: "The study [x:proves] that the drug works.", juste: "The study [v:suggests] that the drug works.", pourquoi: "Dans un texte scientifique, {prove} est trop catégorique : on préfère {suggest} ou {indicate}." },
      { faux: "It [x:seems be] true.", juste: "It [v:seems to] [r:be] true.", pourquoi: "{seem} est suivi de {to} + base." },
    ],
    retenir: "Pour nuancer : {seem to}, {tend to}, {may}, {arguably}, {to some extent}, {It could be argued that…}",
  },

  panneaux: {
    regle:
      "Les connecteurs logiques guident le lecteur dans un raisonnement. Pour ajouter : {moreover}, {furthermore}, {in addition}, {what is more}. Pour opposer : {however}, {nevertheless}, {nonetheless}, {on the other hand}, {whereas}. Pour conclure ou déduire : {therefore}, {thus}, {consequently}, {as a result}, {hence}. Pour poser une condition : {provided that}, {as long as}, {unless}. Pour illustrer : {for instance}, {such as}, {namely}. Les connecteurs qui relient deux phrases ({moreover}, {however}, {therefore}) se placent en tête de la seconde, suivis d'une virgule.",
    forme: [
      { nom: "Ajouter", modele: "Phrase. {Moreover}, / {Furthermore}, phrase.", exemple: "[k:Moreover], it is cheaper." },
      { nom: "Opposer", modele: "Phrase. {Nevertheless}, / {However}, phrase.", exemple: "[k:Nevertheless], we continued." },
      { nom: "Conclure", modele: "Phrase. {Therefore}, / {As a result}, phrase.", exemple: "[k:Therefore], we must act now." },
      { nom: "Illustrer", modele: "… {such as} + nom · {For instance},…", exemple: "big cities [k:such as] London" },
    ],
    usages: [
      { quand: "Une dissertation", en: "The plan is expensive. [k:Moreover], it is risky.", fr: "Le projet est coûteux. De plus, il est risqué." },
      { quand: "Une objection", en: "It was difficult. [k:Nevertheless], they succeeded.", fr: "C'était difficile. Néanmoins, ils ont réussi." },
      { quand: "Une conséquence", en: "Sales fell. [k:As a result], the shop closed.", fr: "Les ventes ont chuté. Par conséquent, la boutique a fermé." },
    ],
    francais:
      "Les connecteurs anglais ressemblent souvent aux français (« néanmoins », « par conséquent », « de plus »), mais leur ponctuation diffère : une virgule après le connecteur en tête de phrase, et jamais deux phrases complètes reliées par une simple virgule avec {however} ou {therefore}. Le piège le plus sournois : « d'autre part », qui ajoute une idée en français, ne se traduit pas par {on the other hand}, qui annonce un contraste.",
    pieges: [
      { faux: "It's cheap. [x:On the other hand], it's fast.", juste: "It's cheap. [k:Moreover], it's fast.", pourquoi: "Pour ajouter (« d'autre part »), {moreover} ou {in addition} ; {on the other hand} veut dire « en revanche »." },
      { faux: "It's expensive[x:, therefore] we didn't buy it.", juste: "It's expensive; [k:therefore], we didn't buy it.", pourquoi: "{therefore} ne relie pas deux phrases avec une simple virgule : point-virgule ou point." },
      { faux: "big cities [x:like for example] London", juste: "big cities [k:such as] London", pourquoi: "Dans un texte soigné, pour donner des exemples : {such as}, sans cumuler deux connecteurs." },
    ],
    retenir: "Ajouter : {moreover} ; opposer : {nevertheless}, {on the other hand} ; conclure : {therefore} ; illustrer : {such as}.",
  },

  "marqueurs-oral": {
    regle:
      "À l'oral, les anglophones emploient de petits mots qui organisent la conversation. {actually} corrige ou nuance (« en fait » : {Actually, I'm not sure}). {anyway} ramène au sujet principal ou clôt une parenthèse (« bref », « enfin bon »). {I mean} reformule ou précise (« je veux dire »). {by the way} introduit un nouveau sujet (« au fait »). {mind you} ajoute une restriction (« remarque », « cela dit »). {you know} et {kind of} adoucissent. {Right} et {So} ouvrent ou relancent l'échange.",
    forme: [
      { nom: "Corriger", modele: "{Actually},…", exemple: "[k:Actually], it's on Tuesday." },
      { nom: "Revenir au sujet", modele: "{Anyway},…", exemple: "[k:Anyway], let's get back to work." },
      { nom: "Changer de sujet", modele: "{By the way},…", exemple: "[k:By the way], did you call Sam?" },
      { nom: "Nuancer", modele: "{Mind you},…", exemple: "He's rude. [k:Mind you], he's honest." },
    ],
    usages: [
      { quand: "Rectifier poliment", en: "[k:Actually], I think you're wrong.", fr: "En fait, je crois que tu te trompes." },
      { quand: "Préciser sa pensée", en: "It's expensive. [k:I mean], it's really expensive.", fr: "C'est cher. Je veux dire, c'est vraiment cher." },
      { quand: "Clore une parenthèse", en: "[k:Anyway], what were we saying?", fr: "Bref, qu'est-ce qu'on disait ?" },
      { quand: "Ajouter un bémol", en: "The hotel was noisy. [k:Mind you], it was cheap.", fr: "L'hôtel était bruyant. Remarque, il n'était pas cher." },
    ],
    francais:
      "Ces mots sont l'équivalent de nos « en fait », « bref », « je veux dire », « au fait », « remarque » : ils rendent l'anglais naturel, à condition de ne pas en abuser. {actually} veut dire « en fait, en réalité », jamais « actuellement » ({currently}). Et {anyway} a deux usages : « de toute façon » ({I'll go anyway}) et, en tête de phrase, « bref » pour revenir au sujet.",
    pieges: [
      { faux: "I'm [x:actually] unemployed, but I have an interview next week.", juste: "I'm [k:currently] unemployed, but I have an interview next week.", pourquoi: "« Actuellement, en ce moment » se dit {currently} ; {actually} veut dire « en fait »." },
    ],
    retenir: "{actually} = en fait · {anyway} = bref · {I mean} = je veux dire · {by the way} = au fait · {mind you} = remarque.",
  },

  "couples-inseparables": {
    regle:
      "Une collocation est une association de mots que l'usage a figée : les anglophones disent {heavy rain} (une forte pluie), {strong coffee} (un café fort), {make a decision} (prendre une décision), {highly likely} (très probable), {take a photo}, {pay attention}. Les mots voisins ({strong}, {heavy}, {big}) ne sont pas interchangeables : {strong rain} ou {make a photo} se comprennent, mais sonnent étrangers. Les collocations s'apprennent par blocs, en lisant et en écoutant.",
    forme: [
      { nom: "Adjectif + nom", modele: "{heavy rain} · {strong coffee} · {a heavy smoker}", exemple: "[j:heavy] [n:traffic]" },
      { nom: "Verbe + nom", modele: "{make a decision} · {take a photo} · {pay attention}", exemple: "[v:make] a [n:mistake]" },
      { nom: "Adverbe + adjectif", modele: "{highly likely} · {deeply sorry} · {fully aware}", exemple: "[k:highly] [j:unlikely]" },
    ],
    usages: [
      { quand: "La météo", en: "We had [j:heavy] [n:rain] last night.", fr: "Il a plu très fort cette nuit." },
      { quand: "Une décision", en: "We need to [v:make] a [n:decision] today.", fr: "Nous devons prendre une décision aujourd'hui." },
      { quand: "Une probabilité", en: "It's [k:highly] [j:likely] to snow.", fr: "Il va très probablement neiger." },
      { quand: "L'attention", en: "Please [v:pay] [n:attention].", fr: "Faites attention, s'il vous plaît." },
    ],
    francais:
      "Le français a ses propres couples (« prendre une décision », « une forte pluie », « un gros fumeur »), qui ne se traduisent pas mot à mot : « prendre une décision » donne surtout {make a decision} ({take a decision} existe en britannique, mais il est moins courant), « prendre une photo » donne {take a photo}, et « faire attention » donne {pay attention}. Le bon réflexe : noter les mots qui vont ensemble, plutôt que des mots isolés.",
    pieges: [
      { faux: "There was [x:strong] traffic.", juste: "There was [j:heavy] [n:traffic].", pourquoi: "On dit {heavy traffic}, comme {heavy rain}." },
      { faux: "Can you [x:do] a photo of us?", juste: "Can you [v:take] a [n:photo] of us?", pourquoi: "« Prendre une photo » : {take a photo}." },
      { faux: "Please [x:make] attention.", juste: "Please [v:pay] [n:attention].", pourquoi: "« Faire attention » : {pay attention}." },
    ],
    retenir: "Les mots vont par couples : {heavy rain}, {make a decision}, {take a photo}, {pay attention}, {highly likely}.",
  },

  ponctuation: {
    regle:
      "En anglais, la ponctuation change parfois le sens. Pas de virgule devant {that}, ni dans une relative essentielle, ni après un verbe ({I think that…}). Les virgules encadrent une information en bonus (relative non déterminative). Dans une liste, la virgule avant {and} (la « virgule d'Oxford ») est facultative : {red, white(,) and blue}. Le point-virgule relie deux phrases complètes étroitement liées ; les deux-points annoncent une explication ou une liste. L'apostrophe marque la contraction ({it's} = {it is}) ou la possession ({Tom's}), jamais un pluriel.",
    forme: [
      { nom: "Relative essentielle", modele: "nom + {that} / {who}… (sans virgule)", exemple: "The book that I bought is great." },
      { nom: "Information en bonus", modele: "nom, {which} / {who}…, suite", exemple: "My sister, who lives in Rome, is a nurse." },
      { nom: "Point-virgule", modele: "phrase complète ; phrase complète", exemple: "It was late; we went home." },
      { nom: "Apostrophe", modele: "{it's} = {it is} · {its} = possessif · pluriel sans apostrophe", exemple: "It's late. The cat ate its food." },
    ],
    usages: [
      { quand: "Deux phrases liées", en: "I love London; it's full of surprises.", fr: "J'adore Londres : la ville est pleine de surprises." },
      { quand: "Une annonce", en: "You need three things: patience, time and money.", fr: "Il te faut trois choses : de la patience, du temps et de l'argent." },
      { quand: "Une virgule qui informe", en: "My brother, who lives in Paris, is a doctor.", fr: "Mon frère, qui vit à Paris, est médecin (je n'ai qu'un frère)." },
    ],
    francais:
      "Le français met une espace avant « : » et « ; » et emploie les guillemets « » ; l'anglais n'a pas d'espace et utilise {“ ”}. La virgule est aussi plus rare en anglais devant « que » ({that}). Et l'apostrophe ne forme jamais un pluriel : {the 1990s}, {CDs}, {tomatoes}, sans apostrophe.",
    pieges: [
      { faux: "I think[x:,] that you're right.", juste: "I think that you're right.", pourquoi: "Pas de virgule devant {that} après un verbe." },
      { faux: "Fresh [x:tomato's] for sale!", juste: "Fresh tomatoes for sale!", pourquoi: "L'apostrophe ne forme jamais un pluriel." },
      { faux: "It was raining[x:,] we stayed home.", juste: "It was raining; we stayed home.", pourquoi: "Deux phrases complètes ne se relient pas par une simple virgule : point-virgule, point, ou conjonction ({so})." },
    ],
    retenir: "Pas de virgule devant {that} ; un point-virgule entre deux phrases ; jamais d'apostrophe pour un pluriel.",
  },

  "deux-costumes": {
    regle:
      "L'anglais a deux réservoirs de vocabulaire. Les mots courts, souvent d'origine germanique, et les {phrasal verbs} servent au quotidien et à l'oral : {buy}, {start}, {get}, {find out}, {put off}. Les mots longs, d'origine latine ou française, servent au registre formel, à l'écrit et dans les contextes officiels : {purchase}, {commence}, {obtain}, {discover}, {postpone}. Le registre se voit aussi dans la grammaire : les contractions ({don't}, {I'm}) sont familières ; les formes pleines ({do not}, {I am}) et le passif, plus formels.",
    forme: [
      { nom: "Familier", modele: "mots courts · {phrasal verbs} · contractions", exemple: "We [v:put] [k:off] the meeting." },
      { nom: "Formel", modele: "mots latins · formes pleines · passif", exemple: "The meeting [a:has been] [p:postponed]." },
    ],
    usages: [
      { quand: "Entre amis", en: "Can you [v:find] [k:out] when it starts?", fr: "Tu peux te renseigner sur l'heure du début ?" },
      { quand: "Dans un e-mail officiel", en: "Could you [v:inform] us of the start time?", fr: "Pourriez-vous nous communiquer l'heure de début ?" },
      { quand: "Un achat", en: "I [v:bought] a car. · The company [v:purchased] new equipment.", fr: "J'ai acheté une voiture. · L'entreprise a acquis du matériel neuf." },
    ],
    francais:
      "Bonne nouvelle pour les francophones : les mots formels anglais ressemblent souvent au français ({commence}, {obtain}, {require}, {assist}). Mauvaise nouvelle : à l'oral, ils sonnent pompeux ({I will commence my breakfast} fait sourire). Le bon réflexe : les mots latins pour écrire un rapport, les mots courts et les {phrasal verbs} pour parler naturellement.",
    pieges: [
      { faux: "Hi Tom! I [x:require your assistance] with my homework.", juste: "Hi Tom! I [v:need] your [n:help] with my homework.", pourquoi: "Entre amis, {require} et {assistance} sont trop formels : {need} et {help}." },
      { faux: "Dear Sir, I [x:wanna] know the price.", juste: "Dear Sir, I [v:would like to] know the price.", pourquoi: "Dans une lettre formelle, pas de forme familière comme {wanna} : {I would like to}." },
    ],
    retenir: "Familier : mots courts et {phrasal verbs}. Formel : mots latins et formes pleines.",
  },

  "ce-qui-passe-devant": {
    regle:
      "Dans un anglais soutenu, on peut faire passer un élément en tête de phrase pour le mettre en relief. Adjectif + {as} / {though} + sujet + verbe = aussi… que : {Strange as it may seem, he was right}. {Much as} + sujet + verbe = bien que, même si (avec un sentiment) : {Much as I like him, I can't agree}. {Try as} + sujet + {might} = on a beau essayer : {Try as I might, I couldn't open it}. {Such} + {be} + sujet + {that} = tel était… que : {Such was his anger that he left}. Et après un participe ou un lieu en tête, le sujet passe après le verbe : {Gone are the days when…}, {Here comes the bus}.",
    forme: [
      { nom: "Aussi… que", modele: "adjectif + {as} + sujet + verbe", exemple: "[j:Tired] [k:as] she was, she kept going." },
      { nom: "Bien que", modele: "{Much as} + sujet + verbe", exemple: "[k:Much as] I love her, I disagree." },
      { nom: "On a beau", modele: "{Try as} + sujet + {might}", exemple: "[k:Try as] he [a:might], he failed." },
      { nom: "Tel était… que", modele: "{Such} + {be} + sujet + {that}…", exemple: "[k:Such] [a:was] the noise [k:that] nobody slept." },
      { nom: "Participe en tête", modele: "participe + {be} + sujet", exemple: "[p:Gone] [a:are] the days of cheap travel." },
    ],
    usages: [
      { quand: "Un aveu", en: "[j:Strange] [k:as] it may seem, I enjoy the rain.", fr: "Aussi étrange que cela puisse paraître, j'aime la pluie." },
      { quand: "Une concession", en: "[k:Much as] I'd like to help, I can't.", fr: "J'aimerais beaucoup t'aider, mais je ne peux pas." },
      { quand: "Un effort vain", en: "[k:Try as] we [a:might], we couldn't find it.", fr: "Nous avons eu beau chercher, nous ne l'avons pas trouvé." },
      { quand: "Une nostalgie", en: "[p:Gone] [a:are] the days when we played outside.", fr: "Elle est loin, l'époque où nous jouions dehors." },
    ],
    francais:
      "Le français a des tournures proches : « aussi étrange que cela paraisse », « j'ai beau essayer », « telle était sa colère que… », « finie l'époque où… ». Ces constructions anglaises sont littéraires ou journalistiques : à réserver à l'écrit soigné et aux discours. Et dans {Strange as it may seem}, {as} ne veut pas dire « comme » : il porte l'idée de « bien que ».",
    pieges: [
      { faux: "[x:Such his anger was] that he left.", juste: "[k:Such] [a:was] his anger [k:that] he left.", pourquoi: "Après {Such} en tête, le verbe {be} passe devant le sujet : {Such was his anger…}" },
      { faux: "[x:Gone the days are] of cheap flights.", juste: "[p:Gone] [a:are] the days of cheap flights.", pourquoi: "Après le participe en tête, on inverse : {be} + sujet." },
    ],
    retenir: "Pour frapper fort : {Strange as it seems…}, {Much as I…}, {Try as I might…}, {Such was… that}, {Gone are…}",
  },

  "phrase-suspendue": {
    regle:
      "Une construction absolue est un petit groupe sans verbe conjugué, avec son propre sujet, placé en tête ou en fin de phrase : un nom suivi d'un participe, d'un adjectif ou d'un complément. Elle pose un décor, une cause ou une circonstance : {The work finished, we went home} (le travail terminé, nous sommes rentrés) ; {Weather permitting, we'll eat outside} (si le temps le permet) ; {She stood there, her eyes full of tears}. À l'inverse, un participe seul en tête de phrase n'a pas de sujet propre : il doit renvoyer au sujet de la proposition principale, sinon la phrase devient absurde (le « participe suspendu »).",
    forme: [
      { nom: "Nom + participe", modele: "nom + {-ing} ou participe passé, proposition principale", exemple: "[n:The film] [p:over], we left." },
      { nom: "Nom + complément", modele: "proposition, + nom + adjectif ou préposition…", exemple: "He walked in, [n:hands] in his pockets." },
      { nom: "Participe seul", modele: "participe, + sujet identique", exemple: "[r:Arriv][t:ing] late, I missed the start." },
    ],
    usages: [
      { quand: "Une condition", en: "[n:Weather] [r:permit][t:ting], the match will be played.", fr: "Si le temps le permet, le match aura lieu." },
      { quand: "Un bilan", en: "[n:All things] [p:considered], it was a success.", fr: "Tout bien considéré, ce fut un succès." },
      { quand: "Un portrait", en: "She waited, [n:her heart] [r:pound][t:ing].", fr: "Elle attendait, le cœur battant." },
    ],
    francais:
      "Le français connaît très bien la construction absolue (« le travail terminé, nous sommes partis », « le cœur battant ») ; l'anglais fonctionne de la même façon, souvent avec un possessif là où le français met un article ({her eyes full of tears} : les yeux pleins de larmes). Le vrai piège est le participe sans sujet propre : il doit renvoyer au sujet principal, en anglais comme en français.",
    pieges: [
      { faux: "[x:Being a rainy day], we stayed home.", juste: "[n:It] [r:be][t:ing] a rainy day, we stayed home.", pourquoi: "Ce n'est pas {we} qui est un jour de pluie : le participe a besoin de son propre sujet, {It being…}" },
      { faux: "[x:Looking out of the window, the mountains were beautiful].", juste: "[r:Look][t:ing] out of the window, I saw beautiful mountains.", pourquoi: "Ce ne sont pas les montagnes qui regardent : le participe doit renvoyer au sujet de la principale." },
    ],
    retenir: "Construction absolue : nom + participe ({The work done,…}) ; participe seul : même sujet que la principale.",
  },

  "images-parlent": {
    regle:
      "Une expression idiomatique ({idiom}) a un sens qu'on ne peut pas deviner à partir des mots qui la composent : {It's raining cats and dogs} (il pleut des cordes), {to break the ice} (briser la glace), {a piece of cake} (du gâteau, très facile), {to cost an arm and a leg} (coûter les yeux de la tête), {to be over the moon} (être aux anges), {once in a blue moon} (tous les trente-six du mois). Certaines ressemblent au français ; beaucoup d'autres utilisent une image totalement différente.",
    forme: [
      { nom: "Même image", modele: "image anglaise = image française", exemple: "to [v:break] the ice" },
      { nom: "Autre image", modele: "image anglaise ≠ image française", exemple: "It [v:costs] an arm and a leg." },
    ],
    usages: [
      { quand: "La pluie", en: "It's raining cats and dogs!", fr: "Il pleut des cordes !" },
      { quand: "Un examen facile", en: "The exam was a piece of cake.", fr: "L'examen, c'était du gâteau." },
      { quand: "Une grande joie", en: "She was over the moon with her results.", fr: "Elle était aux anges en voyant ses résultats." },
      { quand: "Un prix exorbitant", en: "This bag [v:cost] me an arm and a leg.", fr: "Ce sac m'a coûté les yeux de la tête." },
    ],
    francais:
      "Le français et l'anglais partagent quelques images (« briser la glace », « jouer avec le feu » = {play with fire}), mais la plupart du temps, il faut traduire le sens et non les mots : {It rains ropes} pour « il pleut des cordes » ne voudrait rien dire. Les {idioms} s'emploient surtout à l'oral et dans un registre familier : à doser avec prudence dans un texte formel.",
    pieges: [
      { faux: "It's raining [x:ropes]!", juste: "It's raining cats and dogs!", pourquoi: "« Il pleut des cordes » prend une autre image en anglais : {cats and dogs}." },
      { faux: "It cost me [x:the eyes of the head].", juste: "It cost me an arm and a leg.", pourquoi: "« Les yeux de la tête » se dit {an arm and a leg}." },
    ],
    retenir: "Un {idiom} se traduit par son sens, jamais mot à mot.",
  },

  "mots-cameleons": {
    regle:
      "En anglais, beaucoup de mots changent de classe sans changer de forme : c'est la conversion. Un nom devient verbe ({a text} → {to text someone}, {an email} → {to email}), un verbe devient nom ({to run} → {a run}, {to drink} → {a drink}). Les préfixes et suffixes créent aussi des familles de mots : {un-}, {im-}, {in-}, {dis-} (le contraire : {unhappy}, {impolite}, {disagree}), {mis-} (mal : {misunderstand}), {re-} (de nouveau : {rewrite}), {over-} (trop : {overcook}) ; {-ness} (un nom : {kindness}), {-less} (sans : {homeless}), {-ful} (plein de : {careful}), {-ship} ({friendship}), {-able} ({readable}).",
    forme: [
      { nom: "Nom → verbe", modele: "même forme", exemple: "[v:Text] me when you arrive." },
      { nom: "Verbe → nom", modele: "{a} / {the} + même forme", exemple: "Let's go for [d:a] [n:walk]." },
      { nom: "Préfixes", modele: "{un-} · {dis-} · {mis-} · {re-} · {over-}", exemple: "[t:mis][r:understand]" },
      { nom: "Suffixes", modele: "{-ness} · {-less} · {-ful} · {-ship} · {-able}", exemple: "[r:care][t:less]" },
    ],
    usages: [
      { quand: "Un verbe venu d'un nom", en: "Can you [v:email] me the file?", fr: "Tu peux m'envoyer le fichier par e-mail ?" },
      { quand: "Un nom venu d'un verbe", en: "I need [d:a] [n:rest].", fr: "J'ai besoin d'une pause." },
      { quand: "Un contraire", en: "That's [t:un][r:fair]!", fr: "Ce n'est pas juste !" },
      { quand: "Un adjectif en -less", en: "This old phone is [r:use][t:less].", fr: "Ce vieux téléphone ne sert à rien." },
    ],
    francais:
      "Le français doit presque toujours ajouter une terminaison pour changer de classe (« un texto » → « envoyer un texto »). L'anglais recycle le même mot : {to text}, {to bottle}, {to water the plants}. Pour comprendre, regarde la place du mot dans la phrase : après un sujet, c'est un verbe ; après {a} ou {the}, c'est un nom. Et {-less} veut dire « sans » ({careless} = négligent), pas « moins ».",
    pieges: [
      { faux: "Can you [x:make me a text]?", juste: "Can you [v:text] me?", pourquoi: "{text} est aussi un verbe : {text someone}, envoyer un texto à quelqu'un." },
      { faux: "He's very [x:unpolite].", juste: "He's very [t:im][r:polite].", pourquoi: "Le contraire de {polite} est {impolite} : chaque adjectif a son préfixe ({un-}, {im-}, {in-}, {dis-}), à vérifier." },
      { faux: "I [x:disunderstood] the question.", juste: "I [t:mis][v:understood] the question.", pourquoi: "« Mal comprendre » se dit avec {mis-} : {misunderstand}." },
    ],
    retenir: "Même forme, autre rôle : c'est la place du mot qui décide. Préfixes {un-}, {dis-}, {mis-}, {re-} ; suffixes {-ness}, {-less}, {-ful}.",
  },

  "deux-rives": {
    regle:
      "L'anglais britannique et l'anglais américain se comprennent parfaitement, mais diffèrent sur quelques points. L'orthographe : {colour} / {color}, {centre} / {center}, {organise} / {organize}, {travelled} / {traveled}. Le vocabulaire : {flat} / {apartment}, {holiday} / {vacation}, {lift} / {elevator}, {autumn} / {fall}, {mobile} / {cell phone}, {queue} / {line}, {biscuit} / {cookie}. La grammaire : {have got} est plus britannique ; les Américains emploient plus volontiers le prétérit là où les Britanniques mettent le present perfect ({Did you eat yet?} / {Have you eaten yet?}), et disent {on the weekend} plutôt que {at the weekend}. Les dates, enfin : {3 May} au Royaume-Uni, {May 3} aux États-Unis.",
    forme: [
      { nom: "Orthographe", modele: "{-our} / {-or} · {-re} / {-er} · {-ise} / {-ize}", exemple: "colour / color" },
      { nom: "Vocabulaire", modele: "{flat} / {apartment} · {holiday} / {vacation}", exemple: "a flat · an apartment" },
      { nom: "Grammaire", modele: "{Have you got…?} (UK) · {Do you have…?} (US)", exemple: "Have you got a car? / Do you have a car?" },
    ],
    usages: [
      { quand: "Les vacances", en: "We're going on holiday. / We're going on vacation.", fr: "Nous partons en vacances." },
      { quand: "Le logement", en: "They live in a flat. / They live in an apartment.", fr: "Ils habitent dans un appartement." },
      { quand: "Le week-end", en: "See you at the weekend. / See you on the weekend.", fr: "À ce week-end." },
    ],
    francais:
      "Pour un francophone, le plus simple est de choisir une variété et de s'y tenir dans un même texte (orthographe et vocabulaire), sans s'inquiéter : les deux sont correctes. Les manuels scolaires français suivent plutôt l'anglais britannique, les films et les séries plutôt l'américain. Attention à quelques mots qui changent de sens d'une rive à l'autre : {pants} = slip (UK) mais pantalon (US) ; {first floor} = premier étage (UK) mais rez-de-chaussée (US).",
    pieges: [
      { faux: "In London, I live on the [x:first floor], at street level.", juste: "In London, I live on the [k:ground floor], at street level.", pourquoi: "En britannique, le niveau de la rue est le {ground floor} ; le {first floor} est le premier étage (en américain, {first floor} désigne le rez-de-chaussée)." },
    ],
    retenir: "Deux rives, une seule langue : choisis une variété et reste cohérent dans un même texte.",
  },
};
