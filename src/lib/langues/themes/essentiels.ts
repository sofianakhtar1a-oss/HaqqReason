/* Le Truchement : thèmes « essentiels » (mots-outils, noms, adverbes) et « Le mot juste » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const MOTS_OUTILS = theme(
  "mots-outils",
  "Les petits mots indispensables",
  "Pronoms, déterminants, prépositions et mots de liaison : ceux qu'on emploie dans chaque phrase.",
  "Blocks",
  `
I | je | pron | A1 | /aɪ/ | I live in Laval. | J'habite à Laval.
you | tu, vous | pron | A1 | /juː/ | Are you ready? | Es-tu prêt ?
he | il | pron | A1 | /hiː/ | He is my brother. | C'est mon frère.
she | elle | pron | A1 | /ʃiː/ | She works in a bank. | Elle travaille dans une banque.
we | nous | pron | A1 | /wiː/ | We are late again. | Nous sommes encore en retard.
they | ils, elles | pron | A1 | /ðeɪ/ | They live next door. | Ils habitent à côté.
me | me, moi | pron | A1 | /miː/ | Can you help me? | Peux-tu m'aider ?
him | le, lui | pron | A1 | /hɪm/ | I called him yesterday. | Je l'ai appelé hier.
her | la, lui ; son, sa, ses (à elle) | pron | A1 | /hɜː/ | I gave her a book. | Je lui ai donné un livre.
us | nous | pron | A1 | /ʌs/ | Come with us! | Viens avec nous !
them | les, leur, eux | pron | A1 | /ðem/ | I see them every day. | Je les vois tous les jours.
my | mon, ma, mes | det | A1 | /maɪ/ | This is my bag. | C'est mon sac.
your | ton, ta, tes ; votre, vos | det | A1 | /jɔː/ | Is this your coat? | C'est ton manteau ?
his | son, sa, ses (à lui) | det | A1 | /hɪz/ | His car is red. | Sa voiture est rouge.
its | son, sa, ses (chose, animal) | det | A1 | /ɪts/ | The dog wagged its tail. | Le chien a remué la queue.
our | notre, nos | det | A1 | /ˈaʊə/ | Our house is small. | Notre maison est petite.
their | leur, leurs | det | A1 | /ðeə/ | Their children are polite. | Leurs enfants sont polis.
mine | le mien, la mienne | pron | A1 | /maɪn/ | That phone is mine. | Ce téléphone est à moi.
yours | le tien, le vôtre | pron | A1 | /jɔːz/ | Is this pen yours? | Ce stylo est à toi ?
hers | le sien, la sienne (à elle) | pron | A2 | /hɜːz/ | The blue bag is hers. | Le sac bleu est à elle.
ours | le nôtre, la nôtre | pron | A2 | /ˈaʊəz/ | This garden is ours. | Ce jardin est à nous.
theirs | le leur, la leur | pron | A2 | /ðeəz/ | The decision is theirs. | La décision leur appartient.
myself | moi-même | pron | A2 | /maɪˈself/ | I made it myself. | Je l'ai fait moi-même.
yourself | toi-même, vous-même | pron | A2 | /jɔːˈself/ | Help yourself to some tea. | Sers-toi du thé.
himself | lui-même | pron | A2 | /hɪmˈself/ | He hurt himself playing football. | Il s'est blessé en jouant au football.
herself | elle-même | pron | A2 | /hɜːˈself/ | She taught herself to read. | Elle a appris à lire toute seule.
itself | lui-même, elle-même (chose) | pron | B1 | /ɪtˈself/ | The door closed by itself. | La porte s'est fermée toute seule.
ourselves | nous-mêmes | pron | A2 | /aʊəˈselvz/ | We painted the room ourselves. | Nous avons peint la pièce nous-mêmes.
yourselves | vous-mêmes | pron | A2 | /jɔːˈselvz/ | Did you enjoy yourselves? | Vous vous êtes bien amusés ?
themselves | eux-mêmes, elles-mêmes | pron | A2 | /ðəmˈselvz/ | The children dressed themselves. | Les enfants se sont habillés tout seuls.
oneself | soi-même | pron | B2 | /wʌnˈself/ | It's important to know oneself. | Il est important de se connaître soi-même.
the | le, la, les | det | A1 | /ðə/ | The sun is hot. | Le soleil est chaud.
a | un, une | det | A1 | /ə/ | I have a sister. | J'ai une sœur.
an | un, une (devant une voyelle) | det | A1 | /ən/ | She ate an apple. | Elle a mangé une pomme.
this | ce, cette ; ceci | det | A1 | /ðɪs/ | This coffee is very good. | Ce café est très bon.
that | ce, cette ; cela ; que | det | A1 | /ðæt/ | Look at that bird! | Regarde cet oiseau !
these | ces (proches) | det | A1 | /ðiːz/ | These shoes are new. | Ces chaussures sont neuves.
those | ces (éloignés) | det | A1 | /ðəʊz/ | Who are those people? | Qui sont ces gens ?
some | du, de la, des ; quelques | det | A1 | /sʌm/ | Would you like some water? | Veux-tu de l'eau ?
any | du, des (question, négation) ; n'importe quel | det | A1 | /ˈeni/ | Do you have any brothers? | As-tu des frères ?
no | aucun, pas de | det | A1 | /nəʊ/ | There is no milk left. | Il n'y a plus de lait.
every | chaque, tous les | det | A1 | /ˈevri/ | I pray every day. | Je prie tous les jours.
each | chaque, chacun | det | A1 | /iːtʃ/ | Each student has a book. | Chaque élève a un livre.
all | tout, tous, toutes | det | A1 | /ɔːl/ | All my friends came. | Tous mes amis sont venus.
more | plus, davantage | det | A1 | /mɔː/ | Can I have more rice, please? | Je peux avoir plus de riz, s'il te plaît ?
least | le moins | det | A2 | /liːst/ | He has the least money of us all. | C'est lui qui a le moins d'argent de nous tous.
other | autre | det | A1 | /ˈʌðə/ | Where are the other children? | Où sont les autres enfants ?
another | un autre, une autre ; encore un | det | A1 | /əˈnʌðə/ | Would you like another cup? | Veux-tu une autre tasse ?
such | tel, si, tellement | det | A2 | /sʌtʃ/ | It was such a lovely day. | C'était une si belle journée.
what | quoi, que, quel | pron | A1 | /wɒt/ | What is your name? | Comment t'appelles-tu ?
which | quel, lequel ; qui, que | pron | A1 | /wɪtʃ/ | Which colour do you prefer? | Quelle couleur préfères-tu ?
who | qui | pron | A1 | /huː/ | Who is that man? | Qui est cet homme ?
whom | qui (complément), que | pron | B1 | /huːm/ | To whom did you send the letter? | À qui as-tu envoyé la lettre ?
whose | à qui ; dont | pron | A2 | /huːz/ | Whose umbrella is this? | À qui est ce parapluie ?
where | où | adv | A1 | /weə/ | Where do you live? | Où habites-tu ?
why | pourquoi | adv | A1 | /waɪ/ | Why are you sad? | Pourquoi es-tu triste ?
how | comment | adv | A1 | /haʊ/ | How do you say this in English? | Comment dit-on cela en anglais ?
how many | combien (dénombrable) | expr | A1 | /haʊ ˈmeni/ | How many sisters do you have? | Combien de sœurs as-tu ?
how long | combien de temps | expr | A1 | /haʊ ˈlɒŋ/ | How long does the journey take? | Combien de temps dure le trajet ?
how often | à quelle fréquence, tous les combien | expr | A2 | /haʊ ˈɒfn/ | How often do you go to the gym? | Tu vas à la salle de sport tous les combien ?
how far | à quelle distance | expr | A2 | /haʊ ˈfɑː/ | How far is the station? | La gare est à quelle distance ?
how old | quel âge | expr | A1 | /haʊ ˈəʊld/ | How old are you? | Quel âge as-tu ?
here | ici | adv | A1 | /hɪə/ | Come here, please. | Viens ici, s'il te plaît.
there | là, là-bas ; il y a (there is) | adv | A1 | /ðeə/ | There is a cat in the garden. | Il y a un chat dans le jardin.
yes | oui | adv | A1 | /jes/ | Yes, I understand. | Oui, je comprends.
not | ne... pas | adv | A1 | /nɒt/ | I am not hungry. | Je n'ai pas faim.
in | dans, en, à | prep | A1 | /ɪn/ | The keys are in my bag. | Les clés sont dans mon sac.
on | sur | prep | A1 | /ɒn/ | The book is on the table. | Le livre est sur la table.
at | à, chez | prep | A1 | /æt/ | I'm at home. | Je suis à la maison.
to | à, vers, jusqu'à | prep | A1 | /tuː/ | We go to school by bike. | Nous allons à l'école à vélo.
from | de, depuis, à partir de | prep | A1 | /frɒm/ | I come from France. | Je viens de France.
of | de | prep | A1 | /ɒv/ | A glass of milk, please. | Un verre de lait, s'il vous plaît.
for | pour ; pendant | prep | A1 | /fɔː/ | This gift is for you. | Ce cadeau est pour toi.
with | avec | prep | A1 | /wɪð/ | I live with my parents. | J'habite avec mes parents.
without | sans | prep | A2 | /wɪˈðaʊt/ | I drink my tea without sugar. | Je bois mon thé sans sucre.
by | par ; près de ; avant (une date) | prep | A1 | /baɪ/ | Please finish it by Friday. | Termine-le d'ici vendredi, s'il te plaît.
into | dans (avec mouvement) | prep | A1 | /ˈɪntuː/ | She walked into the room. | Elle est entrée dans la pièce.
onto | sur (avec mouvement) | prep | B1 | /ˈɒntuː/ | The cat jumped onto the table. | Le chat a sauté sur la table.
out of | hors de, sorti de | prep | A2 | /ˈaʊt əv/ | Get out of the car. | Sors de la voiture.
over | au-dessus de ; par-dessus ; plus de | prep | A1 | /ˈəʊvə/ | The plane flew over the city. | L'avion a survolé la ville.
under | sous | prep | A1 | /ˈʌndə/ | The cat is under the bed. | Le chat est sous le lit.
up | en haut de, vers le haut | prep | A1 | /ʌp/ | We walked up the hill. | Nous avons monté la colline à pied.
through | à travers, par | prep | A1 | /θruː/ | The train goes through a tunnel. | Le train passe dans un tunnel.
across | à travers, de l'autre côté de | prep | A2 | /əˈkrɒs/ | They swam across the river. | Ils ont traversé la rivière à la nage.
along | le long de | prep | A2 | /əˈlɒŋ/ | We walked along the beach. | Nous nous sommes promenés le long de la plage.
beside | à côté de | prep | A1 | /bɪˈsaɪd/ | Sit beside me. | Assieds-toi à côté de moi.
against | contre | prep | A2 | /əˈɡenst/ | He leaned against the wall. | Il s'est appuyé contre le mur.
off | de (détachement), hors de | prep | B1 | /ɒf/ | Keep off the grass. | Ne marchez pas sur la pelouse.
upon | sur (soutenu) | prep | A2 | /əˈpɒn/ | Once upon a time, there was a king. | Il était une fois un roi.
per | par | prep | B1 | /pɜː/ | The tickets cost ten pounds per person. | Les billets coûtent dix livres par personne.
than | que (comparaison) | prep | A1 | /ðæn/ | My brother is taller than me. | Mon frère est plus grand que moi.
versus | contre | prep | B2 | /ˈvɜːsəs/ | It's France versus England tonight. | Ce soir, c'est France contre Angleterre.
can | pouvoir, savoir (capacité) | v | A1 | /kæn/ | I can swim. | Je sais nager.
could | pourrait ; pouvait | v | A1 | /kʊd/ | Could you open the window? | Pourrais-tu ouvrir la fenêtre ?
might | pourrait (éventualité) | v | A2 | /maɪt/ | It might rain later. | Il pourrait pleuvoir plus tard.
must | devoir (obligation) | v | A1 | /mʌst/ | You must wear a seat belt. | Tu dois mettre ta ceinture.
shall | futur (soutenu) ; proposition (Shall we...?) | v | A2 | /ʃæl/ | Shall we go for a walk? | Et si on allait se promener ?
should | devrait (conseil) | v | A1 | /ʃʊd/ | You should see a doctor. | Tu devrais voir un médecin.
would | conditionnel (-rait) | v | A1 | /wʊd/ | I would like a coffee. | Je voudrais un café.
ought to | devrait, il faudrait | v | B1 | /ˈɔːt tə/ | You ought to apologise. | Tu devrais t'excuser.
have to | devoir, être obligé de | v | A1 | /ˈhæv tə/ | I have to get up early. | Je dois me lever tôt.
need to | avoir besoin de, devoir | v | A1 | /ˈniːd tə/ | You need to rest. | Tu as besoin de te reposer.
used to | avoir l'habitude de (dans le passé) | v | B1 | /ˈjuːst tə/ | I used to live in Paris. | Avant, j'habitais à Paris.
be able to | être capable de, pouvoir | v | A2 | /bi ˈeɪbl tə/ | Will you be able to come? | Pourras-tu venir ?
had better | ferait mieux de | expr | B1 | /həd ˈbetə/ | You had better hurry. | Tu ferais mieux de te dépêcher.
would rather | préférer, aimer mieux | expr | B1 | /wʊd ˈrɑːðə/ | I would rather stay at home. | Je préférerais rester à la maison.
somebody | quelqu'un | pron | A2 | /ˈsʌmbədi/ | Somebody is knocking at the door. | Quelqu'un frappe à la porte.
something | quelque chose | pron | A1 | /ˈsʌmθɪŋ/ | I have something for you. | J'ai quelque chose pour toi.
anyone | quelqu'un (question) ; n'importe qui | pron | A1 | /ˈeniwʌn/ | Is anyone there? | Il y a quelqu'un ?
anything | quelque chose (question) ; n'importe quoi | pron | A1 | /ˈeniθɪŋ/ | Do you need anything? | As-tu besoin de quelque chose ?
nobody | personne | pron | A2 | /ˈnəʊbədi/ | Nobody answered the phone. | Personne n'a répondu au téléphone.
nothing | rien | pron | A1 | /ˈnʌθɪŋ/ | There's nothing in the fridge. | Il n'y a rien dans le frigo.
everybody | tout le monde | pron | A1 | /ˈevribɒdi/ | Everybody loves a good story. | Tout le monde aime une bonne histoire.
everything | tout | pron | A1 | /ˈevriθɪŋ/ | Thank you for everything. | Merci pour tout.
else | d'autre, autre | adv | A1 | /els/ | Do you want anything else? | Veux-tu autre chose ?
each other | l'un l'autre, se (réciproque) | pron | A1 | /iːtʃ ˈʌðə/ | They love each other. | Ils s'aiment.
one another | les uns les autres | pron | B1 | /wʌn əˈnʌðə/ | Believers should help one another. | Les croyants doivent s'entraider.
whichever | quel que soit, celui que | det | B1 | /wɪtʃˈevə/ | Take whichever seat you like. | Prends la place que tu veux.
nor | ni | conj | B1 | /nɔː/ | I don't like tea, nor does my wife. | Je n'aime pas le thé, ma femme non plus.
either ... or | soit... soit, ou... ou | conj | A2 | /ˈaɪðə ... ɔː/ | You can have either tea or coffee. | Tu peux prendre du thé ou du café.
neither ... nor | ni... ni | conj | B1 | /ˈnaɪðə ... nɔː/ | Neither my brother nor my sister came. | Ni mon frère ni ma sœur ne sont venus.
oh | oh, ah | expr | A1 | /əʊ/ | Oh, I forgot my keys! | Oh, j'ai oublié mes clés !
wow | waouh, ouah | expr | A2 | /waʊ/ | Wow, what a beautiful view! | Waouh, quelle belle vue !
oops | oups | expr | A2 | /ʊps/ | Oops, I dropped my glass. | Oups, j'ai fait tomber mon verre.
ouch | aïe | expr | A2 | /aʊtʃ/ | Ouch! That hurts! | Aïe ! Ça fait mal !
hey | hé, salut | expr | A2 | /heɪ/ | Hey, wait for me! | Hé, attends-moi !
okay | d'accord, OK | expr | A1 | /əʊˈkeɪ/ | Okay, let's start. | D'accord, commençons.
all right | d'accord ; ça va | expr | A1 | /ɔːl ˈraɪt/ | Are you all right? | Ça va ?
so much | tellement, tant | expr | A1 | /səʊ ˈmʌtʃ/ | Thank you so much! | Merci beaucoup !
at all | du tout | expr | A2 | /ət ˈɔːl/ | I didn't sleep at all. | Je n'ai pas dormi du tout.
ever since | depuis que, depuis lors | conj | B1 | /ˈevə sɪns/ | I've loved books ever since I was a child. | J'aime les livres depuis que je suis enfant.
better | meilleur ; mieux | adj | A1 | /ˈbetə/ | This phone is better than mine. | Ce téléphone est meilleur que le mien.
best | le meilleur ; le mieux | adj | A1 | /best/ | She is my best friend. | C'est ma meilleure amie.
worse | pire ; plus mal | adj | A2 | /wɜːs/ | The weather is worse today. | Le temps est pire aujourd'hui.
worst | le pire | adj | A2 | /wɜːst/ | It was the worst day of my life. | C'était le pire jour de ma vie.
out | dehors ; sorti | adv | A1 | /aʊt/ | The children are playing out in the garden. | Les enfants jouent dehors, dans le jardin.
aboard | à bord | adv | B1 | /əˈbɔːd/ | Welcome aboard! | Bienvenue à bord !
aloud | à voix haute | adv | B1 | /əˈlaʊd/ | Read the sentence aloud. | Lis la phrase à voix haute.
underneath | sous, en dessous de | prep | B1 | /ˌʌndəˈniːθ/ | I found the keys underneath the sofa. | J'ai trouvé les clés sous le canapé.
whichever way | de quelque façon que | expr | B2 | /wɪtʃˌevə ˈweɪ/ | Whichever way you go, you'll reach the sea. | Quel que soit le chemin que tu prends, tu arriveras à la mer.
provided | pourvu que, à condition que | conj | B1 | /prəˈvaɪdɪd/ | You can go out provided you finish your homework. | Tu peux sortir à condition de finir tes devoirs.
lest | de peur que (soutenu) | conj | C2 | /lest/ | Speak softly lest you wake the baby. | Parle doucement de peur de réveiller le bébé.
alongside | à côté de, aux côtés de | prep | B2 | /əˌlɒŋˈsaɪd/ | He worked alongside his father. | Il travaillait aux côtés de son père.
amongst | parmi | prep | B2 | /əˈmʌŋst/ | She was amongst the best students. | Elle faisait partie des meilleurs élèves.
unto | à, vers (archaïque) | prep | C2 | /ˈʌntuː/ | Unto God we belong, and unto Him we return. | Nous appartenons à Dieu et c'est vers Lui que nous retournerons.
atop | au sommet de | prep | C2 | /əˈtɒp/ | A castle stood atop the hill. | Un château se dressait au sommet de la colline.
circa | vers, environ (date) | prep | C2 | /ˈsɜːkə/ | The mosque was built circa 1200. | La mosquée a été construite vers 1200.
amidst | au milieu de | prep | C2 | /əˈmɪdst/ | Amidst the chaos, she stayed calm. | Au milieu du chaos, elle est restée calme.
onboard | à bord | adj | C1 | /ˌɒnˈbɔːd/ | The car has an onboard computer. | La voiture est équipée d'un ordinateur de bord.
irrespective of | indépendamment de | prep | C2 | /ɪrɪˈspektɪv əv/ | Everyone is welcome, irrespective of age. | Tout le monde est bienvenu, quel que soit son âge.
amid | au milieu de, parmi | prep | C1 | /əˈmɪd/ | The talks took place amid great tension. | Les discussions se sont déroulées dans une grande tension.
vis-à-vis | vis-à-vis de, par rapport à | prep | C2 | /ˌviːz ɑː ˈviː/ | What is our position vis-à-vis the new law? | Quelle est notre position vis-à-vis de la nouvelle loi ?
thyself | toi-même (archaïque) | pron | C2 | /ðaɪˈself/ | "Know thyself," said the philosopher. | « Connais-toi toi-même », disait le philosophe.
whosoever | quiconque | pron | C2 | /ˌhuːsəʊˈevə/ | Whosoever does an atom's weight of good will see it. | Quiconque fait le poids d'un atome de bien le verra.
`,
);

export const NOMS = theme(
  "noms",
  "Les noms essentiels",
  "Les noms courants qu'il faut absolument connaître, puis des noms plus riches pour aller plus loin.",
  "Shapes",
  `
life | vie | n | A1 | /laɪf/ | Life is beautiful. | La vie est belle.
thing | chose | n | A1 | /θɪŋ/ | I have a lot of things to do. | J'ai beaucoup de choses à faire.
way | chemin ; façon, manière | n | A1 | /weɪ/ | Is this the way to the station? | C'est le chemin de la gare ?
problem | problème | n | A1 | /ˈprɒbləm/ | We have a small problem. | Nous avons un petit problème.
word | mot | n | A1 | /wɜːd/ | What does this word mean? | Que veut dire ce mot ?
story | histoire, récit | n | A1 | /ˈstɔːri/ | My grandmother tells wonderful stories. | Ma grand-mère raconte des histoires merveilleuses.
information | informations, renseignements | n | A1 | /ˌɪnfəˈmeɪʃn/ | I need some information about the course. | J'ai besoin de renseignements sur le cours.
example | exemple | n | A1 | /ɪɡˈzɑːmpl/ | Can you give me an example? | Peux-tu me donner un exemple ?
point | point ; intérêt | n | A1 | /pɔɪnt/ | That's a good point. | C'est une bonne remarque.
side | côté | n | A1 | /saɪd/ | Drive on the left side of the road. | Roule du côté gauche de la route.
line | ligne ; file d'attente | n | A1 | /laɪn/ | Draw a line under the title. | Trace une ligne sous le titre.
group | groupe | n | A1 | /ɡruːp/ | We work in groups of four. | Nous travaillons en groupes de quatre.
difference | différence | n | A1 | /ˈdɪfrəns/ | What's the difference between them? | Quelle est la différence entre eux ?
action | action | n | A1 | /ˈækʃn/ | We need action, not words. | Il nous faut des actes, pas des paroles.
activity | activité | n | A1 | /ækˈtɪvəti/ | Swimming is my favourite activity. | La natation est mon activité préférée.
event | événement | n | A1 | /ɪˈvent/ | The wedding was a big event. | Le mariage a été un grand événement.
conversation | conversation | n | A1 | /ˌkɒnvəˈseɪʃn/ | We had a long conversation. | Nous avons eu une longue conversation.
memory | mémoire ; souvenir | n | A1 | /ˈmeməri/ | I have happy memories of that summer. | J'ai de bons souvenirs de cet été-là.
luck | chance | n | A1 | /lʌk/ | Good luck with your exam! | Bonne chance pour ton examen !
hole | trou | n | A1 | /həʊl/ | There's a hole in my sock. | Il y a un trou dans ma chaussette.
front | avant, devant | n | A1 | /frʌnt/ | Sit at the front of the class. | Assieds-toi au premier rang.
spot | endroit ; tache | n | B1 | /spɒt/ | This is a nice spot for a picnic. | C'est un bel endroit pour pique-niquer.
suggestion | suggestion, proposition | n | A2 | /səˈdʒestʃən/ | Do you have any suggestions? | As-tu des suggestions ?
topic | sujet, thème | n | A2 | /ˈtɒpɪk/ | Choose a topic for your essay. | Choisis un sujet pour ta rédaction.
step | pas ; étape ; marche | n | A2 | /step/ | Take one step forward. | Fais un pas en avant.
machine | machine | n | A1 | /məˈʃiːn/ | The machine is broken. | La machine est en panne.
tool | outil | n | A2 | /tuːl/ | A hammer is a useful tool. | Un marteau est un outil utile.
ability | capacité, aptitude | n | A2 | /əˈbɪləti/ | She has the ability to learn fast. | Elle a la capacité d'apprendre vite.
act | acte | n | A2 | /ækt/ | It was an act of kindness. | C'était un acte de bonté.
addition | ajout ; addition | n | A2 | /əˈdɪʃn/ | The new room is a nice addition to the house. | La nouvelle pièce est un bel ajout à la maison.
advantage | avantage | n | A2 | /ədˈvɑːntɪdʒ/ | Speaking two languages is a big advantage. | Parler deux langues est un gros avantage.
disadvantage | inconvénient, désavantage | n | A2 | /ˌdɪsədˈvɑːntɪdʒ/ | The main disadvantage is the price. | Le principal inconvénient, c'est le prix.
advice | conseils | n | A2 | /ədˈvaɪs/ | Can I give you some advice? | Je peux te donner un conseil ?
attention | attention | n | A2 | /əˈtenʃn/ | Pay attention to the teacher. | Fais attention au professeur.
beginning | début, commencement | n | A2 | /bɪˈɡɪnɪŋ/ | Let's start from the beginning. | Commençons par le début.
chance | chance ; occasion | n | A2 | /tʃɑːns/ | Give him a second chance. | Donne-lui une seconde chance.
choice | choix | n | A2 | /tʃɔɪs/ | You have no choice. | Tu n'as pas le choix.
condition | état ; condition | n | A2 | /kənˈdɪʃn/ | The car is in good condition. | La voiture est en bon état.
detail | détail | n | A2 | /ˈdiːteɪl/ | Tell me every detail. | Raconte-moi tous les détails.
difficulty | difficulté | n | A2 | /ˈdɪfɪkəlti/ | He had difficulty breathing. | Il avait du mal à respirer.
effort | effort | n | A2 | /ˈefət/ | Learning a language takes effort. | Apprendre une langue demande des efforts.
explanation | explication | n | A2 | /ˌekspləˈneɪʃn/ | There must be an explanation. | Il doit y avoir une explication.
fact | fait | n | A2 | /fækt/ | It's a fact, not an opinion. | C'est un fait, pas une opinion.
fault | faute ; défaut | n | A2 | /fɔːlt/ | It's not your fault. | Ce n'est pas ta faute.
favour | service, faveur | n | A2 | /ˈfeɪvə/ | Can you do me a favour? | Tu peux me rendre un service ?
image | image | n | A2 | /ˈɪmɪdʒ/ | The image on the screen was blurred. | L'image à l'écran était floue.
imagination | imagination | n | A2 | /ɪˌmædʒɪˈneɪʃn/ | Children have a rich imagination. | Les enfants ont une imagination débordante.
importance | importance | n | A2 | /ɪmˈpɔːtns/ | Never forget the importance of family. | N'oublie jamais l'importance de la famille.
influence | influence | n | A2 | /ˈɪnfluəns/ | Friends have a strong influence on teenagers. | Les amis ont une forte influence sur les adolescents.
manner | manière, façon | n | A2 | /ˈmænə/ | He spoke in a calm manner. | Il a parlé d'une manière calme.
mystery | mystère | n | A2 | /ˈmɪstri/ | His disappearance is still a mystery. | Sa disparition reste un mystère.
opportunity | occasion, opportunité | n | A2 | /ˌɒpəˈtjuːnəti/ | This job is a great opportunity. | Ce travail est une belle occasion.
permission | permission, autorisation | n | A2 | /pəˈmɪʃn/ | You need permission to film here. | Il faut une autorisation pour filmer ici.
position | position ; poste | n | A2 | /pəˈzɪʃn/ | Sit in a comfortable position. | Installe-toi dans une position confortable.
request | demande, requête | n | A2 | /rɪˈkwest/ | They accepted my request. | Ils ont accepté ma demande.
shock | choc | n | A2 | /ʃɒk/ | The news came as a shock. | La nouvelle a été un choc.
silence | silence | n | A2 | /ˈsaɪləns/ | There was a long silence. | Il y a eu un long silence.
situation | situation | n | A2 | /ˌsɪtʃuˈeɪʃn/ | The situation is getting worse. | La situation s'aggrave.
success | succès, réussite | n | A2 | /səkˈses/ | Hard work is the key to success. | Le travail est la clé de la réussite.
symbol | symbole | n | A2 | /ˈsɪmbl/ | The dove is a symbol of peace. | La colombe est un symbole de paix.
system | système | n | A2 | /ˈsɪstəm/ | The new system works well. | Le nouveau système fonctionne bien.
thought | pensée, idée | n | A2 | /θɔːt/ | That's an interesting thought. | C'est une idée intéressante.
trick | tour ; astuce | n | A2 | /trɪk/ | He showed us a card trick. | Il nous a montré un tour de cartes.
trouble | ennuis, problèmes | n | A2 | /ˈtrʌbl/ | He's always getting into trouble. | Il s'attire toujours des ennuis.
unit | unité | n | A2 | /ˈjuːnɪt/ | We finished unit five today. | Nous avons terminé l'unité cinq aujourd'hui.
value | valeur | n | A2 | /ˈvæljuː/ | The value of the house has gone up. | La valeur de la maison a augmenté.
zone | zone | n | A2 | /zəʊn/ | This is a no-parking zone. | C'est une zone de stationnement interdit.
sake | bien, intérêt (for the sake of) | n | B1 | /seɪk/ | Do it for your children's sake. | Fais-le pour le bien de tes enfants.
expression | expression | n | A2 | /ɪkˈspreʃn/ | I didn't understand that expression. | Je n'ai pas compris cette expression.
discussion | discussion | n | A2 | /dɪˈskʌʃn/ | We had a long discussion about it. | Nous en avons longuement discuté.
contact | contact | n | A2 | /ˈkɒntækt/ | Do you have any contact with him? | Es-tu en contact avec lui ?
control | contrôle, maîtrise | n | A2 | /kənˈtrəʊl/ | The driver lost control of the car. | Le conducteur a perdu le contrôle de la voiture.
production | production | n | A2 | /prəˈdʌkʃn/ | Production has increased this year. | La production a augmenté cette année.
prediction | prédiction, prévision | n | A2 | /prɪˈdɪkʃn/ | His prediction turned out to be right. | Sa prédiction s'est avérée juste.
pile | tas, pile | n | A2 | /paɪl/ | There's a pile of books on my desk. | Il y a une pile de livres sur mon bureau.
container | récipient, conteneur | n | A2 | /kənˈteɪnə/ | Keep the rice in a sealed container. | Conserve le riz dans un récipient hermétique.
creature | créature, être vivant | n | A2 | /ˈkriːtʃə/ | Every creature needs water. | Toute créature a besoin d'eau.
treasure | trésor | n | A2 | /ˈtreʒə/ | They found a box full of treasure. | Ils ont trouvé une boîte pleine de trésors.
maker | fabricant | n | A2 | /ˈmeɪkə/ | Who is the maker of this car? | Qui est le fabricant de cette voiture ?
passage | passage ; extrait | n | A2 | /ˈpæsɪdʒ/ | Read this passage carefully. | Lis attentivement ce passage.
base | base, socle | n | A2 | /beɪs/ | The lamp has a heavy base. | La lampe a un socle lourd.
batch | fournée, lot | n | B1 | /bætʃ/ | She baked a batch of cookies. | Elle a fait une fournée de biscuits.
convenience | commodité, praticité | n | B1 | /kənˈviːniəns/ | I shop online for convenience. | J'achète en ligne par commodité.
death | mort, décès | n | A2 | /deθ/ | His death was a great loss. | Sa mort a été une grande perte.
curse | malédiction ; juron | n | B1 | /kɜːs/ | They believed the house was under a curse. | Ils croyaient la maison frappée d'une malédiction.
grace | grâce | n | B1 | /ɡreɪs/ | She danced with grace. | Elle dansait avec grâce.
amusement | amusement | n | B1 | /əˈmjuːzmənt/ | He watched with amusement. | Il regardait d'un air amusé.
magic | magie | n | A2 | /ˈmædʒɪk/ | It worked like magic. | Ça a marché comme par magie.
string | ficelle ; corde (instrument) | n | A2 | /strɪŋ/ | Tie the parcel with string. | Attache le colis avec de la ficelle.
rope | corde | n | A2 | /rəʊp/ | Hold on to the rope. | Tiens-toi à la corde.
ray | rayon | n | B1 | /reɪ/ | A ray of sunlight came through the window. | Un rayon de soleil est entré par la fenêtre.
roll | rouleau ; petit pain | n | A2 | /rəʊl/ | We need a roll of tape. | Il nous faut un rouleau de ruban adhésif.
junk | bric-à-brac, camelote | n | B1 | /dʒʌŋk/ | The garage is full of junk. | Le garage est plein de bric-à-brac.
killer | tueur, meurtrier | n | B1 | /ˈkɪlə/ | The police caught the killer. | La police a arrêté le meurtrier.
fool | idiot, imbécile | n | A2 | /fuːl/ | Don't be a fool! | Ne fais pas l'idiot !
fighter | combattant | n | B1 | /ˈfaɪtə/ | He's a fighter; he never gives up. | C'est un battant, il n'abandonne jamais.
runner | coureur | n | A2 | /ˈrʌnə/ | She is a fast runner. | C'est une coureuse rapide.
walking | marche (à pied) | n | A2 | /ˈwɔːkɪŋ/ | Walking is good for your health. | La marche est bonne pour la santé.
pro | pro, professionnel | n | B1 | /prəʊ/ | He plays golf like a pro. | Il joue au golf comme un pro.
superstar | superstar | n | A2 | /ˈsuːpəstɑː/ | The singer became a superstar overnight. | Le chanteur est devenu une superstar du jour au lendemain.
agency | agence | n | A2 | /ˈeɪdʒənsi/ | She works for a travel agency. | Elle travaille pour une agence de voyages.
committee | comité, commission | n | B1 | /kəˈmɪti/ | The committee meets every Monday. | Le comité se réunit tous les lundis.
chairman | président (d'une réunion, d'une société) | n | B1 | /ˈtʃeəmən/ | The chairman opened the meeting. | Le président a ouvert la séance.
reunion | retrouvailles, réunion d'anciens | n | B1 | /riːˈjuːniən/ | We had a family reunion last summer. | Nous avons organisé des retrouvailles familiales l'été dernier.
absence | absence | n | B1 | /ˈæbsəns/ | Nobody noticed his absence. | Personne n'a remarqué son absence.
acceptance | acceptation | n | B1 | /əkˈseptəns/ | Acceptance of God's will brings peace. | Accepter la volonté de Dieu apporte la paix.
accuracy | précision, exactitude | n | B1 | /ˈækjərəsi/ | Check the accuracy of the figures. | Vérifie l'exactitude des chiffres.
acknowledgement | reconnaissance ; accusé de réception | n | B2 | /əkˈnɒlɪdʒmənt/ | We received an acknowledgement of our letter. | Nous avons reçu un accusé de réception de notre lettre.
annoyance | agacement, contrariété | n | B1 | /əˈnɔɪəns/ | She couldn't hide her annoyance. | Elle n'arrivait pas à cacher son agacement.
apology | excuses | n | B1 | /əˈpɒlədʒi/ | I owe you an apology. | Je te dois des excuses.
appreciation | reconnaissance, appréciation | n | B1 | /əˌpriːʃiˈeɪʃn/ | She showed her appreciation with a gift. | Elle a exprimé sa reconnaissance par un cadeau.
approval | approbation, accord | n | B1 | /əˈpruːvl/ | He needs his father's approval. | Il a besoin de l'accord de son père.
arrangement | arrangement ; disposition | n | B1 | /əˈreɪndʒmənt/ | We made arrangements for the trip. | Nous avons fait les préparatifs du voyage.
attachment | attachement ; pièce jointe | n | B1 | /əˈtætʃmənt/ | I sent the file as an attachment. | J'ai envoyé le fichier en pièce jointe.
awareness | conscience, sensibilisation | n | B1 | /əˈweənəs/ | We need more awareness of the problem. | Il faut une meilleure prise de conscience du problème.
basis | base, fondement | n | B1 | /ˈbeɪsɪs/ | Trust is the basis of friendship. | La confiance est le fondement de l'amitié.
behalf | au nom de (on behalf of) | n | B2 | /bɪˈhɑːf/ | I'm writing on behalf of my father. | J'écris au nom de mon père.
blessing | bénédiction, bienfait | n | B1 | /ˈblesɪŋ/ | Good health is a blessing. | La bonne santé est un bienfait.
chaos | chaos | n | B1 | /ˈkeɪɒs/ | The city was in chaos after the storm. | La ville était dans le chaos après la tempête.
characteristic | caractéristique | n | B1 | /ˌkærəktəˈrɪstɪk/ | Patience is his best characteristic. | La patience est sa meilleure caractéristique.
charm | charme | n | B1 | /tʃɑːm/ | The old town has great charm. | La vieille ville a beaucoup de charme.
combination | combinaison, association | n | B1 | /ˌkɒmbɪˈneɪʃn/ | It's a combination of luck and hard work. | C'est un mélange de chance et de travail.
comparison | comparaison | n | B1 | /kəmˈpærɪsn/ | There's no comparison between the two. | Il n'y a aucune comparaison possible entre les deux.
confirmation | confirmation | n | B1 | /ˌkɒnfəˈmeɪʃn/ | You'll receive a confirmation by email. | Vous recevrez une confirmation par e-mail.
conflict | conflit | n | B1 | /ˈkɒnflɪkt/ | The conflict lasted ten years. | Le conflit a duré dix ans.
confusion | confusion | n | B1 | /kənˈfjuːʒn/ | There was some confusion about the date. | Il y a eu une confusion sur la date.
connection | lien ; connexion ; correspondance | n | B1 | /kəˈnekʃn/ | Is there a connection between the two events? | Y a-t-il un lien entre les deux événements ?
consideration | réflexion ; égard | n | B1 | /kənˌsɪdəˈreɪʃn/ | After careful consideration, I accepted. | Après mûre réflexion, j'ai accepté.
curiosity | curiosité | n | B1 | /ˌkjʊəriˈɒsəti/ | Curiosity is the start of knowledge. | La curiosité est le début du savoir.
curve | courbe, virage | n | B1 | /kɜːv/ | The road has a sharp curve. | La route fait un virage serré.
darkness | obscurité | n | B1 | /ˈdɑːknəs/ | The room was in complete darkness. | La pièce était plongée dans l'obscurité.
decision | décision | n | B1 | /dɪˈsɪʒn/ | It was a difficult decision. | C'était une décision difficile.
declaration | déclaration | n | B1 | /ˌdekləˈreɪʃn/ | They signed a declaration of peace. | Ils ont signé une déclaration de paix.
determination | détermination | n | B1 | /dɪˌtɜːmɪˈneɪʃn/ | Her determination impressed everyone. | Sa détermination a impressionné tout le monde.
development | développement ; évolution | n | B1 | /dɪˈveləpmənt/ | The development of the child is fast. | Le développement de l'enfant est rapide.
disagreement | désaccord | n | B1 | /ˌdɪsəˈɡriːmənt/ | We had a small disagreement. | Nous avons eu un petit désaccord.
discomfort | gêne, inconfort | n | B1 | /dɪsˈkʌmfət/ | You may feel some discomfort. | Vous pourriez ressentir une gêne.
disturbance | dérangement ; trouble | n | B1 | /dɪˈstɜːbəns/ | Sorry for the disturbance. | Désolé pour le dérangement.
aid | aide | n | B1 | /eɪd/ | The country needs food aid. | Le pays a besoin d'aide alimentaire.
bang | détonation, grand bruit | n | B1 | /bæŋ/ | The door shut with a bang. | La porte s'est refermée avec fracas.
destruction | destruction | n | B1 | /dɪˈstrʌkʃn/ | The war caused great destruction. | La guerre a causé de grandes destructions.
dot | point | n | B1 | /dɒt/ | The letter "i" has a dot. | La lettre « i » a un point.
edge | bord ; tranchant | n | B1 | /edʒ/ | Don't stand too close to the edge. | Ne te tiens pas trop près du bord.
encouragement | encouragement | n | B1 | /ɪnˈkʌrɪdʒmənt/ | Thanks for your encouragement. | Merci pour tes encouragements.
enjoyment | plaisir | n | B1 | /ɪnˈdʒɔɪmənt/ | He reads for enjoyment. | Il lit pour le plaisir.
entry | entrée ; inscription | n | B1 | /ˈentri/ | Entry is free for children. | L'entrée est gratuite pour les enfants.
equipment | équipement, matériel | n | B1 | /ɪˈkwɪpmənt/ | The gym has modern equipment. | La salle de sport dispose d'un équipement moderne.
establishment | établissement | n | B2 | /ɪˈstæblɪʃmənt/ | It's a respectable establishment. | C'est un établissement respectable.
excellence | excellence | n | B1 | /ˈeksələns/ | The school is known for its excellence. | L'école est réputée pour son excellence.
excess | excès | n | B2 | /ɪkˈses/ | Excess in anything is bad. | L'excès en toute chose est nuisible.
extent | étendue, mesure | n | B2 | /ɪkˈstent/ | To some extent, you're right. | Dans une certaine mesure, tu as raison.
facility | installation, équipement | n | B1 | /fəˈsɪləti/ | The hotel has excellent sports facilities. | L'hôtel dispose d'excellentes installations sportives.
failure | échec ; panne | n | B1 | /ˈfeɪljə/ | Failure is part of learning. | L'échec fait partie de l'apprentissage.
fragment | fragment, éclat | n | B2 | /ˈfræɡmənt/ | They found fragments of pottery. | Ils ont trouvé des fragments de poterie.
gap | écart, trou, lacune | n | B1 | /ɡæp/ | Mind the gap between the train and the platform. | Attention à l'espace entre le train et le quai.
glimpse | aperçu, coup d'œil | n | B2 | /ɡlɪmps/ | I caught a glimpse of the queen. | J'ai aperçu la reine.
glint | reflet, lueur | n | C1 | /ɡlɪnt/ | There was a glint of mischief in his eyes. | Une lueur malicieuse brillait dans ses yeux.
grouping | regroupement | n | B2 | /ˈɡruːpɪŋ/ | The grouping of pupils by age is common. | Le regroupement des élèves par âge est courant.
guidance | conseils ; guidée | n | B1 | /ˈɡaɪdns/ | We pray to God for guidance. | Nous prions Dieu de nous guider.
hardship | épreuve, privation | n | B2 | /ˈhɑːdʃɪp/ | They lived through years of hardship. | Ils ont traversé des années de privations.
haven | havre, refuge | n | B2 | /ˈheɪvn/ | The library is a haven of peace. | La bibliothèque est un havre de paix.
impression | impression | n | B1 | /ɪmˈpreʃn/ | She made a good impression. | Elle a fait bonne impression.
improvement | amélioration | n | B1 | /ɪmˈpruːvmənt/ | There's been a big improvement in your work. | Ton travail s'est beaucoup amélioré.
incident | incident | n | B1 | /ˈɪnsɪdənt/ | The police are investigating the incident. | La police enquête sur l'incident.
inquiry | demande de renseignements ; enquête | n | B2 | /ɪnˈkwaɪəri/ | We received many inquiries about the job. | Nous avons reçu de nombreuses demandes concernant le poste.
instruction | instruction, consigne | n | B1 | /ɪnˈstrʌkʃn/ | Read the instructions carefully. | Lis attentivement les consignes.
intention | intention | n | B1 | /ɪnˈtenʃn/ | Actions are judged by intentions. | Les actes ne valent que par les intentions.
likeness | ressemblance | n | C1 | /ˈlaɪknəs/ | There's a strong likeness between the brothers. | Il y a une forte ressemblance entre les frères.
limitation | limite, limitation | n | B1 | /ˌlɪmɪˈteɪʃn/ | We all have our limitations. | Nous avons tous nos limites.
mission | mission | n | B1 | /ˈmɪʃn/ | Their mission is to help the poor. | Leur mission est d'aider les pauvres.
misunderstanding | malentendu | n | B1 | /ˌmɪsʌndəˈstændɪŋ/ | It was just a misunderstanding. | Ce n'était qu'un malentendu.
motivation | motivation | n | B1 | /ˌməʊtɪˈveɪʃn/ | He lacks motivation. | Il manque de motivation.
motto | devise | n | B1 | /ˈmɒtəʊ/ | Our family motto is "never give up". | La devise de notre famille est « ne jamais abandonner ».
movement | mouvement | n | B1 | /ˈmuːvmənt/ | She made a sudden movement. | Elle a fait un mouvement brusque.
nonsense | bêtises, absurdités | n | B1 | /ˈnɒnsns/ | Don't talk nonsense! | Ne dis pas de bêtises !
obstacle | obstacle | n | B1 | /ˈɒbstəkl/ | Fear is the biggest obstacle. | La peur est le plus grand obstacle.
occasion | occasion ; événement | n | B1 | /əˈkeɪʒn/ | We wear these clothes on special occasions. | Nous portons ces vêtements dans les grandes occasions.
opening | ouverture ; inauguration | n | B1 | /ˈəʊpnɪŋ/ | The opening of the new library is on Monday. | L'inauguration de la nouvelle bibliothèque a lieu lundi.
pace | rythme, allure | n | B1 | /peɪs/ | Learn at your own pace. | Apprends à ton propre rythme.
participant | participant | n | B1 | /pɑːˈtɪsɪpənt/ | Each participant gets a certificate. | Chaque participant reçoit un certificat.
pause | pause, silence | n | B1 | /pɔːz/ | There was a short pause. | Il y a eu une courte pause.
possession | possession, bien | n | B1 | /pəˈzeʃn/ | He lost all his possessions in the fire. | Il a perdu tous ses biens dans l'incendie.
powder | poudre | n | B1 | /ˈpaʊdə/ | Add a spoonful of milk powder. | Ajoute une cuillerée de lait en poudre.
preference | préférence | n | B1 | /ˈprefrəns/ | Do you have a preference? | As-tu une préférence ?
preparation | préparation | n | B1 | /ˌprepəˈreɪʃn/ | Preparation is the key to success. | La préparation est la clé de la réussite.
presence | présence | n | B1 | /ˈprezns/ | Your presence is required. | Ta présence est requise.
prize | prix, récompense | n | B1 | /praɪz/ | She won first prize. | Elle a remporté le premier prix.
rank | rang, grade | n | B1 | /ræŋk/ | He reached the rank of captain. | Il a atteint le grade de capitaine.
reduction | réduction, baisse | n | B1 | /rɪˈdʌkʃn/ | There's a reduction for students. | Il y a une réduction pour les étudiants.
refusal | refus | n | B1 | /rɪˈfjuːzl/ | His refusal surprised us. | Son refus nous a surpris.
registration | inscription, immatriculation | n | B1 | /ˌredʒɪˈstreɪʃn/ | Registration closes on Friday. | Les inscriptions se terminent vendredi.
remainder | reste | n | B2 | /rɪˈmeɪndə/ | I'll pay the remainder next week. | Je paierai le reste la semaine prochaine.
requirement | exigence, condition requise | n | B1 | /rɪˈkwaɪəmənt/ | A degree is a requirement for this job. | Un diplôme est requis pour ce poste.
reward | récompense | n | B1 | /rɪˈwɔːd/ | Patience brings its reward. | La patience porte sa récompense.
service | service | n | B1 | /ˈsɜːvɪs/ | The service in this restaurant is excellent. | Le service dans ce restaurant est excellent.
session | séance, session | n | B1 | /ˈseʃn/ | The training session lasts an hour. | La séance d'entraînement dure une heure.
signal | signal | n | B1 | /ˈsɪɡnəl/ | There's no signal here. | Il n'y a pas de réseau ici.
significance | importance, signification | n | B1 | /sɪɡˈnɪfɪkəns/ | Do you understand the significance of this event? | Comprends-tu l'importance de cet événement ?
similarity | ressemblance, similitude | n | B1 | /ˌsɪməˈlærəti/ | There are many similarities between the two languages. | Les deux langues se ressemblent beaucoup.
sparkle | étincelle, éclat | n | B2 | /ˈspɑːkl/ | There was a sparkle in her eyes. | Il y avait une étincelle dans ses yeux.
standard | niveau ; norme | n | B1 | /ˈstændəd/ | The standard of living has improved. | Le niveau de vie s'est amélioré.
strip | bande | n | B1 | /strɪp/ | Cut the paper into strips. | Coupe le papier en bandes.
surface | surface | n | B1 | /ˈsɜːfɪs/ | The surface of the table is scratched. | La surface de la table est rayée.
survival | survie | n | B1 | /səˈvaɪvl/ | Water is essential for survival. | L'eau est indispensable à la survie.
suspicion | soupçon, méfiance | n | B1 | /səˈspɪʃn/ | He was arrested on suspicion of theft. | Il a été arrêté pour soupçon de vol.
tank | réservoir ; char | n | B1 | /tæŋk/ | Fill the tank with petrol. | Fais le plein d'essence.
tendency | tendance | n | B1 | /ˈtendənsi/ | He has a tendency to exaggerate. | Il a tendance à exagérer.
tension | tension | n | B1 | /ˈtenʃn/ | There was tension in the room. | Il y avait de la tension dans la pièce.
trace | trace | n | B1 | /treɪs/ | They vanished without a trace. | Ils ont disparu sans laisser de trace.
transformation | transformation | n | B1 | /ˌtrænsfəˈmeɪʃn/ | The town has undergone a transformation. | La ville a subi une transformation.
triumph | triomphe | n | B1 | /ˈtraɪʌmf/ | The concert was a triumph. | Le concert a été un triomphe.
uncertainty | incertitude | n | B1 | /ʌnˈsɜːtnti/ | There is a lot of uncertainty about the future. | L'avenir est très incertain.
variety | variété, diversité | n | B1 | /vəˈraɪəti/ | The market offers a variety of fruit. | Le marché propose une grande variété de fruits.
vision | vue ; vision | n | B1 | /ˈvɪʒn/ | He has poor vision in one eye. | Il voit mal d'un œil.
accessibility | accessibilité | n | B2 | /əkˌsesəˈbɪləti/ | We improved the accessibility of the website. | Nous avons amélioré l'accessibilité du site.
adjustment | ajustement, adaptation | n | B2 | /əˈdʒʌstmənt/ | We made a few adjustments to the plan. | Nous avons apporté quelques ajustements au plan.
aspiration | aspiration, ambition | n | C1 | /ˌæspəˈreɪʃn/ | She has aspirations to become a doctor. | Elle aspire à devenir médecin.
assurance | assurance, garantie | n | B2 | /əˈʃʊərəns/ | He gave me his assurance that he would come. | Il m'a assuré qu'il viendrait.
attainment | réussite, acquis | n | C1 | /əˈteɪnmənt/ | Educational attainment varies by region. | Le niveau scolaire varie selon les régions.
attractiveness | attrait, charme | n | B2 | /əˈtræktɪvnəs/ | The attractiveness of the offer is obvious. | L'attrait de l'offre est évident.
availability | disponibilité | n | B2 | /əˌveɪləˈbɪləti/ | Check the availability of rooms. | Vérifie la disponibilité des chambres.
beam | poutre ; rayon | n | B2 | /biːm/ | A beam of light shone through the window. | Un rayon de lumière traversait la fenêtre.
bearing | rapport, incidence | n | C1 | /ˈbeərɪŋ/ | This has no bearing on the result. | Cela n'a aucune incidence sur le résultat.
blade | lame | n | B2 | /bleɪd/ | The knife has a sharp blade. | Le couteau a une lame tranchante.
blast | explosion ; rafale | n | B2 | /blɑːst/ | The blast broke all the windows. | L'explosion a brisé toutes les vitres.
capability | capacité, aptitude | n | B2 | /ˌkeɪpəˈbɪləti/ | The phone has video capability. | Le téléphone permet de filmer.
catastrophe | catastrophe | n | B2 | /kəˈtæstrəfi/ | The flood was a catastrophe. | L'inondation a été une catastrophe.
chunk | gros morceau | n | B2 | /tʃʌŋk/ | He cut the bread into chunks. | Il a coupé le pain en gros morceaux.
closure | fermeture | n | B2 | /ˈkləʊʒə/ | The closure of the factory cost many jobs. | La fermeture de l'usine a coûté de nombreux emplois.
coincidence | coïncidence, hasard | n | B2 | /kəʊˈɪnsɪdəns/ | What a coincidence! | Quelle coïncidence !
competence | compétence | n | B2 | /ˈkɒmpɪtəns/ | Nobody doubts his competence. | Personne ne doute de sa compétence.
completion | achèvement | n | B2 | /kəmˈpliːʃn/ | The bridge is near completion. | Le pont est presque achevé.
complexity | complexité | n | B2 | /kəmˈpleksəti/ | I underestimated the complexity of the task. | J'ai sous-estimé la complexité de la tâche.
cooperation | coopération | n | B2 | /kəʊˌɒpəˈreɪʃn/ | Thank you for your cooperation. | Merci de votre coopération.
cornerstone | pierre angulaire | n | C1 | /ˈkɔːnəstəʊn/ | Prayer is the cornerstone of the faith. | La prière est la pierre angulaire de la foi.
correctness | exactitude, justesse | n | B2 | /kəˈrektnəs/ | Check the correctness of your answers. | Vérifie l'exactitude de tes réponses.
correspondence | correspondance, courrier | n | B2 | /ˌkɒrəˈspɒndəns/ | She deals with all the correspondence. | Elle s'occupe de tout le courrier.
criticism | critique | n | B2 | /ˈkrɪtɪsɪzəm/ | Accept criticism with humility. | Accepte la critique avec humilité.
disappearance | disparition | n | B2 | /ˌdɪsəˈpɪərəns/ | Police are investigating his disappearance. | La police enquête sur sa disparition.
disapproval | désapprobation | n | B2 | /ˌdɪsəˈpruːvl/ | She shook her head in disapproval. | Elle a secoué la tête en signe de désapprobation.
disgrace | honte, déshonneur | n | B2 | /dɪsˈɡreɪs/ | It's a disgrace to treat people like that. | C'est une honte de traiter les gens ainsi.
disguise | déguisement | n | B2 | /dɪsˈɡaɪz/ | The thief wore a disguise. | Le voleur portait un déguisement.
dispute | différend, litige | n | B2 | /dɪˈspjuːt/ | The neighbours have a dispute about the fence. | Les voisins ont un différend à propos de la clôture.
disregard | mépris, indifférence | n | C1 | /ˌdɪsrɪˈɡɑːd/ | He showed complete disregard for safety. | Il a fait preuve d'un total mépris pour la sécurité.
distraction | distraction | n | B2 | /dɪˈstrækʃn/ | Phones are a distraction in class. | Les téléphones sont une source de distraction en classe.
division | division ; service | n | B2 | /dɪˈvɪʒn/ | She works in the sales division. | Elle travaille au service commercial.
duplicate | double, copie | n | B2 | /ˈdjuːplɪkət/ | Keep a duplicate of the key. | Garde un double de la clé.
duplication | duplication, double emploi | n | C1 | /ˌdjuːplɪˈkeɪʃn/ | We must avoid duplication of effort. | Il faut éviter de faire le même travail deux fois.
ease | facilité, aisance | n | B2 | /iːz/ | She passed the exam with ease. | Elle a réussi l'examen avec aisance.
effectiveness | efficacité | n | B2 | /ɪˈfektɪvnəs/ | We measured the effectiveness of the campaign. | Nous avons mesuré l'efficacité de la campagne.
exactness | exactitude | n | C1 | /ɪɡˈzæktnəs/ | The exactness of his memory surprised us. | L'exactitude de sa mémoire nous a surpris.
exaggeration | exagération | n | B2 | /ɪɡˌzædʒəˈreɪʃn/ | It's no exaggeration to say he saved my life. | Ce n'est pas exagéré de dire qu'il m'a sauvé la vie.
exception | exception | n | B2 | /ɪkˈsepʃn/ | There's an exception to every rule. | Toute règle a son exception.
execution | exécution | n | B2 | /ˌeksɪˈkjuːʃn/ | The plan was good, but the execution was poor. | Le plan était bon, mais l'exécution médiocre.
expectation | attente, espérance | n | B2 | /ˌekspekˈteɪʃn/ | The film didn't meet my expectations. | Le film n'a pas répondu à mes attentes.
extension | prolongation ; extension ; poste (téléphone) | n | B2 | /ɪkˈstenʃn/ | I asked for an extension to finish my essay. | J'ai demandé un délai supplémentaire pour finir ma dissertation.
feat | exploit, prouesse | n | C1 | /fiːt/ | Building the bridge was a remarkable feat. | La construction du pont a été une prouesse remarquable.
flame | flamme | n | B2 | /fleɪm/ | The candle flame flickered. | La flamme de la bougie vacillait.
flash | éclair, flash | n | B2 | /flæʃ/ | There was a flash of lightning. | Il y a eu un éclair.
formation | formation (d'un ensemble) | n | B2 | /fɔːˈmeɪʃn/ | The birds flew in formation. | Les oiseaux volaient en formation.
gateway | porte, passerelle | n | B2 | /ˈɡeɪtweɪ/ | Education is the gateway to success. | L'éducation est la porte de la réussite.
gear | équipement, matériel ; vitesse | n | B2 | /ɡɪə/ | Bring your camping gear. | Apporte ton matériel de camping.
glare | éblouissement ; regard furieux | n | B2 | /ɡleə/ | The glare of the sun hurt my eyes. | L'éclat du soleil me faisait mal aux yeux.
gleam | lueur, reflet | n | C1 | /ɡliːm/ | There was a gleam of hope in her eyes. | Il y avait une lueur d'espoir dans ses yeux.
greatness | grandeur | n | B2 | /ˈɡreɪtnəs/ | We saw the greatness of God in the mountains. | Nous avons vu la grandeur de Dieu dans les montagnes.
guideline | directive, ligne directrice | n | B2 | /ˈɡaɪdlaɪn/ | Follow the safety guidelines. | Respecte les consignes de sécurité.
haste | hâte, précipitation | n | B2 | /heɪst/ | Haste is from Satan, says the hadith. | La précipitation vient de Satan, dit le hadith.
heap | tas | n | B2 | /hiːp/ | There was a heap of clothes on the floor. | Il y avait un tas de vêtements par terre.
helper | aide, assistant | n | B2 | /ˈhelpə/ | We need more helpers for the event. | Il nous faut plus de bénévoles pour l'événement.
hesitation | hésitation | n | B2 | /ˌhezɪˈteɪʃn/ | She accepted without hesitation. | Elle a accepté sans hésitation.
hint | indice, allusion ; astuce | n | B2 | /hɪnt/ | Give me a hint. | Donne-moi un indice.
holder | titulaire ; support | n | B2 | /ˈhəʊldə/ | Ticket holders can enter now. | Les détenteurs de billets peuvent entrer.
hook | crochet ; hameçon | n | B2 | /hʊk/ | Hang your coat on the hook. | Accroche ton manteau au crochet.
identification | identification ; pièce d'identité | n | B2 | /aɪˌdentɪfɪˈkeɪʃn/ | Please bring some identification. | Veuillez apporter une pièce d'identité.
imitation | imitation | n | B2 | /ˌɪmɪˈteɪʃn/ | It's an imitation leather bag. | C'est un sac en similicuir.
initiative | initiative | n | B2 | /ɪˈnɪʃətɪv/ | She took the initiative. | Elle a pris l'initiative.
interruption | interruption | n | B2 | /ˌɪntəˈrʌpʃn/ | Sorry for the interruption. | Désolé de vous interrompre.
intrusion | intrusion | n | C1 | /ɪnˈtruːʒn/ | It's an intrusion into my private life. | C'est une intrusion dans ma vie privée.
involvement | participation, implication | n | B2 | /ɪnˈvɒlvmənt/ | He denied any involvement in the crime. | Il a nié toute implication dans le crime.
knot | nœud | n | B2 | /nɒt/ | Tie a knot in the rope. | Fais un nœud à la corde.
master | maître | n | B2 | /ˈmɑːstə/ | The dog obeys its master. | Le chien obéit à son maître.
mastery | maîtrise | n | C1 | /ˈmɑːstəri/ | He showed complete mastery of the language. | Il a démontré une parfaite maîtrise de la langue.
means | moyen(s) | n | B2 | /miːnz/ | The bike is my only means of transport. | Le vélo est mon seul moyen de transport.
midst | milieu, sein | n | C1 | /mɪdst/ | In the midst of the crisis, he stayed calm. | Au milieu de la crise, il est resté calme.
misconception | idée fausse | n | C1 | /ˌmɪskənˈsepʃn/ | It's a common misconception. | C'est une idée reçue courante.
misfortune | malheur, malchance | n | B2 | /ˌmɪsˈfɔːtʃuːn/ | He had the misfortune to lose his job. | Il a eu le malheur de perdre son emploi.
mobility | mobilité | n | B2 | /məʊˈbɪləti/ | The injury affected his mobility. | La blessure a réduit sa mobilité.
modernisation | modernisation | n | C1 | /ˌmɒdənaɪˈzeɪʃn/ | The modernisation of the railway took years. | La modernisation du chemin de fer a pris des années.
modification | modification | n | B2 | /ˌmɒdɪfɪˈkeɪʃn/ | We made a few modifications to the design. | Nous avons apporté quelques modifications au modèle.
motion | mouvement ; motion | n | B2 | /ˈməʊʃn/ | The motion of the boat made me sick. | Le mouvement du bateau m'a donné la nausée.
murmur | murmure | n | B2 | /ˈmɜːmə/ | We heard the murmur of the stream. | Nous entendions le murmure du ruisseau.
novelty | nouveauté | n | B2 | /ˈnɒvlti/ | The novelty soon wore off. | L'attrait de la nouveauté s'est vite dissipé.
nuisance | nuisance, embêtement | n | B2 | /ˈnjuːsns/ | The noise is a real nuisance. | Le bruit est une vraie nuisance.
observer | observateur | n | B2 | /əbˈzɜːvə/ | Observers monitored the election. | Des observateurs ont surveillé l'élection.
overlap | chevauchement | n | C1 | /ˈəʊvəlæp/ | There's some overlap between the two courses. | Les deux cours se recoupent en partie.
panel | panneau ; jury, comité | n | B2 | /ˈpænl/ | A panel of experts judged the competition. | Un jury d'experts a évalué le concours.
peep | coup d'œil | n | C1 | /piːp/ | Take a peep through the window. | Jette un coup d'œil par la fenêtre.
persuasion | persuasion | n | B2 | /pəˈsweɪʒn/ | After a little persuasion, he agreed. | Après un peu de persuasion, il a accepté.
popularity | popularité | n | B2 | /ˌpɒpjuˈlærəti/ | The game's popularity is growing. | La popularité du jeu augmente.
practicality | aspect pratique | n | C1 | /ˌpræktɪˈkæləti/ | I chose the car for its practicality. | J'ai choisi cette voiture pour son côté pratique.
predicament | situation difficile | n | C1 | /prɪˈdɪkəmənt/ | I'm in a real predicament. | Je suis dans une situation délicate.
prestige | prestige | n | B2 | /preˈstiːʒ/ | The job brings prestige. | Ce poste apporte du prestige.
prick | piqûre | n | C1 | /prɪk/ | I felt a sharp prick on my arm. | J'ai senti une piqûre vive au bras.
prominence | importance, notoriété | n | C1 | /ˈprɒmɪnəns/ | She rose to prominence in the 1990s. | Elle s'est fait connaître dans les années 1990.
provision | fourniture ; disposition | n | C1 | /prəˈvɪʒn/ | The provision of clean water is a priority. | L'accès à l'eau potable est une priorité.
proximity | proximité | n | C1 | /prɒkˈsɪməti/ | The house is in close proximity to the mosque. | La maison est à proximité immédiate de la mosquée.
pursuit | poursuite, quête | n | C1 | /pəˈsjuːt/ | The pursuit of knowledge is a duty. | La quête du savoir est un devoir.
query | question, demande | n | B2 | /ˈkwɪəri/ | If you have any queries, call us. | Pour toute question, appelez-nous.
rattle | cliquetis ; hochet | n | B2 | /ˈrætl/ | The baby shook its rattle. | Le bébé agitait son hochet.
realisation | prise de conscience ; réalisation | n | C1 | /ˌriːəlaɪˈzeɪʃn/ | The realisation hit me suddenly. | J'en ai soudain pris conscience.
recognition | reconnaissance | n | B2 | /ˌrekəɡˈnɪʃn/ | She received recognition for her work. | Son travail a été reconnu.
recollection | souvenir | n | C1 | /ˌrekəˈlekʃn/ | I have no recollection of that day. | Je n'ai aucun souvenir de ce jour-là.
refuge | refuge, abri | n | B2 | /ˈrefjuːdʒ/ | We seek refuge in God from evil. | Nous cherchons refuge auprès de Dieu contre le mal.
rejection | rejet, refus | n | B2 | /rɪˈdʒekʃn/ | He's afraid of rejection. | Il a peur d'être rejeté.
repetition | répétition | n | B2 | /ˌrepəˈtɪʃn/ | Repetition helps you remember. | La répétition aide à mémoriser.
replacement | remplacement ; remplaçant | n | B2 | /rɪˈpleɪsmənt/ | We need a replacement for the broken part. | Il nous faut une pièce de rechange.
restriction | restriction | n | B2 | /rɪˈstrɪkʃn/ | There are restrictions on water use. | L'usage de l'eau fait l'objet de restrictions.
revenge | vengeance | n | B2 | /rɪˈvendʒ/ | Forgiveness is better than revenge. | Le pardon vaut mieux que la vengeance.
rim | bord ; jante | n | C1 | /rɪm/ | The rim of the cup is chipped. | Le bord de la tasse est ébréché.
sag | affaissement | n | C1 | /sæɡ/ | There's a sag in the middle of the mattress. | Le matelas s'affaisse au milieu.
scent | parfum, odeur | n | B2 | /sent/ | The scent of roses filled the garden. | Le parfum des roses emplissait le jardin.
segment | segment, partie | n | B2 | /ˈseɡmənt/ | Cut the orange into segments. | Coupe l'orange en quartiers.
setback | revers, contretemps | n | B2 | /ˈsetbæk/ | The injury was a serious setback. | La blessure a été un sérieux revers.
shortness | brièveté ; manque | n | C1 | /ˈʃɔːtnəs/ | He suffers from shortness of breath. | Il est essoufflé facilement.
showcase | vitrine | n | C1 | /ˈʃəʊkeɪs/ | The festival is a showcase for young talent. | Le festival est une vitrine pour les jeunes talents.
simplification | simplification | n | C1 | /ˌsɪmplɪfɪˈkeɪʃn/ | That's an oversimplification of the problem. | C'est une simplification excessive du problème.
sliver | éclat, mince tranche | n | C1 | /ˈslɪvə/ | There's only a sliver of hope left. | Il ne reste qu'une infime lueur d'espoir.
softness | douceur | n | B2 | /ˈsɒftnəs/ | I love the softness of this blanket. | J'adore la douceur de cette couverture.
solidity | solidité | n | C1 | /səˈlɪdəti/ | The solidity of the walls impressed us. | La solidité des murs nous a impressionnés.
spectacle | spectacle | n | B2 | /ˈspektəkl/ | The fireworks were a wonderful spectacle. | Le feu d'artifice était un spectacle merveilleux.
spur | éperon ; incitation | n | C1 | /spɜː/ | I bought it on the spur of the moment. | Je l'ai acheté sur un coup de tête.
stability | stabilité | n | B2 | /stəˈbɪləti/ | Children need stability. | Les enfants ont besoin de stabilité.
stack | pile | n | B2 | /stæk/ | There's a stack of plates in the sink. | Il y a une pile d'assiettes dans l'évier.
stake | enjeu ; piquet | n | C1 | /steɪk/ | Our future is at stake. | Notre avenir est en jeu.
standstill | arrêt, immobilisation | n | C1 | /ˈstændstɪl/ | The traffic came to a standstill. | La circulation s'est complètement arrêtée.
stimulation | stimulation | n | C1 | /ˌstɪmjuˈleɪʃn/ | Children need intellectual stimulation. | Les enfants ont besoin de stimulation intellectuelle.
stockpile | stock, réserve | n | C1 | /ˈstɒkpaɪl/ | They have a stockpile of food. | Ils ont une réserve de nourriture.
strand | brin, mèche | n | C1 | /strænd/ | A strand of hair fell across her face. | Une mèche de cheveux lui tombait sur le visage.
subdivision | subdivision | n | C1 | /ˈsʌbdɪvɪʒn/ | Each chapter has several subdivisions. | Chaque chapitre comporte plusieurs subdivisions.
surge | montée, poussée | n | C1 | /sɜːdʒ/ | There was a surge in prices. | Il y a eu une flambée des prix.
surroundings | environs, cadre | n | B2 | /səˈraʊndɪŋz/ | The hotel is in beautiful surroundings. | L'hôtel est situé dans un cadre magnifique.
timing | moment choisi, minutage | n | B2 | /ˈtaɪmɪŋ/ | Your timing is perfect! | Tu tombes à pic !
tug | coup sec, traction | n | C1 | /tʌɡ/ | I felt a tug on my sleeve. | J'ai senti qu'on tirait sur ma manche.
twinkle | scintillement, pétillement | n | C1 | /ˈtwɪŋkl/ | There was a twinkle in his eye. | Ses yeux pétillaient.
utility | utilité ; service public | n | C1 | /juːˈtɪləti/ | Gas and electricity are public utilities. | Le gaz et l'électricité sont des services publics.
variation | variation | n | B2 | /ˌveəriˈeɪʃn/ | There's little variation in temperature. | La température varie peu.
version | version | n | B2 | /ˈvɜːʃn/ | Download the latest version. | Télécharge la dernière version.
wreck | épave | n | B2 | /rek/ | Divers explored the wreck. | Des plongeurs ont exploré l'épave.
ownership | propriété, possession | n | B2 | /ˈəʊnəʃɪp/ | The ownership of the land is disputed. | La propriété du terrain est contestée.
removal | enlèvement, suppression | n | B2 | /rɪˈmuːvl/ | Snow removal costs the city a lot. | Le déneigement coûte cher à la ville.
odds | chances, probabilités | n | B2 | /ɒdz/ | The odds are against us. | Les chances ne sont pas de notre côté.
intervention | intervention | n | B2 | /ˌɪntəˈvenʃn/ | Medical intervention saved her life. | Une intervention médicale lui a sauvé la vie.
tribute | hommage | n | B2 | /ˈtrɪbjuːt/ | They paid tribute to the victims. | Ils ont rendu hommage aux victimes.
unity | unité | n | B2 | /ˈjuːnəti/ | Unity is strength. | L'union fait la force.
tier | niveau, échelon | n | C1 | /tɪə/ | The wedding cake had three tiers. | Le gâteau de mariage avait trois étages.
intensity | intensité | n | B2 | /ɪnˈtensəti/ | The intensity of the storm surprised us. | L'intensité de la tempête nous a surpris.
boundary | limite, frontière | n | B2 | /ˈbaʊndri/ | The river forms the boundary between the two farms. | La rivière marque la limite entre les deux fermes.
overview | vue d'ensemble, aperçu | n | B2 | /ˈəʊvəvjuː/ | Give me an overview of the project. | Donne-moi une vue d'ensemble du projet.
array | ensemble, gamme | n | C1 | /əˈreɪ/ | The shop sells a wide array of spices. | Le magasin propose un large éventail d'épices.
dynamics | dynamique | n | C1 | /daɪˈnæmɪks/ | Family dynamics can be complex. | Les relations familiales peuvent être complexes.
rotation | rotation | n | B2 | /rəʊˈteɪʃn/ | The rotation of the Earth causes day and night. | La rotation de la Terre provoque le jour et la nuit.
momentum | élan, dynamique | n | C1 | /məˈmentəm/ | The campaign is gaining momentum. | La campagne prend de l'ampleur.
submission | soumission ; remise (d'un dossier) | n | C1 | /səbˈmɪʃn/ | Islam means submission to God. | L'islam signifie la soumission à Dieu.
detection | détection | n | C1 | /dɪˈtekʃn/ | Early detection saves lives. | Un dépistage précoce sauve des vies.
indication | indication, signe | n | B2 | /ˌɪndɪˈkeɪʃn/ | There's no indication of rain. | Rien n'indique qu'il va pleuvoir.
streak | série ; trait | n | C1 | /striːk/ | The team is on a winning streak. | L'équipe enchaîne les victoires.
orientation | orientation | n | C1 | /ˌɔːriənˈteɪʃn/ | There's an orientation day for new students. | Il y a une journée d'accueil pour les nouveaux étudiants.
upside | avantage, bon côté | n | B2 | /ˈʌpsaɪd/ | The upside is that it's cheap. | Le bon côté, c'est que c'est bon marché.
void | vide | n | C1 | /vɔɪd/ | His death left a void in our lives. | Sa mort a laissé un vide dans nos vies.
magnitude | ampleur, magnitude | n | C1 | /ˈmæɡnɪtjuːd/ | We didn't realise the magnitude of the problem. | Nous n'avions pas mesuré l'ampleur du problème.
pledge | promesse, engagement | n | C1 | /pledʒ/ | They made a pledge to help. | Ils ont pris l'engagement d'aider.
cluster | groupe, grappe | n | C1 | /ˈklʌstə/ | A cluster of houses stood by the river. | Un groupe de maisons se dressait au bord de la rivière.
consistency | cohérence, régularité ; consistance | n | C1 | /kənˈsɪstənsi/ | Success needs consistency. | La réussite exige de la régularité.
interference | ingérence ; interférence | n | C1 | /ˌɪntəˈfɪərəns/ | We won't accept foreign interference. | Nous n'accepterons aucune ingérence étrangère.
perfection | perfection | n | B2 | /pəˈfekʃn/ | Only God is perfection. | Seul Dieu est parfait.
clash | affrontement, heurt | n | C1 | /klæʃ/ | There were clashes between police and protesters. | Il y a eu des heurts entre la police et les manifestants.
spike | pointe ; flambée | n | C1 | /spaɪk/ | There was a spike in prices. | Il y a eu une flambée des prix.
sensitivity | sensibilité | n | B2 | /ˌsensəˈtɪvəti/ | The subject needs great sensitivity. | Le sujet demande beaucoup de délicatesse.
recipient | destinataire, bénéficiaire | n | C1 | /rɪˈsɪpiənt/ | The recipient must sign for the parcel. | Le destinataire doit signer pour le colis.
bundle | paquet, liasse | n | B2 | /ˈbʌndl/ | She carried a bundle of clothes. | Elle portait un paquet de vêtements.
elimination | élimination | n | C1 | /ɪˌlɪmɪˈneɪʃn/ | The elimination of poverty is our goal. | L'élimination de la pauvreté est notre objectif.
halt | arrêt | n | C1 | /hɔːlt/ | The train came to a halt. | Le train s'est arrêté.
indicator | indicateur | n | C1 | /ˈɪndɪkeɪtə/ | Unemployment is a key indicator. | Le chômage est un indicateur clé.
aftermath | suites, lendemain | n | C1 | /ˈɑːftəmæθ/ | In the aftermath of the war, the country was poor. | Au lendemain de la guerre, le pays était pauvre.
clarity | clarté | n | C1 | /ˈklærəti/ | His explanation lacked clarity. | Son explication manquait de clarté.
progression | progression | n | C1 | /prəˈɡreʃn/ | We noticed a steady progression. | Nous avons constaté une progression régulière.
shaft | puits ; manche ; rayon | n | C1 | /ʃɑːft/ | A shaft of light lit the room. | Un rayon de lumière éclairait la pièce.
haul | prise, butin ; trajet | n | C1 | /hɔːl/ | It's a long haul to the top. | Il y a encore un long chemin jusqu'au sommet.
thrust | poussée ; idée principale | n | C1 | /θrʌst/ | The main thrust of his argument is clear. | L'idée principale de son argumentation est claire.
renewal | renouvellement | n | C1 | /rɪˈnjuːəl/ | Ramadan is a time of spiritual renewal. | Le ramadan est un temps de renouveau spirituel.
activation | activation | n | C1 | /ˌæktɪˈveɪʃn/ | Card activation takes a few minutes. | L'activation de la carte prend quelques minutes.
dominance | domination, prédominance | n | C1 | /ˈdɒmɪnəns/ | The team's dominance is clear. | La domination de l'équipe est évidente.
oversight | oubli ; surveillance | n | C1 | /ˈəʊvəsaɪt/ | It was an oversight on my part. | C'est un oubli de ma part.
token | jeton ; gage | n | C1 | /ˈtəʊkən/ | Accept this gift as a token of thanks. | Accepte ce cadeau en gage de gratitude.
accord | accord | n | C1 | /əˈkɔːd/ | They signed a peace accord. | Ils ont signé un accord de paix.
depths | profondeurs | n | C1 | /depθs/ | Strange fish live in the depths of the ocean. | D'étranges poissons vivent dans les profondeurs de l'océan.
foam | mousse | n | B2 | /fəʊm/ | The waves left foam on the sand. | Les vagues laissaient de l'écume sur le sable.
notch | cran, encoche | n | C1 | /nɒtʃ/ | Turn the volume up a notch. | Monte le volume d'un cran.
traction | adhérence ; succès | n | C2 | /ˈtrækʃn/ | The idea is gaining traction. | L'idée gagne du terrain.
variant | variante | n | C1 | /ˈveəriənt/ | A new variant of the virus has appeared. | Un nouveau variant du virus est apparu.
occurrence | fait, phénomène ; occurrence | n | C1 | /əˈkʌrəns/ | Floods are a common occurrence here. | Les inondations sont fréquentes ici.
pathway | chemin, voie | n | C1 | /ˈpɑːθweɪ/ | Education is a pathway out of poverty. | L'éducation est un moyen de sortir de la pauvreté.
designation | désignation, appellation | n | C2 | /ˌdezɪɡˈneɪʃn/ | The wine has a protected designation of origin. | Le vin a une appellation d'origine protégée.
eligibility | admissibilité, éligibilité | n | C1 | /ˌelɪdʒəˈbɪləti/ | Check your eligibility for the grant. | Vérifie si tu as droit à la bourse.
relevance | pertinence | n | C1 | /ˈreləvəns/ | I don't see the relevance of your question. | Je ne vois pas la pertinence de ta question.
beacon | balise ; phare | n | C1 | /ˈbiːkən/ | The lighthouse is a beacon for ships. | Le phare guide les navires.
bounty | prime ; générosité | n | C2 | /ˈbaʊnti/ | We thank God for His bounty. | Nous remercions Dieu pour Sa générosité.
coil | rouleau, bobine | n | C1 | /kɔɪl/ | A coil of rope lay on the deck. | Un rouleau de corde était posé sur le pont.
contention | dispute ; affirmation | n | C2 | /kənˈtenʃn/ | It's my contention that he lied. | Je soutiens qu'il a menti.
confrontation | confrontation, affrontement | n | C1 | /ˌkɒnfrʌnˈteɪʃn/ | He wants to avoid confrontation. | Il veut éviter l'affrontement.
contributor | contributeur, donateur | n | C1 | /kənˈtrɪbjətə/ | She's a regular contributor to the magazine. | Elle collabore régulièrement au magazine.
onset | début, apparition | n | C1 | /ˈɒnset/ | The onset of winter was early. | L'hiver est arrivé tôt.
apex | sommet, apogée | n | C2 | /ˈeɪpeks/ | The empire reached its apex in 1500. | L'empire a atteint son apogée en 1500.
continuation | continuation, suite | n | C1 | /kənˌtɪnjuˈeɪʃn/ | This book is a continuation of the first. | Ce livre est la suite du premier.
directive | directive | n | C2 | /dəˈrektɪv/ | The EU issued a new directive. | L'UE a publié une nouvelle directive.
disruption | perturbation | n | C1 | /dɪsˈrʌpʃn/ | The strike caused disruption. | La grève a provoqué des perturbations.
instability | instabilité | n | C1 | /ˌɪnstəˈbɪləti/ | Political instability worries investors. | L'instabilité politique inquiète les investisseurs.
lump | morceau ; bosse | n | B2 | /lʌmp/ | Two lumps of sugar, please. | Deux morceaux de sucre, s'il vous plaît.
penetration | pénétration | n | C2 | /ˌpenɪˈtreɪʃn/ | Internet penetration is high in Korea. | Le taux d'accès à internet est élevé en Corée.
severity | gravité, sévérité | n | C1 | /sɪˈverəti/ | Doctors assessed the severity of the injury. | Les médecins ont évalué la gravité de la blessure.
baseline | référence, point de départ | n | C1 | /ˈbeɪslaɪn/ | We use last year as a baseline. | Nous prenons l'an dernier comme point de référence.
counterpart | homologue | n | C1 | /ˈkaʊntəpɑːt/ | The minister met his French counterpart. | Le ministre a rencontré son homologue français.
hustle | effervescence, agitation | n | C1 | /ˈhʌsl/ | I love the hustle and bustle of the market. | J'adore l'effervescence du marché.
verification | vérification | n | C1 | /ˌverɪfɪˈkeɪʃn/ | We need verification of your identity. | Nous devons vérifier votre identité.
vulnerability | vulnérabilité | n | C1 | /ˌvʌlnərəˈbɪləti/ | He showed his vulnerability. | Il a montré sa vulnérabilité.
accomplishment | réussite, accomplissement | n | C1 | /əˈkʌmplɪʃmənt/ | Learning the Qur'an by heart is a great accomplishment. | Apprendre le Coran par cœur est un bel accomplissement.
entirety | totalité | n | C2 | /ɪnˈtaɪərəti/ | He read the book in its entirety. | Il a lu le livre en entier.
inconvenience | désagrément, gêne | n | C1 | /ˌɪnkənˈviːniəns/ | Sorry for the inconvenience. | Veuillez nous excuser pour la gêne occasionnée.
protector | protecteur | n | C1 | /prəˈtektə/ | God is the best protector. | Dieu est le meilleur protecteur.
suppression | suppression, répression | n | C2 | /səˈpreʃn/ | The suppression of the truth is a sin. | Dissimuler la vérité est un péché.
validation | validation | n | C1 | /ˌvælɪˈdeɪʃn/ | He seeks validation from others. | Il cherche l'approbation des autres.
lag | décalage, retard | n | C1 | /læɡ/ | I'm suffering from jet lag. | Je souffre du décalage horaire.
backlash | réaction hostile, levée de boucliers | n | C2 | /ˈbæklæʃ/ | The decision provoked a backlash. | La décision a provoqué une levée de boucliers.
crunch | moment critique ; craquement | n | C1 | /krʌntʃ/ | When it came to the crunch, he helped us. | Au moment crucial, il nous a aidés.
dependence | dépendance | n | C1 | /dɪˈpendəns/ | We must reduce our dependence on oil. | Nous devons réduire notre dépendance au pétrole.
prevalence | prévalence, fréquence | n | C2 | /ˈprevələns/ | The prevalence of the disease is rising. | La prévalence de la maladie augmente.
crest | crête ; blason | n | C1 | /krest/ | We reached the crest of the hill. | Nous avons atteint la crête de la colline.
deception | tromperie, duperie | n | C1 | /dɪˈsepʃn/ | The whole story was a deception. | Toute l'histoire n'était qu'une tromperie.
derivative | dérivé | n | C2 | /dɪˈrɪvətɪv/ | Petrol is a derivative of crude oil. | L'essence est un dérivé du pétrole brut.
inception | création, commencement | n | C2 | /ɪnˈsepʃn/ | He has worked here since its inception. | Il travaille ici depuis sa création.
nexus | lien, nœud | n | C2 | /ˈneksəs/ | The city is a nexus of trade. | La ville est un carrefour commercial.
flare | fusée éclairante ; éclat | n | C1 | /fleə/ | The sailors fired a flare. | Les marins ont lancé une fusée de détresse.
lever | levier | n | C1 | /ˈliːvə/ | Pull the lever down. | Abaisse le levier.
pillar | pilier | n | C1 | /ˈpɪlə/ | Prayer is one of the five pillars of Islam. | La prière est l'un des cinq piliers de l'islam.
affiliation | affiliation, appartenance | n | C2 | /əˌfɪliˈeɪʃn/ | He has no political affiliation. | Il n'a aucune appartenance politique.
enhancement | amélioration | n | C2 | /ɪnˈhɑːnsmənt/ | The software enhancement made it faster. | L'amélioration du logiciel l'a rendu plus rapide.
gag | blague ; bâillon | n | C1 | /ɡæɡ/ | The film is full of funny gags. | Le film est plein de gags drôles.
warp | déformation ; distorsion | n | C2 | /wɔːp/ | The wood began to warp in the heat. | Le bois a commencé à se déformer sous la chaleur.
mantle | manteau ; rôle | n | C2 | /ˈmæntl/ | She took on the mantle of leadership. | Elle a endossé le rôle de dirigeante.
shutdown | fermeture, arrêt | n | C1 | /ˈʃʌtdaʊn/ | The factory shutdown cost many jobs. | La fermeture de l'usine a coûté de nombreux emplois.
tally | décompte, total | n | C2 | /ˈtæli/ | Keep a tally of the points. | Tiens le décompte des points.
wedge | cale ; coin | n | C1 | /wedʒ/ | Put a wedge under the door. | Mets une cale sous la porte.
affinity | affinité | n | C2 | /əˈfɪnəti/ | She has a natural affinity with animals. | Elle a une affinité naturelle avec les animaux.
enclosure | enclos, enceinte | n | C1 | /ɪnˈkləʊʒə/ | The horses are in an enclosure. | Les chevaux sont dans un enclos.
homage | hommage | n | C2 | /ˈhɒmɪdʒ/ | The film pays homage to his father. | Le film rend hommage à son père.
benchmark | référence, point de repère | n | C2 | /ˈbentʃmɑːk/ | This school is a benchmark for others. | Cette école sert de référence aux autres.
brutality | brutalité | n | C1 | /bruːˈtæləti/ | They protested against police brutality. | Ils ont manifesté contre les violences policières.
accumulation | accumulation | n | C1 | /əˌkjuːmjəˈleɪʃn/ | The accumulation of wealth is not the goal of life. | L'accumulation des richesses n'est pas le but de la vie.
compatibility | compatibilité | n | C1 | /kəmˌpætəˈbɪləti/ | Check the compatibility of the software. | Vérifie la compatibilité du logiciel.
overhaul | révision, refonte | n | C1 | /ˈəʊvəhɔːl/ | The system needs a complete overhaul. | Le système a besoin d'une refonte complète.
readiness | disponibilité, empressement | n | C1 | /ˈredinəs/ | He showed his readiness to help. | Il s'est montré prêt à aider.
superiority | supériorité | n | C1 | /suːˌpɪəriˈɒrəti/ | He has a feeling of superiority. | Il a un sentiment de supériorité.
backdrop | toile de fond | n | C1 | /ˈbækdrɒp/ | The mountains formed a beautiful backdrop. | Les montagnes formaient une magnifique toile de fond.
constituent | composant ; électeur | n | C2 | /kənˈstɪtjuənt/ | Water is a constituent of all living cells. | L'eau entre dans la composition de toutes les cellules vivantes.
emblem | emblème | n | C1 | /ˈembləm/ | The eagle is the emblem of the city. | L'aigle est l'emblème de la ville.
kernel | grain, noyau | n | C2 | /ˈkɜːnl/ | There's a kernel of truth in what he says. | Il y a un fond de vérité dans ce qu'il dit.
brightness | luminosité, éclat | n | B2 | /ˈbraɪtnəs/ | Turn down the brightness of the screen. | Baisse la luminosité de l'écran.
flux | flux, changement constant | n | C2 | /flʌks/ | The market is in a state of flux. | Le marché est en pleine mutation.
hassle | tracas, embêtement | n | B2 | /ˈhæsl/ | Moving house is such a hassle. | Déménager, c'est une vraie galère.
secrecy | secret, discrétion | n | C1 | /ˈsiːkrəsi/ | The talks were held in secrecy. | Les négociations se sont tenues dans le secret.
booster | rappel (vaccin) ; stimulant | n | C1 | /ˈbuːstə/ | You need a booster in five years. | Tu auras besoin d'un rappel dans cinq ans.
flop | échec, fiasco | n | C1 | /flɒp/ | The film was a flop. | Le film a été un échec.
glitter | paillettes ; scintillement | n | B2 | /ˈɡlɪtə/ | The card was covered in glitter. | La carte était couverte de paillettes.
reversal | renversement, revirement | n | C1 | /rɪˈvɜːsl/ | It was a complete reversal of policy. | Ce fut un revirement politique complet.
seriousness | sérieux, gravité | n | B2 | /ˈsɪəriəsnəs/ | He didn't understand the seriousness of the situation. | Il n'a pas compris la gravité de la situation.
spree | virée, frénésie | n | C1 | /spriː/ | She went on a shopping spree. | Elle a fait une virée shopping.
urgency | urgence | n | C1 | /ˈɜːdʒənsi/ | There's a sense of urgency. | Il y a un sentiment d'urgence.
avoidance | évitement | n | C2 | /əˈvɔɪdəns/ | Tax avoidance is not always illegal. | L'optimisation fiscale n'est pas toujours illégale.
clarification | clarification, éclaircissement | n | C1 | /ˌklærəfɪˈkeɪʃn/ | I need some clarification. | J'ai besoin de quelques éclaircissements.
downside | inconvénient | n | C1 | /ˈdaʊnsaɪd/ | The downside is the price. | L'inconvénient, c'est le prix.
misuse | mauvais usage, abus | n | C1 | /ˌmɪsˈjuːs/ | The misuse of antibiotics is dangerous. | Le mauvais usage des antibiotiques est dangereux.
whereabouts | lieu où se trouve quelqu'un | n | C1 | /ˈweərəbaʊts/ | His whereabouts are unknown. | On ignore où il se trouve.
stealth | discrétion, furtivité | n | C2 | /stelθ/ | The cat moved with great stealth. | Le chat se déplaçait avec une grande discrétion.
vanguard | avant-garde | n | C2 | /ˈvænɡɑːd/ | The company is in the vanguard of research. | L'entreprise est à l'avant-garde de la recherche.
aura | aura, atmosphère | n | C2 | /ˈɔːrə/ | There's an aura of peace in the mosque. | Il règne une atmosphère de paix dans la mosquée.
condemnation | condamnation | n | C2 | /ˌkɒndemˈneɪʃn/ | The attack drew international condemnation. | L'attaque a suscité une condamnation internationale.
dependency | dépendance | n | C2 | /dɪˈpendənsi/ | Drug dependency is a disease. | La toxicomanie est une maladie.
dysfunction | dysfonctionnement | n | C2 | /dɪsˈfʌŋkʃn/ | The report revealed serious dysfunction. | Le rapport a révélé de graves dysfonctionnements.
enrichment | enrichissement | n | C2 | /ɪnˈrɪtʃmənt/ | Reading is a source of enrichment. | La lecture est une source d'enrichissement.
forefront | premier plan | n | C1 | /ˈfɔːfrʌnt/ | She is at the forefront of research. | Elle est au premier plan de la recherche.
initiation | initiation | n | C1 | /ɪˌnɪʃiˈeɪʃn/ | It was his initiation into the team. | Ce fut son intégration dans l'équipe.
foe | ennemi, adversaire | n | C2 | /fəʊ/ | He's a friend, not a foe. | C'est un ami, pas un ennemi.
havoc | ravages, chaos | n | C1 | /ˈhævək/ | The storm caused havoc. | La tempête a semé le chaos.
overload | surcharge | n | C1 | /ˈəʊvələʊd/ | There's an information overload. | Il y a une surcharge d'informations.
regression | régression | n | C2 | /rɪˈɡreʃn/ | This law is a regression. | Cette loi est une régression.
breakout | évasion ; percée | n | C2 | /ˈbreɪkaʊt/ | It was her breakout role. | Ce fut le rôle qui l'a révélée.
differentiation | différenciation | n | C2 | /ˌdɪfərenʃiˈeɪʃn/ | Product differentiation matters in business. | La différenciation des produits compte en affaires.
hiatus | interruption, pause | n | C2 | /haɪˈeɪtəs/ | The band returned after a long hiatus. | Le groupe est revenu après une longue pause.
banter | plaisanteries, échanges taquins | n | C1 | /ˈbæntə/ | There's friendly banter between colleagues. | Les collègues échangent des plaisanteries amicales.
blueprint | plan, schéma directeur | n | C1 | /ˈbluːprɪnt/ | This is a blueprint for a fairer society. | C'est le plan d'une société plus juste.
commencement | commencement ; remise des diplômes | n | C2 | /kəˈmensmənt/ | The commencement of the war shocked everyone. | Le début de la guerre a choqué tout le monde.
expiration | expiration | n | C1 | /ˌekspəˈreɪʃn/ | Check the expiration date. | Vérifie la date d'expiration.
gradient | pente, inclinaison | n | C2 | /ˈɡreɪdiənt/ | The road has a steep gradient. | La route a une forte pente.
sweetness | douceur | n | B2 | /ˈswiːtnəs/ | The sweetness of dates is natural. | La douceur des dattes est naturelle.
anomaly | anomalie | n | C1 | /əˈnɒməli/ | The test showed an anomaly. | Le test a révélé une anomalie.
concord | concorde, harmonie | n | C2 | /ˈkɒŋkɔːd/ | They lived in concord. | Ils vivaient en bonne entente.
gloss | brillant, lustre | n | C1 | /ɡlɒs/ | The paint has a high gloss. | La peinture est très brillante.
guise | apparence, prétexte | n | C2 | /ɡaɪz/ | He came in the guise of a friend. | Il est venu sous l'apparence d'un ami.
ordeal | épreuve, calvaire | n | C1 | /ɔːˈdiːl/ | The trial was a terrible ordeal. | Le procès a été une terrible épreuve.
slit | fente | n | C1 | /slɪt/ | Light came through a slit in the curtain. | La lumière passait par une fente du rideau.
alias | pseudonyme, alias | n | C1 | /ˈeɪliəs/ | He worked under an alias. | Il travaillait sous un nom d'emprunt.
cleanup | nettoyage | n | B2 | /ˈkliːnʌp/ | Volunteers joined the beach cleanup. | Des bénévoles ont participé au nettoyage de la plage.
convergence | convergence | n | C2 | /kənˈvɜːdʒəns/ | There's a convergence of opinions. | Les opinions convergent.
imbalance | déséquilibre | n | C1 | /ɪmˈbæləns/ | There's an imbalance between rich and poor. | Il existe un déséquilibre entre riches et pauvres.
mitigation | atténuation | n | C2 | /ˌmɪtɪˈɡeɪʃn/ | Flood mitigation is expensive. | La prévention des inondations coûte cher.
plight | situation critique, sort | n | C2 | /plaɪt/ | We must not forget the plight of refugees. | Nous ne devons pas oublier le sort des réfugiés.
beep | bip | n | B2 | /biːp/ | Leave a message after the beep. | Laissez un message après le bip.
boon | bienfait, aubaine | n | C2 | /buːn/ | The new road is a boon for the village. | La nouvelle route est une aubaine pour le village.
durability | durabilité, solidité | n | C1 | /ˌdjʊərəˈbɪləti/ | We tested the durability of the shoes. | Nous avons testé la solidité des chaussures.
keystone | clé de voûte | n | C2 | /ˈkiːstəʊn/ | Trust is the keystone of marriage. | La confiance est la clé de voûte du mariage.
mayhem | grabuge, pagaille | n | C1 | /ˈmeɪhem/ | There was mayhem at the station. | C'était la pagaille à la gare.
recap | récapitulatif | n | B2 | /ˈriːkæp/ | Here's a quick recap of the main points. | Voici un rapide récapitulatif des points principaux.
sham | imposture, simulacre | n | C2 | /ʃæm/ | The election was a sham. | L'élection était un simulacre.
stature | stature, envergure | n | C2 | /ˈstætʃə/ | He's a man of great stature. | C'est un homme d'une grande envergure.
variance | écart, variation | n | C2 | /ˈveəriəns/ | There's a variance in the results. | Il y a un écart dans les résultats.
feasibility | faisabilité | n | C2 | /ˌfiːzəˈbɪləti/ | We did a feasibility study. | Nous avons réalisé une étude de faisabilité.
insistence | insistance | n | C1 | /ɪnˈsɪstəns/ | At her insistence, I saw a doctor. | Sur son insistance, j'ai vu un médecin.
precursor | précurseur, signe avant-coureur | n | C2 | /priˈkɜːsə/ | Pain can be a precursor of illness. | La douleur peut être le signe avant-coureur d'une maladie.
viability | viabilité | n | C2 | /ˌvaɪəˈbɪləti/ | We doubt the viability of the plan. | Nous doutons de la viabilité du projet.
bearer | porteur | n | C1 | /ˈbeərə/ | I'm sorry to be the bearer of bad news. | Je suis désolé d'être porteur de mauvaises nouvelles.
deterioration | détérioration, dégradation | n | C2 | /dɪˌtɪəriəˈreɪʃn/ | There has been a deterioration in his health. | Son état de santé s'est dégradé.
manifestation | manifestation, signe | n | C2 | /ˌmænɪfeˈsteɪʃn/ | Creation is a manifestation of God's power. | La création est une manifestation de la puissance de Dieu.
repository | dépôt, réservoir | n | C2 | /rɪˈpɒzətri/ | The library is a repository of knowledge. | La bibliothèque est un réservoir de savoir.
continuum | continuum | n | C2 | /kənˈtɪnjuəm/ | Health and illness are on a continuum. | La santé et la maladie se situent sur un continuum.
ledge | rebord, saillie | n | C1 | /ledʒ/ | A bird sat on the window ledge. | Un oiseau était posé sur le rebord de la fenêtre.
parity | parité | n | C2 | /ˈpærəti/ | Women demand pay parity. | Les femmes réclament la parité salariale.
ripple | ondulation, ride | n | C1 | /ˈrɪpl/ | The stone made ripples in the water. | La pierre a fait des ronds dans l'eau.
seeker | chercheur (de) | n | C1 | /ˈsiːkə/ | He's a seeker of truth. | C'est un chercheur de vérité.
substitution | substitution, remplacement | n | C1 | /ˌsʌbstɪˈtjuːʃn/ | The coach made a substitution. | L'entraîneur a fait un remplacement.
abandonment | abandon | n | C2 | /əˈbændənmənt/ | The abandonment of the project was a shame. | L'abandon du projet a été dommage.
cohort | cohorte, groupe | n | C2 | /ˈkəʊhɔːt/ | This year's cohort of students is large. | La promotion d'étudiants de cette année est nombreuse.
deviation | écart, déviation | n | C2 | /ˌdiːviˈeɪʃn/ | Any deviation from the rules is punished. | Tout écart par rapport aux règles est sanctionné.
diffusion | diffusion | n | C2 | /dɪˈfjuːʒn/ | The diffusion of ideas is faster today. | La diffusion des idées est plus rapide aujourd'hui.
familiarity | familiarité ; connaissance | n | C1 | /fəˌmɪliˈærəti/ | His familiarity with the city helped us. | Sa connaissance de la ville nous a aidés.
incorporation | incorporation, intégration | n | C2 | /ɪnˌkɔːpəˈreɪʃn/ | The incorporation of new ideas took time. | L'intégration de nouvelles idées a pris du temps.
peril | péril | n | C2 | /ˈperəl/ | The ship was in great peril. | Le navire était en grand péril.
rebirth | renaissance | n | C1 | /ˌriːˈbɜːθ/ | Spring is a time of rebirth. | Le printemps est un temps de renaissance.
strife | conflit, dissension | n | C2 | /straɪf/ | The country was torn by strife. | Le pays était déchiré par les conflits.
turnaround | redressement, revirement | n | C2 | /ˈtɜːnəraʊnd/ | The company made a remarkable turnaround. | L'entreprise a opéré un redressement remarquable.
barrage | barrage ; déluge (de questions) | n | C2 | /ˈbærɑːʒ/ | He faced a barrage of questions. | Il a fait face à un déluge de questions.
brilliance | éclat ; génie | n | C1 | /ˈbrɪliəns/ | We admired the brilliance of his mind. | Nous admirions l'éclat de son esprit.
iteration | itération, version | n | C2 | /ˌɪtəˈreɪʃn/ | This is the third iteration of the design. | C'est la troisième version du modèle.
overflow | débordement, trop-plein | n | C1 | /ˈəʊvəfləʊ/ | The overflow car park is open. | Le parking de délestage est ouvert.
snapshot | instantané, aperçu | n | C1 | /ˈsnæpʃɒt/ | The survey gives a snapshot of public opinion. | Le sondage donne un aperçu de l'opinion publique.
chatter | bavardage | n | C1 | /ˈtʃætə/ | I could hear the chatter of children. | J'entendais le bavardage des enfants.
imprint | empreinte ; marque | n | C2 | /ˈɪmprɪnt/ | The war left its imprint on the town. | La guerre a laissé son empreinte sur la ville.
slime | bave ; substance gluante | n | C1 | /slaɪm/ | Snails leave a trail of slime. | Les escargots laissent une traînée de bave.
variability | variabilité | n | C2 | /ˌveəriəˈbɪləti/ | There's great variability in the weather. | Le temps est très variable.
hallmark | caractéristique, marque | n | C1 | /ˈhɔːlmɑːk/ | Kindness is the hallmark of a believer. | La bonté est la marque du croyant.
inclination | penchant, inclination | n | C2 | /ˌɪŋklɪˈneɪʃn/ | He has no inclination to work. | Il n'a aucune envie de travailler.
attribution | attribution | n | C2 | /ˌætrɪˈbjuːʃn/ | The attribution of the painting is uncertain. | L'attribution du tableau est incertaine.
insertion | insertion | n | C2 | /ɪnˈsɜːʃn/ | The insertion of a new paragraph is needed. | Il faut insérer un nouveau paragraphe.
occupancy | occupation (des lieux) | n | C2 | /ˈɒkjəpənsi/ | Hotel occupancy is high in summer. | Le taux d'occupation des hôtels est élevé en été.
exterior | extérieur | n | C1 | /ɪkˈstɪəriə/ | The exterior of the house needs painting. | L'extérieur de la maison a besoin d'être repeint.
oddity | curiosité, bizarrerie | n | C1 | /ˈɒdəti/ | The house is a bit of an oddity. | La maison est un peu insolite.
naturalness | naturel, spontanéité | n | C1 | /ˈnætʃrəlnəs/ | We admired the naturalness of her acting. | Nous avons admiré le naturel de son jeu.
respite | répit | n | C1 | /ˈrespaɪt/ | The rain gave us a short respite from the heat. | La pluie nous a offert un court répit face à la chaleur.
endorsement | approbation, soutien | n | C1 | /ɪnˈdɔːsmənt/ | The plan received the endorsement of the council. | Le projet a reçu l'approbation du conseil.
continuity | continuité | n | C1 | /ˌkɒntɪˈnjuːəti/ | Children need continuity in their lives. | Les enfants ont besoin de continuité dans leur vie.
shambles | pagaille, fiasco | n | C1 | /ˈʃæmblz/ | The meeting was a complete shambles. | La réunion a été un véritable fiasco.
carrier | transporteur ; porteur | n | C1 | /ˈkæriə/ | The airline is a low-cost carrier. | La compagnie aérienne est un transporteur à bas prix.
elaboration | élaboration ; développement | n | C1 | /ɪˌlæbəˈreɪʃn/ | The idea needs further elaboration. | L'idée mérite d'être développée.
upheaval | bouleversement | n | C1 | /ʌpˈhiːvl/ | The war caused great social upheaval. | La guerre a provoqué de grands bouleversements sociaux.
simplicity | simplicité | n | C1 | /sɪmˈplɪsəti/ | The Prophet lived in great simplicity. | Le Prophète vivait dans une grande simplicité.
alignment | alignement | n | C1 | /əˈlaɪnmənt/ | The wheels need alignment. | Il faut régler le parallélisme des roues.
manipulation | manipulation | n | C1 | /məˌnɪpjuˈleɪʃn/ | Beware of media manipulation. | Méfie-toi de la manipulation médiatique.
confinement | confinement, détention | n | C1 | /kənˈfaɪnmənt/ | He spent a year in solitary confinement. | Il a passé un an à l'isolement.
minutiae | menus détails | n | C2 | /maɪˈnjuːʃiaɪ/ | He gets lost in the minutiae. | Il se perd dans les menus détails.
closeness | proximité, intimité | n | C1 | /ˈkləʊsnəs/ | There is a real closeness between the sisters. | Il existe une vraie complicité entre les sœurs.
rarity | rareté | n | C1 | /ˈreərəti/ | Snow is a rarity here. | La neige est rare ici.
rumble | grondement | n | C1 | /ˈrʌmbl/ | We heard the rumble of thunder. | Nous avons entendu le grondement du tonnerre.
ploy | stratagème | n | C1 | /plɔɪ/ | It was a clever marketing ploy. | C'était un habile stratagème commercial.
adversary | adversaire | n | C1 | /ˈædvəsəri/ | He respected his adversary. | Il respectait son adversaire.
lapse | défaillance, écart | n | C1 | /læps/ | It was a lapse of concentration. | Ce fut un moment d'inattention.
descent | descente ; ascendance | n | C1 | /dɪˈsent/ | The plane began its descent. | L'avion a amorcé sa descente.
divergence | divergence | n | C1 | /daɪˈvɜːdʒəns/ | There's a divergence of opinion. | Il y a une divergence d'opinion.
scrutiny | examen minutieux | n | C1 | /ˈskruːtəni/ | His claims don't stand up to scrutiny. | Ses affirmations ne résistent pas à un examen attentif.
plausibility | plausibilité | n | C1 | /ˌplɔːzəˈbɪləti/ | I doubt the plausibility of his story. | Je doute de la vraisemblance de son histoire.
flattery | flatterie | n | C1 | /ˈflætəri/ | Flattery won't get you anywhere. | La flatterie ne te mènera nulle part.
vitality | vitalité | n | C1 | /vaɪˈtæləti/ | Exercise gives you vitality. | L'exercice donne de la vitalité.
succession | succession, suite | n | C1 | /səkˈseʃn/ | He won three games in succession. | Il a gagné trois parties d'affilée.
formality | formalité | n | C1 | /fɔːˈmæləti/ | The interview is just a formality. | L'entretien n'est qu'une formalité.
quest | quête | n | C1 | /kwest/ | His quest for knowledge took him to Cairo. | Sa quête du savoir l'a mené au Caire.
rudiments | rudiments, bases | n | C1 | /ˈruːdɪmənts/ | I learned the rudiments of Arabic. | J'ai appris les rudiments de l'arabe.
pinnacle | sommet, apogée | n | C1 | /ˈpɪnəkl/ | She reached the pinnacle of her career. | Elle a atteint le sommet de sa carrière.
reassurance | réconfort, assurance | n | C1 | /ˌriːəˈʃʊərəns/ | Children need reassurance. | Les enfants ont besoin d'être rassurés.
drawback | inconvénient | n | C1 | /ˈdrɔːbæk/ | The main drawback is the cost. | Le principal inconvénient, c'est le coût.
estimation | estimation, jugement | n | C1 | /ˌestɪˈmeɪʃn/ | In my estimation, he is the best. | À mon avis, c'est le meilleur.
rapport | bonne entente, rapport | n | C1 | /ræˈpɔː/ | She has a good rapport with her students. | Elle s'entend bien avec ses élèves.
retention | rétention, conservation | n | C1 | /rɪˈtenʃn/ | Staff retention is a problem. | Fidéliser le personnel est un problème.
specification | spécification, cahier des charges | n | C1 | /ˌspesɪfɪˈkeɪʃn/ | The house was built to a high specification. | La maison a été construite selon des normes élevées.
possessor | possesseur | n | C1 | /pəˈzesə/ | He is the proud possessor of a new car. | Il est l'heureux propriétaire d'une nouvelle voiture.
stuffiness | manque d'air ; guindé | n | C1 | /ˈstʌfinəs/ | Open the window to get rid of the stuffiness. | Ouvre la fenêtre pour aérer.
toughness | dureté, endurance | n | C1 | /ˈtʌfnəs/ | The job needs mental toughness. | Le travail demande une grande force mentale.
commendation | éloge, distinction | n | C1 | /ˌkɒmenˈdeɪʃn/ | He received a commendation for bravery. | Il a reçu une distinction pour bravoure.
flicker | vacillement, lueur | n | C1 | /ˈflɪkə/ | A flicker of hope remained. | Une lueur d'espoir subsistait.
facilitation | facilitation | n | C1 | /fəˌsɪlɪˈteɪʃn/ | The facilitation of trade benefits everyone. | La facilitation des échanges profite à tous.
refurbishment | rénovation | n | C1 | /ˌriːˈfɜːbɪʃmənt/ | The museum is closed for refurbishment. | Le musée est fermé pour rénovation.
grounds | parc, terrain ; motifs | n | C1 | /ɡraʊndz/ | We walked in the hospital grounds. | Nous nous sommes promenés dans le parc de l'hôpital.
domination | domination | n | C1 | /ˌdɒmɪˈneɪʃn/ | They resisted foreign domination. | Ils ont résisté à la domination étrangère.
prop | accessoire ; étai | n | C1 | /prɒp/ | The actors brought their own props. | Les acteurs ont apporté leurs propres accessoires.
antics | pitreries, singeries | n | C1 | /ˈæntɪks/ | We laughed at the clown's antics. | Nous avons ri des pitreries du clown.
impediment | obstacle, empêchement | n | C1 | /ɪmˈpedɪmənt/ | He has a speech impediment. | Il a un trouble de la parole.
outset | début, commencement | n | C1 | /ˈaʊtset/ | I told you at the outset. | Je te l'ai dit dès le début.
detriment | détriment | n | C1 | /ˈdetrɪmənt/ | He worked long hours to the detriment of his health. | Il travaillait de longues heures au détriment de sa santé.
precision | précision | n | C1 | /prɪˈsɪʒn/ | The work requires great precision. | Le travail exige une grande précision.
fragmentation | fragmentation, morcellement | n | C2 | /ˌfræɡmenˈteɪʃn/ | The fragmentation of the party weakened it. | Le morcellement du parti l'a affaibli.
likelihood | probabilité | n | C1 | /ˈlaɪklihʊd/ | There's little likelihood of rain. | Il y a peu de chances qu'il pleuve.
buffer | tampon | n | C1 | /ˈbʌfə/ | Savings act as a buffer against bad times. | L'épargne sert de tampon en cas de coup dur.
demise | disparition, fin | n | C1 | /dɪˈmaɪz/ | The demise of the empire was slow. | La chute de l'empire a été lente.
renown | renommée | n | C1 | /rɪˈnaʊn/ | He is a scholar of great renown. | C'est un savant de grande renommée.
credibility | crédibilité | n | C1 | /ˌkredəˈbɪləti/ | The scandal damaged his credibility. | Le scandale a nui à sa crédibilité.
uniformity | uniformité | n | C1 | /ˌjuːnɪˈfɔːməti/ | The uniformity of the houses is boring. | L'uniformité des maisons est ennuyeuse.
manoeuvre | manœuvre | n | C1 | /məˈnuːvə/ | It was a clever political manoeuvre. | C'était une habile manœuvre politique.
niche | niche, créneau | n | C1 | /niːʃ/ | She found her niche in teaching. | Elle a trouvé sa voie dans l'enseignement.
physicality | présence physique | n | C2 | /ˌfɪzɪˈkæləti/ | The dancer's physicality is impressive. | La présence physique du danseur est impressionnante.
monotony | monotonie | n | C1 | /məˈnɒtəni/ | He hates the monotony of his job. | Il déteste la monotonie de son travail.
cessation | cessation, arrêt | n | C2 | /seˈseɪʃn/ | They called for a cessation of hostilities. | Ils ont appelé à la cessation des hostilités.
mien | mine, air | n | C2 | /miːn/ | He had a serious mien. | Il avait l'air grave.
facsimile | fac-similé | n | C2 | /fækˈsɪməli/ | The museum shows a facsimile of the manuscript. | Le musée expose un fac-similé du manuscrit.
encumbrance | entrave, fardeau | n | C2 | /ɪnˈkʌmbrəns/ | Debt is an encumbrance. | La dette est un fardeau.
predilection | prédilection | n | C2 | /ˌpriːdɪˈlekʃn/ | He has a predilection for sweet food. | Il a un faible pour les sucreries.
vindication | justification, réhabilitation | n | C2 | /ˌvɪndɪˈkeɪʃn/ | The verdict was a vindication of his innocence. | Le verdict a confirmé son innocence.
ferocity | férocité | n | C2 | /fəˈrɒsəti/ | The ferocity of the storm surprised everyone. | La violence de la tempête a surpris tout le monde.
denunciation | dénonciation | n | C2 | /dɪˌnʌnsiˈeɪʃn/ | His speech was a denunciation of injustice. | Son discours était une dénonciation de l'injustice.
requisition | réquisition | n | C2 | /ˌrekwɪˈzɪʃn/ | The army made a requisition of all trucks. | L'armée a réquisitionné tous les camions.
imposition | imposition ; abus | n | C2 | /ˌɪmpəˈzɪʃn/ | Is it an imposition to ask you? | Est-ce abuser de te le demander ?
utilisation | utilisation | n | C2 | /ˌjuːtəlaɪˈzeɪʃn/ | Better utilisation of resources is needed. | Il faut une meilleure utilisation des ressources.
provocation | provocation | n | C2 | /ˌprɒvəˈkeɪʃn/ | He reacted calmly despite the provocation. | Il a réagi calmement malgré la provocation.
repute | réputation | n | C2 | /rɪˈpjuːt/ | He is a doctor of good repute. | C'est un médecin de bonne réputation.
sheaf | liasse ; gerbe | n | C2 | /ʃiːf/ | He held a sheaf of papers. | Il tenait une liasse de papiers.
repose | repos | n | C2 | /rɪˈpəʊz/ | Her face was calm in repose. | Son visage était calme au repos.
proliferation | prolifération | n | C2 | /prəˌlɪfəˈreɪʃn/ | They fear the proliferation of nuclear weapons. | Ils craignent la prolifération des armes nucléaires.
blandishment | cajolerie, flatterie | n | C2 | /ˈblændɪʃmənt/ | She resisted all his blandishments. | Elle a résisté à toutes ses cajoleries.
malleability | malléabilité | n | C2 | /ˌmæliəˈbɪləti/ | The malleability of clay makes it easy to shape. | La malléabilité de l'argile la rend facile à façonner.
grievance | grief, doléance | n | C2 | /ˈɡriːvns/ | The workers have many grievances. | Les ouvriers ont de nombreuses doléances.
residue | résidu | n | C2 | /ˈrezɪdjuː/ | Wash off any soap residue. | Rince tout résidu de savon.
dispersal | dispersion | n | C2 | /dɪˈspɜːsl/ | Wind helps the dispersal of seeds. | Le vent favorise la dispersion des graines.
pervasiveness | omniprésence | n | C2 | /pəˈveɪsɪvnəs/ | The pervasiveness of advertising is worrying. | L'omniprésence de la publicité est inquiétante.
notoriety | notoriété (souvent négative) | n | C2 | /ˌnəʊtəˈraɪəti/ | He gained notoriety for his crimes. | Il s'est fait connaître pour ses crimes.
posturing | gesticulation, pose | n | C2 | /ˈpɒstʃərɪŋ/ | It was just political posturing. | Ce n'était que de la gesticulation politique.
treachery | traîtrise, trahison | n | C2 | /ˈtretʃəri/ | He was betrayed by treachery. | Il a été victime d'une trahison.
rift | fossé, rupture | n | C2 | /rɪft/ | There's a rift between the two brothers. | Il y a une brouille entre les deux frères.
eminence | éminence, distinction | n | C2 | /ˈemɪnəns/ | He is a scholar of great eminence. | C'est un savant d'une grande renommée.
minefield | champ de mines ; terrain miné | n | C2 | /ˈmaɪnfiːld/ | The subject is a political minefield. | Le sujet est un vrai terrain miné politiquement.
crystallisation | cristallisation | n | C2 | /ˌkrɪstəlaɪˈzeɪʃn/ | The crystallisation of salt takes time. | La cristallisation du sel prend du temps.
slab | dalle, plaque | n | C2 | /slæb/ | The grave was covered with a stone slab. | La tombe était recouverte d'une dalle de pierre.
tactic | tactique | n | C1 | /ˈtæktɪk/ | It's a clever tactic. | C'est une tactique habile.
gambit | stratagème, entrée en matière | n | C2 | /ˈɡæmbɪt/ | His opening gambit was a joke. | Il a commencé par une blague.
bauble | babiole, colifichet | n | C2 | /ˈbɔːbl/ | The world is a bauble compared with the Hereafter. | Ce monde n'est qu'une babiole comparé à l'au-delà.
contraption | engin, bidule | n | C2 | /kənˈtræpʃn/ | He built a strange contraption. | Il a construit un drôle d'engin.
fluctuation | fluctuation | n | C2 | /ˌflʌktʃuˈeɪʃn/ | There are fluctuations in the price of oil. | Le prix du pétrole fluctue.
inducement | incitation, encouragement | n | C2 | /ɪnˈdjuːsmənt/ | They offered money as an inducement. | Ils ont proposé de l'argent comme incitation.
conduit | conduit, canal | n | C2 | /ˈkɒndjuɪt/ | The prophets were conduits of revelation. | Les prophètes étaient les canaux de la révélation.
drabness | grisaille, monotonie | n | C2 | /ˈdræbnəs/ | The drabness of the city depressed him. | La grisaille de la ville le déprimait.
merit | mérite | n | C1 | /ˈmerɪt/ | The idea has some merit. | L'idée a du mérite.
anonymity | anonymat | n | C2 | /ˌænəˈnɪməti/ | The donor asked for anonymity. | Le donateur a demandé à garder l'anonymat.
dissemination | diffusion | n | C2 | /dɪˌsemɪˈneɪʃn/ | The dissemination of knowledge is a duty. | La diffusion du savoir est un devoir.
menace | menace | n | C2 | /ˈmenəs/ | Drugs are a menace to society. | La drogue est une menace pour la société.
calamity | calamité | n | C2 | /kəˈlæməti/ | The flood was a calamity for the region. | L'inondation a été une calamité pour la région.
mediocrity | médiocrité | n | C2 | /ˌmiːdiˈɒkrəti/ | Don't settle for mediocrity. | Ne te contente pas de la médiocrité.
opacity | opacité | n | C2 | /əʊˈpæsəti/ | The opacity of the system worries citizens. | L'opacité du système inquiète les citoyens.
remit | attributions, mission | n | C2 | /ˈriːmɪt/ | That's outside my remit. | Cela ne fait pas partie de mes attributions.
recourse | recours | n | C2 | /rɪˈkɔːs/ | We have no recourse but to wait. | Nous n'avons d'autre recours que d'attendre.
pedestal | piédestal | n | C2 | /ˈpedɪstl/ | Don't put people on a pedestal. | Ne mets pas les gens sur un piédestal.
ephemera | objets éphémères | n | C2 | /ɪˈfemərə/ | He collects old tickets and other ephemera. | Il collectionne de vieux billets et autres objets éphémères.
emulation | émulation, imitation | n | C2 | /ˌemjuˈleɪʃn/ | His life is worthy of emulation. | Sa vie est digne d'être imitée.
brouhaha | tapage, brouhaha | n | C2 | /ˈbruːhɑːhɑː/ | There was a brouhaha over the decision. | La décision a fait grand bruit.
attrition | usure, attrition | n | C2 | /əˈtrɪʃn/ | It was a war of attrition. | Ce fut une guerre d'usure.
opulence | opulence | n | C2 | /ˈɒpjələns/ | The opulence of the palace was astonishing. | L'opulence du palais était stupéfiante.
edification | édification | n | C2 | /ˌedɪfɪˈkeɪʃn/ | The lecture was for our edification. | La conférence était destinée à notre édification.
plume | panache (de fumée) ; plume | n | C2 | /pluːm/ | A plume of smoke rose from the chimney. | Un panache de fumée s'élevait de la cheminée.
happenstance | hasard | n | C2 | /ˈhæpənstæns/ | We met by happenstance. | Nous nous sommes rencontrés par hasard.
conciliation | conciliation | n | C2 | /kənˌsɪliˈeɪʃn/ | They chose conciliation over conflict. | Ils ont choisi la conciliation plutôt que le conflit.
preconception | idée préconçue | n | C2 | /ˌpriːkənˈsepʃn/ | Forget your preconceptions about Islam. | Oublie tes idées préconçues sur l'islam.
authenticity | authenticité | n | C2 | /ˌɔːθenˈtɪsəti/ | Scholars checked the authenticity of the hadith. | Les savants ont vérifié l'authenticité du hadith.
fabrication | invention, mensonge ; fabrication | n | C2 | /ˌfæbrɪˈkeɪʃn/ | His story was a complete fabrication. | Son histoire était une pure invention.
aberration | aberration | n | C2 | /ˌæbəˈreɪʃn/ | The poor result was an aberration. | Le mauvais résultat était une aberration.
standing | rang, réputation | n | C2 | /ˈstændɪŋ/ | He is a man of high standing. | C'est un homme de haut rang.
banishment | bannissement | n | C2 | /ˈbænɪʃmənt/ | The poet lived in banishment. | Le poète vivait en exil.
knack | don, talent | n | C2 | /næk/ | She has a knack for making people laugh. | Elle a le don de faire rire les gens.
fruition | réalisation, concrétisation | n | C2 | /fruˈɪʃn/ | His plans came to fruition. | Ses projets se sont concrétisés.
maelstrom | tourbillon | n | C2 | /ˈmeɪlstrɒm/ | He was caught in a maelstrom of events. | Il a été pris dans un tourbillon d'événements.
indiscretion | indiscrétion | n | C2 | /ˌɪndɪˈskreʃn/ | It was a youthful indiscretion. | C'était une erreur de jeunesse.
mystique | mystique, aura | n | C2 | /mɪˈstiːk/ | The desert has a certain mystique. | Le désert a une certaine aura.
artifice | artifice, ruse | n | C2 | /ˈɑːtɪfɪs/ | She spoke without artifice. | Elle parlait sans artifice.
smattering | quelques notions | n | C2 | /ˈsmætərɪŋ/ | He has a smattering of Arabic. | Il a quelques notions d'arabe.
neophyte | néophyte, novice | n | C2 | /ˈniːəfaɪt/ | The book is perfect for neophytes. | Le livre est parfait pour les néophytes.
rumination | rumination, méditation | n | C2 | /ˌruːmɪˈneɪʃn/ | Long rumination led him to faith. | Une longue méditation l'a conduit à la foi.
trifle | bagatelle ; diplomate (dessert) | n | C2 | /ˈtraɪfl/ | Don't worry about such trifles. | Ne t'inquiète pas pour de telles bagatelles.
embodiment | incarnation | n | C2 | /ɪmˈbɒdimənt/ | She is the embodiment of patience. | Elle est la patience incarnée.
legion | légion, multitude | n | C2 | /ˈliːdʒən/ | His fans are legion. | Ses fans sont légion.
hindrance | entrave, obstacle | n | C2 | /ˈhɪndrəns/ | The noise is a hindrance to work. | Le bruit gêne le travail.
incongruity | incongruité | n | C2 | /ˌɪnkɒŋˈɡruːəti/ | We laughed at the incongruity of the situation. | Nous avons ri de l'incongruité de la situation.
reverberation | réverbération, répercussion | n | C2 | /rɪˌvɜːbəˈreɪʃn/ | The decision had reverberations across the country. | La décision a eu des répercussions dans tout le pays.
craze | engouement, mode | n | C1 | /kreɪz/ | It's the latest craze among teenagers. | C'est la dernière mode chez les adolescents.
adherence | adhésion, respect | n | C2 | /ədˈhɪərəns/ | Strict adherence to the rules is required. | Le strict respect des règles est exigé.
devastation | dévastation | n | C1 | /ˌdevəˈsteɪʃn/ | The earthquake left devastation behind. | Le séisme a laissé la dévastation derrière lui.
issuance | émission, délivrance | n | C2 | /ˈɪʃuːəns/ | The issuance of visas was delayed. | La délivrance des visas a été retardée.
nemesis | ennemi juré, némésis | n | C2 | /ˈneməsɪs/ | Maths has always been my nemesis. | Les maths ont toujours été ma bête noire.
propagation | propagation | n | C2 | /ˌprɒpəˈɡeɪʃn/ | The propagation of false news is dangerous. | La propagation de fausses nouvelles est dangereuse.
slew | multitude | n | C2 | /sluː/ | He received a slew of complaints. | Il a reçu une avalanche de plaintes.
precedence | priorité, préséance | n | C2 | /ˈpresɪdəns/ | Safety takes precedence over speed. | La sécurité passe avant la vitesse.
retrieval | récupération | n | C2 | /rɪˈtriːvl/ | Data retrieval is fast. | La récupération des données est rapide.
usefulness | utilité | n | C1 | /ˈjuːsflnəs/ | I doubt the usefulness of this tool. | Je doute de l'utilité de cet outil.
approximation | approximation | n | C2 | /əˌprɒksɪˈmeɪʃn/ | It's only an approximation. | Ce n'est qu'une approximation.
escalation | escalade, intensification | n | C1 | /ˌeskəˈleɪʃn/ | We fear an escalation of violence. | Nous craignons une escalade de la violence.
narration | narration | n | C2 | /næˈreɪʃn/ | The film has a voice-over narration. | Le film comporte une narration en voix off.
oblivion | oubli ; néant | n | C2 | /əˈblɪviən/ | The old songs fell into oblivion. | Les vieilles chansons sont tombées dans l'oubli.
preparedness | état de préparation | n | C2 | /prɪˈpeədnəs/ | The army is in a state of preparedness. | L'armée est en état d'alerte.
rendezvous | rendez-vous | n | C2 | /ˈrɒndɪvuː/ | They arranged a rendezvous at the station. | Ils ont fixé un rendez-vous à la gare.
complication | complication | n | C1 | /ˌkɒmplɪˈkeɪʃn/ | There were complications after the surgery. | Il y a eu des complications après l'opération.
limbo | flou, incertitude | n | C2 | /ˈlɪmbəʊ/ | We've been in limbo for months. | Nous sommes dans l'incertitude depuis des mois.
resurgence | résurgence, renouveau | n | C2 | /rɪˈsɜːdʒəns/ | There's a resurgence of interest in Arabic. | On observe un regain d'intérêt pour l'arabe.
carnage | carnage | n | C2 | /ˈkɑːnɪdʒ/ | The bombing caused carnage. | L'attentat a provoqué un carnage.
fiasco | fiasco | n | C1 | /fiˈæskəʊ/ | The party was a fiasco. | La fête a été un fiasco.
omission | omission, oubli | n | C2 | /əˈmɪʃn/ | There are some omissions in the list. | La liste comporte quelques oublis.
remnant | reste, vestige | n | C2 | /ˈremnənt/ | These walls are remnants of the old city. | Ces murs sont des vestiges de la vieille ville.
acclaim | acclamations, éloges | n | C2 | /əˈkleɪm/ | The book won critical acclaim. | Le livre a été salué par la critique.
bloodshed | effusion de sang | n | C2 | /ˈblʌdʃed/ | They want to avoid bloodshed. | Ils veulent éviter une effusion de sang.
discrepancy | écart, divergence | n | C2 | /dɪˈskrepənsi/ | There's a discrepancy in the figures. | Il y a un écart dans les chiffres.
payback | vengeance ; retour sur investissement | n | C1 | /ˈpeɪbæk/ | This is payback for what you did. | C'est ta punition pour ce que tu as fait.
wreckage | débris, épave | n | C1 | /ˈrekɪdʒ/ | They searched the wreckage for survivors. | Ils ont fouillé les débris à la recherche de survivants.
cohesion | cohésion | n | C2 | /kəʊˈhiːʒn/ | Social cohesion is important. | La cohésion sociale est importante.
fray | mêlée, bagarre | n | C2 | /freɪ/ | He joined the fray. | Il s'est joint à la mêlée.
rupture | rupture | n | C2 | /ˈrʌptʃə/ | There was a rupture in the pipe. | Il y a eu une rupture du tuyau.
standout | élément remarquable | n | C2 | /ˈstændaʊt/ | She was the standout performer. | Elle s'est distinguée de tous.
uptake | adoption, recours ; absorption | n | C2 | /ˈʌpteɪk/ | The uptake of the vaccine was high. | Le vaccin a été largement adopté.
vantage point | point de vue, poste d'observation | n | C2 | /ˈvɑːntɪdʒ pɔɪnt/ | From this vantage point, you can see the whole city. | De ce point de vue, on voit toute la ville.
whim | caprice | n | C2 | /wɪm/ | He changes his mind on a whim. | Il change d'avis sur un coup de tête.
coercion | coercition, contrainte | n | C2 | /kəʊˈɜːʃn/ | Faith cannot come from coercion. | La foi ne peut naître de la contrainte.
competency | compétence | n | C2 | /ˈkɒmpɪtənsi/ | Reading is a basic competency. | La lecture est une compétence de base.
gratification | satisfaction, gratification | n | C2 | /ˌɡrætɪfɪˈkeɪʃn/ | Children want instant gratification. | Les enfants veulent une satisfaction immédiate.
impetus | élan, impulsion | n | C2 | /ˈɪmpɪtəs/ | The visit gave new impetus to the talks. | La visite a donné un nouvel élan aux négociations.
potency | puissance, efficacité | n | C2 | /ˈpəʊtnsi/ | The drug loses potency over time. | Le médicament perd de son efficacité avec le temps.
pretext | prétexte | n | C2 | /ˈpriːtekst/ | He came on the pretext of borrowing a book. | Il est venu sous prétexte d'emprunter un livre.
snag | hic, problème | n | C1 | /snæɡ/ | There's one snag: it's expensive. | Il y a un hic : c'est cher.
sophistication | raffinement, sophistication | n | C2 | /səˌfɪstɪˈkeɪʃn/ | She dresses with sophistication. | Elle s'habille avec raffinement.
assortment | assortiment | n | C1 | /əˈsɔːtmənt/ | There's a wide assortment of sweets. | Il y a un large assortiment de bonbons.
bane | fléau, plaie | n | C2 | /beɪn/ | Mosquitoes are the bane of my life. | Les moustiques me gâchent la vie.
foreground | premier plan | n | C1 | /ˈfɔːɡraʊnd/ | The mosque is in the foreground of the photo. | La mosquée est au premier plan de la photo.
orb | orbe, globe | n | C2 | /ɔːb/ | The orb of the sun sank into the sea. | Le disque du soleil s'enfonçait dans la mer.
richness | richesse | n | C1 | /ˈrɪtʃnəs/ | We admired the richness of the Arabic language. | Nous admirions la richesse de la langue arabe.
aggregation | agrégation, regroupement | n | C2 | /ˌæɡrɪˈɡeɪʃn/ | The site is an aggregation of news. | Le site est un agrégateur d'actualités.
snare | piège, collet | n | C2 | /sneə/ | The rabbit was caught in a snare. | Le lapin a été pris dans un collet.
throwback | retour, réminiscence | n | C2 | /ˈθrəʊbæk/ | The style is a throwback to the 1970s. | Le style rappelle les années 1970.
trickle | filet, goutte | n | C1 | /ˈtrɪkl/ | A trickle of water ran down the wall. | Un filet d'eau coulait le long du mur.
ultimatum | ultimatum | n | C1 | /ˌʌltɪˈmeɪtəm/ | They gave him an ultimatum. | Ils lui ont posé un ultimatum.
bulge | renflement, bosse | n | C2 | /bʌldʒ/ | There was a bulge in his pocket. | Sa poche était bombée.
forte | point fort | n | C2 | /ˈfɔːteɪ/ | Cooking is not my forte. | La cuisine n'est pas mon fort.
leakage | fuite | n | C2 | /ˈliːkɪdʒ/ | There's a leakage of gas. | Il y a une fuite de gaz.
plethora | pléthore | n | C2 | /ˈpleθərə/ | There's a plethora of books on the subject. | Il existe une pléthore de livres sur le sujet.
underside | dessous | n | C1 | /ˈʌndəsaɪd/ | Check the underside of the car. | Vérifie le dessous de la voiture.
clout | influence, poids | n | C2 | /klaʊt/ | He has political clout. | Il a du poids politique.
crucible | creuset | n | C2 | /ˈkruːsɪbl/ | The war was the crucible of the nation. | La guerre a été le creuset de la nation.
lifeline | bouée de sauvetage | n | C2 | /ˈlaɪflaɪn/ | The loan was a lifeline for the family. | Le prêt a été une bouée de sauvetage pour la famille.
annihilation | anéantissement | n | C2 | /əˌnaɪəˈleɪʃn/ | The war threatened total annihilation. | La guerre menaçait d'un anéantissement total.
grandeur | grandeur, splendeur | n | C2 | /ˈɡrændʒə/ | We admired the grandeur of the mosque. | Nous avons admiré la splendeur de la mosquée.
melee | mêlée | n | C2 | /ˈmeleɪ/ | Several people were hurt in the melee. | Plusieurs personnes ont été blessées dans la mêlée.
presumption | présomption | n | C2 | /prɪˈzʌmpʃn/ | There's a presumption of innocence. | Il existe une présomption d'innocence.
specificity | spécificité | n | C2 | /ˌspesɪˈfɪsəti/ | Each culture has its own specificity. | Chaque culture a sa spécificité.
synergy | synergie | n | C2 | /ˈsɪnədʒi/ | There's a real synergy between the two teams. | Il y a une vraie synergie entre les deux équipes.
tint | teinte, nuance | n | C1 | /tɪnt/ | The windows have a blue tint. | Les vitres ont une teinte bleutée.
whiff | bouffée, relent | n | C2 | /wɪf/ | I caught a whiff of perfume. | J'ai senti une bouffée de parfum.
calibre | calibre ; envergure | n | C2 | /ˈkælɪbə/ | We need people of his calibre. | Il nous faut des gens de son envergure.
debacle | débâcle, fiasco | n | C2 | /deɪˈbɑːkl/ | The election was a debacle for the party. | L'élection a été une débâcle pour le parti.
suitability | aptitude, adéquation | n | C2 | /ˌsuːtəˈbɪləti/ | They checked his suitability for the job. | Ils ont vérifié son aptitude pour le poste.
uniqueness | unicité, caractère unique | n | C2 | /juˈniːknəs/ | Muslims believe in the uniqueness of God. | Les musulmans croient en l'unicité de Dieu.
enlargement | agrandissement | n | C1 | /ɪnˈlɑːdʒmənt/ | The enlargement of the EU. | L'élargissement de l'UE.
fanfare | fanfare ; tapage | n | C2 | /ˈfænfeə/ | The new product was launched with great fanfare. | Le nouveau produit a été lancé en grande pompe.
fluff | peluche, duvet | n | C1 | /flʌf/ | There's fluff on your jumper. | Il y a des peluches sur ton pull.
giver | donateur, donneur | n | C2 | /ˈɡɪvə/ | The upper hand is better than the lower: the giver is better than the taker. | La main qui donne vaut mieux que celle qui reçoit.
multiplier | multiplicateur | n | C2 | /ˈmʌltɪplaɪə/ | The effect has a multiplier. | L'effet a un multiplicateur.
obscurity | obscurité, anonymat | n | C2 | /əbˈskjʊərəti/ | He died in obscurity. | Il est mort dans l'anonymat.
onslaught | assaut, déferlement | n | C2 | /ˈɒnslɔːt/ | The army faced an onslaught. | L'armée a subi un assaut violent.
recurrence | réapparition, récurrence | n | C2 | /rɪˈkʌrəns/ | Take your medicine to prevent a recurrence. | Prends ton médicament pour éviter une récidive.
refinement | raffinement ; perfectionnement | n | C2 | /rɪˈfaɪnmənt/ | The plan needs some refinement. | Le projet a besoin d'être affiné.
rung | barreau, échelon | n | C2 | /rʌŋ/ | He started on the bottom rung of the ladder. | Il a commencé au bas de l'échelle.
entourage | entourage | n | C2 | /ˈɒntʊrɑːʒ/ | The singer arrived with her entourage. | La chanteuse est arrivée avec son entourage.
gimmick | truc, astuce publicitaire | n | C2 | /ˈɡɪmɪk/ | It's just a marketing gimmick. | Ce n'est qu'un gadget commercial.
groundwork | travail préparatoire | n | C2 | /ˈɡraʊndwɜːk/ | He laid the groundwork for the project. | Il a préparé le terrain pour le projet.
scourge | fléau | n | C2 | /skɜːdʒ/ | Drugs are the scourge of our society. | La drogue est le fléau de notre société.
tangent | tangente ; digression | n | C2 | /ˈtændʒənt/ | He went off on a tangent. | Il est parti dans une digression.
dispersion | dispersion | n | C2 | /dɪˈspɜːʃn/ | The dispersion of the population. | La dispersion de la population.
facet | facette | n | C2 | /ˈfæsɪt/ | Prayer touches every facet of life. | La prière touche chaque facette de la vie.
fireball | boule de feu | n | C2 | /ˈfaɪəbɔːl/ | The explosion created a huge fireball. | L'explosion a créé une énorme boule de feu.
gist | essentiel, sens général | n | C2 | /dʒɪst/ | I got the gist of what he said. | J'ai compris l'essentiel de ce qu'il a dit.
nook | coin, recoin | n | C2 | /nʊk/ | I searched every nook and cranny. | J'ai fouillé dans tous les coins et recoins.
slant | pente ; point de vue | n | C2 | /slɑːnt/ | The article has a political slant. | L'article a une orientation politique.
slur | insulte, calomnie | n | C2 | /slɜː/ | It's a slur on my character. | C'est une atteinte à ma réputation.
alacrity | empressement | n | C2 | /əˈlækrəti/ | He accepted the offer with alacrity. | Il a accepté l'offre avec empressement.
cacophony | cacophonie | n | C2 | /kəˈkɒfəni/ | A cacophony of horns filled the street. | Une cacophonie de klaxons emplissait la rue.
censure | blâme, réprobation | n | C2 | /ˈsenʃə/ | The minister faced public censure. | Le ministre a essuyé un blâme public.
chicanery | chicane, manigances | n | C2 | /ʃɪˈkeɪnəri/ | The election was marred by chicanery. | L'élection a été entachée de manigances.
diatribe | diatribe | n | C2 | /ˈdaɪətraɪb/ | He launched into a diatribe against the media. | Il s'est lancé dans une diatribe contre les médias.
dissonance | dissonance | n | C2 | /ˈdɪsənəns/ | There's a dissonance between his words and his actions. | Il y a un décalage entre ses paroles et ses actes.
harangue | harangue | n | C2 | /həˈræŋ/ | He delivered a long harangue. | Il a prononcé une longue harangue.
impasse | impasse | n | C2 | /ˈæmpɑːs/ | The talks reached an impasse. | Les négociations sont dans l'impasse.
paragon | modèle, parangon | n | C2 | /ˈpærəɡən/ | He was a paragon of virtue. | C'était un modèle de vertu.
paucity | rareté, manque | n | C2 | /ˈpɔːsəti/ | There's a paucity of evidence. | Les preuves sont rares.
propensity | propension, tendance | n | C2 | /prəˈpensəti/ | He has a propensity to exaggerate. | Il a tendance à exagérer.
quandary | dilemme | n | C2 | /ˈkwɒndəri/ | I'm in a quandary about what to do. | Je ne sais vraiment pas quoi faire.
serendipity | heureux hasard | n | C2 | /ˌserənˈdɪpəti/ | It was pure serendipity that we met. | C'est un pur hasard heureux si nous nous sommes rencontrés.
tirade | tirade | n | C2 | /taɪˈreɪd/ | He launched into a tirade against the referee. | Il s'est lancé dans une tirade contre l'arbitre.
veracity | véracité | n | C2 | /vəˈræsəti/ | Scholars checked the veracity of the report. | Les savants ont vérifié la véracité du rapport.
yoke | joug | n | C2 | /jəʊk/ | They threw off the yoke of oppression. | Ils ont secoué le joug de l'oppression.
accolade | distinction, éloge | n | C2 | /ˈækəleɪd/ | The film received many accolades. | Le film a reçu de nombreuses distinctions.
admonition | admonestation, avertissement | n | C2 | /ˌædməˈnɪʃn/ | He ignored his father's admonition. | Il a ignoré l'avertissement de son père.
anathema | anathème ; abomination | n | C2 | /əˈnæθəmə/ | Racism is anathema to me. | Le racisme m'est insupportable.
antagonism | antagonisme | n | C2 | /ænˈtæɡənɪzəm/ | There's antagonism between the two groups. | Il y a de l'antagonisme entre les deux groupes.
approbation | approbation | n | C2 | /ˌæprəˈbeɪʃn/ | He sought his father's approbation. | Il recherchait l'approbation de son père.
arbiter | arbitre | n | C2 | /ˈɑːbɪtə/ | She is the final arbiter of taste. | Elle est l'arbitre suprême du bon goût.
aspersion | calomnie, dénigrement | n | C2 | /əˈspɜːʃn/ | Don't cast aspersions on his character. | Ne dénigre pas sa réputation.
assent | assentiment, consentement | n | C2 | /əˈsent/ | He nodded his assent. | Il a hoché la tête en signe d'assentiment.
behemoth | mastodonte | n | C2 | /bɪˈhiːmɒθ/ | The company is a corporate behemoth. | L'entreprise est un mastodonte.
compendium | recueil, abrégé | n | C2 | /kəmˈpendiəm/ | It's a compendium of hadith. | C'est un recueil de hadiths.
conflagration | incendie, conflagration | n | C2 | /ˌkɒnfləˈɡreɪʃn/ | The conflagration destroyed the city. | L'incendie a détruit la ville.
conviviality | convivialité | n | C2 | /kənˌvɪviˈæləti/ | We enjoyed the conviviality of the meal. | Nous avons apprécié la convivialité du repas.
manhood | âge d'homme, virilité | n | C1 | /ˈmænhʊd/ | He reached manhood during the war. | Il est devenu un homme pendant la guerre.
nugget | pépite ; nugget | n | B2 | /ˈnʌɡɪt/ | He found a gold nugget in the river. | Il a trouvé une pépite d'or dans la rivière.
sheath | gaine, fourreau | n | C2 | /ʃiːθ/ | He put the sword back in its sheath. | Il a remis l'épée dans son fourreau.
allure | attrait, charme | n | C1 | /əˈlʊə/ | The allure of city life attracts many young people. | L'attrait de la vie urbaine attire beaucoup de jeunes.
insignia | insigne | n | C2 | /ɪnˈsɪɡniə/ | The officer wore the royal insignia. | L'officier portait l'insigne royal.
interplay | interaction | n | C2 | /ˈɪntəpleɪ/ | The book studies the interplay of faith and reason. | Le livre étudie l'interaction entre la foi et la raison.
fluke | coup de chance | n | C1 | /fluːk/ | His win was a fluke. | Sa victoire était un coup de chance.
jinx | porte-malheur, mauvais sort | n | C2 | /dʒɪŋks/ | Some people believe in jinxes. | Certains croient aux mauvais sorts.
linkage | lien, liaison | n | C2 | /ˈlɪŋkɪdʒ/ | There's a linkage between diet and health. | Il y a un lien entre alimentation et santé.
blunder | bévue, gaffe | n | C1 | /ˈblʌndə/ | It was a terrible blunder. | C'était une terrible bévue.
commotion | agitation, remue-ménage | n | C1 | /kəˈməʊʃn/ | What's all the commotion outside? | C'est quoi, tout ce remue-ménage dehors ?
completeness | exhaustivité, complétude | n | C1 | /kəmˈpliːtnəs/ | We checked the completeness of the list. | Nous avons vérifié l'exhaustivité de la liste.
inaction | inaction | n | C1 | /ɪnˈækʃn/ | The government's inaction is shocking. | L'inaction du gouvernement est choquante.
counterpoint | contrepoint | n | C2 | /ˈkaʊntəpɔɪnt/ | Her calm is a counterpoint to his anger. | Son calme fait contrepoint à sa colère.
flurry | rafale, tourbillon ; agitation | n | C1 | /ˈflʌri/ | There was a flurry of activity before the guests arrived. | Il y a eu un branle-bas avant l'arrivée des invités.
glimmer | lueur | n | C1 | /ˈɡlɪmə/ | There's a glimmer of hope. | Il y a une lueur d'espoir.
wishful thinking | illusions, vœux pieux | n | C1 | /ˌwɪʃfl ˈθɪŋkɪŋ/ | That's just wishful thinking. | Ce ne sont que des vœux pieux.
mismatch | décalage, inadéquation | n | C1 | /ˈmɪsmætʃ/ | There's a mismatch between supply and demand. | Il y a une inadéquation entre l'offre et la demande.
pellet | granulé, plomb | n | C1 | /ˈpelɪt/ | The stove burns wood pellets. | Le poêle brûle des granulés de bois.
semblance | semblant, apparence | n | C2 | /ˈsembləns/ | Life returned to some semblance of normality. | La vie a retrouvé un semblant de normalité.
spindle | fuseau, axe | n | C2 | /ˈspɪndl/ | The thread winds around the spindle. | Le fil s'enroule autour du fuseau.
canister | boîte métallique, cartouche | n | C1 | /ˈkænɪstə/ | Police fired tear gas canisters. | La police a tiré des grenades lacrymogènes.
resumption | reprise | n | C2 | /rɪˈzʌmpʃn/ | We hope for a resumption of talks. | Nous espérons une reprise des négociations.
subtlety | subtilité | n | C1 | /ˈsʌtlti/ | The subtlety of the Arabic language is fascinating. | La subtilité de la langue arabe est fascinante.
credence | crédit, foi | n | C2 | /ˈkriːdns/ | I give no credence to rumours. | Je n'accorde aucun crédit aux rumeurs.
blob | goutte, tache | n | C1 | /blɒb/ | There's a blob of paint on the floor. | Il y a une tache de peinture par terre.
foothold | point d'appui, prise | n | C1 | /ˈfʊthəʊld/ | The company gained a foothold in Asia. | L'entreprise a pris pied en Asie.
hunch | intuition, pressentiment | n | C1 | /hʌntʃ/ | I have a hunch he's lying. | J'ai l'intuition qu'il ment.
keg | tonnelet, fût | n | C1 | /keɡ/ | A keg of water was kept on the boat. | Un tonnelet d'eau était gardé sur le bateau.
mainstay | pilier, soutien principal | n | C2 | /ˈmeɪnsteɪ/ | Rice is the mainstay of their diet. | Le riz est la base de leur alimentation.
augmentation | augmentation, accroissement | n | C2 | /ˌɔːɡmenˈteɪʃn/ | The augmentation of military forces worries them. | Le renforcement des forces militaires les inquiète.
decoy | leurre, appât | n | C2 | /ˈdiːkɔɪ/ | The car was a decoy. | La voiture était un leurre.
foray | incursion, tentative | n | C2 | /ˈfɒreɪ/ | It was his first foray into politics. | Ce fut sa première incursion en politique.
radiance | éclat, rayonnement | n | C1 | /ˈreɪdiəns/ | Her face had a radiance after prayer. | Son visage rayonnait après la prière.
responsiveness | réactivité | n | C1 | /rɪˈspɒnsɪvnəs/ | Customers value responsiveness. | Les clients apprécient la réactivité.
stalemate | impasse | n | C1 | /ˈsteɪlmeɪt/ | The negotiations ended in stalemate. | Les négociations ont abouti à une impasse.
treasure trove | mine (d'informations), trésor | n | C1 | /ˈtreʒə trəʊv/ | The library is a treasure trove of manuscripts. | La bibliothèque est une mine de manuscrits.
blot | tache ; souillure | n | C1 | /blɒt/ | The building is a blot on the landscape. | Le bâtiment défigure le paysage.
fullness | plénitude ; ampleur | n | C1 | /ˈfʊlnəs/ | Eating slowly gives a feeling of fullness. | Manger lentement donne une sensation de satiété.
postponement | report, ajournement | n | C1 | /pəˈspəʊnmənt/ | The rain led to the postponement of the match. | La pluie a entraîné le report du match.
regularity | régularité | n | C1 | /ˌreɡjuˈlærəti/ | Regularity in worship matters more than quantity. | La régularité dans l'adoration compte plus que la quantité.
betterment | amélioration | n | C2 | /ˈbetəmənt/ | He worked for the betterment of society. | Il a œuvré pour l'amélioration de la société.
jolt | secousse, choc | n | C1 | /dʒəʊlt/ | The bus stopped with a jolt. | Le bus s'est arrêté brusquement.
speck | grain, petite tache | n | C1 | /spek/ | There's a speck of dust on the lens. | Il y a un grain de poussière sur l'objectif.
lightness | légèreté | n | C1 | /ˈlaɪtnəs/ | The cake has a wonderful lightness. | Le gâteau a une merveilleuse légèreté.
lustre | lustre, éclat | n | C2 | /ˈlʌstə/ | The pearls have a beautiful lustre. | Les perles ont un bel éclat.
paraphernalia | attirail | n | C2 | /ˌpærəfəˈneɪliə/ | Fishing paraphernalia filled the garage. | Un attirail de pêche remplissait le garage.
watermark | filigrane | n | C2 | /ˈwɔːtəmɑːk/ | Banknotes have a watermark. | Les billets de banque ont un filigrane.
futility | futilité, vanité | n | C1 | /fjuːˈtɪləti/ | He realised the futility of arguing. | Il a compris la vanité de la dispute.
impotence | impuissance | n | C2 | /ˈɪmpətəns/ | They felt a sense of impotence. | Ils ressentaient un sentiment d'impuissance.
increment | augmentation, palier | n | C2 | /ˈɪŋkrəmənt/ | Your salary rises in yearly increments. | Ton salaire augmente par paliers annuels.
juxtaposition | juxtaposition | n | C2 | /ˌdʒʌkstəpəˈzɪʃn/ | The juxtaposition of old and new is striking. | La juxtaposition de l'ancien et du neuf est frappante.
tightness | oppression, tension | n | C1 | /ˈtaɪtnəs/ | He felt a tightness in his chest. | Il ressentait une oppression dans la poitrine.
ambience | ambiance | n | C1 | /ˈæmbiəns/ | The restaurant has a pleasant ambience. | Le restaurant a une ambiance agréable.
assemblage | assemblage | n | C2 | /əˈsemblɪdʒ/ | An assemblage of old objects. | Un assemblage de vieux objets.
clump | touffe, bouquet | n | C1 | /klʌmp/ | A clump of trees stood on the hill. | Un bouquet d'arbres se dressait sur la colline.
sideshow | attraction secondaire, détail | n | C2 | /ˈsaɪdʃəʊ/ | The argument is a sideshow to the real issue. | La dispute est un détail par rapport au vrai problème.
dryness | sécheresse | n | C1 | /ˈdraɪnəs/ | The cream relieves skin dryness. | La crème soulage la sécheresse de la peau.
memento | souvenir | n | C2 | /məˈmentəʊ/ | He kept the ticket as a memento. | Il a gardé le billet en souvenir.
normality | normalité | n | C1 | /nɔːˈmæləti/ | Life returned to normality. | La vie est revenue à la normale.
splendour | splendeur | n | C1 | /ˈsplendə/ | The splendour of the Alhambra. | La splendeur de l'Alhambra.
concealment | dissimulation | n | C2 | /kənˈsiːlmənt/ | The concealment of evidence is a crime. | La dissimulation de preuves est un délit.
erasure | effacement | n | C2 | /ɪˈreɪʒə/ | They fear the erasure of their culture. | Ils craignent l'effacement de leur culture.
summation | résumé, récapitulation | n | C2 | /sʌˈmeɪʃn/ | The lawyer gave his summation. | L'avocat a fait sa récapitulation.
weirdness | étrangeté, bizarrerie | n | C1 | /ˈwɪədnəs/ | I noticed the weirdness of the situation. | J'ai remarqué l'étrangeté de la situation.
applicability | applicabilité | n | C2 | /əˌplɪkəˈbɪləti/ | The rule has wide applicability. | La règle a une large applicabilité.
lunacy | folie | n | C2 | /ˈluːnəsi/ | It would be lunacy to drive in this weather. | Ce serait de la folie de conduire par ce temps.
breakage | casse | n | C1 | /ˈbreɪkɪdʒ/ | You must pay for any breakages. | Tu dois payer toute casse.
charade | mascarade, comédie | n | C2 | /ʃəˈrɑːd/ | Their friendship is a charade. | Leur amitié est une comédie.
fluidity | fluidité | n | C2 | /fluˈɪdəti/ | The fluidity of his movements is remarkable. | La fluidité de ses mouvements est remarquable.
inevitability | inéluctabilité | n | C2 | /ɪnˌevɪtəˈbɪləti/ | He accepted the inevitability of death. | Il a accepté le caractère inéluctable de la mort.
inkling | soupçon, petite idée | n | C2 | /ˈɪŋklɪŋ/ | I had no inkling of the problem. | Je n'avais aucune idée du problème.
portability | portabilité | n | C2 | /ˌpɔːtəˈbɪləti/ | The laptop's portability is its main advantage. | La portabilité de l'ordinateur est son principal avantage.
thud | bruit sourd | n | C1 | /θʌd/ | The book fell with a thud. | Le livre est tombé avec un bruit sourd.
acme | apogée, summum | n | C2 | /ˈækmi/ | It was the acme of his career. | Ce fut l'apogée de sa carrière.
shrinkage | rétrécissement, diminution | n | C2 | /ˈʃrɪŋkɪdʒ/ | Wash cold to avoid shrinkage. | Lave à froid pour éviter le rétrécissement.
afterthought | ajout de dernière minute | n | C1 | /ˈɑːftəθɔːt/ | The garden was an afterthought. | Le jardin a été ajouté après coup.
asymmetry | asymétrie | n | C2 | /eɪˈsɪmətri/ | There's an asymmetry of power. | Il y a une asymétrie de pouvoir.
entanglement | enchevêtrement, imbroglio | n | C2 | /ɪnˈtæŋɡlmənt/ | They avoided foreign entanglements. | Ils ont évité les imbroglios à l'étranger.
lifesaver | bouée de sauvetage, sauveur | n | C1 | /ˈlaɪfseɪvə/ | Thanks for the help, you're a lifesaver! | Merci pour ton aide, tu me sauves la vie !
litany | litanie | n | C2 | /ˈlɪtəni/ | He recited a litany of complaints. | Il a débité une litanie de plaintes.
originator | auteur, initiateur | n | C2 | /əˈrɪdʒɪneɪtə/ | He was the originator of the idea. | Il était l'initiateur de l'idée.
primacy | primauté | n | C2 | /ˈpraɪməsi/ | The primacy of the Qur'an over other sources. | La primauté du Coran sur les autres sources.
ruckus | chahut, grabuge | n | C2 | /ˈrʌkəs/ | The children caused a ruckus. | Les enfants ont fait du grabuge.
heroics | actes héroïques, exploits | n | C2 | /həˈrəʊɪks/ | We don't need heroics, just careful work. | Nous n'avons pas besoin d'exploits, juste d'un travail soigné.
perversion | perversion, déformation | n | C2 | /pəˈvɜːʃn/ | It's a perversion of justice. | C'est un détournement de la justice.
slog | corvée, travail pénible | n | C1 | /slɒɡ/ | The climb was a long slog. | L'ascension a été une longue corvée.
infamy | infamie | n | C2 | /ˈɪnfəmi/ | It was a day of infamy. | Ce fut un jour d'infamie.
salvo | salve | n | C2 | /ˈsælvəʊ/ | The opening salvo of the campaign. | La première salve de la campagne.
adequacy | adéquation, suffisance | n | C2 | /ˈædɪkwəsi/ | They questioned the adequacy of the measures. | Ils ont mis en doute la suffisance des mesures.
amalgam | amalgame, mélange | n | C2 | /əˈmælɡəm/ | The city is an amalgam of cultures. | La ville est un mélange de cultures.
midpoint | milieu, point médian | n | C1 | /ˈmɪdpɔɪnt/ | We stopped at the midpoint of the journey. | Nous nous sommes arrêtés à mi-chemin.
predictability | prévisibilité | n | C2 | /prɪˌdɪktəˈbɪləti/ | Children need predictability. | Les enfants ont besoin de prévisibilité.
smoothness | douceur, régularité | n | C1 | /ˈsmuːðnəs/ | I love the smoothness of this fabric. | J'aime la douceur de ce tissu.
touchstone | pierre de touche, référence | n | C2 | /ˈtʌtʃstəʊn/ | The Qur'an is the touchstone of truth. | Le Coran est la pierre de touche de la vérité.
spurt | jet ; sursaut | n | C2 | /spɜːt/ | He grew in a sudden spurt. | Il a grandi d'un coup.
interconnection | interconnexion | n | C2 | /ˌɪntəkəˈnekʃn/ | The interconnection of the two networks. | L'interconnexion des deux réseaux.
normalcy | normalité | n | C2 | /ˈnɔːmlsi/ | People long for a return to normalcy. | Les gens aspirent à un retour à la normale.
quickness | rapidité, vivacité | n | C1 | /ˈkwɪknəs/ | I was impressed by the quickness of his mind. | J'ai été impressionné par la vivacité de son esprit.
robustness | robustesse | n | C2 | /rəʊˈbʌstnəs/ | The robustness of the system was tested. | La robustesse du système a été testée.
swathe | bande, vaste étendue | n | C2 | /sweɪð/ | Large swathes of forest were destroyed. | De vastes étendues de forêt ont été détruites.
tinge | nuance, pointe | n | C2 | /tɪndʒ/ | There was a tinge of sadness in his voice. | Il y avait une pointe de tristesse dans sa voix.
coolness | fraîcheur ; sang-froid | n | C1 | /ˈkuːlnəs/ | We enjoyed the coolness of the evening. | Nous avons apprécié la fraîcheur du soir.
placeholder | espace réservé, substitut | n | C2 | /ˈpleɪshəʊldə/ | The name is just a placeholder. | Le nom n'est qu'un substitut provisoire.
zigzag | zigzag | n | B2 | /ˈzɪɡzæɡ/ | The path climbs in a zigzag. | Le sentier monte en zigzag.
discoloration | décoloration, tache | n | C2 | /dɪsˌkʌləˈreɪʃn/ | There's some discoloration on the wall. | Il y a des taches sur le mur.
dynamism | dynamisme | n | C2 | /ˈdaɪnəmɪzəm/ | The city is known for its dynamism. | La ville est connue pour son dynamisme.
glut | surabondance | n | C2 | /ɡlʌt/ | There's a glut of oil on the market. | Il y a une surabondance de pétrole sur le marché.
imperfection | imperfection | n | C1 | /ˌɪmpəˈfekʃn/ | Only Allah is free from imperfection. | Seul Allah est exempt d'imperfection.
implosion | implosion | n | C2 | /ɪmˈpləʊʒn/ | The implosion of the party was swift. | L'implosion du parti a été rapide.
intensification | intensification | n | C2 | /ɪnˌtensɪfɪˈkeɪʃn/ | There has been an intensification of fighting. | Il y a eu une intensification des combats.
jumble | fouillis, méli-mélo | n | C1 | /ˈdʒʌmbl/ | There was a jumble of clothes on the bed. | Il y avait un fouillis de vêtements sur le lit.
modality | modalité | n | C2 | /məʊˈdæləti/ | Treatment modalities vary. | Les modalités de traitement varient.
roughness | rugosité ; brutalité | n | C1 | /ˈrʌfnəs/ | I felt the roughness of the wall. | J'ai senti la rugosité du mur.
smudge | trace, bavure | n | C1 | /smʌdʒ/ | There's a smudge on your glasses. | Il y a une trace sur tes lunettes.
admittance | accès, entrée | n | C2 | /ədˈmɪtns/ | No admittance without a ticket. | Entrée interdite sans billet.
microcosm | microcosme | n | C2 | /ˈmaɪkrəʊkɒzəm/ | The class is a microcosm of society. | La classe est un microcosme de la société.
multiplicity | multiplicité | n | C2 | /ˌmʌltɪˈplɪsəti/ | A multiplicity of opinions. | Une multiplicité d'opinions.
inadequacy | insuffisance | n | C2 | /ɪnˈædɪkwəsi/ | He felt a sense of inadequacy. | Il ressentait un sentiment d'insuffisance.
magnificence | magnificence | n | C2 | /mæɡˈnɪfɪsns/ | The magnificence of the mosque left us speechless. | La magnificence de la mosquée nous a laissés sans voix.
muddle | confusion, pagaille | n | C1 | /ˈmʌdl/ | My papers are in a muddle. | Mes papiers sont en pagaille.
silliness | bêtise | n | C1 | /ˈsɪlinəs/ | Enough of this silliness! | Assez de bêtises !
spate | série, vague | n | C2 | /speɪt/ | There has been a spate of burglaries. | Il y a eu une vague de cambriolages.
godsend | aubaine, bénédiction | n | C1 | /ˈɡɒdsend/ | The rain was a godsend for farmers. | La pluie a été une bénédiction pour les agriculteurs.
inaccuracy | inexactitude | n | C1 | /ɪnˈækjərəsi/ | The article contains several inaccuracies. | L'article contient plusieurs inexactitudes.
monotone | ton monocorde | n | C2 | /ˈmɒnətəʊn/ | He speaks in a monotone. | Il parle d'un ton monocorde.
monstrosity | monstruosité, horreur | n | C2 | /mɒnˈstrɒsəti/ | The new building is a monstrosity. | Le nouveau bâtiment est une horreur.
appropriateness | pertinence, caractère approprié | n | C2 | /əˈprəʊpriətnəs/ | They questioned the appropriateness of the joke. | Ils ont mis en doute la pertinence de la blague.
brainchild | idée originale, invention | n | C2 | /ˈbreɪntʃaɪld/ | The project is the brainchild of two students. | Le projet est né de l'imagination de deux étudiants.
bulwark | rempart | n | C2 | /ˈbʊlwək/ | Education is a bulwark against extremism. | L'éducation est un rempart contre l'extrémisme.
heterogeneity | hétérogénéité | n | C2 | /ˌhetərədʒəˈniːəti/ | The heterogeneity of the group is a strength. | L'hétérogénéité du groupe est une force.
immediacy | immédiateté | n | C2 | /ɪˈmiːdiəsi/ | Television has great immediacy. | La télévision a une grande immédiateté.
alertness | vigilance | n | C1 | /əˈlɜːtnəs/ | Coffee improves alertness. | Le café améliore la vigilance.
bristle | poil (de brosse) | n | C2 | /ˈbrɪsl/ | The brush has stiff bristles. | La brosse a des poils durs.
dreamland | pays des rêves | n | C2 | /ˈdriːmlænd/ | The baby is in dreamland. | Le bébé est au pays des rêves.
heft | poids, lourdeur | n | C2 | /heft/ | I felt the heft of the box. | J'ai senti le poids de la boîte.
impropriety | inconvenance | n | C2 | /ˌɪmprəˈpraɪəti/ | There was no hint of impropriety. | Il n'y avait aucune trace d'inconvenance.
incompatibility | incompatibilité | n | C2 | /ˌɪnkəmˌpætəˈbɪləti/ | They divorced due to incompatibility. | Ils ont divorcé pour incompatibilité.
`,
);

export const ADVERBES = theme(
  "adverbes",
  "Les adverbes",
  "Dire comment, quand, combien et à quel point : de quoi nuancer chaque phrase.",
  "Gauge",
  `
correctly | correctement | adv | A2 | /kəˈrektli/ | Did I pronounce it correctly? | Je l'ai bien prononcé ?
differently | différemment | adv | A2 | /ˈdɪfrəntli/ | Everyone learns differently. | Chacun apprend différemment.
heavily | fortement, abondamment | adv | A2 | /ˈhevɪli/ | It rained heavily all night. | Il a plu à verse toute la nuit.
importantly | surtout, chose importante | adv | B1 | /ɪmˈpɔːtntli/ | More importantly, we must stay calm. | Surtout, nous devons rester calmes.
silently | silencieusement | adv | A2 | /ˈsaɪləntli/ | They walked silently into the mosque. | Ils sont entrés en silence dans la mosquée.
smoothly | sans à-coups, en douceur | adv | B1 | /ˈsmuːðli/ | Everything went smoothly. | Tout s'est bien passé.
strongly | fortement, vivement | adv | A2 | /ˈstrɒŋli/ | I strongly recommend this book. | Je recommande vivement ce livre.
successfully | avec succès | adv | A2 | /səkˈsesfəli/ | She successfully passed her driving test. | Elle a réussi son permis de conduire.
someday | un jour (futur) | adv | A2 | /ˈsʌmdeɪ/ | Someday I will visit Japan. | Un jour, je visiterai le Japon.
accurately | avec précision | adv | B1 | /ˈækjərətli/ | Measure the room accurately. | Mesure la pièce avec précision.
anxiously | anxieusement | adv | B1 | /ˈæŋkʃəsli/ | We waited anxiously for the results. | Nous attendions les résultats avec anxiété.
beautifully | magnifiquement | adv | B1 | /ˈbjuːtɪfli/ | She sings beautifully. | Elle chante magnifiquement.
boldly | hardiment, avec audace | adv | B1 | /ˈbəʊldli/ | She boldly asked for a raise. | Elle a osé demander une augmentation.
bravely | courageusement | adv | B1 | /ˈbreɪvli/ | The soldiers fought bravely. | Les soldats se sont battus courageusement.
briefly | brièvement | adv | B1 | /ˈbriːfli/ | Let me explain briefly. | Laisse-moi t'expliquer brièvement.
brightly | vivement, de façon éclatante | adv | B1 | /ˈbraɪtli/ | The sun was shining brightly. | Le soleil brillait de tout son éclat.
commonly | couramment | adv | B1 | /ˈkɒmənli/ | This word is commonly used. | Ce mot est couramment employé.
continually | continuellement | adv | B2 | /kənˈtɪnjuəli/ | The phone rang continually. | Le téléphone sonnait sans arrêt.
continuously | continuellement, sans interruption | adv | B1 | /kənˈtɪnjuəsli/ | It rained continuously for two days. | Il a plu sans interruption pendant deux jours.
curiously | curieusement | adv | B1 | /ˈkjʊəriəsli/ | Curiously, nobody saw anything. | Curieusement, personne n'a rien vu.
dangerously | dangereusement | adv | B1 | /ˈdeɪndʒərəsli/ | He drives dangerously. | Il conduit dangereusement.
distinctly | distinctement, nettement | adv | B2 | /dɪˈstɪŋktli/ | I distinctly remember his words. | Je me souviens distinctement de ses paroles.
evenly | uniformément, également | adv | B1 | /ˈiːvnli/ | Spread the butter evenly. | Étale le beurre uniformément.
excitedly | avec enthousiasme, avec excitation | adv | B1 | /ɪkˈsaɪtɪdli/ | The children talked excitedly. | Les enfants parlaient avec excitation.
extensively | largement, abondamment | adv | B2 | /ɪkˈstensɪvli/ | He has travelled extensively in Asia. | Il a beaucoup voyagé en Asie.
farther | plus loin | adv | B1 | /ˈfɑːðə/ | I can't walk any farther. | Je ne peux pas marcher plus loin.
feverishly | fébrilement | adv | B2 | /ˈfiːvərɪʃli/ | They worked feverishly to finish on time. | Ils travaillaient fébrilement pour finir à temps.
firmly | fermement | adv | B1 | /ˈfɜːmli/ | Hold the rope firmly. | Tiens fermement la corde.
fluently | couramment | adv | B1 | /ˈfluːəntli/ | She speaks Arabic fluently. | Elle parle couramment l'arabe.
forth | en avant (back and forth) | adv | B2 | /fɔːθ/ | He walked back and forth. | Il faisait les cent pas.
freely | librement | adv | B1 | /ˈfriːli/ | You can speak freely here. | Tu peux parler librement ici.
furthest | le plus loin | adv | B1 | /ˈfɜːðɪst/ | Who can throw the ball furthest? | Qui peut lancer la balle le plus loin ?
genetically | génétiquement | adv | B2 | /dʒəˈnetɪkli/ | These plants are genetically modified. | Ces plantes sont génétiquement modifiées.
hurriedly | précipitamment | adv | B2 | /ˈhʌrɪdli/ | She dressed hurriedly. | Elle s'est habillée à la hâte.
illegally | illégalement | adv | B1 | /ɪˈliːɡəli/ | The car was parked illegally. | La voiture était garée illégalement.
internationally | internationalement | adv | B2 | /ˌɪntəˈnæʃnəli/ | She is known internationally. | Elle est connue dans le monde entier.
involuntarily | involontairement | adv | C1 | /ɪnˈvɒləntrəli/ | He smiled involuntarily. | Il a souri malgré lui.
lightly | légèrement | adv | B1 | /ˈlaɪtli/ | Touch the screen lightly. | Touche l'écran légèrement.
lovingly | tendrement, avec amour | adv | B1 | /ˈlʌvɪŋli/ | She looked lovingly at her baby. | Elle regardait son bébé avec tendresse.
newly | récemment, nouvellement | adv | B1 | /ˈnjuːli/ | They are a newly married couple. | Ce sont de jeunes mariés.
noisily | bruyamment | adv | B1 | /ˈnɔɪzɪli/ | The children ate noisily. | Les enfants mangeaient bruyamment.
permanently | définitivement, en permanence | adv | B1 | /ˈpɜːmənəntli/ | They moved to Spain permanently. | Ils se sont installés définitivement en Espagne.
pleasantly | agréablement | adv | B1 | /ˈplezntli/ | I was pleasantly surprised. | J'ai été agréablement surpris.
positively | positivement ; vraiment | adv | B1 | /ˈpɒzətɪvli/ | Think positively! | Pense positivement !
primarily | principalement | adv | B2 | /praɪˈmerəli/ | The course is aimed primarily at beginners. | Le cours s'adresse principalement aux débutants.
properly | correctement, comme il faut | adv | B1 | /ˈprɒpəli/ | Do your homework properly. | Fais tes devoirs correctement.
relatively | relativement | adv | B1 | /ˈrelətɪvli/ | The exam was relatively easy. | L'examen était relativement facile.
repeatedly | à plusieurs reprises | adv | B1 | /rɪˈpiːtɪdli/ | I've told you repeatedly. | Je te l'ai dit à plusieurs reprises.
safely | en sécurité, sans encombre | adv | B1 | /ˈseɪfli/ | We arrived safely. | Nous sommes arrivés sans encombre.
severely | gravement, sévèrement | adv | B1 | /sɪˈvɪəli/ | He was severely injured. | Il a été grièvement blessé.
sometime | un jour, à un moment donné | adv | B1 | /ˈsʌmtaɪm/ | Let's meet sometime next week. | Voyons-nous un jour la semaine prochaine.
specially | spécialement | adv | B1 | /ˈspeʃəli/ | I made this cake specially for you. | J'ai fait ce gâteau spécialement pour toi.
steadily | régulièrement, progressivement | adv | B1 | /ˈstedɪli/ | Prices have risen steadily. | Les prix ont augmenté régulièrement.
strangely | étrangement | adv | B1 | /ˈstreɪndʒli/ | He was strangely quiet. | Il était étrangement silencieux.
supposedly | soi-disant, prétendument | adv | B2 | /səˈpəʊzɪdli/ | The house is supposedly haunted. | La maison serait hantée.
tightly | fermement, étroitement | adv | B1 | /ˈtaɪtli/ | Hold my hand tightly. | Serre-moi fort la main.
traditionally | traditionnellement | adv | B1 | /trəˈdɪʃənəli/ | Dates are traditionally eaten to break the fast. | On rompt traditionnellement le jeûne avec des dattes.
unexpectedly | de façon inattendue | adv | B1 | /ˌʌnɪkˈspektɪdli/ | He arrived unexpectedly. | Il est arrivé à l'improviste.
unfairly | injustement | adv | B1 | /ˌʌnˈfeəli/ | She was treated unfairly. | Elle a été traitée injustement.
unusually | exceptionnellement, inhabituellement | adv | B1 | /ʌnˈjuːʒuəli/ | It's unusually warm for November. | Il fait exceptionnellement doux pour novembre.
violently | violemment | adv | B1 | /ˈvaɪələntli/ | The ship shook violently. | Le navire a tangué violemment.
visually | visuellement | adv | B2 | /ˈvɪʒuəli/ | The film is visually stunning. | Le film est visuellement époustouflant.
vividly | de façon saisissante, nettement | adv | B2 | /ˈvɪvɪdli/ | I vividly remember my first day at school. | Je me souviens très nettement de mon premier jour d'école.
warmly | chaleureusement | adv | B1 | /ˈwɔːmli/ | They welcomed us warmly. | Ils nous ont accueillis chaleureusement.
westward | vers l'ouest | adv | B2 | /ˈwestwəd/ | The settlers moved westward. | Les colons se sont déplacés vers l'ouest.
wildly | sauvagement ; follement | adv | B1 | /ˈwaɪldli/ | The crowd cheered wildly. | La foule applaudissait à tout rompre.
abnormally | anormalement | adv | B2 | /æbˈnɔːməli/ | It's abnormally hot for May. | Il fait anormalement chaud pour un mois de mai.
abruptly | brusquement | adv | B2 | /əˈbrʌptli/ | The meeting ended abruptly. | La réunion s'est terminée brusquement.
actively | activement | adv | B2 | /ˈæktɪvli/ | She is actively looking for a job. | Elle cherche activement un emploi.
additionally | en outre, de plus | adv | B2 | /əˈdɪʃənəli/ | Additionally, the hotel offers free parking. | De plus, l'hôtel propose un parking gratuit.
adequately | suffisamment, convenablement | adv | B2 | /ˈædɪkwətli/ | Are you adequately prepared? | Es-tu suffisamment préparé ?
admiringly | avec admiration | adv | B2 | /ədˈmaɪərɪŋli/ | She looked at him admiringly. | Elle le regardait avec admiration.
adversely | défavorablement | adv | C1 | /ˈædvɜːsli/ | The crops were adversely affected by drought. | Les récoltes ont pâti de la sécheresse.
affectionately | affectueusement | adv | B2 | /əˈfekʃənətli/ | She hugged her son affectionately. | Elle a serré son fils affectueusement dans ses bras.
aggressively | agressivement | adv | B2 | /əˈɡresɪvli/ | The dog barked aggressively. | Le chien aboyait agressivement.
amazingly | étonnamment | adv | B2 | /əˈmeɪzɪŋli/ | Amazingly, nobody was hurt. | Étonnamment, personne n'a été blessé.
appropriately | de manière appropriée | adv | B2 | /əˈprəʊpriətli/ | Please dress appropriately. | Veuillez vous habiller de manière appropriée.
artificially | artificiellement | adv | B2 | /ˌɑːtɪˈfɪʃəli/ | The fruit was artificially coloured. | Les fruits étaient colorés artificiellement.
attentively | attentivement | adv | B2 | /əˈtentɪvli/ | The students listened attentively. | Les élèves écoutaient attentivement.
bitterly | amèrement ; terriblement | adv | B2 | /ˈbɪtəli/ | It was bitterly cold. | Il faisait un froid glacial.
blindly | aveuglément | adv | B2 | /ˈblaɪndli/ | Don't follow anyone blindly. | Ne suis personne aveuglément.
brilliantly | brillamment | adv | B2 | /ˈbrɪliəntli/ | She played brilliantly. | Elle a joué brillamment.
broadly | globalement, en gros | adv | B2 | /ˈbrɔːdli/ | Broadly speaking, I agree. | En gros, je suis d'accord.
calmly | calmement | adv | B2 | /ˈkɑːmli/ | She answered calmly. | Elle a répondu calmement.
cheerfully | gaiement, joyeusement | adv | B2 | /ˈtʃɪəfəli/ | She waved cheerfully. | Elle a fait un signe joyeux de la main.
comfortably | confortablement | adv | B2 | /ˈkʌmftəbli/ | Sit comfortably and relax. | Assieds-toi confortablement et détends-toi.
confidently | avec assurance | adv | B2 | /ˈkɒnfɪdəntli/ | She spoke confidently. | Elle a parlé avec assurance.
considerably | considérablement | adv | B2 | /kənˈsɪdərəbli/ | Prices have risen considerably. | Les prix ont considérablement augmenté.
conveniently | commodément, opportunément | adv | B2 | /kənˈviːniəntli/ | The hotel is conveniently located. | L'hôtel est idéalement situé.
creatively | de façon créative | adv | B2 | /kriˈeɪtɪvli/ | Think creatively! | Fais preuve de créativité !
critically | de façon critique ; gravement | adv | B2 | /ˈkrɪtɪkli/ | He is critically ill. | Il est gravement malade.
crossly | avec humeur | adv | B2 | /ˈkrɒsli/ | "Leave me alone," she said crossly. | « Laisse-moi tranquille », dit-elle avec humeur.
cruelly | cruellement | adv | B2 | /ˈkruːəli/ | The animals were cruelly treated. | Les animaux étaient traités cruellement.
culturally | culturellement | adv | B2 | /ˈkʌltʃərəli/ | The city is culturally diverse. | La ville est culturellement diverse.
dearly | chèrement, profondément | adv | B2 | /ˈdɪəli/ | I love my parents dearly. | J'aime profondément mes parents.
delicately | délicatement | adv | B2 | /ˈdelɪkətli/ | She delicately removed the splinter. | Elle a délicatement retiré l'écharde.
densely | densément | adv | B2 | /ˈdensli/ | It's a densely populated city. | C'est une ville densément peuplée.
desperately | désespérément | adv | B2 | /ˈdespərətli/ | They desperately need help. | Ils ont désespérément besoin d'aide.
doubly | doublement | adv | B2 | /ˈdʌbli/ | Be doubly careful on wet roads. | Sois doublement prudent sur route mouillée.
dramatically | de façon spectaculaire | adv | B2 | /drəˈmætɪkli/ | Prices have fallen dramatically. | Les prix ont chuté de façon spectaculaire.
eagerly | avec impatience, avidement | adv | B2 | /ˈiːɡəli/ | The children waited eagerly for the holidays. | Les enfants attendaient les vacances avec impatience.
eastward | vers l'est | adv | B2 | /ˈiːstwəd/ | The storm is moving eastward. | La tempête se déplace vers l'est.
ecologically | écologiquement | adv | B2 | /ˌiːkəˈlɒdʒɪkli/ | The area is ecologically important. | La zone est importante sur le plan écologique.
effectively | efficacement ; en fait | adv | B2 | /ɪˈfektɪvli/ | The medicine works effectively. | Le médicament agit efficacement.
electronically | électroniquement | adv | B2 | /ɪˌlekˈtrɒnɪkli/ | You can pay electronically. | Vous pouvez payer par voie électronique.
elegantly | élégamment | adv | B2 | /ˈelɪɡəntli/ | The room was elegantly decorated. | La pièce était élégamment décorée.
emphatically | catégoriquement | adv | C1 | /ɪmˈfætɪkli/ | He emphatically denied the rumour. | Il a démenti catégoriquement la rumeur.
endlessly | sans fin, sans cesse | adv | B2 | /ˈendləsli/ | He talks endlessly about football. | Il parle sans cesse de football.
enthusiastically | avec enthousiasme | adv | B2 | /ɪnˌθjuːziˈæstɪkli/ | The crowd cheered enthusiastically. | La foule a applaudi avec enthousiasme.
environmentally | écologiquement | adv | B2 | /ɪnˌvaɪrənˈmentəli/ | Choose environmentally friendly products. | Choisis des produits respectueux de l'environnement.
eternally | éternellement | adv | B2 | /ɪˈtɜːnəli/ | I'll be eternally grateful. | Je te serai éternellement reconnaissant.
exceptionally | exceptionnellement | adv | B2 | /ɪkˈsepʃənəli/ | He's an exceptionally gifted child. | C'est un enfant exceptionnellement doué.
exclusively | exclusivement | adv | B2 | /ɪkˈskluːsɪvli/ | The offer is exclusively for members. | L'offre est réservée exclusivement aux membres.
extraordinarily | extraordinairement | adv | B2 | /ɪkˈstrɔːdnrəli/ | She is extraordinarily talented. | Elle est extraordinairement douée.
fantastically | fantastiquement | adv | B2 | /fænˈtæstɪkli/ | The plan worked fantastically well. | Le plan a fonctionné à merveille.
finely | finement | adv | B2 | /ˈfaɪnli/ | Chop the onions finely. | Hache finement les oignons.
flexibly | avec souplesse | adv | B2 | /ˈfleksəbli/ | We work flexibly from home. | Nous travaillons de chez nous avec des horaires souples.
fondly | tendrement, avec affection | adv | B2 | /ˈfɒndli/ | I fondly remember my grandmother's kitchen. | Je garde un tendre souvenir de la cuisine de ma grand-mère.
foolishly | bêtement | adv | B2 | /ˈfuːlɪʃli/ | I foolishly forgot my passport. | J'ai bêtement oublié mon passeport.
forcefully | avec force, vigoureusement | adv | B2 | /ˈfɔːsfəli/ | She argued forcefully for change. | Elle a plaidé vigoureusement pour le changement.
frantically | frénétiquement | adv | B2 | /ˈfræntɪkli/ | She searched frantically for her keys. | Elle cherchait frénétiquement ses clés.
furiously | furieusement | adv | B2 | /ˈfjʊəriəsli/ | He shouted furiously. | Il criait furieusement.
generously | généreusement | adv | B2 | /ˈdʒenərəsli/ | They gave generously to the poor. | Ils ont donné généreusement aux pauvres.
genuinely | sincèrement, véritablement | adv | B2 | /ˈdʒenjuɪnli/ | I'm genuinely sorry. | Je suis sincèrement désolé.
globally | mondialement | adv | B2 | /ˈɡləʊbəli/ | The brand is known globally. | La marque est connue dans le monde entier.
graphically | de façon très crue, graphiquement | adv | C1 | /ˈɡræfɪkli/ | The film graphically shows the war. | Le film montre la guerre de façon très crue.
hastily | à la hâte | adv | B2 | /ˈheɪstɪli/ | He hastily packed his bag. | Il a fait son sac à la hâte.
hugely | énormément | adv | B2 | /ˈhjuːdʒli/ | The book was hugely successful. | Le livre a connu un énorme succès.
impatiently | avec impatience | adv | B2 | /ɪmˈpeɪʃntli/ | He tapped his foot impatiently. | Il tapait du pied avec impatience.
impolitely | impoliment | adv | B2 | /ˌɪmpəˈlaɪtli/ | He spoke impolitely to the waiter. | Il a parlé impoliment au serveur.
improperly | incorrectement, de façon inconvenante | adv | B2 | /ɪmˈprɒpəli/ | The machine was used improperly. | La machine a été mal utilisée.
independently | de façon indépendante | adv | B2 | /ˌɪndɪˈpendəntli/ | The children work independently. | Les enfants travaillent en autonomie.
innocently | innocemment | adv | B2 | /ˈɪnəsntli/ | "What did I do?" he asked innocently. | « Qu'est-ce que j'ai fait ? » demanda-t-il innocemment.
invariably | invariablement, toujours | adv | C1 | /ɪnˈveəriəbli/ | He's invariably late. | Il est invariablement en retard.
invitingly | de façon engageante | adv | C1 | /ɪnˈvaɪtɪŋli/ | The sea looked invitingly blue. | La mer était d'un bleu invitant.
ironically | ironiquement | adv | B2 | /aɪˈrɒnɪkli/ | Ironically, the fire station burned down. | Ironie du sort, la caserne des pompiers a brûlé.
irresistibly | irrésistiblement | adv | C1 | /ˌɪrɪˈzɪstəbli/ | She was irresistibly drawn to the sea. | Elle était irrésistiblement attirée par la mer.
jealously | jalousement | adv | B2 | /ˈdʒeləsli/ | He jealously guards his secrets. | Il garde jalousement ses secrets.
knowingly | sciemment ; d'un air entendu | adv | C1 | /ˈnəʊɪŋli/ | He would never knowingly lie. | Il ne mentirait jamais sciemment.
leisurely | tranquillement, sans se presser | adv | B2 | /ˈleʒəli/ | We walked leisurely along the river. | Nous nous sommes promenés tranquillement le long de la rivière.
loosely | sans serrer ; vaguement | adv | B2 | /ˈluːsli/ | The film is loosely based on a true story. | Le film s'inspire librement d'une histoire vraie.
momentarily | momentanément | adv | C1 | /ˈməʊməntrəli/ | He was momentarily confused. | Il a été momentanément désorienté.
narrowly | de justesse | adv | B2 | /ˈnærəʊli/ | He narrowly escaped death. | Il a échappé de justesse à la mort.
necessarily | forcément, nécessairement | adv | B2 | /ˌnesəˈserəli/ | Expensive doesn't necessarily mean good. | Cher ne veut pas forcément dire bon.
negatively | négativement | adv | B2 | /ˈneɡətɪvli/ | Stress affects health negatively. | Le stress nuit à la santé.
nicely | joliment, gentiment | adv | B2 | /ˈnaɪsli/ | Ask nicely and I'll help you. | Demande gentiment et je t'aiderai.
northward | vers le nord | adv | B2 | /ˈnɔːθwəd/ | The birds fly northward in spring. | Les oiseaux migrent vers le nord au printemps.
offhand | au pied levé, de mémoire | adv | C1 | /ˌɒfˈhænd/ | I can't tell you offhand. | Je ne peux pas te le dire comme ça, de mémoire.
outwardly | en apparence | adv | C1 | /ˈaʊtwədli/ | Outwardly, she seemed calm. | En apparence, elle semblait calme.
overly | trop, excessivement | adv | B2 | /ˈəʊvəli/ | Don't be overly worried. | Ne t'inquiète pas outre mesure.
passionately | passionnément | adv | B2 | /ˈpæʃənətli/ | He spoke passionately about justice. | Il a parlé de la justice avec passion.
peacefully | paisiblement | adv | B2 | /ˈpiːsfəli/ | He died peacefully in his sleep. | Il est mort paisiblement dans son sommeil.
potentially | potentiellement | adv | B2 | /pəˈtenʃəli/ | This is potentially dangerous. | C'est potentiellement dangereux.
powerfully | puissamment | adv | B2 | /ˈpaʊəfəli/ | He's a powerfully built man. | C'est un homme puissamment bâti.
preferably | de préférence | adv | B2 | /ˈprefrəbli/ | Come early, preferably before nine. | Viens tôt, de préférence avant neuf heures.
promptly | rapidement, ponctuellement | adv | B2 | /ˈprɒmptli/ | She replied promptly. | Elle a répondu rapidement.
psychologically | psychologiquement | adv | B2 | /ˌsaɪkəˈlɒdʒɪkli/ | He was psychologically prepared. | Il était psychologiquement préparé.
radically | radicalement | adv | B2 | /ˈrædɪkli/ | The town has changed radically. | La ville a radicalement changé.
readily | volontiers ; facilement | adv | B2 | /ˈredɪli/ | She readily agreed to help. | Elle a volontiers accepté d'aider.
reasonably | raisonnablement ; assez | adv | B2 | /ˈriːznəbli/ | The hotel is reasonably priced. | L'hôtel est à un prix raisonnable.
regardless | malgré tout, quand même | adv | B2 | /rɪˈɡɑːdləs/ | It was raining, but we went out regardless. | Il pleuvait, mais nous sommes sortis malgré tout.
regrettably | malheureusement | adv | C1 | /rɪˈɡretəbli/ | Regrettably, the event was cancelled. | Malheureusement, l'événement a été annulé.
remarkably | remarquablement | adv | B2 | /rɪˈmɑːkəbli/ | She is remarkably calm. | Elle est remarquablement calme.
respectably | convenablement | adv | C1 | /rɪˈspektəbli/ | Dress respectably for the interview. | Habille-toi convenablement pour l'entretien.
rightly | à juste titre | adv | B2 | /ˈraɪtli/ | She was rightly proud of her son. | Elle était fière de son fils, à juste titre.
sharply | brusquement, nettement | adv | B2 | /ˈʃɑːpli/ | Prices rose sharply. | Les prix ont fortement augmenté.
significantly | considérablement, nettement | adv | B2 | /sɪɡˈnɪfɪkəntli/ | Sales increased significantly. | Les ventes ont nettement augmenté.
skilfully | habilement | adv | B2 | /ˈskɪlfəli/ | She skilfully avoided the question. | Elle a habilement esquivé la question.
skyward | vers le ciel | adv | C1 | /ˈskaɪwəd/ | He raised his hands skyward in prayer. | Il a levé les mains vers le ciel pour prier.
southward | vers le sud | adv | B2 | /ˈsaʊθwəd/ | The birds fly southward in autumn. | Les oiseaux migrent vers le sud en automne.
strictly | strictement | adv | B2 | /ˈstrɪktli/ | Smoking is strictly forbidden. | Il est strictement interdit de fumer.
stubbornly | obstinément | adv | B2 | /ˈstʌbənli/ | He stubbornly refused to apologise. | Il a refusé obstinément de s'excuser.
sufficiently | suffisamment | adv | B2 | /səˈfɪʃntli/ | He has recovered sufficiently to go home. | Il s'est suffisamment rétabli pour rentrer chez lui.
suitably | convenablement | adv | B2 | /ˈsuːtəbli/ | Come suitably dressed. | Viens habillé de façon appropriée.
suspiciously | de façon suspecte, avec méfiance | adv | B2 | /səˈspɪʃəsli/ | He looked at me suspiciously. | Il m'a regardé avec méfiance.
temporarily | temporairement | adv | B2 | /ˈtemprərəli/ | The shop is temporarily closed. | Le magasin est temporairement fermé.
tenderly | tendrement | adv | B2 | /ˈtendəli/ | She kissed the baby tenderly. | Elle a embrassé le bébé tendrement.
thickly | en couche épaisse ; densément | adv | B2 | /ˈθɪkli/ | Spread the honey thickly. | Étale une épaisse couche de miel.
tremendously | énormément | adv | B2 | /trəˈmendəsli/ | I enjoyed it tremendously. | Ça m'a énormément plu.
unashamedly | sans honte, ouvertement | adv | C1 | /ˌʌnəˈʃeɪmɪdli/ | He is unashamedly ambitious. | Il est ouvertement ambitieux.
uncomfortably | inconfortablement, mal à l'aise | adv | B2 | /ʌnˈkʌmftəbli/ | He shifted uncomfortably in his chair. | Il remuait, mal à l'aise, sur sa chaise.
uneasily | avec inquiétude, mal à l'aise | adv | B2 | /ʌnˈiːzɪli/ | She laughed uneasily. | Elle a ri, mal à l'aise.
unimaginably | incroyablement | adv | C1 | /ˌʌnɪˈmædʒɪnəbli/ | The universe is unimaginably vast. | L'univers est incroyablement vaste.
unjustly | injustement | adv | B2 | /ʌnˈdʒʌstli/ | He was unjustly accused. | Il a été accusé injustement.
unmistakably | indéniablement | adv | C1 | /ˌʌnmɪˈsteɪkəbli/ | The style is unmistakably French. | Le style est indéniablement français.
unthinkably | de façon impensable | adv | C1 | /ʌnˈθɪŋkəbli/ | It was unthinkably cruel. | C'était d'une cruauté impensable.
urgently | d'urgence | adv | B2 | /ˈɜːdʒəntli/ | We urgently need blood donors. | Nous avons besoin de donneurs de sang de toute urgence.
verbally | verbalement | adv | B2 | /ˈvɜːbəli/ | He was verbally abused. | Il a été insulté.
vigorously | vigoureusement | adv | C1 | /ˈvɪɡərəsli/ | He denied the charges vigorously. | Il a nié vigoureusement les accusations.
visibly | visiblement | adv | B2 | /ˈvɪzəbli/ | She was visibly upset. | Elle était visiblement contrariée.
weakly | faiblement | adv | B2 | /ˈwiːkli/ | She smiled weakly. | Elle a souri faiblement.
willingly | volontiers, de bon gré | adv | B2 | /ˈwɪlɪŋli/ | He willingly helped us. | Il nous a aidés de bon gré.
wordlessly | sans un mot | adv | C1 | /ˈwɜːdləsli/ | She wordlessly handed him the letter. | Elle lui a tendu la lettre sans un mot.
wrongly | à tort | adv | B2 | /ˈrɒŋli/ | He was wrongly accused. | Il a été accusé à tort.
halfway | à mi-chemin | adv | B2 | /ˌhɑːfˈweɪ/ | We stopped halfway to Paris. | Nous nous sommes arrêtés à mi-chemin de Paris.
inevitably | inévitablement | adv | B2 | /ɪnˈevɪtəbli/ | Inevitably, prices went up. | Inévitablement, les prix ont augmenté.
midway | à mi-chemin | adv | C1 | /ˌmɪdˈweɪ/ | The village lies midway between the two towns. | Le village se trouve à mi-chemin entre les deux villes.
downhill | en descendant | adv | B2 | /ˌdaʊnˈhɪl/ | We cycled downhill. | Nous avons descendu la côte à vélo.
drastically | radicalement, de façon drastique | adv | C1 | /ˈdræstɪkli/ | Prices have fallen drastically. | Les prix ont chuté de façon drastique.
downstream | en aval | adv | C1 | /ˌdaʊnˈstriːm/ | The boat drifted downstream. | Le bateau a dérivé vers l'aval.
upstream | en amont | adv | C1 | /ˌʌpˈstriːm/ | Salmon swim upstream. | Les saumons remontent le courant.
ashore | à terre, sur le rivage | adv | C1 | /əˈʃɔː/ | The sailors went ashore. | Les marins sont descendus à terre.
horribly | horriblement | adv | B2 | /ˈhɒrəbli/ | Things went horribly wrong. | Les choses ont horriblement mal tourné.
forcibly | de force | adv | C1 | /ˈfɔːsəbli/ | They were forcibly removed. | Ils ont été expulsés de force.
onward | en avant, au-delà | adv | C1 | /ˈɒnwəd/ | From that day onward, he prayed every day. | À partir de ce jour, il a prié tous les jours.
duly | dûment, comme prévu | adv | C2 | /ˈdjuːli/ | The form was duly signed. | Le formulaire a été dûment signé.
reliably | de façon fiable | adv | C1 | /rɪˈlaɪəbli/ | The car runs reliably. | La voiture fonctionne de manière fiable.
aft | à l'arrière (bateau) | adv | C2 | /ɑːft/ | The cabins are aft. | Les cabines sont à l'arrière.
barefoot | pieds nus | adv | B2 | /ˈbeəfʊt/ | The children ran barefoot on the beach. | Les enfants couraient pieds nus sur la plage.
downright | carrément, franchement | adv | C1 | /ˈdaʊnraɪt/ | He was downright rude. | Il a été carrément grossier.
uphill | en montée | adv | B2 | /ˌʌpˈhɪl/ | We walked uphill for an hour. | Nous avons marché en montée pendant une heure.
noticeably | sensiblement, visiblement | adv | C1 | /ˈnəʊtɪsəbli/ | It's noticeably colder today. | Il fait nettement plus froid aujourd'hui.
reluctantly | à contrecœur | adv | C1 | /rɪˈlʌktəntli/ | He reluctantly agreed. | Il a accepté à contrecœur.
dynamically | dynamiquement | adv | C1 | /daɪˈnæmɪkli/ | The page updates dynamically. | La page se met à jour dynamiquement.
refreshingly | agréablement | adv | C1 | /rɪˈfreʃɪŋli/ | He was refreshingly honest. | Son honnêteté était rafraîchissante.
enormously | énormément | adv | C1 | /ɪˈnɔːməsli/ | The trip was enormously enjoyable. | Le voyage a été extrêmement agréable.
ordinarily | d'ordinaire | adv | C1 | /ˈɔːdnrəli/ | Ordinarily, I walk to work. | D'ordinaire, je vais au travail à pied.
cleanly | proprement, net | adv | C1 | /ˈkliːnli/ | The branch broke cleanly. | La branche s'est cassée net.
tactfully | avec tact | adv | C1 | /ˈtæktfəli/ | He tactfully changed the subject. | Il a changé de sujet avec tact.
subtly | subtilement | adv | C1 | /ˈsʌtli/ | The colours change subtly. | Les couleurs changent subtilement.
placidly | placidement | adv | C1 | /ˈplæsɪdli/ | The cows grazed placidly. | Les vaches broutaient paisiblement.
viciously | méchamment, sauvagement | adv | C1 | /ˈvɪʃəsli/ | The dog bit him viciously. | Le chien l'a mordu sauvagement.
persuasively | de façon persuasive | adv | C1 | /pəˈsweɪsɪvli/ | She argued persuasively. | Elle a argumenté de façon convaincante.
inexplicably | inexplicablement | adv | C1 | /ˌɪnɪkˈsplɪkəbli/ | The lights inexplicably went out. | Les lumières se sont éteintes inexplicablement.
smugly | d'un air suffisant | adv | C1 | /ˈsmʌɡli/ | He smiled smugly. | Il a souri d'un air suffisant.
ecstatically | avec extase | adv | C1 | /ɪkˈstætɪkli/ | The fans cheered ecstatically. | Les fans acclamaient avec ferveur.
substantially | considérablement | adv | C1 | /səbˈstænʃəli/ | Prices have risen substantially. | Les prix ont considérablement augmenté.
favourably | favorablement | adv | C1 | /ˈfeɪvərəbli/ | The critics reviewed the book favourably. | Les critiques ont accueilli le livre favorablement.
conscientiously | consciencieusement | adv | C1 | /ˌkɒnʃiˈenʃəsli/ | She works conscientiously. | Elle travaille consciencieusement.
indefinitely | indéfiniment | adv | C1 | /ɪnˈdefɪnətli/ | The meeting was postponed indefinitely. | La réunion a été reportée sine die.
robustly | vigoureusement, solidement | adv | C1 | /rəʊˈbʌstli/ | The bridge is robustly built. | Le pont est solidement construit.
remotely | à distance ; vaguement | adv | C1 | /rɪˈməʊtli/ | I work remotely. | Je travaille à distance.
chaotically | chaotiquement | adv | C1 | /keɪˈɒtɪkli/ | People ran chaotically in all directions. | Les gens couraient dans tous les sens.
victoriously | victorieusement | adv | C1 | /vɪkˈtɔːriəsli/ | He raised his arms victoriously. | Il a levé les bras en signe de victoire.
profoundly | profondément | adv | C1 | /prəˈfaʊndli/ | I was profoundly moved. | J'ai été profondément ému.
baldly | crûment, sans détour | adv | C1 | /ˈbɔːldli/ | He stated the facts baldly. | Il a exposé les faits sans détour.
artistically | artistiquement | adv | C1 | /ɑːˈtɪstɪkli/ | The dish was artistically presented. | Le plat était présenté avec art.
ceaselessly | sans cesse | adv | C1 | /ˈsiːsləsli/ | The angels glorify God ceaselessly. | Les anges glorifient Dieu sans cesse.
superficially | superficiellement | adv | C1 | /ˌsuːpəˈfɪʃəli/ | Superficially, they look alike. | En apparence, ils se ressemblent.
aesthetically | esthétiquement | adv | C1 | /iːsˈθetɪkli/ | The design is aesthetically pleasing. | Le design est agréable à l'œil.
plausibly | de façon plausible | adv | C1 | /ˈplɔːzəbli/ | He could plausibly claim ignorance. | Il pourrait vraisemblablement plaider l'ignorance.
instinctively | instinctivement | adv | C1 | /ɪnˈstɪŋktɪvli/ | He instinctively stepped back. | Il a instinctivement reculé.
inherently | intrinsèquement | adv | C1 | /ɪnˈhɪərəntli/ | Humans are inherently social. | Les êtres humains sont intrinsèquement sociaux.
spontaneously | spontanément | adv | C1 | /spɒnˈteɪniəsli/ | The crowd spontaneously applauded. | La foule a spontanément applaudi.
aimlessly | sans but | adv | C1 | /ˈeɪmləsli/ | We wandered aimlessly through the streets. | Nous avons erré sans but dans les rues.
candidly | franchement | adv | C1 | /ˈkændɪdli/ | She spoke candidly about her past. | Elle a parlé franchement de son passé.
animatedly | avec animation | adv | C1 | /ˈænɪmeɪtɪdli/ | They talked animatedly about the match. | Ils parlaient du match avec animation.
tediously | fastidieusement | adv | C1 | /ˈtiːdiəsli/ | The speech went on tediously. | Le discours s'éternisait de façon fastidieuse.
immensely | immensément | adv | C1 | /ɪˈmensli/ | I enjoyed the book immensely. | J'ai énormément aimé le livre.
structurally | structurellement | adv | C1 | /ˈstrʌktʃərəli/ | The building is structurally sound. | Le bâtiment est structurellement solide.
frostily | froidement | adv | C1 | /ˈfrɒstɪli/ | She answered frostily. | Elle a répondu froidement.
gamely | courageusement | adv | C1 | /ˈɡeɪmli/ | She gamely tried to sing. | Elle a courageusement essayé de chanter.
conditionally | sous condition | adv | C1 | /kənˈdɪʃənəli/ | He was conditionally released. | Il a été libéré sous condition.
fiercely | farouchement, férocement | adv | C1 | /ˈfɪəsli/ | She is fiercely independent. | Elle est farouchement indépendante.
dutifully | consciencieusement | adv | C1 | /ˈdjuːtɪfəli/ | She dutifully visited her grandmother every week. | Elle rendait consciencieusement visite à sa grand-mère chaque semaine.
amply | amplement | adv | C1 | /ˈæmpli/ | He was amply rewarded. | Il a été amplement récompensé.
wickedly | méchamment ; malicieusement | adv | C1 | /ˈwɪkɪdli/ | She smiled wickedly. | Elle a souri malicieusement.
blithely | allègrement, avec insouciance | adv | C1 | /ˈblaɪðli/ | He blithely ignored the warnings. | Il a allègrement ignoré les avertissements.
ethically | éthiquement | adv | C1 | /ˈeθɪkli/ | The company behaved ethically. | L'entreprise s'est comportée de façon éthique.
justly | justement, avec justice | adv | C1 | /ˈdʒʌstli/ | Rule justly among people. | Gouverne les gens avec justice.
wryly | avec ironie | adv | C1 | /ˈraɪli/ | "Lucky me," she said wryly. | « Quelle chance j'ai », dit-elle avec ironie.
domestically | sur le plan intérieur | adv | C1 | /dəˈmestɪkli/ | The product is sold domestically and abroad. | Le produit est vendu en France et à l'étranger.
principally | principalement | adv | C1 | /ˈprɪnsəpli/ | The course is aimed principally at adults. | Le cours s'adresse principalement aux adultes.
voluntarily | volontairement, de plein gré | adv | C1 | /ˈvɒləntrəli/ | He left voluntarily. | Il est parti de son plein gré.
sustainably | de manière durable | adv | C1 | /səˈsteɪnəbli/ | The fish is caught sustainably. | Le poisson est pêché de façon durable.
cynically | cyniquement | adv | C1 | /ˈsɪnɪkli/ | He smiled cynically. | Il a souri d'un air cynique.
sarcastically | de façon sarcastique | adv | C1 | /sɑːˈkæstɪkli/ | "Great idea," he said sarcastically. | « Super idée », dit-il d'un ton sarcastique.
intuitively | intuitivement | adv | C1 | /ɪnˈtjuːɪtɪvli/ | She knew intuitively that something was wrong. | Elle savait intuitivement que quelque chose n'allait pas.
marginally | légèrement, à peine | adv | C1 | /ˈmɑːdʒɪnəli/ | Prices rose marginally. | Les prix ont très légèrement augmenté.
crudely | grossièrement | adv | C1 | /ˈkruːdli/ | The sign was crudely painted. | Le panneau était grossièrement peint.
fanatically | fanatiquement | adv | C1 | /fəˈnætɪkli/ | They fanatically support their team. | Ils soutiennent leur équipe avec fanatisme.
astray | dans l'erreur ; égaré | adv | C1 | /əˈstreɪ/ | Bad friends can lead you astray. | Les mauvaises fréquentations peuvent t'égarer.
naively | naïvement | adv | C1 | /naɪˈiːvli/ | I naively believed him. | Je l'ai cru naïvement.
irately | avec colère | adv | C1 | /aɪˈreɪtli/ | He complained irately to the manager. | Il s'est plaint avec colère auprès du responsable.
fiendishly | diaboliquement | adv | C2 | /ˈfiːndɪʃli/ | The puzzle is fiendishly difficult. | Le casse-tête est diaboliquement difficile.
temperamentally | de tempérament | adv | C2 | /ˌtemprəˈmentəli/ | They are temperamentally different. | Ils ont des tempéraments différents.
phenomenally | phénoménalement | adv | C1 | /fəˈnɒmɪnəli/ | She is phenomenally talented. | Elle est d'un talent phénoménal.
acutely | vivement, profondément | adv | C1 | /əˈkjuːtli/ | I'm acutely aware of the problem. | Je suis parfaitement conscient du problème.
commercially | commercialement | adv | C1 | /kəˈmɜːʃəli/ | The film was commercially successful. | Le film a été un succès commercial.
benignly | avec bienveillance | adv | C2 | /bɪˈnaɪnli/ | He smiled benignly at the children. | Il souriait aux enfants avec bienveillance.
explosively | de façon explosive | adv | C1 | /ɪkˈspləʊsɪvli/ | The market grew explosively. | Le marché a connu une croissance explosive.
synthetically | synthétiquement | adv | C2 | /sɪnˈθetɪkli/ | The drug is produced synthetically. | Le médicament est produit par synthèse.
appallingly | épouvantablement | adv | C1 | /əˈpɔːlɪŋli/ | They were appallingly treated. | Ils ont été épouvantablement traités.
monotonously | de façon monotone | adv | C1 | /məˈnɒtənəsli/ | The rain fell monotonously. | La pluie tombait de façon monotone.
remorsefully | avec remords | adv | C2 | /rɪˈmɔːsfəli/ | He looked at her remorsefully. | Il l'a regardée avec remords.
indignantly | avec indignation | adv | C2 | /ɪnˈdɪɡnəntli/ | "That's not fair!" she said indignantly. | « Ce n'est pas juste ! » dit-elle avec indignation.
callously | sans pitié | adv | C2 | /ˈkæləsli/ | He callously ignored the beggar. | Il a ignoré le mendiant sans pitié.
indulgently | avec indulgence | adv | C2 | /ɪnˈdʌldʒəntli/ | She smiled indulgently at the child. | Elle a souri à l'enfant avec indulgence.
tenaciously | avec ténacité | adv | C2 | /təˈneɪʃəsli/ | He clung tenaciously to his beliefs. | Il s'accrochait avec ténacité à ses convictions.
unequivocally | sans équivoque | adv | C2 | /ˌʌnɪˈkwɪvəkəli/ | He unequivocally condemned the attack. | Il a condamné l'attaque sans équivoque.
nostalgically | avec nostalgie | adv | C2 | /nɒˈstældʒɪkli/ | He spoke nostalgically of his youth. | Il parlait de sa jeunesse avec nostalgie.
proportionally | proportionnellement | adv | C2 | /prəˈpɔːʃənəli/ | Costs rose proportionally. | Les coûts ont augmenté proportionnellement.
autonomously | de façon autonome | adv | C2 | /ɔːˈtɒnəməsli/ | The robot works autonomously. | Le robot travaille de manière autonome.
notoriously | notoirement | adv | C2 | /nəʊˈtɔːriəsli/ | The trains are notoriously late. | Les trains sont notoirement en retard.
haphazardly | au petit bonheur | adv | C2 | /hæpˈhæzədli/ | Clothes were thrown haphazardly on the bed. | Des vêtements étaient jetés pêle-mêle sur le lit.
abundantly | abondamment ; parfaitement | adv | C2 | /əˈbʌndəntli/ | He made it abundantly clear. | Il l'a dit très clairement.
painstakingly | minutieusement | adv | C2 | /ˈpeɪnzteɪkɪŋli/ | She painstakingly copied the manuscript. | Elle a recopié le manuscrit avec minutie.
chronologically | chronologiquement | adv | C2 | /ˌkrɒnəˈlɒdʒɪkli/ | The events are listed chronologically. | Les événements sont classés par ordre chronologique.
irrevocably | irrévocablement | adv | C2 | /ɪˈrevəkəbli/ | Their lives were irrevocably changed. | Leurs vies ont été irrévocablement changées.
imperceptibly | imperceptiblement | adv | C2 | /ˌɪmpəˈseptəbli/ | The light faded imperceptibly. | La lumière a décliné imperceptiblement.
catastrophically | catastrophiquement | adv | C2 | /ˌkætəˈstrɒfɪkli/ | The plan failed catastrophically. | Le plan a échoué de façon catastrophique.
venomously | avec venin | adv | C2 | /ˈvenəməsli/ | She spoke venomously about her rival. | Elle parlait de sa rivale avec venin.
intrinsically | intrinsèquement | adv | C2 | /ɪnˈtrɪnsɪkli/ | Human life is intrinsically valuable. | La vie humaine a une valeur intrinsèque.
nonchalantly | nonchalamment | adv | C2 | /ˈnɒnʃələntli/ | She shrugged nonchalantly. | Elle a haussé les épaules d'un air désinvolte.
ostensibly | en apparence | adv | C2 | /ɒˈstensəbli/ | He was ostensibly on holiday. | Il était officiellement en vacances.
nigh | presque, proche (littéraire) | adv | C2 | /naɪ/ | The end of the world is nigh. | La fin du monde est proche.
austerely | austèrement | adv | C2 | /ɒˈstɪəli/ | The room was austerely furnished. | La pièce était meublée de façon austère.
figuratively | au sens figuré | adv | C2 | /ˈfɪɡərətɪvli/ | I'm speaking figuratively. | Je parle au sens figuré.
dubiously | d'un air dubitatif | adv | C2 | /ˈdjuːbiəsli/ | She looked at the food dubiously. | Elle a regardé la nourriture d'un air dubitatif.
summarily | sommairement, sur-le-champ | adv | C2 | /ˈsʌmərəli/ | He was summarily dismissed. | Il a été renvoyé sur-le-champ.
magnanimously | avec magnanimité | adv | C2 | /mæɡˈnænɪməsli/ | The Prophet magnanimously forgave the people of Mecca. | Le Prophète a pardonné avec magnanimité aux habitants de La Mecque.
colloquially | familièrement | adv | C2 | /kəˈləʊkwiəli/ | Colloquially, it's called "the tube". | Familièrement, on l'appelle « the tube ».
maliciously | avec malveillance | adv | C2 | /məˈlɪʃəsli/ | He maliciously spread lies. | Il a répandu des mensonges par malveillance.
diligently | assidûment | adv | C2 | /ˈdɪlɪdʒəntli/ | She studied diligently. | Elle a étudié assidûment.
haughtily | avec hauteur | adv | C2 | /ˈhɔːtɪli/ | He haughtily refused. | Il a refusé avec hauteur.
enduringly | durablement | adv | C2 | /ɪnˈdjʊərɪŋli/ | The song is enduringly popular. | La chanson reste populaire.
rhetorically | de façon rhétorique | adv | C2 | /rɪˈtɒrɪkli/ | He asked rhetorically whether anyone would refuse. | Il a demandé, pour la forme, si quelqu'un refuserait.
impeccably | impeccablement | adv | C2 | /ɪmˈpekəbli/ | He was impeccably dressed. | Il était impeccablement habillé.
meticulously | méticuleusement | adv | C2 | /məˈtɪkjələsli/ | The scribes copied the Qur'an meticulously. | Les copistes recopiaient le Coran méticuleusement.
sedately | posément, sans se presser | adv | C2 | /sɪˈdeɪtli/ | The old car moved sedately along. | La vieille voiture avançait tranquillement.
unobtrusively | discrètement | adv | C2 | /ˌʌnəbˈtruːsɪvli/ | He left unobtrusively. | Il est parti discrètement.
compellingly | de façon convaincante | adv | C2 | /kəmˈpelɪŋli/ | She argued compellingly. | Elle a argumenté de manière convaincante.
hauntingly | de façon obsédante | adv | C2 | /ˈhɔːntɪŋli/ | The melody is hauntingly beautiful. | La mélodie est d'une beauté envoûtante.
resoundingly | de façon retentissante | adv | C2 | /rɪˈzaʊndɪŋli/ | The plan was resoundingly rejected. | Le projet a été massivement rejeté.
hysterically | de façon hystérique | adv | C2 | /hɪˈsterɪkli/ | We laughed hysterically. | Nous avons ri aux larmes.
contemptuously | avec mépris | adv | C2 | /kənˈtemptʃuəsli/ | She looked at him contemptuously. | Elle l'a regardé avec mépris.
forlornly | tristement, d'un air abandonné | adv | C2 | /fəˈlɔːnli/ | The dog waited forlornly at the door. | Le chien attendait tristement à la porte.
paradoxically | paradoxalement | adv | C2 | /ˌpærəˈdɒksɪkli/ | Paradoxically, the more he earns, the less he spends. | Paradoxalement, plus il gagne, moins il dépense.
tantalisingly | de façon alléchante | adv | C2 | /ˈtæntəlaɪzɪŋli/ | Victory was tantalisingly close. | La victoire était si proche, à portée de main.
verbatim | mot pour mot | adv | C2 | /vɜːˈbeɪtɪm/ | He repeated the speech verbatim. | Il a répété le discours mot pour mot.
verily | en vérité (archaïque) | adv | C2 | /ˈverɪli/ | Verily, with hardship comes ease. | En vérité, à côté de la difficulté est la facilité.
formidably | redoutablement | adv | C2 | /fɔːˈmɪdəbli/ | She is formidably intelligent. | Elle est redoutablement intelligente.
derisively | avec dérision | adv | C2 | /dɪˈraɪsɪvli/ | He laughed derisively. | Il a ri avec dérision.
arduously | péniblement | adv | C2 | /ˈɑːdʒuəsli/ | They climbed arduously up the mountain. | Ils ont péniblement gravi la montagne.
instantaneously | instantanément | adv | C2 | /ˌɪnstənˈteɪniəsli/ | The message arrived instantaneously. | Le message est arrivé instantanément.
wistfully | avec nostalgie, rêveusement | adv | C2 | /ˈwɪstfəli/ | She looked wistfully at the old photos. | Elle regardait les vieilles photos avec nostalgie.
tacitly | tacitement | adv | C2 | /ˈtæsɪtli/ | He tacitly accepted the offer. | Il a tacitement accepté l'offre.
surreptitiously | subrepticement | adv | C2 | /ˌsʌrəpˈtɪʃəsli/ | He surreptitiously slipped out. | Il s'est éclipsé discrètement.
cogently | de façon convaincante | adv | C2 | /ˈkəʊdʒəntli/ | She argued cogently for reform. | Elle a plaidé de façon convaincante pour la réforme.
wholly | entièrement | adv | C2 | /ˈhəʊlli/ | I'm not wholly convinced. | Je ne suis pas entièrement convaincu.
inexorably | inexorablement | adv | C2 | /ɪnˈeksərəbli/ | Death comes inexorably to all. | La mort vient inexorablement pour tous.
afar | au loin | adv | C2 | /əˈfɑː/ | Pilgrims come from afar. | Les pèlerins viennent de loin.
afloat | à flot | adv | C2 | /əˈfləʊt/ | The company is struggling to stay afloat. | L'entreprise a du mal à rester à flot.
realistically | de façon réaliste | adv | C1 | /ˌriːəˈlɪstɪkli/ | Realistically, we can't finish today. | Pour être réaliste, nous ne pouvons pas finir aujourd'hui.
markedly | nettement | adv | C2 | /ˈmɑːkɪdli/ | Prices have risen markedly. | Les prix ont nettement augmenté.
tragically | tragiquement | adv | C1 | /ˈtrædʒɪkli/ | He died tragically young. | Il est mort tragiquement jeune.
understandably | évidemment, ce qui se comprend | adv | C1 | /ˌʌndəˈstændəbli/ | She was understandably upset. | Elle était contrariée, ce qui se comprend.
oft | souvent (littéraire) | adv | C2 | /ɒft/ | It's an oft-repeated story. | C'est une histoire souvent répétée.
apiece | chacun, par personne | adv | C2 | /əˈpiːs/ | The apples cost twenty pence apiece. | Les pommes coûtent vingt pence pièce.
responsibly | de façon responsable | adv | C1 | /rɪˈspɒnsəbli/ | Please drink water and act responsibly. | Merci d'agir de manière responsable.
overland | par voie de terre | adv | C2 | /ˈəʊvəlænd/ | They travelled overland to India. | Ils ont voyagé par voie de terre jusqu'en Inde.
arbitrarily | arbitrairement | adv | C2 | /ˌɑːbɪˈtrerəli/ | The prisoners were chosen arbitrarily. | Les prisonniers ont été choisis arbitrairement.
anew | à nouveau, de nouveau | adv | C2 | /əˈnjuː/ | Let's start anew. | Recommençons à zéro.
clockwise | dans le sens des aiguilles d'une montre | adv | B2 | /ˈklɒkwaɪz/ | Turn the handle clockwise. | Tourne la poignée dans le sens des aiguilles d'une montre.
anticlockwise | dans le sens inverse des aiguilles d'une montre | adv | B2 | /ˌæntiˈklɒkwaɪz/ | Pilgrims walk around the Kaaba anticlockwise. | Les pèlerins tournent autour de la Kaaba dans le sens inverse des aiguilles d'une montre.
humbly | humblement | adv | C1 | /ˈhʌmbli/ | He humbly asked for forgiveness. | Il a humblement demandé pardon.
undeniably | indéniablement | adv | C1 | /ˌʌndɪˈnaɪəbli/ | She is undeniably talented. | Elle est indéniablement douée.
thrice | trois fois | adv | C2 | /θraɪs/ | He repeated it thrice. | Il l'a répété trois fois.
whence | d'où | adv | C2 | /wens/ | They returned whence they came. | Ils sont retournés d'où ils venaient.
chronically | chroniquement | adv | C1 | /ˈkrɒnɪkli/ | The service is chronically underfunded. | Le service est chroniquement sous-financé.
doubtless | sans doute | adv | C1 | /ˈdaʊtləs/ | He will doubtless arrive late. | Il arrivera sans doute en retard.
aloft | en l'air | adv | C2 | /əˈlɒft/ | He held the trophy aloft. | Il a brandi le trophée.
thence | de là | adv | C2 | /ðens/ | We went to Cairo and thence to Mecca. | Nous sommes allés au Caire, puis de là à La Mecque.
incognito | incognito | adv | C1 | /ˌɪnkɒɡˈniːtəʊ/ | The caliph walked the streets incognito. | Le calife parcourait les rues incognito.
organically | biologiquement ; naturellement | adv | C1 | /ɔːˈɡænɪkli/ | The vegetables are grown organically. | Les légumes sont cultivés en bio.
impossibly | incroyablement, impossiblement | adv | C1 | /ɪmˈpɒsəbli/ | The mountain looked impossibly high. | La montagne semblait incroyablement haute.
yonder | là-bas | adv | C2 | /ˈjɒndə/ | Look at the hills yonder. | Regarde les collines là-bas.
conceivably | éventuellement, peut-être | adv | C2 | /kənˈsiːvəbli/ | He could conceivably win. | Il pourrait éventuellement gagner.
gratis | gratis, gratuitement | adv | C2 | /ˈɡrætɪs/ | The meal was served gratis. | Le repas a été servi gratuitement.
sensibly | raisonnablement | adv | C1 | /ˈsensəbli/ | Dress sensibly for the cold. | Habille-toi raisonnablement pour le froid.
sporadically | sporadiquement | adv | C2 | /spəˈrædɪkli/ | Fighting continues sporadically. | Les combats se poursuivent sporadiquement.
admirably | admirablement | adv | C1 | /ˈædmərəbli/ | She coped admirably. | Elle s'en est admirablement sortie.
heartily | chaleureusement, de bon cœur | adv | C1 | /ˈhɑːtɪli/ | They laughed heartily. | Ils ont ri de bon cœur.
interchangeably | indifféremment | adv | C2 | /ˌɪntəˈtʃeɪndʒəbli/ | The two words are used interchangeably. | Les deux mots s'emploient indifféremment.
eerily | étrangement, de façon inquiétante | adv | C1 | /ˈɪərəli/ | The streets were eerily quiet. | Les rues étaient étrangement silencieuses.
characteristically | comme à son habitude | adv | C2 | /ˌkærəktəˈrɪstɪkli/ | Characteristically, he arrived early. | Comme à son habitude, il est arrivé tôt.
handily | haut la main ; commodément | adv | C2 | /ˈhændɪli/ | She won handily. | Elle a gagné haut la main.
merrily | joyeusement | adv | C1 | /ˈmerəli/ | The children sang merrily. | Les enfants chantaient joyeusement.
inextricably | inextricablement | adv | C2 | /ˌɪnɪkˈstrɪkəbli/ | Faith and action are inextricably linked. | La foi et l'action sont inextricablement liées.
satisfactorily | de manière satisfaisante | adv | C1 | /ˌsætɪsˈfæktərəli/ | The problem was resolved satisfactorily. | Le problème a été résolu de manière satisfaisante.
justifiably | à juste titre | adv | C2 | /ˌdʒʌstɪˈfaɪəbli/ | She is justifiably proud. | Elle est fière, à juste titre.
tenfold | au décuple | adv | C2 | /ˈtenfəʊld/ | Prices increased tenfold. | Les prix ont décuplé.
hither | ici (archaïque) | adv | C2 | /ˈhɪðə/ | He ran hither and thither. | Il courait çà et là.
wherefore | pourquoi (archaïque) | adv | C2 | /ˈweəfɔː/ | The whys and wherefores of the decision. | Le pourquoi et le comment de la décision.
afresh | à nouveau | adv | C2 | /əˈfreʃ/ | Let's start afresh. | Recommençons à zéro.
demonstrably | manifestement | adv | C2 | /dɪˈmɒnstrəbli/ | The claim is demonstrably false. | L'affirmation est manifestement fausse.
mightily | puissamment, énormément | adv | C2 | /ˈmaɪtɪli/ | We were mightily relieved. | Nous avons été énormément soulagés.
energetically | énergiquement | adv | C1 | /ˌenəˈdʒetɪkli/ | She campaigned energetically. | Elle a fait campagne énergiquement.
speedily | rapidement, promptement | adv | C1 | /ˈspiːdɪli/ | The matter was speedily resolved. | L'affaire a été rapidement réglée.
`,
);

export const MOT_JUSTE = theme(
  "mot-juste",
  "Le mot juste",
  "Le vocabulaire littéraire et soutenu (C1-C2) pour s'exprimer avec précision et élégance.",
  "Gem",
  `
to efface | effacer, gommer | v | C2 | /ɪˈfeɪs/ | Time had effaced the inscription. | Le temps avait effacé l'inscription.
effervescent | pétillant, effervescent | adj | C2 | /ˌefəˈvesnt/ | She has an effervescent personality. | Elle a une personnalité pétillante.
effete | mou, efféminé ; épuisé | adj | C2 | /ɪˈfiːt/ | The old aristocracy had become effete. | La vieille aristocratie s'était amollie.
effigy | effigie | n | C2 | /ˈefɪdʒi/ | Protesters burned an effigy of the dictator. | Les manifestants ont brûlé une effigie du dictateur.
effusive | démonstratif, expansif | adj | C2 | /ɪˈfjuːsɪv/ | He was effusive in his thanks. | Il s'est répandu en remerciements.
elegy | élégie | n | C2 | /ˈelədʒi/ | The poet wrote an elegy for his father. | Le poète a écrit une élégie pour son père.
emaciated | émacié, décharné | adj | C2 | /ɪˈmeɪsieɪtɪd/ | The prisoners were emaciated. | Les prisonniers étaient décharnés.
emollient | émollient ; apaisant | adj | C2 | /ɪˈmɒliənt/ | He spoke in emollient tones. | Il parlait d'un ton apaisant.
encomium | panégyrique, éloge | n | C2 | /enˈkəʊmiəm/ | The speech was an encomium to the founder. | Le discours était un éloge du fondateur.
enmity | inimitié, hostilité | n | C2 | /ˈenməti/ | There was old enmity between the tribes. | Il existait une vieille inimitié entre les tribus.
ennui | ennui, lassitude | n | C2 | /ɒnˈwiː/ | He suffered from a deep ennui. | Il souffrait d'une profonde lassitude.
epicure | épicurien, gourmet | n | C2 | /ˈepɪkjʊə/ | He was an epicure who loved fine food. | C'était un gourmet amateur de bonne chère.
evanescent | évanescent, fugace | adj | C2 | /ˌiːvəˈnesnt/ | Fame is evanescent. | La gloire est éphémère.
to exasperate | exaspérer | v | C2 | /ɪɡˈzɑːspəreɪt/ | His delays exasperated everyone. | Ses retards exaspéraient tout le monde.
to exhort | exhorter | v | C2 | /ɪɡˈzɔːt/ | The imam exhorted the faithful to be patient. | L'imam a exhorté les fidèles à la patience.
to expiate | expier | v | C2 | /ˈekspieɪt/ | He tried to expiate his sins through charity. | Il a essayé d'expier ses péchés par l'aumône.
to expunge | effacer, supprimer | v | C2 | /ɪkˈspʌndʒ/ | His name was expunged from the record. | Son nom a été rayé du registre.
extemporaneous | improvisé, impromptu | adj | C2 | /ekˌstempəˈreɪniəs/ | He gave an extemporaneous speech. | Il a fait un discours improvisé.
extraneous | étranger, superflu | adj | C2 | /ɪkˈstreɪniəs/ | Remove all extraneous details. | Supprime tous les détails superflus.
to extricate | dégager, tirer d'affaire | v | C2 | /ˈekstrɪkeɪt/ | She extricated herself from the situation. | Elle s'est tirée de cette situation.
fatuous | sot, inepte | adj | C2 | /ˈfætʃuəs/ | That was a fatuous remark. | C'était une remarque inepte.
fawning | flagorneur, servile | adj | C2 | /ˈfɔːnɪŋ/ | He was surrounded by fawning admirers. | Il était entouré d'admirateurs serviles.
feckless | incapable, irresponsable | adj | C2 | /ˈfekləs/ | Her feckless brother never kept a job. | Son frère irresponsable ne gardait jamais un emploi.
fecund | fécond | adj | C2 | /ˈfiːkənd/ | It was a fecund period of his career. | Ce fut une période féconde de sa carrière.
felicitous | heureux, bien trouvé | adj | C2 | /fəˈlɪsɪtəs/ | It was a felicitous choice of words. | C'était un choix de mots heureux.
fervour | ferveur | n | C2 | /ˈfɜːvə/ | They prayed with great fervour. | Ils priaient avec une grande ferveur.
fetid | fétide, nauséabond | adj | C2 | /ˈfetɪd/ | A fetid smell came from the drain. | Une odeur fétide montait de l'égout.
to fetter | entraver, enchaîner | v | C2 | /ˈfetə/ | He refused to be fettered by tradition. | Il refusait d'être entravé par la tradition.
flippant | désinvolte, léger | adj | C2 | /ˈflɪpənt/ | Don't be flippant about such a serious matter. | Ne prends pas un sujet aussi grave à la légère.
florid | fleuri, ampoulé ; rougeaud | adj | C2 | /ˈflɒrɪd/ | His writing style is too florid. | Son style est trop fleuri.
to flout | bafouer, se moquer de | v | C2 | /flaʊt/ | They flout the rules openly. | Ils bafouent ouvertement les règles.
foible | faiblesse, petit travers | n | C2 | /ˈfɔɪbl/ | We all have our little foibles. | Nous avons tous nos petits travers.
to foment | fomenter | v | C2 | /fəʊˈment/ | They were accused of fomenting unrest. | Ils ont été accusés de fomenter des troubles.
forbearance | patience, indulgence | n | C2 | /fɔːˈbeərəns/ | He showed great forbearance. | Il a fait preuve d'une grande patience.
to forestall | devancer, prévenir | v | C2 | /fɔːˈstɔːl/ | They acted quickly to forestall criticism. | Ils ont agi vite pour prévenir les critiques.
forthright | franc, direct | adj | C2 | /ˈfɔːθraɪt/ | She's known for her forthright views. | Elle est connue pour son franc-parler.
frenetic | frénétique | adj | C2 | /frəˈnetɪk/ | Life in the city is frenetic. | La vie en ville est frénétique.
to fulminate | fulminer, tonner | v | C2 | /ˈfʊlmɪneɪt/ | He fulminated against corruption. | Il fulminait contre la corruption.
fulsome | excessif, dithyrambique | adj | C2 | /ˈfʊlsəm/ | She received fulsome praise. | Elle a reçu des éloges dithyrambiques.
furtive | furtif | adj | C2 | /ˈfɜːtɪv/ | He cast a furtive glance at the door. | Il a jeté un regard furtif vers la porte.
to gainsay | contredire, nier | v | C2 | /ˌɡeɪnˈseɪ/ | No one can gainsay his honesty. | Personne ne peut contester son honnêteté.
gargantuan | gargantuesque, colossal | adj | C2 | /ɡɑːˈɡæntʃuən/ | He had a gargantuan appetite. | Il avait un appétit gargantuesque.
garish | criard, tape-à-l'œil | adj | C2 | /ˈɡeərɪʃ/ | The room was painted in garish colours. | La pièce était peinte de couleurs criardes.
germane | pertinent, en rapport | adj | C2 | /dʒɜːˈmeɪn/ | That point is not germane to the debate. | Ce point n'a pas de rapport avec le débat.
glib | désinvolte, facile | adj | C2 | /ɡlɪb/ | He always has a glib answer. | Il a toujours une réponse facile.
gluttony | gloutonnerie, gourmandise | n | C2 | /ˈɡlʌtəni/ | Gluttony is a vice. | La gloutonnerie est un vice.
to goad | aiguillonner, provoquer | v | C2 | /ɡəʊd/ | They goaded him into fighting. | Ils l'ont poussé à se battre.
gratuitous | gratuit, injustifié | adj | C2 | /ɡrəˈtjuːɪtəs/ | The film contains gratuitous violence. | Le film contient de la violence gratuite.
grandiloquent | grandiloquent | adj | C2 | /ɡrænˈdɪləkwənt/ | His grandiloquent style annoyed the audience. | Son style grandiloquent agaçait le public.
guileless | candide, sans malice | adj | C2 | /ˈɡaɪlləs/ | She has a guileless face. | Elle a un visage candide.
harbinger | signe avant-coureur, présage | n | C2 | /ˈhɑːbɪndʒə/ | The swallow is a harbinger of spring. | L'hirondelle annonce le printemps.
iconoclastic | iconoclaste | adj | C2 | /aɪˌkɒnəˈklæstɪk/ | He has iconoclastic ideas. | Il a des idées iconoclastes.
to imbue | imprégner, pénétrer | v | C2 | /ɪmˈbjuː/ | Her speech was imbued with hope. | Son discours était empreint d'espoir.
immutable | immuable | adj | C2 | /ɪˈmjuːtəbl/ | The laws of nature are immutable. | Les lois de la nature sont immuables.
impassive | impassible | adj | C2 | /ɪmˈpæsɪv/ | His face remained impassive. | Son visage est resté impassible.
impious | impie | adj | C2 | /ˈɪmpiəs/ | They considered the act impious. | Ils jugeaient cet acte impie.
to importune | importuner, harceler | v | C2 | /ˌɪmpɔːˈtjuːn/ | Beggars importuned the tourists. | Des mendiants importunaient les touristes.
to impugn | contester, mettre en doute | v | C2 | /ɪmˈpjuːn/ | Nobody impugned his motives. | Personne n'a mis en doute ses motivations.
inane | inepte, stupide | adj | C2 | /ɪˈneɪn/ | Stop asking inane questions. | Arrête de poser des questions stupides.
incisive | incisif, pénétrant | adj | C2 | /ɪnˈsaɪsɪv/ | She made an incisive analysis. | Elle a fait une analyse pénétrante.
inconsequential | sans importance | adj | C2 | /ɪnˌkɒnsɪˈkwenʃl/ | The changes were inconsequential. | Les changements étaient sans importance.
incontrovertible | incontestable, irréfutable | adj | C2 | /ˌɪnkɒntrəˈvɜːtəbl/ | There's incontrovertible proof. | Il existe une preuve irréfutable.
indigent | indigent, nécessiteux | adj | C2 | /ˈɪndɪdʒənt/ | Zakat is given to indigent families. | La zakat est donnée aux familles nécessiteuses.
inept | incompétent, maladroit | adj | C2 | /ɪˈnept/ | The government's response was inept. | La réaction du gouvernement a été maladroite.
to insinuate | insinuer | v | C2 | /ɪnˈsɪnjueɪt/ | Are you insinuating that I lied? | Tu insinues que j'ai menti ?
insolent | insolent | adj | C2 | /ˈɪnsələnt/ | The boy gave an insolent reply. | Le garçon a fait une réponse insolente.
intractable | insoluble ; intraitable | adj | C2 | /ɪnˈtræktəbl/ | It's an intractable problem. | C'est un problème insoluble.
to inure | endurcir, aguerrir | v | C2 | /ɪˈnjʊə/ | They became inured to hardship. | Ils se sont endurcis face aux épreuves.
invective | invectives | n | C2 | /ɪnˈvektɪv/ | He unleashed a stream of invective. | Il a lâché un flot d'invectives.
inveterate | invétéré | adj | C2 | /ɪnˈvetərət/ | He's an inveterate gambler. | C'est un joueur invétéré.
irreverent | irrévérencieux | adj | C2 | /ɪˈrevərənt/ | He has an irreverent sense of humour. | Il a un humour irrévérencieux.
to jettison | se débarrasser de, larguer | v | C2 | /ˈdʒetɪsn/ | They jettisoned the old plan. | Ils ont abandonné l'ancien plan.
jocular | jovial, badin | adj | C2 | /ˈdʒɒkjələ/ | He spoke in a jocular tone. | Il parlait d'un ton badin.
to kowtow | se prosterner, faire des courbettes | v | C2 | /ˌkaʊˈtaʊ/ | He refuses to kowtow to anyone. | Il refuse de faire des courbettes à qui que ce soit.
lachrymose | larmoyant | adj | C2 | /ˈlækrɪməʊs/ | The film ends with a lachrymose farewell. | Le film se termine par des adieux larmoyants.
to lampoon | tourner en ridicule, satiriser | v | C2 | /læmˈpuːn/ | The cartoon lampooned the president. | Le dessin tournait le président en ridicule.
to languish | languir, croupir | v | C2 | /ˈlæŋɡwɪʃ/ | He languished in prison for years. | Il a croupi en prison pendant des années.
libertine | libertin | n | C2 | /ˈlɪbətiːn/ | He was a notorious libertine. | C'était un libertin notoire.
licentious | licencieux, débauché | adj | C2 | /laɪˈsenʃəs/ | The poem was banned as licentious. | Le poème a été interdit car jugé licencieux.
limpid | limpide | adj | C2 | /ˈlɪmpɪd/ | The water was limpid and cool. | L'eau était limpide et fraîche.
listless | apathique, sans énergie | adj | C2 | /ˈlɪstləs/ | The heat made everyone listless. | La chaleur rendait tout le monde apathique.
lithe | souple, agile | adj | C2 | /laɪð/ | The dancer had a lithe body. | La danseuse avait un corps souple.
lugubrious | lugubre | adj | C2 | /luˈɡuːbriəs/ | He had a lugubrious expression. | Il avait une mine lugubre.
to malign | calomnier, dénigrer | v | C2 | /məˈlaɪn/ | He was maligned by the press. | Il a été calomnié par la presse.
maudlin | larmoyant, mièvre | adj | C2 | /ˈmɔːdlɪn/ | The song is a bit maudlin. | La chanson est un peu mièvre.
modicum | minimum, brin | n | C2 | /ˈmɒdɪkəm/ | Show a modicum of respect. | Montre un minimum de respect.
munificent | munificent, généreux | adj | C2 | /mjuːˈnɪfɪsnt/ | A munificent donor built the mosque. | Un généreux donateur a fait construire la mosquée.
nadir | nadir, point le plus bas | n | C2 | /ˈneɪdɪə/ | Relations reached their nadir last year. | Les relations ont atteint leur point le plus bas l'an dernier.
nebulous | nébuleux, flou | adj | C2 | /ˈnebjələs/ | His plans are rather nebulous. | Ses projets sont plutôt flous.
obtuse | obtus, borné | adj | C2 | /əbˈtjuːs/ | Are you being deliberately obtuse? | Tu fais exprès de ne pas comprendre ?
odious | odieux | adj | C2 | /ˈəʊdiəs/ | It was an odious crime. | C'était un crime odieux.
panacea | panacée | n | C2 | /ˌpænəˈsiːə/ | Technology is not a panacea. | La technologie n'est pas une panacée.
pariah | paria | n | C2 | /pəˈraɪə/ | He became a pariah in his own town. | Il est devenu un paria dans sa propre ville.
paltry | dérisoire, misérable | adj | C2 | /ˈpɔːltri/ | They offered a paltry sum. | Ils ont proposé une somme dérisoire.
panegyric | panégyrique | n | C2 | /ˌpænəˈdʒɪrɪk/ | The book is a panegyric to the king. | Le livre est un panégyrique du roi.
penchant | penchant, goût | n | C2 | /ˈpɒ̃ʃɒ̃/ | She has a penchant for poetry. | Elle a un penchant pour la poésie.
penitent | pénitent, repentant | adj | C2 | /ˈpenɪtənt/ | The penitent sinner asked Allah for forgiveness. | Le pécheur repentant a demandé pardon à Allah.
pensive | pensif | adj | C2 | /ˈpensɪv/ | She looked pensive. | Elle avait l'air pensive.
pertinacious | obstiné, tenace | adj | C2 | /ˌpɜːtɪˈneɪʃəs/ | He was a pertinacious researcher. | C'était un chercheur tenace.
plaudit | éloge, louange | n | C2 | /ˈplɔːdɪt/ | The film won plaudits from critics. | Le film a reçu les éloges de la critique.
presumptuous | présomptueux | adj | C2 | /prɪˈzʌmptʃuəs/ | It would be presumptuous to decide for her. | Il serait présomptueux de décider à sa place.
pretentious | prétentieux | adj | C2 | /prɪˈtenʃəs/ | The restaurant was pretentious. | Le restaurant était prétentieux.
to prevaricate | tergiverser, biaiser | v | C2 | /prɪˈværɪkeɪt/ | Stop prevaricating and answer the question. | Arrête de tergiverser et réponds à la question.
probity | probité | n | C2 | /ˈprəʊbəti/ | He was a man of great probity. | C'était un homme d'une grande probité.
proclivity | penchant, propension | n | C2 | /prəˈklɪvəti/ | He has a proclivity for violence. | Il a un penchant pour la violence.
to procrastinate | remettre à plus tard, procrastiner | v | C1 | /prəˈkræstɪneɪt/ | Stop procrastinating and start your revision. | Arrête de tout remettre à plus tard et commence tes révisions.
prodigious | prodigieux | adj | C2 | /prəˈdɪdʒəs/ | He had a prodigious memory. | Il avait une mémoire prodigieuse.
profuse | abondant, profus | adj | C2 | /prəˈfjuːs/ | He offered profuse apologies. | Il s'est confondu en excuses.
propriety | bienséance, convenance | n | C2 | /prəˈpraɪəti/ | She behaved with complete propriety. | Elle s'est comportée de manière tout à fait convenable.
puerile | puéril | adj | C2 | /ˈpjʊəraɪl/ | Stop this puerile behaviour. | Arrête ce comportement puéril.
pungent | âcre, piquant | adj | C2 | /ˈpʌndʒənt/ | The pungent smell of garlic filled the kitchen. | L'odeur âcre de l'ail emplissait la cuisine.
quagmire | bourbier | n | C2 | /ˈkwæɡmaɪə/ | The war became a quagmire. | La guerre est devenue un bourbier.
quiescent | au repos, inactif | adj | C2 | /kwiˈesnt/ | The volcano has been quiescent for years. | Le volcan est en sommeil depuis des années.
quintessential | par excellence, typique | adj | C2 | /ˌkwɪntɪˈsenʃl/ | He's the quintessential English gentleman. | C'est le parfait gentleman anglais.
rapacious | rapace, avide | adj | C2 | /rəˈpeɪʃəs/ | Rapacious landlords raised the rents. | Des propriétaires rapaces ont augmenté les loyers.
rectitude | droiture, rectitude | n | C2 | /ˈrektɪtjuːd/ | He was a man of moral rectitude. | C'était un homme d'une grande droiture morale.
resolute | résolu, déterminé | adj | C1 | /ˈrezəluːt/ | She remained resolute in her decision. | Elle est restée ferme dans sa décision.
ribald | paillard, grivois | adj | C2 | /ˈrɪbld/ | He told ribald jokes. | Il racontait des blagues grivoises.
ruse | ruse, stratagème | n | C2 | /ruːz/ | It was a ruse to get inside. | C'était une ruse pour entrer.
sacrosanct | sacro-saint | adj | C2 | /ˈsækrəʊsæŋkt/ | His weekend rest is sacrosanct. | Son repos du week-end est sacro-saint.
salubrious | salubre, sain | adj | C2 | /səˈluːbriəs/ | They live in a salubrious area. | Ils vivent dans un quartier agréable.
to satiate | rassasier, assouvir | v | C2 | /ˈseɪʃieɪt/ | The meal satiated our hunger. | Le repas a assouvi notre faim.
savant | savant, érudit | n | C2 | /ˈsævənt/ | He was a savant of Arabic grammar. | C'était un érudit de la grammaire arabe.
sinecure | sinécure | n | C2 | /ˈsaɪnɪkjʊə/ | His job is a sinecure. | Son poste est une sinécure.
slovenly | négligé, débraillé | adj | C2 | /ˈslʌvnli/ | His slovenly appearance shocked them. | Son allure débraillée les a choqués.
sordid | sordide | adj | C2 | /ˈsɔːdɪd/ | It was a sordid affair. | C'était une affaire sordide.
staid | guindé, sérieux | adj | C2 | /steɪd/ | The bank has a staid image. | La banque a une image très sérieuse.
stupor | stupeur, hébétude | n | C2 | /ˈstjuːpə/ | He woke from a drunken stupor. | Il est sorti d'une hébétude d'ivrogne.
to subjugate | subjuguer, assujettir | v | C2 | /ˈsʌbdʒuɡeɪt/ | The empire subjugated many peoples. | L'empire a assujetti de nombreux peuples.
subterfuge | subterfuge | n | C2 | /ˈsʌbtəfjuːdʒ/ | They got in by subterfuge. | Ils sont entrés par un subterfuge.
succinct | succinct, concis | adj | C1 | /səkˈsɪŋkt/ | Keep your answer succinct. | Fais une réponse concise.
surfeit | excès, surabondance | n | C2 | /ˈsɜːfɪt/ | There is a surfeit of information online. | Il y a une surabondance d'informations en ligne.
sycophantic | flagorneur, obséquieux | adj | C2 | /ˌsɪkəˈfæntɪk/ | The interview was sycophantic. | L'entretien était obséquieux.
temerity | témérité, audace | n | C2 | /təˈmerəti/ | He had the temerity to criticise the teacher. | Il a eu l'audace de critiquer le professeur.
tenuous | ténu, fragile | adj | C2 | /ˈtenjuəs/ | The link between the two is tenuous. | Le lien entre les deux est ténu.
terse | laconique, sec | adj | C2 | /tɜːs/ | He sent a terse reply. | Il a envoyé une réponse sèche.
timorous | timoré, craintif | adj | C2 | /ˈtɪmərəs/ | He was a timorous child. | C'était un enfant craintif.
torpor | torpeur | n | C2 | /ˈtɔːpə/ | The afternoon heat induced a torpor. | La chaleur de l'après-midi provoquait une torpeur.
tortuous | tortueux | adj | C2 | /ˈtɔːtʃuəs/ | The road was long and tortuous. | La route était longue et tortueuse.
trite | banal, rebattu | adj | C2 | /traɪt/ | The ending felt trite. | La fin semblait banale.
turgid | boursouflé, ampoulé | adj | C2 | /ˈtɜːdʒɪd/ | The novel is written in turgid prose. | Le roman est écrit dans une prose ampoulée.
umbrage | ombrage | n | C2 | /ˈʌmbrɪdʒ/ | She took umbrage at his remark. | Elle a pris ombrage de sa remarque.
unfathomable | insondable, impénétrable | adj | C2 | /ʌnˈfæðəməbl/ | The wisdom of Allah is unfathomable. | La sagesse d'Allah est insondable.
to usurp | usurper | v | C2 | /juːˈzɜːp/ | He usurped the throne. | Il a usurpé le trône.
vacuous | vide, niais | adj | C2 | /ˈvækjuəs/ | She gave a vacuous smile. | Elle a eu un sourire niais.
vapid | fade, insipide | adj | C2 | /ˈvæpɪd/ | The conversation was vapid. | La conversation était insipide.
veneer | vernis, apparence | n | C2 | /vəˈnɪə/ | Beneath the veneer of politeness was anger. | Sous un vernis de politesse se cachait la colère.
to vex | contrarier, fâcher | v | C2 | /veks/ | The question vexed him. | La question l'a contrarié.
vicarious | par procuration | adj | C2 | /vɪˈkeəriəs/ | She took vicarious pleasure in her son's success. | Elle vivait le succès de son fils par procuration.
vitriol | vitriol, venin | n | C2 | /ˈvɪtriəl/ | His speech was full of vitriol. | Son discours était plein de venin.
vivacious | plein de vivacité, enjoué | adj | C2 | /vɪˈveɪʃəs/ | She's a vivacious young woman. | C'est une jeune femme pleine de vivacité.
zenith | zénith, apogée | n | C2 | /ˈzenɪθ/ | The empire reached its zenith in the tenth century. | L'empire a atteint son apogée au Xe siècle.
to accede | accéder ; consentir | v | C2 | /əkˈsiːd/ | He acceded to their demands. | Il a accédé à leurs demandes.
boisterous | turbulent, bruyant | adj | C1 | /ˈbɔɪstərəs/ | The children were boisterous. | Les enfants étaient turbulents.
chivalrous | chevaleresque, galant | adj | C2 | /ˈʃɪvlrəs/ | It was a chivalrous gesture. | C'était un geste chevaleresque.
decadent | décadent | adj | C1 | /ˈdekədənt/ | They lived a decadent lifestyle. | Ils menaient une vie décadente.
deft | adroit, habile | adj | C2 | /deft/ | With a deft movement, she caught the cup. | D'un geste adroit, elle a rattrapé la tasse.
deluge | déluge | n | C2 | /ˈdeljuːdʒ/ | We received a deluge of complaints. | Nous avons reçu un déluge de réclamations.
demeanour | comportement, attitude | n | C1 | /dɪˈmiːnə/ | He has a calm demeanour. | Il a une attitude calme.
disparity | disparité, inégalité | n | C1 | /dɪˈspærəti/ | There's a wide disparity in income. | Il y a une forte disparité de revenus.
duress | contrainte | n | C2 | /djuˈres/ | The confession was made under duress. | Les aveux ont été faits sous la contrainte.
ebullience | exubérance, enthousiasme | n | C2 | /ɪˈbʌliəns/ | Her ebullience was contagious. | Son enthousiasme était contagieux.
to embroil | entraîner, impliquer | v | C2 | /ɪmˈbrɔɪl/ | He became embroiled in a scandal. | Il s'est retrouvé mêlé à un scandale.
to entice | attirer, séduire | v | C1 | /ɪnˈtaɪs/ | Low prices entice customers. | Les prix bas attirent les clients.
epiphany | révélation, prise de conscience | n | C2 | /ɪˈpɪfəni/ | He had an epiphany during the prayer. | Il a eu une révélation pendant la prière.
to eschew | éviter, s'abstenir de | v | C2 | /ɪsˈtʃuː/ | He eschews all forms of luxury. | Il fuit toute forme de luxe.
to exhilarate | exalter, griser | v | C2 | /ɪɡˈzɪləreɪt/ | The ride exhilarated us. | La balade nous a grisés.
facile | facile, simpliste | adj | C2 | /ˈfæsaɪl/ | That's a facile explanation. | C'est une explication simpliste.
fallible | faillible | adj | C2 | /ˈfæləbl/ | Every human being is fallible. | Tout être humain est faillible.
flamboyant | flamboyant, extravagant | adj | C1 | /flæmˈbɔɪənt/ | He has a flamboyant style. | Il a un style extravagant.
fortitude | courage, force d'âme | n | C2 | /ˈfɔːtɪtjuːd/ | She bore her illness with fortitude. | Elle a supporté sa maladie avec courage.
grandiose | grandiose | adj | C2 | /ˈɡrændiəʊs/ | They had grandiose plans. | Ils avaient des projets grandioses.
to gratify | satisfaire, faire plaisir à | v | C2 | /ˈɡrætɪfaɪ/ | I was gratified by the result. | J'ai été satisfait du résultat.
heterogeneous | hétérogène | adj | C2 | /ˌhetərəˈdʒiːniəs/ | The class is very heterogeneous. | La classe est très hétérogène.
illusory | illusoire | adj | C2 | /ɪˈluːsəri/ | Their freedom was illusory. | Leur liberté était illusoire.
implausible | invraisemblable | adj | C1 | /ɪmˈplɔːzəbl/ | His excuse was implausible. | Son excuse était invraisemblable.
inadvertently | par inadvertance | adv | C1 | /ˌɪnədˈvɜːtəntli/ | I inadvertently deleted the file. | J'ai supprimé le fichier par inadvertance.
insatiable | insatiable | adj | C2 | /ɪnˈseɪʃəbl/ | He has an insatiable thirst for knowledge. | Il a une soif insatiable de savoir.
invincible | invincible | adj | C1 | /ɪnˈvɪnsəbl/ | The team seemed invincible. | L'équipe semblait invincible.
to loathe | détester, exécrer | v | C1 | /ləʊð/ | I loathe hypocrisy. | J'exècre l'hypocrisie.
mercurial | versatile, lunatique | adj | C2 | /mɜːˈkjʊəriəl/ | He has a mercurial temperament. | Il a un tempérament lunatique.
misnomer | appellation impropre | n | C2 | /ˌmɪsˈnəʊmə/ | "Free trade" is a misnomer here. | « Libre-échange » est ici un terme impropre.
nuance | nuance | n | C1 | /ˈnjuːɑːns/ | He understood every nuance of the text. | Il comprenait chaque nuance du texte.
to pacify | pacifier, apaiser | v | C2 | /ˈpæsɪfaɪ/ | She tried to pacify the crying baby. | Elle a essayé de calmer le bébé qui pleurait.
to perplex | rendre perplexe | v | C2 | /pəˈpleks/ | The question perplexed the students. | La question a rendu les élèves perplexes.
to persevere | persévérer | v | C1 | /ˌpɜːsɪˈvɪə/ | If you persevere, you will succeed. | Si tu persévères, tu réussiras.
pliable | flexible, malléable | adj | C2 | /ˈplaɪəbl/ | The clay is soft and pliable. | L'argile est molle et malléable.
rancorous | rancunier, haineux | adj | C2 | /ˈræŋkərəs/ | It was a rancorous debate. | Ce fut un débat haineux.
raucous | rauque, bruyant | adj | C2 | /ˈrɔːkəs/ | We heard raucous laughter. | Nous avons entendu des rires bruyants.
to recede | reculer, s'éloigner | v | C1 | /rɪˈsiːd/ | The flood waters began to recede. | Les eaux de la crue ont commencé à reculer.
replete | plein, rempli | adj | C2 | /rɪˈpliːt/ | History is replete with examples. | L'histoire regorge d'exemples.
reprehensible | répréhensible | adj | C2 | /ˌreprɪˈhensəbl/ | His conduct was reprehensible. | Sa conduite était répréhensible.
reprieve | sursis, répit | n | C2 | /rɪˈpriːv/ | The factory got a last-minute reprieve. | L'usine a obtenu un sursis de dernière minute.
sagacity | sagacité | n | C2 | /səˈɡæsəti/ | He was known for his sagacity. | Il était connu pour sa sagacité.
scant | maigre, insuffisant | adj | C2 | /skænt/ | They paid scant attention to the warning. | Ils ont prêté peu d'attention à l'avertissement.
servility | servilité | n | C2 | /sɜːˈvɪləti/ | Islam rejects servility to anyone but Allah. | L'islam rejette la servilité envers quiconque sauf Allah.
zealotry | fanatisme | n | C2 | /ˈzelətri/ | Religious zealotry leads to conflict. | Le fanatisme religieux mène au conflit.
`,
);
