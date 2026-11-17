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
`,
);
