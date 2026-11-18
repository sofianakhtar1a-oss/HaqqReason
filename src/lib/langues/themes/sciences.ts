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
`,
);
