/* Le Truchement : thème « Gens et lieux » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const GENS_LIEUX = theme(
  "gens-lieux",
  "Gens et lieux",
  "Les personnes croisées, les lieux publics et les façons de s'orienter.",
  "MapPin",
  `
crowd | foule | n | A2 | /kraʊd/ | A crowd gathered in front of the theatre. | Une foule s'est rassemblée devant le théâtre.
stranger | inconnu, étranger | n | A2 | /ˈstreɪndʒər/ | Don't talk to strangers in the street. | Ne parle pas aux inconnus dans la rue.
visitor | visiteur, visiteuse | n | A2 | /ˈvɪzɪtər/ | The museum welcomes thousands of visitors. | Le musée accueille des milliers de visiteurs.
guest | invité, invitée | n | A2 | /ɡest/ | We had six guests for dinner. | Nous avons reçu six invités à dîner.
host | hôte, hôtesse | n | B1 | /hoʊst/ | Our host served us tea in the garden. | Notre hôte nous a servi du thé dans le jardin.
citizen | citoyen, citoyenne | n | B1 | /ˈsɪtɪzn/ | Every citizen has the right to vote. | Chaque citoyen a le droit de voter.
resident | habitant, résident | n | B1 | /ˈrezɪdənt/ | Residents must show their card at the gate. | Les résidents doivent montrer leur carte à l'entrée.
newcomer | nouveau venu | n | B1 | /ˈnjuːkʌmər/ | The newcomer quickly made new friends. | Le nouveau venu s'est vite fait de nouveaux amis.
local | habitant du coin | n | B1 | /ˈloʊkl/ | The locals know the best cafés in town. | Les gens du coin connaissent les meilleurs cafés de la ville.
passer-by | passant | n | B1 | /ˌpɑːsərˈbaɪ/ | A passer-by offered to help us. | Un passant nous a proposé son aide.
witness | témoin | n | B1 | /ˈwɪtnəs/ | A witness saw the car leave the car park. | Un témoin a vu la voiture quitter le parking.
bystander | badaud, témoin | n | C1 | /ˈbaɪstændər/ | A bystander called the ambulance at once. | Un badaud a aussitôt appelé l'ambulance.
acquaintance | connaissance | n | B2 | /əˈkweɪntəns/ | He is more of an acquaintance than a friend. | C'est plus une connaissance qu'un ami.
companion | compagnon, compagne | n | B2 | /kəmˈpæniən/ | He became a loyal companion on the way. | Il est devenu un compagnon fidèle tout au long du chemin.
fellow | camarade, semblable | n | B2 | /ˈfeloʊ/ | My fellow students and I signed the petition. | Mes camarades étudiants et moi avons signé la pétition.
to greet | saluer | v | B1 | /ɡriːt/ | She greeted everyone with a warm smile. | Elle a salué tout le monde avec un sourire chaleureux.
to welcome | accueillir | v | A2 | /ˈwelkəm/ | They welcomed us at the door. | Ils nous ont accueillis à la porte.
to beckon | faire signe d'approcher | v | B1 | /ˈbekən/ | She beckoned me to come closer. | Elle m'a fait signe d'approcher.
to nod | hocher la tête | v | B1 | /nɒd/ | She nodded in agreement. | Elle a hoché la tête en signe d'accord.
to shake hands | se serrer la main | expr | A2 | /ʃeɪk hænds/ | We shake hands before every meeting. | Nous nous serrons la main avant chaque réunion.
to hug | serrer dans ses bras | v | A2 | /hʌɡ/ | I hugged my sister at the station. | J'ai serré ma sœur dans mes bras à la gare.
to whisper | chuchoter | v | B1 | /ˈwɪspər/ | She whispered something in my ear. | Elle m'a chuchoté quelque chose à l'oreille.
to shout | crier | v | A2 | /ʃaʊt/ | Don't shout across the room. | Ne crie pas d'un bout à l'autre de la pièce.
to chat | bavarder | v | A2 | /tʃæt/ | We chatted for hours at the café. | Nous avons bavardé pendant des heures au café.
to wander | errer, flâner | v | B1 | /ˈwɒndər/ | We wandered through the old streets. | Nous avons erré dans les vieilles rues.
to bump into | tomber sur quelqu'un | expr | B1 | /bʌmp ˈɪntuː/ | I bumped into my old teacher yesterday. | Je suis tombé sur mon ancien professeur hier.
to drop by | passer voir | expr | B1 | /drɒp baɪ/ | Feel free to drop by any time. | N'hésite pas à passer voir quand tu veux.
to meet up | se retrouver | expr | A2 | /miːt ʌp/ | Let's meet up at the station at six. | Retrouvons-nous à la gare à six heures.
to pop in | passer rapidement | expr | B1 | /pɒp ɪn/ | I'll pop in to see you after lunch. | Je passerai te voir après le déjeuner.
to gossip | cancaner, bavarder | v | B2 | /ˈɡɒsɪp/ | The neighbours love to gossip about the new family. | Les voisins adorent cancaner sur la nouvelle famille.
to point at | montrer du doigt | expr | A2 | /pɔɪnt æt/ | It's rude to point at people in the street. | C'est impoli de montrer les gens du doigt dans la rue.
to stare | dévisager | v | B1 | /ster/ | Everyone stared at the strange painting. | Tout le monde a dévisagé l'étrange tableau.
to glance | jeter un coup d'œil | v | B1 | /ɡlɑːns/ | She glanced at her watch and stood up. | Elle a jeté un coup d'œil à sa montre et s'est levée.
to ignore | ignorer | v | B1 | /ɪɡˈnɔːr/ | He ignored the rude comments. | Il a ignoré les remarques désagréables.
to take a seat | s'asseoir | expr | A1 | /teɪk ə siːt/ | Please take a seat, the doctor is coming. | Asseyez-vous, je vous prie, le médecin arrive.
crossing | passage piéton | n | A2 | /ˈkrɒsɪŋ/ | Use the crossing to cross the road safely. | Utilise le passage piéton pour traverser la route en sécurité.
entrance | entrée | n | A1 | /ˈentrəns/ | The entrance is on the left. | L'entrée se trouve à gauche.
exit | sortie | n | A1 | /ˈeksɪt/ | Follow the signs to the exit. | Suis les panneaux vers la sortie.
turnstile | tourniquet | n | B1 | /ˈtɜːrnstaɪl/ | You need a ticket to pass the turnstile. | Il faut un billet pour passer le tourniquet.
reception | accueil, réception | n | A2 | /rɪˈsepʃn/ | Ask at reception for the key. | Demande à l'accueil la clé.
terrace | terrasse | n | A2 | /ˈterəs/ | We sat on the terrace in the sun. | Nous nous sommes assis sur la terrasse au soleil.
lobby | hall | n | B1 | /ˈlɒbi/ | Wait for me in the lobby. | Attends-moi dans le hall.
hallway | couloir, entrée | n | B1 | /ˈhɔːlweɪ/ | The coats hang in the hallway. | Les manteaux sont accrochés dans l'entrée.
courtyard | cour intérieure | n | B1 | /ˈkɔːrtjɑːrd/ | The children play in the courtyard. | Les enfants jouent dans la cour intérieure.
alley | ruelle | n | B1 | /ˈæli/ | The shop is hidden in a narrow alley. | La boutique est cachée dans une ruelle étroite.
lane | petite route, voie | n | B1 | /leɪn/ | We drove along a narrow country lane. | Nous avons roulé sur une petite route de campagne étroite.
junction | carrefour | n | B2 | /ˈdʒʌŋkʃn/ | Turn right at the next junction. | Tourne à droite au prochain carrefour.
plaza | grande place | n | B2 | /ˈplɑːzə/ | The plaza fills with people in the summer. | La grande place se remplit de monde en été.
boulevard | boulevard | n | B1 | /ˈbuːlvɑːrd/ | We live on a wide boulevard. | Nous habitons sur un grand boulevard.
avenue | avenue | n | B1 | /ˈævənjuː/ | The avenue is lined with plane trees. | L'avenue est bordée de platanes.
district | quartier, district | n | B2 | /ˈdɪstrɪkt/ | This district is famous for its markets. | Ce quartier est célèbre pour ses marchés.
monument | monument | n | B1 | /ˈmɒnjumənt/ | The monument honours the soldiers who fell. | Le monument rend hommage aux soldats tombés au combat.
statue | statue | n | A2 | /ˈstætʃuː/ | There is a statue of a famous poet in the square. | Il y a une statue d'un poète célèbre sur la place.
fountain | fontaine | n | A2 | /ˈfaʊntən/ | Children splash around the fountain. | Les enfants s'éclaboussent autour de la fontaine.
bench | banc | n | A2 | /bentʃ/ | Let's sit on the bench under the tree. | Asseyons-nous sur le banc sous l'arbre.
rooftop | toit-terrasse | n | B2 | /ˈruːftɒp/ | We had drinks on the rooftop. | Nous avons pris un verre sur le toit-terrasse.
harbour | port | n | B1 | /ˈhɑːrbər/ | Boats are docked in the harbour. | Les bateaux sont amarrés dans le port.
public square | place publique | n | B2 | /ˈpʌblɪk skweər/ | People gathered in the public square. | Les gens se sont rassemblés sur la place publique.
precinct | zone piétonne | n | C1 | /ˈpriːsɪŋkt/ | The shopping precinct is closed to cars. | La zone commerçante piétonne est fermée aux voitures.
concourse | grand hall | n | C1 | /ˈkɒŋkɔːrs/ | We waited in the station concourse. | Nous avons attendu dans le grand hall de la gare.
arcade | galerie marchande | n | C1 | /ɑːrˈkeɪd/ | The arcade is full of little shops. | La galerie marchande est pleine de petites boutiques.
threshold | seuil | n | C1 | /ˈθreʃhoʊld/ | She stood on the threshold for a moment. | Elle est restée un instant sur le seuil.
vicinity | environs, alentours | n | C1 | /vɪˈsɪnəti/ | There are no shops in the vicinity. | Il n'y a aucun commerce aux alentours.
periphery | périphérie | n | C1 | /pəˈrɪfəri/ | The periphery of the city is still green. | La périphérie de la ville est encore verte.
to mingle | se mêler à | v | C1 | /ˈmɪŋɡl/ | The guests mingled in the garden. | Les invités se sont mêlés dans le jardin.
to bustle | grouiller, s'activer | v | C1 | /ˈbʌsl/ | The market bustled with shoppers. | Le marché grouillait de clients.
to saunter | flâner, déambuler | v | C2 | /ˈsɔːntər/ | He sauntered down the avenue. | Il a déambulé sur l'avenue.
to loiter | traîner | v | C1 | /ˈlɔɪtər/ | Teenagers loitered outside the cinema. | Des adolescents traînaient devant le cinéma.
congregation | assemblée de fidèles | n | C2 | /ˌkɒŋɡrɪˈɡeɪʃn/ | The congregation sang in unison. | L'assemblée des fidèles chantait à l'unisson.
throng | foule compacte | n | C2 | /θrɒŋ/ | A throng of fans waited at the gate. | Une foule compacte de fans attendait au portail.
commuter | navetteur, navetteuse | n | B2 | /kəˈmjuːtər/ | Commuters rushed onto the platform. | Les navetteurs se sont précipités sur le quai.
cyclist | cycliste | n | A2 | /ˈsaɪklɪst/ | The cyclist waited at the red light. | Le cycliste a attendu au feu rouge.
motorist | automobiliste | n | B2 | /ˈməʊtərɪst/ | Motorists must slow down near the school. | Les automobilistes doivent ralentir près de l'école.
deserted | désert, abandonné | adj | B1 | /dɪˈzɜːrtɪd/ | The square was deserted at midnight. | La place était déserte à minuit.
lively | animé, vivant | adj | B1 | /ˈlaɪvli/ | The market is lively on Saturdays. | Le marché est animé le samedi.
cosmopolitan | cosmopolite | adj | C1 | /ˌkɒzməˈpɒlɪtən/ | London is a cosmopolitan city. | Londres est une ville cosmopolite.
to gather | se rassembler | v | B1 | /ˈɡæðər/ | People gathered outside the town hall. | Les gens se sont rassemblés devant la mairie.
to jostle | bousculer | v | C1 | /ˈdʒɒsl/ | Shoppers jostled for the best bargains. | Les clients se bousculaient pour les meilleures affaires.
to elbow | se frayer un chemin | v | C1 | /ˈelbəʊ/ | He elbowed his way to the front. | Il s'est frayé un chemin jusqu'au premier rang.
to frown | froncer les sourcils | v | B1 | /fraʊn/ | She frowned when she heard the news. | Elle a froncé les sourcils en apprenant la nouvelle.
to gesture | faire un geste | v | B1 | /ˈdʒestʃər/ | He gestured towards the exit. | Il a fait un geste vers la sortie.
encounter | rencontre | n | B2 | /ɪnˈkaʊntər/ | The encounter lasted only a minute. | La rencontre n'a duré qu'une minute.
roadside | bord de la route | n | B2 | /ˈroʊdsaɪd/ | We stopped at a roadside café. | Nous nous sommes arrêtés dans un café au bord de la route.
suburb | banlieue | n | B1 | /ˈsʌbɜːrb/ | They live in a quiet suburb. | Ils habitent dans une banlieue calme.
downtown | centre-ville | n | B1 | /ˌdaʊnˈtaʊn/ | The hotel is downtown, near the station. | L'hôtel est en centre-ville, près de la gare.
outskirts | périphérie, abords | n | B2 | /ˈaʊtskɜːrts/ | The factory is on the outskirts of town. | L'usine se trouve en périphérie de la ville.
waterfront | bord de l'eau | n | B2 | /ˈwɔːtərfrʌnt/ | We walked along the waterfront. | Nous avons marché le long du bord de l'eau.
villager | villageois | n | B1 | /ˈvɪlɪdʒər/ | The villagers gathered for the festival. | Les villageois se sont rassemblés pour la fête.
subway | métro | n | B1 | /ˈsʌbweɪ/ | Take the subway to the city centre. | Prends le métro jusqu'au centre-ville.
to hurry | se dépêcher | v | B1 | /ˈhʌri/ | We must hurry or we'll miss the train. | Nous devons nous dépêcher ou nous raterons le train.
to salute | saluer | v | B2 | /səˈluːt/ | The soldiers saluted the general. | Les soldats ont salué le général.
to nudge | donner un coup de coude | v | C1 | /nʌdʒ/ | She nudged me when the speaker arrived. | Elle m'a donné un coup de coude quand l'orateur est arrivé.
to roam | vagabonder | v | C1 | /roʊm/ | Goats roamed freely on the hills. | Les chèvres vagabondaient librement sur les collines.
to stumble | trébucher | v | B1 | /ˈstʌmbl/ | She stumbled on the cobblestones. | Elle a trébuché sur les pavés.
crosswalk | passage piéton | n | B1 | /ˈkrɒswɔːk/ | Use the crosswalk to cross the road. | Utilise le passage piéton pour traverser.
ticket machine | distributeur de billets | n | B1 | /ˈtɪkɪt məˈʃiːn/ | The ticket machine accepts coins and cards. | Le distributeur de billets accepte les pièces et les cartes.
to hitchhike | faire de l'autostop | v | B2 | /ˈhɪtʃhaɪk/ | They hitchhiked across the country. | Ils ont fait de l'autostop à travers le pays.
hitchhiker | autostoppeur | n | B2 | /ˈhɪtʃhaɪkər/ | The driver stopped for the hitchhiker. | Le conducteur s'est arrêté pour l'autostoppeur.
pothole | nid-de-poule | n | B2 | /ˈpɒthoʊl/ | The car hit a deep pothole. | La voiture a heurté un nid-de-poule profond.
parking space | place de parking | n | A2 | /ˈpɑːrkɪŋ speɪs/ | There isn't a parking space near the church. | Il n'y a pas de place de parking près de l'église.
to overtake | dépasser | v | B2 | /ˌoʊvərˈteɪk/ | It's dangerous to overtake on a bend. | C'est dangereux de dépasser dans un virage.
vending machine | distributeur automatique | n | B1 | /ˈvendɪŋ məˈʃiːn/ | Buy a drink from the vending machine. | Achète une boisson au distributeur automatique.
people | gens | n | A1 | /ˈpiːpl/ | Many people visit the old town. | Beaucoup de gens visitent la vieille ville.
person | personne | n | A1 | /ˈpɜːsn/ | She is a very kind person. | C'est une personne très gentille.
man | homme | n | A1 | /mæn/ | A man asked me the time. | Un homme m'a demandé l'heure.
woman | femme | n | A1 | /ˈwʊmən/ | The woman smiled at us. | La femme nous a souri.
gentleman | monsieur | n | A2 | /ˈdʒentlmən/ | This gentleman is waiting for you. | Ce monsieur vous attend.
lady | dame | n | A2 | /ˈleɪdi/ | An old lady sat on the bench. | Une vieille dame était assise sur le banc.
neighbourly | de bon voisinage | adj | C1 | /ˈneɪbəli/ | It was a neighbourly gesture. | C'était un geste de bon voisinage.
foreigner | étranger | n | B1 | /ˈfɒrənər/ | Foreigners are welcome here. | Les étrangers sont les bienvenus ici.
street vendor | vendeur ambulant | n | B2 | /ˈstriːt ˌvendər/ | A street vendor sold grilled corn. | Un vendeur ambulant vendait du maïs grillé.
beggar | mendiant | n | B2 | /ˈbeɡər/ | He gave money to a beggar. | Il a donné de l'argent à un mendiant.
busker | musicien de rue | n | C1 | /ˈbʌskər/ | A busker played the violin. | Un musicien de rue jouait du violon.
queue up | faire la queue | v | B1 | /ˌkjuː ˈʌp/ | We had to queue up for an hour. | Nous avons dû faire la queue une heure.
smile at | sourire à | v | A2 | /ˈsmaɪl æt/ | Smile at people, it costs nothing. | Souris aux gens, ça ne coûte rien.
make friends | se faire des amis | expr | A2 | /ˌmeɪk ˈfrendz/ | It's easy to make friends here. | C'est facile de se faire des amis ici.
friendship | amitié | n | B1 | /ˈfrendʃɪp/ | Their friendship lasted fifty years. | Leur amitié a duré cinquante ans.
friend | ami | n | A1 | /frend/ | He is my best friend. | C'est mon meilleur ami.
best friend | meilleur ami | n | A1 | /ˌbest ˈfrend/ | My best friend lives next door. | Mon meilleur ami habite à côté.
neighbourhood watch | surveillance de quartier | n | C1 | /ˌneɪbəhʊd ˈwɒtʃ/ | The neighbourhood watch keeps streets safe. | La surveillance de quartier rend les rues plus sûres.
meeting place | lieu de rendez-vous | n | B1 | /ˈmiːtɪŋ pleɪs/ | The fountain is our meeting place. | La fontaine est notre lieu de rendez-vous.
host family | famille d'accueil | n | B1 | /ˈhəʊst ˌfæməli/ | She stayed with a host family in London. | Elle a séjourné dans une famille d'accueil à Londres.
hospitality | hospitalité | n | B2 | /ˌhɒspɪˈtæləti/ | Arab hospitality is famous. | L'hospitalité arabe est célèbre.
welcoming | accueillant | adj | B1 | /ˈwelkəmɪŋ/ | The villagers are very welcoming. | Les villageois sont très accueillants.
hostile | hostile | adj | C1 | /ˈhɒstaɪl/ | The crowd became hostile. | La foule est devenue hostile.
public place | lieu public | n | B1 | /ˌpʌblɪk ˈpleɪs/ | Smoking is banned in public places. | Il est interdit de fumer dans les lieux publics.
private property | propriété privée | n | B1 | /ˌpraɪvət ˈprɒpəti/ | This is private property. | C'est une propriété privée.
guy | type, gars | n | A2 | /ɡaɪ/ | He's a nice guy. | C'est un type sympa.
bloke | mec, type | n | B2 | /bləʊk/ | He's a decent bloke. | C'est un type bien.
chap | gars, bonhomme | n | B2 | /tʃæp/ | He's a friendly old chap. | C'est un vieux monsieur aimable.
folk | gens | n | B2 | /fəʊk/ | Country folk get up early. | Les gens de la campagne se lèvent tôt.
onlooker | badaud, spectateur | n | C1 | /ˈɒnlʊkər/ | Onlookers gathered around the accident. | Des badauds se sont rassemblés autour de l'accident.
enemy | ennemi | n | B1 | /ˈenəmi/ | Don't make an enemy of him. | Ne t'en fais pas un ennemi.
celebrity | célébrité | n | B1 | /səˈlebrəti/ | A celebrity came into the restaurant. | Une célébrité est entrée dans le restaurant.
VIP | personnalité, VIP | n | B1 | /ˌviː aɪ ˈpiː/ | VIPs have their own entrance. | Les personnalités ont leur propre entrée.
donor | donneur, donateur | n | B2 | /ˈdəʊnər/ | He is a blood donor. | Il est donneur de sang.
billionaire | milliardaire | n | B1 | /ˌbɪljəˈneər/ | The billionaire bought a football club. | Le milliardaire a acheté un club de foot.
genius | génie | n | B1 | /ˈdʒiːniəs/ | Einstein was a genius. | Einstein était un génie.
expert | expert | n | B1 | /ˈekspɜːt/ | She's an expert in Arabic poetry. | C'est une experte en poésie arabe.
novice | novice, débutant | n | C1 | /ˈnɒvɪs/ | I'm a complete novice at chess. | Je suis un parfait novice aux échecs.
veteran | vétéran, ancien combattant | n | B2 | /ˈvetərən/ | My grandfather is a war veteran. | Mon grand-père est un ancien combattant.
pioneer | pionnier | n | B2 | /ˌpaɪəˈnɪər/ | Ibn Sina was a pioneer of medicine. | Ibn Sina fut un pionnier de la médecine.
owner | propriétaire | n | A2 | /ˈəʊnər/ | Who is the owner of this car? | Qui est le propriétaire de cette voiture ?
elder | aîné, ancien | n | B2 | /ˈeldər/ | Respect your elders. | Respecte tes aînés.
senior citizen | personne âgée | n | B1 | /ˌsiːniə ˈsɪtɪzn/ | Senior citizens travel free. | Les seniors voyagent gratuitement.
retiree | retraité | n | B2 | /rɪˌtaɪəˈriː/ | Many retirees move to the coast. | Beaucoup de retraités s'installent sur la côte.
human being | être humain | n | B1 | /ˌhjuːmən ˈbiːɪŋ/ | Every human being deserves respect. | Tout être humain mérite le respect.
humanity | humanité | n | B2 | /hjuːˈmænəti/ | War is a crime against humanity. | La guerre est un crime contre l'humanité.
mankind | humanité, genre humain | n | B2 | /mænˈkaɪnd/ | The discovery changed mankind forever. | La découverte a changé l'humanité pour toujours.
ally | allié | n | B2 | /ˈælaɪ/ | France is an ally of Britain. | La France est une alliée de la Grande-Bretagne.
icon | icône | n | B2 | /ˈaɪkɒn/ | She became a fashion icon. | Elle est devenue une icône de la mode.
figure | personnalité, figure | n | B2 | /ˈfɪɡər/ | He is a key figure in the party. | C'est une figure clé du parti.
someone | quelqu'un | pron | A1 | /ˈsʌmwʌn/ | Someone is at the door. | Il y a quelqu'un à la porte.
everyone | tout le monde | pron | A1 | /ˈevriwʌn/ | Everyone loves her. | Tout le monde l'aime.
no one | personne | pron | A1 | /ˈnəʊ wʌn/ | No one answered the phone. | Personne n'a répondu au téléphone.
anybody | n'importe qui, quelqu'un | pron | A2 | /ˈenibɒdi/ | Is anybody home? | Il y a quelqu'un ?
gathering | rassemblement, réunion | n | B2 | /ˈɡæðərɪŋ/ | It was a small family gathering. | C'était une petite réunion de famille.
mob | foule, populace | n | B2 | /mɒb/ | An angry mob attacked the building. | Une foule en colère a attaqué le bâtiment.
horde | horde | n | C1 | /hɔːd/ | Hordes of tourists visit the city. | Des hordes de touristes visitent la ville.
multitude | multitude | n | C1 | /ˈmʌltɪtjuːd/ | A multitude of people came to the funeral. | Une multitude de gens sont venus aux obsèques.
the masses | les masses | n | C1 | /ðə ˈmæsɪz/ | The masses demanded bread. | Les masses réclamaient du pain.
elite | élite | n | C1 | /eɪˈliːt/ | The political elite ignored the people. | L'élite politique a ignoré le peuple.
upper class | classe supérieure | n | B2 | /ˌʌpə ˈklɑːs/ | He was born into the upper class. | Il est né dans la haute société.
aristocrat | aristocrate | n | C1 | /ˈærɪstəkræt/ | The aristocrat lived in a castle. | L'aristocrate vivait dans un château.
commoner | roturier | n | C2 | /ˈkɒmənər/ | The prince married a commoner. | Le prince a épousé une roturière.
tycoon | magnat | n | C1 | /taɪˈkuːn/ | He is a shipping tycoon. | C'est un magnat du transport maritime.
mogul | magnat, nabab | n | C2 | /ˈməʊɡl/ | The media mogul owns ten newspapers. | Le magnat des médias possède dix journaux.
magnate | magnat | n | C2 | /ˈmæɡneɪt/ | An oil magnate funded the museum. | Un magnat du pétrole a financé le musée.
migrant | migrant | n | B2 | /ˈmaɪɡrənt/ | Migrants crossed the sea in small boats. | Des migrants ont traversé la mer dans de petites embarcations.
asylum seeker | demandeur d'asile | n | B2 | /əˈsaɪləm ˌsiːkər/ | The asylum seeker waited two years. | Le demandeur d'asile a attendu deux ans.
wanderer | vagabond, voyageur errant | n | C1 | /ˈwɒndərər/ | He was a lonely wanderer. | C'était un voyageur solitaire.
vagrant | vagabond, sans-abri | n | C2 | /ˈveɪɡrənt/ | A vagrant slept on the bench. | Un vagabond dormait sur le banc.
drifter | personne sans attaches | n | C1 | /ˈdrɪftər/ | He was a drifter with no home. | C'était un homme sans attaches ni domicile.
outcast | paria | n | C1 | /ˈaʊtkɑːst/ | He was treated as an outcast. | Il était traité comme un paria.
misfit | marginal, inadapté | n | C1 | /ˈmɪsfɪt/ | At school I was a bit of a misfit. | À l'école, j'étais un peu à part.
maverick | franc-tireur, non-conformiste | n | C2 | /ˈmævərɪk/ | The senator is a political maverick. | Le sénateur est un franc-tireur politique.
dissident | dissident | n | C1 | /ˈdɪsɪdənt/ | The dissident was sent to prison. | Le dissident a été emprisonné.
campaigner | militant | n | C1 | /kæmˈpeɪnər/ | She is a campaigner for human rights. | Elle milite pour les droits de l'homme.
whistleblower | lanceur d'alerte | n | C1 | /ˈwɪslbləʊər/ | The whistleblower revealed the fraud. | Le lanceur d'alerte a révélé la fraude.
representative | représentant | n | B2 | /ˌreprɪˈzentətɪv/ | Send a representative to the meeting. | Envoyez un représentant à la réunion.
envoy | émissaire, envoyé | n | C1 | /ˈenvɔɪ/ | The UN envoy arrived in Beirut. | L'envoyé de l'ONU est arrivé à Beyrouth.
go-between | intermédiaire | n | C1 | /ˈɡəʊ bɪˌtwiːn/ | She acted as a go-between. | Elle a servi d'intermédiaire.
intermediary | intermédiaire | n | C1 | /ˌɪntəˈmiːdiəri/ | We negotiated through an intermediary. | Nous avons négocié par un intermédiaire.
middleman | intermédiaire (commerce) | n | B2 | /ˈmɪdlmæn/ | Buy direct and cut out the middleman. | Achète en direct et supprime l'intermédiaire.
latecomer | retardataire | n | B2 | /ˈleɪtkʌmər/ | Latecomers will not be admitted. | Les retardataires ne seront pas admis.
early adopter | adopteur précoce | n | C1 | /ˌɜːli əˈdɒptər/ | He's an early adopter of new gadgets. | Il adopte toujours les nouveaux gadgets en premier.
trendsetter | lanceur de mode | n | C1 | /ˈtrendsetər/ | She's a real trendsetter. | Elle lance vraiment les tendances.
busybody | fouineur, mouche du coche | n | C1 | /ˈbɪzibɒdi/ | Our neighbour is a busybody. | Notre voisin est une vraie fouine.
troublemaker | fauteur de troubles | n | B2 | /ˈtrʌblmeɪkər/ | The teacher sent the troublemaker out. | Le professeur a fait sortir le perturbateur.
party animal | fêtard | n | B2 | /ˈpɑːti ˌænɪml/ | He's a real party animal. | C'est un vrai fêtard.
bookworm | rat de bibliothèque | n | B2 | /ˈbʊkwɜːm/ | My sister is a bookworm. | Ma sœur est un rat de bibliothèque.
daredevil | casse-cou | n | C1 | /ˈdeədevl/ | The daredevil jumped off the bridge. | Le casse-cou a sauté du pont.
thrill-seeker | amateur de sensations fortes | n | C1 | /ˈθrɪl ˌsiːkər/ | Thrill-seekers love skydiving. | Les amateurs de sensations fortes adorent le parachutisme.
go-getter | battant, fonceur | n | C1 | /ˈɡəʊ ˌɡetər/ | She's a real go-getter. | C'est une vraie battante.
high-flyer | personne brillante | n | C1 | /ˌhaɪ ˈflaɪər/ | He was a high-flyer at the bank. | C'était un élément brillant de la banque.
scapegoat | bouc émissaire | n | C1 | /ˈskeɪpɡəʊt/ | They made him the scapegoat. | Ils en ont fait le bouc émissaire.
loudmouth | grande gueule | n | C1 | /ˈlaʊdmaʊθ/ | Ignore him, he's just a loudmouth. | Ignore-le, c'est juste une grande gueule.
chatterbox | moulin à paroles | n | B2 | /ˈtʃætəbɒks/ | My little sister is a chatterbox. | Ma petite sœur est un vrai moulin à paroles.
wallflower | personne timide (en soirée) | n | C1 | /ˈwɔːlflaʊər/ | At parties she's a wallflower. | En soirée, elle reste dans son coin.
people person | personne sociable | n | B2 | /ˈpiːpl ˌpɜːsn/ | You need to be a people person for this job. | Il faut être sociable pour ce poste.
team player | personne qui a l'esprit d'équipe | n | B2 | /ˈtiːm ˌpleɪər/ | We're looking for a team player. | Nous cherchons quelqu'un qui a l'esprit d'équipe.
lone wolf | loup solitaire | n | C1 | /ˌləʊn ˈwʊlf/ | He's always been a lone wolf. | Il a toujours été un loup solitaire.
jack of all trades | touche-à-tout | expr | C1 | /ˌdʒæk əv ˌɔːl ˈtreɪdz/ | He's a jack of all trades. | C'est un touche-à-tout.
butterfingers | maladroit (qui fait tout tomber) | n | C1 | /ˈbʌtəfɪŋɡəz/ | You dropped it again, butterfingers! | Tu l'as encore fait tomber, maladroit !
early riser | lève-tôt | n | B2 | /ˌɜːli ˈraɪzər/ | My father is an early riser. | Mon père est un lève-tôt.
slowcoach | lambin | n | B2 | /ˈsləʊkəʊtʃ/ | Hurry up, slowcoach! | Dépêche-toi, lambin !
crybaby | pleurnichard | n | B1 | /ˈkraɪbeɪbi/ | Don't be such a crybaby. | Ne sois pas si pleurnichard.
copycat | copieur | n | B1 | /ˈkɒpikæt/ | Stop copying me, copycat! | Arrête de me copier, copieur !
tell-tale | rapporteur | n | B2 | /ˈtelteɪl/ | Nobody likes a tell-tale. | Personne n'aime les rapporteurs.
smart alec | petit malin, je-sais-tout | n | C1 | /ˈsmɑːt ˌælɪk/ | Don't be a smart alec. | Ne fais pas le malin.
wise guy | petit malin | n | B2 | /ˈwaɪz ɡaɪ/ | OK, wise guy, what's the answer? | D'accord, petit malin, c'est quoi la réponse ?
cheapskate | radin | n | B2 | /ˈtʃiːpskeɪt/ | He never pays, what a cheapskate! | Il ne paie jamais, quel radin !
skinflint | grippe-sou | n | C2 | /ˈskɪnflɪnt/ | The old skinflint never gave a penny. | Ce vieux grippe-sou n'a jamais donné un sou.
spendthrift | dépensier | n | C2 | /ˈspendθrɪft/ | Her husband is a spendthrift. | Son mari est un dépensier.
miser | avare | n | C1 | /ˈmaɪzər/ | The miser counted his gold every night. | L'avare comptait son or chaque soir.
penny-pincher | radin | n | C1 | /ˈpeni ˌpɪntʃər/ | He's a real penny-pincher. | C'est un vrai radin.
sore loser | mauvais perdant | n | B2 | /ˌsɔː ˈluːzər/ | Don't be a sore loser. | Ne sois pas mauvais perdant.
good sport | beau joueur | n | B2 | /ˌɡʊd ˈspɔːt/ | Thanks for being a good sport. | Merci d'avoir été beau joueur.
backseat driver | passager qui donne des conseils de conduite | n | C1 | /ˌbæksiːt ˈdraɪvər/ | My mum is a backseat driver. | Ma mère n'arrête pas de commenter ma conduite.
armchair critic | critique de salon | n | C1 | /ˌɑːmtʃeə ˈkrɪtɪk/ | He's just an armchair critic. | Ce n'est qu'un critique de salon.
social butterfly | papillon mondain | n | C1 | /ˌsəʊʃl ˈbʌtəflaɪ/ | She's a social butterfly at parties. | En soirée, elle papillonne de groupe en groupe.
man of his word | homme de parole | expr | B2 | /ˌmæn əv hɪz ˈwɜːd/ | You can trust him; he's a man of his word. | Tu peux lui faire confiance, c'est un homme de parole.
salt of the earth | le sel de la terre, quelqu'un de bien | expr | C1 | /ˌsɔːlt əv ði ˈɜːθ/ | My grandparents are the salt of the earth. | Mes grands-parents sont des gens formidables.
venue | lieu (d'un événement) | n | B2 | /ˈvenjuː/ | The venue can hold a thousand people. | La salle peut accueillir mille personnes.
premises | locaux, lieux | n | C1 | /ˈpremɪsɪz/ | Smoking is not allowed on the premises. | Il est interdit de fumer dans les locaux.
hub | plaque tournante, pôle | n | C1 | /hʌb/ | Dubai is an air travel hub. | Dubaï est une plaque tournante du transport aérien.
marketplace | place du marché | n | B2 | /ˈmɑːkɪtpleɪs/ | The marketplace was busy on Saturday. | La place du marché était animée samedi.
bazaar | bazar, marché oriental | n | B2 | /bəˈzɑːr/ | We bought spices at the bazaar. | Nous avons acheté des épices au bazar.
souk | souk | n | B2 | /suːk/ | We got lost in the souk of Marrakech. | Nous nous sommes perdus dans le souk de Marrakech.
exhibition centre | parc des expositions | n | B2 | /ˌeksɪˈbɪʃn ˌsentər/ | The fair is at the exhibition centre. | Le salon a lieu au parc des expositions.
barracks | caserne | n | C1 | /ˈbærəks/ | The soldiers returned to the barracks. | Les soldats sont rentrés à la caserne.
depot | dépôt | n | B2 | /ˈdepəʊ/ | The buses return to the depot at night. | Les bus rentrent au dépôt la nuit.
car wash | station de lavage | n | B1 | /ˈkɑː wɒʃ/ | Take the car to the car wash. | Emmène la voiture à la station de lavage.
launderette | laverie automatique | n | B1 | /lɔːnˈdret/ | I wash my clothes at the launderette. | Je lave mon linge à la laverie.
hairdresser's | salon de coiffure | n | A2 | /ˈheədresəz/ | I'm going to the hairdresser's. | Je vais chez le coiffeur.
barber's | barbier, coiffeur pour hommes | n | A2 | /ˈbɑːbəz/ | He goes to the barber's every month. | Il va chez le barbier tous les mois.
beauty salon | institut de beauté | n | B1 | /ˈbjuːti ˌsælɒn/ | She works in a beauty salon. | Elle travaille dans un institut de beauté.
nail bar | bar à ongles | n | B1 | /ˈneɪl bɑːr/ | There's a new nail bar on the corner. | Il y a un nouveau bar à ongles au coin.
sports centre | centre sportif | n | A2 | /ˈspɔːts ˌsentər/ | We play basketball at the sports centre. | Nous jouons au basket au centre sportif.
racecourse | hippodrome | n | B2 | /ˈreɪskɔːs/ | Longchamp is a famous racecourse. | Longchamp est un hippodrome célèbre.
golf course | terrain de golf | n | B1 | /ˈɡɒlf kɔːs/ | The hotel has its own golf course. | L'hôtel a son propre terrain de golf.
ice rink | patinoire | n | A2 | /ˈaɪs rɪŋk/ | We went skating at the ice rink. | Nous sommes allés patiner à la patinoire.
opera house | opéra (bâtiment) | n | B1 | /ˈɒprə haʊs/ | The Sydney Opera House is famous. | L'opéra de Sydney est célèbre.
concert hall | salle de concert | n | B1 | /ˈkɒnsət hɔːl/ | The orchestra played in the concert hall. | L'orchestre a joué dans la salle de concert.
nightclub | boîte de nuit | n | B1 | /ˈnaɪtklʌb/ | The nightclub closes at five. | La boîte de nuit ferme à cinq heures.
casino | casino | n | B1 | /kəˈsiːnəʊ/ | He lost everything at the casino. | Il a tout perdu au casino.
botanical garden | jardin botanique | n | B2 | /bəˌtænɪkl ˈɡɑːdn/ | The botanical garden has rare plants. | Le jardin botanique a des plantes rares.
theme park | parc à thème | n | A2 | /ˈθiːm pɑːk/ | The kids loved the theme park. | Les enfants ont adoré le parc à thème.
caravan park | terrain pour caravanes | n | B1 | /ˈkærəvæn pɑːk/ | We stayed at a caravan park by the sea. | Nous avons logé dans un terrain de caravaning près de la mer.
picnic area | aire de pique-nique | n | A2 | /ˈpɪknɪk ˌeəriə/ | Let's stop at the picnic area. | Arrêtons-nous à l'aire de pique-nique.
beauty spot | site pittoresque | n | B2 | /ˈbjuːti spɒt/ | The lake is a famous beauty spot. | Le lac est un site réputé pour sa beauté.
graveyard | cimetière | n | B2 | /ˈɡreɪvjɑːd/ | The old church has a graveyard. | La vieille église a un cimetière.
crematorium | crématorium | n | C1 | /ˌkreməˈtɔːriəm/ | The service was held at the crematorium. | La cérémonie a eu lieu au crématorium.
funeral home | funérarium, pompes funèbres | n | B2 | /ˈfjuːnərəl həʊm/ | The body is at the funeral home. | Le corps est au funérarium.
convent | couvent | n | B2 | /ˈkɒnvənt/ | The nuns live in a convent. | Les religieuses vivent dans un couvent.
shrine | sanctuaire, lieu saint | n | C1 | /ʃraɪn/ | Pilgrims visit the shrine every year. | Des pèlerins visitent le sanctuaire chaque année.
building society | société de crédit immobilier | n | C1 | /ˈbɪldɪŋ səˌsaɪəti/ | I have a savings account with a building society. | J'ai un compte d'épargne dans une société de crédit.
health centre | centre de santé, cabinet médical | n | B1 | /ˈhelθ ˌsentər/ | Make an appointment at the health centre. | Prends rendez-vous au centre de santé.
care home | maison de retraite | n | B1 | /ˈkeə həʊm/ | My grandmother lives in a care home. | Ma grand-mère vit en maison de retraite.
orphanage | orphelinat | n | B2 | /ˈɔːfənɪdʒ/ | He grew up in an orphanage. | Il a grandi dans un orphelinat.
shelter | abri, refuge | n | B1 | /ˈʃeltər/ | We took shelter under a tree. | Nous nous sommes abrités sous un arbre.
motel | motel | n | B1 | /məʊˈtel/ | We spent the night in a motel. | Nous avons passé la nuit dans un motel.
inn | auberge | n | B2 | /ɪn/ | We had dinner at a country inn. | Nous avons dîné dans une auberge de campagne.
cafeteria | cafétéria | n | A2 | /ˌkæfəˈtɪəriə/ | Let's eat in the cafeteria. | Mangeons à la cafétéria.
snack bar | snack | n | A2 | /ˈsnæk bɑːr/ | There's a snack bar at the station. | Il y a un snack à la gare.
patisserie | pâtisserie | n | B1 | /pəˈtiːsəri/ | We bought cakes at the patisserie. | Nous avons acheté des gâteaux à la pâtisserie.
fishmonger's | poissonnerie | n | B1 | /ˈfɪʃmʌŋɡəz/ | Buy fresh fish at the fishmonger's. | Achète du poisson frais à la poissonnerie.
greengrocer's | primeur, marchand de fruits et légumes | n | B1 | /ˈɡriːnɡrəʊsəz/ | The greengrocer's sells local apples. | Le primeur vend des pommes locales.
grocer's | épicerie | n | A2 | /ˈɡrəʊsəz/ | I bought rice at the grocer's. | J'ai acheté du riz à l'épicerie.
delicatessen | épicerie fine, traiteur | n | B2 | /ˌdelɪkəˈtesn/ | The delicatessen sells Lebanese food. | L'épicerie fine vend des produits libanais.
corner shop | épicerie du coin | n | A2 | /ˈkɔːnə ʃɒp/ | Get some milk at the corner shop. | Prends du lait à l'épicerie du coin.
convenience store | supérette | n | B1 | /kənˈviːniəns stɔːr/ | The convenience store is open all night. | La supérette est ouverte toute la nuit.
hypermarket | hypermarché | n | B1 | /ˈhaɪpəmɑːkɪt/ | We do our shopping at the hypermarket. | Nous faisons nos courses à l'hypermarché.
pawnshop | mont-de-piété, prêteur sur gages | n | C1 | /ˈpɔːnʃɒp/ | He sold his watch at a pawnshop. | Il a vendu sa montre chez un prêteur sur gages.
antique shop | magasin d'antiquités | n | B1 | /ænˈtiːk ʃɒp/ | We found this clock in an antique shop. | Nous avons trouvé cette horloge chez un antiquaire.
jeweller's | bijouterie | n | B1 | /ˈdʒuːələz/ | He bought a ring at the jeweller's. | Il a acheté une bague à la bijouterie.
florist's | fleuriste | n | B1 | /ˈflɒrɪsts/ | I ordered roses from the florist's. | J'ai commandé des roses chez le fleuriste.
pet shop | animalerie | n | A2 | /ˈpet ʃɒp/ | We bought fish food at the pet shop. | Nous avons acheté de la nourriture pour poissons à l'animalerie.
hardware store | quincaillerie | n | B1 | /ˈhɑːdweə stɔːr/ | Get some nails at the hardware store. | Achète des clous à la quincaillerie.
garden centre | jardinerie | n | B1 | /ˈɡɑːdn ˌsentər/ | We bought plants at the garden centre. | Nous avons acheté des plantes à la jardinerie.
car boot sale | vide-grenier | n | B2 | /ˌkɑː ˈbuːt seɪl/ | I sold my old books at a car boot sale. | J'ai vendu mes vieux livres à un vide-grenier.
auction house | maison de vente aux enchères | n | C1 | /ˈɔːkʃn haʊs/ | The painting was sold at an auction house. | Le tableau a été vendu dans une maison de ventes.
employment agency | agence d'intérim, agence de placement | n | B2 | /ɪmˈplɔɪmənt ˌeɪdʒənsi/ | I found a job through an employment agency. | J'ai trouvé un emploi par une agence de placement.
business district | quartier d'affaires | n | B2 | /ˈbɪznəs ˌdɪstrɪkt/ | La Défense is the business district of Paris. | La Défense est le quartier d'affaires de Paris.
industrial estate | zone industrielle | n | B2 | /ɪnˌdʌstriəl ɪˈsteɪt/ | The warehouse is on an industrial estate. | L'entrepôt est dans une zone industrielle.
business park | parc d'activités | n | B2 | /ˈbɪznəs pɑːk/ | Our office is in a business park. | Notre bureau est dans un parc d'activités.
retail park | zone commerciale | n | B2 | /ˈriːteɪl pɑːk/ | The retail park has twenty shops. | La zone commerciale compte vingt magasins.
shopping arcade | galerie marchande | n | B1 | /ˈʃɒpɪŋ ɑːˌkeɪd/ | We walked through the shopping arcade. | Nous avons traversé la galerie marchande.
food court | aire de restauration | n | B1 | /ˈfuːd kɔːt/ | We ate at the food court in the mall. | Nous avons mangé à l'aire de restauration du centre commercial.
bus shelter | abribus | n | A2 | /ˈbʌs ˌʃeltər/ | We waited in the bus shelter. | Nous avons attendu sous l'abribus.
lay-by | aire de stationnement (bord de route) | n | B2 | /ˈleɪ baɪ/ | Pull into the next lay-by. | Arrête-toi sur la prochaine aire de stationnement.
service station | aire de service | n | B1 | /ˈsɜːvɪs ˌsteɪʃn/ | We stopped at a service station on the motorway. | Nous nous sommes arrêtés sur une aire de service.
toll booth | péage (cabine) | n | B2 | /ˈtəʊl buːð/ | Pay at the toll booth. | Paie au péage.
border crossing | poste-frontière | n | B2 | /ˈbɔːdə ˌkrɒsɪŋ/ | There was a long queue at the border crossing. | Il y avait une longue file au poste-frontière.
jetty | jetée, embarcadère | n | C1 | /ˈdʒeti/ | The boat leaves from the jetty. | Le bateau part de l'embarcadère.
wharf | quai, débarcadère | n | C1 | /wɔːf/ | Ships unloaded at the wharf. | Les navires déchargeaient au quai.
shipyard | chantier naval | n | C1 | /ˈʃɪpjɑːd/ | He works at the shipyard in Saint-Nazaire. | Il travaille au chantier naval de Saint-Nazaire.
airfield | aérodrome | n | C1 | /ˈeəfiːld/ | The plane landed on a small airfield. | L'avion a atterri sur un petit aérodrome.
heliport | héliport | n | C1 | /ˈhelipɔːt/ | The hospital has a heliport on the roof. | L'hôpital a un héliport sur le toit.
launch pad | pas de tir | n | C1 | /ˈlɔːntʃ pæd/ | The rocket is on the launch pad. | La fusée est sur le pas de tir.
observatory | observatoire | n | C1 | /əbˈzɜːvətri/ | We looked at Saturn from the observatory. | Nous avons observé Saturne depuis l'observatoire.
planetarium | planétarium | n | B2 | /ˌplænɪˈteəriəm/ | The school visited the planetarium. | L'école a visité le planétarium.
data centre | centre de données | n | C1 | /ˈdeɪtə ˌsentər/ | The data centre uses a lot of energy. | Le centre de données consomme beaucoup d'énergie.
call centre | centre d'appels | n | B2 | /ˈkɔːl ˌsentər/ | She works in a call centre. | Elle travaille dans un centre d'appels.
control room | salle de contrôle | n | B2 | /kənˈtrəʊl ruːm/ | The engineers watched from the control room. | Les ingénieurs observaient depuis la salle de contrôle.
boardroom | salle du conseil | n | C1 | /ˈbɔːdruːm/ | The directors met in the boardroom. | Les directeurs se sont réunis dans la salle du conseil.
staffroom | salle des professeurs | n | B1 | /ˈstɑːfruːm/ | The teachers are in the staffroom. | Les professeurs sont en salle des profs.
common room | salle commune, foyer | n | B1 | /ˈkɒmən ruːm/ | Students relax in the common room. | Les élèves se détendent au foyer.
cloakroom | vestiaire | n | B1 | /ˈkləʊkruːm/ | Leave your coat in the cloakroom. | Laisse ton manteau au vestiaire.
foyer | hall d'entrée, foyer | n | C1 | /ˈfɔɪeɪ/ | Let's meet in the theatre foyer. | Retrouvons-nous dans le hall du théâtre.
top floor | dernier étage | n | A2 | /ˌtɒp ˈflɔːr/ | We live on the top floor. | Nous habitons au dernier étage.
`,
);
