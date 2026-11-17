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
`,
);
