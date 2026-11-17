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
`,
);
