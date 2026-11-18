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
past | après (heure : ten past two = deux heures dix) | prep | A1 | /pɑːst/ | It's ten past nine. | Il est neuf heures dix.
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
half an hour | une demi-heure | expr | A1 | /ˌhɑːf ən ˈaʊər/ | I'll be back in half an hour. | Je reviens dans une demi-heure.
quarter of an hour | un quart d'heure | expr | A2 | /ˌkwɔːtər əv ən ˈaʊər/ | The bus comes every quarter of an hour. | Le bus passe tous les quarts d'heure.
midday | midi | n | A2 | /ˌmɪdˈdeɪ/ | We pray at midday. | Nous prions à midi.
the day after tomorrow | après-demain | expr | A1 | /ðə ˌdeɪ ɑːftə təˈmɒrəʊ/ | We leave the day after tomorrow. | Nous partons après-demain.
the day before yesterday | avant-hier | expr | A1 | /ðə ˌdeɪ bɪfɔː ˈjestədeɪ/ | I saw him the day before yesterday. | Je l'ai vu avant-hier.
tonight | ce soir | adv | A1 | /təˈnaɪt/ | What are you doing tonight? | Qu'est-ce que tu fais ce soir ?
last night | hier soir, la nuit dernière | expr | A1 | /ˌlɑːst ˈnaɪt/ | I slept badly last night. | J'ai mal dormi la nuit dernière.
this morning | ce matin | expr | A1 | /ˌðɪs ˈmɔːnɪŋ/ | I called her this morning. | Je l'ai appelée ce matin.
next week | la semaine prochaine | expr | A1 | /ˌnekst ˈwiːk/ | The exam is next week. | L'examen est la semaine prochaine.
last week | la semaine dernière | expr | A1 | /ˌlɑːst ˈwiːk/ | We moved last week. | Nous avons déménagé la semaine dernière.
last year | l'année dernière | expr | A1 | /ˌlɑːst ˈjɪər/ | Last year we went to Morocco. | L'année dernière, nous sommes allés au Maroc.
next year | l'année prochaine | expr | A1 | /ˌnekst ˈjɪər/ | I'll start university next year. | J'entrerai à l'université l'année prochaine.
Ramadan | ramadan | n | A2 | /ˌræməˈdæn/ | Muslims fast during Ramadan. | Les musulmans jeûnent pendant le ramadan.
Eid | Aïd | n | A2 | /iːd/ | We visit our family at Eid. | Nous rendons visite à notre famille pour l'Aïd.
hourglass | sablier | n | B1 | /ˈaʊəɡlɑːs/ | Turn the hourglass over. | Retourne le sablier.
a.m. | du matin (avant midi) | expr | A2 | /ˌeɪ ˈem/ | The shop opens at 9 a.m. | Le magasin ouvre à 9 heures du matin.
p.m. | de l'après-midi, du soir | expr | A2 | /ˌpiː ˈem/ | The train leaves at 6 p.m. | Le train part à 18 heures.
half past | et demie | expr | A1 | /ˈhɑːf pɑːst/ | It's half past seven. | Il est sept heures et demie.
quarter past | et quart | expr | A1 | /ˈkwɔːtə pɑːst/ | It's quarter past three. | Il est trois heures et quart.
quarter to | moins le quart | expr | A1 | /ˈkwɔːtə tuː/ | It's quarter to ten. | Il est dix heures moins le quart.
later | plus tard | adv | A1 | /ˈleɪtər/ | I'll call you later. | Je t'appellerai plus tard.
these days | de nos jours, ces temps-ci | expr | A2 | /ˈðiːz deɪz/ | These days, everyone has a phone. | De nos jours, tout le monde a un téléphone.
at the moment | en ce moment | expr | A2 | /ət ðə ˈməʊmənt/ | He's busy at the moment. | Il est occupé en ce moment.
during | pendant | prep | A2 | /ˈdjʊərɪŋ/ | Don't talk during the prayer. | Ne parle pas pendant la prière.
annually | annuellement | adv | B2 | /ˈænjuəli/ | The festival is held annually. | Le festival a lieu chaque année.
hourly | toutes les heures | adv | B2 | /ˈaʊəli/ | Trains run hourly. | Les trains passent toutes les heures.
every other day | un jour sur deux | expr | B1 | /ˌevri ˌʌðə ˈdeɪ/ | I go running every other day. | Je cours un jour sur deux.
once in a while | de temps en temps | expr | B1 | /ˌwʌns ɪn ə ˈwaɪl/ | We eat out once in a while. | Nous mangeons dehors de temps en temps.
straight away | tout de suite | adv | A2 | /ˌstreɪt əˈweɪ/ | Call me straight away. | Appelle-moi tout de suite.
right away | immédiatement | adv | A2 | /ˌraɪt əˈweɪ/ | I'll do it right away. | Je le fais immédiatement.
in a minute | dans une minute | expr | A2 | /ɪn ə ˈmɪnɪt/ | I'll be ready in a minute. | Je serai prêt dans une minute.
in a moment | dans un instant | expr | A2 | /ɪn ə ˈməʊmənt/ | The doctor will see you in a moment. | Le médecin va vous recevoir dans un instant.
in no time | en un rien de temps | expr | B2 | /ɪn ˈnəʊ taɪm/ | We finished in no time. | Nous avons fini en un rien de temps.
all day long | toute la journée | expr | A2 | /ˌɔːl deɪ ˈlɒŋ/ | It rained all day long. | Il a plu toute la journée.
day and night | jour et nuit | expr | A2 | /ˌdeɪ ən ˈnaɪt/ | The nurses work day and night. | Les infirmières travaillent jour et nuit.
round the clock | 24 heures sur 24 | expr | B2 | /ˌraʊnd ðə ˈklɒk/ | Doctors worked round the clock. | Les médecins ont travaillé 24 heures sur 24.
24/7 | 24 heures sur 24, 7 jours sur 7 | expr | B1 | /ˌtwentiˌfɔː ˈsevn/ | The shop is open 24/7. | La boutique est ouverte 24 heures sur 24.
the other day | l'autre jour | expr | A2 | /ði ˈʌðə deɪ/ | I saw your brother the other day. | J'ai vu ton frère l'autre jour.
in the past | autrefois, dans le passé | expr | A2 | /ɪn ðə ˈpɑːst/ | In the past, people walked everywhere. | Autrefois, les gens allaient partout à pied.
in the future | à l'avenir | expr | A2 | /ɪn ðə ˈfjuːtʃər/ | In the future, be more careful. | À l'avenir, sois plus prudent.
in the short term | à court terme | expr | B2 | /ɪn ðə ˌʃɔːt ˈtɜːm/ | In the short term, prices will rise. | À court terme, les prix vont augmenter.
at the latest | au plus tard | expr | B1 | /ət ðə ˈleɪtɪst/ | Send it by Friday at the latest. | Envoie-le vendredi au plus tard.
at the earliest | au plus tôt | expr | B1 | /ət ði ˈɜːliɪst/ | We'll arrive at ten at the earliest. | Nous arriverons à dix heures au plus tôt.
daylight saving time | heure d'été | n | B2 | /ˌdeɪlaɪt ˈseɪvɪŋ taɪm/ | Daylight saving time starts in March. | L'heure d'été commence en mars.
interval | intervalle, entracte | n | B2 | /ˈɪntəvl/ | There's an interval of twenty minutes. | Il y a un entracte de vingt minutes.
millimetre | millimètre | n | A2 | /ˈmɪlimiːtər/ | It's only five millimetres thick. | Ça ne fait que cinq millimètres d'épaisseur.
kilogram | kilogramme | n | A2 | /ˈkɪləɡræm/ | The bag weighs ten kilograms. | Le sac pèse dix kilogrammes.
tonne | tonne | n | B1 | /tʌn/ | The truck carries twenty tonnes. | Le camion transporte vingt tonnes.
ounce | once | n | B2 | /aʊns/ | Add four ounces of sugar. | Ajoute quatre onces de sucre.
millilitre | millilitre | n | A2 | /ˈmɪliliːtər/ | Take five millilitres of syrup. | Prends cinq millilitres de sirop.
pint | pinte | n | B1 | /paɪnt/ | Buy a pint of milk. | Achète une pinte de lait.
gallon | gallon | n | B2 | /ˈɡælən/ | The tank holds ten gallons. | Le réservoir contient dix gallons.
hectare | hectare | n | B2 | /ˈhekteər/ | The farm covers fifty hectares. | La ferme s'étend sur cinquante hectares.
acre | acre | n | B2 | /ˈeɪkər/ | They own two acres of land. | Ils possèdent deux acres de terrain.
distance | distance | n | A2 | /ˈdɪstəns/ | What's the distance between Laval and Rennes? | Quelle est la distance entre Laval et Rennes ?
kilometres per hour | kilomètres-heure | n | A2 | /kɪˌlɒmɪtəz pər ˈaʊər/ | The speed limit is fifty kilometres per hour. | La vitesse est limitée à cinquante kilomètres-heure.
miles per hour | miles à l'heure | n | B1 | /ˌmaɪlz pər ˈaʊər/ | He was driving at seventy miles per hour. | Il roulait à soixante-dix miles à l'heure.
a couple | quelques, deux ou trois | expr | A2 | /ə ˈkʌpl/ | Wait a couple of minutes. | Attends deux minutes.
a handful | une poignée | expr | B1 | /ə ˈhændfʊl/ | Add a handful of almonds. | Ajoute une poignée d'amandes.
much | beaucoup (indénombrable) | adv | A1 | /mʌtʃ/ | Thank you very much. | Merci beaucoup.
a lot | beaucoup | expr | A1 | /ə ˈlɒt/ | I read a lot. | Je lis beaucoup.
a little | un peu | expr | A1 | /ə ˈlɪtl/ | I speak a little English. | Je parle un peu anglais.
a bit | un peu | expr | A1 | /ə ˈbɪt/ | I'm a bit tired. | Je suis un peu fatigué.
about | environ | adv | A1 | /əˈbaʊt/ | It takes about an hour. | Ça prend environ une heure.
around | environ, vers | adv | A2 | /əˈraʊnd/ | I'll arrive around six. | J'arriverai vers six heures.
at most | au maximum, tout au plus | expr | B1 | /ət ˈməʊst/ | It will cost twenty euros at most. | Ça coûtera vingt euros tout au plus.
up to | jusqu'à | prep | B1 | /ˈʌp tuː/ | The room holds up to fifty people. | La salle peut accueillir jusqu'à cinquante personnes.
more than | plus de | expr | A1 | /ˈmɔː ðæn/ | More than a thousand people came. | Plus de mille personnes sont venues.
less than | moins de | expr | A1 | /ˈles ðæn/ | It costs less than ten euros. | Ça coûte moins de dix euros.
fewer than | moins de (dénombrable) | expr | B1 | /ˈfjuːə ðæn/ | Fewer than twenty students passed. | Moins de vingt élèves ont réussi.
fourteen | quatorze | n | A1 | /ˌfɔːˈtiːn/ | My son is fourteen. | Mon fils a quatorze ans.
sixteen | seize | n | A1 | /ˌsɪksˈtiːn/ | There are sixteen students in the class. | Il y a seize élèves dans la classe.
seventeen | dix-sept | n | A1 | /ˌsevnˈtiːn/ | She left school at seventeen. | Elle a quitté l'école à dix-sept ans.
eighteen | dix-huit | n | A1 | /ˌeɪˈtiːn/ | You can vote at eighteen. | On peut voter à dix-huit ans.
nineteen | dix-neuf | n | A1 | /ˌnaɪnˈtiːn/ | The book has nineteen chapters. | Le livre compte dix-neuf chapitres.
fourth | quatrième | adj | A1 | /fɔːθ/ | We live on the fourth floor. | Nous habitons au quatrième étage.
fifth | cinquième | adj | A1 | /fɪfθ/ | It's his fifth birthday. | C'est son cinquième anniversaire.
sixth | sixième | adj | A1 | /sɪksθ/ | Friday is the sixth day of the week here. | Ici, le vendredi est le sixième jour de la semaine.
seventh | septième | adj | A1 | /ˈsevnθ/ | She finished seventh in the race. | Elle a fini septième de la course.
eighth | huitième | adj | A1 | /eɪtθ/ | It's the eighth time I've told you! | C'est la huitième fois que je te le dis !
ninth | neuvième | adj | A1 | /naɪnθ/ | Ramadan is the ninth month of the Islamic calendar. | Le ramadan est le neuvième mois du calendrier islamique.
eleventh | onzième | adj | A2 | /ɪˈlevnθ/ | He scored in the eleventh minute. | Il a marqué à la onzième minute.
twelfth | douzième | adj | A2 | /twelfθ/ | December is the twelfth month. | Décembre est le douzième mois.
twentieth | vingtième | adj | A2 | /ˈtwentiəθ/ | The twentieth century saw two world wars. | Le vingtième siècle a connu deux guerres mondiales.
thirtieth | trentième | adj | A2 | /ˈθɜːtiəθ/ | Today is the thirtieth of June. | Nous sommes le trente juin.
thousandth | millième | adj | B1 | /ˈθaʊzndθ/ | He was the thousandth visitor. | C'était le millième visiteur.
armful | brassée | n | C1 | /ˈɑːmfʊl/ | She carried an armful of flowers. | Elle portait une brassée de fleurs.
centigrade | centigrade, Celsius | n | B2 | /ˈsentɪɡreɪd/ | Water boils at a hundred degrees centigrade. | L'eau bout à cent degrés Celsius.
cone | cône | n | B2 | /kəʊn/ | The ice cream was served in a cone. | La glace était servie dans un cornet.
daytime | journée, jour | n | B2 | /ˈdeɪtaɪm/ | The shop is open in the daytime only. | Le magasin n'est ouvert qu'en journée.
lifetime | vie, existence | n | B2 | /ˈlaɪftaɪm/ | It's the chance of a lifetime. | C'est la chance de ta vie.
metric | métrique | adj | B2 | /ˈmetrɪk/ | France uses the metric system. | La France utilise le système métrique.
nought | zéro | n | B2 | /nɔːt/ | Add a nought to the end of the number. | Ajoute un zéro à la fin du nombre.
pentagon | pentagone | n | B2 | /ˈpentəɡən/ | A pentagon has five sides. | Un pentagone a cinq côtés.
thickness | épaisseur | n | B2 | /ˈθɪknəs/ | Measure the thickness of the wall. | Mesure l'épaisseur du mur.
cylinder | cylindre | n | B2 | /ˈsɪlɪndə/ | A gas cylinder exploded. | Une bouteille de gaz a explosé.
radius | rayon | n | C1 | /ˈreɪdiəs/ | There are three shops within a radius of a mile. | Il y a trois magasins dans un rayon d'un mile.
trillion | billion (mille milliards) | n | B2 | /ˈtrɪljən/ | The debt is over a trillion dollars. | La dette dépasse mille milliards de dollars.
digit | chiffre | n | B2 | /ˈdɪdʒɪt/ | Enter the four-digit code. | Saisis le code à quatre chiffres.
nineteenth | dix-neuvième | adj | B1 | /ˌnaɪnˈtiːnθ/ | He was born in the nineteenth century. | Il est né au dix-neuvième siècle.
cubic | cube (mesure), cubique | adj | B2 | /ˈkjuːbɪk/ | The tank holds two cubic metres. | La cuve contient deux mètres cubes.
countdown | compte à rebours | n | B2 | /ˈkaʊntdaʊn/ | The countdown to Ramadan has begun. | Le compte à rebours avant le ramadan a commencé.
geometric | géométrique | adj | C1 | /ˌdʒiːəˈmetrɪk/ | Islamic art uses geometric patterns. | L'art islamique utilise des motifs géométriques.
eighteenth | dix-huitième | adj | B1 | /ˌeɪˈtiːnθ/ | The house dates from the eighteenth century. | La maison date du dix-huitième siècle.
breadth | largeur ; étendue | n | C1 | /bredθ/ | He has great breadth of knowledge. | Il a une grande étendue de connaissances.
sixteenth | seizième | adj | B1 | /ˌsɪksˈtiːnθ/ | The castle dates from the sixteenth century. | Le château date du seizième siècle.
lifespan | durée de vie | n | C1 | /ˈlaɪfspæn/ | The lifespan of a cat is about fifteen years. | La durée de vie d'un chat est d'environ quinze ans.
thirteenth | treizième | adj | B1 | /ˌθɜːˈtiːnθ/ | It happened in the thirteenth century. | C'est arrivé au treizième siècle.
acreage | superficie (en acres) | n | C2 | /ˈeɪkərɪdʒ/ | The farm's acreage has doubled. | La superficie de la ferme a doublé.
fourteenth | quatorzième | adj | B1 | /ˌfɔːˈtiːnθ/ | It was built in the fourteenth century. | Il a été construit au quatorzième siècle.
fifteenth | quinzième | adj | B1 | /ˌfɪfˈtiːnθ/ | Today is the fifteenth of May. | Nous sommes le quinze mai.
seventeenth | dix-septième | adj | B1 | /ˌsevnˈtiːnθ/ | The mosque dates from the seventeenth century. | La mosquée date du dix-septième siècle.
cylindrical | cylindrique | adj | C1 | /səˈlɪndrɪkl/ | The tower is cylindrical. | La tour est cylindrique.
perpendicular | perpendiculaire | adj | C2 | /ˌpɜːpənˈdɪkjələ/ | Draw a line perpendicular to the base. | Trace une ligne perpendiculaire à la base.
quadrant | quadrant | n | C2 | /ˈkwɒdrənt/ | Divide the circle into four quadrants. | Divise le cercle en quatre quadrants.
symmetrical | symétrique | adj | C1 | /sɪˈmetrɪkl/ | The building is perfectly symmetrical. | Le bâtiment est parfaitement symétrique.
night-time | nuit | n | B2 | /ˈnaɪt taɪm/ | The streets are quiet at night-time. | Les rues sont calmes la nuit.
convex | convexe | adj | C2 | /ˈkɒnveks/ | It's a convex mirror. | C'est un miroir convexe.
multiplication | multiplication | n | B2 | /ˌmʌltɪplɪˈkeɪʃn/ | The children are learning multiplication. | Les enfants apprennent la multiplication.
summertime | l'été, la belle saison | n | B2 | /ˈsʌmətaɪm/ | The town is busy in summertime. | La ville est animée en été.
sizeable | considérable | adj | C1 | /ˈsaɪzəbl/ | They won a sizeable sum. | Ils ont gagné une somme considérable.
curvature | courbure | n | C2 | /ˈkɜːvətʃə/ | Ships disappear because of the Earth's curvature. | Les navires disparaissent à cause de la courbure de la Terre.
elliptical | elliptique | adj | C2 | /ɪˈlɪptɪkl/ | The Earth's orbit is elliptical. | L'orbite de la Terre est elliptique.
symmetric | symétrique | adj | C2 | /sɪˈmetrɪk/ | The pattern is symmetric. | Le motif est symétrique.
millennia | millénaires | n | C2 | /mɪˈleniə/ | The city has existed for millennia. | La ville existe depuis des millénaires.
circumference | circonférence | n | C2 | /səˈkʌmfərəns/ | Measure the circumference of the circle. | Mesure la circonférence du cercle.
nightfall | tombée de la nuit | n | C1 | /ˈnaɪtfɔːl/ | We must arrive before nightfall. | Nous devons arriver avant la tombée de la nuit.
almanac | almanach | n | C2 | /ˈɔːlmənæk/ | The almanac gives prayer times for the year. | L'almanach donne les horaires de prière de l'année.
daybreak | point du jour | n | C1 | /ˈdeɪbreɪk/ | We set off at daybreak. | Nous sommes partis au point du jour.
juncture | moment, stade (critique), conjoncture | n | C2 | /ˈdʒʌŋktʃə/ | At this juncture, we must decide. | À ce stade, nous devons décider.
sundown | coucher du soleil | n | C1 | /ˈsʌndaʊn/ | Muslims break their fast at sundown. | Les musulmans rompent le jeûne au coucher du soleil.
midweek | milieu de semaine | n | B2 | /ˌmɪdˈwiːk/ | Flights are cheaper midweek. | Les vols sont moins chers en milieu de semaine.
millionth | millionième | adj | C1 | /ˈmɪljənθ/ | It's the millionth visitor this year. | C'est le millionième visiteur cette année.
bicentenary | bicentenaire | n | C2 | /ˌbaɪsenˈtiːnəri/ | The town celebrates its bicentenary. | La ville fête son bicentenaire.
furlong | furlong (201 mètres) | n | C2 | /ˈfɜːlɒŋ/ | The horse led by a furlong. | Le cheval menait d'un furlong.
bushel | boisseau | n | C2 | /ˈbʊʃl/ | They sold wheat by the bushel. | Ils vendaient le blé au boisseau.
midsummer | plein été, solstice d'été | n | C1 | /ˌmɪdˈsʌmə/ | The festival is held at midsummer. | La fête a lieu au cœur de l'été.
quart | quart de gallon (≈ 1,14 l) | n | C1 | /kwɔːt/ | You can't put a quart into a pint pot. | On ne fait pas entrer un litre dans un verre.
lunar month | mois lunaire | n | B2 | /ˌluːnə ˈmʌnθ/ | Ramadan is the ninth lunar month. | Le ramadan est le neuvième mois lunaire.
all-day | qui dure toute la journée | adj | B1 | /ˌɔːl ˈdeɪ/ | The pub serves an all-day breakfast. | Le pub sert un petit-déjeuner toute la journée.
year-round | toute l'année | adj | B2 | /ˌjɪə ˈraʊnd/ | The island is a year-round destination. | L'île est une destination prisée toute l'année.
back-to-back | à la suite, d'affilée | adj | C1 | /ˌbæk tə ˈbæk/ | I've got back-to-back meetings all day. | J'ai des réunions à la chaîne toute la journée.
to tell the time | lire l'heure | expr | A2 | /tel ðə ˈtaɪm/ | My son is learning to tell the time. | Mon fils apprend à lire l'heure.
to lose count | perdre le compte | expr | B2 | /luːz ˈkaʊnt/ | I've lost count of the times I've told you! | J'ai perdu le compte des fois où je te l'ai dit !
late for | en retard à, en retard pour | adj | A1 | /ˈleɪt fə/ | Hurry up, we're late for school! | Dépêche-toi, on est en retard pour l'école !
day by day | jour après jour | adv | B1 | /ˌdeɪ baɪ ˈdeɪ/ | Day by day, the patient is getting stronger. | Jour après jour, le patient reprend des forces.
again and again | à maintes reprises, encore et encore | adv | A2 | /əˌɡen ən əˈɡen/ | I've told you again and again! | Je te l'ai répété encore et encore !
at night | la nuit | adv | A1 | /ət ˈnaɪt/ | I can't sleep at night. | Je n'arrive pas à dormir la nuit.
in the morning | le matin | adv | A1 | /ɪn ðə ˈmɔːnɪŋ/ | I drink coffee in the morning. | Je bois du café le matin.
in the afternoon | l'après-midi | adv | A1 | /ɪn ði ˌɑːftəˈnuːn/ | The shop opens again in the afternoon. | La boutique rouvre l'après-midi.
in the evening | le soir | adv | A1 | /ɪn ði ˈiːvnɪŋ/ | We watch the news in the evening. | Nous regardons les informations le soir.
in those days | à cette époque, en ce temps-là | adv | B1 | /ɪn ˌðəʊz ˈdeɪz/ | In those days, nobody had a mobile phone. | À cette époque, personne n'avait de téléphone portable.
just now | à l'instant | adv | A2 | /ˌdʒʌst ˈnaʊ/ | Your mother called just now. | Ta mère a appelé à l'instant.
from now on | désormais, dorénavant | adv | B1 | /frəm ˌnaʊ ˈɒn/ | From now on, I'll get up earlier. | Désormais, je me lèverai plus tôt.
in advance | à l'avance | adv | B1 | /ɪn ədˈvɑːns/ | Book your tickets in advance. | Réservez vos billets à l'avance.
at times | parfois, par moments | adv | B2 | /ət ˈtaɪmz/ | The work can be stressful at times. | Le travail peut être stressant par moments.
any minute now | d'une minute à l'autre | adv | B1 | /ˌeni ˈmɪnɪt naʊ/ | The guests will be here any minute now. | Les invités vont arriver d'une minute à l'autre.
before long | sous peu, bientôt | adv | B2 | /bɪˌfɔː ˈlɒŋ/ | Before long, the children were asleep. | Bientôt, les enfants se sont endormis.
a while ago | il y a un moment | adv | A2 | /ə ˈwaɪl əˌɡəʊ/ | I saw him a while ago in the market. | Je l'ai vu il y a un moment au marché.
long ago | il y a longtemps | adv | A2 | /ˌlɒŋ əˈɡəʊ/ | Long ago, this land was covered by the sea. | Il y a longtemps, cette terre était recouverte par la mer.
in the near future | dans un avenir proche | adv | B1 | /ɪn ðə ˌnɪə ˈfjuːtʃə/ | Prices will rise in the near future. | Les prix vont augmenter dans un avenir proche.
at the weekend | le week-end | adv | A1 | /ət ðə ˌwiːkˈend/ | What are you doing at the weekend? | Qu'est-ce que tu fais ce week-end ?
on weekdays | en semaine | adv | A2 | /ɒn ˈwiːkdeɪz/ | The library closes at six on weekdays. | La bibliothèque ferme à 18 heures en semaine.
once a week | une fois par semaine | adv | A1 | /ˌwʌns ə ˈwiːk/ | I go swimming once a week. | Je vais nager une fois par semaine.
what time is it | quelle heure est-il ? | expr | A1 | /ˌwɒt ˈtaɪm ɪz ɪt/ | Excuse me, what time is it? | Excusez-moi, quelle heure est-il ?
to take ages | prendre un temps fou | expr | B1 | /teɪk ˈeɪdʒɪz/ | The bus always takes ages to come. | Le bus met toujours un temps fou à arriver.
on average | en moyenne | adv | B1 | /ɒn ˈævərɪdʒ/ | On average, I sleep seven hours a night. | En moyenne, je dors sept heures par nuit.
anytime | n'importe quand | adv | A2 | /ˈenitaɪm/ | Call me anytime you need help. | Appelle-moi n'importe quand si tu as besoin d'aide.
`,
);
