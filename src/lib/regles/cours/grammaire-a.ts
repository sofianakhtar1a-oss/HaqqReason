import type { Cours } from "../types";

/**
 * Grammaire, paliers A1 et A2 : l'explication en français de chaque leçon.
 * Mots anglais dans le français : {ainsi}. Exemples anglais : couleurs de la démonstration, [j:red].
 */
export const COURS: Record<string, Cours> = {
  "train-des-mots": {
    regle:
      "La phrase anglaise suit presque toujours le même ordre : le sujet, le verbe, puis le complément ({Tom eats an apple}). Quand on ajoute des précisions, elles se rangent en fin de phrase, dans l'ordre manière, lieu, temps ({She sings beautifully at the theatre every night}). Le sujet est obligatoire, même quand il ne veut rien dire ({It's raining}), et l'on ne glisse rien entre le verbe et son complément direct.",
    forme: [
      { nom: "La base", modele: "sujet + verbe + complément", exemple: "[s:Anna] [v:reads] [c:books]." },
      { nom: "Avec des précisions", modele: "… + manière + lieu + temps", exemple: "[s:We] [v:play] [c:football] in the park on Sundays." },
      { nom: "Le temps en tête", modele: "temps, sujet + verbe + complément", exemple: "On Sundays, [s:we] [v:play] [c:football]." },
    ],
    usages: [
      { quand: "Une action simple", en: "[s:My sister] [v:likes] [c:chocolate].", fr: "Ma sœur aime le chocolat." },
      { quand: "Une phrase complète", en: "[s:He] [v:works] hard in an office every day.", fr: "Il travaille dur dans un bureau tous les jours." },
      { quand: "Le temps en tête de phrase", en: "Yesterday, [s:I] [v:met] [c:Sarah].", fr: "Hier, j'ai rencontré Sarah." },
    ],
    francais:
      "L'ordre de base est le même qu'en français (« Tom mange une pomme »). Les différences sont dans les détails : un adverbe ne se met jamais entre le verbe et son complément direct ({I like very much chocolate} est faux) ; le pronom complément ne se place jamais devant le verbe comme notre « je le vois » ({I see him}) ; et le sujet ne disparaît jamais.",
    pieges: [
      { faux: "I like [x:very much] chocolate.", juste: "[s:I] [v:like] [c:chocolate] very much.", pourquoi: "On ne sépare pas le verbe de son complément : {very much} va après." },
      { faux: "I [x:him] see.", juste: "[s:I] [v:see] [c:him].", pourquoi: "Le pronom complément se place après le verbe, jamais devant comme dans « je le vois »." },
      { faux: "I go [x:every day] to school.", juste: "[s:I] [v:go] to school every day.", pourquoi: "Le lieu vient avant le temps : {to school every day}." },
    ],
    retenir: "Sujet + verbe + complément, puis manière, lieu, temps : on ne change pas l'ordre des wagons.",
  },

  "ecrire-anglais": {
    regle:
      "L'anglais met une majuscule là où le français n'en met pas : au pronom {I} (toujours), aux jours ({Monday}), aux mois ({January}), aux langues ({English}), aux nationalités et à leurs adjectifs ({French}, {a Spanish car}), aux pays et aux fêtes ({Christmas}). Dans les titres, on met souvent une majuscule à chaque mot important. Côté ponctuation : pas d'espace avant {?}, {!}, {:} et {;}, et une virgule fréquente après un mot d'introduction ({However,}).",
    forme: [
      { nom: "Majuscules", modele: "{I} · jours · mois · langues · nationalités · pays · fêtes", exemple: "[n:I] speak [n:English] on [n:Mondays]." },
      { nom: "Ponctuation", modele: "pas d'espace avant {?} {!} {:} {;}", exemple: "Are you ready? Let's go!" },
      { nom: "Les nombres", modele: "virgule pour les milliers, point pour les décimales", exemple: "1,500 people · 2.5 kilos" },
    ],
    usages: [
      { quand: "Les jours et les mois", en: "My birthday is on [n:Friday], 3 [n:May].", fr: "Mon anniversaire est le vendredi 3 mai." },
      { quand: "Les nationalités", en: "She is [n:Italian] and speaks [n:French].", fr: "Elle est italienne et parle français." },
      { quand: "Une question", en: "Where do you live?", fr: "Où habites-tu ?" },
    ],
    francais:
      "En français, on écrit « lundi », « janvier », « l'anglais », « un étudiant français » sans majuscule, et on met une espace avant « ? », « ! », « : » et « ; ». L'anglais fait l'inverse sur ces deux points. Autre détail utile : les nombres. Le français écrit « 1 500 » et « 2,5 » ; l'anglais écrit {1,500} et {2.5}, avec la virgule et le point inversés.",
    pieges: [
      { faux: "I was born in [x:june].", juste: "I was born in [n:June].", pourquoi: "Les mois prennent toujours une majuscule en anglais." },
      { faux: "Do you speak [x:french] ?", juste: "Do you speak [n:French]?", pourquoi: "Majuscule aux langues, et pas d'espace avant le point d'interrogation." },
      { faux: "My brother and [x:i] are [x:english].", juste: "My brother and [n:I] are [n:English].", pourquoi: "{I} et les nationalités s'écrivent toujours avec une majuscule." },
    ],
    retenir: "Majuscule à {I}, aux jours, aux mois, aux langues et aux nationalités ; pas d'espace avant {?} {!} {:} {;}.",
  },

  "petits-gardiens": {
    regle:
      "{a} et {an} veulent dire « un » ou « une » : on les met devant un nom singulier qu'on peut compter, quand on en parle pour la première fois ou qu'on ne précise pas lequel ({a cat}). Le choix dépend du son qui suit, pas de la lettre : {a} devant un son de consonne ({a book}, {a university}), {an} devant un son de voyelle ({an apple}, {an hour}). {the} veut dire « le, la, les » : on l'emploie pour ce qui est déjà connu, unique ou précisé ({the sun}, {the book I bought}).",
    forme: [
      { nom: "Un, une (son consonne)", modele: "{a} + nom singulier", exemple: "[d:a] [n:dog] · [d:a] [n:university]" },
      { nom: "Un, une (son voyelle)", modele: "{an} + nom singulier", exemple: "[d:an] [n:egg] · [d:an] [n:hour]" },
      { nom: "Le, la, les (déjà connu)", modele: "{the} + nom", exemple: "[d:the] [n:dog] · [d:the] [n:children]" },
    ],
    usages: [
      { quand: "Première mention, puis rappel", en: "I saw [d:a] [n:film]. [d:The] [n:film] was great.", fr: "J'ai vu un film. Le film était génial." },
      { quand: "Un métier", en: "She is [d:a] [n:doctor].", fr: "Elle est médecin." },
      { quand: "Une chose unique", en: "Look at [d:the] [n:moon]!", fr: "Regarde la lune !" },
    ],
    francais:
      "Trois différences avec le français. {a} et {an} n'ont pas de pluriel : « des chats » se dit simplement {cats}. Pour un métier, l'anglais garde l'article : « elle est médecin » = {She is a doctor}. Et {the} ne change jamais, que le nom soit masculin, féminin, singulier ou pluriel.",
    pieges: [
      { faux: "She is [x:doctor].", juste: "She is [d:a] [n:doctor].", pourquoi: "Devant un métier, l'anglais met {a} ou {an}." },
      { faux: "[x:a] hour", juste: "[d:an] [n:hour]", pourquoi: "Le {h} de {hour} ne se prononce pas : le son est une voyelle, donc {an}." },
      { faux: "I have [x:a] friends.", juste: "I have [n:friends].", pourquoi: "{a} ne va qu'avec un singulier ; « des » ne se traduit pas." },
    ],
    retenir: "{a} + son consonne, {an} + son voyelle, {the} pour ce qui est connu.",
  },

  foule: {
    regle:
      "La plupart des noms prennent un {-s} au pluriel ({cat} → {cats}). Après {-s}, {-sh}, {-ch}, {-x} et souvent {-o}, on ajoute {-es} ({bus} → {buses}, {box} → {boxes}, {potato} → {potatoes}). Une consonne + {y} devient {-ies} ({city} → {cities}), mais une voyelle + {y} garde son {y} ({boy} → {boys}). Beaucoup de noms en {-f} ou {-fe} passent en {-ves} ({leaf} → {leaves}, {knife} → {knives}). Et quelques rebelles changent complètement : {man} → {men}, {woman} → {women}, {child} → {children}, {foot} → {feet}, {tooth} → {teeth}, {mouse} → {mice}, {person} → {people}.",
    forme: [
      { nom: "Règle générale", modele: "nom + {-s}", exemple: "[n:book][t:s]" },
      { nom: "Après s, sh, ch, x", modele: "nom + {-es}", exemple: "[n:box][t:es] · [n:watch][t:es]" },
      { nom: "Consonne + y", modele: "{y} → {-ies}", exemple: "[n:bab][t:ies]" },
      { nom: "En f ou fe", modele: "→ {-ves}", exemple: "[n:wi][t:ves]" },
      { nom: "Les rebelles", modele: "{men} · {women} · {children} · {feet} · {teeth} · {mice} · {people}", exemple: "[p:children] · [p:feet]" },
    ],
    usages: [
      { quand: "Un pluriel ordinaire", en: "I have two [n:cat][t:s].", fr: "J'ai deux chats." },
      { quand: "Un pluriel en -ies", en: "There are many [n:cit][t:ies] in Europe.", fr: "Il y a beaucoup de villes en Europe." },
      { quand: "Un pluriel rebelle", en: "Three [p:children] are playing.", fr: "Trois enfants jouent." },
    ],
    francais:
      "Comme en français, on ajoute le plus souvent un {-s}. Mais en anglais, ce {-s} se prononce toujours (/s/, /z/ ou /ɪz/), alors qu'en français il est muet : à l'oral, il ne faut pas l'avaler. Attention aussi à {people} : c'est déjà un pluriel (« les gens »), il ne prend pas de {-s}, et le verbe se met au pluriel : {People are nice}.",
    pieges: [
      { faux: "two [x:childs]", juste: "two [p:children]", pourquoi: "{child} est un rebelle : son pluriel est {children}." },
      { faux: "The people [x:is] nice.", juste: "The [p:people] [v:are] nice.", pourquoi: "{people} est un pluriel : le verbe se met au pluriel." },
      { faux: "two [x:babys]", juste: "two [n:bab][t:ies]", pourquoi: "Consonne + {y} : le {y} devient {ies}." },
    ],
    retenir: "+ {s}, + {es}, {y} → {ies}, {f} → {ves}… et les rebelles : {men}, {children}, {feet}, {people}.",
  },

  "adjectif-immobile": {
    regle:
      "En anglais, l'adjectif se place avant le nom qu'il décrit ({a red car}) ou après les verbes comme {be}, {look}, {seem}, {become} ({The car is red}). Il ne change jamais de forme : ni féminin, ni pluriel ({a tall man}, {a tall woman}, {tall people}). Quand il y en a plusieurs, ils suivent un ordre assez fixe : opinion, taille, âge, forme, couleur, origine, matière, puis le nom ({a beautiful old Italian table}).",
    forme: [
      { nom: "Devant le nom", modele: "adjectif + nom", exemple: "a [j:green] [n:bag]" },
      { nom: "Après be", modele: "sujet + {be} + adjectif", exemple: "The bag [a:is] [j:green]." },
      { nom: "Plusieurs adjectifs", modele: "opinion, taille, âge, couleur, origine, matière + nom", exemple: "a [j:lovely] [j:little] [j:red] [n:car]" },
    ],
    usages: [
      { quand: "Décrire", en: "She has [j:blue] [n:eyes].", fr: "Elle a les yeux bleus." },
      { quand: "Au pluriel, aucun changement", en: "They are [j:happy] [n:children].", fr: "Ce sont des enfants heureux." },
      { quand: "Après be", en: "The soup [a:is] [j:hot].", fr: "La soupe est chaude." },
    ],
    francais:
      "Le français place la plupart des adjectifs après le nom (« une voiture rouge ») et les accorde (« des voitures rouges »). L'anglais fait l'inverse : l'adjectif passe devant et reste invariable. Pense « une rouge voiture » : {a red car}. Les exceptions sont rares et figées ({something new}, {the people present}).",
    pieges: [
      { faux: "a car [x:red]", juste: "a [j:red] [n:car]", pourquoi: "L'adjectif se place avant le nom." },
      { faux: "two [x:bigs] dogs", juste: "two [j:big] [n:dogs]", pourquoi: "L'adjectif ne prend jamais de {-s}, même au pluriel." },
      { faux: "a [x:red big] ball", juste: "a [j:big] [j:red] [n:ball]", pourquoi: "La taille vient avant la couleur." },
    ],
    retenir: "Adjectif + nom, et l'adjectif ne change jamais.",
  },

  "his-ou-her": {
    regle:
      "Les adjectifs possessifs se placent devant le nom : {my} (mon, ma, mes), {your} (ton, ta, tes, votre, vos), {his} (son, sa, ses, pour un propriétaire masculin), {her} (son, sa, ses, pour une propriétaire féminine), {its} (son, sa, ses, pour une chose ou un animal), {our} (notre, nos), {their} (leur, leurs). Le choix dépend du propriétaire, jamais de l'objet possédé. Et ils ne changent pas au pluriel : {my book}, {my books}.",
    forme: [
      { nom: "Un propriétaire", modele: "{my} · {your} · {his} · {her} · {its}", exemple: "[s:Tom] and [d:his] sister" },
      { nom: "Plusieurs propriétaires", modele: "{our} · {your} · {their}", exemple: "[s:The kids] and [d:their] dog" },
    ],
    usages: [
      { quand: "Un propriétaire masculin", en: "Paul loves [d:his] mother.", fr: "Paul aime sa mère." },
      { quand: "Une propriétaire féminine", en: "Julie loves [d:her] father.", fr: "Julie aime son père." },
      { quand: "Une chose", en: "The tree lost [d:its] leaves.", fr: "L'arbre a perdu ses feuilles." },
    ],
    francais:
      "En français, « son », « sa », « ses » s'accordent avec l'objet possédé : « sa voiture », « son vélo ». En anglais, on regarde le propriétaire : {his car} (la voiture de Paul), {her bike} (le vélo de Julie). « Sa mère » peut donc être {his mother} ou {her mother} : tout dépend de qui on parle. Ne confonds pas {its} (possessif, sans apostrophe) et {it's} (= {it is}).",
    pieges: [
      { faux: "Paul and [x:her] sister.", juste: "Paul and [d:his] sister.", pourquoi: "Le propriétaire est Paul, un homme : {his}, même si « sœur » est féminin." },
      { faux: "The dog wags [x:it's] tail.", juste: "The dog wags [d:its] tail.", pourquoi: "{its} possessif s'écrit sans apostrophe ; {it's} veut dire {it is}." },
      { faux: "Anna and [x:his] brother.", juste: "Anna and [d:her] brother.", pourquoi: "Anna est une femme : {her}, même si « frère » est masculin." },
    ],
    retenir: "{his} ou {her} : on regarde le propriétaire, jamais l'objet.",
  },

  "ici-labas": {
    regle:
      "Les démonstratifs montrent quelque chose en tenant compte de la distance et du nombre. Ce qui est près de toi : {this} (ce, cette, ceci) au singulier, {these} (ces, ceux-ci) au pluriel. Ce qui est loin : {that} (ce, cette, cela) au singulier, {those} (ces, ceux-là) au pluriel. Ils s'emploient aussi seuls ({This is my brother}) et pour le temps : {this week} (cette semaine, celle où l'on est), {that day} (ce jour-là).",
    forme: [
      { nom: "Près", modele: "{this} + singulier · {these} + pluriel", exemple: "[d:this] [n:book] · [d:these] [n:books]" },
      { nom: "Loin", modele: "{that} + singulier · {those} + pluriel", exemple: "[d:that] [n:house] · [d:those] [n:houses]" },
    ],
    usages: [
      { quand: "Présenter quelqu'un", en: "[d:This] is my friend Sam.", fr: "Je te présente mon ami Sam." },
      { quand: "Montrer au loin", en: "Look at [d:those] [n:birds]!", fr: "Regarde ces oiseaux, là-bas !" },
      { quand: "Au téléphone", en: "Hello, [d:this] is Anna.", fr: "Allô, c'est Anna." },
    ],
    francais:
      "Le français a « ce, cette, ces » et ajoute « -ci » ou « -là » pour préciser. L'anglais met la distance dans le mot lui-même, et l'accorde au pluriel : {this} → {these}, {that} → {those}. À l'oral, distingue bien {this} (i bref) et {these} (i long).",
    pieges: [
      { faux: "[x:This] shoes are new.", juste: "[d:These] [n:shoes] are new.", pourquoi: "Au pluriel, {this} devient {these}." },
      { faux: "[x:That] people over there.", juste: "[d:Those] [n:people] over there.", pourquoi: "{people} est un pluriel : {those}." },
    ],
    retenir: "Près : {this} / {these}. Loin : {that} / {those}.",
  },

  "il-y-a": {
    regle:
      "Pour dire qu'une chose existe quelque part (« il y a »), l'anglais dit {there is} (souvent {there's}) devant un singulier ou un indénombrable, et {there are} devant un pluriel. Négation : {there isn't} / {there aren't} (ou {there is no} / {there are no}). Question : {Is there…?} / {Are there…?} Attention : « il y a » suivi d'une durée, au sens de « dans le passé », ne se dit pas {there is} mais {ago} : {two years ago}.",
    forme: [
      { nom: "Singulier", modele: "{there is} + singulier ou indénombrable", exemple: "[k:There] [a:is] a cat in the garden." },
      { nom: "Pluriel", modele: "{there are} + pluriel", exemple: "[k:There] [a:are] two cats." },
      { nom: "Question", modele: "{Is} / {Are there}… ?", exemple: "[a:Is] [k:there] a bank near here?" },
      { nom: "Il y a (passé)", modele: "durée + {ago}", exemple: "I met him ten years [k:ago]." },
    ],
    usages: [
      { quand: "Décrire un lieu", en: "[k:There] [a:are] three bedrooms in my flat.", fr: "Il y a trois chambres dans mon appartement." },
      { quand: "Demander", en: "[a:Is] [k:there] any milk?", fr: "Il y a du lait ?" },
      { quand: "Dire qu'il n'y a pas", en: "[k:There] [a:isn't] a cinema in my town.", fr: "Il n'y a pas de cinéma dans ma ville." },
    ],
    francais:
      "« Il y a » se traduit de deux façons. Pour l'existence : {there is} / {there are}, qui s'accorde avec ce qui suit (alors que le français ne change jamais). Pour le temps passé, « il y a deux ans » : {two years ago}, avec {ago} placé après la durée. Et ne traduis jamais « il y a » par {it has} ou {it is}.",
    pieges: [
      { faux: "[x:There is] two books.", juste: "[k:There] [a:are] two books.", pourquoi: "Devant un pluriel, {there are}." },
      { faux: "[x:It has] a park near my house.", juste: "[k:There] [a:is] a park near my house.", pourquoi: "« Il y a » (existence) se dit {there is}, jamais {it has}." },
      { faux: "I arrived [x:there are] two days.", juste: "I arrived two days [k:ago].", pourquoi: "« Il y a » + durée passée se dit avec {ago}, placé après la durée." },
    ],
    retenir: "{there is} + singulier, {there are} + pluriel ; « il y a deux jours » = {two days ago}.",
  },

  "ou-est-le-chat": {
    regle:
      "Les prépositions de lieu disent où se trouve quelque chose. {in} = dans, à l'intérieur ({in the box}, {in London}) ; {on} = sur, en contact avec une surface ({on the table}, {on the wall}) ; {under} = sous ; {next to} ou {beside} = à côté de ; {between} = entre ; {behind} = derrière ; {in front of} = devant ; {opposite} = en face de ; {above} = au-dessus, sans contact ; {at} = à, pour un point ou un lieu précis ({at the door}, {at school}, {at home}).",
    forme: [
      { nom: "Dedans, dessus, dessous", modele: "{in} · {on} · {under}", exemple: "The cat is [k:under] the bed." },
      { nom: "Autour", modele: "{next to} · {behind} · {in front of} · {opposite}", exemple: "The bank is [k:opposite] the station." },
      { nom: "Un point précis", modele: "{at} + lieu", exemple: "She's [k:at] the bus stop." },
    ],
    usages: [
      { quand: "Une ville, un pays", en: "I live [k:in] Paris.", fr: "J'habite à Paris." },
      { quand: "Une surface", en: "Your keys are [k:on] the table.", fr: "Tes clés sont sur la table." },
      { quand: "Un lieu d'activité", en: "He is [k:at] work.", fr: "Il est au travail." },
      { quand: "Entre deux choses", en: "The café is [k:between] the bank and the cinema.", fr: "Le café est entre la banque et le cinéma." },
    ],
    francais:
      "Le français dit « à » pour beaucoup de lieux (à Paris, à la maison, à l'école) ; l'anglais choisit selon le lieu : {in Paris} (une ville, un espace), {at home}, {at school} (un point d'activité). « Devant » se dit {in front of}, jamais {before}, qui parle du temps. Et « en face de » se dit {opposite}.",
    pieges: [
      { faux: "I live [x:at] London.", juste: "I live [k:in] London.", pourquoi: "Pour une ville ou un pays, on dit {in}." },
      { faux: "The car is [x:before] the house.", juste: "The car is [k:in front of] the house.", pourquoi: "« Devant » (un lieu) se dit {in front of} ; {before} veut dire « avant »." },
      { faux: "The picture is [x:in] the wall.", juste: "The picture is [k:on] the wall.", pourquoi: "Un tableau est posé contre une surface : {on}." },
    ],
    retenir: "{in} = dedans, {on} = sur une surface, {at} = un point précis, {in front of} = devant.",
  },

  "mots-questions": {
    regle:
      "Les mots interrogatifs se placent en tête de la question : {what} (quoi, quel), {where} (où), {who} (qui), {when} (quand), {why} (pourquoi), {how} (comment), {which} (lequel, parmi un choix), {whose} (à qui). Vient ensuite l'ordre de la question : auxiliaire ({do}, {does}, {did}, {be}, {can}…) + sujet + verbe. {How} forme aussi des questions composées : {How old?} (quel âge ?), {How much?} (combien, pour ce qu'on ne compte pas), {How many?} (combien, pour ce qu'on compte), {How long?} (combien de temps ?).",
    forme: [
      { nom: "La structure", modele: "mot-question + auxiliaire + sujet + verbe ?", exemple: "[k:Where] [a:do] [s:you] [v:live]?" },
      { nom: "Avec be", modele: "mot-question + {be} + sujet ?", exemple: "[k:Who] [a:is] [s:that man]?" },
      { nom: "Combien", modele: "{How much} + indénombrable · {How many} + pluriel", exemple: "[k:How many] brothers [a:do] you have?" },
    ],
    usages: [
      { quand: "Un lieu", en: "[k:Where] [a:is] the station?", fr: "Où est la gare ?" },
      { quand: "Une raison", en: "[k:Why] [a:are] you sad?", fr: "Pourquoi es-tu triste ?" },
      { quand: "Une manière", en: "[k:How] [a:do] you [v:spell] your name?", fr: "Comment s'écrit ton nom ?" },
      { quand: "Un prix", en: "[k:How much] [a:is] this jacket?", fr: "Combien coûte cette veste ?" },
    ],
    francais:
      "Le français accepte plusieurs ordres (« Tu habites où ? », « Où tu habites ? », « Où habites-tu ? ») ; l'anglais n'en accepte qu'un : le mot-question en tête, puis l'auxiliaire. Mais quand {who} ou {what} est lui-même le sujet, il n'y a pas d'auxiliaire : {Who called you?} (qui t'a appelé ?), alors qu'on dit {Who did you call?} (qui as-tu appelé ?).",
    pieges: [
      { faux: "[x:Where you live]?", juste: "[k:Where] [a:do] [s:you] [v:live]?", pourquoi: "Après le mot-question, il faut l'auxiliaire {do} avant le sujet." },
      { faux: "[x:How much] apples do you want?", juste: "[k:How many] apples do you want?", pourquoi: "{apples} se compte : {How many}. {How much} est pour ce qu'on ne compte pas ({How much water?})." },
      { faux: "Who [x:did call] you?", juste: "[k:Who] [v:called] you?", pourquoi: "Quand {who} est le sujet de la question, pas de {did}." },
    ],
    retenir: "Mot-question + auxiliaire + sujet + verbe ? (sauf quand le mot-question est lui-même le sujet).",
  },

  "nombres-dates": {
    regle:
      "Pour les dates, l'anglais emploie les nombres ordinaux (de rang) : {first} (1st), {second} (2nd), {third} (3rd), puis {-th} ({fourth}, {fifth}, {twelfth}, {twentieth}…), et {twenty-first} (21st). À l'oral, on dit {the third of May} ou {May the third} ; à l'écrit, {3 May} (britannique) ou {May 3} (américain). Pour l'heure : {o'clock} pour l'heure pile, {half past} (et demie), {a quarter past} (et quart), {a quarter to} (moins le quart), et {past} / {to} avec les minutes ({ten past six}, {twenty to eight}).",
    forme: [
      { nom: "Les ordinaux", modele: "{first} · {second} · {third} · {fourth}…", exemple: "the [j:first] day · the [j:twenty-second] floor" },
      { nom: "Dire une date", modele: "{the} + ordinal + {of} + mois", exemple: "It's [d:the] [j:fifth] [k:of] March." },
      { nom: "L'heure", modele: "minutes + {past} / {to} + heure · {o'clock}", exemple: "It's [c:a quarter] [k:past] six." },
    ],
    usages: [
      { quand: "Un anniversaire", en: "My birthday is on [d:the] [j:twelfth] [k:of] July.", fr: "Mon anniversaire est le 12 juillet." },
      { quand: "Une heure pile", en: "The film starts at eight [k:o'clock].", fr: "Le film commence à huit heures." },
      { quand: "Une demi-heure", en: "I get up at [c:half] [k:past] seven.", fr: "Je me lève à sept heures et demie." },
    ],
    francais:
      "Le français dit « le 3 mai » avec un nombre ordinaire (sauf « le premier ») ; l'anglais emploie le rang pour tous les jours : {the third of May}. Pour l'heure, l'anglais compte surtout sur douze heures, avec {a.m.} (le matin) et {p.m.} (l'après-midi et le soir) : 15 h = {3 p.m.} « Sept heures et demie » se dit {half past seven} ; {half seven} est familier en anglais britannique.",
    pieges: [
      { faux: "the [x:three] of May", juste: "the [j:third] of May", pourquoi: "Dans une date, on emploie l'ordinal : {third}, pas {three}." },
      { faux: "It's [x:seven and half].", juste: "It's [c:half] [k:past] seven.", pourquoi: "« Sept heures et demie » se dit {half past seven}." },
      { faux: "the [x:twenty-oneth]", juste: "the [j:twenty-first]", pourquoi: "Les nombres terminés par 1, 2, 3 gardent {first}, {second}, {third} : {twenty-first}, {thirty-second}." },
    ],
    retenir: "Dates : {the} + ordinal + {of} + mois. Heure : {past} / {to} et {o'clock}.",
  },

  "apostrophe-possede": {
    regle:
      "Pour dire à qui appartient une chose, ou à qui l'on est lié, l'anglais colle {'s} au propriétaire, placé avant l'objet : {Tom's car} (la voiture de Tom). Si le propriétaire est un pluriel en {-s}, on ajoute seulement l'apostrophe : {my parents' house} (la maison de mes parents). Les pluriels irréguliers prennent {'s} : {the children's room}. Pour les choses, on emploie plutôt {of} ({the end of the film}), et l'on dit {at Tom's} pour « chez Tom ».",
    forme: [
      { nom: "Propriétaire singulier", modele: "propriétaire + {'s} + objet", exemple: "[s:Anna][t:'s] [n:bag]" },
      { nom: "Pluriel en -s", modele: "propriétaire + {'} + objet", exemple: "[s:the girls][t:'] [n:room]" },
      { nom: "Pluriel irrégulier", modele: "propriétaire + {'s} + objet", exemple: "[s:the children][t:'s] [n:toys]" },
      { nom: "Pour une chose", modele: "objet + {of} + chose", exemple: "the [n:door] [k:of] the house" },
    ],
    usages: [
      { quand: "La famille", en: "This is [s:my sister][t:'s] [n:husband].", fr: "C'est le mari de ma sœur." },
      { quand: "Plusieurs propriétaires", en: "[s:My parents][t:'] [n:car] is blue.", fr: "La voiture de mes parents est bleue." },
      { quand: "Chez quelqu'un", en: "We had dinner at [s:Paul][t:'s].", fr: "Nous avons dîné chez Paul." },
      { quand: "Le temps", en: "[s:Today][t:'s] [n:news]", fr: "Les informations du jour" },
    ],
    francais:
      "Le français dit « la voiture de Tom », l'objet d'abord ; l'anglais fait l'inverse : {Tom's car}, le propriétaire d'abord, et sans article devant l'objet. Pense « Tom-sa voiture ». Pour une personne, évite la traduction mot à mot {the car of Tom}.",
    pieges: [
      { faux: "[x:the car of my father]", juste: "[s:my father][t:'s] [n:car]", pourquoi: "Pour une personne, l'anglais préfère le génitif : propriétaire + {'s} + objet." },
      { faux: "[x:The Tom's] bike", juste: "[s:Tom][t:'s] [n:bike]", pourquoi: "Pas d'article devant un génitif avec un nom propre." },
      { faux: "my [x:parent's] house", juste: "my [s:parents][t:'] [n:house]", pourquoi: "Pour deux parents (un pluriel en {-s}), l'apostrophe se met après le {s} : {parents'}." },
    ],
    retenir: "Propriétaire + {'s} + objet ; pluriel en {-s} : juste {'}.",
  },

  compter: {
    regle:
      "Les noms dénombrables désignent ce qu'on peut compter : ils ont un singulier et un pluriel ({an apple}, {two apples}). Les indénombrables désignent une matière, une masse ou une idée : pas de pluriel, pas de {a} ({water}, {money}, {music}, {advice}, {information}, {furniture}, {news}). Pour la quantité : {many} + pluriel ({many books}), {much} + indénombrable ({much time}), surtout dans les questions et les négations ; {a lot of} (ou {lots of}) va avec les deux, surtout à l'affirmative. Peu : {few} + pluriel, {little} + indénombrable.",
    forme: [
      { nom: "Beaucoup (pluriel)", modele: "{many} / {a lot of} + pluriel", exemple: "[k:many] [n:friends]" },
      { nom: "Beaucoup (masse)", modele: "{much} / {a lot of} + indénombrable", exemple: "[k:much] [n:money]" },
      { nom: "Peu", modele: "{few} + pluriel · {little} + indénombrable", exemple: "[k:little] [n:time] · [k:few] [n:people]" },
      { nom: "Combien", modele: "{How many} + pluriel · {How much} + indénombrable", exemple: "[k:How much] [n:sugar]?" },
    ],
    usages: [
      { quand: "Une question", en: "How [k:many] [n:children] do you have?", fr: "Combien d'enfants as-tu ?" },
      { quand: "Une négation", en: "I don't have [k:much] [n:time].", fr: "Je n'ai pas beaucoup de temps." },
      { quand: "Une affirmation", en: "She has [k:a lot of] [n:books].", fr: "Elle a beaucoup de livres." },
      { quand: "Un conseil", en: "Can I give you some [n:advice]?", fr: "Je peux te donner un conseil ?" },
    ],
    francais:
      "Certains noms qu'on compte en français sont indénombrables en anglais : {advice} (des conseils), {information} (des informations), {news} (des nouvelles), {furniture} (des meubles), {luggage} (des bagages), {homework} (des devoirs). Ils ne prennent jamais de {-s} ni de {a}. Pour en isoler un, on dit {a piece of} : {a piece of advice} (un conseil).",
    pieges: [
      { faux: "She gave me [x:an advice].", juste: "She gave me [k:a piece of] [n:advice].", pourquoi: "{advice} est indénombrable : pas de {an}. On dit {some advice} ou {a piece of advice}." },
      { faux: "I have [x:many] money.", juste: "I have [k:a lot of] [n:money].", pourquoi: "{money} ne se compte pas : {much} (question, négation) ou {a lot of}." },
      { faux: "The [x:informations are] useful.", juste: "The [n:information] [v:is] useful.", pourquoi: "{information} est indénombrable : pas de {-s}, et le verbe au singulier." },
    ],
    retenir: "{many} + ce qu'on compte, {much} + ce qu'on ne compte pas, {a lot of} + les deux.",
  },

  "some-any": {
    regle:
      "{some} (du, de la, des, quelques) s'emploie surtout dans les phrases affirmatives ({I have some money}) et dans les offres ou les demandes polies ({Would you like some tea?}). {any} s'emploie dans les questions ({Do you have any money?}) et les négations ({I don't have any money}). {no} = {not any}, avec un verbe affirmatif ({I have no money}). Les composés suivent la même logique : {somebody} / {something} / {somewhere}, {anybody} / {anything} / {anywhere}, {nobody} / {nothing} / {nowhere}.",
    forme: [
      { nom: "Affirmation, offre", modele: "{some} · {somebody} · {something}", exemple: "I need [k:some] help." },
      { nom: "Question, négation", modele: "{any} · {anybody} · {anything}", exemple: "Is there [k:anything] to eat?" },
      { nom: "Le zéro", modele: "{no} · {nobody} · {nothing} + verbe affirmatif", exemple: "There's [k:nothing] in the fridge." },
    ],
    usages: [
      { quand: "Une quantité", en: "There are [k:some] apples on the table.", fr: "Il y a des pommes sur la table." },
      { quand: "Une offre", en: "Would you like [k:some] cake?", fr: "Tu veux du gâteau ?" },
      { quand: "Une négation", en: "I didn't see [k:anybody].", fr: "Je n'ai vu personne." },
      { quand: "N'importe lequel", en: "You can choose [k:any] colour.", fr: "Tu peux choisir n'importe quelle couleur." },
    ],
    francais:
      "« Du », « de la », « des » se traduisent par {some}, ou par rien du tout quand on parle en général ({I like music}). Le grand piège est la double négation : le français dit « je ne vois personne » (deux mots négatifs), l'anglais n'en garde qu'un : {I don't see anybody} ou {I see nobody}, jamais {I don't see nobody}. À l'affirmative, {any} veut dire « n'importe quel ».",
    pieges: [
      { faux: "I don't know [x:nobody].", juste: "I don't know [k:anybody].", pourquoi: "Une seule négation par phrase : {don't} + {anybody}, ou {I know nobody}." },
      { faux: "There isn't [x:some] milk.", juste: "There isn't [k:any] milk.", pourquoi: "À la négation, on emploie {any}." },
      { faux: "I [x:didn't do nothing].", juste: "I didn't do [k:anything].", pourquoi: "Avec {didn't}, on prend {anything} ; sinon, {I did nothing}." },
    ],
    retenir: "{some} pour affirmer et offrir, {any} pour questionner et nier, {no} = {not any}.",
  },

  "il-y-avait": {
    regle:
      "{There is} voyage dans tous les temps : seul {be} se conjugue, {there} ne bouge pas. Passé : {there was} + singulier, {there were} + pluriel (il y avait, il y a eu). Futur : {there will be} (il y aura). Present perfect : {there has been} / {there have been} (il y a eu, récemment ou jusqu'ici). Avec un modal : {there might be}, {there must be}, {there could be}. Et pour la question : {Was there…?}, {Will there be…?}",
    forme: [
      { nom: "Passé", modele: "{there was} + singulier · {there were} + pluriel", exemple: "[k:There] [a:were] many people." },
      { nom: "Futur", modele: "{there will be} + nom", exemple: "[k:There] [a:will be] a party." },
      { nom: "Present perfect", modele: "{there has} / {have been} + nom", exemple: "[k:There] [a:has been] an accident." },
      { nom: "Question", modele: "{Was there}… ? · {Will there be}… ?", exemple: "[a:Will] [k:there] [a:be] food?" },
    ],
    usages: [
      { quand: "Décrire le passé", en: "[k:There] [a:was] a castle here.", fr: "Il y avait un château ici." },
      { quand: "Annoncer", en: "[k:There] [a:will be] rain tomorrow.", fr: "Il y aura de la pluie demain." },
      { quand: "Une nouvelle", en: "[k:There] [a:have been] three accidents this week.", fr: "Il y a eu trois accidents cette semaine." },
    ],
    francais:
      "« Il y avait », « il y a eu », « il y aura » : le français conjugue « avoir », l'anglais conjugue {be}, toujours accordé avec ce qui suit ({there was a cat}, {there were two cats}). Ne remplace jamais {there} par {it} : {It was a lot of people} est une faute très fréquente.",
    pieges: [
      { faux: "[x:There was] a lot of cars.", juste: "[k:There] [a:were] a lot of cars.", pourquoi: "{cars} est un pluriel : {there were}." },
      { faux: "[x:It will have] a concert.", juste: "[k:There] [a:will be] a concert.", pourquoi: "« Il y aura » se dit {there will be}, avec {be}." },
      { faux: "[x:It was] many people at the party.", juste: "[k:There] [a:were] many people at the party.", pourquoi: "« Il y avait » se dit {there was} / {there were}, jamais {it was}." },
    ],
    retenir: "{there} ne bouge pas, {be} se conjugue : {there was / were}, {there will be}, {there has been}.",
  },

  match: {
    regle:
      "Pour comparer deux éléments, on ajoute {-er} aux adjectifs courts (une syllabe, ou deux syllabes en {-y}) : {tall} → {taller}, {big} → {bigger}, {happy} → {happier}. Les adjectifs longs prennent {more} devant : {more expensive}, {more interesting}. Le second élément est introduit par {than} (que). Quelques irréguliers : {good} → {better}, {bad} → {worse}, {far} → {further}. Pour l'égalité : {as} + adjectif + {as} ; pour l'infériorité : {less} + adjectif + {than}, ou {not as}… {as}.",
    forme: [
      { nom: "Adjectif court", modele: "adjectif + {-er} + {than}", exemple: "Tom is [j:tall][t:er] [k:than] Sam." },
      { nom: "Adjectif long", modele: "{more} + adjectif + {than}", exemple: "This is [k:more] [j:expensive] [k:than] that." },
      { nom: "Irréguliers", modele: "{better} · {worse} · {further}", exemple: "Your idea is [p:better] [k:than] mine." },
      { nom: "Égalité", modele: "{as} + adjectif + {as}", exemple: "She is [k:as] [j:tall] [k:as] her mother." },
    ],
    usages: [
      { quand: "Deux personnes", en: "My brother is [j:old][t:er] [k:than] me.", fr: "Mon frère est plus âgé que moi." },
      { quand: "Deux objets", en: "The train is [k:more] [j:comfortable] [k:than] the bus.", fr: "Le train est plus confortable que le bus." },
      { quand: "Une évolution", en: "It's getting [j:cold][t:er] and [j:cold][t:er].", fr: "Il fait de plus en plus froid." },
    ],
    francais:
      "Le français dit toujours « plus » + adjectif. L'anglais choisit selon la longueur : {-er} pour les mots courts, {more} pour les longs, mais jamais les deux à la fois ({more taller} est faux). Orthographe : on double la consonne finale après une voyelle courte ({big} → {bigger}, {hot} → {hotter}) et le {y} devient {i} ({easy} → {easier}). Et « que » se dit {than}, pas {that}.",
    pieges: [
      { faux: "She is [x:more tall] than me.", juste: "She is [j:tall][t:er] [k:than] me.", pourquoi: "{tall} est court : {taller}, sans {more}." },
      { faux: "This book is [x:more better].", juste: "This book is [p:better].", pourquoi: "{better} est déjà un comparatif : pas de {more} devant." },
      { faux: "He is older [x:that] me.", juste: "He is [j:old][t:er] [k:than] me.", pourquoi: "Dans une comparaison, « que » se dit {than}." },
    ],
    retenir: "Court : {-er} + {than}. Long : {more} + adjectif + {than}. Égalité : {as}… {as}.",
  },

  podium: {
    regle:
      "Le superlatif désigne le premier ou le dernier d'un groupe. Les adjectifs courts prennent {the} + {-est} ({the tallest}, {the biggest}, {the happiest}), les longs prennent {the most} + adjectif ({the most beautiful}). Irréguliers : {good} → {the best}, {bad} → {the worst}, {far} → {the furthest}. Le groupe de comparaison est introduit par {in} pour un lieu ou un groupe ({the tallest in the class}) et par {of} pour une période ou un ensemble ({the best day of my life}).",
    forme: [
      { nom: "Adjectif court", modele: "{the} + adjectif + {-est}", exemple: "[d:the] [j:fast][t:est] runner" },
      { nom: "Adjectif long", modele: "{the most} + adjectif", exemple: "[d:the] [k:most] [j:famous] painter" },
      { nom: "Irréguliers", modele: "{the best} · {the worst} · {the furthest}", exemple: "[d:the] [p:best] day of my life" },
      { nom: "Le groupe", modele: "… {in} + lieu, groupe · {of} + ensemble, période", exemple: "the tallest building [k:in] the world" },
    ],
    usages: [
      { quand: "Un record", en: "It's [d:the] [j:long][t:est] river [k:in] Africa.", fr: "C'est le plus long fleuve d'Afrique." },
      { quand: "Un souvenir", en: "It was [d:the] [p:best] holiday [k:of] my life.", fr: "C'étaient les meilleures vacances de ma vie." },
      { quand: "Un jugement", en: "She's [d:the] [k:most] [j:intelligent] person I know.", fr: "C'est la personne la plus intelligente que je connaisse." },
    ],
    francais:
      "Le français dit « le plus » + adjectif ; l'anglais suit la même règle que pour le comparatif : {-est} pour les courts, {most} pour les longs, jamais les deux ({the most tallest} est faux). Et « du monde », « de la classe » se disent avec {in}, pas avec {of} : {the best player in the team}.",
    pieges: [
      { faux: "the [x:most big] house", juste: "[d:the] [j:bigg][t:est] house", pourquoi: "{big} est court : {the biggest}, avec la consonne doublée." },
      { faux: "the best student [x:of] the school", juste: "the [p:best] student [k:in] the school", pourquoi: "Pour un lieu ou un groupe, on emploie {in}." },
      { faux: "She is [x:most] beautiful girl.", juste: "She is [d:the] [k:most] [j:beautiful] girl.", pourquoi: "Le superlatif garde toujours {the}." },
    ],
    retenir: "Court : {the} + {-est}. Long : {the most} + adjectif. Et toujours {the}.",
  },

  "pareil-different": {
    regle:
      "Pour l'égalité : {as} + adjectif + {as} ({as tall as}) ; pour « pas aussi… que » : {not as… as}. Pour dire qu'une chose est identique : {the same as} ({My phone is the same as yours}) ; semblable : {similar to} ; différente : {different from} ({different to} en britannique courant). Enfin, {like} + nom compare (« comme, pareil à » : {He swims like a fish}), alors que {as} + nom indique un rôle réel, une fonction (« en tant que » : {She works as a nurse}).",
    forme: [
      { nom: "Autant que", modele: "{as} + adjectif + {as} · {not as}… {as}", exemple: "He's [k:not as] [j:tall] [k:as] me." },
      { nom: "Pareil", modele: "{the same as} · {the same} + nom + {as}", exemple: "Her bag is [k:the same as] mine." },
      { nom: "Semblable, différent", modele: "{similar to} · {different from}", exemple: "French is [j:different] [k:from] English." },
      { nom: "Comme : comparaison ou rôle", modele: "{like} + nom · {as} + nom", exemple: "He works [k:as] a waiter." },
    ],
    usages: [
      { quand: "Une égalité", en: "This film is [k:as] [j:good] [k:as] the book.", fr: "Ce film est aussi bon que le livre." },
      { quand: "Une ressemblance", en: "You look [k:like] your father.", fr: "Tu ressembles à ton père." },
      { quand: "Un rôle", en: "I used my coat [k:as] a pillow.", fr: "Je me suis servi de mon manteau comme oreiller." },
    ],
    francais:
      "Le français dit « comme » dans les deux cas ; l'anglais distingue {like} quand on compare (« il nage comme un poisson », mais ce n'est pas un poisson) et {as} quand c'est un vrai rôle (« il travaille comme serveur », il l'est vraiment). Et « différent de » se dit {different from}, pas {different of}.",
    pieges: [
      { faux: "She works [x:like] a teacher.", juste: "She works [k:as] a teacher.", pourquoi: "C'est son vrai métier : {as} (en tant que)." },
      { faux: "It's different [x:of] mine.", juste: "It's [j:different] [k:from] mine.", pourquoi: "« Différent de » se dit {different from}." },
      { faux: "He is [x:as tall than] me.", juste: "He is [k:as] [j:tall] [k:as] me.", pourquoi: "L'égalité se dit {as}… {as}, jamais {as}… {than}." },
    ],
    retenir: "{as}… {as} = autant que ; {the same as} = pareil ; {different from} ; {like} pour comparer, {as} pour un rôle.",
  },

  "ly-frequence": {
    regle:
      "Les adverbes de manière disent comment on agit. Beaucoup se forment en ajoutant {-ly} à l'adjectif, comme notre « -ment » : {quick} → {quickly}, {careful} → {carefully}, {happy} → {happily}. Quelques-uns sont irréguliers : {good} → {well}, et {fast}, {hard}, {late} ne changent pas. Ils se placent en général après le verbe et son complément. Les adverbes de fréquence ({always}, {usually}, {often}, {sometimes}, {rarely}, {never}) se placent avant le verbe principal, mais après {be} : {She always smiles}, {She is always happy}.",
    forme: [
      { nom: "Manière", modele: "adjectif + {-ly}", exemple: "She speaks [j:slow][t:ly]." },
      { nom: "Irréguliers", modele: "{good} → {well} · {fast}, {hard} ne changent pas", exemple: "He plays [p:well]." },
      { nom: "Fréquence (verbe)", modele: "sujet + adverbe + verbe", exemple: "I [k:often] [v:walk] to work." },
      { nom: "Fréquence (be)", modele: "sujet + {be} + adverbe", exemple: "He [a:is] [k:never] late." },
    ],
    usages: [
      { quand: "Une manière", en: "Please drive [j:careful][t:ly].", fr: "Conduis prudemment, s'il te plaît." },
      { quand: "Une habitude", en: "We [k:usually] [v:eat] at seven.", fr: "D'habitude, nous mangeons à sept heures." },
      { quand: "Un état fréquent", en: "She [a:is] [k:always] busy.", fr: "Elle est toujours occupée." },
    ],
    francais:
      "Le français place souvent l'adverbe de fréquence après le verbe (« je mange souvent ») ; l'anglais le met devant : {I often eat}. Pour la manière, attention à « bien » : l'adjectif {good} décrit une chose ou une personne ({a good singer}), l'adverbe {well} décrit une action ({She sings well}). Et {hardly} n'est pas l'adverbe de {hard} : il veut dire « à peine ».",
    pieges: [
      { faux: "He speaks English [x:good].", juste: "He speaks English [p:well].", pourquoi: "Pour décrire une action, il faut l'adverbe {well}, pas l'adjectif {good}." },
      { faux: "I [x:eat often] pasta.", juste: "I [k:often] [v:eat] pasta.", pourquoi: "L'adverbe de fréquence se place avant le verbe principal." },
      { faux: "She [x:always is] late.", juste: "She [a:is] [k:always] late.", pourquoi: "Avec {be}, l'adverbe de fréquence se met après." },
    ],
    retenir: "Manière : adjectif + {-ly} ({good} → {well}). Fréquence : avant le verbe, après {be}.",
  },

  remplacants: {
    regle:
      "Quand un pronom n'est pas sujet mais complément (après un verbe ou une préposition), il change de forme : {I} → {me}, {he} → {him}, {she} → {her}, {we} → {us}, {they} → {them}. {you} et {it} restent identiques. Le pronom complément se place après le verbe ({I love her}) ou après la préposition ({with them}, {for me}). Il s'emploie aussi seul dans les réponses courtes ({Who wants cake? — Me!}).",
    forme: [
      { nom: "Sujet → complément", modele: "{I} → {me} · {he} → {him} · {she} → {her} · {we} → {us} · {they} → {them}", exemple: "[s:She] loves [o:him]." },
      { nom: "Après une préposition", modele: "préposition + pronom complément", exemple: "Come with [o:us]." },
    ],
    usages: [
      { quand: "Après un verbe", en: "I know [o:them] well.", fr: "Je les connais bien." },
      { quand: "Après une préposition", en: "This gift is for [o:you].", fr: "Ce cadeau est pour toi." },
      { quand: "Une réponse courte", en: "Who's there? — It's [o:me].", fr: "Qui est là ? — C'est moi." },
    ],
    francais:
      "Le français place le pronom complément avant le verbe (« je la vois », « il nous appelle ») ; l'anglais le met toujours après : {I see her}, {He calls us}. Le français a aussi les formes « moi, toi, lui » après une préposition (« avec moi ») : en anglais, c'est la même forme que le complément ({with me}).",
    pieges: [
      { faux: "I [x:her love].", juste: "I love [o:her].", pourquoi: "Le pronom complément se place après le verbe." },
      { faux: "Give it to [x:I].", juste: "Give it to [o:me].", pourquoi: "Après une préposition, la forme complément : {me}." },
      { faux: "I like [x:they].", juste: "I like [o:them].", pourquoi: "Complément du verbe : {them}, pas {they}." },
    ],
    retenir: "Sujet {I / he / she / we / they}, complément {me / him / her / us / them}, toujours après le verbe.",
  },

  "aussi-non-plus": {
    regle:
      "Pour dire « aussi » dans une phrase affirmative, on emploie {too} (en fin de phrase) ou {also} (avant le verbe principal, après {be}). Dans une phrase négative, « non plus » se dit {either}, en fin de phrase. Pour réagir à ce que dit quelqu'un : {Me too} / {Me neither} (familier), ou la forme élégante {So} + auxiliaire + sujet (« moi aussi ») et {Neither} / {Nor} + auxiliaire + sujet (« moi non plus »), en reprenant l'auxiliaire de la phrase : {I like tea. — So do I.}",
    forme: [
      { nom: "Aussi", modele: "… {too} · {also} + verbe", exemple: "I like jazz [k:too]." },
      { nom: "Non plus", modele: "… négation … {either}", exemple: "I don't like it [k:either]." },
      { nom: "Moi aussi", modele: "{So} + auxiliaire + sujet", exemple: "[k:So] [a:do] [s:I]." },
      { nom: "Moi non plus", modele: "{Neither} / {Nor} + auxiliaire + sujet", exemple: "[k:Neither] [a:can] [s:I]." },
    ],
    usages: [
      { quand: "Réagir à un goût", en: "I love pizza. — [k:So] [a:do] [s:I]!", fr: "J'adore la pizza. — Moi aussi !" },
      { quand: "Réagir à une négation", en: "I can't swim. — [k:Neither] [a:can] [s:I].", fr: "Je ne sais pas nager. — Moi non plus." },
      { quand: "Avec be", en: "I'm tired. — [k:So] [a:am] [s:I].", fr: "Je suis fatigué. — Moi aussi." },
      { quand: "Avec le passé", en: "We went to Rome. — [k:So] [a:did] [s:they].", fr: "Nous sommes allés à Rome. — Eux aussi." },
    ],
    francais:
      "« Moi aussi » se traduit facilement par {me too}, mais la forme {So do I} montre qu'on maîtrise l'anglais : elle reprend l'auxiliaire de la phrase de départ ({do} pour un présent simple, {did} pour un passé, {am} pour {be}, {can} pour {can}). « Moi non plus » se dit {me neither} ou {neither do I}, jamais {me too not}.",
    pieges: [
      { faux: "I don't like fish. — [x:Me too].", juste: "I don't like fish. — [k:Neither] [a:do] [s:I].", pourquoi: "Après une phrase négative, « moi non plus » : {Neither do I} (ou {Me neither})." },
      { faux: "I don't speak Russian [x:too].", juste: "I don't speak Russian [k:either].", pourquoi: "À la négation, « non plus » se dit {either}." },
      { faux: "I went to London. — So [x:do] I.", juste: "I went to London. — [k:So] [a:did] [s:I].", pourquoi: "La phrase est au passé : on reprend {did}." },
    ],
    retenir: "{So} + auxiliaire + sujet = moi aussi ; {Neither} + auxiliaire + sujet = moi non plus ; {too} et {either} en fin de phrase.",
  },

  "horloge-calendrier": {
    regle:
      "Les prépositions de temps vont du plus précis au plus large. {at} pour un point précis : une heure ({at 7 o'clock}), un moment ({at noon}, {at night}, {at the weekend} en britannique), une fête ({at Christmas}). {on} pour un jour ou une date : {on Monday}, {on 3 May}, {on my birthday}, {on Christmas Day}. {in} pour une période plus longue : un mois ({in June}), une année ({in 2010}), une saison ({in summer}), un siècle, et les parties de la journée ({in the morning}).",
    forme: [
      { nom: "Un point précis", modele: "{at} + heure, moment, fête", exemple: "[k:at] 6 p.m. · [k:at] night" },
      { nom: "Un jour", modele: "{on} + jour, date", exemple: "[k:on] Friday · [k:on] 14 July" },
      { nom: "Une période", modele: "{in} + mois, année, saison, partie du jour", exemple: "[k:in] April · [k:in] the evening" },
    ],
    usages: [
      { quand: "Un rendez-vous", en: "The meeting is [k:at] 10 a.m.", fr: "La réunion est à 10 h." },
      { quand: "Un jour de la semaine", en: "I play tennis [k:on] Saturdays.", fr: "Je joue au tennis le samedi." },
      { quand: "Une année", en: "She was born [k:in] 1998.", fr: "Elle est née en 1998." },
      { quand: "Une partie du jour", en: "I read [k:in] the evening.", fr: "Je lis le soir." },
    ],
    francais:
      "Le français dit « à 7 heures », « lundi » (sans préposition), « en juin », « le matin ». L'anglais exige une préposition presque partout : {at 7}, {on Monday}, {in June}, {in the morning}. Exception : pas de préposition devant {next}, {last}, {this}, {every} ({next Monday}, {last year}, {every day}). Et « la nuit » se dit {at night}.",
    pieges: [
      { faux: "See you [x:in] Monday.", juste: "See you [k:on] Monday.", pourquoi: "Un jour de la semaine : {on}." },
      { faux: "I was born [x:on] 1995.", juste: "I was born [k:in] 1995.", pourquoi: "Une année seule : {in}. Avec le jour précis : {on 5 June 1995}." },
      { faux: "We'll meet [x:on next] Friday.", juste: "We'll meet next Friday.", pourquoi: "Devant {next}, {last}, {this}, {every}, pas de préposition." },
    ],
    retenir: "{at} pour l'heure, {on} pour le jour, {in} pour le mois, l'année, la saison.",
  },

  mouvement: {
    regle:
      "Les prépositions de mouvement décrivent un trajet. {into} = entrer dans ; {out of} = sortir de ; {onto} = monter sur ; {across} = traverser une surface d'un bord à l'autre (une rue, un pont) ; {through} = traverser l'intérieur de quelque chose (un tunnel, une forêt) ; {along} = longer, suivre ; {past} = passer devant ; {up} / {down} = monter / descendre ; {towards} = vers ; {from}… {to} = de… à. En anglais, c'est souvent la préposition qui porte le mouvement, et le verbe qui dit la manière : {run into the room} (entrer en courant).",
    forme: [
      { nom: "Entrer, sortir", modele: "{into} · {out of}", exemple: "She ran [k:into] the room." },
      { nom: "Traverser", modele: "{across} (une surface) · {through} (un intérieur)", exemple: "We walked [k:through] the forest." },
      { nom: "Longer, dépasser", modele: "{along} · {past}", exemple: "Go [k:past] the church." },
      { nom: "Le trajet", modele: "{from}… {to} · {towards}", exemple: "He drove [k:from] Paris [k:to] Lyon." },
    ],
    usages: [
      { quand: "Indiquer le chemin", en: "Go [k:along] this street and turn left.", fr: "Suivez cette rue et tournez à gauche." },
      { quand: "Traverser une rue", en: "Be careful when you walk [k:across] the road.", fr: "Fais attention quand tu traverses la route." },
      { quand: "Monter", en: "The cat climbed [k:up] the tree.", fr: "Le chat est monté dans l'arbre." },
    ],
    francais:
      "Le français met le mouvement dans le verbe et la manière dans un complément (« il est entré en courant ») ; l'anglais fait l'inverse : {He ran in}, {He ran into the house}. C'est très économique. Attention à « dans » : sans mouvement, {in} ({She is in the room}) ; avec un mouvement d'entrée, {into} ({She went into the room}).",
    pieges: [
      { faux: "She went [x:in] the kitchen.", juste: "She went [k:into] the kitchen.", pourquoi: "Avec un mouvement d'entrée, on emploie {into}." },
      { faux: "We went [x:across] the tunnel.", juste: "We went [k:through] the tunnel.", pourquoi: "On traverse l'intérieur d'un tunnel : {through}. {across}, c'est d'un bord à l'autre d'une surface." },
    ],
    retenir: "Le trajet est dans la préposition : {into}, {out of}, {across}, {through}, {along}, {past}.",
  },

  "a-moi": {
    regle:
      "Les pronoms possessifs remplacent un nom déjà connu : {mine} (le mien, la mienne, les miens…), {yours}, {his}, {hers}, {ours}, {theirs}. Ils s'emploient seuls, sans article ni nom après : {This book is mine}. Pour demander à qui appartient quelque chose : {Whose} + nom ({Whose bag is this?}) ou {Whose is this?} On dit aussi {a friend of mine} (un de mes amis).",
    forme: [
      { nom: "Les pronoms", modele: "{mine} · {yours} · {his} · {hers} · {ours} · {theirs}", exemple: "This seat is [o:mine]." },
      { nom: "À qui ?", modele: "{Whose} + nom + {is}… ? · {Whose is}… ?", exemple: "[k:Whose] phone is this?" },
      { nom: "Un de mes…", modele: "{a} + nom + {of mine} / {of yours}…", exemple: "a friend [k:of] [o:mine]" },
    ],
    usages: [
      { quand: "Revendiquer", en: "That's not your coat, it's [o:mine]!", fr: "Ce n'est pas ton manteau, c'est le mien !" },
      { quand: "Comparer", en: "Our house is bigger than [o:theirs].", fr: "Notre maison est plus grande que la leur." },
      { quand: "Demander", en: "[k:Whose] keys are these? — They're [o:hers].", fr: "À qui sont ces clés ? — À elle." },
    ],
    francais:
      "En français, on dit « le mien », « la mienne », « les miens » selon l'objet ; en anglais, {mine} ne change jamais et ne prend jamais {the}. Comme pour {his} et {her}, on choisit selon le propriétaire : {hers} (à elle), {his} (à lui). Et {whose} (à qui) se prononce comme {who's} (= {who is}) : ne les confonds pas à l'écrit.",
    pieges: [
      { faux: "It's [x:the mine].", juste: "It's [o:mine].", pourquoi: "Les pronoms possessifs ne prennent jamais d'article." },
      { faux: "This bag is [x:her's].", juste: "This bag is [o:hers].", pourquoi: "Pas d'apostrophe dans les pronoms possessifs : {hers}, {yours}, {ours}, {theirs}." },
      { faux: "[x:Who's] car is this?", juste: "[k:Whose] car is this?", pourquoi: "« À qui » se dit {whose} ; {who's} veut dire {who is}." },
    ],
    retenir: "{mine}, {yours}, {his}, {hers}, {ours}, {theirs} : sans article, sans nom après. À qui ? {Whose}.",
  },

  ponts: {
    regle:
      "Les conjonctions relient deux idées : {and} (et) ajoute, {but} (mais) oppose, {or} (ou) propose un choix, {because} (parce que) donne la cause, {so} (donc, alors) donne la conséquence. {because} est suivi d'une phrase complète (sujet + verbe) ; devant un simple nom, on dit {because of} ({because of the rain}). Dans une liste, {and} se place devant le dernier élément ({tea, coffee and milk}).",
    forme: [
      { nom: "Ajouter, opposer, choisir", modele: "phrase + {and} / {but} / {or} + phrase", exemple: "I'm tired [k:but] happy." },
      { nom: "La cause", modele: "{because} + phrase · {because of} + nom", exemple: "We stayed in [k:because of] the rain." },
      { nom: "La conséquence", modele: "phrase, {so} + phrase", exemple: "It was late, [k:so] we left." },
    ],
    usages: [
      { quand: "Ajouter", en: "She plays the piano [k:and] sings.", fr: "Elle joue du piano et chante." },
      { quand: "Opposer", en: "It's small [k:but] comfortable.", fr: "C'est petit mais confortable." },
      { quand: "Expliquer", en: "I'm hungry [k:because] I didn't eat.", fr: "J'ai faim parce que je n'ai pas mangé." },
      { quand: "Conclure", en: "It was raining, [k:so] I took a taxi.", fr: "Il pleuvait, alors j'ai pris un taxi." },
    ],
    francais:
      "Ces petits mots fonctionnent comme en français. Deux pièges : « à cause de » + nom se dit {because of} (pas {because} seul), et « donc », « alors » au sens de conséquence se disent {so}, jamais {then}, qui veut dire « ensuite ».",
    pieges: [
      { faux: "We stayed home [x:because] the storm.", juste: "We stayed home [k:because of] the storm.", pourquoi: "Devant un nom seul, « à cause de » : {because of}." },
      { faux: "It was cold, [x:then] I put on a coat.", juste: "It was cold, [k:so] I put on a coat.", pourquoi: "La conséquence (« donc, alors ») se dit {so} ; {then} veut dire « ensuite »." },
    ],
    retenir: "{and}, {but}, {or}, {so} ; {because} + phrase, {because of} + nom.",
  },

  exclamations: {
    regle:
      "Pour s'exclamer, l'anglais a deux formules. {What} + nom : {What a} + (adjectif) + nom singulier ({What a beautiful day!}), et {What} + (adjectif) + nom pluriel ou indénombrable ({What lovely flowers!}, {What awful weather!}). {How} + adjectif ou adverbe : {How beautiful!}, {How kind of you!} Dans une phrase ordinaire, « si, tellement » se dit {so} + adjectif ({It's so hot}) et {such a} + adjectif + nom ({It's such a hot day}).",
    forme: [
      { nom: "Quel… ! (singulier)", modele: "{What a} + (adjectif) + nom !", exemple: "[k:What a] [j:nice] [n:surprise]!" },
      { nom: "Quels… ! (pluriel, masse)", modele: "{What} + (adjectif) + nom !", exemple: "[k:What] [j:beautiful] [n:eyes]!" },
      { nom: "Que c'est… !", modele: "{How} + adjectif !", exemple: "[k:How] [j:strange]!" },
      { nom: "Si, tellement", modele: "{so} + adjectif · {such a} + adjectif + nom", exemple: "It's [k:such a] [j:long] [n:film]." },
    ],
    usages: [
      { quand: "Admirer", en: "[k:What a] [j:lovely] [n:house]!", fr: "Quelle jolie maison !" },
      { quand: "Remercier", en: "[k:How] [j:kind] of you!", fr: "C'est très gentil de ta part !" },
      { quand: "Insister", en: "The film was [k:so] [j:boring].", fr: "Le film était tellement ennuyeux." },
      { quand: "Insister avec un nom", en: "She's [k:such a] [j:good] [n:friend].", fr: "C'est une si bonne amie." },
    ],
    francais:
      "« Quel beau temps ! » : en anglais, on garde {a} devant un nom singulier comptable ({What a…!}), mais jamais devant un indénombrable ({What weather!}, sans {a}). Et « si » ou « tellement » se dédouble : {so} devant un adjectif seul, {such} devant un groupe qui contient un nom.",
    pieges: [
      { faux: "[x:What] beautiful day!", juste: "[k:What a] [j:beautiful] [n:day]!", pourquoi: "Devant un nom singulier comptable : {What a}." },
      { faux: "[x:What a] lovely weather!", juste: "[k:What] [j:lovely] [n:weather]!", pourquoi: "{weather} est indénombrable : pas de {a}." },
      { faux: "It's [x:so a] good idea.", juste: "It's [k:such a] [j:good] [n:idea].", pourquoi: "Devant adjectif + nom : {such a}. {so} va devant un adjectif seul." },
    ],
    retenir: "{What a} + nom ! · {How} + adjectif ! · {so} + adjectif · {such a} + adjectif + nom.",
  },
};
