/* Le Truchement : thème « Le temps, les nombres et les mesures » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const TEMPS_MESURES = theme(
  "temps-mesures",
  "Le temps, les nombres et les mesures",
  "L'heure, les dates, les quantités, les formes et les mesures.",
  "Clock",
  `
time | temps, heure | n | A1 | /taɪm/ | What time is it? | Quelle heure est-il ?
hour | heure | n | A1 | /ˈaʊər/ | The film lasts two hours. | Le film dure deux heures.
minute | minute | n | A1 | /ˈmɪnɪt/ | Wait a minute, please. | Attends une minute, s'il te plaît.
second | seconde | n | A1 | /ˈsekənd/ | It only takes a second. | Ça ne prend qu'une seconde.
day | jour | n | A1 | /deɪ/ | I work five days a week. | Je travaille cinq jours par semaine.
week | semaine | n | A1 | /wiːk/ | See you next week! | À la semaine prochaine !
month | mois | n | A1 | /mʌnθ/ | My birthday is next month. | Mon anniversaire est le mois prochain.
year | an, année | n | A1 | /jɪər/ | Happy new year! | Bonne année !
today | aujourd'hui | adv | A1 | /təˈdeɪ/ | What are you doing today? | Que fais-tu aujourd'hui ?
tomorrow | demain | adv | A1 | /təˈmɒrəʊ/ | See you tomorrow. | À demain.
yesterday | hier | adv | A1 | /ˈjestədeɪ/ | I saw her yesterday. | Je l'ai vue hier.
morning | matin | n | A1 | /ˈmɔːnɪŋ/ | I run every morning. | Je cours tous les matins.
afternoon | après-midi | n | A1 | /ˌɑːftəˈnuːn/ | We'll meet in the afternoon. | On se retrouve l'après-midi.
evening | soir | n | A1 | /ˈiːvnɪŋ/ | We watch TV in the evening. | Nous regardons la télé le soir.
night | nuit | n | A1 | /naɪt/ | Good night, sleep well. | Bonne nuit, dors bien.
midnight | minuit | n | A2 | /ˈmɪdnaɪt/ | The party ended at midnight. | La fête s'est terminée à minuit.
noon | midi | n | A2 | /nuːn/ | Lunch is served at noon. | Le déjeuner est servi à midi.
dawn | aube | n | B1 | /dɔːn/ | Fishermen leave at dawn. | Les pêcheurs partent à l'aube.
dusk | crépuscule | n | B2 | /dʌsk/ | Bats fly out at dusk. | Les chauves-souris sortent au crépuscule.
Monday | lundi | n | A1 | /ˈmʌndeɪ/ | School starts on Monday. | L'école commence lundi.
Tuesday | mardi | n | A1 | /ˈtjuːzdeɪ/ | The market is on Tuesday. | Le marché a lieu le mardi.
Wednesday | mercredi | n | A1 | /ˈwenzdeɪ/ | Children have Wednesday afternoons off. | Les enfants n'ont pas cours le mercredi après-midi.
Thursday | jeudi | n | A1 | /ˈθɜːzdeɪ/ | The meeting is on Thursday. | La réunion a lieu jeudi.
Friday | vendredi | n | A1 | /ˈfraɪdeɪ/ | We pray together on Friday. | Nous prions ensemble le vendredi.
Saturday | samedi | n | A1 | /ˈsætədeɪ/ | I play football on Saturday. | Je joue au foot le samedi.
Sunday | dimanche | n | A1 | /ˈsʌndeɪ/ | The shops are closed on Sunday. | Les magasins sont fermés le dimanche.
January | janvier | n | A1 | /ˈdʒænjuəri/ | It snows a lot in January. | Il neige beaucoup en janvier.
February | février | n | A1 | /ˈfebruəri/ | February is the shortest month. | Février est le mois le plus court.
March | mars | n | A1 | /mɑːtʃ/ | Spring begins in March. | Le printemps commence en mars.
April | avril | n | A1 | /ˈeɪprəl/ | It often rains in April. | Il pleut souvent en avril.
May | mai | n | A1 | /meɪ/ | Her birthday is in May. | Son anniversaire est en mai.
June | juin | n | A1 | /dʒuːn/ | Exams take place in June. | Les examens ont lieu en juin.
July | juillet | n | A1 | /dʒuˈlaɪ/ | We go on holiday in July. | Nous partons en vacances en juillet.
August | août | n | A1 | /ˈɔːɡəst/ | August is very hot here. | Août est très chaud ici.
September | septembre | n | A1 | /sepˈtembər/ | School starts again in September. | L'école reprend en septembre.
October | octobre | n | A1 | /ɒkˈtəʊbər/ | The leaves fall in October. | Les feuilles tombent en octobre.
November | novembre | n | A1 | /nəʊˈvembər/ | November is cold and grey. | Novembre est froid et gris.
December | décembre | n | A1 | /dɪˈsembər/ | The days are short in December. | Les jours sont courts en décembre.
calendar | calendrier | n | A2 | /ˈkælɪndər/ | Write it on the calendar. | Note-le sur le calendrier.
diary | agenda ; journal intime | n | A2 | /ˈdaɪəri/ | I'll check my diary. | Je vais regarder mon agenda.
clock | horloge | n | A1 | /klɒk/ | The clock on the wall is slow. | L'horloge murale retarde.
o'clock | heure(s) pile | adv | A1 | /əˈklɒk/ | It's three o'clock. | Il est trois heures.
quarter | quart | n | A1 | /ˈkwɔːtər/ | It's a quarter past five. | Il est cinq heures et quart.
half | moitié, demi | n | A1 | /hɑːf/ | It's half past six. | Il est six heures et demie.
past | passé (heure) | prep | A1 | /pɑːst/ | It's ten past nine. | Il est neuf heures dix.
early | tôt | adv | A1 | /ˈɜːli/ | I get up early. | Je me lève tôt.
late | tard | adv | A1 | /leɪt/ | We arrived late. | Nous sommes arrivés tard.
soon | bientôt | adv | A1 | /suːn/ | See you soon! | À bientôt !
now | maintenant | adv | A1 | /naʊ/ | I have to go now. | Je dois partir maintenant.
then | alors, ensuite | adv | A1 | /ðen/ | First wash, then dry. | D'abord on lave, ensuite on sèche.
ago | il y a | adv | A1 | /əˈɡəʊ/ | I met him two years ago. | Je l'ai rencontré il y a deux ans.
already | déjà | adv | A2 | /ɔːlˈredi/ | I've already eaten. | J'ai déjà mangé.
yet | encore, déjà | adv | A2 | /jet/ | Have you finished yet? | As-tu déjà fini ?
still | toujours, encore | adv | A2 | /stɪl/ | Are you still hungry? | Tu as encore faim ?
recently | récemment | adv | B1 | /ˈriːsntli/ | I've been very busy recently. | J'ai été très occupé récemment.
nowadays | de nos jours | adv | B1 | /ˈnaʊədeɪz/ | Nowadays everyone has a phone. | De nos jours, tout le monde a un téléphone.
meanwhile | pendant ce temps | adv | B1 | /ˈmiːnwaɪl/ | Meanwhile, the soup was boiling. | Pendant ce temps, la soupe bouillait.
eventually | finalement | adv | B1 | /ɪˈventʃuəli/ | We eventually found the hotel. | Nous avons finalement trouvé l'hôtel.
fortnight | quinze jours | n | B2 | /ˈfɔːtnaɪt/ | We're going away for a fortnight. | Nous partons pour quinze jours.
millennium | millénaire | n | C1 | /mɪˈleniəm/ | The town is almost a millennium old. | La ville a presque mille ans.
leap year | année bissextile | n | B2 | /ˈliːp jɪər/ | A leap year has 366 days. | Une année bissextile compte 366 jours.
daily | quotidien | adj | B1 | /ˈdeɪli/ | Exercise is part of my daily routine. | Le sport fait partie de mon quotidien.
weekly | hebdomadaire | adj | B1 | /ˈwiːkli/ | We have a weekly meeting. | Nous avons une réunion hebdomadaire.
monthly | mensuel | adj | B1 | /ˈmʌnθli/ | The monthly rent is due today. | Le loyer mensuel est dû aujourd'hui.
yearly | annuel | adj | B1 | /ˈjɪəli/ | The yearly festival attracts thousands. | Le festival annuel attire des milliers de gens.
annual | annuel | adj | B2 | /ˈænjuəl/ | Our annual holiday is in August. | Nos vacances annuelles sont en août.
number | nombre, numéro | n | A1 | /ˈnʌmbər/ | Choose a number between one and ten. | Choisis un nombre entre un et dix.
zero | zéro | n | A1 | /ˈzɪərəʊ/ | The temperature fell below zero. | La température est descendue sous zéro.
one | un | n | A1 | /wʌn/ | I have one brother. | J'ai un frère.
two | deux | n | A1 | /tuː/ | We have two cats. | Nous avons deux chats.
three | trois | n | A1 | /θriː/ | The shop opens at three. | Le magasin ouvre à trois heures.
ten | dix | n | A1 | /ten/ | Count to ten slowly. | Compte jusqu'à dix lentement.
hundred | cent | n | A1 | /ˈhʌndrəd/ | There were a hundred people. | Il y avait cent personnes.
thousand | mille | n | A1 | /ˈθaʊznd/ | The car cost ten thousand euros. | La voiture a coûté dix mille euros.
million | million | n | A2 | /ˈmɪljən/ | The city has two million inhabitants. | La ville compte deux millions d'habitants.
billion | milliard | n | B1 | /ˈbɪljən/ | The world has eight billion people. | Le monde compte huit milliards d'habitants.
dozen | douzaine | n | A2 | /ˈdʌzn/ | Buy a dozen eggs. | Achète une douzaine d'œufs.
first | premier | adj | A1 | /fɜːst/ | This is my first visit. | C'est ma première visite.
last | dernier | adj | A1 | /lɑːst/ | This is the last bus. | C'est le dernier bus.
next | prochain, suivant | adj | A1 | /nekst/ | Get off at the next stop. | Descends au prochain arrêt.
once | une fois | adv | A2 | /wʌns/ | I go to the gym once a week. | Je vais à la salle une fois par semaine.
twice | deux fois | adv | A2 | /twaɪs/ | I've been to London twice. | Je suis allé deux fois à Londres.
double | double ; doubler | adj | B1 | /ˈdʌbl/ | I'd like a double room. | Je voudrais une chambre double.
pair | paire | n | A2 | /peər/ | I bought a pair of shoes. | J'ai acheté une paire de chaussures.
couple of | quelques, deux | expr | A2 | /ˈkʌpl əv/ | Wait a couple of minutes. | Attends deux minutes.
plus | plus | prep | A2 | /plʌs/ | Two plus two is four. | Deux plus deux égale quatre.
minus | moins | prep | A2 | /ˈmaɪnəs/ | Ten minus three is seven. | Dix moins trois égale sept.
times | fois (multiplication) | prep | A2 | /taɪmz/ | Three times four is twelve. | Trois fois quatre égale douze.
divided by | divisé par | expr | B1 | /dɪˈvaɪdɪd baɪ/ | Ten divided by two is five. | Dix divisé par deux égale cinq.
equal | égal | adj | B1 | /ˈiːkwəl/ | Cut the cake into equal parts. | Coupe le gâteau en parts égales.
add | ajouter, additionner | v | A2 | /æd/ | Add the numbers together. | Additionne les nombres.
subtract | soustraire | v | B1 | /səbˈtrækt/ | Subtract five from twenty. | Soustrais cinq de vingt.
multiply | multiplier | v | B1 | /ˈmʌltɪplaɪ/ | Multiply the width by the length. | Multiplie la largeur par la longueur.
divide | diviser | v | B1 | /dɪˈvaɪd/ | Divide the bill between four people. | Divise l'addition entre quatre personnes.
count | compter | v | A1 | /kaʊnt/ | Can you count to a hundred in English? | Sais-tu compter jusqu'à cent en anglais ?
amount | quantité, montant | n | B1 | /əˈmaʊnt/ | Add a small amount of salt. | Ajoute une petite quantité de sel.
quantity | quantité | n | B1 | /ˈkwɒntəti/ | We buy rice in large quantities. | Nous achetons du riz en grandes quantités.
percentage | pourcentage | n | B1 | /pəˈsentɪdʒ/ | What percentage of students passed? | Quel pourcentage d'élèves a réussi ?
per cent | pour cent | n | A2 | /pə ˈsent/ | Prices rose by five per cent. | Les prix ont augmenté de cinq pour cent.
fraction | fraction | n | B2 | /ˈfrækʃn/ | A half is a fraction. | Une moitié est une fraction.
decimal | décimal | adj | B2 | /ˈdesɪml/ | Use a decimal point. | Utilise une virgule décimale.
average | moyenne ; moyen | n | B1 | /ˈævərɪdʒ/ | The average age is thirty. | L'âge moyen est de trente ans.
total | total | n | A2 | /ˈtəʊtl/ | The total comes to fifty euros. | Le total s'élève à cinquante euros.
sum | somme | n | B1 | /sʌm/ | He paid a large sum of money. | Il a payé une grosse somme d'argent.
length | longueur | n | B1 | /leŋθ/ | What is the length of the room? | Quelle est la longueur de la pièce ?
width | largeur | n | B1 | /wɪdθ/ | Measure the width of the window. | Mesure la largeur de la fenêtre.
depth | profondeur | n | B1 | /depθ/ | The depth of the pool is two metres. | La profondeur de la piscine est de deux mètres.
area | superficie, zone | n | B1 | /ˈeəriə/ | The area of the garden is 200 square metres. | La superficie du jardin est de 200 mètres carrés.
volume | volume | n | B1 | /ˈvɒljuːm/ | Calculate the volume of the box. | Calcule le volume de la boîte.
metre | mètre | n | A1 | /ˈmiːtər/ | The wall is two metres high. | Le mur fait deux mètres de haut.
centimetre | centimètre | n | A1 | /ˈsentɪmiːtər/ | The insect is one centimetre long. | L'insecte mesure un centimètre.
kilometre | kilomètre | n | A1 | /ˈkɪləmiːtər/ | The station is one kilometre away. | La gare est à un kilomètre.
mile | mile | n | A2 | /maɪl/ | One mile is about 1.6 kilometres. | Un mile fait environ 1,6 kilomètre.
kilo | kilo | n | A1 | /ˈkiːləʊ/ | A kilo of apples, please. | Un kilo de pommes, s'il vous plaît.
gram | gramme | n | A2 | /ɡræm/ | Add 200 grams of flour. | Ajoute 200 grammes de farine.
litre | litre | n | A2 | /ˈliːtər/ | Drink two litres of water a day. | Bois deux litres d'eau par jour.
ton | tonne | n | B1 | /tʌn/ | The truck carries ten tons. | Le camion transporte dix tonnes.
inch | pouce (mesure) | n | B1 | /ɪntʃ/ | The screen is fifteen inches wide. | L'écran fait quinze pouces.
square metre | mètre carré | n | B1 | /ˌskweə ˈmiːtər/ | The flat is fifty square metres. | L'appartement fait cinquante mètres carrés.
scales | balance | n | B1 | /skeɪlz/ | Weigh the flour on the scales. | Pèse la farine sur la balance.
ruler | règle | n | A2 | /ˈruːlər/ | Draw a line with a ruler. | Trace une ligne avec une règle.
tape measure | mètre ruban | n | B2 | /ˈteɪp ˌmeʒər/ | Use a tape measure for the curtains. | Prends un mètre ruban pour les rideaux.
shape | forme | n | A2 | /ʃeɪp/ | The cake is in the shape of a heart. | Le gâteau a la forme d'un cœur.
circle | cercle | n | A2 | /ˈsɜːkl/ | The children sat in a circle. | Les enfants se sont assis en cercle.
triangle | triangle | n | A2 | /ˈtraɪæŋɡl/ | A triangle has three sides. | Un triangle a trois côtés.
rectangle | rectangle | n | A2 | /ˈrektæŋɡl/ | The door is a rectangle. | La porte est un rectangle.
round | rond | adj | A1 | /raʊnd/ | We have a round table. | Nous avons une table ronde.
straight | droit | adj | A2 | /streɪt/ | Draw a straight line. | Trace une ligne droite.
curved | courbe | adj | B2 | /kɜːvd/ | The road is curved here. | La route est courbe ici.
diameter | diamètre | n | C1 | /daɪˈæmɪtər/ | The pipe is ten centimetres in diameter. | Le tuyau a dix centimètres de diamètre.
four | quatre | n | A1 | /fɔːr/ | We have four children. | Nous avons quatre enfants.
five | cinq | n | A1 | /faɪv/ | The museum opens at five. | Le musée ouvre à cinq heures.
six | six | n | A1 | /sɪks/ | Six people came to the meeting. | Six personnes sont venues à la réunion.
seven | sept | n | A1 | /ˈsevn/ | There are seven days in a week. | Il y a sept jours dans une semaine.
eight | huit | n | A1 | /eɪt/ | School starts at eight. | L'école commence à huit heures.
nine | neuf | n | A1 | /naɪn/ | She is nine years old. | Elle a neuf ans.
eleven | onze | n | A1 | /ɪˈlevn/ | A football team has eleven players. | Une équipe de foot compte onze joueurs.
twelve | douze | n | A1 | /twelv/ | There are twelve months in a year. | Il y a douze mois dans une année.
thirteen | treize | n | A1 | /ˌθɜːˈtiːn/ | He turned thirteen yesterday. | Il a eu treize ans hier.
fifteen | quinze | n | A1 | /ˌfɪfˈtiːn/ | The bus comes every fifteen minutes. | Le bus passe toutes les quinze minutes.
twenty | vingt | n | A1 | /ˈtwenti/ | I'm twenty years old. | J'ai vingt ans.
thirty | trente | n | A1 | /ˈθɜːti/ | Ramadan lasts twenty-nine or thirty days. | Le ramadan dure vingt-neuf ou trente jours.
forty | quarante | n | A1 | /ˈfɔːti/ | My father is forty. | Mon père a quarante ans.
fifty | cinquante | n | A1 | /ˈfɪfti/ | It costs fifty euros. | Ça coûte cinquante euros.
sixty | soixante | n | A1 | /ˈsɪksti/ | There are sixty minutes in an hour. | Il y a soixante minutes dans une heure.
seventy | soixante-dix | n | A1 | /ˈsevnti/ | Grandpa is seventy. | Papi a soixante-dix ans.
eighty | quatre-vingts | n | A1 | /ˈeɪti/ | The car was going eighty. | La voiture roulait à quatre-vingts.
ninety | quatre-vingt-dix | n | A1 | /ˈnaɪnti/ | She lived to ninety. | Elle a vécu jusqu'à quatre-vingt-dix ans.
third | troisième | adj | A1 | /θɜːd/ | We live on the third floor. | Nous habitons au troisième étage.
tenth | dixième | adj | A2 | /tenθ/ | It's their tenth anniversary. | C'est leur dixième anniversaire de mariage.
hundredth | centième | adj | B1 | /ˈhʌndrədθ/ | The town celebrated its hundredth birthday. | La ville a fêté son centième anniversaire.
several | plusieurs | pron | A2 | /ˈsevrəl/ | I've been there several times. | J'y suis allé plusieurs fois.
a few | quelques | pron | A2 | /ə ˈfjuː/ | I have a few questions. | J'ai quelques questions.
a lot of | beaucoup de | pron | A1 | /ə ˈlɒt əv/ | There are a lot of people here. | Il y a beaucoup de monde ici.
plenty of | plein de | pron | B1 | /ˈplenti əv/ | We have plenty of time. | Nous avons tout notre temps.
enough | assez | adv | A2 | /ɪˈnʌf/ | Do we have enough bread? | Avons-nous assez de pain ?
too much | trop | adv | A2 | /ˌtuː ˈmʌtʃ/ | You eat too much sugar. | Tu manges trop de sucre.
too many | trop (de choses comptables) | adv | A2 | /ˌtuː ˈmeni/ | There are too many cars. | Il y a trop de voitures.
less | moins | adv | A2 | /les/ | I want to spend less money. | Je veux dépenser moins d'argent.
fewer | moins (comptable) | adj | B1 | /ˈfjuːər/ | Fewer people came this year. | Moins de gens sont venus cette année.
most | la plupart | pron | A2 | /məʊst/ | Most people agree. | La plupart des gens sont d'accord.
none | aucun | pron | B1 | /nʌn/ | None of my friends came. | Aucun de mes amis n'est venu.
whole | entier | adj | A2 | /həʊl/ | He ate the whole cake. | Il a mangé le gâteau entier.
part | partie | n | A2 | /pɑːt/ | Part of the road is closed. | Une partie de la route est fermée.
piece | morceau | n | A1 | /piːs/ | Can I have a piece of cake? | Je peux avoir un morceau de gâteau ?
bit | petit morceau, un peu | n | A2 | /bɪt/ | Wait a bit. | Attends un peu.
heavy | lourd | adj | A1 | /ˈhevi/ | This suitcase is too heavy. | Cette valise est trop lourde.
long | long | adj | A1 | /lɒŋ/ | It's a long road. | C'est une longue route.
short | court | adj | A1 | /ʃɔːt/ | The film was short. | Le film était court.
wide | large | adj | A2 | /waɪd/ | The river is very wide here. | La rivière est très large ici.
narrow | étroit | adj | B1 | /ˈnærəʊ/ | The streets are narrow in the old town. | Les rues sont étroites dans la vieille ville.
deep | profond | adj | A2 | /diːp/ | The lake is very deep. | Le lac est très profond.
shallow | peu profond | adj | B1 | /ˈʃæləʊ/ | The water is shallow here. | L'eau est peu profonde ici.
thick | épais | adj | B1 | /θɪk/ | The walls are very thick. | Les murs sont très épais.
thin | mince, fin | adj | A2 | /θɪn/ | Cut the bread into thin slices. | Coupe le pain en tranches fines.
huge | énorme | adj | A2 | /hjuːdʒ/ | They live in a huge house. | Ils habitent une maison énorme.
tiny | minuscule | adj | A2 | /ˈtaɪni/ | The flat is tiny. | L'appartement est minuscule.
in time | à temps | expr | B1 | /ɪn ˈtaɪm/ | We arrived just in time. | Nous sommes arrivés juste à temps.
rush | précipitation, hâte | n | B1 | /rʌʃ/ | There's no rush. | Rien ne presse.
duration | durée | n | B2 | /djuˈreɪʃn/ | The duration of the course is six weeks. | La durée du cours est de six semaines.
period | période | n | B1 | /ˈpɪəriəd/ | It was a difficult period. | Ce fut une période difficile.
moment | moment | n | A2 | /ˈməʊmənt/ | Wait a moment, please. | Attends un moment, s'il te plaît.
instant | instant | n | B2 | /ˈɪnstənt/ | It happened in an instant. | C'est arrivé en un instant.
forever | pour toujours | adv | B1 | /fərˈevər/ | I'll remember this day forever. | Je me souviendrai de ce jour pour toujours.
timer | minuteur | n | B1 | /ˈtaɪmər/ | Set the timer for ten minutes. | Règle le minuteur sur dix minutes.
sundial | cadran solaire | n | C1 | /ˈsʌndaɪəl/ | The mosque has an old sundial. | La mosquée a un vieux cadran solaire.
prayer times | horaires de prière | n | B1 | /ˈpreə taɪmz/ | Prayer times change every day. | Les horaires de prière changent chaque jour.
lunar calendar | calendrier lunaire | n | B2 | /ˌluːnə ˈkælɪndər/ | The Islamic calendar is a lunar calendar. | Le calendrier musulman est un calendrier lunaire.
weekday | jour de semaine | n | A2 | /ˈwiːkdeɪ/ | The shop is open on weekdays. | Le magasin est ouvert en semaine.
`,
);
