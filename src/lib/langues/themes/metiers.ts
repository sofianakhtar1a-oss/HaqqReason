/* Le Truchement : thème « Les métiers » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const METIERS = theme(
  "metiers",
  "Les métiers",
  "Les professions, les outils de travail et les gestes qui vont avec.",
  "Hammer",
  `
plumber | plombier | n | A2 | /ˈplʌmər/ | The plumber fixed the sink this morning. | Le plombier a réparé l'évier ce matin.
electrician | électricien | n | A2 | /ɪˌlekˈtrɪʃn/ | We need an electrician to check the wiring. | Il nous faut un électricien pour vérifier l'installation.
mechanic | mécanicien | n | A2 | /məˈkænɪk/ | The mechanic checked my brakes. | Le mécanicien a vérifié mes freins.
engineer | ingénieur | n | A2 | /ˌendʒɪˈnɪr/ | She works as a civil engineer. | Elle travaille comme ingénieure civile.
police officer | policier | n | A2 | /pəˈliːs ˈɒfɪsər/ | The police officer asked for my ID. | Le policier m'a demandé mes papiers.
firefighter | pompier | n | A2 | /ˈfaɪərfaɪtər/ | The firefighters arrived within minutes. | Les pompiers sont arrivés en quelques minutes.
farmer | agriculteur | n | A1 | /ˈfɑːrmər/ | My uncle is a farmer in Normandy. | Mon oncle est agriculteur en Normandie.
baker | boulanger | n | A2 | /ˈbeɪkər/ | The baker gets up at four every morning. | Le boulanger se lève à quatre heures chaque matin.
butcher | boucher | n | A2 | /ˈbʊtʃər/ | The butcher sells excellent lamb. | Le boucher vend d'excellent agneau.
chef | chef cuisinier | n | A2 | /ʃef/ | The chef prepared a special menu tonight. | Le chef a préparé un menu spécial ce soir.
cashier | caissier | n | A1 | /kæˈʃɪər/ | The cashier gave me my change. | Le caissier m'a rendu la monnaie.
driver | chauffeur | n | A1 | /ˈdraɪvər/ | The driver took us to the airport. | Le chauffeur nous a conduits à l'aéroport.
pilot | pilote | n | A2 | /ˈpaɪlət/ | The pilot announced our landing. | Le pilote a annoncé notre atterrissage.
singer | chanteur, chanteuse | n | A1 | /ˈsɪŋər/ | The singer performed three new songs. | La chanteuse a interprété trois nouvelles chansons.
writer | écrivain | n | A2 | /ˈraɪtər/ | She is a famous writer of detective novels. | C'est une écrivaine célèbre de romans policiers.
actor | acteur | n | A2 | /ˈæktər/ | The actor learned his lines overnight. | L'acteur a appris son texte pendant la nuit.
painter | peintre | n | A2 | /ˈpeɪntər/ | The painter works in a small studio. | Le peintre travaille dans un petit atelier.
photographer | photographe | n | A2 | /fəˈtɒɡrəfər/ | The photographer took beautiful portraits. | Le photographe a pris de très beaux portraits.
scientist | scientifique | n | A2 | /ˈsaɪəntɪst/ | The scientist published a new study. | Le scientifique a publié une nouvelle étude.
postman | facteur | n | A2 | /ˈpoʊstmən/ | The postman delivers letters every morning. | Le facteur distribue le courrier chaque matin.
hairdresser | coiffeur, coiffeuse | n | A2 | /ˈherdresər/ | My hairdresser cut my hair very short. | Ma coiffeuse m'a coupé les cheveux très court.
cleaner | agent d'entretien | n | A2 | /ˈkliːnər/ | The cleaner works here every evening. | L'agent d'entretien travaille ici chaque soir.
gardener | jardinier | n | A2 | /ˈɡɑːrdnər/ | The gardener trims the hedges every spring. | Le jardinier taille les haies chaque printemps.
babysitter | baby-sitter | n | A2 | /ˈbeɪbisɪtər/ | We found a babysitter for the evening. | Nous avons trouvé une baby-sitter pour la soirée.
journalist | journaliste | n | B1 | /ˈdʒɜːrnəlɪst/ | The journalist interviewed the minister. | Le journaliste a interviewé le ministre.
sailor | marin | n | B1 | /ˈseɪlər/ | My grandfather was a sailor for thirty years. | Mon grand-père a été marin pendant trente ans.
soldier | soldat | n | B1 | /ˈsoʊldʒər/ | The soldier stood guard at the gate. | Le soldat montait la garde à la porte.
designer | créateur, designer | n | B1 | /dɪˈzaɪnər/ | The designer created a logo for the new shop. | Le créateur a dessiné un logo pour la nouvelle boutique.
tailor | tailleur | n | B1 | /ˈteɪlər/ | The tailor adjusted the sleeves of my jacket. | Le tailleur a retouché les manches de ma veste.
receptionist | réceptionniste | n | B1 | /rɪˈsepʃənɪst/ | The receptionist answered the phone. | La réceptionniste a répondu au téléphone.
translator | traducteur, traductrice | n | B1 | /trænsˈleɪtər/ | She works as a translator for the court. | Elle travaille comme traductrice pour le tribunal.
interpreter | interprète | n | B1 | /ɪnˈtɜːrprɪtər/ | The interpreter translated the speech live. | L'interprète a traduit le discours en direct.
researcher | chercheur | n | B1 | /rɪˈsɜːrtʃər/ | The researcher works on climate models. | Le chercheur travaille sur les modèles climatiques.
programmer | programmeur | n | B1 | /ˈproʊɡræmər/ | The programmer fixed the bug overnight. | Le programmeur a corrigé le bug pendant la nuit.
fisherman | pêcheur | n | B1 | /ˈfɪʃərmən/ | The fisherman sold his catch at the harbour. | Le pêcheur a vendu sa pêche au port.
pharmacist | pharmacien, pharmacienne | n | B1 | /ˈfɑːrməsɪst/ | Ask the pharmacist for advice. | Demande conseil au pharmacien.
banker | banquier | n | B1 | /ˈbæŋkər/ | The banker approved the loan. | Le banquier a accepté le prêt.
priest | prêtre | n | B1 | /priːst/ | The priest celebrated the mass at noon. | Le prêtre a célébré la messe à midi.
apprentice | apprenti | n | B1 | /əˈprentɪs/ | He works as an apprentice electrician. | Il travaille comme apprenti électricien.
astronaut | astronaute | n | B1 | /ˈæstrənɔːt/ | The astronaut floated inside the station. | L'astronaute flottait à l'intérieur de la station.
courier | coursier, livreur | n | B1 | /ˈkʊriər/ | The courier delivers parcels by bike. | Le livreur apporte les colis à vélo.
nanny | nounou, gouvernante | n | B1 | /ˈnæni/ | The nanny reads a story to the children. | La nounou lit une histoire aux enfants.
optician | opticien | n | B1 | /ɒpˈtɪʃn/ | The optician tested my eyes carefully. | L'opticien a examiné soigneusement mes yeux.
carpenter | menuisier, charpentier | n | B2 | /ˈkɑːrpəntər/ | The carpenter built a new wardrobe. | Le menuisier a construit une nouvelle armoire.
architect | architecte | n | B2 | /ˈɑːrkɪtekt/ | The architect designed the new library. | L'architecte a conçu la nouvelle bibliothèque.
accountant | comptable | n | B2 | /əˈkaʊntənt/ | Our accountant checks the figures every month. | Notre comptable vérifie les chiffres chaque mois.
lawyer | avocat, avocate | n | B2 | /ˈlɔɪər/ | I need a lawyer to read this contract. | J'ai besoin d'un avocat pour lire ce contrat.
judge | juge | n | B2 | /dʒʌdʒ/ | The judge will announce the verdict tomorrow. | Le juge annoncera le verdict demain.
welder | soudeur | n | B2 | /ˈweldər/ | The welder joined the steel beams together. | Le soudeur a assemblé les poutres d'acier.
mason | maçon | n | B2 | /ˈmeɪsn/ | The mason repaired the old stone wall. | Le maçon a réparé le vieux mur en pierre.
bricklayer | maçon, poseur de briques | n | B2 | /ˈbrɪkleɪər/ | The bricklayer laid the bricks very fast. | Le maçon a posé les briques très vite.
locksmith | serrurier | n | B2 | /ˈlɒksmɪθ/ | The locksmith opened the door in five minutes. | Le serrurier a ouvert la porte en cinq minutes.
veterinarian | vétérinaire | n | B2 | /ˌvetərɪˈneriən/ | The veterinarian examined our dog carefully. | Le vétérinaire a examiné notre chien avec soin.
librarian | bibliothécaire | n | B2 | /laɪˈbreriən/ | The librarian helped me find the right book. | La bibliothécaire m'a aidé à trouver le bon livre.
miner | mineur | n | B2 | /ˈmaɪnər/ | His grandfather was a miner in the north. | Son grand-père était mineur dans le Nord.
surgeon | chirurgien | n | B2 | /ˈsɜːrdʒən/ | The surgeon operated for four hours. | Le chirurgien a opéré pendant quatre heures.
psychologist | psychologue | n | B2 | /saɪˈkɒlədʒɪst/ | The psychologist listens without judging. | Le psychologue écoute sans juger.
physiotherapist | kinésithérapeute | n | B2 | /ˌfɪziəʊˈθerəpɪst/ | The physiotherapist helped my back recover. | Le kinésithérapeute a aidé mon dos à guérir.
midwife | sage-femme | n | B2 | /ˈmɪdwaɪf/ | The midwife helped the mother give birth. | La sage-femme a aidé la mère à accoucher.
economist | économiste | n | B2 | /ɪˈkɒnəmɪst/ | The economist predicted slow growth. | L'économiste a prévu une croissance lente.
politician | homme politique, femme politique | n | B2 | /ˌpɒlɪˈtɪʃn/ | The politician gave a speech on education. | L'homme politique a prononcé un discours sur l'éducation.
ambassador | ambassadeur, ambassadrice | n | B2 | /æmˈbæsədər/ | The ambassador attended the national ceremony. | L'ambassadrice a assisté à la cérémonie nationale.
bodyguard | garde du corps | n | B2 | /ˈbɒdiɡɑːrd/ | The bodyguard stayed close to the star. | Le garde du corps est resté près de la vedette.
craftsman | artisan | n | B2 | /ˈkræftsmən/ | The craftsman makes furniture by hand. | L'artisan fabrique des meubles à la main.
apprenticeship | apprentissage | n | B2 | /əˈprentɪʃɪp/ | He completed a three-year apprenticeship. | Il a terminé un apprentissage de trois ans.
vocational | professionnel | adj | B2 | /voʊˈkeɪʃənl/ | She studied at a vocational school. | Elle a suivi des études dans un lycée professionnel.
freelancer | indépendant, pigiste | n | B2 | /ˈfriːlɑːnsər/ | The freelancer works from home. | L'indépendant travaille depuis chez lui.
intern | stagiaire | n | B2 | /ˈɪntɜːrn/ | The intern prepared the reports for the department. | Le stagiaire a préparé les rapports pour le service.
mentor | mentor | n | B2 | /ˈmentɔːr/ | Her mentor helped her choose a career path. | Son mentor l'a aidée à choisir une voie professionnelle.
workshop | atelier | n | B1 | /ˈwɜːrkʃɑːp/ | The workshop repairs bicycles and scooters. | L'atelier répare des vélos et des trottinettes.
trainee | stagiaire en formation | n | B1 | /ˌtreɪˈniː/ | The trainee learns the trade from an expert. | Le stagiaire apprend le métier auprès d'un expert.
craft | artisanat, savoir-faire | n | B2 | /kræft/ | Woodworking is a craft passed down for generations. | Le travail du bois est un savoir-faire transmis depuis des générations.
surveyor | géomètre, expert | n | C1 | /sərˈveɪər/ | The surveyor measured the land carefully. | Le géomètre a mesuré le terrain avec soin.
diplomat | diplomate | n | C1 | /ˈdɪpləmæt/ | The diplomat negotiated a fragile peace. | Le diplomate a négocié une paix fragile.
archaeologist | archéologue | n | C1 | /ˌɑːrkiˈɒlədʒɪst/ | The archaeologist found ancient coins in the soil. | L'archéologue a trouvé d'anciennes pièces dans le sol.
notary | notaire | n | C1 | /ˈnoʊtəri/ | The notary read the will aloud. | Le notaire a lu le testament à voix haute.
tradesperson | artisan, corps de métier | n | C1 | /ˈtreɪdzpɜːrsn/ | The tradesperson gave us a free quote. | L'artisan nous a fait un devis gratuit.
civil servant | fonctionnaire | n | C1 | /ˌsɪvl ˈsɜːrvənt/ | My aunt is a civil servant at the town hall. | Ma tante est fonctionnaire à la mairie.
plasterer | plâtrier | n | C1 | /ˈplæstərər/ | The plasterer finished the walls by Friday. | Le plâtrier a fini les murs pour vendredi.
janitor | concierge, gardien | n | C1 | /ˈdʒænɪtər/ | The janitor locks the building at night. | Le concierge ferme le bâtiment la nuit.
undertaker | entrepreneur de pompes funèbres | n | C1 | /ˈʌndərteɪkər/ | The undertaker organised the funeral with care. | L'entrepreneur de pompes funèbres a organisé les obsèques avec soin.
stonemason | tailleur de pierre | n | C2 | /ˈstoʊnmeɪsn/ | The stonemason carved a statue from marble. | Le tailleur de pierre a sculpté une statue dans le marbre.
glazier | vitrier | n | C2 | /ˈɡleɪziər/ | The glazier replaced the broken window at dawn. | Le vitrier a remplacé la fenêtre cassée à l'aube.
upholsterer | tapissier | n | C2 | /ʌpˈhoʊlstərər/ | The upholsterer restored the old armchair. | Le tapissier a restauré le vieux fauteuil.
cartographer | cartographe | n | C2 | /kɑːrˈtɒɡrəfər/ | The cartographer drew a detailed map of the valley. | Le cartographe a dessiné une carte détaillée de la vallée.
to train | former | v | A2 | /treɪn/ | They train new staff every autumn. | Ils forment le nouveau personnel chaque automne.
to build | construire | v | A2 | /bɪld/ | The firm will build a new bridge next year. | L'entreprise va construire un nouveau pont l'année prochaine.
to design | concevoir | v | B1 | /dɪˈzaɪn/ | She will design websites for small shops. | Elle va concevoir des sites web pour de petites boutiques.
to weld | souder | v | B2 | /weld/ | He learned to weld steel at school. | Il a appris à souder l'acier à l'école.
to qualify | obtenir un diplôme, être qualifié | v | B2 | /ˈkwɒlɪfaɪ/ | She hopes to qualify as a nurse soon. | Elle espère obtenir bientôt son diplôme d'infirmière.
to take orders | prendre des commandes | expr | B2 | /teɪk ˈɔːrdərz/ | The waiter must take orders quickly. | Le serveur doit prendre les commandes rapidement.
to serve customers | servir les clients | expr | B1 | /ˈsɜːrv ˈkʌstəmərz/ | Our staff serve customers all day long. | Notre personnel sert les clients toute la journée.
to work shifts | travailler par roulement | expr | B2 | /wɜːrk ʃɪfts/ | Nurses often work shifts at night. | Les infirmières travaillent souvent par roulement la nuit.
to be on call | être d'astreinte | expr | C1 | /biː ɒn kɔːl/ | You will be on call tonight. | Tu seras d'astreinte ce soir.
waitress | serveuse | n | A2 | /ˈweɪtrəs/ | The waitress smiled and took our order. | La serveuse a souri et pris notre commande.
beautician | esthéticienne | n | B1 | /bjuːˈtɪʃn/ | The beautician gave me a facial. | L'esthéticienne m'a fait un soin du visage.
bus driver | conducteur de bus | n | A2 | /bʌs ˈdraɪvər/ | The bus driver waved to the children. | Le conducteur de bus a salué les enfants.
lorry driver | chauffeur de camion | n | B1 | /ˈlɒri ˈdraɪvər/ | The lorry driver stopped for a coffee. | Le chauffeur de camion s'est arrêté pour un café.
supervisor | superviseur | n | B2 | /ˈsuːpərvaɪzər/ | The supervisor checks each shift. | Le superviseur contrôle chaque équipe.
employer | employeur | n | B1 | /ɪmˈplɔɪər/ | The employer offered her a permanent contract. | L'employeur lui a proposé un contrat permanent.
sales assistant | vendeur | n | A2 | /seɪlz əˈsɪstənt/ | The sales assistant helped me choose a jacket. | Le vendeur m'a aidé à choisir une veste.
dock worker | docker | n | C1 | /dɒk ˈwɜːrkər/ | Dock workers unloaded the ship overnight. | Les dockers ont déchargé le navire pendant la nuit.
ranger | garde forestier | n | B2 | /ˈreɪndʒər/ | The ranger guided us through the forest. | Le garde forestier nous a guidés dans la forêt.
secretary | secrétaire | n | B1 | /ˈsekrətri/ | The secretary answers the phone all day. | La secrétaire répond au téléphone toute la journée.
builder | ouvrier du bâtiment | n | B1 | /ˈbɪldər/ | The builder will start work on Monday. | L'ouvrier du bâtiment commencera le travail lundi.
musician | musicien | n | A2 | /mjuːˈzɪʃn/ | The musician plays in the city square. | Le musicien joue sur la place de la ville.
vet | vétérinaire | n | A2 | /vet/ | The vet checked the dog's paw. | Le vétérinaire a examiné la patte du chien.
shopkeeper | commerçant | n | B1 | /ˈʃɒpkiːpər/ | The shopkeeper gave me a free sweet. | Le commerçant m'a donné un bonbon gratuit.
florist | fleuriste | n | A2 | /ˈflɒrɪst/ | The florist arranged the roses beautifully. | Le fleuriste a magnifiquement arrangé les roses.
cobbler | cordonnier | n | B2 | /ˈkɒblər/ | The cobbler repaired my boots. | Le cordonnier a réparé mes bottes.
glassblower | souffleur de verre | n | C1 | /ˈɡlɑːsbləʊər/ | The glassblower shaped a vase from molten glass. | Le souffleur de verre a façonné un vase dans du verre fondu.
potter | potier | n | B2 | /ˈpɒtər/ | The potter shapes clay on a wheel. | Le potier façonne l'argile sur un tour.
profession | profession | n | B1 | /prəˈfeʃn/ | Teaching is a noble profession. | L'enseignement est une noble profession.
nurse's aide | aide-soignant | n | B2 | /ˌnɜːsɪz ˈeɪd/ | She works as a nurse's aide. | Elle travaille comme aide-soignante.
paediatrician | pédiatre | n | C1 | /ˌpiːdiəˈtrɪʃn/ | Take the baby to the paediatrician. | Emmène le bébé chez le pédiatre.
cardiologist | cardiologue | n | C1 | /ˌkɑːdiˈɒlədʒɪst/ | The cardiologist checked his heart. | Le cardiologue a examiné son cœur.
dermatologist | dermatologue | n | C1 | /ˌdɜːməˈtɒlədʒɪst/ | See a dermatologist about that rash. | Va voir un dermatologue pour ces rougeurs.
psychiatrist | psychiatre | n | C1 | /saɪˈkaɪətrɪst/ | The psychiatrist listened carefully. | Le psychiatre a écouté attentivement.
web developer | développeur web | n | B1 | /ˈweb dɪˌveləpər/ | She works as a web developer. | Elle travaille comme développeuse web.
software engineer | ingénieur logiciel | n | B2 | /ˈsɒftweər ˌendʒɪˈnɪər/ | He is a software engineer in Paris. | Il est ingénieur logiciel à Paris.
data scientist | data scientist | n | C1 | /ˈdeɪtə ˌsaɪəntɪst/ | Data scientists analyse huge datasets. | Les data scientists analysent d'énormes jeux de données.
graphic designer | graphiste | n | B2 | /ˌɡræfɪk dɪˈzaɪnər/ | A graphic designer made our logo. | Un graphiste a créé notre logo.
editor in chief | rédacteur en chef | n | C1 | /ˌedɪtər ɪn ˈtʃiːf/ | The editor in chief approved the article. | Le rédacteur en chef a validé l'article.
real estate agent | agent immobilier | n | B2 | /ˈrɪəl ɪˌsteɪt ˌeɪdʒənt/ | The real estate agent showed us the flat. | L'agent immobilier nous a fait visiter l'appartement.
insurance agent | agent d'assurances | n | B2 | /ɪnˈʃʊərəns ˌeɪdʒənt/ | Call your insurance agent after the accident. | Appelle ton assureur après l'accident.
consultant | consultant | n | B2 | /kənˈsʌltənt/ | The company hired a consultant. | L'entreprise a engagé un consultant.
salesman | vendeur, commercial | n | B1 | /ˈseɪlzmən/ | The salesman showed us new cars. | Le vendeur nous a montré des voitures neuves.
estate agent | agent immobilier | n | B2 | /ɪˈsteɪt ˌeɪdʒənt/ | The estate agent found us a house. | L'agent immobilier nous a trouvé une maison.
taxi driver | chauffeur de taxi | n | A2 | /ˈtæksi ˌdraɪvər/ | The taxi driver knew a shortcut. | Le chauffeur de taxi connaissait un raccourci.
delivery driver | livreur | n | B1 | /dɪˈlɪvəri ˌdraɪvər/ | The delivery driver left the parcel. | Le livreur a laissé le colis.
pastry chef | pâtissier | n | B1 | /ˈpeɪstri ʃef/ | The pastry chef made a wedding cake. | Le pâtissier a fait une pièce montée.
security officer | agent de sécurité | n | B1 | /sɪˈkjʊərəti ˌɒfɪsər/ | A security officer checked our tickets. | Un agent de sécurité a contrôlé nos billets.
customs officer | douanier | n | B2 | /ˈkʌstəmz ˌɒfɪsər/ | The customs officer opened my suitcase. | Le douanier a ouvert ma valise.
air hostess | hôtesse de l'air | n | B1 | /ˈeə ˌhəʊstəs/ | The air hostess served drinks. | L'hôtesse de l'air a servi des boissons.
flight attendant | steward, hôtesse de l'air | n | B1 | /ˈflaɪt əˌtendənt/ | The flight attendant showed the exits. | Le steward a montré les sorties.
fishmonger | poissonnier | n | B2 | /ˈfɪʃmʌŋɡər/ | The fishmonger cleaned the fish for us. | Le poissonnier nous a vidé le poisson.
barber | barbier, coiffeur pour hommes | n | B1 | /ˈbɑːbər/ | I go to the barber every month. | Je vais chez le barbier tous les mois.
dressmaker | couturière | n | B2 | /ˈdresmeɪkər/ | The dressmaker made my wedding dress. | La couturière a fait ma robe de mariée.
jeweller | bijoutier | n | B2 | /ˈdʒuːələr/ | The jeweller repaired my ring. | Le bijoutier a réparé ma bague.
watchmaker | horloger | n | C1 | /ˈwɒtʃmeɪkər/ | The watchmaker fixed my old watch. | L'horloger a réparé ma vieille montre.
blacksmith | forgeron | n | B2 | /ˈblæksmɪθ/ | The blacksmith shaped the hot iron. | Le forgeron façonnait le fer chaud.
painter and decorator | peintre en bâtiment | n | B2 | /ˌpeɪntər ənd ˈdekəreɪtər/ | A painter and decorator redid our kitchen. | Un peintre en bâtiment a refait notre cuisine.
roofer | couvreur | n | C1 | /ˈruːfər/ | The roofer fixed the tiles. | Le couvreur a réparé les tuiles.
tiler | carreleur | n | C1 | /ˈtaɪlər/ | The tiler laid the bathroom floor. | Le carreleur a posé le sol de la salle de bains.
factory worker | ouvrier d'usine | n | A2 | /ˈfæktəri ˌwɜːkər/ | He is a factory worker in Lille. | Il est ouvrier d'usine à Lille.
labourer | manœuvre, ouvrier | n | B2 | /ˈleɪbərər/ | Labourers worked on the road. | Des ouvriers travaillaient sur la route.
technician | technicien | n | B1 | /tekˈnɪʃn/ | A technician repaired the internet. | Un technicien a réparé internet.
social media manager | community manager | n | B2 | /ˌsəʊʃl ˈmiːdiə ˌmænɪdʒər/ | The brand hired a social media manager. | La marque a engagé un community manager.
head chef | chef cuisinier | n | B1 | /ˌhed ˈʃef/ | The head chef created a new menu. | Le chef a créé un nouveau menu.
job title | intitulé de poste | n | B2 | /ˈdʒɒb ˌtaɪtl/ | What's your job title? | Quel est l'intitulé de ton poste ?
earn a living | gagner sa vie | expr | B1 | /ˌɜːn ə ˈlɪvɪŋ/ | It's hard to earn a living as an artist. | C'est dur de gagner sa vie comme artiste.
make a living | gagner sa vie | expr | B1 | /ˌmeɪk ə ˈlɪvɪŋ/ | He wants to make a living selling clothes. | Il veut gagner sa vie en vendant des vêtements.
retired | retraité | adj | A2 | /rɪˈtaɪəd/ | My grandfather is retired. | Mon grand-père est à la retraite.
employed | employé, salarié | adj | B1 | /ɪmˈplɔɪd/ | She is employed by a bank. | Elle est employée par une banque.
career change | reconversion | n | B2 | /kəˈrɪə tʃeɪndʒ/ | At forty, he made a career change. | À quarante ans, il s'est reconverti.
vocation | vocation | n | C1 | /vəʊˈkeɪʃn/ | Teaching is her true vocation. | L'enseignement est sa véritable vocation.
on-the-job training | formation sur le terrain | n | C1 | /ˌɒn ðə ˌdʒɒb ˈtreɪnɪŋ/ | The company offers on-the-job training. | L'entreprise propose une formation sur le terrain.
job satisfaction | satisfaction au travail | n | B2 | /ˈdʒɒb ˌsætɪsˌfækʃn/ | Nurses often have high job satisfaction. | Les infirmières sont souvent très satisfaites de leur travail.
barista | barista | n | B1 | /bəˈriːstə/ | The barista made me a cappuccino. | Le barista m'a préparé un cappuccino.
bartender | barman | n | B1 | /ˈbɑːtendər/ | The bartender served us two juices. | Le barman nous a servi deux jus.
seamstress | couturière | n | B2 | /ˈsiːmstrəs/ | The seamstress shortened my dress. | La couturière a raccourci ma robe.
shoemaker | cordonnier, chausseur | n | B2 | /ˈʃuːmeɪkər/ | The shoemaker repaired my boots. | Le cordonnier a réparé mes bottes.
landscaper | paysagiste | n | B2 | /ˈlændskeɪpər/ | A landscaper redesigned our garden. | Un paysagiste a refait notre jardin.
joiner | menuisier | n | B2 | /ˈdʒɔɪnər/ | The joiner made new windows. | Le menuisier a fabriqué de nouvelles fenêtres.
decorator | peintre décorateur | n | B1 | /ˈdekəreɪtər/ | The decorators are painting the kitchen. | Les peintres refont la cuisine.
civil engineer | ingénieur en génie civil | n | B2 | /ˌsɪvl ˌendʒɪˈnɪər/ | A civil engineer designed the bridge. | Un ingénieur en génie civil a conçu le pont.
draughtsman | dessinateur industriel | n | C1 | /ˈdrɑːftsmən/ | The draughtsman drew the plans. | Le dessinateur a tracé les plans.
web designer | concepteur de sites web | n | B1 | /ˈweb dɪˌzaɪnər/ | She works as a web designer. | Elle est conceptrice de sites web.
developer | développeur | n | B1 | /dɪˈveləpər/ | He's a developer at a startup. | Il est développeur dans une start-up.
IT technician | technicien informatique | n | B1 | /ˌaɪ ˈtiː tekˌnɪʃn/ | The IT technician fixed my laptop. | Le technicien informatique a réparé mon ordinateur.
data analyst | analyste de données | n | B2 | /ˈdeɪtə ˌænəlɪst/ | Data analysts are in high demand. | Les analystes de données sont très recherchés.
bookkeeper | aide-comptable | n | C1 | /ˈbʊkkiːpər/ | The bookkeeper records every payment. | L'aide-comptable enregistre chaque paiement.
financial adviser | conseiller financier | n | B2 | /faɪˌnænʃl ədˈvaɪzər/ | Talk to a financial adviser. | Parle à un conseiller financier.
insurance broker | courtier en assurances | n | C1 | /ɪnˈʃʊərəns ˌbrəʊkər/ | An insurance broker found us a cheaper policy. | Un courtier nous a trouvé une assurance moins chère.
air traffic controller | contrôleur aérien | n | B2 | /ˌeə ˈtræfɪk kənˌtrəʊlər/ | Air traffic controllers went on strike. | Les contrôleurs aériens ont fait grève.
truck driver | chauffeur routier (US) | n | A2 | /ˈtrʌk ˌdraɪvər/ | My father is a truck driver. | Mon père est chauffeur routier.
train driver | conducteur de train | n | A2 | /ˈtreɪn ˌdraɪvər/ | The train driver announced a delay. | Le conducteur a annoncé un retard.
carer | aidant, auxiliaire de vie | n | B2 | /ˈkeərər/ | She's a full-time carer for her mother. | Elle est l'aidante de sa mère à plein temps.
care worker | aide-soignant, auxiliaire de vie | n | B1 | /ˈkeə ˌwɜːkər/ | Care workers visit him every day. | Des auxiliaires de vie passent chez lui chaque jour.
childminder | assistante maternelle | n | B1 | /ˈtʃaɪldmaɪndər/ | Our childminder looks after three children. | Notre nounou garde trois enfants.
dancer | danseur | n | A1 | /ˈdɑːnsər/ | She wants to be a dancer. | Elle veut devenir danseuse.
film director | réalisateur | n | B1 | /ˈfɪlm dəˌrektər/ | The film director won an award. | Le réalisateur a reçu un prix.
fitness instructor | moniteur de fitness | n | B1 | /ˈfɪtnəs ɪnˌstrʌktər/ | The fitness instructor pushed us hard. | Le moniteur nous a fait travailler dur.
office worker | employé de bureau | n | A2 | /ˈɒfɪs ˌwɜːkər/ | Office workers sit all day. | Les employés de bureau restent assis toute la journée.
clerk | employé (de bureau), commis | n | B1 | /klɑːk/ | The clerk stamped my form. | L'employé a tamponné mon formulaire.
businessman | homme d'affaires | n | A2 | /ˈbɪznəsmən/ | He's a successful businessman. | C'est un homme d'affaires prospère.
businesswoman | femme d'affaires | n | A2 | /ˈbɪznəswʊmən/ | She's a famous businesswoman. | C'est une femme d'affaires célèbre.
saleswoman | vendeuse, commerciale | n | B1 | /ˈseɪlzwʊmən/ | The saleswoman showed us new cars. | La commerciale nous a montré des voitures neuves.
sales rep | représentant commercial | n | B2 | /ˈseɪlz rep/ | A sales rep visited the shop. | Un représentant est passé au magasin.
HR manager | responsable RH | n | B2 | /ˌeɪtʃ ˈɑː ˌmænɪdʒər/ | The HR manager interviewed me. | La responsable RH m'a fait passer l'entretien.
caretaker | gardien, concierge | n | B1 | /ˈkeəteɪkər/ | The school caretaker opens the gates. | Le gardien de l'école ouvre le portail.
warehouse worker | magasinier | n | B1 | /ˈweəhaʊs ˌwɜːkər/ | Warehouse workers start at dawn. | Les magasiniers commencent à l'aube.
forklift driver | cariste | n | B2 | /ˈfɔːklɪft ˌdraɪvər/ | He's a forklift driver in a warehouse. | Il est cariste dans un entrepôt.
butler | majordome | n | B2 | /ˈbʌtlər/ | The butler opened the door. | Le majordome a ouvert la porte.
maid | femme de chambre, domestique | n | B1 | /meɪd/ | The maid cleaned our room. | La femme de chambre a nettoyé notre chambre.
housekeeper | gouvernante | n | B2 | /ˈhaʊskiːpər/ | The housekeeper runs the house. | La gouvernante tient la maison.
chauffeur | chauffeur (privé) | n | B2 | /ˈʃəʊfər/ | The minister's chauffeur waited outside. | Le chauffeur du ministre attendait dehors.
weaver | tisserand | n | B2 | /ˈwiːvər/ | The weaver made a carpet by hand. | Le tisserand a fait un tapis à la main.
bookbinder | relieur | n | C1 | /ˈbʊkbaɪndər/ | The bookbinder restored the old Qur'an. | Le relieur a restauré le vieux Coran.
typesetter | typographe, compositeur | n | C2 | /ˈtaɪpsetər/ | The typesetter prepared the pages. | Le typographe a composé les pages.
statistician | statisticien | n | C1 | /ˌstætɪˈstɪʃn/ | The statistician analysed the survey. | Le statisticien a analysé l'enquête.
actuary | actuaire | n | C2 | /ˈæktʃuəri/ | An actuary calculates insurance risks. | Un actuaire calcule les risques d'assurance.
radiographer | manipulateur radio | n | C1 | /ˌreɪdiˈɒɡrəfər/ | The radiographer took an X-ray. | Le manipulateur radio a fait une radiographie.
dietitian | diététicien | n | B2 | /ˌdaɪəˈtɪʃn/ | The dietitian planned my meals. | Le diététicien a planifié mes repas.
nutritionist | nutritionniste | n | B2 | /njuˈtrɪʃənɪst/ | A nutritionist gave a talk at school. | Une nutritionniste a fait une intervention à l'école.
speech therapist | orthophoniste | n | B2 | /ˈspiːtʃ ˌθerəpɪst/ | The speech therapist helps children who stutter. | L'orthophoniste aide les enfants qui bégaient.
occupational therapist | ergothérapeute | n | C1 | /ˌɒkjuˌpeɪʃənl ˈθerəpɪst/ | An occupational therapist adapted her home. | Un ergothérapeute a adapté son logement.
anaesthetist | anesthésiste | n | C1 | /əˈniːsθətɪst/ | The anaesthetist explained the operation. | L'anesthésiste a expliqué l'opération.
gynaecologist | gynécologue | n | C1 | /ˌɡaɪnəˈkɒlədʒɪst/ | She has an appointment with a gynaecologist. | Elle a rendez-vous chez le gynécologue.
ophthalmologist | ophtalmologiste | n | C1 | /ˌɒfθælˈmɒlədʒɪst/ | The ophthalmologist checked my eyes. | L'ophtalmologiste m'a examiné les yeux.
neurologist | neurologue | n | C1 | /njʊəˈrɒlədʒɪst/ | The neurologist ordered a brain scan. | Le neurologue a demandé un scanner du cerveau.
orthodontist | orthodontiste | n | C1 | /ˌɔːθəˈdɒntɪst/ | The orthodontist fitted my braces. | L'orthodontiste m'a posé un appareil.
podiatrist | podologue | n | C1 | /pəˈdaɪətrɪst/ | The podiatrist made me insoles. | Le podologue m'a fait des semelles.
osteopath | ostéopathe | n | C1 | /ˈɒstiəpæθ/ | I saw an osteopath for my back. | J'ai vu un ostéopathe pour mon dos.
veterinary nurse | auxiliaire vétérinaire | n | B2 | /ˈvetnri nɜːs/ | The veterinary nurse held the dog. | L'auxiliaire vétérinaire a tenu le chien.
dental hygienist | hygiéniste dentaire | n | C1 | /ˌdentl haɪˈdʒiːnɪst/ | The dental hygienist cleaned my teeth. | L'hygiéniste dentaire m'a nettoyé les dents.
lab technician | technicien de laboratoire | n | B2 | /ˈlæb tekˌnɪʃn/ | The lab technician tested the samples. | Le technicien de laboratoire a analysé les échantillons.
sound engineer | ingénieur du son | n | B2 | /ˈsaʊnd ˌendʒɪnɪər/ | The sound engineer mixed the album. | L'ingénieur du son a mixé l'album.
stuntman | cascadeur | n | B2 | /ˈstʌntmæn/ | A stuntman jumped from the roof. | Un cascadeur a sauté du toit.
make-up artist | maquilleur | n | B1 | /ˈmeɪk ʌp ˌɑːtɪst/ | The make-up artist prepared the actors. | Le maquilleur a préparé les acteurs.
costume designer | costumier | n | B2 | /ˈkɒstjuːm dɪˌzaɪnər/ | The costume designer won an Oscar. | Le costumier a remporté un Oscar.
set designer | décorateur de théâtre | n | B2 | /ˈset dɪˌzaɪnər/ | The set designer built a medieval street. | Le décorateur a construit une rue médiévale.
screenwriter | scénariste | n | B2 | /ˈskriːnraɪtər/ | The screenwriter adapted the novel. | Le scénariste a adapté le roman.
copywriter | rédacteur publicitaire | n | C1 | /ˈkɒpiraɪtər/ | The copywriter wrote the slogan. | Le rédacteur publicitaire a écrit le slogan.
ghostwriter | prête-plume | n | C1 | /ˈɡəʊstraɪtər/ | A ghostwriter wrote his memoirs. | Un prête-plume a écrit ses mémoires.
proofreader | correcteur | n | C1 | /ˈpruːfriːdər/ | The proofreader found ten typos. | Le correcteur a trouvé dix coquilles.
illustrator | illustrateur | n | B1 | /ˈɪləstreɪtər/ | The illustrator drew the book cover. | L'illustratrice a dessiné la couverture du livre.
animator | animateur (dessin animé) | n | B2 | /ˈænɪmeɪtər/ | She works as an animator at a studio. | Elle est animatrice dans un studio.
game designer | concepteur de jeux vidéo | n | B1 | /ˈɡeɪm dɪˌzaɪnər/ | He dreams of being a game designer. | Il rêve d'être concepteur de jeux vidéo.
UX designer | designer UX | n | C1 | /ˌjuː ˈeks dɪˌzaɪnər/ | The UX designer simplified the app. | La designer UX a simplifié l'appli.
community manager | animateur de communauté | n | B2 | /kəˈmjuːnəti ˌmænɪdʒər/ | The community manager answers comments. | Le community manager répond aux commentaires.
digital marketer | spécialiste du marketing numérique | n | C1 | /ˌdɪdʒɪtl ˈmɑːkɪtər/ | A digital marketer ran our campaign. | Un spécialiste du marketing numérique a mené notre campagne.
SEO specialist | spécialiste du référencement | n | C1 | /ˌes iː ˈəʊ ˌspeʃəlɪst/ | The SEO specialist improved our ranking. | Le spécialiste du référencement a amélioré notre classement.
project manager | chef de projet | n | B2 | /ˈprɒdʒekt ˌmænɪdʒər/ | The project manager set the deadlines. | La cheffe de projet a fixé les échéances.
product manager | chef de produit | n | C1 | /ˈprɒdʌkt ˌmænɪdʒər/ | The product manager chose the new features. | Le chef de produit a choisi les nouvelles fonctions.
officer | agent, officier | n | A1 | /ˈɒfɪsə/ | Ask a police officer for help. | Demande de l'aide à un agent de police.
saw | scie | n | B1 | /sɔː/ | He cut the wood with a saw. | Il a coupé le bois avec une scie.
drill | perceuse | n | B1 | /drɪl/ | He used a drill to make a hole in the wall. | Il a percé le mur avec une perceuse.
adviser | conseiller | n | B1 | /ədˈvaɪzə/ | She is a financial adviser. | Elle est conseillère financière.
barman | barman | n | B1 | /ˈbɑːmən/ | The barman made us two lemonades. | Le barman nous a préparé deux limonades.
hammer | marteau | n | B1 | /ˈhæmə/ | Pass me the hammer, please. | Passe-moi le marteau, s'il te plaît.
instructor | moniteur, instructeur | n | B1 | /ɪnˈstrʌktə/ | My driving instructor is very patient. | Mon moniteur d'auto-école est très patient.
analyst | analyste | n | B2 | /ˈænəlɪst/ | She works as a financial analyst. | Elle travaille comme analyste financière.
axe | hache | n | B2 | /æks/ | He chopped the wood with an axe. | Il a coupé le bois à la hache.
foreman | contremaître | n | B2 | /ˈfɔːmən/ | The foreman checked the work. | Le contremaître a vérifié le travail.
inspector | inspecteur, contrôleur | n | B2 | /ɪnˈspektə/ | The ticket inspector checked our tickets. | Le contrôleur a vérifié nos billets.
investigator | enquêteur | n | B2 | /ɪnˈvestɪɡeɪtə/ | The investigators found new evidence. | Les enquêteurs ont trouvé de nouvelles preuves.
keeper | gardien | n | B2 | /ˈkiːpə/ | The zoo keeper fed the lions. | Le gardien du zoo a nourri les lions.
masseur | masseur | n | B2 | /mæˈsɜː/ | The masseur relaxed my back. | Le masseur m'a détendu le dos.
mortar | mortier | n | C1 | /ˈmɔːtə/ | The bricks are held together with mortar. | Les briques sont liées par du mortier.
operator | opérateur, standardiste | n | B2 | /ˈɒpəreɪtə/ | Ask the operator for the number. | Demande le numéro au standard.
servant | serviteur, domestique | n | B2 | /ˈsɜːvənt/ | Abdullah means "servant of God". | Abdallah signifie « serviteur de Dieu ».
stylist | styliste ; coiffeur | n | B2 | /ˈstaɪlɪst/ | My hair stylist is very creative. | Mon coiffeur est très créatif.
workbench | établi | n | B2 | /ˈwɜːkbentʃ/ | The tools are on the workbench. | Les outils sont sur l'établi.
workman | ouvrier | n | B2 | /ˈwɜːkmən/ | The workmen are repairing the roof. | Les ouvriers réparent le toit.
cement | ciment | n | B2 | /sɪˈment/ | They mixed sand and cement. | Ils ont mélangé du sable et du ciment.
slate | ardoise | n | C1 | /sleɪt/ | The roof is covered with slate. | Le toit est couvert d'ardoise.
warden | gardien, directeur (de prison) | n | C1 | /ˈwɔːdn/ | The prison warden refused the visit. | Le directeur de la prison a refusé la visite.
furnace | fourneau, four | n | C1 | /ˈfɜːnɪs/ | The steel is melted in a furnace. | L'acier est fondu dans un fourneau.
attendant | préposé, employé | n | B2 | /əˈtendənt/ | Ask the car park attendant. | Demande au gardien du parking.
asphalt | asphalte, bitume | n | C1 | /ˈæsfælt/ | They laid new asphalt on the road. | Ils ont posé un nouveau revêtement sur la route.
handler | maître-chien ; manutentionnaire | n | C1 | /ˈhændlə/ | The dog handler searched the bags. | Le maître-chien a fouillé les sacs.
primer | apprêt, sous-couche ; abécédaire | n | C2 | /ˈpraɪmə/ | Apply a primer before painting. | Applique une sous-couche avant de peindre.
clamp | serre-joint, pince | n | C1 | /klæmp/ | Hold the wood with a clamp. | Maintiens le bois avec un serre-joint.
medic | secouriste, médecin militaire | n | C1 | /ˈmedɪk/ | The medic treated the wounded. | Le secouriste a soigné les blessés.
hostess | hôtesse | n | C1 | /ˈhəʊstəs/ | The hostess welcomed the guests. | L'hôtesse a accueilli les invités.
to chisel | ciseler, sculpter | v | C1 | /ˈtʃɪzl/ | He chiselled the letters into the stone. | Il a gravé les lettres au ciseau dans la pierre.
hotelier | hôtelier | n | C2 | /həʊˈteliə/ | The hotelier welcomed us personally. | L'hôtelier nous a accueillis personnellement.
masonry | maçonnerie | n | C2 | /ˈmeɪsənri/ | The masonry is crumbling. | La maçonnerie s'effrite.
hardwood | bois dur | n | C2 | /ˈhɑːdwʊd/ | The floor is made of hardwood. | Le parquet est en bois dur.
plywood | contreplaqué | n | C2 | /ˈplaɪwʊd/ | The box is made of plywood. | La caisse est en contreplaqué.
artisan | artisan | n | C1 | /ˌɑːtɪˈzæn/ | Local artisans make the pottery. | Des artisans locaux fabriquent la poterie.
goldsmith | orfèvre | n | C2 | /ˈɡəʊldsmɪθ/ | The goldsmith made the ring. | L'orfèvre a fabriqué la bague.
chainsaw | tronçonneuse | n | C1 | /ˈtʃeɪnsɔː/ | He cut the tree with a chainsaw. | Il a coupé l'arbre à la tronçonneuse.
craftsmen | artisans | n | B2 | /ˈkrɑːftsmən/ | Skilled craftsmen built the mosque. | Des artisans qualifiés ont construit la mosquée.
screwdriver | tournevis | n | B2 | /ˈskruːdraɪvə/ | Pass me the screwdriver. | Passe-moi le tournevis.
spanner | clé (à molette, plate) | n | B2 | /ˈspænə/ | Tighten the bolt with a spanner. | Serre le boulon avec une clé.
pliers | pince | n | B2 | /ˈplaɪəz/ | Cut the wire with pliers. | Coupe le fil avec une pince.
sandpaper | papier de verre | n | B2 | /ˈsændpeɪpə/ | Smooth the wood with sandpaper. | Ponce le bois avec du papier de verre.
toolbox | boîte à outils | n | B2 | /ˈtuːlbɒks/ | The hammer is in the toolbox. | Le marteau est dans la boîte à outils.
spirit level | niveau à bulle | n | C1 | /ˈspɪrɪt levl/ | Use a spirit level to hang the shelf. | Utilise un niveau à bulle pour fixer l'étagère.
paint roller | rouleau à peinture | n | B2 | /ˈpeɪnt rəʊlə/ | Paint the wall with a roller. | Peins le mur au rouleau.
varnish | vernis | n | C1 | /ˈvɑːnɪʃ/ | Apply a coat of varnish to the table. | Applique une couche de vernis sur la table.
putty | mastic | n | C2 | /ˈpʌti/ | Fill the holes with putty. | Bouche les trous avec du mastic.
installer | installateur | n | C1 | /ɪnˈstɔːlə/ | The installer fitted the new boiler. | L'installateur a posé la nouvelle chaudière.
journeyman | compagnon (artisan) | n | C2 | /ˈdʒɜːnimən/ | He worked as a journeyman carpenter. | Il travaillait comme compagnon charpentier.
bookseller | libraire | n | B2 | /ˈbʊkselə/ | The bookseller recommended a good novel. | Le libraire m'a conseillé un bon roman.
linguist | linguiste | n | C1 | /ˈlɪŋɡwɪst/ | She is a linguist who speaks six languages. | C'est une linguiste qui parle six langues.
chiropractor | chiropracteur | n | C2 | /ˈkaɪərəʊpræktə/ | A chiropractor treated my back. | Un chiropracteur a soigné mon dos.
tradesman | artisan, commerçant | n | C1 | /ˈtreɪdzmən/ | A tradesman came to fix the roof. | Un artisan est venu réparer le toit.
appraiser | expert (en évaluation) | n | C2 | /əˈpreɪzə/ | An appraiser valued the house. | Un expert a évalué la maison.
archivist | archiviste | n | C2 | /ˈɑːkɪvɪst/ | The archivist found the old letters. | L'archiviste a retrouvé les vieilles lettres.
neurosurgeon | neurochirurgien | n | C2 | /ˈnjʊərəʊsɜːdʒən/ | The neurosurgeon operated for six hours. | Le neurochirurgien a opéré pendant six heures.
doorman | portier | n | C1 | /ˈdɔːmən/ | The doorman opened the door. | Le portier a ouvert la porte.
technologist | technologue | n | C2 | /tekˈnɒlədʒɪst/ | A food technologist tests the recipes. | Un technologue alimentaire teste les recettes.
oncologist | oncologue | n | C2 | /ɒŋˈkɒlədʒɪst/ | She sees an oncologist every month. | Elle consulte un oncologue chaque mois.
machinist | machiniste, opérateur | n | C2 | /məˈʃiːnɪst/ | He works as a machinist. | Il travaille comme opérateur sur machine.
car mechanic | mécanicien automobile | n | A2 | /ˈkɑː məˌkænɪk/ | The car mechanic found the problem quickly. | Le mécanicien a trouvé la panne rapidement.
lieutenant | lieutenant | n | B2 | /lefˈtenənt/ | The lieutenant gave the order to advance. | Le lieutenant a donné l'ordre d'avancer.
commissioner | commissaire, haut fonctionnaire | n | C1 | /kəˈmɪʃənə/ | The police commissioner held a press conference. | Le préfet de police a tenu une conférence de presse.
colonel | colonel | n | B2 | /ˈkɜːnl/ | The colonel inspected the troops. | Le colonel a passé les troupes en revue.
operative | agent, ouvrier | n | C1 | /ˈɒpərətɪv/ | A secret operative was sent to the city. | Un agent secret a été envoyé dans la ville.
trooper | soldat de cavalerie ; (US) policier | n | C2 | /ˈtruːpə/ | He swears like a trooper. | Il jure comme un charretier.
removal man | déménageur | n | B2 | /rɪˈmuːvl mæn/ | The removal men carried the piano upstairs. | Les déménageurs ont monté le piano à l'étage.
valet | valet ; voiturier | n | C1 | /ˈvæleɪ/ | A valet parked our car at the hotel. | Un voiturier a garé notre voiture à l'hôtel.
digger | pelleteuse ; chercheur (d'or) | n | B2 | /ˈdɪɡə/ | A digger was clearing the building site. | Une pelleteuse déblayait le chantier.
auctioneer | commissaire-priseur | n | C1 | /ˌɔːkʃəˈnɪə/ | The auctioneer brought down his hammer. | Le commissaire-priseur a abattu son marteau.
postmaster | receveur des postes | n | C2 | /ˈpəʊstmɑːstə/ | The village postmaster knew everyone by name. | Le receveur des postes du village connaissait tout le monde par son nom.
padre | aumônier (militaire) | n | C2 | /ˈpɑːdreɪ/ | The padre visited the wounded soldiers. | L'aumônier a rendu visite aux soldats blessés.
supermodel | top-modèle | n | B2 | /ˈsuːpəmɒdl/ | She became a supermodel at eighteen. | Elle est devenue top-modèle à dix-huit ans.
sexton | sacristain, bedeau | n | C2 | /ˈsekstən/ | The sexton rang the church bell. | Le sacristain a sonné la cloche.
matron | infirmière-chef, intendante | n | C1 | /ˈmeɪtrən/ | The school matron looked after sick boarders. | L'intendante de l'école soignait les pensionnaires malades.
fitter | monteur, ajusteur | n | C1 | /ˈfɪtə/ | A gas fitter came to install the boiler. | Un installateur est venu poser la chaudière.
key cutting | reproduction de clés | n | B2 | /ˈkiː ˌkʌtɪŋ/ | The shoe repair shop also does key cutting. | Le cordonnier fait aussi la reproduction de clés.
shoe repair | cordonnerie | n | B1 | /ˈʃuː rɪˌpeə/ | Take your boots to the shoe repair shop. | Apporte tes bottes chez le cordonnier.
sorting office | centre de tri (postal) | n | C1 | /ˈsɔːtɪŋ ˌɒfɪs/ | Collect your parcel from the sorting office. | Récupère ton colis au centre de tri.
mailbag | sac postal | n | B2 | /ˈmeɪlbæɡ/ | The postman emptied his mailbag. | Le facteur a vidé son sac postal.
postwoman | factrice | n | A2 | /ˈpəʊstwʊmən/ | The postwoman brought a parcel. | La factrice a apporté un colis.
forester | garde forestier, forestier | n | C1 | /ˈfɒrɪstə/ | The forester marked the trees to be cut. | Le forestier a marqué les arbres à abattre.
aviator | aviateur | n | C1 | /ˈeɪvieɪtə/ | Amelia Earhart was a famous aviator. | Amelia Earhart était une aviatrice célèbre.
constructor | constructeur | n | C1 | /kənˈstrʌktə/ | The team won the constructors' championship. | L'écurie a remporté le championnat des constructeurs.
chimney sweep | ramoneur | n | B2 | /ˈtʃɪmni swiːp/ | The chimney sweep comes every autumn. | Le ramoneur passe chaque automne.
head waiter | maître d'hôtel | n | B1 | /ˌhed ˈweɪtə/ | The head waiter showed us to our table. | Le maître d'hôtel nous a conduits à notre table.
sous-chef | second de cuisine, sous-chef | n | B2 | /ˈsuː ʃef/ | The sous-chef runs the kitchen on Mondays. | Le second de cuisine dirige la cuisine le lundi.
food critic | critique gastronomique | n | B1 | /ˈfuːd ˌkrɪtɪk/ | A famous food critic praised the restaurant. | Un célèbre critique gastronomique a encensé le restaurant.
coal miner | mineur de charbon | n | B2 | /ˈkəʊl ˌmaɪnə/ | His grandfather was a coal miner in Wales. | Son grand-père était mineur de charbon au pays de Galles.
mailman | facteur (US) | n | A2 | /ˈmeɪlmæn/ | The mailman comes at ten every morning. | Le facteur passe tous les matins à dix heures.
realtor | agent immobilier (US) | n | B2 | /ˈriːəltə/ | Our realtor found us a house in two weeks. | Notre agent immobilier nous a trouvé une maison en deux semaines.
`,
);
