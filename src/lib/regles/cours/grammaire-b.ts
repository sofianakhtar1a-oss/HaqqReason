import type { Cours } from "../types";

/**
 * Grammaire, paliers B1 et B2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [k:who].
 */
export const COURS: Record<string, Cours> = {
  agrafes: {
    regle:
      "Un pronom relatif relie une information à un nom sans le répéter : {The man who lives here is a doctor}. {who} s'emploie pour une personne, {which} pour une chose ou un animal, {that} pour les deux (dans une relative qui précise de qui ou de quoi l'on parle). {where} renvoie à un lieu ({the town where I was born}), {whose} exprime la possession ({the girl whose bike was stolen} : la fille dont le vélo a été volé). Quand le relatif est complément, on peut l'omettre : {the book (that) I'm reading}.",
    forme: [
      { nom: "Une personne", modele: "nom + {who} / {that} + verbe", exemple: "the woman [k:who] [v:called]" },
      { nom: "Une chose", modele: "nom + {which} / {that} + …", exemple: "the car [k:which] I bought" },
      { nom: "Un lieu, un possesseur", modele: "nom + {where} · nom + {whose} + nom", exemple: "the man [k:whose] dog barks" },
      { nom: "Relatif complément", modele: "nom + (relatif) + sujet + verbe", exemple: "the film (that) [s:we] [v:saw]" },
    ],
    usages: [
      { quand: "Préciser une personne", en: "The girl [k:who] sits next to me is Spanish.", fr: "La fille qui est assise à côté de moi est espagnole." },
      { quand: "Préciser une chose", en: "This is the book [k:that] changed my life.", fr: "C'est le livre qui a changé ma vie." },
      { quand: "Un lieu", en: "That's the café [k:where] we met.", fr: "C'est le café où nous nous sommes rencontrés." },
      { quand: "La possession", en: "I have a friend [k:whose] father is a pilot.", fr: "J'ai un ami dont le père est pilote." },
    ],
    francais:
      "Le français distingue « qui » (sujet) et « que » (complément) ; l'anglais distingue la personne ({who}) et la chose ({which}), et {that} convient aux deux. « Dont » se traduit par {whose} quand il exprime la possession. Enfin, l'anglais peut supprimer le relatif complément, ce que le français ne fait jamais : {the man I love} (l'homme que j'aime).",
    pieges: [
      { faux: "The man [x:which] lives here.", juste: "The man [k:who] lives here.", pourquoi: "Pour une personne : {who} (ou {that}), pas {which}." },
      { faux: "The book that I read [x:it].", juste: "The book [k:that] I read.", pourquoi: "Le relatif remplace déjà le nom : on ne le répète pas avec {it}." },
      { faux: "The girl [x:who's] father is a doctor.", juste: "The girl [k:whose] father is a doctor.", pourquoi: "La possession (« dont le père ») se dit {whose} ; {who's} veut dire {who is}." },
    ],
    retenir: "{who} = personne, {which} = chose, {that} = les deux, {where} = lieu, {whose} = possession.",
  },

  "ing-ou-to": {
    regle:
      "Quand deux verbes se suivent, c'est le premier qui décide de la forme du second. Certains veulent {-ing} : {enjoy}, {avoid}, {finish}, {mind}, {suggest}, {keep}, {practise}, {miss}, {can't stand} ({I enjoy reading}). D'autres veulent {to} + base : {want}, {decide}, {hope}, {plan}, {promise}, {agree}, {refuse}, {need}, {learn}, {would like} ({I want to leave}). Après une préposition, toujours {-ing} : {I'm good at drawing}, {before leaving}. Quelques verbes acceptent les deux sans changer de sens : {like}, {love}, {hate}, {start}, {begin}, {continue}.",
    forme: [
      { nom: "Verbe + -ing", modele: "{enjoy} / {avoid} / {finish} / {mind} + {-ing}", exemple: "I [v:enjoy] [r:cook][t:ing]." },
      { nom: "Verbe + to", modele: "{want} / {decide} / {hope} / {plan} + {to} + base", exemple: "She [v:decided] [k:to] [r:leave]." },
      { nom: "Préposition + -ing", modele: "préposition + verbe en {-ing}", exemple: "He's good [k:at] [r:draw][t:ing]." },
    ],
    usages: [
      { quand: "Une activité qu'on évite", en: "He [v:avoids] [r:driv][t:ing] at night.", fr: "Il évite de conduire la nuit." },
      { quand: "Un projet", en: "We [v:hope] [k:to] [r:see] you soon.", fr: "Nous espérons te voir bientôt." },
      { quand: "Après une préposition", en: "Thanks [k:for] [r:help][t:ing] me.", fr: "Merci de m'avoir aidé." },
    ],
    francais:
      "Le français met presque toujours un infinitif après un verbe (« j'aime lire », « j'évite de conduire », « merci de m'aider »). L'anglais oblige à choisir, et le choix s'apprend verbe par verbe. Le piège le plus fréquent est la préposition : en français, elle est suivie d'un infinitif (« avant de partir ») ; en anglais, toujours d'un {-ing} ({before leaving}).",
    pieges: [
      { faux: "I finished [x:to write] the report.", juste: "I [v:finished] [r:writ][t:ing] the report.", pourquoi: "{finish} est suivi de {-ing}." },
      { faux: "She wants [x:going] home.", juste: "She [v:wants] [k:to] [r:go] home.", pourquoi: "{want} est suivi de {to} + base." },
      { faux: "Before [x:to leave], close the door.", juste: "Before [r:leav][t:ing], close the door.", pourquoi: "Après une préposition ({before}, {after}, {without}, {for}…), toujours {-ing}." },
    ],
    retenir: "C'est le premier verbe qui décide : {enjoy} + {-ing}, {want} + {to} ; après une préposition, {-ing}.",
  },

  "vouloir-que": {
    regle:
      "Pour dire qu'on veut, qu'on demande ou qu'on attend que quelqu'un fasse quelque chose, l'anglais n'utilise pas « que » + subjonctif. Il place la personne directement après le verbe, puis {to} + base : {I want you to come} (je veux que tu viennes, littéralement « je te veux venir »). Même structure avec {would like}, {ask}, {tell}, {expect}, {allow}, {advise}, {remind}. Pour la négation, {not} se place devant {to} : {I told him not to wait}. Et le pronom se met à la forme complément : {me}, {him}, {her}, {us}, {them}.",
    forme: [
      { nom: "Vouloir que", modele: "{want} / {would like} + personne + {to} + base", exemple: "I [v:want] [o:you] [k:to] [r:stay]." },
      { nom: "Demander, dire de", modele: "{ask} / {tell} + personne + {to} + base", exemple: "She [v:asked] [o:me] [k:to] [r:help]." },
      { nom: "Négation", modele: "… + personne + {not to} + base", exemple: "He [v:told] [o:us] [k:not to] [r:worry]." },
    ],
    usages: [
      { quand: "Un souhait", en: "[s:I][a:'d like] [o:you] [k:to] [r:meet] my parents.", fr: "J'aimerais que tu rencontres mes parents." },
      { quand: "Une attente", en: "They [v:expect] [o:us] [k:to] [r:arrive] early.", fr: "Ils s'attendent à ce que nous arrivions tôt." },
      { quand: "Une consigne", en: "The teacher [v:told] [o:them] [k:not to] [r:talk].", fr: "Le professeur leur a dit de ne pas parler." },
    ],
    francais:
      "C'est l'une des constructions qui trahissent le plus vite un francophone : {I want that you come} calque « je veux que tu viennes », mais c'est faux en anglais. Le réflexe à prendre : verbe + personne (à la forme complément) + {to} + base. Même chose pour « je voudrais que », « il m'a demandé de », « elle attend que ».",
    pieges: [
      { faux: "I want [x:that you come].", juste: "I [v:want] [o:you] [k:to] [r:come].", pourquoi: "Après {want}, jamais de {that} : personne + {to} + base." },
      { faux: "She asked [x:to me] to wait.", juste: "She [v:asked] [o:me] [k:to] [r:wait].", pourquoi: "{ask} se construit directement avec la personne, sans {to} devant elle." },
      { faux: "I told him [x:to not] go.", juste: "I [v:told] [o:him] [k:not to] [r:go].", pourquoi: "La négation se place devant {to} : {not to go}." },
    ],
    retenir: "Je veux que tu viennes = {I want you to come} : verbe + personne + {to} + base.",
  },

  "obliger-laisser": {
    regle:
      "{make} + personne + base = obliger, faire faire ({My boss made me work late}, {She made me laugh} : elle m'a fait rire). {let} + personne + base = laisser, permettre ({Let me help you}). {help} + personne + base (ou {to} + base) = aider à ({He helped me move}). Après {make} et {let}, jamais de {to}. Au passif, {let} ne s'emploie pas : on dit {be allowed to} (avoir le droit de) ; et {make} redevient {be made to} + base ({We were made to wait}).",
    forme: [
      { nom: "Obliger", modele: "{make} + personne + base", exemple: "She [v:made] [o:me] [r:apologise]." },
      { nom: "Laisser", modele: "{let} + personne + base", exemple: "[v:Let] [o:me] [r:know]." },
      { nom: "Aider", modele: "{help} + personne + ({to}) base", exemple: "He [v:helped] [o:us] [r:carry] the boxes." },
      { nom: "Avoir le droit", modele: "{be allowed to} + base", exemple: "We [a:are allowed to] [r:leave] early." },
    ],
    usages: [
      { quand: "Une émotion provoquée", en: "This song [v:makes] [o:me] [r:cry].", fr: "Cette chanson me fait pleurer." },
      { quand: "Une permission", en: "My parents [v:let] [o:me] [r:go] out on Saturdays.", fr: "Mes parents me laissent sortir le samedi." },
      { quand: "Une interdiction", en: "You [a:aren't allowed to] [r:park] here.", fr: "Vous n'avez pas le droit de vous garer ici." },
    ],
    francais:
      "Le français dit « faire » ou « laisser » + infinitif (« elle m'a fait rire », « laisse-moi t'aider ») ; l'anglais suit la même idée mais place la personne avant le verbe : {She made me laugh}, {Let me help you}. Attention au passif : « on m'a laissé entrer » se dit {I was allowed to come in}, jamais {I was let to come in}.",
    pieges: [
      { faux: "He made me [x:to wait].", juste: "He [v:made] [o:me] [r:wait].", pourquoi: "Après {make} + personne, verbe nu, sans {to}." },
      { faux: "Let me [x:to explain].", juste: "[v:Let] [o:me] [r:explain].", pourquoi: "Après {let} + personne, verbe nu." },
      { faux: "We [x:were let] to go home.", juste: "We [a:were allowed to] [r:go] home.", pourquoi: "{let} n'a pas de passif : on dit {be allowed to}." },
    ],
    retenir: "{make} / {let} + personne + base (sans {to}) ; au passif : {be made to}, {be allowed to}.",
  },

  "pour-que": {
    regle:
      "Pour exprimer le but (« pour » + verbe), l'anglais emploie simplement {to} + base : {I went to the shop to buy bread}. En plus formel : {in order to} ou {so as to} ; à la négation : {in order not to}, {so as not to}. Quand le but concerne une autre personne, ou contient un modal, on prend {so that} + sujet + {can} / {could} / {will} / {would} ({I'll explain so that you understand}). {for} + nom indique ce qu'on va chercher ({I went out for a walk}) ; {for} + {-ing} dit à quoi sert un objet ({a knife for cutting bread}).",
    forme: [
      { nom: "Le but simple", modele: "{to} + base", exemple: "I came [k:to] [r:help]." },
      { nom: "Plus formel", modele: "{in order to} / {so as to} + base", exemple: "We left early [k:so as not to] [r:miss] the train." },
      { nom: "Avec un autre sujet", modele: "{so that} + sujet + {can} / {will}…", exemple: "Speak louder [k:so that] we [a:can] [r:hear]." },
      { nom: "Pour + nom, usage", modele: "{for} + nom · {for} + {-ing}", exemple: "a machine [k:for] [r:wash][t:ing] dishes" },
    ],
    usages: [
      { quand: "Expliquer une démarche", en: "She works at night [k:to] [r:pay] for her studies.", fr: "Elle travaille la nuit pour payer ses études." },
      { quand: "Éviter quelque chose", en: "I wrote it down [k:so as not to] [r:forget].", fr: "Je l'ai noté pour ne pas oublier." },
      { quand: "Le but pour quelqu'un d'autre", en: "I'll leave the key [k:so that] you [a:can] [r:get] in.", fr: "Je laisse la clé pour que tu puisses entrer." },
    ],
    francais:
      "Le français dit « pour » + infinitif ; l'anglais dit {to}, jamais {for} + base : {I came for help you} est une faute très fréquente. {for} ne s'emploie qu'avec un nom ({for a coffee}) ou pour dire à quoi sert un objet ({for cutting}). Et « pour que » + subjonctif devient {so that} + modal.",
    pieges: [
      { faux: "I came here [x:for learn] English.", juste: "I came here [k:to] [r:learn] English.", pourquoi: "Le but avec un verbe : {to} + base, jamais {for} + base." },
      { faux: "I study hard [x:for to pass].", juste: "I study hard [k:to] [r:pass].", pourquoi: "{for to} n'existe pas en anglais moderne : {to} suffit." },
      { faux: "I'll call you [x:for that you know].", juste: "I'll call you [k:so that] you [r:know].", pourquoi: "« Pour que » + autre sujet : {so that} + sujet + verbe." },
    ],
    retenir: "Pour + verbe = {to} ; pour que = {so that} ; {for} + nom.",
  },

  "complement-to": {
    regle:
      "{to} + base complète souvent un adjectif ou un nom. Après un adjectif : {easy to use} (facile à utiliser), {happy to help}, {nice to meet you}. Avec {too} : trop… pour ({too heavy to carry}). Avec {enough}, placé après l'adjectif : assez… pour ({old enough to drive}). Après un nom ou un pronom : {something to eat} (quelque chose à manger), {nothing to do}, {a book to read}. Après {the first}, {the last}, {the only} : {the first to arrive} (le premier à arriver).",
    forme: [
      { nom: "Adjectif + to", modele: "adjectif + {to} + base", exemple: "It's [j:easy] [k:to] [r:understand]." },
      { nom: "Trop… pour", modele: "{too} + adjectif + {to} + base", exemple: "It's [k:too] [j:hot] [k:to] [r:drink]." },
      { nom: "Assez… pour", modele: "adjectif + {enough} + {to} + base", exemple: "She's [j:old] [k:enough] [k:to] [r:vote]." },
      { nom: "Quelque chose à", modele: "nom / {something} + {to} + base", exemple: "I need something [k:to] [r:read]." },
    ],
    usages: [
      { quand: "Un jugement", en: "This question is [j:difficult] [k:to] [r:answer].", fr: "Cette question est difficile à résoudre." },
      { quand: "Une limite", en: "The box is [k:too] [j:heavy] [k:to] [r:lift].", fr: "La boîte est trop lourde pour être soulevée." },
      { quand: "Un besoin", en: "Is there anything [k:to] [r:eat]?", fr: "Il y a quelque chose à manger ?" },
      { quand: "Un rang", en: "She was the first [k:to] [r:finish].", fr: "Elle a été la première à finir." },
    ],
    francais:
      "Le français dit « facile à faire », « quelque chose à manger », « le premier à arriver » avec « à » : l'anglais remplace ce « à » par {to}. « Trop… pour » = {too}… {to}, et « assez… pour » = adjectif + {enough} + {to}, avec {enough} placé après l'adjectif (mais avant un nom : {enough money to buy it}).",
    pieges: [
      { faux: "This app is easy [x:to use it].", juste: "This app is [j:easy] [k:to] [r:use].", pourquoi: "Le sujet ({this app}) est déjà l'objet de {use} : on ne le répète pas avec {it} en fin de phrase." },
      { faux: "He's [x:enough old] to drive.", juste: "He's [j:old] [k:enough] [k:to] [r:drive].", pourquoi: "{enough} se place après l'adjectif." },
      { faux: "I have nothing [x:for doing].", juste: "I have nothing [k:to] [r:do].", pourquoi: "« Rien à faire » : {nothing to do}." },
    ],
    retenir: "Facile à faire = {easy to do} ; trop… pour = {too}… {to} ; assez… pour = adjectif + {enough to}.",
  },

  "un-peu": {
    regle:
      "{a few} (quelques) et {few} (peu de) s'emploient avec un pluriel qu'on compte ; {a little} (un peu de) et {little} (peu de) avec un indénombrable. Le petit {a} change tout : avec lui, la quantité est petite mais suffisante, positive ({I have a few friends} : j'ai quelques amis) ; sans lui, elle est insuffisante, négative ({I have few friends} : j'ai peu d'amis, pas assez). À l'oral, on remplace souvent {few} et {little} par {not many} et {not much}.",
    forme: [
      { nom: "Quelques (positif)", modele: "{a few} + pluriel", exemple: "[k:a few] [n:days]" },
      { nom: "Peu de (négatif)", modele: "{few} + pluriel", exemple: "[k:few] [n:people]" },
      { nom: "Un peu de (positif)", modele: "{a little} + indénombrable", exemple: "[k:a little] [n:sugar]" },
      { nom: "Peu de (négatif)", modele: "{little} + indénombrable", exemple: "[k:little] [n:hope]" },
    ],
    usages: [
      { quand: "Une petite quantité suffisante", en: "I've got [k:a few] [n:minutes], let's talk.", fr: "J'ai quelques minutes, parlons-en." },
      { quand: "Une quantité insuffisante", en: "[k:Few] [n:people] came to the meeting.", fr: "Peu de gens sont venus à la réunion." },
      { quand: "Un peu de", en: "Could I have [k:a little] [n:milk]?", fr: "Je pourrais avoir un peu de lait ?" },
      { quand: "Presque pas", en: "There's [k:little] [n:time] left.", fr: "Il reste peu de temps." },
    ],
    francais:
      "Le français distingue aussi « quelques » (positif) et « peu de » (négatif) : {a few} et {few} suivent exactement cette nuance. Le piège est double : choisir {few} ou {little} selon que le nom se compte ou non, et ne pas oublier le {a} quand on veut dire « quelques » ou « un peu ».",
    pieges: [
      { faux: "I need [x:a few] water.", juste: "I need [k:a little] [n:water].", pourquoi: "{water} ne se compte pas : {a little}." },
      { faux: "He has [x:little] friends, so he's never lonely.", juste: "He has [k:a few] [n:friends], so he's never lonely.", pourquoi: "{friends} se compte, et le sens est positif : {a few}." },
    ],
    retenir: "{a few} / {few} + ce qu'on compte ; {a little} / {little} + ce qu'on ne compte pas. Avec {a} : positif.",
  },

  "tous-chacun": {
    regle:
      "{every} et {each} + nom singulier veulent dire « chaque » ou « tous les » : {every} regarde l'ensemble ({Every student passed}), {each} insiste sur chaque élément pris un par un ({Each student has a number}) et peut s'employer seul ou pour deux éléments. {all} + pluriel ou indénombrable = tous, tout ({all students}, {all the money}). {the whole} + nom singulier = tout entier ({the whole day} : toute la journée). Les composés {everybody}, {everyone}, {everything} prennent un verbe au singulier.",
    forme: [
      { nom: "Chaque, tous les", modele: "{every} / {each} + nom singulier", exemple: "[k:Every] [n:day] is different." },
      { nom: "Tous, toutes", modele: "{all} (+ {the}) + pluriel", exemple: "[k:All] (the) [n:students] are here." },
      { nom: "Tout entier", modele: "{the whole} + nom singulier", exemple: "[k:the whole] [n:family]" },
      { nom: "Tout le monde", modele: "{everybody} / {everyone} + verbe au singulier", exemple: "[k:Everybody] [v:knows] him." },
    ],
    usages: [
      { quand: "Une habitude", en: "I run [k:every] [n:morning].", fr: "Je cours tous les matins." },
      { quand: "Une distribution", en: "[k:Each] [n:child] got a present.", fr: "Chaque enfant a reçu un cadeau." },
      { quand: "Une durée complète", en: "It rained [k:the whole] [n:weekend].", fr: "Il a plu tout le week-end." },
      { quand: "Une généralité", en: "[k:Everything] [v:is] ready.", fr: "Tout est prêt." },
    ],
    francais:
      "« Tous les jours » se dit {every day}, avec un nom singulier, alors que le français met un pluriel. « Toute la journée » se dit {all day} ou {the whole day}. Et {everybody}, {everyone}, {everything} sont des singuliers en anglais, comme « tout le monde » en français : {Everybody is here}.",
    pieges: [
      { faux: "I go there [x:every days].", juste: "I go there [k:every] [n:day].", pourquoi: "{every} est suivi d'un nom singulier." },
      { faux: "Everybody [x:are] happy.", juste: "[k:Everybody] [v:is] happy.", pourquoi: "{everybody} prend un verbe au singulier." },
      { faux: "I worked [x:all the day].", juste: "I worked [k:all] [n:day].", pourquoi: "« Toute la journée » : {all day} ou {the whole day}, sans {the} après {all}." },
    ],
    retenir: "{every} / {each} + singulier ; {all} + pluriel ; {the whole} + singulier ; {everybody} + verbe au singulier.",
  },

  "les-deux": {
    regle:
      "Quand il y a deux éléments : {both} = les deux (+ pluriel : {Both answers are correct}) ; {either} = l'un ou l'autre, n'importe lequel des deux (+ singulier) ; {neither} = ni l'un ni l'autre (+ singulier, avec un verbe affirmatif). Pour plus de deux : {none (of)} = aucun. Les paires de liaison : {both… and} (à la fois… et), {either… or} (soit… soit), {neither… nor} (ni… ni). Comme {neither} est déjà négatif, le verbe reste affirmatif : {Neither of them came}.",
    forme: [
      { nom: "Les deux", modele: "{both} + pluriel · {both of} + pronom", exemple: "[k:Both] [n:sisters] are tall." },
      { nom: "L'un ou l'autre", modele: "{either} + singulier", exemple: "You can take [k:either] [n:road]." },
      { nom: "Aucun des deux", modele: "{neither} + singulier, verbe affirmatif", exemple: "[k:Neither] [n:answer] is right." },
      { nom: "Les paires", modele: "{both… and} · {either… or} · {neither… nor}", exemple: "[k:Neither] Tom [k:nor] Anna came." },
    ],
    usages: [
      { quand: "Les deux à la fois", en: "She speaks [k:both] French [k:and] German.", fr: "Elle parle à la fois français et allemand." },
      { quand: "Un choix entre deux", en: "We can go [k:either] today [k:or] tomorrow.", fr: "On peut y aller aujourd'hui ou demain." },
      { quand: "Aucun des deux", en: "[k:Neither] of my parents [v:smokes].", fr: "Aucun de mes parents ne fume." },
      { quand: "Plus de deux", en: "[k:None] of the students [v:knew] the answer.", fr: "Aucun des élèves ne connaissait la réponse." },
    ],
    francais:
      "Le français dit « ni… ni… ne », avec une négation de plus (« ni Tom ni Anna ne sont venus ») ; l'anglais n'en met qu'une : {Neither Tom nor Anna came}, sans {didn't}. Retiens aussi que {both}, {either} et {neither} ne s'emploient que pour deux éléments ; au-delà, on passe à {all}, {any}, {none}.",
    pieges: [
      { faux: "Neither of them [x:didn't come].", juste: "[k:Neither] of them [v:came].", pourquoi: "{neither} est déjà négatif : le verbe reste affirmatif." },
      { faux: "[x:The both] books are good.", juste: "[k:Both] (the) [n:books] are good.", pourquoi: "{both} se place avant l'article, jamais après : {both the books} ou {both books}." },
      { faux: "[x:Neither] of my five friends came.", juste: "[k:None] of my five friends came.", pourquoi: "Pour plus de deux, « aucun » se dit {none}." },
    ],
    retenir: "Pour deux : {both}, {either}, {neither}. Pour plus : {all}, {any}, {none}. Une seule négation.",
  },

  "trop-assez": {
    regle:
      "{too} + adjectif = trop, au-delà de la limite ({too expensive}) ; {too much} + indénombrable et {too many} + pluriel = trop de. {enough} = assez : il se place après un adjectif ou un adverbe ({big enough}) mais avant un nom ({enough money}). {so} + adjectif et {such (a)} + adjectif + nom renforcent sans idée de limite : si, tellement ({so tired}, {such a nice day}). Suivis de {that}, ils introduisent une conséquence : {It was so cold that we stayed in}.",
    forme: [
      { nom: "Trop", modele: "{too} + adjectif · {too much} / {too many} + nom", exemple: "It's [k:too] [j:late]." },
      { nom: "Assez", modele: "adjectif + {enough} · {enough} + nom", exemple: "We have [k:enough] [n:chairs]." },
      { nom: "Si, tellement", modele: "{so} + adjectif · {such a} + adjectif + nom", exemple: "It's [k:such a] [j:nice] [n:day]." },
      { nom: "Si… que", modele: "{so} / {such}… {that} + phrase", exemple: "He was [k:so] [j:tired] [k:that] he fell asleep." },
    ],
    usages: [
      { quand: "Un excès", en: "This coffee is [k:too] [j:sweet].", fr: "Ce café est trop sucré." },
      { quand: "Un manque", en: "The room isn't [j:big] [k:enough].", fr: "La pièce n'est pas assez grande." },
      { quand: "Une intensité", en: "Your garden is [k:so] [j:beautiful]!", fr: "Ton jardin est si beau !" },
      { quand: "Une conséquence", en: "It was [k:such] [j:bad] [n:weather] [k:that] we stayed home.", fr: "Il faisait un temps si mauvais que nous sommes restés à la maison." },
    ],
    francais:
      "« Trop » a un sens négatif en anglais : {too} dit qu'on dépasse la limite. Pour l'admiration, comme dans le « il est trop beau » familier, on dit {He's so handsome} ou {He's really handsome}. Et {enough} change de place selon ce qu'il accompagne : après l'adjectif, avant le nom.",
    pieges: [
      { faux: "This film is [x:too] good, I loved it!", juste: "This film is [k:so] [j:good], I loved it!", pourquoi: "{too} veut dire « excessivement » : pour l'admiration, {so} ou {really}." },
      { faux: "He isn't [x:enough tall].", juste: "He isn't [j:tall] [k:enough].", pourquoi: "{enough} se place après l'adjectif." },
      { faux: "There are [x:too much] cars.", juste: "There are [k:too many] [n:cars].", pourquoi: "{cars} se compte : {too many}." },
    ],
    retenir: "{too} = excès, {enough} = juste assez (après l'adjectif, avant le nom), {so} / {such} = intensité.",
  },

  "ed-ing": {
    regle:
      "Beaucoup d'adjectifs existent sous deux formes. L'adjectif en {-ing} décrit ce qui provoque le sentiment, la cause : {The film is boring} (le film est ennuyeux). L'adjectif en {-ed} décrit ce que ressent la personne, l'effet : {I am bored} (je m'ennuie). Mêmes paires : {interesting} / {interested}, {tiring} / {tired}, {exciting} / {excited}, {surprising} / {surprised}, {confusing} / {confused}, {embarrassing} / {embarrassed}, {frightening} / {frightened}.",
    forme: [
      { nom: "La cause", modele: "chose ou personne + {be} + adjectif en {-ing}", exemple: "The lesson [a:is] [r:interest][t:ing]." },
      { nom: "L'effet ressenti", modele: "personne + {be} + adjectif en {-ed}", exemple: "I [a:am] [r:interest][t:ed]." },
    ],
    usages: [
      { quand: "Juger une chose", en: "The trip was [r:tir][t:ing].", fr: "Le voyage était fatigant." },
      { quand: "Dire ce qu'on ressent", en: "We were [r:tir][t:ed] after the trip.", fr: "Nous étions fatigués après le voyage." },
      { quand: "Une émotion", en: "The children are [r:excit][t:ed] about Christmas.", fr: "Les enfants attendent Noël avec impatience." },
    ],
    francais:
      "Le français a souvent deux mots différents (ennuyeux / qui s'ennuie, intéressant / intéressé, fatigant / fatigué) ; l'anglais garde la même racine et change seulement la fin. Attention à {I'm boring} : cela veut dire « je suis ennuyeux » (je fais bâiller les autres), pas « je m'ennuie » ! Et {excited} veut simplement dire « enthousiaste, impatient ».",
    pieges: [
      { faux: "I'm [x:boring], let's go out.", juste: "I'm [r:bor][t:ed], let's go out.", pourquoi: "Ce que je ressens : {bored}. {I'm boring} voudrait dire que j'ennuie les autres." },
      { faux: "The book was very [x:interested].", juste: "The book was very [r:interest][t:ing].", pourquoi: "Le livre provoque l'intérêt : {interesting}." },
      { faux: "She was [x:surprising] by the news.", juste: "She was [r:surpris][t:ed] by the news.", pourquoi: "Elle ressent la surprise : {surprised}." },
    ],
    retenir: "{-ing} = ce qui provoque ({boring}), {-ed} = ce qu'on ressent ({bored}).",
  },

  "adjectif-preposition": {
    regle:
      "Beaucoup d'adjectifs anglais sont suivis d'une préposition précise, qu'il faut apprendre avec eux car elle correspond rarement à celle du français : {good at} / {bad at} (doué pour, nul en), {afraid of} (avoir peur de), {proud of} (fier de), {tired of} (lassé de), {interested in} (intéressé par), {keen on} (passionné de), {kind to} / {nice to} (gentil avec), {married to} (marié à, avec), {different from} (différent de), {responsible for} (responsable de), {angry with} quelqu'un, {angry about} quelque chose. Si un verbe suit, il prend {-ing} : {good at swimming}.",
    forme: [
      { nom: "Adjectif + préposition", modele: "adjectif + préposition + nom", exemple: "She's [j:good] [k:at] maths." },
      { nom: "Avec un verbe", modele: "adjectif + préposition + verbe en {-ing}", exemple: "I'm [j:tired] [k:of] [r:wait][t:ing]." },
    ],
    usages: [
      { quand: "Un talent", en: "He's [j:good] [k:at] [r:draw][t:ing].", fr: "Il est doué pour le dessin." },
      { quand: "Une peur", en: "My son is [j:afraid] [k:of] the dark.", fr: "Mon fils a peur du noir." },
      { quand: "Un intérêt", en: "Are you [j:interested] [k:in] history?", fr: "Tu t'intéresses à l'histoire ?" },
      { quand: "Une relation", en: "She's [j:married] [k:to] a Scottish man.", fr: "Elle est mariée à un Écossais." },
    ],
    francais:
      "Les traductions mot à mot trahissent : « bon en maths » n'est pas {good in maths} mais {good at maths} ; « intéressé par » n'est pas {interested by} mais {interested in} ; « marié avec » n'est pas {married with} mais {married to} ; « gentil avec » se dit {kind to}. Apprends chaque adjectif avec sa préposition, comme un seul bloc.",
    pieges: [
      { faux: "I'm good [x:in] English.", juste: "I'm [j:good] [k:at] English.", pourquoi: "« Bon en » se dit {good at}." },
      { faux: "She is interested [x:by] art.", juste: "She is [j:interested] [k:in] art.", pourquoi: "« S'intéresser à » : {interested in}." },
      { faux: "He's married [x:with] a doctor.", juste: "He's [j:married] [k:to] a doctor.", pourquoi: "« Marié à, avec » : {married to}." },
    ],
    retenir: "Adjectif et préposition s'apprennent ensemble : {good at}, {afraid of}, {interested in}, {married to}.",
  },

  miroir: {
    regle:
      "Les pronoms réfléchis renvoient au sujet quand l'action revient sur lui : {myself}, {yourself}, {himself}, {herself}, {itself}, {ourselves}, {yourselves}, {themselves}. On les emploie quand le sujet et le complément sont la même personne ({She hurt herself}), ou pour insister, comme « moi-même » ({I made it myself}). {by myself} = tout seul. Quand l'action est réciproque, d'une personne à l'autre, on emploie {each other} : {They love each other} (ils s'aiment l'un l'autre).",
    forme: [
      { nom: "Singulier", modele: "{myself} · {yourself} · {himself} · {herself} · {itself}", exemple: "He cut [o:himself]." },
      { nom: "Pluriel", modele: "{ourselves} · {yourselves} · {themselves}", exemple: "We enjoyed [o:ourselves]." },
      { nom: "L'un l'autre", modele: "{each other}", exemple: "They [v:help] [o:each other]." },
      { nom: "Tout seul", modele: "{by} + pronom réfléchi", exemple: "She lives [k:by] [o:herself]." },
    ],
    usages: [
      { quand: "Une action sur soi", en: "Be careful, don't burn [o:yourself]!", fr: "Fais attention, ne te brûle pas !" },
      { quand: "Insister", en: "I painted the house [o:myself].", fr: "J'ai peint la maison moi-même." },
      { quand: "Une réciprocité", en: "We call [o:each other] every day.", fr: "Nous nous appelons tous les jours." },
    ],
    francais:
      "Le français a beaucoup de verbes pronominaux (« se lever », « se laver », « s'habiller », « se sentir ») ; en anglais, la plupart s'en passent : {I get up}, {I wash}, {I get dressed}, {I feel tired}. Le réfléchi anglais est réservé aux vrais cas où l'action revient sur soi, souvent par accident ou par effort ({He hurt himself}). Et « ils se regardent » (l'un l'autre) se dit {They look at each other} ; {themselves} voudrait dire que chacun se regarde dans un miroir.",
    pieges: [
      { faux: "I [x:wake myself] up at 7.", juste: "I [v:wake] up at 7.", pourquoi: "« Se réveiller » ne prend pas de pronom réfléchi en anglais." },
      { faux: "They kissed [x:themselves].", juste: "They kissed [o:each other].", pourquoi: "Ils s'embrassent l'un l'autre : {each other}." },
      { faux: "I feel [x:myself] tired.", juste: "I [v:feel] tired.", pourquoi: "« Se sentir » se dit {feel}, sans pronom réfléchi." },
    ],
    retenir: "{-self} / {-selves} quand l'action revient sur soi ; {each other} quand elle va de l'un à l'autre.",
  },

  autre: {
    regle:
      "{another} (un autre, une autre, encore un) va avec un nom singulier : c'est « un de plus » ou « un différent » ({Another coffee?}). {other} + pluriel = d'autres ({other people}). {the other} = l'autre, celui qui reste ({the other hand}, {the other side}) ; {the other} + pluriel = les autres. Employés seuls, comme pronoms : {another}, {others} (d'autres), {the others} (les autres). {other} ne prend un {-s} que lorsqu'il est employé seul.",
    forme: [
      { nom: "Un de plus, un différent", modele: "{another} + singulier", exemple: "[k:another] [n:chance]" },
      { nom: "D'autres", modele: "{other} + pluriel · {others} (seul)", exemple: "[k:other] [n:ideas]" },
      { nom: "L'autre, les autres", modele: "{the other} (+ singulier ou pluriel) · {the others}", exemple: "[k:the other] [n:side]" },
    ],
    usages: [
      { quand: "Encore un", en: "Can I have [k:another] [n:piece] of cake?", fr: "Je peux avoir un autre morceau de gâteau ?" },
      { quand: "Celui qui reste", en: "One sock is here. Where's [k:the other] one?", fr: "Une chaussette est ici. Où est l'autre ?" },
      { quand: "Le reste du groupe", en: "Tom is here, but [k:the others] are late.", fr: "Tom est là, mais les autres sont en retard." },
    ],
    francais:
      "« Un autre » s'écrit en un seul mot, {another}, et ne prend donc jamais {a} devant ({an other} est faux). « D'autres » se dit {other} + nom, ou {others} tout seul. Et contrairement au français, {other} ne s'accorde pas devant un nom : {other books}, jamais {others books}.",
    pieges: [
      { faux: "I want [x:an other] one.", juste: "I want [k:another] one.", pourquoi: "« Un autre » s'écrit en un seul mot : {another}." },
      { faux: "[x:Others] people think so.", juste: "[k:Other] [n:people] think so.", pourquoi: "Devant un nom, {other} ne prend pas de {-s}." },
      { faux: "I have two brothers: one is a doctor, [x:another] is a teacher.", juste: "I have two brothers: one is a doctor, [k:the other] is a teacher.", pourquoi: "Pour le second d'une paire, celui qui reste, on dit {the other}." },
    ],
    retenir: "{another} = un de plus ; {the other} = celui qui reste ; {other} + pluriel ; {others} employé seul.",
  },

  particules: {
    regle:
      "Un {phrasal verb} est un verbe suivi d'une petite particule ({up}, {down}, {on}, {off}, {out}, {in}, {away}, {back}…) qui change son sens, parfois de façon imprévisible : {give} (donner) → {give up} (abandonner) ; {look} (regarder) → {look after} (s'occuper de). Quand le verbe a un complément, la particule peut souvent se placer avant ou après lui ({turn off the light} / {turn the light off}). Mais si le complément est un pronom, il se met obligatoirement entre le verbe et la particule : {turn it off}.",
    forme: [
      { nom: "Sans complément", modele: "verbe + particule", exemple: "[v:Wake] [k:up]!" },
      { nom: "Avec un nom", modele: "verbe + particule + nom · verbe + nom + particule", exemple: "[v:Put] [k:on] your coat." },
      { nom: "Avec un pronom", modele: "verbe + pronom + particule", exemple: "[v:Put] [o:it] [k:on]." },
    ],
    usages: [
      { quand: "La vie quotidienne", en: "I [v:get] [k:up] at seven.", fr: "Je me lève à sept heures." },
      { quand: "Un vêtement", en: "[v:Take] [k:off] your shoes, please.", fr: "Enlève tes chaussures, s'il te plaît." },
      { quand: "Abandonner", en: "Don't [v:give] [k:up]!", fr: "N'abandonne pas !" },
      { quand: "Chercher une information", en: "[v:Look] [o:it] [k:up] in the dictionary.", fr: "Cherche-le dans le dictionnaire." },
    ],
    francais:
      "Le français préfère souvent un verbe unique, d'origine latine (« abandonner », « éteindre », « continuer ») ; l'anglais parlé préfère le verbe court + particule ({give up}, {turn off}, {go on}). La particule donne parfois un indice ({up} = vers le haut, jusqu'au bout ; {off} = séparation, arrêt ; {back} = retour), mais beaucoup de ces verbes s'apprennent comme du vocabulaire.",
    pieges: [
      { faux: "Turn off [x:it].", juste: "[v:Turn] [o:it] [k:off].", pourquoi: "Avec un pronom, celui-ci se place entre le verbe et la particule." },
      { faux: "Please [x:take out] your shoes.", juste: "Please [v:take] [k:off] your shoes.", pourquoi: "Enlever un vêtement se dit {take off} ; {take out}, c'est sortir quelque chose d'un contenant." },
    ],
    retenir: "Verbe + particule = un nouveau sens ; avec un pronom : {turn it off}.",
  },

  "verbe-preposition": {
    regle:
      "Certains verbes anglais demandent une préposition là où le français n'en met pas : {listen to} (écouter), {wait for} (attendre), {look at} (regarder), {look for} (chercher), {ask for} (demander quelque chose), {pay for} (payer quelque chose). D'autres choisissent une préposition différente : {depend on} (dépendre de), {belong to} (appartenir à), {think about} (penser à). Et certains n'en prennent pas, alors que le français en met une : {enter} (entrer dans), {discuss} (discuter de), {answer} (répondre à), {marry} (se marier avec), {reach} (arriver à), {phone} (téléphoner à).",
    forme: [
      { nom: "Préposition en plus", modele: "{listen to} · {wait for} · {look at} · {pay for}", exemple: "I'm [v:waiting] [k:for] the bus." },
      { nom: "Préposition différente", modele: "{depend on} · {belong to} · {think about}", exemple: "It [v:depends] [k:on] the weather." },
      { nom: "Sans préposition", modele: "{enter} · {discuss} · {answer} · {marry} · {reach}", exemple: "We [v:discussed] the problem." },
    ],
    usages: [
      { quand: "Écouter", en: "She [v:listens] [k:to] the radio every morning.", fr: "Elle écoute la radio tous les matins." },
      { quand: "Chercher", en: "I'm [v:looking] [k:for] my glasses.", fr: "Je cherche mes lunettes." },
      { quand: "Payer", en: "Who [v:paid] [k:for] the drinks?", fr: "Qui a payé les boissons ?" },
      { quand: "Répondre", en: "Please [v:answer] the question.", fr: "Réponds à la question, s'il te plaît." },
    ],
    francais:
      "Ces différences viennent de la logique propre à chaque langue et s'apprennent verbe par verbe. Les plus traîtres pour un francophone : « attendre quelqu'un » = {wait for someone}, « écouter de la musique » = {listen to music}, « payer le repas » = {pay for the meal}, mais « entrer dans la pièce » = {enter the room} et « discuter d'un problème » = {discuss a problem}.",
    pieges: [
      { faux: "I'm waiting [x:my friend].", juste: "I'm [v:waiting] [k:for] my friend.", pourquoi: "« Attendre quelqu'un » : {wait for}." },
      { faux: "We discussed [x:about] the plan.", juste: "We [v:discussed] the plan.", pourquoi: "{discuss} se construit sans préposition." },
      { faux: "Listen [x:me]!", juste: "[v:Listen] [k:to] me!", pourquoi: "{listen} demande toujours {to} devant son complément." },
    ],
    retenir: "Verbe et préposition s'apprennent ensemble : {listen to}, {wait for}, {depend on}… et {discuss}, {enter}, {answer} sans rien.",
  },

  "deux-complements": {
    regle:
      "Avec les verbes à deux compléments ({give}, {send}, {show}, {bring}, {lend}, {offer}, {tell}, {buy}, {make}…), l'anglais a deux ordres possibles. Soit la personne juste après le verbe, sans préposition : {Give Mary the book}. Soit la chose d'abord, puis {to} ou {for} + la personne : {Give the book to Mary} ({for} avec {buy}, {make}, {get}, {cook} : {She bought a present for him}). Si la chose est un pronom ({it}, {them}), on prend le second ordre : {Give it to Mary}.",
    forme: [
      { nom: "Personne d'abord", modele: "verbe + personne + chose", exemple: "[v:Send] [o:me] a postcard." },
      { nom: "Chose d'abord", modele: "verbe + chose + {to} / {for} + personne", exemple: "[v:Send] a postcard [k:to] [o:me]." },
      { nom: "Chose = pronom", modele: "verbe + {it} / {them} + {to} + personne", exemple: "[v:Give] [o:it] [k:to] her." },
      { nom: "Toujours avec to", modele: "{explain} / {describe} / {say} + chose + {to} + personne", exemple: "[v:Explain] it [k:to] me." },
    ],
    usages: [
      { quand: "Un cadeau", en: "My parents [v:gave] [o:me] a bike.", fr: "Mes parents m'ont offert un vélo." },
      { quand: "Pour quelqu'un", en: "I [v:made] a cake [k:for] you.", fr: "Je t'ai fait un gâteau." },
      { quand: "Montrer", en: "Can you [v:show] [o:us] the way?", fr: "Tu peux nous montrer le chemin ?" },
      { quand: "Expliquer", en: "Can you [v:explain] the rule [k:to] me?", fr: "Tu peux m'expliquer la règle ?" },
    ],
    francais:
      "Le français dit « donne-le à Marie » ou « donne-moi le livre » ; l'anglais permet en plus de supprimer « à » en mettant la personne juste après le verbe ({Give me the book}). Mais certains verbes refusent cet ordre : {explain}, {describe}, {say}, {suggest} veulent toujours {to} devant la personne : {Explain it to me}, jamais {Explain me}.",
    pieges: [
      { faux: "Can you [x:explain me] the rule?", juste: "Can you [v:explain] the rule [k:to] me?", pourquoi: "{explain} ne prend jamais la personne juste après lui : {explain something to someone}." },
      { faux: "Give [x:her it].", juste: "[v:Give] [o:it] [k:to] her.", pourquoi: "Quand la chose est un pronom, on la place d'abord, puis {to} + personne." },
      { faux: "He said [x:me] hello.", juste: "He [v:said] hello [k:to] me.", pourquoi: "{say} se construit avec {to} devant la personne (ou bien : {He told me…})." },
    ],
    retenir: "{give me the book} = {give the book to me} ; avec un pronom : {give it to me} ; {explain}, {say} : toujours {to}.",
  },

  "place-adverbe": {
    regle:
      "En anglais, un verbe et son complément direct sont soudés : on ne glisse rien entre les deux. L'adverbe de manière se place donc après le complément ({She speaks English fluently}), ou parfois devant le verbe ({She quickly closed the door}). Les adverbes de fréquence ({always}, {often}, {never}…) et des mots comme {already}, {just}, {also}, {probably} se placent avant le verbe principal, mais après {be} et après le premier auxiliaire ({I have never seen it}, {She is always late}).",
    forme: [
      { nom: "Manière", modele: "verbe + complément + adverbe", exemple: "He [v:plays] [c:the piano] beautifully." },
      { nom: "Fréquence", modele: "sujet + adverbe + verbe principal", exemple: "We [k:often] [v:eat] out." },
      { nom: "Avec be ou un auxiliaire", modele: "{be} / auxiliaire + adverbe + …", exemple: "I [a:have] [k:never] [p:been] there." },
    ],
    usages: [
      { quand: "Une manière", en: "She [v:sings] [c:that song] perfectly.", fr: "Elle chante parfaitement cette chanson." },
      { quand: "Une habitude", en: "I [k:always] [v:drink] [c:tea] in the morning.", fr: "Je bois toujours du thé le matin." },
      { quand: "Avec un modal", en: "You [a:can] [k:also] [v:pay] by card.", fr: "Vous pouvez aussi payer par carte." },
    ],
    francais:
      "Le français place volontiers l'adverbe juste après le verbe (« je parle couramment anglais », « j'aime beaucoup le chocolat ») : en anglais, c'est la faute à éviter. Le complément reste collé au verbe et l'adverbe passe après : {I speak English fluently}, {I like chocolate a lot}.",
    pieges: [
      { faux: "She speaks [x:very well] English.", juste: "She [v:speaks] [c:English] very well.", pourquoi: "On ne sépare pas le verbe de son complément : l'adverbe va après." },
      { faux: "I [x:have seen never] it.", juste: "I [a:have] [k:never] [p:seen] it.", pourquoi: "{never} se place après le premier auxiliaire, avant le participe." },
      { faux: "He [x:drives always] fast.", juste: "He [k:always] [v:drives] fast.", pourquoi: "L'adverbe de fréquence se place avant le verbe principal." },
    ],
    retenir: "Verbe et complément sont soudés ; la manière après, la fréquence avant le verbe (après {be} et l'auxiliaire).",
  },

  "petite-question": {
    regle:
      "Le {question tag} est une petite question ajoutée en fin de phrase pour demander une confirmation, comme « n'est-ce pas ? » ou « hein ? ». Il reprend l'auxiliaire de la phrase (ou {do}, {does}, {did} s'il n'y en a pas) et le pronom sujet. Règle d'or : phrase affirmative → tag négatif ({You're French, aren't you?}) ; phrase négative → tag affirmatif ({She doesn't smoke, does she?}). Quelques cas à retenir : {I am…, aren't I?}, {Let's…, shall we?}, et après un impératif, {will you?}.",
    forme: [
      { nom: "Affirmatif → négatif", modele: "phrase affirmative, auxiliaire + {n't} + pronom ?", exemple: "It's cold, [a:isn't] [s:it]?" },
      { nom: "Négatif → affirmatif", modele: "phrase négative, auxiliaire + pronom ?", exemple: "You can't swim, [a:can] [s:you]?" },
      { nom: "Sans auxiliaire", modele: "présent ou prétérit simple → {do} / {does} / {did}", exemple: "He lives here, [a:doesn't] [s:he]?" },
      { nom: "Cas spéciaux", modele: "{I am…, aren't I?} · {Let's…, shall we?}", exemple: "Let's go, [a:shall] [s:we]?" },
    ],
    usages: [
      { quand: "Vérifier une information", en: "You're coming tonight, [a:aren't] [s:you]?", fr: "Tu viens ce soir, hein ?" },
      { quand: "Engager la conversation", en: "Lovely day, [a:isn't] [s:it]?", fr: "Belle journée, n'est-ce pas ?" },
      { quand: "Une question au passé", en: "She called you, [a:didn't] [s:she]?", fr: "Elle t'a appelé, non ?" },
    ],
    francais:
      "Le français a un tag passe-partout, « n'est-ce pas ? » (ou « hein ? », « non ? »), qui ne change jamais. L'anglais fabrique le sien à chaque phrase, avec le bon auxiliaire, le bon temps et le bon pronom. L'intonation compte aussi : descendante, on attend une confirmation ; montante, on pose une vraie question.",
    pieges: [
      { faux: "You like coffee, [x:isn't it]?", juste: "You like coffee, [a:don't] [s:you]?", pourquoi: "Le tag reprend le sujet ({you}) et l'auxiliaire du temps : {don't you?}, jamais un {isn't it?} passe-partout." },
      { faux: "She isn't here, [x:isn't she]?", juste: "She isn't here, [a:is] [s:she]?", pourquoi: "Phrase négative, tag affirmatif." },
      { faux: "I'm late, [x:amn't I]?", juste: "I'm late, [a:aren't] [s:I]?", pourquoi: "Avec {I am}, le tag négatif est {aren't I?}" },
    ],
    retenir: "Phrase positive → tag négatif, phrase négative → tag positif, avec l'auxiliaire et le pronom de la phrase.",
  },

  "question-polie": {
    regle:
      "Pour poser une question plus poliment, on l'enveloppe dans une formule : {Could you tell me…?}, {Do you know…?}, {I wonder…}, {Can you remember…?} La question qui suit perd alors sa forme de question : plus d'inversion, plus de {do}, {does}, {did}. On garde le mot interrogatif, puis l'ordre d'une affirmation, sujet + verbe : {Where is the station?} devient {Could you tell me where the station is?} Pour une question fermée (oui ou non), on ajoute {if} ou {whether} : {Do you know if she's coming?}",
    forme: [
      { nom: "Question ouverte", modele: "formule + mot-question + sujet + verbe", exemple: "Do you know where [s:he] [v:lives]?" },
      { nom: "Question fermée", modele: "formule + {if} / {whether} + sujet + verbe", exemple: "Can you tell me [k:if] [s:the shop] [v:is] open?" },
    ],
    usages: [
      { quand: "Demander son chemin", en: "Could you tell me where [s:the museum] [v:is]?", fr: "Pourriez-vous me dire où se trouve le musée ?" },
      { quand: "Demander une heure", en: "Do you know what time [s:the train] [v:leaves]?", fr: "Savez-vous à quelle heure part le train ?" },
      { quand: "Une question fermée", en: "I wonder [k:if] [s:she] [v:remembers] me.", fr: "Je me demande si elle se souvient de moi." },
    ],
    francais:
      "Le français accepte « savez-vous où est la gare ? » comme « savez-vous où se trouve la gare ? », avec ou sans inversion. L'anglais est strict : dans la question enveloppée, sujet + verbe, sans {do}. Le point d'interrogation final dépend seulement de la formule : {Do you know…?} en prend un, {I wonder…} non.",
    pieges: [
      { faux: "Could you tell me where [x:is the station]?", juste: "Could you tell me where [s:the station] [v:is]?", pourquoi: "Dans une question indirecte, le sujet passe avant le verbe." },
      { faux: "Do you know what time [x:does the film start]?", juste: "Do you know what time [s:the film] [v:starts]?", pourquoi: "Plus de {does} dans la question indirecte : le verbe reprend son {-s}." },
      { faux: "Can you tell me [x:is she] coming?", juste: "Can you tell me [k:if] [s:she] [v:is] coming?", pourquoi: "Pour une question fermée, on ajoute {if} ou {whether}." },
    ],
    retenir: "Formule polie + mot-question (ou {if}) + sujet + verbe, sans inversion ni {do}.",
  },

  "questions-sujet": {
    regle:
      "Quand le mot interrogatif ({who}, {what}, {which}…) est lui-même le sujet de la question, on ne met pas {do}, {does}, {did}, et le verbe garde sa forme normale : {Who called you?} (qui t'a appelé ?), {What happened?} (que s'est-il passé ?). Quand il est complément, on reprend la structure habituelle avec l'auxiliaire : {Who did you call?} (qui as-tu appelé ?). Autre particularité : la préposition se place souvent à la fin de la question : {Who are you talking to?}, {What are you looking at?}",
    forme: [
      { nom: "Mot-question sujet", modele: "mot-question + verbe (sans {do})", exemple: "[k:Who] [v:lives] here?" },
      { nom: "Mot-question complément", modele: "mot-question + auxiliaire + sujet + base", exemple: "[k:Who] [a:did] [s:you] [r:see]?" },
      { nom: "Préposition à la fin", modele: "mot-question + auxiliaire + sujet + verbe + préposition ?", exemple: "[k:Who] [a:are] you [r:wait][t:ing] for?" },
    ],
    usages: [
      { quand: "Qui a fait l'action", en: "[k:Who] [v:broke] the window?", fr: "Qui a cassé la fenêtre ?" },
      { quand: "Ce qui s'est passé", en: "[k:What] [v:happened] last night?", fr: "Que s'est-il passé hier soir ?" },
      { quand: "Qui l'a subie", en: "[k:Who] [a:did] the police [r:arrest]?", fr: "Qui la police a-t-elle arrêté ?" },
      { quand: "Une préposition finale", en: "[k:What] [a:is] this book [k:about]?", fr: "De quoi parle ce livre ?" },
    ],
    francais:
      "En français, « qui t'a appelé ? » et « qui as-tu appelé ? » se ressemblent beaucoup ; en anglais, la différence se voit : {Who called you?} (sans {did}) et {Who did you call?} (avec {did}). Et là où le français place la préposition en tête (« avec qui parles-tu ? »), l'anglais courant la rejette au bout : {Who are you talking to?}",
    pieges: [
      { faux: "Who [x:did break] the window?", juste: "[k:Who] [v:broke] the window?", pourquoi: "{who} est le sujet : pas de {did}, le verbe se met au prétérit." },
      { faux: "What [x:did happen]?", juste: "[k:What] [v:happened]?", pourquoi: "{what} est le sujet : le verbe se conjugue directement." },
      { faux: "[x:With who] are you going?", juste: "[k:Who] [a:are] you going [k:with]?", pourquoi: "En anglais courant, la préposition se place en fin de question." },
    ],
    retenir: "Mot-question sujet : pas de {do}. Mot-question complément : auxiliaire + sujet. Préposition à la fin.",
  },

  "faux-amis": {
    regle:
      "Les faux amis sont des mots anglais qui ressemblent à des mots français mais n'ont pas le même sens. Parmi les plus courants : {actually} = en fait (« actuellement » se dit {currently}) ; {eventually} = finalement (« éventuellement » se dit {possibly}) ; {sensible} = raisonnable (« sensible » se dit {sensitive}) ; {library} = bibliothèque (« librairie » se dit {bookshop}) ; {to attend} = assister à (« attendre » se dit {to wait}) ; {to pretend} = faire semblant (« prétendre » se dit {to claim}) ; {a lecture} = un cours magistral, une conférence (« une lecture » se dit {reading}).",
    usages: [
      { quand: "En fait", en: "[k:Actually], I'm not hungry.", fr: "En fait, je n'ai pas faim." },
      { quand: "Finalement, au bout du compte", en: "We [k:eventually] found the hotel.", fr: "Nous avons fini par trouver l'hôtel." },
      { quand: "Raisonnable", en: "That's a [k:sensible] decision.", fr: "C'est une décision raisonnable." },
      { quand: "Bibliothèque", en: "I borrowed this book from the [k:library].", fr: "J'ai emprunté ce livre à la bibliothèque." },
    ],
    francais:
      "Les faux amis viennent souvent d'une même racine latine dont le sens a évolué différemment dans chaque langue. Le bon réflexe : quand un mot anglais ressemble trop à un mot français, vérifie son sens dans le contexte. Et à l'inverse, méfie-toi des traductions « évidentes » : « actuellement » = {currently} ou {at the moment} ; « éventuellement » = {possibly} ou {if necessary}.",
    pieges: [
      { faux: "She is very [x:sensible], she cries at every film.", juste: "She is very [k:sensitive], she cries at every film.", pourquoi: "« Sensible » (qui ressent vivement) se dit {sensitive} ; {sensible} veut dire « raisonnable »." },
      { faux: "I bought this novel at the [x:library].", juste: "I bought this novel at the [k:bookshop].", pourquoi: "On achète un livre dans une librairie, {a bookshop} ; {a library} est une bibliothèque, où l'on emprunte." },
      { faux: "I'll [x:eventually] come if I have time.", juste: "I'll [k:possibly] come if I have time.", pourquoi: "« Éventuellement » se dit {possibly} ; {eventually} veut dire « finalement, à la fin »." },
    ],
    retenir: "{actually} = en fait · {eventually} = finalement · {sensible} = raisonnable · {library} = bibliothèque.",
  },

  "faux-jumeaux": {
    regle:
      "Certains verbes français ont deux traductions anglaises. « Faire » : {make} pour créer, fabriquer, produire ({make a cake}, {make a mistake}, {make noise}, {make a decision}) ; {do} pour accomplir une activité, un travail, une tâche ({do homework}, {do the dishes}, {do sport}, {do your best}). « Dire » : {say} + ce qu'on dit ({say hello}, {say something}) ; {tell} + la personne à qui l'on parle ({tell me}), et dans {tell a story}, {tell the truth}. « Prêter » et « emprunter » : {lend} (donner pour un temps), {borrow} (recevoir pour un temps).",
    forme: [
      { nom: "Créer / accomplir", modele: "{make} + produit · {do} + activité", exemple: "[v:make] a cake · [v:do] the shopping" },
      { nom: "Dire", modele: "{say} + chose · {tell} + personne + chose", exemple: "She [v:told] me a secret." },
      { nom: "Prêter / emprunter", modele: "{lend} + personne + chose · {borrow} + chose + {from} + personne", exemple: "Can I [v:borrow] your pen?" },
    ],
    usages: [
      { quand: "Une erreur", en: "I [v:made] a mistake.", fr: "J'ai fait une erreur." },
      { quand: "Les tâches", en: "Who [v:does] the cooking at home?", fr: "Qui fait la cuisine chez vous ?" },
      { quand: "Raconter", en: "Grandpa [v:told] us a story.", fr: "Papi nous a raconté une histoire." },
      { quand: "Prêter", en: "Can you [v:lend] me ten euros?", fr: "Tu peux me prêter dix euros ?" },
    ],
    francais:
      "Le français dit « faire » pour tout ; l'anglais oblige à choisir, souvent dans des expressions figées : {make friends} (se faire des amis), {make a phone call} (passer un coup de fil), {do someone a favour} (rendre service). Pour « dire », retiens que {tell} veut presque toujours une personne juste après lui, alors que {say} n'en veut pas : {He told me…} mais {He said that…}.",
    pieges: [
      { faux: "I have to [x:make] my homework.", juste: "I have to [v:do] my homework.", pourquoi: "Les devoirs sont une tâche : {do}." },
      { faux: "She [x:said me] the truth.", juste: "She [v:told] me the truth.", pourquoi: "Avec une personne, {tell} ; et l'on dit {tell the truth}." },
      { faux: "Can you [x:borrow] me your car?", juste: "Can you [v:lend] me your car?", pourquoi: "Celui qui donne pour un temps prête : {lend}. Celui qui reçoit emprunte : {borrow}." },
    ],
    retenir: "{make} = créer, {do} = accomplir ; {say} + chose, {tell} + personne ; {lend} = prêter, {borrow} = emprunter.",
  },

  "sujet-it": {
    regle:
      "Une phrase anglaise a toujours un sujet. Quand personne ne fait l'action, {it} occupe la place : pour la météo ({It's raining}, {It's cold}), l'heure et la date ({It's 5 o'clock}, {It's Monday}), la distance ({It's 10 km to the city}), le temps nécessaire ({It takes two hours}), le prix ({It costs ten euros}), un jugement suivi de {to} + verbe ({It's easy to learn}) ou d'une phrase ({It seems that…}, {It's a pity that…}).",
    forme: [
      { nom: "Météo, heure, date", modele: "{It's} + adjectif, heure ou jour", exemple: "[s:It]'s sunny today." },
      { nom: "Le temps qu'il faut", modele: "{It takes} + (personne) + durée + {to} + base", exemple: "[s:It] [v:takes] me an hour [k:to] [r:get] there." },
      { nom: "Un jugement", modele: "{It's} + adjectif + {to} + base", exemple: "[s:It]'s important [k:to] [r:sleep]." },
      { nom: "Une impression", modele: "{It seems} / {It looks like} + phrase", exemple: "[s:It] [v:seems] that he's right." },
    ],
    usages: [
      { quand: "Le temps qu'il fait", en: "[s:It]'s been raining all day.", fr: "Il n'a pas arrêté de pleuvoir de la journée." },
      { quand: "La durée d'un trajet", en: "[s:It] [v:takes] ten minutes [k:to] [r:walk] to school.", fr: "Il faut dix minutes pour aller à l'école à pied." },
      { quand: "Un avis", en: "[s:It]'s nice [k:to] [r:see] you again.", fr: "Ça fait plaisir de te revoir." },
    ],
    francais:
      "Le français a lui aussi un « il » qui ne représente rien (« il pleut », « il est 5 heures », « il faut »), qu'il remplace parfois par « ça » ou « c'est ». L'anglais emploie {it} dans tous ces cas, et ne le supprime jamais. « Il faut deux heures » se dit {It takes two hours}.",
    pieges: [
      { faux: "[x:Is] cold today.", juste: "[s:It]'s cold today.", pourquoi: "Le sujet {it} est obligatoire, même pour la météo." },
      { faux: "[x:It needs] two hours to get there.", juste: "[s:It] [v:takes] two hours to get there.", pourquoi: "Pour le temps nécessaire, on dit {It takes}." },
      { faux: "[x:Is] easy to understand.", juste: "[s:It]'s easy to understand.", pourquoi: "« C'est facile de… » : {It's easy to…}, avec {it}." },
    ],
    retenir: "Pas de sujet ? {it} : la météo, l'heure, {It takes…}, {It costs…}, {It's easy to…}.",
  },

  "pendant-jusqua": {
    regle:
      "« Pendant » se traduit de trois façons : {for} + une durée ({for two hours}) ; {during} + un événement, une période nommée ({during the film}, {during the summer}) ; {while} + une phrase avec sujet et verbe ({while I was cooking}). « Jusqu'à » : {until} (ou {till}) pour une action qui dure jusqu'à un moment ({I'll wait until 6}) ; {by} pour une limite, au plus tard ({Finish it by Friday}). « Dans » + durée, pour le futur : {in} ({I'll be back in ten minutes}).",
    forme: [
      { nom: "Pendant", modele: "{for} + durée · {during} + nom · {while} + phrase", exemple: "[k:during] the night · [k:while] she slept" },
      { nom: "Jusqu'à, au plus tard", modele: "{until} + moment · {by} + moment", exemple: "Wait [k:until] I call. · Be here [k:by] 8." },
      { nom: "Dans (futur)", modele: "{in} + durée", exemple: "The film starts [k:in] five minutes." },
    ],
    usages: [
      { quand: "Une durée", en: "We lived there [k:for] six years.", fr: "Nous avons vécu là-bas pendant six ans." },
      { quand: "Un événement", en: "I fell asleep [k:during] the meeting.", fr: "Je me suis endormi pendant la réunion." },
      { quand: "Une limite", en: "Please send the report [k:by] Monday.", fr: "Envoyez le rapport d'ici lundi, s'il vous plaît." },
      { quand: "Dans peu de temps", en: "I'll call you back [k:in] an hour.", fr: "Je te rappelle dans une heure." },
    ],
    francais:
      "« Pendant deux heures » = {for two hours} (une durée), mais « pendant les vacances » = {during the holidays} (un événement), et « pendant que » + phrase = {while}. Ne confonds pas non plus « jusqu'à » au sens de durée ({until}) et au sens de date limite ({by}) : {I'll work until 6} (je travaille sans m'arrêter jusqu'à 18 h), {I'll finish by 6} (j'aurai fini au plus tard à 18 h).",
    pieges: [
      { faux: "I slept [x:during] eight hours.", juste: "I slept [k:for] eight hours.", pourquoi: "Devant une durée chiffrée, {for}." },
      { faux: "[x:During] I was cooking, the phone rang.", juste: "[k:While] I was cooking, the phone rang.", pourquoi: "Devant une phrase (sujet + verbe), {while}." },
      { faux: "You must finish [x:until] Friday.", juste: "You must finish [k:by] Friday.", pourquoi: "Une date limite (« au plus tard ») se dit {by}." },
    ],
    retenir: "{for} + durée, {during} + événement, {while} + phrase ; {until} = jusqu'à, {by} = au plus tard ; {in} + durée = dans.",
  },

  "entre-virgules": {
    regle:
      "Une relative non déterminative ajoute une information en plus, qu'on pourrait retirer sans changer le sens de la phrase : {My brother, who lives in Rome, is a chef}. Elle est toujours encadrée par des virgules (à l'oral, par de petites pauses). On y emploie {who} pour une personne, {which} pour une chose, {whose} et {where}, mais jamais {that}, et l'on ne peut pas omettre le relatif. {which} peut aussi reprendre toute une phrase : {He passed his exam, which surprised everyone}.",
    forme: [
      { nom: "Une personne", modele: "nom, {who} + …, suite", exemple: "My aunt, [k:who] is 90, still drives." },
      { nom: "Une chose", modele: "nom, {which} + …, suite", exemple: "The Louvre, [k:which] opened in 1793, is huge." },
      { nom: "Reprendre une phrase", modele: "phrase, {which} + verbe", exemple: "She smiled, [k:which] was rare." },
    ],
    usages: [
      { quand: "Une précision en bonus", en: "Paris, [k:which] is the capital of France, is very beautiful.", fr: "Paris, qui est la capitale de la France, est très belle." },
      { quand: "Présenter quelqu'un", en: "This is Tom, [k:whose] sister you met yesterday.", fr: "Voici Tom, dont tu as rencontré la sœur hier." },
      { quand: "Un commentaire", en: "It rained all week, [k:which] was annoying.", fr: "Il a plu toute la semaine, ce qui était agaçant." },
    ],
    francais:
      "En français aussi, on met des virgules autour de la relative explicative, mais le choix du pronom ne change pas. En anglais, si les virgules sont là, {that} est interdit et le relatif est obligatoire. Et « ce qui » reprenant toute une phrase se dit {which}, jamais {what} : {He was late, which annoyed me}.",
    pieges: [
      { faux: "My car, [x:that] is red, is new.", juste: "My car, [k:which] is red, is new.", pourquoi: "Entre virgules, jamais {that} : {which} pour une chose." },
      { faux: "He lied, [x:what] made me angry.", juste: "He lied, [k:which] made me angry.", pourquoi: "Pour reprendre toute une phrase (« ce qui »), on dit {which}." },
    ],
    retenir: "Une information en bonus, entre virgules : {who}, {which}, {whose}, {where}, jamais {that}.",
  },

  "article-zero": {
    regle:
      "Pour parler d'une chose en général, l'anglais ne met pas d'article devant un nom pluriel ou indénombrable : {Dogs are loyal} (les chiens sont fidèles), {I love music} (j'aime la musique), {Life is beautiful}. {the} réapparaît dès qu'on parle d'éléments précis, identifiés : {The dogs next door bark all night}, {the music of this film}. Pas d'article non plus devant les repas ({have breakfast}), les langues, les sports, la plupart des noms de pays et de villes, et dans des expressions comme {at school}, {go to bed}, {by car}.",
    forme: [
      { nom: "En général", modele: "∅ + pluriel ou indénombrable", exemple: "[n:Cats] are independent." },
      { nom: "En particulier", modele: "{the} + nom", exemple: "[d:The] [n:cats] in my street are noisy." },
      { nom: "Expressions sans article", modele: "{at school} · {go to bed} · {by bus} · {have lunch}", exemple: "She goes to [n:school] by [n:bus]." },
    ],
    usages: [
      { quand: "Un goût", en: "I hate [n:spiders].", fr: "Je déteste les araignées." },
      { quand: "Une généralité", en: "[n:Money] doesn't bring happiness.", fr: "L'argent ne fait pas le bonheur." },
      { quand: "Une chose précise", en: "[d:The] [n:money] on the table is mine.", fr: "L'argent qui est sur la table est à moi." },
      { quand: "Un repas, un lieu d'activité", en: "We have [n:dinner] at 8, after [n:work].", fr: "Nous dînons à 20 h, après le travail." },
    ],
    francais:
      "C'est le piège inverse du français, qui met « le, la, les » partout pour les généralités (« j'aime le chocolat », « la vie est belle »). En anglais, {the} signifie « ceux-là, précisément ». Pour savoir s'il le faut, demande-toi : est-ce que je parle de tous en général, ou de certains bien précis ?",
    pieges: [
      { faux: "I love [x:the] chocolate.", juste: "I love [n:chocolate].", pourquoi: "Le chocolat en général : pas d'article." },
      { faux: "[x:The] life is short.", juste: "[n:Life] is short.", pourquoi: "Une idée générale : pas d'article." },
      { faux: "He plays [x:the] tennis.", juste: "He plays [n:tennis].", pourquoi: "Pas d'article devant un sport (mais {the} devant un instrument : {the piano})." },
    ],
    retenir: "En général : pas d'article. Précis et identifié : {the}.",
  },

  "noms-pieges": {
    regle:
      "Plusieurs noms qu'on compte en français sont indénombrables en anglais : {advice}, {information}, {furniture}, {luggage}, {news}, {homework}, {progress}, {research}, {equipment}, {knowledge}, {travel}. Ils ne prennent ni {a} ni {-s}, et le verbe se met au singulier ({The news is good}). Pour en compter un élément : {a piece of} ({a piece of advice}, {two pieces of furniture}). À l'inverse, certains noms sont toujours pluriels : {trousers}, {jeans}, {glasses}, {scissors}, {clothes}, {stairs} ; on les compte avec {a pair of}.",
    forme: [
      { nom: "Indénombrable", modele: "nom sans {a} ni {-s} + verbe au singulier", exemple: "The [n:news] [v:is] good." },
      { nom: "En compter un", modele: "{a piece of} + nom", exemple: "[k:a piece of] [n:information]" },
      { nom: "Toujours pluriel", modele: "nom + verbe au pluriel · {a pair of}", exemple: "My [n:jeans] [v:are] new. · [k:a pair of] [n:glasses]" },
    ],
    usages: [
      { quand: "Donner des nouvelles", en: "I have some good [n:news].", fr: "J'ai une bonne nouvelle." },
      { quand: "Des meubles", en: "We bought new [n:furniture].", fr: "Nous avons acheté de nouveaux meubles." },
      { quand: "Des progrès", en: "You've made a lot of [n:progress].", fr: "Tu as fait beaucoup de progrès." },
      { quand: "Un vêtement « double »", en: "I need [k:a pair of] [n:shorts].", fr: "J'ai besoin d'un short." },
    ],
    francais:
      "Ce sont des masses en anglais, comme l'eau ou le sable : on peut en avoir beaucoup ({a lot of luggage}), pas « trois ». Le français, lui, compte « trois bagages », « des informations », « un conseil ». À l'inverse, « un pantalon », « des lunettes », « des ciseaux » sont des pluriels en anglais : {My trousers are black}.",
    pieges: [
      { faux: "She gave me [x:some advices].", juste: "She gave me [k:some] [n:advice].", pourquoi: "{advice} est indénombrable : jamais de {-s}." },
      { faux: "The news [x:are] bad.", juste: "The [n:news] [v:is] bad.", pourquoi: "{news} est un singulier, malgré son {s} final." },
      { faux: "I bought [x:a trouser].", juste: "I bought [k:a pair of] [n:trousers].", pourquoi: "{trousers} est toujours pluriel : on dit {a pair of trousers} (ou {some trousers})." },
    ],
    retenir: "{advice}, {news}, {information}, {furniture}, {luggage} : sans {a} ni {-s}. {trousers}, {glasses} : toujours au pluriel.",
  },

  accord: {
    regle:
      "En anglais, le verbe s'accorde parfois selon le sens plus que selon la forme. {everyone}, {everybody}, {nobody}, {each} et {every} + nom prennent le singulier ({Everyone is here}). {police}, {people}, {cattle} sont des pluriels ({The police are coming}). {a number of} + pluriel prend le pluriel, au sens de « beaucoup de » ({A number of students are absent}), mais {the number of} prend le singulier, au sens de « le nombre de » ({The number of students is rising}). Les noms de groupe ({team}, {family}, {government}) peuvent prendre les deux en anglais britannique.",
    forme: [
      { nom: "Toujours singulier", modele: "{everyone} / {nobody} / {each} + verbe au singulier", exemple: "[s:Nobody] [v:knows]." },
      { nom: "Toujours pluriel", modele: "{police} / {people} + verbe au pluriel", exemple: "[s:The police] [v:are] here." },
      { nom: "Le nombre", modele: "{a number of} + pluriel · {the number of} + singulier", exemple: "[s:The number of cars] [v:is] growing." },
    ],
    usages: [
      { quand: "Tout le monde", en: "[s:Everybody] [v:loves] her.", fr: "Tout le monde l'adore." },
      { quand: "Un groupe d'agents", en: "[s:The police] [v:have] arrested two men.", fr: "La police a arrêté deux hommes." },
      { quand: "Une quantité", en: "[s:A number of people] [v:have] complained.", fr: "Un certain nombre de personnes se sont plaintes." },
    ],
    francais:
      "Le français accorde « tout le monde » au singulier, comme l'anglais, mais aussi « la police », là où l'anglais met {police} au pluriel : ce sont des policiers. Retiens aussi que {people} est le pluriel de {person} : {Many people think…}, jamais {Many people thinks}.",
    pieges: [
      { faux: "The police [x:is] looking for him.", juste: "[s:The police] [v:are] looking for him.", pourquoi: "{police} est un pluriel en anglais." },
      { faux: "Everyone [x:have] a ticket.", juste: "[s:Everyone] [v:has] a ticket.", pourquoi: "{everyone} prend le singulier." },
      { faux: "The number of tourists [x:are] increasing.", juste: "[s:The number of tourists] [v:is] increasing.", pourquoi: "{the number of} (le nombre) est un singulier." },
    ],
    retenir: "{everyone} + singulier ; {police}, {people} + pluriel ; {a number of} + pluriel, {the number of} + singulier.",
  },

  concession: {
    regle:
      "Pour exprimer une concession (un obstacle qu'on surmonte) ou un contraste, l'anglais a plusieurs outils, chacun avec sa construction. {although}, {though}, {even though} + phrase complète ({Although it was raining, we went out}). {despite} / {in spite of} + nom ou {-ing} ({Despite the rain…}, {In spite of being tired…}). {However} relie deux phrases : il se met en tête de la seconde, suivi d'une virgule ({It was raining. However, we went out}). {whereas} (ou {while}) oppose deux faits ({He likes tea, whereas she prefers coffee}).",
    forme: [
      { nom: "+ phrase", modele: "{although} / {even though} + sujet + verbe", exemple: "[k:Although] it was late, we stayed." },
      { nom: "+ nom ou -ing", modele: "{despite} / {in spite of} + nom ou {-ing}", exemple: "[k:Despite] the rain, we went out." },
      { nom: "Entre deux phrases", modele: "Phrase. {However}, phrase.", exemple: "It's cheap. [k:However], it's slow." },
      { nom: "Un contraste", modele: "phrase, {whereas} + phrase", exemple: "I'm tall, [k:whereas] my sister is short." },
    ],
    usages: [
      { quand: "Un obstacle franchi", en: "[k:Even though] she was ill, she came to work.", fr: "Même si elle était malade, elle est venue travailler." },
      { quand: "Avec un nom", en: "[k:In spite of] the cold, the children played outside.", fr: "Malgré le froid, les enfants ont joué dehors." },
      { quand: "Une nuance", en: "The hotel was nice. [k:However], the food was awful.", fr: "L'hôtel était bien. En revanche, la nourriture était affreuse." },
      { quand: "Comparer", en: "Tom loves sport, [k:whereas] Ben hates it.", fr: "Tom adore le sport, alors que Ben le déteste." },
    ],
    francais:
      "« Malgré » se traduit par {despite} ou {in spite of}, suivis d'un nom ; « bien que » par {although}, suivi d'une phrase (et sans le subjonctif qu'exige le français). Deux pièges : {despite of} n'existe pas ({despite} s'emploie seul, {in spite} avec {of}), et {despite} n'est jamais suivi directement d'une phrase.",
    pieges: [
      { faux: "[x:Despite of] the rain, we went out.", juste: "[k:Despite] the rain, we went out.", pourquoi: "{despite} s'emploie sans {of} ; c'est {in spite of} qui en prend un." },
      { faux: "[x:Despite] it was raining, we went out.", juste: "[k:Although] it was raining, we went out.", pourquoi: "Devant une phrase complète, {although} ; {despite} se met devant un nom ou un {-ing}." },
      { faux: "It was cheap, [x:however] it was good.", juste: "It was cheap. [k:However], it was good.", pourquoi: "{however} ouvre une nouvelle phrase (ou suit un point-virgule) et prend une virgule." },
    ],
    retenir: "{although} + phrase ; {despite} / {in spite of} + nom ou {-ing} ; {However,} entre deux phrases.",
  },

  "whether-if": {
    regle:
      "Dans une question indirecte fermée (« si… »), on peut dire {if} ou {whether} : {I don't know if / whether he'll come}. Mais seul {whether} est possible dans certains cas : devant {to} + base ({I can't decide whether to go}), après une préposition ({It depends on whether…}), en début de phrase comme sujet ({Whether he comes or not doesn't matter}), et dans {whether or not}. À l'inverse, seul {if} convient pour une vraie condition, « si… alors » : {If it rains, we'll stay}.",
    forme: [
      { nom: "Question indirecte", modele: "{if} / {whether} + sujet + verbe", exemple: "I wonder [k:whether] she knows." },
      { nom: "Devant to", modele: "{whether} + {to} + base", exemple: "I don't know [k:whether] [k:to] [r:stay]." },
      { nom: "Après une préposition", modele: "préposition + {whether}", exemple: "It depends [k:on] [k:whether] it rains." },
      { nom: "Peu importe", modele: "{whether}… {or not}", exemple: "[k:Whether] you like it [k:or not], we're going." },
    ],
    usages: [
      { quand: "Un doute", en: "Ask him [k:whether] he wants tea.", fr: "Demande-lui s'il veut du thé." },
      { quand: "Une hésitation", en: "She's not sure [k:whether] [k:to] [r:accept].", fr: "Elle n'est pas sûre d'accepter." },
      { quand: "Une indifférence", en: "[k:Whether] it's sunny [k:or not], we'll walk.", fr: "Qu'il fasse beau ou non, nous irons marcher." },
    ],
    francais:
      "« Si » a deux sens en français : la condition (« si tu viens, je serai content ») et la question indirecte (« je me demande si tu viendras »). L'anglais peut les distinguer : {if} pour la condition, {if} ou {whether} pour la question indirecte, et {whether} seul dans les cas délicats. Dans une question indirecte, le futur reste possible ({I wonder if he will come}), alors qu'il est interdit juste après un {if} de condition.",
    pieges: [
      { faux: "I can't decide [x:if to] buy it.", juste: "I can't decide [k:whether] [k:to] [r:buy] it.", pourquoi: "Devant {to} + base, seul {whether} est possible." },
      { faux: "It depends [x:on if] we have time.", juste: "It depends [k:on] [k:whether] we have time.", pourquoi: "Après une préposition, {whether}, jamais {if}." },
      { faux: "[x:Whether] you need help, call me.", juste: "[k:If] you need help, call me.", pourquoi: "Pour une condition (« si… alors »), seul {if} convient." },
    ],
    retenir: "Question indirecte : {if} ou {whether} ; devant {to}, après une préposition, avec {or not} : {whether} ; condition : {if}.",
  },

  "faire-faire": {
    regle:
      "Pour dire qu'on fait faire quelque chose par quelqu'un d'autre, souvent un professionnel, l'anglais emploie {have} + objet + participe passé : {I had my hair cut} (je me suis fait couper les cheveux), {We're having the kitchen painted}. {get} + objet + participe passé a le même sens, en plus familier. La même structure décrit aussi une mésaventure : {He had his wallet stolen} (il s'est fait voler son portefeuille). {have} se conjugue à tous les temps, et l'objet se place toujours avant le participe.",
    forme: [
      { nom: "Faire faire", modele: "{have} + objet + participe passé", exemple: "I [a:had] my car [p:repaired]." },
      { nom: "Plus familier", modele: "{get} + objet + participe passé", exemple: "She [a:got] her nails [p:done]." },
      { nom: "Une mésaventure", modele: "{have} + objet + participe passé", exemple: "He [a:had] his bike [p:stolen]." },
    ],
    usages: [
      { quand: "Un service", en: "We [a:are having] a new kitchen [p:fitted].", fr: "Nous nous faisons installer une nouvelle cuisine." },
      { quand: "Un rendez-vous", en: "I need to [a:get] my eyes [p:tested].", fr: "Je dois me faire contrôler la vue." },
      { quand: "Un vol", en: "They [a:had] their house [p:burgled].", fr: "Ils se sont fait cambrioler." },
    ],
    francais:
      "Le français dit « je me suis fait couper les cheveux », avec « faire » + infinitif. La traduction mot à mot ({I made cut my hair}) ne marche pas : l'anglais dit {I had my hair cut}, avec l'objet au milieu et le participe à la fin. Et sans cette structure, {I cut my hair} voudrait dire que tu les as coupés toi-même !",
    pieges: [
      { faux: "I [x:made cut] my hair.", juste: "I [a:had] my hair [p:cut].", pourquoi: "Faire faire = {have} + objet + participe passé." },
      { faux: "I had [x:repaired my car].", juste: "I [a:had] my car [p:repaired].", pourquoi: "L'objet se place avant le participe ; sinon, {I had repaired} est un past perfect (« j'avais réparé »)." },
    ],
    retenir: "Faire faire = {have} (ou {get}) + objet + participe passé.",
  },

  "double-sens": {
    regle:
      "Certains verbes changent de sens selon la forme du verbe qui suit. En général, {-ing} renvoie à une action déjà faite ou en cours, et {to} + base à une action à faire. {remember} / {forget} + {-ing} = se souvenir d'avoir fait / oublier qu'on a fait ; + {to} = penser à faire / oublier de faire. {stop} + {-ing} = arrêter de faire ; + {to} = s'arrêter pour faire. {try} + {-ing} = essayer, tester un moyen ; + {to} = s'efforcer de. {regret} + {-ing} = regretter d'avoir fait ; + {to} = avoir le regret d'annoncer. {go on} + {-ing} = continuer ; + {to} = passer ensuite à.",
    forme: [
      { nom: "Se souvenir, penser à", modele: "{remember} + {-ing} (passé) · {remember to} + base (à faire)", exemple: "Remember [k:to] [r:lock] the door." },
      { nom: "Arrêter de, s'arrêter pour", modele: "{stop} + {-ing} · {stop to} + base", exemple: "He stopped [r:smok][t:ing]." },
      { nom: "Tester, s'efforcer", modele: "{try} + {-ing} · {try to} + base", exemple: "Try [r:restart][t:ing] the computer." },
    ],
    usages: [
      { quand: "Un souvenir", en: "I remember [r:meet][t:ing] her in 2010.", fr: "Je me souviens de l'avoir rencontrée en 2010." },
      { quand: "Une chose à faire", en: "Don't forget [k:to] [r:call] your mother.", fr: "N'oublie pas d'appeler ta mère." },
      { quand: "Une pause", en: "We stopped [k:to] [r:buy] some water.", fr: "Nous nous sommes arrêtés pour acheter de l'eau." },
      { quand: "Un regret", en: "I regret [r:say][t:ing] that.", fr: "Je regrette d'avoir dit ça." },
    ],
    francais:
      "Le français distingue ces sens par des constructions différentes (« se souvenir d'avoir fait » / « penser à faire », « arrêter de » / « s'arrêter pour ») ; l'anglais garde le même verbe et change seulement la forme qui suit. Retiens l'image : {-ing} regarde en arrière (l'action existe déjà), {to} regarde devant (l'action reste à faire).",
    pieges: [
      { faux: "He gave up cigarettes: he stopped [x:to smoke].", juste: "He gave up cigarettes: he stopped [r:smok][t:ing].", pourquoi: "« Arrêter de fumer » : {stop smoking}. {stop to smoke} voudrait dire « s'arrêter pour fumer »." },
      { faux: "Remember [x:locking] the door when you leave.", juste: "Remember [k:to] [r:lock] the door when you leave.", pourquoi: "Une action à faire dans l'avenir : {remember to}." },
      { faux: "I'll never forget [x:to see] the sea for the first time.", juste: "I'll never forget [r:see][t:ing] the sea for the first time.", pourquoi: "Le souvenir d'une action passée : {forget} + {-ing}." },
    ],
    retenir: "{-ing} = l'action déjà faite ; {to} + base = l'action à faire.",
  },

  "trio-particules": {
    regle:
      "Certains verbes à particule s'emploient avec une préposition en plus : verbe + particule + préposition, trois éléments inséparables. {look forward to} (avoir hâte de), {get on with} (bien s'entendre avec), {run out of} (manquer de, ne plus avoir), {put up with} (supporter), {come up with} (trouver une idée), {look up to} (admirer), {catch up with} (rattraper), {get away with} (s'en tirer). Le complément se place toujours après la préposition, jamais au milieu. Quand un verbe suit, il prend {-ing} : {I look forward to seeing you}.",
    forme: [
      { nom: "Le trio", modele: "verbe + particule + préposition + complément", exemple: "We [v:ran] [k:out of] milk." },
      { nom: "Avec un verbe", modele: "… + préposition + verbe en {-ing}", exemple: "I [v:look] [k:forward to] [r:hear][t:ing] from you." },
    ],
    usages: [
      { quand: "Une lettre formelle", en: "I [v:look] [k:forward to] [r:meet][t:ing] you.", fr: "Au plaisir de vous rencontrer." },
      { quand: "Une relation", en: "Do you [v:get] [k:on with] your boss?", fr: "Tu t'entends bien avec ton chef ?" },
      { quand: "Un manque", en: "The car [v:ran] [k:out of] petrol.", fr: "La voiture est tombée en panne d'essence." },
      { quand: "Supporter", en: "I can't [v:put] [k:up with] this noise.", fr: "Je ne supporte plus ce bruit." },
    ],
    francais:
      "Ces trios n'ont pas d'équivalent en français, qui emploie un seul verbe (« supporter », « admirer », « manquer de ») : apprends-les comme des blocs de vocabulaire. Le piège le plus fréquent concerne {look forward to} + verbe : ici, {to} est une préposition, donc le verbe qui suit prend {-ing}, jamais la base.",
    pieges: [
      { faux: "I look forward to [x:see] you.", juste: "I [v:look] [k:forward to] [r:see][t:ing] you.", pourquoi: "Après la préposition {to} de {look forward to}, le verbe prend {-ing}." },
      { faux: "We ran out [x:the] coffee.", juste: "We [v:ran] [k:out of] coffee.", pourquoi: "Le trio est inséparable : {run out of}, avec la préposition {of}." },
      { faux: "I can't put up [x:this noise with].", juste: "I can't [v:put] [k:up with] this noise.", pourquoi: "Le complément se place après le trio complet." },
    ],
    retenir: "Verbe + particule + préposition = un seul bloc ; après {look forward to}, {-ing}.",
  },

  projecteur: {
    regle:
      "Pour mettre une information en valeur, l'anglais a plusieurs projecteurs. La phrase clivée : {It is / was} + élément + {who} / {that} + reste de la phrase ({It was Tom who broke the vase} : c'est Tom qui a cassé le vase). La pseudo-clivée : {What} + sujet + verbe + {is / was} + élément ({What I need is a holiday} : ce dont j'ai besoin, ce sont des vacances). Et le {do} d'insistance, accentué à l'oral, devant la base verbale au présent ou au prétérit simple ({I do like it!} : si, j'aime vraiment ça ; {She did call you}).",
    forme: [
      { nom: "C'est… qui, que", modele: "{It is / was} + élément + {who} / {that}…", exemple: "[k:It was] Anna [k:who] called." },
      { nom: "Ce que…, c'est…", modele: "{What} + sujet + verbe + {is / was} + élément", exemple: "[k:What] I want [k:is] peace." },
      { nom: "Insistance", modele: "{do} / {does} / {did} + base", exemple: "I [a:do] [r:love] you." },
    ],
    usages: [
      { quand: "Corriger une erreur", en: "[k:It's] Sarah [k:who] won, not Lucy.", fr: "C'est Sarah qui a gagné, pas Lucy." },
      { quand: "Mettre un besoin en avant", en: "[k:What] we need [k:is] more time.", fr: "Ce qu'il nous faut, c'est plus de temps." },
      { quand: "Contredire", en: "I [a:did] [r:lock] the door, I'm sure!", fr: "Si, j'ai bien fermé la porte, j'en suis sûr !" },
    ],
    francais:
      "La phrase clivée existe en français (« c'est Tom qui… », « ce que je veux, c'est… ») et fonctionne pareil. Le {do} d'insistance, lui, n'a pas d'équivalent direct : il remplace notre « si », « vraiment », « bel et bien ». Attention : après {do}, {does}, {did}, le verbe revient à sa base ({She does work hard}).",
    pieges: [
      { faux: "It was Tom [x:which] broke it.", juste: "[k:It was] Tom [k:who] broke it.", pourquoi: "Pour une personne, {who} (ou {that}), pas {which}." },
      { faux: "I [x:do likes] it!", juste: "I [a:do] [r:like] it!", pourquoi: "Après le {do} d'insistance, le verbe est à la base ; et c'est {does} avec {he}, {she}, {it}." },
      { faux: "[x:What I need, it's] a holiday.", juste: "[k:What] I need [k:is] a holiday.", pourquoi: "Pas de {it} : {What I need is…}, avec {is} directement." },
    ],
    retenir: "{It was X who…}, {What I need is…}, et {do} + base pour insister.",
  },

  "phrases-eclair": {
    regle:
      "Une proposition participiale est une phrase raccourcie : on retire le sujet et l'auxiliaire, et il ne reste qu'un participe. Le participe présent ({-ing}) exprime une action active, en même temps ou juste avant l'action principale ({Walking home, I met Sam} : en rentrant à pied, j'ai croisé Sam). {Having} + participe passé souligne que l'action est terminée avant ({Having finished, she left}). Le participe passé seul a un sens passif ({Built in 1900, the house needs repairs}). Le sujet sous-entendu doit être le même que celui de la phrase principale.",
    forme: [
      { nom: "En même temps (actif)", modele: "verbe en {-ing}, phrase principale", exemple: "[r:Hear][t:ing] a noise, he turned round." },
      { nom: "Avant (actif)", modele: "{Having} + participe, phrase principale", exemple: "[a:Having] [p:eaten], we went out." },
      { nom: "Passif", modele: "participe passé, phrase principale", exemple: "[p:Written] in 1850, the book is still popular." },
    ],
    usages: [
      { quand: "Deux actions liées", en: "[r:Smil][t:ing], she opened the door.", fr: "Elle a ouvert la porte en souriant." },
      { quand: "Une cause", en: "[r:Feel][t:ing] tired, I went to bed early.", fr: "Comme je me sentais fatigué, je me suis couché tôt." },
      { quand: "Une étape terminée", en: "[a:Having] [p:lost] his keys, he called a locksmith.", fr: "Ayant perdu ses clés, il a appelé un serrurier." },
      { quand: "Une description passive", en: "[p:Made] in Italy, these shoes are expensive.", fr: "Fabriquées en Italie, ces chaussures sont chères." },
    ],
    francais:
      "Le français a le gérondif (« en marchant ») et le participe (« ayant fini », « construite en 1900 »), qui fonctionnent de la même façon. Le piège est le même dans les deux langues : le participe se rapporte au sujet de la phrase principale. {Walking home, the rain started} est faux, car ce n'est pas la pluie qui rentrait à pied !",
    pieges: [
      { faux: "[x:Walking home, the rain started].", juste: "[r:Walk][t:ing] home, I got caught in the rain.", pourquoi: "Le participe doit avoir le même sujet que la phrase principale : c'est moi qui marche, donc {I}." },
      { faux: "[x:Having finish] the test, she left.", juste: "[a:Having] [p:finished] the test, she left.", pourquoi: "Après {having}, il faut le participe passé." },
    ],
    retenir: "{-ing} = actif, en même temps ; {Having} + participe = avant ; participe passé = passif. Et le même sujet !",
  },

  "file-adjectifs": {
    regle:
      "Quand plusieurs adjectifs précèdent un nom, ils suivent un ordre que les anglophones respectent sans y penser : opinion ({lovely}), taille ({big}), âge ({old}), forme ({round}), couleur ({red}), origine ({French}), matière ({wooden}), usage ou type ({kitchen}), puis le nom : {a lovely old French wooden table}. Un nom peut aussi servir d'adjectif devant un autre nom (nom composé) : il reste alors au singulier ({a shoe shop}, {a ten-euro note}, {a five-minute walk}).",
    forme: [
      { nom: "L'ordre", modele: "opinion · taille · âge · forme · couleur · origine · matière · usage + nom", exemple: "a [j:beautiful] [j:big] [j:old] [n:house]" },
      { nom: "Nom + nom", modele: "nom (au singulier) + nom", exemple: "a [n:car] [n:park] · a [n:bus] [n:stop]" },
      { nom: "Nombre + nom", modele: "nombre-nom (singulier, avec trait d'union) + nom", exemple: "a [j:two-hour] [n:film]" },
    ],
    usages: [
      { quand: "Un objet décrit", en: "She bought a [j:lovely] [j:little] [j:silver] [n:ring].", fr: "Elle a acheté une jolie petite bague en argent." },
      { quand: "Un nom composé", en: "Let's meet at the [n:train] [n:station].", fr: "Retrouvons-nous à la gare." },
      { quand: "Une mesure", en: "It's a [j:ten-minute] [n:walk].", fr: "C'est à dix minutes à pied." },
    ],
    francais:
      "Le français place les adjectifs de part et d'autre du nom (« une jolie petite table ronde en bois ») ; l'anglais les met tous devant, dans l'ordre. Pour les noms composés, l'anglais se lit à l'envers : le nom principal est à la fin ({a shoe shop} = un magasin de chaussures), et le premier nom ne prend pas de {-s}, même s'il a un sens pluriel.",
    pieges: [
      { faux: "a [x:wooden old] chair", juste: "an [j:old] [j:wooden] [n:chair]", pourquoi: "L'âge vient avant la matière." },
      { faux: "a [x:shoes shop]", juste: "a [n:shoe] [n:shop]", pourquoi: "Le nom placé devant un autre nom reste au singulier." },
      { faux: "a two [x:hours] meeting", juste: "a [j:two-hour] [n:meeting]", pourquoi: "Dans un adjectif composé avec un nombre, le nom est au singulier, avec un trait d'union." },
    ],
    retenir: "Opinion, taille, âge, forme, couleur, origine, matière, usage + nom ; le nom placé devant reste au singulier.",
  },

  degre: {
    regle:
      "Les adverbes de degré règlent la force d'un adjectif, comme un bouton de volume : {a bit} ou {a little} (un peu), {fairly} (assez, modérément), {quite} ou {pretty} (assez, plutôt bien), {rather} (plutôt, souvent avec une nuance de surprise ou de reproche), {very} (très), {really} (vraiment), {extremely} (extrêmement). Avec les adjectifs « extrêmes », qui contiennent déjà l'idée de « très » ({freezing}, {exhausted}, {delicious}, {huge}, {amazing}), on n'emploie pas {very} mais {absolutely}, {totally} ou {really}.",
    forme: [
      { nom: "L'échelle", modele: "{a bit} < {fairly} < {quite} / {pretty} < {rather} < {very} < {extremely}", exemple: "It's [k:quite] [j:cold]." },
      { nom: "Adjectif extrême", modele: "{absolutely} / {really} + adjectif extrême", exemple: "I'm [k:absolutely] [j:exhausted]." },
    ],
    usages: [
      { quand: "Un peu", en: "I'm [k:a bit] [j:tired].", fr: "Je suis un peu fatigué." },
      { quand: "Modérément", en: "The test was [k:fairly] [j:easy].", fr: "Le contrôle était assez facile." },
      { quand: "Une bonne surprise", en: "The film was [k:rather] [j:good], actually.", fr: "Le film était plutôt bien, en fait." },
      { quand: "Un extrême", en: "This cake is [k:absolutely] [j:delicious]!", fr: "Ce gâteau est absolument délicieux !" },
    ],
    francais:
      "« Assez » a plusieurs traductions selon la force : {fairly} (modéré), {quite} (plutôt), {enough} (suffisamment). Le français familier dit parfois « très délicieux » ; en anglais, {very delicious} sonne faux : avec un adjectif qui est déjà un maximum, on prend {absolutely} ou {really}. Attention aussi : en britannique, {quite} devant un adjectif ordinaire veut dire « assez », pas « tout à fait ».",
    pieges: [
      { faux: "It's [x:very freezing] outside.", juste: "It's [k:absolutely] [j:freezing] outside.", pourquoi: "{freezing} est déjà extrême : {absolutely} ou {really}, pas {very}." },
      { faux: "I'm [x:absolutely tired].", juste: "I'm [k:very] [j:tired].", pourquoi: "{tired} est un adjectif ordinaire : {very}. Pour l'extrême : {absolutely exhausted}." },
    ],
    retenir: "{a bit} < {fairly} < {quite} < {rather} < {very} < {extremely} ; avec un adjectif extrême : {absolutely}.",
  },

  ecarts: {
    regle:
      "Pour mesurer l'écart dans une comparaison, on place un adverbe devant le comparatif : {much}, {far}, {a lot} (beaucoup plus : {much bigger}) ; {a bit}, {a little}, {slightly} (un peu plus : {slightly cheaper}) ; {even} (encore plus). Pour le superlatif : {by far the best} (de loin le meilleur). Pour multiplier : {twice as… as} (deux fois plus), {three times as… as}. Pour une évolution parallèle : {the} + comparatif…, {the} + comparatif ({The more you practise, the better you get}). Et pour « moins de » : {fewer} + pluriel, {less} + indénombrable.",
    forme: [
      { nom: "Beaucoup ou un peu plus", modele: "{much} / {far} / {a bit} + comparatif", exemple: "It's [k:much] [j:bigg][t:er]." },
      { nom: "De loin le meilleur", modele: "{by far} + superlatif", exemple: "She's [k:by far] the best." },
      { nom: "Deux fois plus", modele: "{twice as} + adjectif + {as}", exemple: "It's [k:twice as] [j:expensive] [k:as] mine." },
      { nom: "Plus…, plus…", modele: "{the} + comparatif…, {the} + comparatif", exemple: "[k:The] [j:soon][t:er], [k:the] [p:better]." },
      { nom: "Moins de", modele: "{fewer} + pluriel · {less} + indénombrable", exemple: "[k:fewer] [n:cars] · [k:less] [n:noise]" },
    ],
    usages: [
      { quand: "Un grand écart", en: "Trains are [k:far] [k:more] [j:comfortable] than buses.", fr: "Les trains sont bien plus confortables que les bus." },
      { quand: "Une multiplication", en: "Her house is [k:three times as] [j:big] [k:as] ours.", fr: "Sa maison est trois fois plus grande que la nôtre." },
      { quand: "Une évolution", en: "[k:The] [k:more] you read, [k:the] [k:more] you learn.", fr: "Plus on lit, plus on apprend." },
      { quand: "Moins de", en: "There are [k:fewer] [n:tourists] this year.", fr: "Il y a moins de touristes cette année." },
    ],
    francais:
      "« Beaucoup plus grand » ne se dit pas {very bigger} mais {much bigger} : {very} ne s'emploie jamais devant un comparatif. « Plus…, plus… » prend {the} des deux côtés. Et « moins de » se dédouble comme « beaucoup de » : {fewer} pour ce qu'on compte, {less} pour ce qu'on ne compte pas.",
    pieges: [
      { faux: "It's [x:very] cheaper here.", juste: "It's [k:much] [j:cheap][t:er] here.", pourquoi: "Devant un comparatif, {much} ou {far}, jamais {very}." },
      { faux: "[x:More] you work, [x:more] you earn.", juste: "[k:The] [k:more] you work, [k:the] [k:more] you earn.", pourquoi: "« Plus…, plus… » : {the more…, the more…}" },
      { faux: "There were [x:less] people than last year.", juste: "There were [k:fewer] [n:people] than last year.", pourquoi: "{people} se compte : {fewer} dans un anglais soigné." },
    ],
    retenir: "{much} / {far} + comparatif ; {twice as}… {as} ; {the more…, the more…} ; {fewer} + pluriel, {less} + indénombrable.",
  },
};
