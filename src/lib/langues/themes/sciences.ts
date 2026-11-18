/* Le Truchement : thème « Sciences et numérique » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const SCIENCES = theme(
  "sciences",
  "Sciences et numérique",
  "Méthode scientifique, matière, technologies et vocabulaire informatique.",
  "Cpu",
  `
hypothesis | hypothèse | n | B2 | /haɪˈpɒθəsɪs/ | The hypothesis must be tested. | L'hypothèse doit être vérifiée.
experiment | expérience | n | B1 | /ɪkˈsperɪmənt/ | The experiment failed the first time. | L'expérience a échoué la première fois.
laboratory | laboratoire | n | B1 | /ˈlæbrətri/ | The laboratory is on the third floor. | Le laboratoire se trouve au troisième étage.
microscope | microscope | n | A2 | /ˈmaɪkrəskoʊp/ | Look at the cells under the microscope. | Regarde les cellules au microscope.
telescope | télescope | n | A2 | /ˈtelɪskoʊp/ | The telescope shows distant galaxies. | Le télescope montre des galaxies lointaines.
observation | observation | n | B1 | /ˌɒbzərˈveɪʃn/ | Careful observation led to the discovery. | Une observation attentive a mené à la découverte.
measurement | mesure | n | B1 | /ˈmeʒərmənt/ | The measurement was accurate. | La mesure était précise.
theory | théorie | n | B1 | /ˈθiːəri/ | The theory explains how gravity works. | La théorie explique le fonctionnement de la gravité.
evidence | preuve | n | B1 | /ˈevɪdəns/ | There is no evidence for that claim. | Il n'existe aucune preuve à l'appui de cette affirmation.
formula | formule | n | B1 | /ˈfɔːrmjələ/ | Write the formula on the board. | Écris la formule au tableau.
equation | équation | n | B2 | /ɪˈkweɪʒn/ | Solve the equation for x. | Résous l'équation pour x.
molecule | molécule | n | B2 | /ˈmɒlɪkjuːl/ | Water is made of molecules. | L'eau est composée de molécules.
atom | atome | n | B1 | /ˈætəm/ | Every atom has a nucleus. | Chaque atome possède un noyau.
particle | particule | n | B2 | /ˈpɑːrtɪkl/ | Particles move faster when they are hot. | Les particules se déplacent plus vite quand elles sont chaudes.
gravity | gravité, pesanteur | n | B1 | /ˈɡrævəti/ | Gravity pulls objects toward the earth. | La gravité attire les objets vers la terre.
magnet | aimant | n | A2 | /ˈmæɡnət/ | The magnet attracts the iron nails. | L'aimant attire les clous en fer.
electron | électron | n | C1 | /ɪˈlektrɒn/ | An electron carries a negative charge. | Un électron porte une charge négative.
genome | génome | n | C1 | /ˈdʒiːnoʊm/ | Scientists sequenced the entire genome. | Les scientifiques ont séquencé le génome entier.
bacterium | bactérie | n | C1 | /bækˈtɪəriəm/ | This bacterium survives in hot springs. | Cette bactérie survit dans les sources chaudes.
algorithm | algorithme | n | B2 | /ˈælɡərɪðəm/ | The algorithm sorts the data quickly. | L'algorithme trie les données rapidement.
software | logiciel | n | B1 | /ˈsɒftweər/ | This software is free to download. | Ce logiciel est gratuit à télécharger.
hardware | matériel informatique | n | B2 | /ˈhɑːrdweər/ | The hardware is now outdated. | Le matériel informatique est maintenant dépassé.
processor | processeur | n | B2 | /ˈprəʊsesər/ | The processor runs at three gigahertz. | Le processeur fonctionne à trois gigahertz.
database | base de données | n | B2 | /ˈdeɪtəbeɪs/ | The database stores every customer record. | La base de données conserve chaque fiche client.
download | téléchargement | n | B1 | /ˈdaʊnlaʊd/ | The download took ten minutes. | Le téléchargement a pris dix minutes.
to upload | téléverser, envoyer | v | B2 | /ʌpˈloʊd/ | Upload the photos to the cloud. | Téléverse les photos sur le cloud.
bug | bogue | n | B1 | /bʌɡ/ | There is a bug in the code. | Il y a un bogue dans le code.
glitch | bug, défaillance | n | B2 | /ɡlɪtʃ/ | A glitch deleted my file. | Un bug a supprimé mon fichier.
to program | programmer | v | B2 | /ˈprəʊɡræm/ | She programs robots at university. | Elle programme des robots à l'université.
to compute | calculer | v | B2 | /kəmˈpjuːt/ | Computers compute results in seconds. | Les ordinateurs calculent les résultats en quelques secondes.
to debug | déboguer | v | C1 | /diːˈbʌɡ/ | I spent all day debugging the code. | J'ai passé la journée à déboguer le code.
to encrypt | chiffrer | v | C1 | /ɪnˈkrɪpt/ | The messages are encrypted end to end. | Les messages sont chiffrés de bout en bout.
to analyse | analyser | v | B2 | /ˈænəlaɪz/ | Scientists analyse the samples carefully. | Les scientifiques analysent soigneusement les échantillons.
to observe | observer | v | B1 | /əbˈzɜːrv/ | Observe the stars through the telescope. | Observe les étoiles à travers le télescope.
to measure | mesurer | v | B1 | /ˈmeʒər/ | We measure the temperature every hour. | Nous mesurons la température toutes les heures.
to calculate | calculer | v | B1 | /ˈkælkjuleɪt/ | Calculate the area of the square. | Calcule l'aire du carré.
to prove | démontrer, prouver | v | B2 | /pruːv/ | The study proved the theory. | L'étude a démontré la théorie.
to test | tester | v | B1 | /test/ | We test the prototype every day. | Nous testons le prototype chaque jour.
to simulate | simuler | v | C1 | /ˈsɪmjuleɪt/ | The model simulates the weather. | Le modèle simule la météo.
to discover | découvrir | v | A2 | /dɪˈskʌvər/ | Scientists discovered a new planet. | Les scientifiques ont découvert une nouvelle planète.
to invent | inventer | v | B1 | /ɪnˈvent/ | Who invented the telephone? | Qui a inventé le téléphone ?
innovation | innovation | n | B2 | /ˌɪnəˈveɪʃn/ | Innovation drives economic growth. | L'innovation stimule la croissance économique.
prototype | prototype | n | B2 | /ˈprəʊtətaɪp/ | The prototype works perfectly. | Le prototype fonctionne parfaitement.
digital | numérique | adj | B1 | /ˈdɪdʒɪtl/ | Digital devices are everywhere now. | Les appareils numériques sont partout aujourd'hui.
virtual | virtuel | adj | B2 | /ˈvɜːrtʃuəl/ | They held a virtual meeting. | Ils ont tenu une réunion virtuelle.
artificial intelligence | intelligence artificielle | n | B2 | /ˌɑːrtɪˈfɪʃl ɪnˈtelɪdʒəns/ | Artificial intelligence is changing many jobs. | L'intelligence artificielle transforme de nombreux métiers.
sensor | capteur | n | B2 | /ˈsensər/ | A sensor detects the movement. | Un capteur détecte le mouvement.
circuit | circuit | n | B2 | /ˈsɜːrkɪt/ | The circuit was damaged by the heat. | Le circuit a été endommagé par la chaleur.
wireless | sans fil | adj | B1 | /ˈwaɪərləs/ | The wireless connection is slow today. | La connexion sans fil est lente aujourd'hui.
broadband | haut débit | n | B2 | /ˈbrɔːdbænd/ | Broadband now reaches every village. | Le haut débit atteint maintenant chaque village.
browser | navigateur | n | B1 | /ˈbraʊzər/ | Open the browser and search. | Ouvre le navigateur et lance une recherche.
interface | interface | n | B2 | /ˈɪntərfeɪs/ | The new interface is easier to use. | La nouvelle interface est plus facile à utiliser.
cybersecurity | cybersécurité | n | C1 | /ˌsaɪbərsɪˈkjʊərəti/ | Cybersecurity protects our data. | La cybersécurité protège nos données.
hacker | pirate informatique | n | B2 | /ˈhækər/ | The hacker stole thousands of passwords. | Le pirate informatique a volé des milliers de mots de passe.
scanner | scanner | n | B1 | /ˈskænər/ | The scanner copies documents in seconds. | Le scanner copie les documents en quelques secondes.
pressure | pression | n | B1 | /ˈpreʃər/ | The pressure inside the tank is rising. | La pression dans le réservoir augmente.
server | serveur | n | B2 | /ˈsɜːrvər/ | The server crashed during the update. | Le serveur est tombé en panne pendant la mise à jour.
encryption | chiffrement | n | C1 | /ɪnˈkrɪpʃn/ | Encryption protects your private data. | Le chiffrement protège vos données privées.
firewall | pare-feu | n | C1 | /ˈfaɪərwɔːl/ | The firewall blocked the suspicious connection. | Le pare-feu a bloqué la connexion suspecte.
website | site web | n | A2 | /ˈwebsaɪt/ | Our website is updated every week. | Notre site web est mis à jour chaque semaine.
to code | coder | v | B2 | /koʊd/ | She learned to code at university. | Elle a appris à coder à l'université.
programming | programmation | n | B2 | /ˈproʊɡræmɪŋ/ | Programming needs patience and logic. | La programmation demande de la patience et de la logique.
to update | mettre à jour | v | B1 | /ʌpˈdeɪt/ | Please update the app before using it. | Mets l'application à jour avant de l'utiliser.
force | force | n | B1 | /fɔːrs/ | The force pushed the door open. | La force a poussé la porte.
friction | frottement | n | C1 | /ˈfrɪkʃn/ | Friction slows the sliding box. | Le frottement ralentit la caisse qui glisse.
mass | masse | n | B2 | /mæs/ | The mass of the object is ten kilos. | La masse de l'objet est de dix kilos.
weight | poids | n | A2 | /weɪt/ | What is the weight of this box? | Quel est le poids de cette boîte ?
oxygen | oxygène | n | B1 | /ˈɒksɪdʒən/ | Plants release oxygen into the air. | Les plantes rejettent de l'oxygène dans l'air.
cell | cellule | n | B1 | /sel/ | Every living cell contains DNA. | Chaque cellule vivante contient de l'ADN.
dna | ADN | n | B2 | /ˌdiː en ˈeɪ/ | DNA carries genetic information. | L'ADN porte l'information génétique.
fossil | fossile | n | B2 | /ˈfɒsl/ | The fossil shows a fish from the Jurassic. | Le fossile montre un poisson du Jurassique.
chemical | produit chimique | n | B1 | /ˈkemɪkl/ | Use chemicals with care in the lab. | Utilise les produits chimiques avec précaution au labo.
reaction | réaction | n | B1 | /riˈækʃn/ | The reaction produces heat and light. | La réaction produit de la chaleur et de la lumière.
to ignite | enflammer | v | C1 | /ɪɡˈnaɪt/ | The spark ignited the gas. | L'étincelle a enflammé le gaz.
element | élément | n | B1 | /ˈelɪmənt/ | Oxygen is a chemical element. | L'oxygène est un élément chimique.
planet | planète | n | A2 | /ˈplænɪt/ | Mars is a small planet. | Mars est une petite planète.
data | données | n | B1 | /ˈdeɪtə/ | The data shows a clear trend. | Les données montrent une tendance claire.
spectrum | spectre | n | C1 | /ˈspektrəm/ | White light splits into a spectrum. | La lumière blanche se décompose en spectre.
stem cell | cellule souche | n | C1 | /stem sel/ | Stem cells can become many types of tissue. | Les cellules souches peuvent devenir de nombreux types de tissus.
to conduct | conduire (l'électricité) | v | B2 | /kənˈdʌkt/ | Copper conducts electricity well. | Le cuivre conduit bien l'électricité.
solid | solide | adj | B1 | /ˈsɒlɪd/ | Ice is solid at low temperatures. | La glace est solide à basse température.
liquid | liquide | n | B1 | /ˈlɪkwɪd/ | Water is a liquid at room temperature. | L'eau est un liquide à température ambiante.
vapour | vapeur | n | B2 | /ˈveɪpər/ | Water vapour rises from the pan. | La vapeur d'eau s'élève de la casserole.
scientific | scientifique | adj | B1 | /ˌsaɪənˈtɪfɪk/ | We need scientific proof. | Il nous faut une preuve scientifique.
research centre | centre de recherche | n | B2 | /rɪˈsɜːtʃ ˌsentər/ | She works at a research centre. | Elle travaille dans un centre de recherche.
data analysis | analyse de données | n | B2 | /ˌdeɪtə əˈnæləsɪs/ | Data analysis takes weeks. | L'analyse de données prend des semaines.
result | résultat | n | A2 | /rɪˈzʌlt/ | The results surprised the team. | Les résultats ont surpris l'équipe.
findings | conclusions, résultats | n | C1 | /ˈfaɪndɪŋz/ | They published their findings. | Ils ont publié leurs conclusions.
breakthrough | percée, avancée | n | C1 | /ˈbreɪkθruː/ | It was a major medical breakthrough. | Ce fut une avancée médicale majeure.
discovery | découverte | n | B1 | /dɪˈskʌvəri/ | The discovery of penicillin saved lives. | La découverte de la pénicilline a sauvé des vies.
invention | invention | n | B1 | /ɪnˈvenʃn/ | The printing press was a key invention. | L'imprimerie fut une invention capitale.
inventor | inventeur | n | B1 | /ɪnˈventər/ | The inventor showed his new machine. | L'inventeur a présenté sa nouvelle machine.
engineering | ingénierie | n | B2 | /ˌendʒɪˈnɪərɪŋ/ | She studies civil engineering. | Elle étudie le génie civil.
technology | technologie | n | B1 | /tekˈnɒlədʒi/ | Technology changes quickly. | La technologie évolue vite.
device | appareil | n | B1 | /dɪˈvaɪs/ | This device measures your heart rate. | Cet appareil mesure ton rythme cardiaque.
smartphone | smartphone | n | A2 | /ˈsmɑːtfəʊn/ | Everyone has a smartphone now. | Tout le monde a un smartphone maintenant.
laptop | ordinateur portable | n | A2 | /ˈlæptɒp/ | I work on my laptop. | Je travaille sur mon ordinateur portable.
computer | ordinateur | n | A1 | /kəmˈpjuːtər/ | The computer is very slow. | L'ordinateur est très lent.
keyboard | clavier | n | A2 | /ˈkiːbɔːd/ | This keyboard has Arabic letters. | Ce clavier a des lettres arabes.
screen | écran | n | A2 | /skriːn/ | The screen is too bright. | L'écran est trop lumineux.
app | application | n | A2 | /æp/ | Download the app to learn English. | Télécharge l'application pour apprendre l'anglais.
internet | internet | n | A1 | /ˈɪntənet/ | The internet is down. | Internet ne marche pas.
Wi-Fi | wifi | n | A2 | /ˈwaɪ faɪ/ | What's the Wi-Fi password? | Quel est le mot de passe du wifi ?
offline | hors ligne | adv | B1 | /ˌɒfˈlaɪn/ | The app works offline. | L'application fonctionne hors ligne.
search engine | moteur de recherche | n | B1 | /ˈsɜːtʃ ˌendʒɪn/ | Type the question into a search engine. | Tape la question dans un moteur de recherche.
cloud storage | stockage en ligne | n | B2 | /ˌklaʊd ˈstɔːrɪdʒ/ | Save your photos in cloud storage. | Enregistre tes photos dans le stockage en ligne.
install | installer | v | B1 | /ɪnˈstɔːl/ | Install the update tonight. | Installe la mise à jour ce soir.
click | cliquer | v | A2 | /klɪk/ | Click on the link. | Clique sur le lien.
type | taper (au clavier) | v | A2 | /taɪp/ | Type your name here. | Tape ton nom ici.
delete | supprimer | v | A2 | /dɪˈliːt/ | Delete the old photos. | Supprime les vieilles photos.
reboot | redémarrer | v | B2 | /ˌriːˈbuːt/ | Reboot your computer. | Redémarre ton ordinateur.
username | nom d'utilisateur | n | A2 | /ˈjuːzəneɪm/ | Enter your username and password. | Saisis ton nom d'utilisateur et ton mot de passe.
account | compte | n | A2 | /əˈkaʊnt/ | Create an account to continue. | Crée un compte pour continuer.
privacy | vie privée, confidentialité | n | B2 | /ˈprɪvəsi/ | Protect your privacy online. | Protège ta vie privée en ligne.
coding | programmation | n | B1 | /ˈkəʊdɪŋ/ | Kids are learning coding at school. | Les enfants apprennent la programmation à l'école.
robot | robot | n | A2 | /ˈrəʊbɒt/ | A robot cleans the floor. | Un robot nettoie le sol.
robotics | robotique | n | C1 | /rəʊˈbɒtɪks/ | Robotics is changing factories. | La robotique transforme les usines.
machine learning | apprentissage automatique | n | C1 | /məˈʃiːn ˌlɜːnɪŋ/ | Machine learning powers this app. | L'apprentissage automatique fait tourner cette application.
chatbot | agent conversationnel | n | B2 | /ˈtʃætbɒt/ | The bank uses a chatbot. | La banque utilise un agent conversationnel.
satellite | satellite | n | B1 | /ˈsætəlaɪt/ | The satellite sends weather data. | Le satellite envoie des données météo.
rocket | fusée | n | A2 | /ˈrɒkɪt/ | The rocket took off at dawn. | La fusée a décollé à l'aube.
spacecraft | vaisseau spatial | n | B2 | /ˈspeɪskrɑːft/ | The spacecraft landed on Mars. | Le vaisseau spatial s'est posé sur Mars.
orbit | orbite | n | B2 | /ˈɔːbɪt/ | The moon is in orbit around the earth. | La lune est en orbite autour de la Terre.
astronomy | astronomie | n | B2 | /əˈstrɒnəmi/ | Muslim scholars advanced astronomy. | Les savants musulmans ont fait progresser l'astronomie.
physicist | physicien | n | B2 | /ˈfɪzɪsɪst/ | The physicist won a prize. | Le physicien a remporté un prix.
chemist | chimiste | n | B2 | /ˈkemɪst/ | The chemist mixed two liquids. | Le chimiste a mélangé deux liquides.
biologist | biologiste | n | B2 | /baɪˈɒlədʒɪst/ | The biologist studies whales. | Le biologiste étudie les baleines.
mathematician | mathématicien | n | B2 | /ˌmæθəməˈtɪʃn/ | Al-Khwarizmi was a great mathematician. | Al-Khwarizmi était un grand mathématicien.
algebra | algèbre | n | B2 | /ˈældʒɪbrə/ | The word algebra comes from Arabic. | Le mot algèbre vient de l'arabe.
geometry | géométrie | n | B2 | /dʒiˈɒmətri/ | Islamic art uses complex geometry. | L'art islamique utilise une géométrie complexe.
statistics | statistiques | n | B2 | /stəˈtɪstɪks/ | Statistics show that crime is falling. | Les statistiques montrent que la criminalité baisse.
probability | probabilité | n | C1 | /ˌprɒbəˈbɪləti/ | The probability of rain is high. | La probabilité de pluie est élevée.
variable | variable | n | C1 | /ˈveəriəbl/ | Change one variable at a time. | Change une variable à la fois.
sample size | taille de l'échantillon | n | C1 | /ˈsɑːmpl saɪz/ | The sample size was too small. | La taille de l'échantillon était trop petite.
peer review | évaluation par les pairs | n | C2 | /ˌpɪə rɪˈvjuː/ | The study passed peer review. | L'étude a passé l'évaluation par les pairs.
science fair | salon des sciences | n | B1 | /ˈsaɪəns feər/ | Her project won the science fair. | Son projet a gagné le salon des sciences.
lab coat | blouse de laboratoire | n | B1 | /ˈlæb kəʊt/ | Wear a lab coat during experiments. | Porte une blouse pendant les expériences.
test tube | éprouvette | n | B1 | /ˈtest tjuːb/ | Pour the liquid into the test tube. | Verse le liquide dans l'éprouvette.
magnifying glass | loupe | n | B1 | /ˈmæɡnɪfaɪɪŋ ɡlɑːs/ | Look at the insect with a magnifying glass. | Regarde l'insecte à la loupe.
lens | lentille, objectif | n | B2 | /lenz/ | The camera has a powerful lens. | L'appareil a un objectif puissant.
boiling point | point d'ébullition | n | B2 | /ˈbɔɪlɪŋ pɔɪnt/ | Water's boiling point is 100 degrees. | Le point d'ébullition de l'eau est de 100 degrés.
evolution | évolution | n | B2 | /ˌiːvəˈluːʃn/ | The theory of evolution is debated. | La théorie de l'évolution est débattue.
gene | gène | n | B2 | /dʒiːn/ | Eye colour depends on our genes. | La couleur des yeux dépend de nos gènes.
genetics | génétique | n | C1 | /dʒəˈnetɪks/ | She studies genetics. | Elle étudie la génétique.
neuroscience | neurosciences | n | C1 | /ˈnjʊərəʊˌsaɪəns/ | Neuroscience studies the brain. | Les neurosciences étudient le cerveau.
quantum | quantique | adj | C2 | /ˈkwɒntəm/ | Quantum physics is hard to understand. | La physique quantique est difficile à comprendre.
big bang | big bang | n | B2 | /ˌbɪɡ ˈbæŋ/ | The universe began with the big bang. | L'univers a commencé avec le big bang.
beaker | bécher | n | B2 | /ˈbiːkər/ | Pour the liquid into a beaker. | Verse le liquide dans un bécher.
flask | fiole, flacon | n | B2 | /flɑːsk/ | Heat the flask gently. | Chauffe doucement la fiole.
Bunsen burner | bec Bunsen | n | B2 | /ˌbʌnsn ˈbɜːnər/ | Light the Bunsen burner carefully. | Allume le bec Bunsen avec précaution.
pipette | pipette | n | B2 | /pɪˈpet/ | Add two drops with a pipette. | Ajoute deux gouttes avec une pipette.
petri dish | boîte de Petri | n | C1 | /ˈpetri dɪʃ/ | Bacteria grew in the petri dish. | Des bactéries ont poussé dans la boîte de Petri.
scientific method | méthode scientifique | n | B2 | /ˌsaɪəntɪfɪk ˈmeθəd/ | Ibn al-Haytham used the scientific method. | Ibn al-Haytham utilisait la méthode scientifique.
control group | groupe témoin | n | C1 | /kənˈtrəʊl ɡruːp/ | The control group received no treatment. | Le groupe témoin n'a reçu aucun traitement.
astronomer | astronome | n | B2 | /əˈstrɒnəmər/ | Al-Biruni was a great astronomer. | Al-Biruni était un grand astronome.
geology | géologie | n | B2 | /dʒiˈɒlədʒi/ | Geology studies rocks. | La géologie étudie les roches.
geologist | géologue | n | B2 | /dʒiˈɒlədʒɪst/ | The geologist examined the cliff. | Le géologue a examiné la falaise.
geneticist | généticien | n | C1 | /dʒəˈnetɪsɪst/ | The geneticist studied the family's DNA. | Le généticien a étudié l'ADN de la famille.
botany | botanique | n | C1 | /ˈbɒtəni/ | She has a degree in botany. | Elle a un diplôme de botanique.
botanist | botaniste | n | C1 | /ˈbɒtənɪst/ | The botanist found a new plant. | Le botaniste a découvert une nouvelle plante.
zoology | zoologie | n | C1 | /zuˈɒlədʒi/ | He teaches zoology at university. | Il enseigne la zoologie à l'université.
zoologist | zoologiste | n | C1 | /zuˈɒlədʒɪst/ | The zoologist studies gorillas. | Le zoologiste étudie les gorilles.
compound | composé | n | C1 | /ˈkɒmpaʊnd/ | Water is a compound of hydrogen and oxygen. | L'eau est un composé d'hydrogène et d'oxygène.
mixture | mélange | n | B1 | /ˈmɪkstʃər/ | Stir the mixture well. | Remue bien le mélange.
solution | solution | n | B1 | /səˈluːʃn/ | Dissolve the salt to make a solution. | Dissous le sel pour faire une solution.
acid | acide | n | B1 | /ˈæsɪd/ | Lemon juice contains acid. | Le jus de citron contient de l'acide.
alkali | base (chimie) | n | C1 | /ˈælkəlaɪ/ | Soap is an alkali. | Le savon est une base.
metal | métal | n | A2 | /ˈmetl/ | Iron is a metal. | Le fer est un métal.
density | densité | n | C1 | /ˈdensəti/ | Oil has a lower density than water. | L'huile a une densité plus faible que l'eau.
velocity | vitesse (vectorielle) | n | C1 | /vəˈlɒsəti/ | Calculate the velocity of the ball. | Calcule la vitesse de la balle.
acceleration | accélération | n | B2 | /əkˌseləˈreɪʃn/ | The car has fast acceleration. | La voiture a une forte accélération.
magnetism | magnétisme | n | C1 | /ˈmæɡnətɪzəm/ | Magnetism attracts iron. | Le magnétisme attire le fer.
magnetic field | champ magnétique | n | C1 | /mæɡˌnetɪk ˈfiːld/ | The Earth has a magnetic field. | La Terre a un champ magnétique.
proton | proton | n | C1 | /ˈprəʊtɒn/ | A proton has a positive charge. | Un proton a une charge positive.
neutron | neutron | n | C1 | /ˈnjuːtrɒn/ | A neutron has no charge. | Un neutron n'a pas de charge.
nucleus | noyau | n | C1 | /ˈnjuːkliəs/ | The nucleus is the centre of the atom. | Le noyau est le centre de l'atome.
organism | organisme | n | B2 | /ˈɔːɡənɪzəm/ | Bacteria are tiny organisms. | Les bactéries sont de minuscules organismes.
natural selection | sélection naturelle | n | C1 | /ˌnætʃrəl sɪˈlekʃn/ | Darwin described natural selection. | Darwin a décrit la sélection naturelle.
chromosome | chromosome | n | C1 | /ˈkrəʊməsəʊm/ | Humans have 46 chromosomes. | Les humains ont 46 chromosomes.
enzyme | enzyme | n | C1 | /ˈenzaɪm/ | Enzymes help digestion. | Les enzymes aident la digestion.
microbe | microbe | n | B2 | /ˈmaɪkrəʊb/ | Microbes live everywhere. | Les microbes vivent partout.
adaptation | adaptation | n | B2 | /ˌædæpˈteɪʃn/ | The camel's hump is an adaptation to the desert. | La bosse du chameau est une adaptation au désert.
mutation | mutation | n | C1 | /mjuːˈteɪʃn/ | A genetic mutation caused the disease. | Une mutation génétique a causé la maladie.
periodic table | tableau périodique | n | B2 | /ˌpɪəriɒdɪk ˈteɪbl/ | Learn the periodic table. | Apprends le tableau périodique.
helium | hélium | n | B2 | /ˈhiːliəm/ | The balloon is filled with helium. | Le ballon est rempli d'hélium.
chemical reaction | réaction chimique | n | B2 | /ˌkemɪkl riˈækʃn/ | Rust is a chemical reaction. | La rouille est une réaction chimique.
catalyst | catalyseur | n | C1 | /ˈkætəlɪst/ | The catalyst speeds up the reaction. | Le catalyseur accélère la réaction.
oxidation | oxydation | n | C1 | /ˌɒksɪˈdeɪʃn/ | Oxidation turns iron into rust. | L'oxydation transforme le fer en rouille.
evaporation | évaporation | n | B2 | /ɪˌvæpəˈreɪʃn/ | Evaporation leaves the salt behind. | L'évaporation laisse le sel.
condensation | condensation | n | B2 | /ˌkɒndenˈseɪʃn/ | Condensation formed on the window. | De la condensation s'est formée sur la vitre.
melting point | point de fusion | n | B2 | /ˈmeltɪŋ pɔɪnt/ | The melting point of ice is zero degrees. | Le point de fusion de la glace est de zéro degré.
sound | son | n | A1 | /saʊnd/ | Sound travels slower than light. | Le son voyage moins vite que la lumière.
wavelength | longueur d'onde | n | C1 | /ˈweɪvleŋθ/ | Red light has a long wavelength. | La lumière rouge a une grande longueur d'onde.
laser | laser | n | B1 | /ˈleɪzər/ | The surgeon used a laser. | Le chirurgien a utilisé un laser.
prism | prisme | n | B2 | /ˈprɪzəm/ | A prism splits light into colours. | Un prisme décompose la lumière en couleurs.
refraction | réfraction | n | C1 | /rɪˈfrækʃn/ | Refraction makes the straw look bent. | La réfraction fait paraître la paille tordue.
optics | optique | n | C1 | /ˈɒptɪks/ | Ibn al-Haytham founded modern optics. | Ibn al-Haytham a fondé l'optique moderne.
quantum physics | physique quantique | n | C1 | /ˌkwɒntəm ˈfɪzɪks/ | Quantum physics studies tiny particles. | La physique quantique étudie les particules infimes.
relativity | relativité | n | C1 | /ˌreləˈtɪvəti/ | Einstein developed the theory of relativity. | Einstein a élaboré la théorie de la relativité.
solar system | système solaire | n | A2 | /ˈsəʊlə ˌsɪstəm/ | There are eight planets in the solar system. | Il y a huit planètes dans le système solaire.
asteroid | astéroïde | n | B2 | /ˈæstərɔɪd/ | An asteroid passed close to Earth. | Un astéroïde est passé près de la Terre.
meteor | météore, étoile filante | n | B2 | /ˈmiːtiər/ | We saw a meteor last night. | Nous avons vu une étoile filante hier soir.
meteorite | météorite | n | B2 | /ˈmiːtiəraɪt/ | A meteorite fell in the desert. | Une météorite est tombée dans le désert.
black hole | trou noir | n | B2 | /ˌblæk ˈhəʊl/ | Nothing escapes a black hole. | Rien n'échappe à un trou noir.
supernova | supernova | n | C1 | /ˌsuːpəˈnəʊvə/ | A supernova is an exploding star. | Une supernova est une étoile qui explose.
nebula | nébuleuse | n | C1 | /ˈnebjələ/ | Stars are born in a nebula. | Les étoiles naissent dans une nébuleuse.
light year | année-lumière | n | B2 | /ˈlaɪt jɪər/ | The star is ten light years away. | L'étoile est à dix années-lumière.
space | espace | n | A2 | /speɪs/ | The astronauts travelled into space. | Les astronautes sont partis dans l'espace.
space station | station spatiale | n | B1 | /ˈspeɪs ˌsteɪʃn/ | The space station orbits the Earth. | La station spatiale tourne autour de la Terre.
probe | sonde | n | B2 | /prəʊb/ | The probe landed on Mars. | La sonde s'est posée sur Mars.
rover | astromobile, rover | n | B2 | /ˈrəʊvər/ | The rover sent photos of Mars. | Le rover a envoyé des photos de Mars.
AI | IA (intelligence artificielle) | n | B1 | /ˌeɪ ˈaɪ/ | AI is changing every industry. | L'IA transforme toutes les industries.
nanotechnology | nanotechnologie | n | C1 | /ˌnænəʊtekˈnɒlədʒi/ | Nanotechnology works at the atomic level. | La nanotechnologie travaille à l'échelle de l'atome.
biotechnology | biotechnologie | n | C1 | /ˌbaɪəʊtekˈnɒlədʒi/ | Biotechnology produced new vaccines. | La biotechnologie a produit de nouveaux vaccins.
genetic engineering | génie génétique | n | C1 | /dʒəˌnetɪk ˌendʒɪˈnɪərɪŋ/ | Genetic engineering raises ethical questions. | Le génie génétique soulève des questions éthiques.
cloning | clonage | n | C1 | /ˈkləʊnɪŋ/ | Human cloning is banned. | Le clonage humain est interdit.
data set | jeu de données | n | C1 | /ˈdeɪtə set/ | We analysed a large data set. | Nous avons analysé un grand jeu de données.
graph | graphique | n | B1 | /ɡrɑːf/ | The graph shows rising temperatures. | Le graphique montre la hausse des températures.
chart | graphique, tableau | n | B1 | /tʃɑːt/ | Look at the chart on page five. | Regarde le graphique page cinq.
diagram | schéma | n | B1 | /ˈdaɪəɡræm/ | Draw a diagram of the heart. | Dessine un schéma du cœur.
calculation | calcul | n | B1 | /ˌkælkjuˈleɪʃn/ | Check your calculation. | Vérifie ton calcul.
theorem | théorème | n | C1 | /ˈθɪərəm/ | Pythagoras' theorem is about triangles. | Le théorème de Pythagore porte sur les triangles.
ratio | rapport, proportion | n | B2 | /ˈreɪʃiəʊ/ | Mix water and flour in a ratio of two to one. | Mélange l'eau et la farine dans un rapport de deux pour un.
simulation | simulation | n | B2 | /ˌsɪmjuˈleɪʃn/ | The computer ran a simulation. | L'ordinateur a lancé une simulation.
Nobel Prize | prix Nobel | n | B1 | /ˌnəʊbel ˈpraɪz/ | She won the Nobel Prize in chemistry. | Elle a reçu le prix Nobel de chimie.
laureate | lauréat | n | C1 | /ˈlɒriət/ | He's a Nobel laureate. | Il est lauréat du prix Nobel.
trial and error | méthode par tâtonnements | expr | B2 | /ˌtraɪəl ənd ˈerər/ | We found the answer by trial and error. | Nous avons trouvé la réponse par tâtonnements.
theoretical | théorique | adj | C1 | /ˌθɪəˈretɪkl/ | It's only a theoretical risk. | Ce n'est qu'un risque théorique.
applied science | sciences appliquées | n | C1 | /əˌplaɪd ˈsaɪəns/ | Engineering is an applied science. | L'ingénierie est une science appliquée.
pure science | science fondamentale | n | C1 | /ˌpjʊə ˈsaɪəns/ | Mathematics is a pure science. | Les mathématiques sont une science fondamentale.
natural sciences | sciences naturelles | n | B2 | /ˌnætʃrəl ˈsaɪənsɪz/ | Biology belongs to the natural sciences. | La biologie fait partie des sciences naturelles.
social sciences | sciences sociales | n | B2 | /ˌsəʊʃl ˈsaɪənsɪz/ | Sociology is one of the social sciences. | La sociologie fait partie des sciences sociales.
life sciences | sciences de la vie | n | C1 | /ˈlaɪf ˌsaɪənsɪz/ | She works in life sciences. | Elle travaille dans les sciences de la vie.
earth sciences | sciences de la Terre | n | C1 | /ˈɜːθ ˌsaɪənsɪz/ | Geology is one of the earth sciences. | La géologie fait partie des sciences de la Terre.
to clone | cloner | v | B2 | /kləʊn/ | Scientists cloned a sheep in 1996. | Des scientifiques ont cloné une brebis en 1996.
intelligence | intelligence | n | A2 | /ɪnˈtelɪdʒəns/ | Artificial intelligence is changing our lives. | L'intelligence artificielle change nos vies.
atomic | atomique | adj | B1 | /əˈtɒmɪk/ | Atomic energy is controversial. | L'énergie atomique fait débat.
biochemistry | biochimie | n | B2 | /ˌbaɪəʊˈkemɪstri/ | She has a degree in biochemistry. | Elle est diplômée en biochimie.
disk | disque | n | B1 | /dɪsk/ | The hard disk is full. | Le disque dur est plein.
to dissolve | dissoudre, se dissoudre | v | B1 | /dɪˈzɒlv/ | Sugar dissolves in water. | Le sucre se dissout dans l'eau.
finding | découverte, conclusion | n | B2 | /ˈfaɪndɪŋ/ | The findings were published last month. | Les conclusions ont été publiées le mois dernier.
graphics | graphisme, images (informatique) | n | B1 | /ˈɡræfɪks/ | The game has amazing graphics. | Le jeu a des graphismes incroyables.
lab | labo | n | B1 | /læb/ | The samples were sent to the lab. | Les échantillons ont été envoyés au labo.
mechanical | mécanique | adj | B1 | /məˈkænɪkl/ | The delay was due to a mechanical problem. | Le retard était dû à un problème mécanique.
to reproduce | reproduire, se reproduire | v | B2 | /ˌriːprəˈdjuːs/ | Rabbits reproduce very quickly. | Les lapins se reproduisent très vite.
steel | acier | n | B1 | /stiːl/ | The bridge is made of steel. | Le pont est en acier.
technological | technologique | adj | B1 | /ˌteknəˈlɒdʒɪkl/ | We live in an age of technological change. | Nous vivons une époque de mutations technologiques.
aluminium | aluminium | n | B2 | /ˌæljəˈmɪniəm/ | Cans are made of aluminium. | Les canettes sont en aluminium.
ammonia | ammoniaque | n | B2 | /əˈməʊniə/ | Ammonia has a strong smell. | L'ammoniaque a une odeur forte.
axis | axe | n | B2 | /ˈæksɪs/ | The Earth rotates on its axis. | La Terre tourne sur son axe.
backup | sauvegarde ; renfort | n | B2 | /ˈbækʌp/ | Always keep a backup of your files. | Garde toujours une sauvegarde de tes fichiers.
biological | biologique | adj | B2 | /ˌbaɪəˈlɒdʒɪkl/ | He met his biological father. | Il a rencontré son père biologique.
bookmark | marque-page, favori | n | B2 | /ˈbʊkmɑːk/ | Add the page to your bookmarks. | Ajoute la page à tes favoris.
chip | puce (électronique) ; éclat | n | B2 | /tʃɪp/ | The card has a chip. | La carte a une puce.
circuitry | circuits | n | C1 | /ˈsɜːkɪtri/ | The circuitry was damaged by water. | Les circuits ont été endommagés par l'eau.
classification | classification | n | B2 | /ˌklæsɪfɪˈkeɪʃn/ | The classification of animals is complex. | La classification des animaux est complexe.
compression | compression | n | C1 | /kəmˈpreʃn/ | File compression saves space. | La compression des fichiers fait gagner de la place.
cursor | curseur | n | B2 | /ˈkɜːsə/ | Move the cursor to the top of the page. | Déplace le curseur en haut de la page.
cyberspace | cyberespace | n | B2 | /ˈsaɪbəspeɪs/ | Our data travels through cyberspace. | Nos données circulent dans le cyberespace.
decomposition | décomposition | n | C1 | /ˌdiːkɒmpəˈzɪʃn/ | Heat speeds up decomposition. | La chaleur accélère la décomposition.
desktop | bureau (écran) ; ordinateur de bureau | n | B2 | /ˈdesktɒp/ | Save the file on the desktop. | Enregistre le fichier sur le bureau.
electronics | électronique | n | B2 | /ɪˌlekˈtrɒnɪks/ | He studies electronics. | Il étudie l'électronique.
functionality | fonctionnalité | n | C1 | /ˌfʌŋkʃəˈnæləti/ | The new version has more functionality. | La nouvelle version offre plus de fonctionnalités.
gravitation | gravitation | n | C1 | /ˌɡrævɪˈteɪʃn/ | Newton studied gravitation. | Newton a étudié la gravitation.
hard drive | disque dur | n | B2 | /ˈhɑːd draɪv/ | My hard drive is full. | Mon disque dur est plein.
high-tech | de pointe, high-tech | adj | B2 | /ˌhaɪ ˈtek/ | It's a high-tech company. | C'est une entreprise de haute technologie.
hybrid | hybride | adj | B2 | /ˈhaɪbrɪd/ | We bought a hybrid car. | Nous avons acheté une voiture hybride.
inert | inerte | adj | C1 | /ɪˈnɜːt/ | Helium is an inert gas. | L'hélium est un gaz inerte.
input | entrée (de données) ; contribution | n | B2 | /ˈɪnpʊt/ | Thanks for your input. | Merci pour ta contribution.
interactive | interactif | adj | B2 | /ˌɪntərˈæktɪv/ | The museum has interactive displays. | Le musée propose des dispositifs interactifs.
keystroke | frappe (clavier) | n | C1 | /ˈkiːstrəʊk/ | You can save with a single keystroke. | Tu peux enregistrer d'une seule touche.
to magnify | grossir, agrandir | v | B2 | /ˈmæɡnɪfaɪ/ | The lens magnifies the image ten times. | La lentille grossit l'image dix fois.
mathematical | mathématique | adj | B2 | /ˌmæθəˈmætɪkl/ | She has a mathematical mind. | Elle a l'esprit mathématique.
microorganism | micro-organisme | n | C1 | /ˌmaɪkrəʊˈɔːɡənɪzəm/ | Bacteria are microorganisms. | Les bactéries sont des micro-organismes.
microscopic | microscopique | adj | B2 | /ˌmaɪkrəˈskɒpɪk/ | Microscopic creatures live in the water. | Des créatures microscopiques vivent dans l'eau.
numerical | numérique, chiffré | adj | B2 | /njuːˈmerɪkl/ | List them in numerical order. | Classe-les par ordre numérique.
predictive | prédictif | adj | C1 | /prɪˈdɪktɪv/ | My phone has predictive text. | Mon téléphone a la saisie prédictive.
projection | projection ; prévision | n | B2 | /prəˈdʒekʃn/ | Sales projections are good. | Les prévisions de ventes sont bonnes.
to quantify | quantifier | v | C1 | /ˈkwɒntɪfaɪ/ | It's hard to quantify the damage. | Il est difficile de chiffrer les dégâts.
radar | radar | n | B2 | /ˈreɪdɑː/ | The plane disappeared from the radar. | L'avion a disparu des écrans radar.
radium | radium | n | C1 | /ˈreɪdiəm/ | Marie Curie discovered radium. | Marie Curie a découvert le radium.
solvent | solvant | n | C1 | /ˈsɒlvənt/ | Water is a common solvent. | L'eau est un solvant courant.
transistor | transistor | n | B2 | /trænˈzɪstə/ | My grandfather still listens to his transistor. | Mon grand-père écoute encore son transistor.
to upgrade | mettre à niveau, améliorer | v | B2 | /ˌʌpˈɡreɪd/ | I need to upgrade my computer. | Je dois mettre à jour mon ordinateur.
user | utilisateur | n | B2 | /ˈjuːzə/ | The app has millions of users. | L'application compte des millions d'utilisateurs.
vibration | vibration | n | B2 | /vaɪˈbreɪʃn/ | You can feel the vibration of the engine. | On sent la vibration du moteur.
to zoom | zoomer ; filer à toute allure | v | B2 | /zuːm/ | Zoom in to see the details. | Zoome pour voir les détails.
statistical | statistique | adj | C1 | /stəˈtɪstɪkl/ | The statistical data is clear. | Les données statistiques sont claires.
mechanics | mécanique ; mécanisme | n | B2 | /məˈkænɪks/ | He's studying mechanics. | Il étudie la mécanique.
valve | valve, soupape | n | C1 | /vælv/ | The valve controls the flow of water. | La valve régule le débit de l'eau.
molecular | moléculaire | adj | C1 | /məˈlekjələ/ | She studies molecular biology. | Elle étudie la biologie moléculaire.
setup | configuration, installation | n | B2 | /ˈsetʌp/ | The setup only takes five minutes. | L'installation ne prend que cinq minutes.
matrix | matrice | n | C1 | /ˈmeɪtrɪks/ | The data is shown in a matrix. | Les données sont présentées sous forme de matrice.
optical | optique | adj | C1 | /ˈɒptɪkl/ | It's an optical illusion. | C'est une illusion d'optique.
median | médiane ; médian | n | C1 | /ˈmiːdiən/ | The median age is forty. | L'âge médian est de quarante ans.
thermal | thermique | adj | C1 | /ˈθɜːml/ | Wear thermal underwear in winter. | Porte des sous-vêtements thermiques en hiver.
platinum | platine | n | C1 | /ˈplætɪnəm/ | She has a platinum ring. | Elle a une bague en platine.
portal | portail | n | C1 | /ˈpɔːtl/ | Log in to the student portal. | Connecte-toi au portail étudiant.
silicon | silicium | n | C1 | /ˈsɪlɪkən/ | Computer chips are made of silicon. | Les puces électroniques sont en silicium.
vector | vecteur | n | C1 | /ˈvektə/ | Mosquitoes are vectors of disease. | Les moustiques sont des vecteurs de maladies.
configuration | configuration | n | C1 | /kənˌfɪɡəˈreɪʃn/ | Check the network configuration. | Vérifie la configuration du réseau.
binary | binaire | adj | C1 | /ˈbaɪnəri/ | Computers use binary code. | Les ordinateurs utilisent le code binaire.
plasma | plasma | n | C1 | /ˈplæzmə/ | Plasma is part of the blood. | Le plasma est un composant du sang.
aggregate | total, ensemble | n | C2 | /ˈæɡrɪɡət/ | The aggregate score decides the winner. | Le score cumulé désigne le vainqueur.
composite | composite | adj | C1 | /ˈkɒmpəzɪt/ | The wings are made of composite materials. | Les ailes sont en matériaux composites.
cellular | cellulaire | adj | C1 | /ˈseljələ/ | Cancer starts at a cellular level. | Le cancer commence au niveau cellulaire.
node | nœud | n | C1 | /nəʊd/ | Each node in the network is a computer. | Chaque nœud du réseau est un ordinateur.
sodium | sodium | n | C1 | /ˈsəʊdiəm/ | Salt contains sodium. | Le sel contient du sodium.
calcium | calcium | n | C1 | /ˈkælsiəm/ | Milk is rich in calcium. | Le lait est riche en calcium.
evolutionary | évolutionniste, de l'évolution | adj | C1 | /ˌiːvəˈluːʃənri/ | They discussed evolutionary theory. | Ils ont débattu de la théorie de l'évolution.
membrane | membrane | n | C1 | /ˈmembreɪn/ | A thin membrane covers the cell. | Une fine membrane recouvre la cellule.
nickel | nickel | n | C1 | /ˈnɪkl/ | Some people are allergic to nickel. | Certaines personnes sont allergiques au nickel.
extraction | extraction | n | C1 | /ɪkˈstrækʃn/ | Oil extraction harms the environment. | L'extraction pétrolière nuit à l'environnement.
font | police de caractères | n | B2 | /fɒnt/ | Choose a bigger font. | Choisis une police plus grande.
receptor | récepteur | n | C2 | /rɪˈseptə/ | The drug blocks pain receptors. | Le médicament bloque les récepteurs de la douleur.
apparatus | appareil, dispositif | n | C1 | /ˌæpəˈreɪtəs/ | The firefighters wore breathing apparatus. | Les pompiers portaient des appareils respiratoires.
lunar | lunaire | adj | C1 | /ˈluːnə/ | The Islamic calendar is lunar. | Le calendrier islamique est lunaire.
neural | neuronal | adj | C1 | /ˈnjʊərəl/ | They built a neural network. | Ils ont conçu un réseau de neurones.
screenshot | capture d'écran | n | B2 | /ˈskriːnʃɒt/ | Send me a screenshot. | Envoie-moi une capture d'écran.
aerospace | aérospatial | n | C1 | /ˈeərəʊspeɪs/ | She works in aerospace. | Elle travaille dans l'aérospatiale.
genus | genre (biologie) | n | C2 | /ˈdʒiːnəs/ | Lions belong to the genus Panthera. | Les lions appartiennent au genre Panthera.
proxy | mandataire ; procuration | n | C2 | /ˈprɒksi/ | You can vote by proxy. | Tu peux voter par procuration.
quantitative | quantitatif | adj | C1 | /ˈkwɒntɪtətɪv/ | We used quantitative methods. | Nous avons utilisé des méthodes quantitatives.
hydraulic | hydraulique | adj | C1 | /haɪˈdrɒlɪk/ | The lift uses a hydraulic system. | L'ascenseur fonctionne avec un système hydraulique.
pixel | pixel | n | B2 | /ˈpɪksl/ | The screen has millions of pixels. | L'écran compte des millions de pixels.
infrared | infrarouge | adj | C1 | /ˌɪnfrəˈred/ | The camera uses infrared light. | La caméra utilise la lumière infrarouge.
template | modèle, gabarit | n | C1 | /ˈtempleɪt/ | Use this template for your letter. | Utilise ce modèle pour ta lettre.
avatar | avatar | n | B2 | /ˈævətɑː/ | Choose an avatar for your profile. | Choisis un avatar pour ton profil.
absorption | absorption | n | C1 | /əbˈzɔːpʃn/ | Vitamin C helps iron absorption. | La vitamine C favorise l'absorption du fer.
oxide | oxyde | n | C1 | /ˈɒksaɪd/ | Rust is an iron oxide. | La rouille est un oxyde de fer.
resonance | résonance | n | C2 | /ˈrezənəns/ | His words have a strong resonance today. | Ses paroles ont une forte résonance aujourd'hui.
torque | couple (moteur) | n | C2 | /tɔːk/ | The engine has a lot of torque. | Le moteur a beaucoup de couple.
zinc | zinc | n | C1 | /zɪŋk/ | Zinc helps the immune system. | Le zinc renforce le système immunitaire.
mutant | mutant | n | C1 | /ˈmjuːtənt/ | The virus produced a mutant strain. | Le virus a produit une souche mutante.
polymer | polymère | n | C2 | /ˈpɒlɪmə/ | Plastic is a polymer. | Le plastique est un polymère.
tracker | traceur, outil de suivi | n | C1 | /ˈtrækə/ | I use a fitness tracker. | J'utilise un bracelet d'activité.
bandwidth | bande passante | n | C1 | /ˈbændwɪdθ/ | Video calls use a lot of bandwidth. | Les appels vidéo consomment beaucoup de bande passante.
computational | informatique, computationnel | adj | C2 | /ˌkɒmpjuˈteɪʃənl/ | It needs a lot of computational power. | Cela demande beaucoup de puissance de calcul.
pointer | pointeur ; conseil | n | C1 | /ˈpɔɪntə/ | Can you give me some pointers? | Tu peux me donner quelques conseils ?
alloy | alliage | n | C1 | /ˈælɔɪ/ | Bronze is an alloy of copper and tin. | Le bronze est un alliage de cuivre et d'étain.
trajectory | trajectoire | n | C2 | /trəˈdʒektəri/ | They calculated the trajectory of the rocket. | Ils ont calculé la trajectoire de la fusée.
calculus | calcul (infinitésimal) | n | C2 | /ˈkælkjələs/ | Newton developed calculus. | Newton a développé le calcul infinitésimal.
orbital | orbital | adj | C2 | /ˈɔːbɪtl/ | The satellite reached its orbital position. | Le satellite a atteint sa position orbitale.
electromagnetic | électromagnétique | adj | C2 | /ɪˌlektrəʊmæɡˈnetɪk/ | Light is an electromagnetic wave. | La lumière est une onde électromagnétique.
potassium | potassium | n | C1 | /pəˈtæsiəm/ | Bananas are rich in potassium. | Les bananes sont riches en potassium.
connectivity | connectivité | n | C1 | /ˌkɒnekˈtɪvəti/ | The village has poor internet connectivity. | Le village a une mauvaise connexion internet.
lithium | lithium | n | C1 | /ˈlɪθiəm/ | The battery uses lithium. | La batterie utilise du lithium.
planetary | planétaire | adj | C1 | /ˈplænətri/ | They study planetary motion. | Ils étudient le mouvement des planètes.
titanium | titane | n | C1 | /tɪˈteɪniəm/ | The frame is made of titanium. | Le cadre est en titane.
robotic | robotique | adj | C1 | /rəʊˈbɒtɪk/ | They used a robotic arm. | Ils ont utilisé un bras robotisé.
semiconductor | semi-conducteur | n | C2 | /ˌsemikənˈdʌktə/ | Taiwan makes many semiconductors. | Taïwan fabrique beaucoup de semi-conducteurs.
subset | sous-ensemble | n | C2 | /ˈsʌbset/ | This group is a subset of the whole. | Ce groupe est un sous-ensemble de l'ensemble.
cosmos | cosmos | n | C1 | /ˈkɒzmɒs/ | The cosmos is vast and ordered. | Le cosmos est vaste et ordonné.
router | routeur, box | n | B2 | /ˈruːtə/ | Restart the router. | Redémarre la box.
astronomical | astronomique | adj | C1 | /ˌæstrəˈnɒmɪkl/ | The prices are astronomical. | Les prix sont astronomiques.
galactic | galactique | adj | C2 | /ɡəˈlæktɪk/ | Scientists study galactic clusters. | Les scientifiques étudient les amas galactiques.
login | identifiant ; connexion | n | B2 | /ˈlɒɡɪn/ | Enter your login and password. | Saisis ton identifiant et ton mot de passe.
magnesium | magnésium | n | C1 | /mæɡˈniːziəm/ | Almonds contain magnesium. | Les amandes contiennent du magnésium.
malware | logiciel malveillant | n | C1 | /ˈmælweə/ | The computer was infected with malware. | L'ordinateur était infecté par un logiciel malveillant.
ballistic | balistique | adj | C2 | /bəˈlɪstɪk/ | They tested a ballistic missile. | Ils ont testé un missile balistique.
corrosion | corrosion | n | C2 | /kəˈrəʊʒn/ | Salt water causes corrosion. | L'eau salée provoque la corrosion.
formulation | formulation | n | C2 | /ˌfɔːmjuˈleɪʃn/ | The formulation of the problem is unclear. | La formulation du problème n'est pas claire.
fungi | champignons (biologie) | n | C2 | /ˈfʌŋɡaɪ/ | Fungi grow in damp places. | Les champignons poussent dans les endroits humides.
shutter | volet ; obturateur | n | C1 | /ˈʃʌtə/ | Close the shutters at night. | Ferme les volets la nuit.
terrestrial | terrestre | adj | C2 | /təˈrestriəl/ | Most animals are terrestrial. | La plupart des animaux sont terrestres.
aperture | ouverture | n | C2 | /ˈæpətʃə/ | Adjust the camera's aperture. | Règle l'ouverture de l'appareil photo.
connector | connecteur | n | C1 | /kəˈnektə/ | The cable has a USB connector. | Le câble a un connecteur USB.
experimentation | expérimentation | n | C1 | /ɪkˌsperɪmenˈteɪʃn/ | Animal experimentation is controversial. | L'expérimentation animale fait débat.
piston | piston | n | C2 | /ˈpɪstən/ | The piston moves up and down. | Le piston monte et descend.
graphical | graphique | adj | C1 | /ˈɡræfɪkl/ | It has a simple graphical interface. | Il a une interface graphique simple.
propulsion | propulsion | n | C2 | /prəˈpʌlʃn/ | The rocket uses jet propulsion. | La fusée utilise la propulsion à réaction.
statistic | statistique (chiffre) | n | B2 | /stəˈtɪstɪk/ | That's a shocking statistic. | C'est un chiffre choquant.
soluble | soluble | adj | C1 | /ˈsɒljəbl/ | Salt is soluble in water. | Le sel est soluble dans l'eau.
chlorine | chlore | n | C1 | /ˈklɔːriːn/ | The pool smells of chlorine. | La piscine sent le chlore.
accelerator | accélérateur | n | C1 | /əkˈseləreɪtə/ | Press the accelerator gently. | Appuie doucement sur l'accélérateur.
replication | reproduction, réplication | n | C2 | /ˌreplɪˈkeɪʃn/ | Replication of the study is needed. | Il faut reproduire l'étude.
converter | convertisseur | n | C1 | /kənˈvɜːtə/ | Use a currency converter. | Utilise un convertisseur de devises.
ether | éther | n | C2 | /ˈiːθə/ | The signal travelled through the ether. | Le signal a voyagé dans l'éther.
latex | latex | n | C2 | /ˈleɪteks/ | Some people are allergic to latex. | Certaines personnes sont allergiques au latex.
silicone | silicone | n | C2 | /ˈsɪlɪkəʊn/ | The mould is made of silicone. | Le moule est en silicone.
coefficient | coefficient | n | C2 | /ˌkəʊɪˈfɪʃnt/ | Maths has a high coefficient in the exam. | Les maths ont un fort coefficient à l'examen.
integer | nombre entier | n | C2 | /ˈɪntɪdʒə/ | Five is an integer. | Cinq est un nombre entier.
compressor | compresseur | n | C2 | /kəmˈpresə/ | The fridge compressor is noisy. | Le compresseur du frigo est bruyant.
cobalt | cobalt | n | C2 | /ˈkəʊbɔːlt/ | Cobalt is used in batteries. | Le cobalt est utilisé dans les batteries.
compiler | compilateur | n | C2 | /kəmˈpaɪlə/ | The compiler found an error in the code. | Le compilateur a trouvé une erreur dans le code.
pigment | pigment | n | C2 | /ˈpɪɡmənt/ | Melanin is a natural pigment. | La mélanine est un pigment naturel.
porous | poreux | adj | C2 | /ˈpɔːrəs/ | Clay pots are porous. | Les pots en argile sont poreux.
saturation | saturation | n | C2 | /ˌsætʃəˈreɪʃn/ | The market has reached saturation. | Le marché est saturé.
lattice | treillis, réseau | n | C2 | /ˈlætɪs/ | The window has a wooden lattice. | La fenêtre a un treillis en bois.
metadata | métadonnées | n | C2 | /ˈmetədeɪtə/ | The file contains metadata. | Le fichier contient des métadonnées.
specimen | spécimen, échantillon | n | C1 | /ˈspesɪmən/ | The museum has rare specimens of insects. | Le musée possède de rares spécimens d'insectes.
acidic | acide | adj | C1 | /əˈsɪdɪk/ | Lemon juice is acidic. | Le jus de citron est acide.
pendulum | pendule, balancier | n | C1 | /ˈpendjələm/ | The pendulum of the clock swung slowly. | Le balancier de l'horloge oscillait lentement.
to dissect | disséquer | v | C1 | /daɪˈsekt/ | We dissected a frog in biology. | Nous avons disséqué une grenouille en biologie.
recessive | récessif | adj | C2 | /rɪˈsesɪv/ | Blue eyes are a recessive trait. | Les yeux bleus sont un caractère récessif.
magnetic | magnétique | adj | C1 | /mæɡˈnetɪk/ | The compass uses a magnetic needle. | La boussole utilise une aiguille aimantée.
anthropology | anthropologie | n | C1 | /ˌænθrəˈpɒlədʒi/ | She studied social anthropology. | Elle a étudié l'anthropologie sociale.
anthropologist | anthropologue | n | C1 | /ˌænθrəˈpɒlədʒɪst/ | The anthropologist lived with the tribe. | L'anthropologue a vécu avec la tribu.
to digitise | numériser | v | C1 | /ˈdɪdʒɪtaɪz/ | The library digitised its old manuscripts. | La bibliothèque a numérisé ses anciens manuscrits.
digitisation | numérisation | n | C2 | /ˌdɪdʒɪtaɪˈzeɪʃn/ | The digitisation of archives takes years. | La numérisation des archives prend des années.
locomotion | locomotion | n | C2 | /ˌləʊkəˈməʊʃn/ | Walking is a form of locomotion. | La marche est un mode de locomotion.
to hypothesise | émettre une hypothèse | v | C2 | /haɪˈpɒθəsaɪz/ | Scientists hypothesise that water exists on Mars. | Les scientifiques supposent qu'il y a de l'eau sur Mars.
stratosphere | stratosphère | n | C2 | /ˈstrætəsfɪə/ | The balloon rose into the stratosphere. | Le ballon est monté jusqu'à la stratosphère.
to automate | automatiser | v | C1 | /ˈɔːtəmeɪt/ | The factory automated its production. | L'usine a automatisé sa production.
anthropological | anthropologique | adj | C2 | /ˌænθrəpəˈlɒdʒɪkl/ | It's an anthropological study. | C'est une étude anthropologique.
to distil | distiller | v | C2 | /dɪˈstɪl/ | They distil water from the sea. | Ils distillent l'eau de mer.
distillation | distillation | n | C2 | /ˌdɪstɪˈleɪʃn/ | Distillation separates liquids. | La distillation sépare les liquides.
methodology | méthodologie | n | C2 | /ˌmeθəˈdɒlədʒi/ | The methodology of the study is sound. | La méthodologie de l'étude est solide.
methodological | méthodologique | adj | C2 | /ˌmeθədəˈlɒdʒɪkl/ | There are methodological problems. | Il y a des problèmes méthodologiques.
correlation | corrélation | n | C2 | /ˌkɒrəˈleɪʃn/ | There's a strong correlation between diet and health. | Il existe une forte corrélation entre alimentation et santé.
equilibrium | équilibre | n | C2 | /ˌiːkwɪˈlɪbriəm/ | The system is in equilibrium. | Le système est en équilibre.
electrode | électrode | n | C2 | /ɪˈlektrəʊd/ | Electrodes were attached to his chest. | Des électrodes ont été fixées sur sa poitrine.
cosmic | cosmique | adj | C2 | /ˈkɒzmɪk/ | Cosmic rays reach the Earth. | Les rayons cosmiques atteignent la Terre.
qualitative | qualitatif | adj | C2 | /ˈkwɒlɪtətɪv/ | They used qualitative research methods. | Ils ont utilisé des méthodes de recherche qualitatives.
to computerise | informatiser | v | C2 | /kəmˈpjuːtəraɪz/ | The library computerised its catalogue. | La bibliothèque a informatisé son catalogue.
kinetic | cinétique | adj | C2 | /kɪˈnetɪk/ | Moving objects have kinetic energy. | Les objets en mouvement ont une énergie cinétique.
vestigial | vestigial, résiduel | adj | C2 | /veˈstɪdʒiəl/ | The appendix is a vestigial organ. | L'appendice est un organe vestigial.
gravitational | gravitationnel | adj | C2 | /ˌɡrævɪˈteɪʃənl/ | The moon's gravitational pull causes tides. | L'attraction gravitationnelle de la lune provoque les marées.
sulphuric | sulfurique | adj | C2 | /sʌlˈfjʊərɪk/ | Sulphuric acid is very dangerous. | L'acide sulfurique est très dangereux.
adhesion | adhérence, adhésion | n | C2 | /ədˈhiːʒn/ | The tyres have good adhesion. | Les pneus ont une bonne adhérence.
cognitive | cognitif | adj | C2 | /ˈkɒɡnətɪv/ | Sleep improves cognitive function. | Le sommeil améliore les fonctions cognitives.
vortex | vortex, tourbillon | n | C2 | /ˈvɔːteks/ | The water formed a vortex. | L'eau formait un tourbillon.
collider | collisionneur | n | C2 | /kəˈlaɪdə/ | The particle collider is in Switzerland. | Le collisionneur de particules se trouve en Suisse.
telescopic | télescopique | adj | C2 | /ˌtelɪˈskɒpɪk/ | It has a telescopic handle. | Il a une poignée télescopique.
elasticity | élasticité | n | C2 | /ˌiːlæˈstɪsəti/ | The skin loses elasticity with age. | La peau perd de son élasticité avec l'âge.
authentication | authentification | n | C2 | /ɔːˌθentɪˈkeɪʃn/ | Two-step authentication is safer. | L'authentification en deux étapes est plus sûre.
computation | calcul | n | C2 | /ˌkɒmpjuˈteɪʃn/ | The computation took several hours. | Le calcul a pris plusieurs heures.
graphite | graphite | n | C2 | /ˈɡræfaɪt/ | Pencils contain graphite. | Les crayons contiennent du graphite.
calibration | étalonnage | n | C2 | /ˌkælɪˈbreɪʃn/ | The scales need calibration. | La balance doit être étalonnée.
cognition | cognition | n | C2 | /kɒɡˈnɪʃn/ | Sleep affects cognition. | Le sommeil influence la cognition.
embryo | embryon | n | C1 | /ˈembriəʊ/ | The Qur'an describes the stages of the embryo. | Le Coran décrit les étapes de l'embryon.
interstellar | interstellaire | adj | C2 | /ˌɪntəˈstelə/ | Interstellar travel is still a dream. | Le voyage interstellaire reste un rêve.
exponential | exponentiel | adj | C2 | /ˌekspəˈnenʃl/ | There's been exponential growth. | Il y a eu une croissance exponentielle.
microbial | microbien | adj | C2 | /maɪˈkrəʊbiəl/ | They found microbial life in the lake. | Ils ont trouvé de la vie microbienne dans le lac.
ultraviolet | ultraviolet | adj | C1 | /ˌʌltrəˈvaɪələt/ | Ultraviolet rays can burn your skin. | Les rayons ultraviolets peuvent brûler la peau.
photon | photon | n | C2 | /ˈfəʊtɒn/ | Light is made of photons. | La lumière est faite de photons.
filtration | filtration | n | C2 | /fɪlˈtreɪʃn/ | Water filtration removes bacteria. | La filtration de l'eau élimine les bactéries.
latency | latence | n | C2 | /ˈleɪtnsi/ | The game has low latency. | Le jeu a une faible latence.
fermentation | fermentation | n | C2 | /ˌfɜːmenˈteɪʃn/ | Yoghurt is made by fermentation. | Le yaourt est obtenu par fermentation.
sonar | sonar | n | C2 | /ˈsəʊnɑː/ | The ship uses sonar to find fish. | Le navire utilise un sonar pour trouver les poissons.
keyword | mot-clé | n | B2 | /ˈkiːwɜːd/ | Type a keyword to search. | Tape un mot-clé pour chercher.
modulation | modulation | n | C2 | /ˌmɒdjuˈleɪʃn/ | The radio uses frequency modulation. | La radio utilise la modulation de fréquence.
wearable | portable (technologie) | adj | C2 | /ˈweərəbl/ | Wearable technology tracks your health. | Les objets connectés suivent ta santé.
amplitude | amplitude | n | C2 | /ˈæmplɪtjuːd/ | The amplitude of the wave increased. | L'amplitude de l'onde a augmenté.
analogue | analogique | adj | C2 | /ˈænəlɒɡ/ | He still uses an analogue watch. | Il utilise encore une montre analogique.
entropy | entropie | n | C2 | /ˈentrəpi/ | Entropy always increases. | L'entropie augmente toujours.
helix | hélice, spirale | n | C2 | /ˈhiːlɪks/ | DNA has a double helix. | L'ADN a une structure en double hélice.
sociological | sociologique | adj | C2 | /ˌsəʊsiəˈlɒdʒɪkl/ | It's a sociological study. | C'est une étude sociologique.
alkaline | alcalin | adj | C2 | /ˈælkəlaɪn/ | The soil is alkaline. | Le sol est alcalin.
fluoride | fluor | n | C2 | /ˈflɔːraɪd/ | Toothpaste contains fluoride. | Le dentifrice contient du fluor.
microbiology | microbiologie | n | C2 | /ˌmaɪkrəʊbaɪˈɒlədʒi/ | She studies microbiology. | Elle étudie la microbiologie.
phosphorus | phosphore | n | C2 | /ˈfɒsfərəs/ | Fish is rich in phosphorus. | Le poisson est riche en phosphore.
cyanide | cyanure | n | C2 | /ˈsaɪənaɪd/ | Cyanide is a deadly poison. | Le cyanure est un poison mortel.
fluorescence | fluorescence | n | C2 | /flɔːˈresns/ | The paint glows with fluorescence. | La peinture brille par fluorescence.
thumbnail | miniature, vignette | n | C1 | /ˈθʌmneɪl/ | Click on the thumbnail to see the photo. | Clique sur la vignette pour voir la photo.
arsenic | arsenic | n | C2 | /ˈɑːsnɪk/ | Arsenic is a poison. | L'arsenic est un poison.
deletion | suppression | n | C1 | /dɪˈliːʃn/ | The deletion of the file was a mistake. | La suppression du fichier était une erreur.
embryonic | embryonnaire | adj | C2 | /ˌembriˈɒnɪk/ | The project is still at an embryonic stage. | Le projet en est encore au stade embryonnaire.
firmware | micrologiciel | n | C2 | /ˈfɜːmweə/ | Update the router's firmware. | Mets à jour le micrologiciel du routeur.
inorganic | inorganique | adj | C2 | /ˌɪnɔːˈɡænɪk/ | Salt is an inorganic compound. | Le sel est un composé inorganique.
convection | convection | n | C2 | /kənˈvekʃn/ | Heat moves by convection. | La chaleur se déplace par convection.
deflection | déviation | n | C2 | /dɪˈflekʃn/ | The deflection of light by gravity was proved. | La déviation de la lumière par la gravité a été prouvée.
alchemy | alchimie | n | C2 | /ˈælkəmi/ | Medieval scholars studied alchemy. | Les savants médiévaux étudiaient l'alchimie.
biochemical | biochimique | adj | C2 | /ˌbaɪəʊˈkemɪkl/ | It's a biochemical process. | C'est un processus biochimique.
nomenclature | nomenclature | n | C2 | /nəˈmenklətʃə/ | Learn the chemical nomenclature. | Apprends la nomenclature chimique.
acidity | acidité | n | C2 | /əˈsɪdəti/ | Measure the acidity of the soil. | Mesure l'acidité du sol.
aerodynamic | aérodynamique | adj | C2 | /ˌeərəʊdaɪˈnæmɪk/ | The car has an aerodynamic shape. | La voiture a une forme aérodynamique.
algebraic | algébrique | adj | C2 | /ˌældʒɪˈbreɪɪk/ | Solve the algebraic equation. | Résous l'équation algébrique.
iodine | iode | n | C2 | /ˈaɪədiːn/ | Seaweed is rich in iodine. | Les algues sont riches en iode.
cosmology | cosmologie | n | C2 | /kɒzˈmɒlədʒi/ | Modern cosmology studies the origin of the universe. | La cosmologie moderne étudie l'origine de l'univers.
touchscreen | écran tactile | n | B2 | /ˈtʌtʃskriːn/ | The phone has a touchscreen. | Le téléphone a un écran tactile.
Bluetooth | Bluetooth | n | B1 | /ˈbluːtuːθ/ | Connect your headphones by Bluetooth. | Connecte ton casque en Bluetooth.
assay | essai, analyse (d'un métal) | n | C2 | /ˈæseɪ/ | The laboratory ran an assay of the gold. | Le laboratoire a fait une analyse de l'or.
catalytic | catalytique | adj | C2 | /ˌkætəˈlɪtɪk/ | Cars have a catalytic converter. | Les voitures ont un pot catalytique.
equivalence | équivalence | n | C1 | /ɪˈkwɪvələns/ | There's no equivalence between the two. | Il n'y a pas d'équivalence entre les deux.
inertia | inertie | n | C1 | /ɪˈnɜːʃə/ | Political inertia slows reform. | L'inertie politique ralentit les réformes.
neuron | neurone | n | C1 | /ˈnjʊərɒn/ | The brain has billions of neurons. | Le cerveau compte des milliards de neurones.
singularity | singularité | n | C2 | /ˌsɪŋɡjuˈlærəti/ | The singularity of his style is striking. | La singularité de son style est frappante.
aqueous | aqueux | adj | C2 | /ˈeɪkwiəs/ | It's an aqueous solution. | C'est une solution aqueuse.
naturalist | naturaliste | n | C1 | /ˈnætʃrəlɪst/ | The naturalist studied the birds of the island. | Le naturaliste étudiait les oiseaux de l'île.
observational | d'observation | adj | C2 | /ˌɒbzəˈveɪʃənl/ | It's an observational study. | C'est une étude d'observation.
astral | astral | adj | C2 | /ˈæstrəl/ | Astrologers speak of astral influences. | Les astrologues parlent d'influences astrales.
viscosity | viscosité | n | C2 | /vɪˈskɒsəti/ | Honey has a high viscosity. | Le miel a une viscosité élevée.
cipher | chiffre, code secret | n | C2 | /ˈsaɪfə/ | Al-Kindi broke ciphers in the ninth century. | Al-Kindi déchiffrait des codes au IXe siècle.
schematic | schématique | adj | C2 | /skiːˈmætɪk/ | Here's a schematic diagram of the engine. | Voici un schéma du moteur.
corrosive | corrosif | adj | C1 | /kəˈrəʊsɪv/ | Acid is highly corrosive. | L'acide est très corrosif.
pneumatic | pneumatique | adj | C2 | /njuːˈmætɪk/ | Workers used a pneumatic drill. | Les ouvriers utilisaient un marteau-piqueur.
aeronautics | aéronautique | n | C1 | /ˌeərəˈnɔːtɪks/ | He works in aeronautics. | Il travaille dans l'aéronautique.
extraterrestrial | extraterrestre | adj | C1 | /ˌekstrətəˈrestriəl/ | Do you believe in extraterrestrial life? | Crois-tu à la vie extraterrestre ?
filament | filament | n | C2 | /ˈfɪləmənt/ | The bulb's filament has broken. | Le filament de l'ampoule est cassé.
respondent | personne interrogée | n | C1 | /rɪˈspɒndənt/ | Most respondents agreed with the statement. | La plupart des personnes interrogées étaient d'accord.
ultrasonic | ultrasonique | adj | C2 | /ˌʌltrəˈsɒnɪk/ | Bats use ultrasonic sounds. | Les chauves-souris utilisent des ultrasons.
airflow | flux d'air | n | C1 | /ˈeəfləʊ/ | Keep the airflow around the computer clear. | Laisse l'air circuler autour de l'ordinateur.
taxonomy | taxonomie, classification | n | C2 | /tækˈsɒnəmi/ | Taxonomy classifies living things. | La taxonomie classe les êtres vivants.
cellulose | cellulose | n | C2 | /ˈseljuləʊs/ | Paper is made from cellulose. | Le papier est fait de cellulose.
dilution | dilution | n | C2 | /daɪˈluːʃn/ | The dilution of the acid reduces the danger. | La dilution de l'acide réduit le danger.
polarity | polarité | n | C2 | /pəˈlærəti/ | Check the polarity of the battery. | Vérifie la polarité de la pile.
fractional | fractionnaire ; infime | adj | C2 | /ˈfrækʃənl/ | There was only a fractional increase. | Il n'y a eu qu'une hausse infime.
lubricant | lubrifiant | n | C1 | /ˈluːbrɪkənt/ | Oil is used as a lubricant. | L'huile sert de lubrifiant.
quark | quark | n | C2 | /kwɑːk/ | Protons are made of quarks. | Les protons sont constitués de quarks.
polygon | polygone | n | C1 | /ˈpɒlɪɡən/ | A hexagon is a polygon with six sides. | Un hexagone est un polygone à six côtés.
by-product | sous-produit | n | C1 | /ˈbaɪ prɒdʌkt/ | Sawdust is a by-product of woodwork. | La sciure est un sous-produit de la menuiserie.
cathode | cathode | n | C2 | /ˈkæθəʊd/ | Electrons flow from the cathode. | Les électrons partent de la cathode.
metamorphosis | métamorphose | n | C1 | /ˌmetəˈmɔːfəsɪs/ | The caterpillar undergoes metamorphosis. | La chenille subit une métamorphose.
basalt | basalte | n | C2 | /ˈbæsɔːlt/ | The island is made of black basalt. | L'île est faite de basalte noir.
concave | concave | adj | C1 | /ˈkɒnkeɪv/ | A concave mirror magnifies the image. | Un miroir concave grossit l'image.
incandescent | incandescent | adj | C2 | /ˌɪnkænˈdesnt/ | Incandescent bulbs waste energy. | Les ampoules à incandescence gaspillent de l'énergie.
eugenics | eugénisme | n | C2 | /juːˈdʒenɪks/ | Eugenics was used to justify crimes. | L'eugénisme a servi à justifier des crimes.
formaldehyde | formaldéhyde | n | C2 | /fɔːˈmældɪhaɪd/ | The samples are kept in formaldehyde. | Les échantillons sont conservés dans du formaldéhyde.
fractal | fractale | n | C2 | /ˈfræktl/ | Snowflakes form fractal patterns. | Les flocons de neige forment des motifs fractals.
fieldwork | travail de terrain | n | C1 | /ˈfiːldwɜːk/ | The anthropologist did fieldwork in Mali. | L'anthropologue a fait du terrain au Mali.
hexagonal | hexagonal | adj | C1 | /hekˈsæɡənl/ | Bees build hexagonal cells. | Les abeilles construisent des alvéoles hexagonales.
oscillation | oscillation | n | C2 | /ˌɒsɪˈleɪʃn/ | The oscillation of the pendulum. | L'oscillation du pendule.
plasticity | plasticité | n | C2 | /plæˈstɪsəti/ | The brain has great plasticity. | Le cerveau a une grande plasticité.
salinity | salinité | n | C2 | /səˈlɪnəti/ | The salinity of the Dead Sea is very high. | La salinité de la mer Morte est très élevée.
solubility | solubilité | n | C2 | /ˌsɒljuˈbɪləti/ | Sugar has high solubility in water. | Le sucre est très soluble dans l'eau.
tensile strength | résistance à la traction | n | C2 | /ˈtensaɪl streŋθ/ | Steel has a high tensile strength. | L'acier a une grande résistance à la traction.
buoyancy | flottabilité ; dynamisme | n | C2 | /ˈbɔɪənsi/ | Salt water increases buoyancy. | L'eau salée augmente la flottabilité.
to encode | encoder, coder | v | C1 | /ɪnˈkəʊd/ | The data is encoded for security. | Les données sont codées pour des raisons de sécurité.
exponent | partisan, défenseur ; exposant | n | C2 | /ɪkˈspəʊnənt/ | He was a leading exponent of reform. | C'était un grand défenseur de la réforme.
obsidian | obsidienne | n | C2 | /əbˈsɪdiən/ | Obsidian is a volcanic glass. | L'obsidienne est un verre volcanique.
quotient | quotient | n | C1 | /ˈkwəʊʃnt/ | He has a high intelligence quotient. | Il a un quotient intellectuel élevé.
sown | semé | adj | C1 | /səʊn/ | The seeds have been sown. | Les graines ont été semées.
metallurgy | métallurgie | n | C2 | /məˈtælədʒi/ | The city was known for its metallurgy. | La ville était connue pour sa métallurgie.
viscous | visqueux | adj | C2 | /ˈvɪskəs/ | Honey is a viscous liquid. | Le miel est un liquide visqueux.
aerodynamics | aérodynamique | n | C2 | /ˌeərəʊdaɪˈnæmɪks/ | Engineers study aerodynamics. | Les ingénieurs étudient l'aérodynamique.
gaseous | gazeux | adj | C2 | /ˈɡæsiəs/ | Water changes into a gaseous state. | L'eau passe à l'état gazeux.
gypsum | gypse | n | C2 | /ˈdʒɪpsəm/ | Plaster is made from gypsum. | Le plâtre est fait de gypse.
kinetics | cinétique | n | C2 | /kɪˈnetɪks/ | Kinetics studies the speed of reactions. | La cinétique étudie la vitesse des réactions.
magnification | grossissement | n | C2 | /ˌmæɡnɪfɪˈkeɪʃn/ | The microscope has high magnification. | Le microscope a un fort grossissement.
symbiotic | symbiotique | adj | C2 | /ˌsɪmbaɪˈɒtɪk/ | They have a symbiotic relationship. | Ils ont une relation symbiotique.
concentric | concentrique | adj | C2 | /kənˈsentrɪk/ | The pilgrims form concentric circles around the Kaaba. | Les pèlerins forment des cercles concentriques autour de la Kaaba.
microprocessor | microprocesseur | n | C1 | /ˌmaɪkrəʊˈprəʊsesə/ | The microprocessor is the heart of the computer. | Le microprocesseur est le cœur de l'ordinateur.
permeability | perméabilité | n | C2 | /ˌpɜːmiəˈbɪləti/ | The permeability of the soil is low. | La perméabilité du sol est faible.
propellant | propergol, gaz propulseur | n | C2 | /prəˈpelənt/ | The rocket uses liquid propellant. | La fusée utilise un propergol liquide.
pulley | poulie | n | C1 | /ˈpʊli/ | They lifted the stone with a pulley. | Ils ont soulevé la pierre avec une poulie.
cryptography | cryptographie | n | C2 | /krɪpˈtɒɡrəfi/ | Al-Kindi wrote on cryptography. | Al-Kindi a écrit sur la cryptographie.
octagon | octogone | n | C1 | /ˈɒktəɡən/ | The Dome of the Rock is an octagon. | Le Dôme du Rocher est un octogone.
radioactivity | radioactivité | n | C1 | /ˌreɪdiəʊækˈtɪvəti/ | Marie Curie studied radioactivity. | Marie Curie a étudié la radioactivité.
luminosity | luminosité | n | C2 | /ˌluːmɪˈnɒsəti/ | Adjust the screen's luminosity. | Règle la luminosité de l'écran.
randomness | caractère aléatoire | n | C2 | /ˈrændəmnəs/ | The randomness of the results surprised us. | Le caractère aléatoire des résultats nous a surpris.
biosphere | biosphère | n | C2 | /ˈbaɪəʊsfɪə/ | Pollution threatens the biosphere. | La pollution menace la biosphère.
emulsion | émulsion | n | C2 | /ɪˈmʌlʃn/ | Mayonnaise is an emulsion. | La mayonnaise est une émulsion.
geometrical | géométrique | adj | C1 | /ˌdʒiːəˈmetrɪkl/ | Islamic art uses geometrical patterns. | L'art islamique utilise des motifs géométriques.
superstructure | superstructure | n | C2 | /ˈsuːpəstrʌktʃə/ | The ship's superstructure was damaged. | La superstructure du navire a été endommagée.
microchip | puce électronique | n | B2 | /ˈmaɪkrəʊtʃɪp/ | The cat has a microchip. | Le chat est pucé.
oceanography | océanographie | n | C2 | /ˌəʊʃəˈnɒɡrəfi/ | She studies oceanography. | Elle étudie l'océanographie.
combustible | combustible, inflammable | adj | C2 | /kəmˈbʌstəbl/ | Wood is combustible. | Le bois est combustible.
condenser | condenseur, condensateur | n | C2 | /kənˈdensə/ | The condenser cools the steam. | Le condenseur refroidit la vapeur.
hydraulics | hydraulique | n | C2 | /haɪˈdrɒlɪks/ | The machine works by hydraulics. | La machine fonctionne grâce à l'hydraulique.
outlier | valeur aberrante ; cas à part | n | C2 | /ˈaʊtlaɪə/ | This result is an outlier. | Ce résultat est une valeur aberrante.
parallax | parallaxe | n | C2 | /ˈpærəlæks/ | Astronomers use parallax to measure distance. | Les astronomes utilisent la parallaxe pour mesurer les distances.
torsion | torsion | n | C2 | /ˈtɔːʃn/ | The bar breaks under torsion. | La barre se rompt sous la torsion.
ballistics | balistique | n | C2 | /bəˈlɪstɪks/ | Ballistics experts examined the bullet. | Des experts en balistique ont examiné la balle.
hexagon | hexagone | n | C1 | /ˈheksəɡən/ | France is often called the Hexagon. | La France est souvent appelée l'Hexagone.
neutrino | neutrino | n | C2 | /njuːˈtriːnəʊ/ | Neutrinos pass through matter. | Les neutrinos traversent la matière.
quantification | quantification | n | C2 | /ˌkwɒntɪfɪˈkeɪʃn/ | The quantification of risk is difficult. | La quantification du risque est difficile.
hydrology | hydrologie | n | C2 | /haɪˈdrɒlədʒi/ | She studies hydrology. | Elle étudie l'hydrologie.
insoluble | insoluble | adj | C2 | /ɪnˈsɒljəbl/ | Oil is insoluble in water. | L'huile est insoluble dans l'eau.
neurotransmitter | neurotransmetteur | n | C2 | /ˌnjʊərəʊtrænzˈmɪtə/ | Dopamine is a neurotransmitter. | La dopamine est un neurotransmetteur.
ethnography | ethnographie | n | C2 | /eθˈnɒɡrəfi/ | Ethnography studies cultures from within. | L'ethnographie étudie les cultures de l'intérieur.
interplanetary | interplanétaire | adj | C2 | /ˌɪntəˈplænɪtri/ | It's an interplanetary mission. | C'est une mission interplanétaire.
avionics | avionique | n | C2 | /ˌeɪviˈɒnɪks/ | He's an avionics engineer. | C'est un ingénieur en avionique.
centrifuge | centrifugeuse | n | C2 | /ˈsentrɪfjuːdʒ/ | The samples go into a centrifuge. | Les échantillons passent dans une centrifugeuse.
entomology | entomologie | n | C2 | /ˌentəˈmɒlədʒi/ | Entomology is the study of insects. | L'entomologie est l'étude des insectes.
helical | hélicoïdal | adj | C2 | /ˈhelɪkl/ | DNA has a helical structure. | L'ADN a une structure hélicoïdale.
igneous | igné, volcanique | adj | C2 | /ˈɪɡniəs/ | Granite is an igneous rock. | Le granite est une roche ignée.
cosmological | cosmologique | adj | C2 | /ˌkɒzməˈlɒdʒɪkl/ | The cosmological argument for God. | L'argument cosmologique de l'existence de Dieu.
acetone | acétone | n | C2 | /ˈæsɪtəʊn/ | Acetone removes nail polish. | L'acétone enlève le vernis à ongles.
to calibrate | étalonner, calibrer | v | C2 | /ˈkælɪbreɪt/ | Engineers calibrate the instruments. | Les ingénieurs étalonnent les instruments.
chloroform | chloroforme | n | C2 | /ˈklɒrəfɔːm/ | Chloroform was used as an anaesthetic. | Le chloroforme servait d'anesthésiant.
ferrous | ferreux | adj | C2 | /ˈferəs/ | Iron is a ferrous metal. | Le fer est un métal ferreux.
osmosis | osmose | n | C2 | /ɒzˈməʊsɪs/ | Children learn languages by osmosis. | Les enfants apprennent les langues par osmose.
parabolic | parabolique | adj | C2 | /ˌpærəˈbɒlɪk/ | They installed a parabolic antenna. | Ils ont installé une antenne parabolique.
accretion | accrétion, accumulation | n | C2 | /əˈkriːʃn/ | The accretion of sediment forms new land. | L'accumulation de sédiments forme de nouvelles terres.
cryogenic | cryogénique | adj | C2 | /ˌkraɪəˈdʒenɪk/ | The sample is kept in cryogenic storage. | L'échantillon est conservé par cryogénie.
transgenic | transgénique | adj | C2 | /trænzˈdʒenɪk/ | They grow transgenic crops. | Ils cultivent des plantes transgéniques.
fulcrum | point d'appui, pivot | n | C2 | /ˈfʊlkrəm/ | The family is the fulcrum of society. | La famille est le pivot de la société.
permeable | perméable | adj | C2 | /ˈpɜːmiəbl/ | Sandy soil is permeable. | Le sol sableux est perméable.
spaceflight | vol spatial | n | C2 | /ˈspeɪsflaɪt/ | Human spaceflight is expensive. | Les vols spatiaux habités coûtent cher.
supercomputer | superordinateur | n | C1 | /ˈsuːpəkəmpjuːtə/ | The forecast is run on a supercomputer. | Les prévisions sont calculées sur un superordinateur.
mineralogy | minéralogie | n | C2 | /ˌmɪnəˈrælədʒi/ | Al-Biruni wrote about mineralogy. | Al-Biruni a écrit sur la minéralogie.
`,
);
