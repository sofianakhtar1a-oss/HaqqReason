/* Le Truchement : thème « Les verbes essentiels » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const VERBES = theme(
  "verbes",
  "Les verbes essentiels",
  "Les actions de tous les jours et les verbes qui reviennent partout.",
  "Activity",
  `
to be | être | v | A1 | /biː/ | I want to be a doctor. | Je veux être médecin.
to have | avoir | v | A1 | /hæv/ | We have two children. | Nous avons deux enfants.
to do | faire | v | A1 | /duː/ | What do you do at the weekend? | Que fais-tu le week-end ?
to go | aller | v | A1 | /ɡəʊ/ | I go to school by bus. | Je vais à l'école en bus.
to come | venir | v | A1 | /kʌm/ | Can you come tomorrow? | Peux-tu venir demain ?
to see | voir | v | A1 | /siː/ | I can see the sea from my window. | Je vois la mer de ma fenêtre.
to say | dire | v | A1 | /seɪ/ | What did you say? Please say it again. | Qu'as-tu dit ? Redis-le, s'il te plaît.
to make | faire, fabriquer | v | A1 | /meɪk/ | Let's make a cake. | Faisons un gâteau.
to take | prendre | v | A1 | /teɪk/ | Take an umbrella with you. | Prends un parapluie avec toi.
to give | donner | v | A1 | /ɡɪv/ | Give me your hand. | Donne-moi la main.
to know | savoir, connaître | v | A1 | /nəʊ/ | I know the answer. | Je connais la réponse.
to think | penser | v | A1 | /θɪŋk/ | I think it will rain. | Je pense qu'il va pleuvoir.
to get | obtenir, recevoir | v | A1 | /ɡet/ | Where can I get a ticket? | Où puis-je obtenir un billet ?
to want | vouloir | v | A1 | /wɒnt/ | I want a glass of water. | Je veux un verre d'eau.
to use | utiliser | v | A1 | /juːz/ | Can I use your phone? | Je peux utiliser ton téléphone ?
to tell | dire, raconter | v | A1 | /tel/ | Tell me a story. | Raconte-moi une histoire.
to ask | demander | v | A1 | /ɑːsk/ | Ask the teacher if you don't understand. | Demande au professeur si tu ne comprends pas.
to need | avoir besoin de | v | A1 | /niːd/ | I need some help. | J'ai besoin d'aide.
to try | essayer | v | A1 | /traɪ/ | Try again, you can do it! | Essaie encore, tu peux y arriver !
to put | mettre | v | A1 | /pʊt/ | Put the milk in the fridge. | Mets le lait au frigo.
to keep | garder | v | A1 | /kiːp/ | Keep the change. | Gardez la monnaie.
to let | laisser | v | A1 | /let/ | Let me help you. | Laisse-moi t'aider.
to begin | commencer | v | A1 | /bɪˈɡɪn/ | The lesson will begin at nine. | Le cours va commencer à neuf heures.
to start | commencer, démarrer | v | A1 | /stɑːt/ | Let's start the meeting. | Commençons la réunion.
to help | aider | v | A1 | /help/ | Can you help me, please? | Peux-tu m'aider, s'il te plaît ?
to talk | parler, discuter | v | A1 | /tɔːk/ | We need to talk. | Il faut qu'on parle.
to turn | tourner | v | A1 | /tɜːn/ | Turn left at the lights. | Tourne à gauche au feu.
to show | montrer | v | A1 | /ʃəʊ/ | Show me your photos. | Montre-moi tes photos.
to hear | entendre | v | A1 | /hɪər/ | Can you hear me? | Tu m'entends ?
to run | courir | v | A1 | /rʌn/ | I run in the park every morning. | Je cours au parc tous les matins.
to move | bouger ; déménager | v | A1 | /muːv/ | Don't move! | Ne bouge pas !
to believe | croire | v | A2 | /bɪˈliːv/ | I believe you. | Je te crois.
to hold | tenir | v | A2 | /həʊld/ | Hold my hand when we cross. | Tiens-moi la main quand on traverse.
to bring | apporter | v | A1 | /brɪŋ/ | Bring your passport tomorrow. | Apporte ton passeport demain.
to happen | arriver, se passer | v | A2 | /ˈhæpən/ | What will happen next? | Que va-t-il se passer ensuite ?
to meet | rencontrer, retrouver | v | A1 | /miːt/ | Let's meet at the café. | Retrouvons-nous au café.
to continue | continuer | v | A2 | /kənˈtɪnjuː/ | Please continue reading. | Continue à lire, s'il te plaît.
to set | poser, régler | v | B1 | /set/ | Set the table for dinner. | Mets la table pour le dîner.
to follow | suivre | v | A2 | /ˈfɒləʊ/ | Follow me, please. | Suivez-moi, s'il vous plaît.
to stop | arrêter, s'arrêter | v | A1 | /stɒp/ | Stop the car here. | Arrête la voiture ici.
to create | créer | v | A2 | /kriˈeɪt/ | She wants to create her own business. | Elle veut créer sa propre entreprise.
to offer | offrir, proposer | v | A2 | /ˈɒfər/ | Can I offer you some tea? | Je peux vous offrir du thé ?
to consider | envisager, considérer | v | B1 | /kənˈsɪdər/ | We will consider your request. | Nous allons étudier votre demande.
to appear | apparaître, sembler | v | B1 | /əˈpɪər/ | Stars appear at night. | Les étoiles apparaissent la nuit.
to wait | attendre | v | A1 | /weɪt/ | Please wait here. | Attendez ici, s'il vous plaît.
to die | mourir | v | A2 | /daɪ/ | Plants die without water. | Les plantes meurent sans eau.
to send | envoyer | v | A1 | /send/ | Send me a message. | Envoie-moi un message.
to expect | s'attendre à, attendre | v | B1 | /ɪkˈspekt/ | I expect a reply tomorrow. | J'attends une réponse demain.
to stay | rester | v | A1 | /steɪ/ | Stay with me. | Reste avec moi.
to fall | tomber | v | A2 | /fɔːl/ | Be careful, don't fall! | Attention, ne tombe pas !
to reach | atteindre | v | B1 | /riːtʃ/ | We will reach the summit by noon. | Nous atteindrons le sommet à midi.
to kill | tuer | v | B1 | /kɪl/ | Smoking can kill. | Fumer peut tuer.
to remain | rester, demeurer | v | B1 | /rɪˈmeɪn/ | Please remain seated. | Veuillez rester assis.
to suggest | suggérer | v | B1 | /səˈdʒest/ | I suggest we leave early. | Je suggère que nous partions tôt.
to require | exiger, nécessiter | v | B2 | /rɪˈkwaɪər/ | This job will require patience. | Ce travail exigera de la patience.
to decide | décider | v | A2 | /dɪˈsaɪd/ | You must decide now. | Tu dois décider maintenant.
to pull | tirer | v | A2 | /pʊl/ | Pull the door to open it. | Tire la porte pour l'ouvrir.
to push | pousser | v | A2 | /pʊʃ/ | Push the button. | Appuie sur le bouton.
to develop | développer | v | B1 | /dɪˈveləp/ | Reading helps develop the mind. | La lecture aide à développer l'esprit.
to carry | porter, transporter | v | A2 | /ˈkæri/ | Can you carry this bag? | Peux-tu porter ce sac ?
to receive | recevoir | v | A2 | /rɪˈsiːv/ | Did you receive my email? | As-tu reçu mon e-mail ?
to agree | être d'accord | v | A2 | /əˈɡriː/ | I agree with you. | Je suis d'accord avec toi.
to produce | produire | v | B1 | /prəˈdjuːs/ | Bees produce honey. | Les abeilles produisent du miel.
to choose | choisir | v | A1 | /tʃuːz/ | Choose a colour. | Choisis une couleur.
to close | fermer | v | A1 | /kləʊz/ | Close the window, please. | Ferme la fenêtre, s'il te plaît.
to finish | finir | v | A1 | /ˈfɪnɪʃ/ | Finish your homework first. | Finis d'abord tes devoirs.
to sleep | dormir | v | A1 | /sliːp/ | Babies sleep a lot. | Les bébés dorment beaucoup.
to jump | sauter | v | A1 | /dʒʌmp/ | The children jump in the puddles. | Les enfants sautent dans les flaques.
to dance | danser | v | A1 | /dɑːns/ | They dance at weddings. | Ils dansent aux mariages.
to accept | accepter | v | A2 | /əkˈsept/ | Please accept my apologies. | Veuillez accepter mes excuses.
to achieve | atteindre, réaliser | v | B1 | /əˈtʃiːv/ | You can achieve your goals. | Tu peux atteindre tes objectifs.
to admire | admirer | v | B1 | /ədˈmaɪər/ | I admire your courage. | J'admire ton courage.
to admit | admettre, avouer | v | B1 | /ədˈmɪt/ | I admit I was wrong. | J'admets que j'avais tort.
to advise | conseiller | v | B1 | /ədˈvaɪz/ | I advise you to rest. | Je te conseille de te reposer.
to aim | viser | v | B2 | /eɪm/ | We aim to finish by June. | Nous visons de finir en juin.
to arrange | organiser, arranger | v | B1 | /əˈreɪndʒ/ | Let's arrange a meeting. | Organisons une réunion.
to attach | joindre, attacher | v | B1 | /əˈtætʃ/ | Attach the file to your email. | Joins le fichier à ton e-mail.
to attack | attaquer | v | B1 | /əˈtæk/ | The dog may attack strangers. | Le chien peut attaquer les inconnus.
to attract | attirer | v | B1 | /əˈtrækt/ | Flowers attract bees. | Les fleurs attirent les abeilles.
to avoid | éviter | v | B1 | /əˈvɔɪd/ | Avoid sugary drinks. | Évite les boissons sucrées.
to beg | supplier, mendier | v | B2 | /beɡ/ | I beg you, don't go! | Je t'en supplie, ne pars pas !
to bet | parier | v | B1 | /bet/ | I bet you can't do it. | Je parie que tu n'y arriveras pas.
to bless | bénir | v | B2 | /bles/ | May God bless you. | Que Dieu te bénisse.
to boast | se vanter | v | C1 | /bəʊst/ | Don't boast about your success. | Ne te vante pas de ton succès.
to bother | déranger | v | B1 | /ˈbɒðər/ | Sorry to bother you. | Désolé de vous déranger.
to bounce | rebondir | v | B2 | /baʊns/ | The ball will bounce off the wall. | Le ballon va rebondir sur le mur.
to bow | s'incliner | v | B2 | /baʊ/ | The actors bow at the end. | Les acteurs saluent à la fin.
to bury | enterrer | v | B2 | /ˈberi/ | The dog likes to bury bones. | Le chien aime enterrer des os.
to capture | capturer | v | B2 | /ˈkæptʃər/ | The photo captures the moment; try to capture the light. | La photo capture l'instant ; essaie de capter la lumière.
to celebrate | fêter, célébrer | v | A2 | /ˈselɪbreɪt/ | We celebrate Eid with the family. | Nous fêtons l'Aïd en famille.
to chase | poursuivre | v | B1 | /tʃeɪs/ | The cat likes to chase mice. | Le chat aime poursuivre les souris.
to combine | combiner | v | B1 | /kəmˈbaɪn/ | Combine the flour and the eggs. | Mélange la farine et les œufs.
to compare | comparer | v | A2 | /kəmˈpeər/ | Compare the two answers. | Compare les deux réponses.
to compliment | complimenter | v | B2 | /ˈkɒmplɪment/ | He likes to compliment her cooking. | Il aime complimenter sa cuisine.
to confirm | confirmer | v | B1 | /kənˈfɜːm/ | Please confirm your booking. | Veuillez confirmer votre réservation.
to confuse | embrouiller, confondre | v | B1 | /kənˈfjuːz/ | Don't confuse the two words. | Ne confonds pas les deux mots.
to congratulate | féliciter | v | B1 | /kənˈɡrætʃuleɪt/ | We congratulate you on your wedding. | Nous vous félicitons pour votre mariage.
to connect | relier, connecter | v | B1 | /kəˈnekt/ | Connect the printer to the laptop. | Branche l'imprimante à l'ordinateur.
to consist of | se composer de | v | B2 | /kənˈsɪst əv/ | The team will consist of five people. | L'équipe se composera de cinq personnes.
to construct | construire | v | B2 | /kənˈstrʌkt/ | They plan to construct a bridge. | Ils prévoient de construire un pont.
to consult | consulter | v | B2 | /kənˈsʌlt/ | Consult a doctor if the pain continues. | Consulte un médecin si la douleur persiste.
to contain | contenir | v | B1 | /kənˈteɪn/ | Does this contain nuts? | Est-ce que cela contient des noix ?
to contribute | contribuer | v | B2 | /kənˈtrɪbjuːt/ | Everyone can contribute to the project. | Chacun peut contribuer au projet.
to convince | convaincre | v | B1 | /kənˈvɪns/ | Try to convince your father. | Essaie de convaincre ton père.
to copy | copier | v | A2 | /ˈkɒpi/ | Don't copy your neighbour's answers. | Ne copie pas les réponses de ton voisin.
to crack | fêler, casser | v | B2 | /kræk/ | Crack two eggs into the bowl. | Casse deux œufs dans le bol.
to criticise | critiquer | v | B2 | /ˈkrɪtɪsaɪz/ | It's easy to criticise others. | C'est facile de critiquer les autres.
to damage | endommager | v | B1 | /ˈdæmɪdʒ/ | The storm may damage the roof. | La tempête pourrait endommager le toit.
to dare | oser | v | B1 | /deər/ | I didn't dare ask. Don't you dare! | Je n'ai pas osé demander. N'ose même pas !
to declare | déclarer | v | B2 | /dɪˈkleər/ | Declare your goods at customs. | Déclare tes marchandises à la douane.
to decrease | diminuer | v | B1 | /dɪˈkriːs/ | Prices should decrease next year. | Les prix devraient diminuer l'an prochain.
to deserve | mériter | v | B1 | /dɪˈzɜːv/ | You deserve a rest. | Tu mérites du repos.
to desire | désirer | v | B2 | /dɪˈzaɪər/ | We desire peace above all. | Nous désirons la paix avant tout.
to destroy | détruire | v | B1 | /dɪˈstrɔɪ/ | Fire can destroy a forest in hours. | Le feu peut détruire une forêt en quelques heures.
to determine | déterminer | v | B2 | /dɪˈtɜːmɪn/ | Tests will determine the cause. | Des analyses détermineront la cause.
to disagree | ne pas être d'accord | v | A2 | /ˌdɪsəˈɡriː/ | I disagree with you. | Je ne suis pas d'accord avec toi.
to disappear | disparaître | v | A2 | /ˌdɪsəˈpɪər/ | The sun will disappear behind the hills. | Le soleil va disparaître derrière les collines.
to discuss | discuter de | v | A2 | /dɪˈskʌs/ | Let's discuss the plan. | Discutons du plan.
to distract | distraire | v | B2 | /dɪˈstrækt/ | Don't distract the driver. | Ne distrais pas le conducteur.
to disturb | déranger | v | B1 | /dɪˈstɜːb/ | Please do not disturb. | Prière de ne pas déranger.
to drag | traîner | v | B2 | /dræɡ/ | Don't drag your feet. | Ne traîne pas les pieds.
to drop | laisser tomber | v | A2 | /drɒp/ | Don't drop the plates! | Ne laisse pas tomber les assiettes !
to educate | éduquer | v | B2 | /ˈedʒukeɪt/ | Parents educate their children. | Les parents éduquent leurs enfants.
to embrace | étreindre ; adopter | v | C1 | /ɪmˈbreɪs/ | They embrace new ideas. | Ils adoptent les idées nouvelles.
to employ | employer | v | B1 | /ɪmˈplɔɪ/ | The factory will employ fifty people. | L'usine emploiera cinquante personnes.
to encourage | encourager | v | B1 | /ɪnˈkʌrɪdʒ/ | Teachers encourage their students. | Les enseignants encouragent leurs élèves.
to end | finir, se terminer | v | A2 | /end/ | The film will end at ten. | Le film finira à vingt-deux heures.
to enter | entrer | v | A2 | /ˈentər/ | Please enter quietly. | Entrez en silence, s'il vous plaît.
to escape | s'échapper | v | B1 | /ɪˈskeɪp/ | The bird tried to escape. | L'oiseau a essayé de s'échapper.
to establish | établir, fonder | v | B2 | /ɪˈstæblɪʃ/ | They want to establish a school. | Ils veulent fonder une école.
to estimate | estimer | v | B2 | /ˈestɪmeɪt/ | Can you estimate the cost? | Peux-tu estimer le coût ?
to examine | examiner | v | B1 | /ɪɡˈzæmɪn/ | The doctor will examine you now. | Le médecin va vous examiner maintenant.
to excuse | excuser | v | A2 | /ɪkˈskjuːz/ | Excuse me, where is the station? | Excusez-moi, où est la gare ?
to express | exprimer | v | B1 | /ɪkˈspres/ | It's hard to express my feelings. | C'est difficile d'exprimer mes sentiments.
to fill | remplir | v | A2 | /fɪl/ | Fill the glass with water. | Remplis le verre d'eau.
to float | flotter | v | B1 | /fləʊt/ | Wood will float on water. | Le bois flotte sur l'eau.
to flow | couler | v | B1 | /fləʊ/ | Rivers flow to the sea. | Les rivières coulent vers la mer.
to gain | gagner, prendre | v | B1 | /ɡeɪn/ | You gain experience with time. | On gagne de l'expérience avec le temps.
to glow | luire, rayonner | v | B2 | /ɡləʊ/ | The lanterns glow in the dark. | Les lanternes luisent dans le noir.
to guess | deviner | v | A2 | /ɡes/ | Guess who called me! | Devine qui m'a appelé !
to hang | accrocher, pendre | v | A2 | /hæŋ/ | Hang your coat here. | Accroche ton manteau ici.
to hate | détester | v | A1 | /heɪt/ | I hate waiting. | Je déteste attendre.
to hesitate | hésiter | v | B1 | /ˈhezɪteɪt/ | Don't hesitate to call me. | N'hésite pas à m'appeler.
to hide | cacher, se cacher | v | A2 | /haɪd/ | Hide the presents in the cupboard. | Cache les cadeaux dans le placard.
to identify | identifier | v | B1 | /aɪˈdentɪfaɪ/ | Can you identify this bird? | Peux-tu identifier cet oiseau ?
to imply | sous-entendre | v | C1 | /ɪmˈplaɪ/ | What do you imply by that? | Qu'est-ce que tu sous-entends par là ?
to impress | impressionner | v | B1 | /ɪmˈpres/ | He wants to impress his boss. | Il veut impressionner son patron.
to include | inclure | v | B1 | /ɪnˈkluːd/ | The price will include breakfast. | Le prix inclura le petit déjeuner.
to increase | augmenter | v | B1 | /ɪnˈkriːs/ | Sales increase every year. | Les ventes augmentent chaque année.
to indicate | indiquer | v | B2 | /ˈɪndɪkeɪt/ | Arrows indicate the exit. | Des flèches indiquent la sortie.
to inform | informer | v | B1 | /ɪnˈfɔːm/ | Please inform us of any change. | Merci de nous informer de tout changement.
to insist | insister | v | B1 | /ɪnˈsɪst/ | I insist on paying. | J'insiste pour payer.
to intend | avoir l'intention de | v | B2 | /ɪnˈtend/ | I intend to study medicine. | J'ai l'intention d'étudier la médecine.
to invite | inviter | v | A1 | /ɪnˈvaɪt/ | I want to invite you to dinner. | Je veux t'inviter à dîner.
to involve | impliquer | v | B2 | /ɪnˈvɒlv/ | The job will involve some travel. | Le poste impliquera quelques déplacements.
to knock | frapper (à la porte) | v | A2 | /nɒk/ | Knock before you come in. | Frappe avant d'entrer.
to leap | bondir | v | C1 | /liːp/ | Salmon leap up the waterfall. | Les saumons bondissent pour remonter la cascade.
to link | relier | v | B1 | /lɪŋk/ | A bridge will link the two towns. | Un pont reliera les deux villes.
to list | énumérer, lister | v | B1 | /lɪst/ | List the things you need. | Fais la liste de ce dont tu as besoin.
to maintain | entretenir, maintenir | v | B2 | /meɪnˈteɪn/ | It's expensive to maintain an old house. | Entretenir une vieille maison coûte cher.
to manage | gérer, réussir à | v | B1 | /ˈmænɪdʒ/ | She can manage a big team. | Elle sait gérer une grande équipe.
to matter | importer, compter | v | B1 | /ˈmætər/ | It doesn't matter. | Ça n'a pas d'importance.
to mention | mentionner | v | B1 | /ˈmenʃn/ | Don't mention it to anyone. | N'en parle à personne.
to mind | voir un inconvénient | v | B1 | /maɪnd/ | Do you mind if I open the window? | Ça te dérange si j'ouvre la fenêtre ?
to notice | remarquer | v | B1 | /ˈnəʊtɪs/ | Did you notice his new car? | As-tu remarqué sa nouvelle voiture ?
to obtain | obtenir | v | B2 | /əbˈteɪn/ | You must obtain a visa. | Vous devez obtenir un visa.
to occur | se produire | v | B2 | /əˈkɜːr/ | Accidents often occur at night. | Les accidents se produisent souvent la nuit.
to oppose | s'opposer à | v | B2 | /əˈpəʊz/ | Many people oppose the new law. | Beaucoup de gens s'opposent à la nouvelle loi.
to own | posséder | v | B1 | /əʊn/ | They own a small farm. | Ils possèdent une petite ferme.
to participate | participer | v | B1 | /pɑːˈtɪsɪpeɪt/ | Everyone can participate in the debate. | Tout le monde peut participer au débat.
to persuade | persuader | v | B1 | /pəˈsweɪd/ | Try to persuade him to come. | Essaie de le persuader de venir.
to pick | choisir, cueillir | v | A2 | /pɪk/ | Pick a card, any card. | Choisis une carte, n'importe laquelle.
to place | placer | v | B1 | /pleɪs/ | Place the vase on the table. | Place le vase sur la table.
to possess | posséder | v | B2 | /pəˈzes/ | He doesn't possess a car. | Il ne possède pas de voiture.
to predict | prédire | v | B1 | /prɪˈdɪkt/ | Nobody can predict the future. | Personne ne peut prédire l'avenir.
to prepare | préparer | v | A2 | /prɪˈpeər/ | Prepare your bag the night before. | Prépare ton sac la veille.
to present | présenter | v | B1 | /prɪˈzent/ | She will present her project tomorrow. | Elle présentera son projet demain.
to pretend | faire semblant | v | B1 | /prɪˈtend/ | Don't pretend you didn't see me. | Ne fais pas semblant de ne pas m'avoir vu.
to print | imprimer | v | A2 | /prɪnt/ | Print the tickets before you go. | Imprime les billets avant de partir.
to promise | promettre | v | A2 | /ˈprɒmɪs/ | I promise to call you. | Je promets de t'appeler.
to provide | fournir | v | B1 | /prəˈvaɪd/ | The school will provide books. | L'école fournira les livres.
to react | réagir | v | B1 | /riˈækt/ | How did he react? I hope he didn't react badly. | Comment a-t-il réagi ? J'espère qu'il n'a pas mal réagi.
to realise | se rendre compte | v | B1 | /ˈriːəlaɪz/ | I didn't realise it was so late. | Je ne me suis pas rendu compte qu'il était si tard.
to recognise | reconnaître | v | B1 | /ˈrekəɡnaɪz/ | I didn't recognise you! | Je ne t'ai pas reconnu !
to recommend | recommander | v | B1 | /ˌrekəˈmend/ | Can you recommend a good book? | Peux-tu recommander un bon livre ?
to refer to | faire référence à | v | B2 | /rɪˈfɜː tuː/ | The article will refer to old sources. | L'article fera référence à d'anciennes sources.
to refuse | refuser | v | B1 | /rɪˈfjuːz/ | I refuse to give up. | Je refuse d'abandonner.
to reject | rejeter | v | B2 | /rɪˈdʒekt/ | They may reject your application. | Ils pourraient rejeter ta candidature.
to rely on | compter sur | v | B2 | /rɪˈlaɪ ɒn/ | You can rely on me. | Tu peux compter sur moi.
to remove | enlever | v | B1 | /rɪˈmuːv/ | Remove your shoes, please. | Enlève tes chaussures, s'il te plaît.
to replace | remplacer | v | B1 | /rɪˈpleɪs/ | We need to replace the battery. | Il faut remplacer la batterie.
to represent | représenter | v | B2 | /ˌreprɪˈzent/ | She will represent our school. | Elle représentera notre école.
to respond | répondre, réagir | v | B2 | /rɪˈspɒnd/ | Please respond within a week. | Merci de répondre sous une semaine.
to reveal | révéler | v | B2 | /rɪˈviːl/ | Don't reveal the secret. | Ne révèle pas le secret.
to rob | voler, cambrioler | v | B1 | /rɒb/ | Thieves tried to rob the bank. | Des voleurs ont essayé de braquer la banque.
to ruin | ruiner, gâcher | v | B1 | /ˈruːɪn/ | The rain will ruin our picnic. | La pluie va gâcher notre pique-nique.
to satisfy | satisfaire | v | B2 | /ˈsætɪsfaɪ/ | It's hard to satisfy everyone. | Il est difficile de satisfaire tout le monde.
to scream | hurler | v | B1 | /skriːm/ | Don't scream, the baby is asleep. | Ne hurle pas, le bébé dort.
to search | chercher, fouiller | v | A2 | /sɜːtʃ/ | Search the house for my keys. | Fouille la maison pour trouver mes clés.
to seem | sembler | v | A2 | /siːm/ | You seem tired. | Tu sembles fatigué.
to select | sélectionner | v | B1 | /sɪˈlekt/ | Select your language. | Sélectionnez votre langue.
to shake | secouer | v | B1 | /ʃeɪk/ | Shake the bottle before use. | Secoue la bouteille avant usage.
to slip | glisser | v | B1 | /slɪp/ | Be careful not to slip on the ice. | Fais attention à ne pas glisser sur la glace.
to solve | résoudre | v | B1 | /sɒlv/ | Can you solve this problem? | Peux-tu résoudre ce problème ?
to spin | tourner, filer | v | B2 | /spɪn/ | The wheels spin fast. | Les roues tournent vite.
to split | diviser, partager | v | B2 | /splɪt/ | Let's split the bill. | Partageons l'addition.
to stick | coller | v | B1 | /stɪk/ | Stick the stamp on the envelope. | Colle le timbre sur l'enveloppe.
to succeed | réussir | v | B1 | /səkˈsiːd/ | If you work hard, you will succeed. | Si tu travailles dur, tu réussiras.
to suffer | souffrir | v | B1 | /ˈsʌfər/ | Many people suffer from back pain. | Beaucoup de gens souffrent du dos.
to suppose | supposer | v | B1 | /səˈpəʊz/ | I suppose you're right. | Je suppose que tu as raison.
to surround | entourer | v | B2 | /səˈraʊnd/ | Trees surround the house. | Des arbres entourent la maison.
to survive | survivre | v | B1 | /səˈvaɪv/ | Camels can survive without water for days. | Les chameaux peuvent survivre des jours sans eau.
to swear | jurer | v | B2 | /sweər/ | I swear I didn't take it. | Je jure que je ne l'ai pas pris.
to tend to | avoir tendance à | v | B2 | /tend tuː/ | I tend to wake up early. | J'ai tendance à me réveiller tôt.
to thank | remercier | v | A1 | /θæŋk/ | I want to thank you for your help. | Je veux te remercier pour ton aide.
to transform | transformer | v | B2 | /trænsˈfɔːm/ | Education can transform lives. | L'éducation peut transformer des vies.
to treat | traiter, soigner | v | B1 | /triːt/ | Treat others as you want to be treated. | Traite les autres comme tu veux être traité.
to unite | unir | v | B2 | /juˈnaɪt/ | Sport can unite people. | Le sport peut unir les gens.
to urge | exhorter, presser | v | C1 | /ɜːdʒ/ | I urge you to read this book. | Je t'exhorte à lire ce livre.
to vanish | disparaître | v | B2 | /ˈvænɪʃ/ | The magician made the coin vanish. | Le magicien a fait disparaître la pièce.
to weigh | peser | v | B1 | /weɪ/ | Weigh the flour first. | Pèse d'abord la farine.
to wish | souhaiter | v | A2 | /wɪʃ/ | I wish you a happy Eid. | Je te souhaite un joyeux Aïd.
to wonder | se demander | v | B1 | /ˈwʌndər/ | I wonder where he is. | Je me demande où il est.
to yell | crier, hurler | v | B2 | /jel/ | Don't yell at the children. | Ne crie pas sur les enfants.
to become | devenir | v | A2 | /bɪˈkʌm/ | I want to become a pilot. | Je veux devenir pilote.
to check | vérifier | v | A2 | /tʃek/ | Check your answers. | Vérifie tes réponses.
to fix | réparer | v | A2 | /fɪks/ | Can you fix my bike? | Peux-tu réparer mon vélo ?
to throw out | jeter | v | B1 | /θrəʊ aʊt/ | Throw out the old newspapers. | Jette les vieux journaux.
to save time | gagner du temps | expr | B1 | /ˌseɪv ˈtaɪm/ | Take the motorway to save time. | Prends l'autoroute pour gagner du temps.
to waste time | perdre du temps | expr | B1 | /ˌweɪst ˈtaɪm/ | Don't waste time on your phone. | Ne perds pas de temps sur ton téléphone.
to make a mistake | faire une erreur | expr | A2 | /ˌmeɪk ə mɪˈsteɪk/ | Everyone can make a mistake. | Tout le monde peut faire une erreur.
to make a decision | prendre une décision | expr | B1 | /ˌmeɪk ə dɪˈsɪʒn/ | You need to make a decision today. | Tu dois prendre une décision aujourd'hui.
to pay a visit | rendre visite | expr | B1 | /ˌpeɪ ə ˈvɪzɪt/ | Let's pay a visit to our aunt. | Rendons visite à notre tante.
to keep a promise | tenir une promesse | expr | B1 | /ˌkiːp ə ˈprɒmɪs/ | A believer must keep a promise. | Un croyant doit tenir sa promesse.
to break a promise | rompre une promesse | expr | B1 | /ˌbreɪk ə ˈprɒmɪs/ | Never break a promise. | Ne romps jamais une promesse.
to tell the truth | dire la vérité | expr | A2 | /ˌtel ðə ˈtruːθ/ | Always tell the truth. | Dis toujours la vérité.
to tell a lie | mentir | expr | A2 | /ˌtel ə ˈlaɪ/ | Don't tell a lie, even a small one. | Ne mens pas, même un petit peu.
to accompany | accompagner | v | B2 | /əˈkʌmpəni/ | I'll accompany you to the station. | Je vais t'accompagner à la gare.
to acknowledge | reconnaître, admettre | v | C1 | /əkˈnɒlɪdʒ/ | He refused to acknowledge his mistake. | Il a refusé de reconnaître son erreur.
to acquire | acquérir | v | C1 | /əˈkwaɪər/ | Children acquire language quickly. | Les enfants acquièrent vite le langage.
to adapt | s'adapter | v | B2 | /əˈdæpt/ | Animals adapt to their environment. | Les animaux s'adaptent à leur environnement.
to anticipate | anticiper | v | C1 | /ænˈtɪsɪpeɪt/ | We didn't anticipate the delay. | Nous n'avions pas anticipé le retard.
to appreciate | apprécier | v | B1 | /əˈpriːʃieɪt/ | I appreciate your help. | J'apprécie ton aide.
to approach | approcher, aborder | v | B2 | /əˈprəʊtʃ/ | Approach the problem calmly. | Aborde le problème calmement.
to approve | approuver | v | B2 | /əˈpruːv/ | My parents approve of my choice. | Mes parents approuvent mon choix.
to assess | évaluer | v | C1 | /əˈses/ | Teachers assess each student's work. | Les enseignants évaluent le travail de chaque élève.
to assist | assister, aider | v | B2 | /əˈsɪst/ | Nurses assist the surgeon. | Les infirmières assistent le chirurgien.
to assure | assurer, garantir | v | B2 | /əˈʃʊər/ | I assure you it's true. | Je t'assure que c'est vrai.
to attempt | tenter | v | B2 | /əˈtempt/ | Don't attempt to climb alone. | Ne tente pas de grimper seul.
to blame | blâmer, reprocher | v | B1 | /bleɪm/ | Don't blame yourself. | Ne t'en veux pas.
to cancel out | annuler, compenser | v | C1 | /ˈkænsl aʊt/ | The two effects cancel out. | Les deux effets s'annulent.
to cease | cesser | v | C1 | /siːs/ | The noise will cease at midnight. | Le bruit cessera à minuit.
to challenge | défier, remettre en question | v | B2 | /ˈtʃælɪndʒ/ | I challenge you to a game. | Je te défie à une partie.
to claim back | réclamer | v | B2 | /ˌkleɪm ˈbæk/ | You can claim back the tax. | Tu peux réclamer le remboursement de la taxe.
to commit to | s'engager à | v | B2 | /kəˈmɪt tuː/ | Commit to one goal at a time. | Engage-toi sur un objectif à la fois.
to compete with | rivaliser avec | v | B2 | /kəmˈpiːt wɪð/ | Small shops can't compete with big chains. | Les petits commerces ne peuvent pas rivaliser avec les grandes chaînes.
to conclude | conclure | v | B2 | /kənˈkluːd/ | Let me conclude with a story. | Permettez-moi de conclure par une histoire.
to confront | affronter | v | C1 | /kənˈfrʌnt/ | We must confront our fears. | Nous devons affronter nos peurs.
to cope | faire face, s'en sortir | v | B2 | /kəʊp/ | How do you cope with stress? | Comment fais-tu face au stress ?
to dedicate | consacrer, dédier | v | B2 | /ˈdedɪkeɪt/ | She will dedicate her life to science. | Elle consacrera sa vie à la science.
to demonstrate | démontrer | v | B2 | /ˈdemənstreɪt/ | The study will demonstrate the effect. | L'étude démontrera l'effet.
to depend | dépendre | v | B1 | /dɪˈpend/ | It depends on the weather. | Ça dépend du temps.
to deprive | priver | v | C1 | /dɪˈpraɪv/ | Don't deprive yourself of sleep. | Ne te prive pas de sommeil.
to derive | dériver, tirer | v | C1 | /dɪˈraɪv/ | Many English words derive from Latin. | Beaucoup de mots anglais dérivent du latin.
to detect | détecter | v | B2 | /dɪˈtekt/ | The test can detect the virus. | Le test peut détecter le virus.
to differ | différer | v | B2 | /ˈdɪfər/ | Our opinions differ. | Nos opinions diffèrent.
to disappoint | décevoir | v | B1 | /ˌdɪsəˈpɔɪnt/ | I don't want to disappoint you. | Je ne veux pas te décevoir.
to distinguish | distinguer | v | C1 | /dɪˈstɪŋɡwɪʃ/ | Can you distinguish the twins? | Arrives-tu à distinguer les jumeaux ?
to distribute | distribuer | v | B2 | /dɪˈstrɪbjuːt/ | Volunteers distribute food. | Des bénévoles distribuent de la nourriture.
to dominate | dominer | v | C1 | /ˈdɒmɪneɪt/ | Big firms dominate the market. | Les grandes entreprises dominent le marché.
to emerge | émerger, apparaître | v | C1 | /ɪˈmɜːdʒ/ | New problems may emerge. | De nouveaux problèmes pourraient apparaître.
to enable | permettre | v | C1 | /ɪˈneɪbl/ | The app will enable you to learn faster. | L'application te permettra d'apprendre plus vite.
to ensure | s'assurer, garantir | v | B2 | /ɪnˈʃʊər/ | Ensure the door is locked. | Assure-toi que la porte est fermée à clé.
to evaluate | évaluer | v | C1 | /ɪˈvæljueɪt/ | We will evaluate the results. | Nous évaluerons les résultats.
to exaggerate | exagérer | v | B2 | /ɪɡˈzædʒəreɪt/ | Don't exaggerate! | N'exagère pas !
to exclude | exclure | v | B2 | /ɪkˈskluːd/ | Don't exclude anyone. | N'exclus personne.
to exploit | exploiter | v | C1 | /ɪkˈsplɔɪt/ | Companies must not exploit workers. | Les entreprises ne doivent pas exploiter les travailleurs.
to facilitate | faciliter | v | C1 | /fəˈsɪlɪteɪt/ | Technology can facilitate learning. | La technologie peut faciliter l'apprentissage.
to focus | se concentrer | v | B1 | /ˈfəʊkəs/ | Focus on your studies. | Concentre-toi sur tes études.
to frighten | effrayer | v | B1 | /ˈfraɪtn/ | Loud noises frighten the baby. | Les bruits forts effraient le bébé.
to fulfil | accomplir, remplir | v | C1 | /fʊlˈfɪl/ | Fulfil your promises. | Tiens tes promesses.
to grab | saisir, attraper | v | B2 | /ɡræb/ | Grab a chair and sit down. | Prends une chaise et assieds-toi.
to highlight | souligner, surligner | v | B2 | /ˈhaɪlaɪt/ | Highlight the key words. | Surligne les mots clés.
to imitate | imiter | v | B2 | /ˈɪmɪteɪt/ | Children imitate their parents. | Les enfants imitent leurs parents.
to implement | mettre en œuvre | v | C1 | /ˈɪmplɪment/ | The plan is hard to implement. | Le plan est difficile à mettre en œuvre.
to interpret | interpréter | v | B2 | /ɪnˈtɜːprɪt/ | How do you interpret this verse? | Comment interprètes-tu ce verset ?
to justify | justifier | v | B2 | /ˈdʒʌstɪfaɪ/ | Nothing can justify violence. | Rien ne peut justifier la violence.
to lack | manquer de | v | B2 | /læk/ | They lack experience. | Ils manquent d'expérience.
to locate | localiser | v | B2 | /ləʊˈkeɪt/ | Can you locate the town on the map? | Peux-tu situer la ville sur la carte ?
to modify | modifier | v | B2 | /ˈmɒdɪfaɪ/ | You can modify your order. | Tu peux modifier ta commande.
to monitor | surveiller | v | C1 | /ˈmɒnɪtər/ | Doctors monitor his heart. | Les médecins surveillent son cœur.
to motivate | motiver | v | B2 | /ˈməʊtɪveɪt/ | Good teachers motivate their students. | Les bons enseignants motivent leurs élèves.
to neglect | négliger | v | C1 | /nɪˈɡlekt/ | Don't neglect your health. | Ne néglige pas ta santé.
to overcome | surmonter | v | B2 | /ˌəʊvəˈkʌm/ | She will overcome her fear. | Elle surmontera sa peur.
to overlook | négliger ; donner sur | v | C1 | /ˌəʊvəˈlʊk/ | Our room will overlook the sea. | Notre chambre donnera sur la mer.
to perceive | percevoir | v | C1 | /pəˈsiːv/ | How do others perceive you? | Comment les autres te perçoivent-ils ?
to persist | persister | v | C1 | /pəˈsɪst/ | If the pain persists, see a doctor. | Si la douleur persiste, consulte un médecin.
to pursue | poursuivre | v | C1 | /pəˈsjuː/ | Pursue your dreams. | Poursuis tes rêves.
to recall | se rappeler | v | B2 | /rɪˈkɔːl/ | I can't recall his name. | Je n'arrive pas à me rappeler son nom.
to regard | considérer | v | C1 | /rɪˈɡɑːd/ | I regard him as a brother. | Je le considère comme un frère.
to resist | résister | v | B2 | /rɪˈzɪst/ | I can't resist chocolate. | Je ne résiste pas au chocolat.
to resolve | résoudre | v | B2 | /rɪˈzɒlv/ | Let's resolve this peacefully. | Résolvons cela pacifiquement.
to restrict | restreindre | v | C1 | /rɪˈstrɪkt/ | The law will restrict smoking. | La loi va restreindre le tabac.
to seek | chercher | v | C1 | /siːk/ | Seek knowledge from the cradle to the grave. | Recherche le savoir du berceau à la tombe.
to stimulate | stimuler | v | C1 | /ˈstɪmjuleɪt/ | Reading can stimulate the imagination. | La lecture peut stimuler l'imagination.
to strengthen | renforcer | v | B2 | /ˈstreŋθn/ | Exercise will strengthen your back. | L'exercice renforcera ton dos.
to submit | soumettre | v | B2 | /səbˈmɪt/ | Submit your essay by Friday. | Rends ta dissertation avant vendredi.
to sustain | soutenir, maintenir | v | C1 | /səˈsteɪn/ | We cannot sustain this pace. | Nous ne pouvons pas tenir ce rythme.
to undergo | subir | v | C1 | /ˌʌndəˈɡəʊ/ | He will undergo surgery. | Il va subir une opération.
to undertake | entreprendre | v | C1 | /ˌʌndəˈteɪk/ | They will undertake a long journey. | Ils vont entreprendre un long voyage.
to utilise | utiliser | v | C1 | /ˈjuːtəlaɪz/ | We must utilise our resources well. | Nous devons bien utiliser nos ressources.
to vary | varier | v | B2 | /ˈveəri/ | Prices vary from shop to shop. | Les prix varient d'un magasin à l'autre.
to abandon | abandonner | v | B2 | /əˈbændən/ | Never abandon your friends. | N'abandonne jamais tes amis.
to absorb | absorber | v | B2 | /əbˈzɔːb/ | Plants absorb water through their roots. | Les plantes absorbent l'eau par leurs racines.
to accelerate | accélérer | v | C1 | /əkˈseləreɪt/ | Don't accelerate near the school. | N'accélère pas près de l'école.
to accumulate | accumuler | v | C1 | /əˈkjuːmjəleɪt/ | Dust will accumulate under the bed. | La poussière va s'accumuler sous le lit.
to amaze | stupéfier | v | B2 | /əˈmeɪz/ | Her talent will amaze you. | Son talent va te stupéfier.
to amuse | amuser | v | B2 | /əˈmjuːz/ | Clowns amuse the children. | Les clowns amusent les enfants.
to announce | annoncer | v | B1 | /əˈnaʊns/ | They will announce the results tomorrow. | Ils annonceront les résultats demain.
to annoy | agacer | v | B1 | /əˈnɔɪ/ | Stop trying to annoy your sister. | Arrête d'embêter ta sœur.
to apply | appliquer ; postuler | v | B1 | /əˈplaɪ/ | Apply the cream twice a day. | Applique la crème deux fois par jour.
to awaken | éveiller | v | C1 | /əˈweɪkən/ | The story may awaken old memories. | L'histoire pourrait éveiller de vieux souvenirs.
to balance | équilibrer | v | B2 | /ˈbæləns/ | Try to balance work and family. | Essaie d'équilibrer travail et famille.
to bend down | se baisser | v | A2 | /bend daʊn/ | Bend down and pick it up. | Baisse-toi et ramasse-le.
to bind | lier | v | C1 | /baɪnd/ | Traditions bind the community together. | Les traditions lient la communauté.
to blow away | emporter (vent) | v | B2 | /bləʊ əˈweɪ/ | The wind may blow away the tent. | Le vent pourrait emporter la tente.
to breathe in | inspirer | v | A2 | /briːð ɪn/ | Breathe in slowly. | Inspire lentement.
to breathe out | expirer | v | A2 | /briːð aʊt/ | Now breathe out. | Maintenant, expire.
to catch fire | prendre feu | expr | B1 | /ˌkætʃ ˈfaɪər/ | Dry grass can catch fire easily. | L'herbe sèche peut prendre feu facilement.
to cheat on | tromper | v | B2 | /tʃiːt ɒn/ | He would never cheat on his wife. | Il ne tromperait jamais sa femme.
to clap | applaudir | v | A2 | /klæp/ | Clap your hands! | Tape dans tes mains !
to climb up | grimper | v | A2 | /klaɪm ʌp/ | Climb up the ladder carefully. | Monte l'échelle prudemment.
to command | commander | v | B2 | /kəˈmɑːnd/ | The general will command the army. | Le général commandera l'armée.
to communicate | communiquer | v | B1 | /kəˈmjuːnɪkeɪt/ | We communicate by email. | Nous communiquons par e-mail.
to concern | concerner, inquiéter | v | B2 | /kənˈsɜːn/ | This doesn't concern you. | Ça ne te concerne pas.
to cooperate | coopérer | v | B2 | /kəʊˈɒpəreɪt/ | We must cooperate to succeed. | Nous devons coopérer pour réussir.
to correspond | correspondre | v | C1 | /ˌkɒrɪˈspɒnd/ | Your answer doesn't correspond to the question. | Ta réponse ne correspond pas à la question.
to count down | faire le compte à rebours | v | B1 | /kaʊnt daʊn/ | Let's count down from ten. | Faisons le compte à rebours depuis dix.
to cuddle up | se blottir | v | B2 | /ˈkʌdl ʌp/ | The kids cuddle up on the sofa. | Les enfants se blottissent sur le canapé.
to dive in | plonger | v | B1 | /daɪv ɪn/ | Dive in, the water is warm! | Plonge, l'eau est chaude !
to dry up | s'assécher | v | B2 | /draɪ ʌp/ | Rivers dry up in summer. | Les rivières s'assèchent en été.
to entertain | divertir ; recevoir | v | B2 | /ˌentəˈteɪn/ | They love to entertain guests. | Ils adorent recevoir des invités.
to fade away | s'estomper | v | B2 | /feɪd əˈweɪ/ | The sound began to fade away. | Le son a commencé à s'estomper.
to fight back | se défendre, riposter | v | B2 | /faɪt bæk/ | Don't be afraid to fight back. | N'aie pas peur de te défendre.
to fold up | plier | v | A2 | /fəʊld ʌp/ | Fold up your clothes. | Plie tes vêtements.
to get used to | s'habituer à | v | B1 | /ɡet ˈjuːst tuː/ | You'll get used to the cold. | Tu t'habitueras au froid.
to go wrong | mal tourner | expr | B1 | /ɡəʊ ˈrɒŋ/ | What could go wrong? | Qu'est-ce qui pourrait mal tourner ?
to hang around | traîner | v | B2 | /hæŋ əˈraʊnd/ | Don't hang around after school. | Ne traîne pas après l'école.
to have a look | jeter un coup d'œil | expr | A2 | /hæv ə ˈlʊk/ | Can I have a look? | Je peux jeter un œil ?
to head for | se diriger vers | v | B2 | /hed fɔːr/ | Let's head for the beach. | Dirigeons-nous vers la plage.
to keep going | continuer | expr | B1 | /kiːp ˈɡəʊɪŋ/ | Keep going, you're almost there! | Continue, tu y es presque !
to keep quiet | se taire | expr | A2 | /kiːp ˈkwaɪət/ | Please keep quiet in the library. | Merci de rester silencieux à la bibliothèque.
to keep warm | se tenir chaud | expr | A2 | /kiːp ˈwɔːm/ | Wear a hat to keep warm. | Mets un bonnet pour avoir chaud.
to lay | poser, pondre | v | B1 | /leɪ/ | Lay the baby on the bed. | Pose le bébé sur le lit.
to let go | lâcher prise | expr | B1 | /let ˈɡəʊ/ | Sometimes you have to let go. | Parfois, il faut lâcher prise.
to look forward | avoir hâte | v | B1 | /lʊk ˈfɔːwəd/ | I look forward to seeing you. | J'ai hâte de te voir.
to lose sight of | perdre de vue | expr | C1 | /luːz ˈsaɪt əv/ | Don't lose sight of your goal. | Ne perds pas de vue ton objectif.
to mean well | avoir de bonnes intentions | expr | B2 | /miːn ˈwel/ | He can be clumsy, but he means well; he always tries to mean well. | Il peut être maladroit, mais il a de bonnes intentions.
to pick up speed | prendre de la vitesse | expr | B2 | /pɪk ʌp ˈspiːd/ | The train began to pick up speed. | Le train a commencé à prendre de la vitesse.
to point to | indiquer | v | B1 | /pɔɪnt tuː/ | All signs point to rain. | Tout indique qu'il va pleuvoir.
to pour out | verser ; épancher | v | B2 | /pɔːr aʊt/ | Pour out the tea. | Sers le thé.
to put to sleep | endormir | expr | B2 | /pʊt tə ˈsliːp/ | Music can put the baby to sleep. | La musique peut endormir le bébé.
to rush out | sortir en trombe | v | B2 | /rʌʃ aʊt/ | Don't rush out without your coat. | Ne sors pas en trombe sans ton manteau.
to show around | faire visiter | v | B1 | /ʃəʊ əˈraʊnd/ | Let me show you around the house. | Laisse-moi te faire visiter la maison.
to stand still | rester immobile | expr | B1 | /stænd ˈstɪl/ | Stand still for the photo. | Ne bouge pas pour la photo.
to step back | reculer | v | B1 | /step bæk/ | Step back from the edge. | Recule du bord.
to step in | intervenir | v | B2 | /step ɪn/ | The teacher had to step in. | Le professeur a dû intervenir.
to stretch one's legs | se dégourdir les jambes | expr | B2 | /stretʃ/ | Let's stop to stretch one's legs. | Arrêtons-nous pour nous dégourdir les jambes.
to take care | faire attention | expr | A2 | /teɪk ˈkeər/ | Take care on the roads. | Fais attention sur la route.
to take turns | se relayer | expr | B1 | /teɪk ˈtɜːnz/ | Let's take turns driving. | Relayons-nous au volant.
to tear apart | déchirer | v | C1 | /teər əˈpɑːt/ | War can tear apart families. | La guerre peut déchirer les familles.
to turn back | faire demi-tour | v | B1 | /tɜːn bæk/ | It's too late to turn back. | Il est trop tard pour faire demi-tour.
to wake | réveiller | v | A2 | /weɪk/ | Wake me at six, please. | Réveille-moi à six heures, s'il te plaît.
to walk away | s'éloigner | v | B1 | /wɔːk əˈweɪ/ | Just walk away from the argument. | Éloigne-toi simplement de la dispute.
to belong | appartenir | v | B1 | /bɪˈlɒŋ/ | This book belongs to my brother. | Ce livre appartient à mon frère.
to care | se soucier, tenir à | v | B1 | /keər/ | I really care about you. | Je tiens vraiment à toi.
to deceive | tromper, duper | v | C1 | /dɪˈsiːv/ | Appearances can deceive. | Les apparences peuvent être trompeuses.
to embarrass | embarrasser, gêner | v | B2 | /ɪmˈbærəs/ | Please don't embarrass me in front of my friends. | S'il te plaît, ne me mets pas mal à l'aise devant mes amis.
to grind | moudre, broyer | v | B2 | /ɡraɪnd/ | Grind the coffee beans. | Mouds les grains de café.
to harm | nuire à, faire du mal | v | B2 | /hɑːm/ | Smoking can harm your health. | Fumer peut nuire à ta santé.
to joke | plaisanter | v | A2 | /dʒəʊk/ | Don't worry, I'm only joking. | Ne t'inquiète pas, je plaisante.
to limit | limiter | v | B1 | /ˈlɪmɪt/ | Limit your screen time. | Limite ton temps d'écran.
to listen | écouter | v | A1 | /ˈlɪsn/ | Listen to the teacher. | Écoute le professeur.
to mourn | pleurer (un défunt), être en deuil | v | C1 | /mɔːn/ | The whole town mourns his death. | Toute la ville pleure sa mort.
to object | s'opposer, objecter | v | B2 | /əbˈdʒekt/ | I object to this decision. | Je m'oppose à cette décision.
to offend | offenser, vexer | v | B2 | /əˈfend/ | I didn't mean to offend you. | Je ne voulais pas te vexer.
to omit | omettre | v | C1 | /əˈmɪt/ | Don't omit any detail. | N'omets aucun détail.
to praise | louer, faire l'éloge de | v | B2 | /preɪz/ | Teachers praise her work. | Les professeurs louent son travail.
to quit | arrêter, quitter | v | B1 | /kwɪt/ | He wants to quit smoking. | Il veut arrêter de fumer.
to rely | compter sur, dépendre | v | B2 | /rɪˈlaɪ/ | You can rely on me. | Tu peux compter sur moi.
to rub | frotter | v | B1 | /rʌb/ | Don't rub your eyes. | Ne te frotte pas les yeux.
to scare | effrayer | v | B1 | /skeər/ | Dogs scare my little sister. | Les chiens font peur à ma petite sœur.
to seize | saisir, s'emparer de | v | C1 | /siːz/ | Seize the opportunity! | Saisis l'occasion !
to slap | gifler, donner une claque | v | B2 | /slæp/ | Never slap a child. | Ne gifle jamais un enfant.
to smash | fracasser, briser | v | B2 | /smæʃ/ | Be careful not to smash the glass. | Fais attention de ne pas briser le verre.
to spit | cracher | v | B2 | /spɪt/ | It's rude to spit in the street. | C'est impoli de cracher dans la rue.
to struggle | lutter, avoir du mal | v | B2 | /ˈstrʌɡl/ | I struggle to wake up early. | J'ai du mal à me lever tôt.
to tempt | tenter | v | B2 | /tempt/ | Don't tempt me with chocolate! | Ne me tente pas avec du chocolat !
to trap | piéger | v | B2 | /træp/ | They use a cage to trap the mice. | Ils utilisent une cage pour piéger les souris.
to twist | tordre ; se fouler | v | B2 | /twɪst/ | Don't twist my words. | Ne déforme pas mes propos.
to appoint | nommer, désigner | v | C1 | /əˈpɔɪnt/ | The board will appoint a new director. | Le conseil va nommer un nouveau directeur.
to authorise | autoriser | v | C1 | /ˈɔːθəraɪz/ | Only the manager can authorise refunds. | Seul le responsable peut autoriser les remboursements.
to classify | classer, classifier | v | C1 | /ˈklæsɪfaɪ/ | Scientists classify animals into groups. | Les scientifiques classent les animaux en groupes.
to compensate | compenser, indemniser | v | C1 | /ˈkɒmpenseɪt/ | The airline will compensate the passengers. | La compagnie va indemniser les passagers.
to conceal | dissimuler, cacher | v | C1 | /kənˈsiːl/ | He tried to conceal the truth. | Il a essayé de cacher la vérité.
to condemn | condamner | v | C1 | /kənˈdem/ | We condemn all violence. | Nous condamnons toute violence.
to defy | défier, braver | v | C1 | /dɪˈfaɪ/ | Teenagers often defy their parents. | Les ados défient souvent leurs parents.
to devote | consacrer | v | C1 | /dɪˈvəʊt/ | She devotes her time to charity. | Elle consacre son temps au bénévolat.
to discourage | décourager, dissuader | v | B2 | /dɪsˈkʌrɪdʒ/ | Don't let failure discourage you. | Ne laisse pas l'échec te décourager.
to dispose | se débarrasser de, jeter | v | C1 | /dɪˈspəʊz/ | Dispose of batteries carefully. | Jette les piles avec précaution.
to endure | endurer, supporter | v | C1 | /ɪnˈdjʊər/ | They endure the heat without complaining. | Ils supportent la chaleur sans se plaindre.
to evolve | évoluer | v | C1 | /iˈvɒlv/ | Languages evolve over time. | Les langues évoluent avec le temps.
to exceed | dépasser, excéder | v | C1 | /ɪkˈsiːd/ | Don't exceed the speed limit. | Ne dépasse pas la limitation de vitesse.
to execute | exécuter | v | C1 | /ˈeksɪkjuːt/ | We must execute the plan carefully. | Nous devons exécuter le plan avec soin.
to expose | exposer ; dénoncer | v | C1 | /ɪkˈspəʊz/ | Don't expose the baby to the sun. | N'expose pas le bébé au soleil.
to flee | fuir, s'enfuir | v | C1 | /fliː/ | Millions had to flee the war. | Des millions de personnes ont dû fuir la guerre.
to flourish | prospérer, s'épanouir | v | C1 | /ˈflʌrɪʃ/ | Science began to flourish in Baghdad. | La science a commencé à prospérer à Bagdad.
to foresee | prévoir | v | C1 | /fɔːˈsiː/ | Nobody could foresee the crisis. | Personne ne pouvait prévoir la crise.
to grasp | saisir, comprendre | v | C1 | /ɡrɑːsp/ | It's hard to grasp this idea. | Il est difficile de saisir cette idée.
to hinder | entraver, gêner | v | C1 | /ˈhɪndər/ | Bad weather can hinder the rescue. | Le mauvais temps peut entraver les secours.
to insult | insulter | v | B2 | /ɪnˈsʌlt/ | Don't insult him. | Ne l'insulte pas.
to linger | s'attarder, persister | v | C1 | /ˈlɪŋɡər/ | The smell tends to linger. | L'odeur a tendance à persister.
to merge | fusionner | v | C1 | /mɜːdʒ/ | The two companies will merge. | Les deux entreprises vont fusionner.
to notify | informer, avertir | v | C1 | /ˈnəʊtɪfaɪ/ | Please notify us of any change. | Merci de nous informer de tout changement.
to oblige | obliger | v | C1 | /əˈblaɪdʒ/ | The law obliges employers to pay the minimum wage. | La loi oblige les employeurs à payer le salaire minimum.
to overwhelm | submerger, accabler | v | C1 | /ˌəʊvəˈwelm/ | Grief can overwhelm a person. | Le chagrin peut submerger une personne.
to proceed | poursuivre, procéder | v | C1 | /prəˈsiːd/ | Please proceed to gate five. | Veuillez vous rendre à la porte cinq.
to prohibit | interdire | v | C1 | /prəˈhɪbɪt/ | The rules prohibit smoking here. | Le règlement interdit de fumer ici.
to prosper | prospérer | v | C1 | /ˈprɒspər/ | The town began to prosper. | La ville a commencé à prospérer.
to provoke | provoquer | v | C1 | /prəˈvəʊk/ | Don't provoke the dog. | Ne provoque pas le chien.
to regain | retrouver, reprendre | v | C1 | /rɪˈɡeɪn/ | He tried to regain his strength. | Il a essayé de reprendre des forces.
to relieve | soulager | v | C1 | /rɪˈliːv/ | This cream will relieve the pain. | Cette crème va soulager la douleur.
to renew | renouveler | v | B2 | /rɪˈnjuː/ | I need to renew my passport. | Je dois renouveler mon passeport.
to resume | reprendre (une activité) | v | C1 | /rɪˈzjuːm/ | Classes will resume on Monday. | Les cours reprendront lundi.
to retrieve | récupérer | v | C1 | /rɪˈtriːv/ | I went back to retrieve my bag. | Je suis retourné récupérer mon sac.
to scatter | disperser, éparpiller | v | C1 | /ˈskætər/ | The wind will scatter the leaves. | Le vent va éparpiller les feuilles.
to shatter | voler en éclats, briser | v | C1 | /ˈʃætər/ | The glass can shatter if it falls. | Le verre peut voler en éclats s'il tombe.
to soothe | apaiser, calmer | v | C1 | /suːð/ | Music can soothe a crying baby. | La musique peut apaiser un bébé qui pleure.
to strive | s'efforcer | v | C1 | /straɪv/ | We strive to do our best. | Nous nous efforçons de faire de notre mieux.
to summon | convoquer, faire venir | v | C1 | /ˈsʌmən/ | The director will summon all staff. | Le directeur va convoquer tout le personnel.
to surpass | surpasser, dépasser | v | C1 | /səˈpɑːs/ | The student may surpass his teacher. | L'élève pourrait dépasser son maître.
to thrive | prospérer, s'épanouir | v | C1 | /θraɪv/ | Plants thrive in this soil. | Les plantes prospèrent dans ce sol.
to utter | prononcer, émettre | v | C1 | /ˈʌtər/ | He didn't utter a word. | Il n'a pas prononcé un mot.
to withstand | résister à | v | C1 | /wɪðˈstænd/ | The building can withstand earthquakes. | Le bâtiment peut résister aux séismes.
to consist | consister, se composer | v | A2 | /kənˈsɪst/ | The test consists of three parts. | Le test se compose de trois parties.
to operate | faire fonctionner ; opérer | v | B1 | /ˈɒpəreɪt/ | Can you operate this machine? | Sais-tu faire fonctionner cette machine ?
to refer | faire référence ; adresser | v | B1 | /rɪˈfɜː/ | Which book are you referring to? | De quel livre parles-tu ?
to shut | fermer | v | A2 | /ʃʌt/ | Shut the door, please. | Ferme la porte, s'il te plaît.
to splash | éclabousser | v | B1 | /splæʃ/ | The children splashed in the pool. | Les enfants s'éclaboussaient dans la piscine.
to terrify | terrifier | v | B1 | /ˈterɪfaɪ/ | Thunder terrifies my dog. | Le tonnerre terrifie mon chien.
to accomplish | accomplir, réaliser | v | B1 | /əˈkʌmplɪʃ/ | We accomplished a lot today. | Nous avons accompli beaucoup de choses aujourd'hui.
to accustom | habituer, accoutumer | v | B2 | /əˈkʌstəm/ | It took time to accustom myself to the cold. | Il m'a fallu du temps pour m'habituer au froid.
to advance | avancer, progresser | v | B1 | /ədˈvɑːns/ | Medicine has advanced a lot. | La médecine a beaucoup progressé.
to arise | survenir, se présenter | v | B1 | /əˈraɪz/ | Problems may arise at any time. | Des problèmes peuvent survenir à tout moment.
to associate | associer | v | B1 | /əˈsəʊʃieɪt/ | I associate this smell with my childhood. | J'associe cette odeur à mon enfance.
to attain | atteindre, parvenir à | v | B2 | /əˈteɪn/ | She attained her goal. | Elle a atteint son objectif.
to blend | mélanger | v | B1 | /blend/ | Blend the fruit with some milk. | Mixe les fruits avec un peu de lait.
to bore | ennuyer | v | B1 | /bɔː/ | His long speeches bore me. | Ses longs discours m'ennuient.
to bump | heurter, cogner | v | B1 | /bʌmp/ | I bumped my head on the door. | Je me suis cogné la tête contre la porte.
to burst | éclater | v | B1 | /bɜːst/ | The balloon burst. | Le ballon a éclaté.
to categorise | classer, catégoriser | v | B2 | /ˈkætəɡəraɪz/ | Categorise the words by colour. | Classe les mots par couleur.
to characterise | caractériser | v | B2 | /ˈkærəktəraɪz/ | Patience characterises a good teacher. | La patience caractérise un bon professeur.
to complicate | compliquer | v | B1 | /ˈkɒmplɪkeɪt/ | Don't complicate things. | Ne complique pas les choses.
to constitute | constituer | v | B2 | /ˈkɒnstɪtjuːt/ | Women constitute half the population. | Les femmes constituent la moitié de la population.
to convey | transmettre, exprimer | v | B2 | /kənˈveɪ/ | Words can't convey how grateful I am. | Les mots ne peuvent exprimer ma gratitude.
to counter | contrer, riposter | v | B2 | /ˈkaʊntə/ | He countered the argument with facts. | Il a contré l'argument avec des faits.
to dazzle | éblouir | v | B2 | /ˈdæzl/ | The headlights dazzled me. | Les phares m'ont ébloui.
to devastate | dévaster | v | B2 | /ˈdevəsteɪt/ | The earthquake devastated the region. | Le séisme a dévasté la région.
to dial | composer (un numéro) | v | B1 | /ˈdaɪəl/ | Dial 112 in an emergency. | Compose le 112 en cas d'urgence.
to disable | désactiver ; handicaper | v | B2 | /dɪsˈeɪbl/ | You can disable notifications in the settings. | Tu peux désactiver les notifications dans les réglages.
to enclose | joindre (à un courrier) ; clôturer | v | B2 | /ɪnˈkləʊz/ | Please enclose a copy of your passport. | Veuillez joindre une copie de votre passeport.
to enrich | enrichir | v | B1 | /ɪnˈrɪtʃ/ | Travel enriches the mind. | Les voyages enrichissent l'esprit.
to fascinate | fasciner | v | B1 | /ˈfæsɪneɪt/ | The stars have always fascinated me. | Les étoiles m'ont toujours fasciné.
to glide | glisser, planer | v | B2 | /ɡlaɪd/ | The swans glided across the lake. | Les cygnes glissaient sur le lac.
to hop | sautiller, sauter à cloche-pied | v | B1 | /hɒp/ | The children hopped across the playground. | Les enfants traversaient la cour à cloche-pied.
to horrify | horrifier | v | B2 | /ˈhɒrɪfaɪ/ | The images horrified the viewers. | Les images ont horrifié les téléspectateurs.
to illuminate | éclairer, illuminer | v | B2 | /ɪˈluːmɪneɪt/ | Candles illuminated the room. | Des bougies éclairaient la pièce.
to impair | altérer, diminuer | v | C1 | /ɪmˈpeə/ | Lack of sleep impairs concentration. | Le manque de sommeil altère la concentration.
to inscribe | inscrire, graver | v | C1 | /ɪnˈskraɪb/ | Their names are inscribed on the wall. | Leurs noms sont gravés sur le mur.
to interact | interagir | v | B1 | /ˌɪntərˈækt/ | Children learn by interacting with others. | Les enfants apprennent en interagissant avec les autres.
to irritate | irriter, agacer | v | B1 | /ˈɪrɪteɪt/ | His attitude irritates me. | Son attitude m'agace.
to lessen | diminuer, atténuer | v | B2 | /ˈlesn/ | This medicine will lessen the pain. | Ce médicament va atténuer la douleur.
to liberate | libérer | v | B2 | /ˈlɪbəreɪt/ | The city was liberated in 1944. | La ville a été libérée en 1944.
to mislead | induire en erreur, tromper | v | B2 | /ˌmɪsˈliːd/ | The advert misleads customers. | La publicité induit les clients en erreur.
to occupy | occuper | v | B1 | /ˈɒkjupaɪ/ | Games occupy the children for hours. | Les jeux occupent les enfants pendant des heures.
to outline | exposer dans les grandes lignes | v | B2 | /ˈaʊtlaɪn/ | He outlined his plan. | Il a exposé son plan dans les grandes lignes.
to outweigh | l'emporter sur | v | C1 | /ˌaʊtˈweɪ/ | The benefits outweigh the risks. | Les avantages l'emportent sur les risques.
to proclaim | proclamer | v | B2 | /prəˈkleɪm/ | He proclaimed his innocence. | Il a clamé son innocence.
to rearrange | réarranger, réorganiser | v | B1 | /ˌriːəˈreɪndʒ/ | We rearranged the furniture. | Nous avons réorganisé les meubles.
to rebuild | reconstruire | v | B1 | /ˌriːˈbɪld/ | They rebuilt the mosque after the fire. | Ils ont reconstruit la mosquée après l'incendie.
to reclaim | récupérer, réclamer | v | B2 | /rɪˈkleɪm/ | You can reclaim your luggage here. | Vous pouvez récupérer vos bagages ici.
to relate | se rapporter ; s'identifier | v | B1 | /rɪˈleɪt/ | I can relate to his story. | Je me reconnais dans son histoire.
to remark | faire remarquer | v | B1 | /rɪˈmɑːk/ | She remarked that the room was cold. | Elle a fait remarquer que la pièce était froide.
to simplify | simplifier | v | B1 | /ˈsɪmplɪfaɪ/ | Let me simplify the explanation. | Laisse-moi simplifier l'explication.
to stun | stupéfier, assommer | v | B2 | /stʌn/ | The news stunned everyone. | La nouvelle a stupéfié tout le monde.
to tend | avoir tendance à | v | B1 | /tend/ | I tend to sleep late at weekends. | J'ai tendance à faire la grasse matinée le week-end.
to thump | cogner, frapper | v | B2 | /θʌmp/ | He thumped the table angrily. | Il a frappé la table avec colère.
to tighten | serrer, resserrer | v | B1 | /ˈtaɪtn/ | Tighten your seat belt. | Serre ta ceinture.
to tire | fatiguer, se lasser | v | B1 | /ˈtaɪə/ | Long walks tire me. | Les longues marches me fatiguent.
to toss | lancer, jeter | v | B1 | /tɒs/ | He tossed the keys to me. | Il m'a lancé les clés.
to tumble | dégringoler | v | B2 | /ˈtʌmbl/ | He tumbled down the stairs. | Il a dégringolé l'escalier.
to undo | défaire, annuler | v | B1 | /ʌnˈduː/ | You can undo the last change. | Tu peux annuler la dernière modification.
to unfold | déplier ; se dérouler | v | B2 | /ʌnˈfəʊld/ | He unfolded the map. | Il a déplié la carte.
to adorn | orner, parer | v | C1 | /əˈdɔːn/ | Beautiful tiles adorn the mosque. | De magnifiques carreaux ornent la mosquée.
to alternate | alterner | v | B2 | /ˈɔːltəneɪt/ | Alternate between running and walking. | Alterne course et marche.
to amplify | amplifier | v | B2 | /ˈæmplɪfaɪ/ | Social media amplifies rumours. | Les réseaux sociaux amplifient les rumeurs.
to animate | animer | v | B2 | /ˈænɪmeɪt/ | Her smile animated her face. | Son sourire illuminait son visage.
to arouse | éveiller, susciter | v | C1 | /əˈraʊz/ | His behaviour aroused suspicion. | Son comportement a éveillé les soupçons.
to aspire | aspirer à | v | C1 | /əˈspaɪə/ | He aspires to be a good Muslim. | Il aspire à être un bon musulman.
to assemble | assembler ; se rassembler | v | B2 | /əˈsembl/ | We assembled the furniture ourselves. | Nous avons monté les meubles nous-mêmes.
to astonish | stupéfier, étonner | v | B2 | /əˈstɒnɪʃ/ | Her answer astonished me. | Sa réponse m'a stupéfié.
to await | attendre | v | B2 | /əˈweɪt/ | We await your reply. | Nous attendons votre réponse.
to beautify | embellir | v | C1 | /ˈbjuːtɪfaɪ/ | They planted trees to beautify the street. | Ils ont planté des arbres pour embellir la rue.
to bellow | beugler, hurler | v | C1 | /ˈbeləʊ/ | The coach bellowed at the players. | L'entraîneur hurlait sur les joueurs.
to bewilder | déconcerter | v | C1 | /bɪˈwɪldə/ | The question bewildered him. | La question l'a déconcerté.
to blur | brouiller, rendre flou | v | B2 | /blɜː/ | Tears blurred her vision. | Les larmes lui brouillaient la vue.
to blurt out | laisser échapper | v | C1 | /blɜːt ˈaʊt/ | He blurted out the secret. | Il a laissé échapper le secret.
to bombard | bombarder | v | C1 | /bɒmˈbɑːd/ | Journalists bombarded him with questions. | Les journalistes l'ont bombardé de questions.
to boost | stimuler, booster | v | B2 | /buːst/ | The good news boosted his confidence. | La bonne nouvelle a renforcé sa confiance.
to broaden | élargir | v | B2 | /ˈbrɔːdn/ | Travel broadens the mind. | Les voyages élargissent l'esprit.
to certify | certifier | v | B2 | /ˈsɜːtɪfaɪ/ | The document was certified by a lawyer. | Le document a été certifié par un avocat.
to crystallise | se cristalliser, prendre forme | v | C1 | /ˈkrɪstəlaɪz/ | My ideas began to crystallise. | Mes idées ont commencé à prendre forme.
to dash | se précipiter | v | B2 | /dæʃ/ | I have to dash, I'm late! | Je dois filer, je suis en retard !
to dehumanise | déshumaniser | v | C1 | /ˌdiːˈhjuːmənaɪz/ | War dehumanises people. | La guerre déshumanise les gens.
to demolish | démolir | v | B2 | /dɪˈmɒlɪʃ/ | They demolished the old factory. | Ils ont démoli la vieille usine.
to descend | descendre | v | B2 | /dɪˈsend/ | The plane began to descend. | L'avion a commencé sa descente.
to despise | mépriser | v | B2 | /dɪˈspaɪz/ | He despises liars. | Il méprise les menteurs.
to detach | détacher | v | B2 | /dɪˈtætʃ/ | Detach the form and send it back. | Détachez le formulaire et renvoyez-le.
to dip | tremper, plonger | v | B2 | /dɪp/ | Dip the bread in the oil. | Trempe le pain dans l'huile.
to disapprove | désapprouver | v | B2 | /ˌdɪsəˈpruːv/ | My parents disapprove of my choice. | Mes parents désapprouvent mon choix.
to disconnect | débrancher, déconnecter | v | B2 | /ˌdɪskəˈnekt/ | Disconnect the cable before cleaning. | Débranche le câble avant de nettoyer.
to discredit | discréditer | v | C1 | /dɪsˈkredɪt/ | They tried to discredit the witness. | Ils ont essayé de discréditer le témoin.
to disrupt | perturber | v | B2 | /dɪsˈrʌpt/ | The strike disrupted train services. | La grève a perturbé le trafic ferroviaire.
to divert | dévier, détourner | v | B2 | /daɪˈvɜːt/ | The flight was diverted to Lyon. | Le vol a été dérouté vers Lyon.
to droop | pendre, s'affaisser | v | C1 | /druːp/ | The flowers began to droop in the heat. | Les fleurs ont commencé à se faner sous la chaleur.
to engulf | engloutir, submerger | v | C1 | /ɪnˈɡʌlf/ | Flames engulfed the building. | Les flammes ont englouti le bâtiment.
to equip | équiper | v | B2 | /ɪˈkwɪp/ | The school is equipped with computers. | L'école est équipée d'ordinateurs.
to excel | exceller | v | B2 | /ɪkˈsel/ | She excels at maths. | Elle excelle en maths.
to exclaim | s'exclamer | v | B2 | /ɪkˈskleɪm/ | "How beautiful!" she exclaimed. | « Que c'est beau ! » s'exclama-t-elle.
to explode | exploser | v | B2 | /ɪkˈspləʊd/ | The bomb exploded at midnight. | La bombe a explosé à minuit.
to extract | extraire | v | B2 | /ɪkˈstrækt/ | The dentist extracted my tooth. | Le dentiste m'a arraché une dent.
to familiarise | se familiariser | v | B2 | /fəˈmɪliəraɪz/ | Familiarise yourself with the rules. | Familiarise-toi avec les règles.
to flap | battre (des ailes), claquer | v | B2 | /flæp/ | The bird flapped its wings. | L'oiseau battait des ailes.
to flip | retourner, feuilleter | v | B2 | /flɪp/ | Flip the pancake after one minute. | Retourne la crêpe au bout d'une minute.
to freak out | paniquer, flipper | v | B2 | /friːk ˈaʊt/ | Don't freak out, it's only a spider. | Ne panique pas, ce n'est qu'une araignée.
to generalise | généraliser | v | B2 | /ˈdʒenrəlaɪz/ | You can't generalise from one example. | On ne peut pas généraliser à partir d'un seul exemple.
to glorify | glorifier | v | C1 | /ˈɡlɔːrɪfaɪ/ | Films sometimes glorify violence. | Les films glorifient parfois la violence.
to hover | planer, flotter | v | B2 | /ˈhɒvə/ | A helicopter hovered above the crowd. | Un hélicoptère survolait la foule en vol stationnaire.
to humanise | humaniser | v | C1 | /ˈhjuːmənaɪz/ | The architect wanted to humanise the hospital. | L'architecte voulait humaniser l'hôpital.
to humiliate | humilier | v | B2 | /hjuːˈmɪlieɪt/ | Never humiliate a person in public. | N'humilie jamais quelqu'un en public.
to hush | faire taire, se taire | v | C1 | /hʌʃ/ | She hushed the crying baby. | Elle a calmé le bébé qui pleurait.
to immerse | immerger, plonger | v | C1 | /ɪˈmɜːs/ | She immersed herself in her studies. | Elle s'est plongée dans ses études.
to indulge | se faire plaisir, céder (à) | v | C1 | /ɪnˈdʌldʒ/ | I indulged in a piece of cake. | Je me suis offert une part de gâteau.
to inhabit | habiter, peupler | v | B2 | /ɪnˈhæbɪt/ | Wolves inhabit these forests. | Des loups peuplent ces forêts.
to inquire | se renseigner | v | B2 | /ɪnˈkwaɪə/ | I'm calling to inquire about the job. | J'appelle pour me renseigner sur le poste.
to instil | inculquer | v | C1 | /ɪnˈstɪl/ | Parents should instil good values. | Les parents doivent inculquer de bonnes valeurs.
to instruct | ordonner ; enseigner | v | B2 | /ɪnˈstrʌkt/ | The doctor instructed me to rest. | Le médecin m'a demandé de me reposer.
to interfere | se mêler, interférer | v | B2 | /ˌɪntəˈfɪə/ | Don't interfere in their business. | Ne te mêle pas de leurs affaires.
to intrude | déranger, s'immiscer | v | C1 | /ɪnˈtruːd/ | I don't want to intrude. | Je ne veux pas déranger.
to jeopardise | compromettre | v | C1 | /ˈdʒepədaɪz/ | Don't jeopardise your future. | Ne compromets pas ton avenir.
to lengthen | allonger, rallonger | v | B2 | /ˈleŋθən/ | The days lengthen in spring. | Les jours rallongent au printemps.
to lighten | alléger ; éclaircir | v | B2 | /ˈlaɪtn/ | Let me lighten your load. | Laisse-moi alléger ta charge.
to mimic | imiter | v | C1 | /ˈmɪmɪk/ | Parrots can mimic human speech. | Les perroquets peuvent imiter la parole humaine.
to mistreat | maltraiter | v | B2 | /ˌmɪsˈtriːt/ | Never mistreat an animal. | Ne maltraite jamais un animal.
to misunderstand | mal comprendre | v | B2 | /ˌmɪsʌndəˈstænd/ | Don't misunderstand me. | Ne te méprends pas.
to modernise | moderniser | v | B2 | /ˈmɒdənaɪz/ | They modernised the kitchen. | Ils ont modernisé la cuisine.
to mount | monter ; augmenter | v | B2 | /maʊnt/ | Tension is mounting. | La tension monte.
to mumble | marmonner | v | B2 | /ˈmʌmbl/ | Don't mumble, speak clearly! | Ne marmonne pas, parle clairement !
to mutter | marmonner, grommeler | v | B2 | /ˈmʌtə/ | He muttered something and left. | Il a marmonné quelque chose et il est parti.
to mystify | laisser perplexe | v | C1 | /ˈmɪstɪfaɪ/ | His disappearance mystified everyone. | Sa disparition a laissé tout le monde perplexe.
to navigate | naviguer ; s'orienter | v | B2 | /ˈnævɪɡeɪt/ | Sailors used the stars to navigate. | Les marins s'orientaient grâce aux étoiles.
to nourish | nourrir | v | C1 | /ˈnʌrɪʃ/ | Good books nourish the mind. | Les bons livres nourrissent l'esprit.
to obsess | obséder | v | C1 | /əbˈses/ | Stop obsessing about your weight! | Arrête d'être obsédé par ton poids !
to originate | provenir, naître | v | C1 | /əˈrɪdʒɪneɪt/ | The tradition originated in Persia. | La tradition est née en Perse.
to outdo | surpasser | v | C1 | /ˌaʊtˈduː/ | He tried to outdo his brother. | Il essayait de surpasser son frère.
to outgrow | devenir trop grand pour | v | C1 | /ˌaʊtˈɡrəʊ/ | The children have outgrown their shoes. | Les chaussures des enfants sont devenues trop petites.
to outlive | survivre à | v | C1 | /ˌaʊtˈlɪv/ | She outlived her husband by ten years. | Elle a survécu dix ans à son mari.
to outshine | éclipser, surpasser | v | C1 | /ˌaʊtˈʃaɪn/ | She outshines all the other singers. | Elle éclipse tous les autres chanteurs.
to overemphasise | trop insister sur | v | C1 | /ˌəʊvərˈemfəsaɪz/ | You can't overemphasise the importance of sleep. | On n'insistera jamais assez sur l'importance du sommeil.
to overestimate | surestimer | v | B2 | /ˌəʊvərˈestɪmeɪt/ | Don't overestimate your strength. | Ne surestime pas tes forces.
to overhear | entendre par hasard | v | B2 | /ˌəʊvəˈhɪə/ | I overheard their conversation. | J'ai entendu leur conversation par hasard.
to overshadow | éclipser, assombrir | v | C1 | /ˌəʊvəˈʃædəʊ/ | The news overshadowed the celebrations. | La nouvelle a assombri les festivités.
to overstep | outrepasser, dépasser | v | C1 | /ˌəʊvəˈstep/ | You've overstepped the mark. | Tu as dépassé les bornes.
to penetrate | pénétrer | v | C1 | /ˈpenɪtreɪt/ | The light couldn't penetrate the fog. | La lumière ne parvenait pas à percer le brouillard.
to permeate | imprégner, se répandre | v | C2 | /ˈpɜːmieɪt/ | The smell of spices permeated the house. | L'odeur des épices imprégnait la maison.
to personify | personnifier, incarner | v | C1 | /pəˈsɒnɪfaɪ/ | He personifies honesty. | Il incarne l'honnêteté.
to pluck | cueillir ; plumer ; pincer | v | C1 | /plʌk/ | She plucked a rose from the garden. | Elle a cueilli une rose dans le jardin.
to popularise | populariser, vulgariser | v | C1 | /ˈpɒpjələraɪz/ | He popularised science on television. | Il a vulgarisé la science à la télévision.
to prejudge | préjuger, juger d'avance | v | C1 | /ˌpriːˈdʒʌdʒ/ | Don't prejudge people. | Ne juge pas les gens d'avance.
to preoccupy | préoccuper | v | C1 | /priˈɒkjupaɪ/ | The exam preoccupies her. | L'examen la préoccupe.
to prevail | prévaloir, l'emporter | v | C1 | /prɪˈveɪl/ | Truth will prevail. | La vérité finira par l'emporter.
to radiate | rayonner, irradier | v | C1 | /ˈreɪdieɪt/ | She radiates happiness. | Elle rayonne de bonheur.
to ravage | ravager | v | C1 | /ˈrævɪdʒ/ | War ravaged the country. | La guerre a ravagé le pays.
to reckon | penser, estimer | v | B2 | /ˈrekən/ | I reckon it will rain. | J'ai l'impression qu'il va pleuvoir.
to recollect | se rappeler | v | C1 | /ˌrekəˈlekt/ | I don't recollect meeting him. | Je ne me souviens pas l'avoir rencontré.
to reconsider | reconsidérer | v | B2 | /ˌriːkənˈsɪdə/ | Please reconsider your decision. | Merci de reconsidérer ta décision.
to redo | refaire | v | B2 | /ˌriːˈduː/ | I had to redo the whole exercise. | J'ai dû refaire tout l'exercice.
to regulate | réguler, réglementer | v | B2 | /ˈreɡjuleɪt/ | The law regulates the use of pesticides. | La loi réglemente l'usage des pesticides.
to rejoin | rejoindre | v | B2 | /ˌriːˈdʒɔɪn/ | He rejoined the team after his injury. | Il a rejoint l'équipe après sa blessure.
to reorganise | réorganiser | v | B2 | /riˈɔːɡənaɪz/ | We reorganised the office. | Nous avons réorganisé le bureau.
to repress | réprimer, refouler | v | C1 | /rɪˈpres/ | She repressed a smile. | Elle a réprimé un sourire.
to revive | ranimer, faire revivre | v | B2 | /rɪˈvaɪv/ | The doctors revived him. | Les médecins l'ont ranimé.
to revolutionise | révolutionner | v | C1 | /ˌrevəˈluːʃənaɪz/ | The internet revolutionised communication. | Internet a révolutionné la communication.
to revolve | tourner | v | B2 | /rɪˈvɒlv/ | The Earth revolves around the Sun. | La Terre tourne autour du Soleil.
to rip | déchirer | v | B2 | /rɪp/ | I ripped my trousers on a nail. | J'ai déchiré mon pantalon sur un clou.
to scramble | se démener ; escalader à quatre pattes | v | C1 | /ˈskræmbl/ | We scrambled up the rocks. | Nous avons grimpé sur les rochers à quatre pattes.
to signify | signifier | v | C1 | /ˈsɪɡnɪfaɪ/ | A white flag signifies surrender. | Un drapeau blanc signifie la reddition.
to skim | parcourir, survoler ; écrémer | v | C1 | /skɪm/ | I skimmed the article quickly. | J'ai parcouru l'article rapidement.
to slam | claquer | v | B2 | /slæm/ | Don't slam the door! | Ne claque pas la porte !
to snap | casser net ; claquer | v | B2 | /snæp/ | The branch snapped under his weight. | La branche s'est cassée net sous son poids.
to span | couvrir, s'étendre sur | v | C1 | /spæn/ | His career spanned forty years. | Sa carrière s'est étendue sur quarante ans.
to splatter | éclabousser | v | C1 | /ˈsplætə/ | Mud splattered my trousers. | La boue a éclaboussé mon pantalon.
to stammer | bégayer | v | B2 | /ˈstæmə/ | He stammers when he's nervous. | Il bégaie quand il est nerveux.
to startle | faire sursauter, effrayer | v | B2 | /ˈstɑːtl/ | The noise startled the baby. | Le bruit a fait sursauter le bébé.
to straighten | redresser, remettre droit | v | B2 | /ˈstreɪtn/ | Straighten your back. | Redresse le dos.
to stride | marcher à grands pas | v | C1 | /straɪd/ | He strides into the office every morning. | Il entre au bureau à grandes enjambées chaque matin.
to subside | se calmer, s'apaiser | v | C1 | /səbˈsaɪd/ | The storm finally subsided. | La tempête s'est enfin calmée.
to suck | sucer, aspirer | v | B2 | /sʌk/ | The baby sucks its thumb. | Le bébé suce son pouce.
to suppress | réprimer, étouffer | v | C1 | /səˈpres/ | She suppressed a yawn. | Elle a réprimé un bâillement.
to taunt | railler, provoquer | v | C1 | /tɔːnt/ | The other boys taunted him. | Les autres garçons se moquaient de lui.
to trample | piétiner | v | C1 | /ˈtræmpl/ | The crowd trampled the flowers. | La foule a piétiné les fleurs.
to traverse | traverser, parcourir | v | C1 | /trəˈvɜːs/ | They traversed the desert on camels. | Ils ont traversé le désert à dos de chameau.
to tread | marcher, poser le pied | v | C1 | /tred/ | Tread carefully on the ice. | Marche prudemment sur la glace.
to underestimate | sous-estimer | v | B2 | /ˌʌndərˈestɪmeɪt/ | Never underestimate your opponent. | Ne sous-estime jamais ton adversaire.
to untie | dénouer, détacher | v | B2 | /ʌnˈtaɪ/ | Untie your shoelaces. | Défais tes lacets.
to usher | faire entrer, conduire | v | C1 | /ˈʌʃə/ | We were ushered into the room. | On nous a fait entrer dans la pièce.
to vibrate | vibrer | v | B2 | /vaɪˈbreɪt/ | My phone vibrated in my pocket. | Mon téléphone a vibré dans ma poche.
to weaken | affaiblir | v | B2 | /ˈwiːkən/ | The illness weakened him. | La maladie l'a affaibli.
to whip | fouetter | v | B2 | /wɪp/ | Whip the cream until thick. | Fouette la crème jusqu'à ce qu'elle épaississe.
to widen | élargir | v | B2 | /ˈwaɪdn/ | They're widening the road. | Ils élargissent la route.
to worsen | empirer, s'aggraver | v | B2 | /ˈwɜːsn/ | His health worsened in the winter. | Sa santé s'est aggravée pendant l'hiver.
to opt | opter, choisir | v | C1 | /ɒpt/ | Many students opt for science. | Beaucoup d'élèves optent pour les sciences.
to incorporate | intégrer, incorporer | v | C1 | /ɪnˈkɔːpəreɪt/ | We incorporated your suggestions. | Nous avons intégré tes suggestions.
to creep | ramper ; avancer furtivement | v | B2 | /kriːp/ | The cat crept towards the bird. | Le chat s'approchait furtivement de l'oiseau.
to disclose | révéler, divulguer | v | C1 | /dɪsˈkləʊz/ | He refused to disclose his name. | Il a refusé de révéler son nom.
to coordinate | coordonner | v | B2 | /kəʊˈɔːdɪneɪt/ | She coordinates the volunteers. | Elle coordonne les bénévoles.
to drift | dériver | v | C1 | /drɪft/ | The boat drifted out to sea. | Le bateau a dérivé vers le large.
to curb | freiner, limiter | v | C1 | /kɜːb/ | We must curb our spending. | Nous devons limiter nos dépenses.
to gamble | jouer (de l'argent) ; parier | v | B2 | /ˈɡæmbl/ | He gambled all his savings. | Il a joué toutes ses économies.
to forge | forger ; contrefaire | v | C1 | /fɔːdʒ/ | They forged a strong friendship. | Ils ont noué une solide amitié.
to activate | activer | v | B2 | /ˈæktɪveɪt/ | Activate your account by email. | Active ton compte par e-mail.
to foil | déjouer | v | C1 | /fɔɪl/ | Police foiled the robbery. | La police a déjoué le cambriolage.
to beware | se méfier de, prendre garde | v | B2 | /bɪˈweə/ | Beware of the dog! | Attention au chien !
to comprehend | comprendre, saisir | v | C1 | /ˌkɒmprɪˈhend/ | No mind can comprehend God fully. | Aucun esprit ne peut comprendre Dieu entièrement.
to peek | jeter un coup d'œil | v | B2 | /piːk/ | No peeking at the answers! | On ne regarde pas les réponses !
to manifest | manifester | v | C2 | /ˈmænɪfest/ | His anger manifested itself in silence. | Sa colère s'est manifestée par le silence.
to lure | attirer, appâter | v | C1 | /lʊə/ | Low prices lure customers. | Les prix bas attirent les clients.
to rant | fulminer, déblatérer | v | C1 | /rænt/ | He ranted about the government for an hour. | Il a fulminé contre le gouvernement pendant une heure.
to erase | effacer | v | B2 | /ɪˈreɪz/ | Erase the board, please. | Efface le tableau, s'il te plaît.
to shove | pousser, bousculer | v | B2 | /ʃʌv/ | Don't shove! Wait your turn. | Ne pousse pas ! Attends ton tour.
to tilt | pencher, incliner | v | C1 | /tɪlt/ | She tilted her head to one side. | Elle a penché la tête sur le côté.
to sway | se balancer ; influencer | v | C1 | /sweɪ/ | The trees swayed in the wind. | Les arbres se balançaient dans le vent.
to binge | se goinfrer, faire des excès | v | C1 | /bɪndʒ/ | Don't binge on sweets. | Ne te goinfre pas de bonbons.
to chant | scander, psalmodier | v | C1 | /tʃɑːnt/ | The crowd chanted his name. | La foule scandait son nom.
to poke | piquer, donner un petit coup | v | B2 | /pəʊk/ | Stop poking me! | Arrête de me donner des petits coups !
to bluff | bluffer | v | C1 | /blʌf/ | He's only bluffing. | Il bluffe, c'est tout.
to drip | goutter, dégouliner | v | B2 | /drɪp/ | The tap is dripping. | Le robinet goutte.
to swipe | glisser (le doigt) ; chiper | v | B2 | /swaɪp/ | Swipe left to delete the message. | Glisse vers la gauche pour supprimer le message.
to dwell | demeurer ; s'attarder sur | v | C1 | /dwel/ | Don't dwell on the past. | Ne t'attarde pas sur le passé.
to intercept | intercepter | v | C1 | /ˌɪntəˈsept/ | The police intercepted the message. | La police a intercepté le message.
to rue | regretter amèrement | v | C2 | /ruː/ | He will rue the day he lied. | Il regrettera amèrement le jour où il a menti.
to garner | recueillir, obtenir | v | C2 | /ˈɡɑːnə/ | The film garnered great reviews. | Le film a recueilli d'excellentes critiques.
to puff | souffler, haleter | v | C1 | /pʌf/ | He was puffing after the climb. | Il soufflait après la montée.
to replicate | reproduire | v | C2 | /ˈreplɪkeɪt/ | Scientists couldn't replicate the results. | Les scientifiques n'ont pas pu reproduire les résultats.
to tuck | rentrer, border | v | B2 | /tʌk/ | Tuck your shirt in. | Rentre ta chemise.
to administer | administrer, gérer | v | C1 | /ədˈmɪnɪstə/ | The nurse administered the drug. | L'infirmière a administré le médicament.
to stash | planquer, cacher | v | C1 | /stæʃ/ | He stashed the money under the bed. | Il a planqué l'argent sous le lit.
to snatch | arracher, saisir | v | C1 | /snætʃ/ | A thief snatched her bag. | Un voleur lui a arraché son sac.
to harden | durcir, endurcir | v | C1 | /ˈhɑːdn/ | Don't let your heart harden. | Ne laisse pas ton cœur s'endurcir.
to empower | donner du pouvoir, autonomiser | v | C1 | /ɪmˈpaʊə/ | Knowledge empowers people. | Le savoir donne du pouvoir aux gens.
to pivot | pivoter | v | C2 | /ˈpɪvət/ | The company pivoted to online sales. | L'entreprise s'est réorientée vers la vente en ligne.
to cling | s'accrocher | v | C1 | /klɪŋ/ | Small children cling to their mothers. | Les petits enfants s'accrochent à leur mère.
to cleanse | purifier, nettoyer | v | C1 | /klenz/ | Ablution cleanses the body before prayer. | Les ablutions purifient le corps avant la prière.
to consolidate | consolider | v | C1 | /kənˈsɒlɪdeɪt/ | The team consolidated its lead. | L'équipe a consolidé son avance.
to rethink | repenser, reconsidérer | v | C1 | /ˌriːˈθɪŋk/ | We need to rethink our strategy. | Nous devons repenser notre stratégie.
to heed | tenir compte de | v | C2 | /hiːd/ | He didn't heed my warning. | Il n'a pas tenu compte de mon avertissement.
to muster | rassembler | v | C2 | /ˈmʌstə/ | She mustered the courage to speak. | Elle a rassemblé son courage pour parler.
to override | outrepasser, annuler | v | C2 | /ˌəʊvəˈraɪd/ | Safety overrides all other concerns. | La sécurité prime sur toute autre considération.
to reopen | rouvrir | v | B2 | /riˈəʊpən/ | The museum will reopen next month. | Le musée rouvrira le mois prochain.
to insure | assurer | v | B2 | /ɪnˈʃʊə/ | Insure your house against fire. | Assure ta maison contre l'incendie.
to validate | valider | v | C1 | /ˈvælɪdeɪt/ | Validate your ticket before boarding. | Valide ton billet avant de monter.
to err | se tromper | v | C2 | /ɜː/ | To err is human. | L'erreur est humaine.
to evade | esquiver, échapper à | v | C1 | /ɪˈveɪd/ | He evaded the question. | Il a esquivé la question.
to designate | désigner | v | C1 | /ˈdezɪɡneɪt/ | This area is designated for prayer. | Cet espace est réservé à la prière.
to loosen | desserrer | v | B2 | /ˈluːsn/ | Loosen your tie. | Desserre ta cravate.
to moan | gémir ; se plaindre | v | B2 | /məʊn/ | Stop moaning about the weather! | Arrête de te plaindre du temps !
to fumble | tâtonner, fouiller maladroitement | v | C1 | /ˈfʌmbl/ | He fumbled for his keys. | Il cherchait ses clés à tâtons.
to overrun | envahir ; dépasser | v | C2 | /ˌəʊvəˈrʌn/ | The garden is overrun with weeds. | Le jardin est envahi de mauvaises herbes.
to soften | adoucir, ramollir | v | B2 | /ˈsɒfn/ | Soften the butter before using it. | Fais ramollir le beurre avant de l'utiliser.
to marvel | s'émerveiller | v | C1 | /ˈmɑːvl/ | We marvelled at the stars. | Nous nous sommes émerveillés devant les étoiles.
to compel | contraindre, obliger | v | C1 | /kəmˈpel/ | There is no compulsion in religion. | Nul ne peut être contraint en religion.
to congregate | se rassembler | v | C1 | /ˈkɒŋɡrɪɡeɪt/ | People congregate at the mosque on Fridays. | Les gens se rassemblent à la mosquée le vendredi.
to stoke | attiser, alimenter | v | C1 | /stəʊk/ | His words stoked the anger of the crowd. | Ses paroles ont attisé la colère de la foule.
to suffice | suffire | v | C1 | /səˈfaɪs/ | A short answer will suffice. | Une réponse courte suffira.
to formulate | formuler | v | C1 | /ˈfɔːmjuleɪt/ | Formulate your question clearly. | Formule clairement ta question.
to rediscover | redécouvrir | v | C1 | /ˌriːdɪˈskʌvə/ | She rediscovered her love of reading. | Elle a redécouvert son amour de la lecture.
to brainwash | faire un lavage de cerveau | v | C1 | /ˈbreɪnwɒʃ/ | The cult brainwashed its members. | La secte a fait un lavage de cerveau à ses membres.
to malfunction | mal fonctionner | v | C1 | /ˌmælˈfʌŋkʃn/ | The machine malfunctioned. | La machine est tombée en panne.
to con | arnaquer | v | C1 | /kɒn/ | He conned old people out of their savings. | Il a escroqué des personnes âgées de leurs économies.
to exert | exercer | v | C1 | /ɪɡˈzɜːt/ | Parents exert a strong influence. | Les parents exercent une forte influence.
to detest | détester | v | C1 | /dɪˈtest/ | I detest hypocrisy. | Je déteste l'hypocrisie.
to prowl | rôder | v | C1 | /praʊl/ | A fox prowled around the farm. | Un renard rôdait autour de la ferme.
to re-enact | reconstituer | v | C1 | /ˌriːɪˈnækt/ | They re-enacted the famous battle. | Ils ont reconstitué la célèbre bataille.
to wrangle | se disputer, se chamailler | v | C1 | /ˈræŋɡl/ | They wrangled over the price for hours. | Ils se sont disputés sur le prix pendant des heures.
to pertain to | concerner, se rapporter à | v | C1 | /pəˈteɪn tə/ | These rules pertain to all students. | Ces règles concernent tous les élèves.
to resonate | résonner, trouver un écho | v | C1 | /ˈrezəneɪt/ | His words resonated with the audience. | Ses paroles ont trouvé un écho auprès du public.
to align | aligner | v | C1 | /əˈlaɪn/ | Align the text on the left. | Aligne le texte à gauche.
to alienate | aliéner, éloigner | v | C1 | /ˈeɪliəneɪt/ | His rudeness alienated his friends. | Sa grossièreté a éloigné ses amis.
to harass | harceler | v | C1 | /ˈhærəs/ | He was harassed by journalists. | Il était harcelé par les journalistes.
to persecute | persécuter | v | C1 | /ˈpɜːsɪkjuːt/ | The early Muslims were persecuted in Mecca. | Les premiers musulmans ont été persécutés à La Mecque.
to crumble | s'effriter, s'écrouler | v | C1 | /ˈkrʌmbl/ | The old walls are crumbling. | Les vieux murs s'effritent.
to evoke | évoquer | v | C1 | /ɪˈvəʊk/ | The smell evoked memories of childhood. | L'odeur évoquait des souvenirs d'enfance.
to repel | repousser | v | C1 | /rɪˈpel/ | This spray repels mosquitoes. | Ce spray repousse les moustiques.
to dither | hésiter, tergiverser | v | C1 | /ˈdɪðə/ | Stop dithering and decide! | Arrête de tergiverser et décide-toi !
to forfeit | perdre, renoncer à | v | C1 | /ˈfɔːfɪt/ | If you leave now, you forfeit your deposit. | Si tu pars maintenant, tu perds ta caution.
to twitch | se contracter nerveusement | v | C1 | /twɪtʃ/ | His eye twitched. | Il avait un tic à l'œil.
to immortalise | immortaliser | v | C1 | /ɪˈmɔːtəlaɪz/ | The poem immortalised the battle. | Le poème a immortalisé la bataille.
to dispense | distribuer ; se dispenser de | v | C1 | /dɪˈspens/ | The machine dispenses hot drinks. | La machine distribue des boissons chaudes.
to diverge | diverger | v | C1 | /daɪˈvɜːdʒ/ | Our opinions diverge on this point. | Nos avis divergent sur ce point.
to discard | jeter, se débarrasser de | v | C1 | /dɪˈskɑːd/ | Discard the packaging after use. | Jette l'emballage après usage.
to stiffen | (se) raidir | v | C1 | /ˈstɪfn/ | His body stiffened with fear. | Son corps s'est raidi de peur.
to flatter | flatter | v | C1 | /ˈflætə/ | Don't try to flatter me. | N'essaie pas de me flatter.
to elevate | élever | v | C1 | /ˈelɪveɪt/ | Good manners elevate a person. | Les bonnes manières élèvent une personne.
to profess | professer, prétendre | v | C1 | /prəˈfes/ | He professes to be an expert. | Il prétend être un expert.
to loom | se profiler, menacer | v | C1 | /luːm/ | Exams are looming. | Les examens approchent dangereusement.
to impersonate | se faire passer pour ; imiter | v | C1 | /ɪmˈpɜːsəneɪt/ | He impersonated a police officer. | Il s'est fait passer pour un policier.
to gape | rester bouche bée | v | C1 | /ɡeɪp/ | The tourists gaped at the huge mosque. | Les touristes restaient bouche bée devant l'immense mosquée.
to commend | louer, recommander | v | C1 | /kəˈmend/ | The judge commended her courage. | Le juge a salué son courage.
to flick | donner une chiquenaude ; feuilleter | v | C1 | /flɪk/ | She flicked through the magazine. | Elle a feuilleté le magazine.
to conjure up | évoquer, faire apparaître | v | C1 | /ˈkʌndʒər ʌp/ | The music conjures up images of the desert. | La musique évoque des images du désert.
to interject | intervenir, interrompre | v | C1 | /ˌɪntəˈdʒekt/ | "That's not true," she interjected. | « Ce n'est pas vrai », intervint-elle.
to gush | jaillir ; s'extasier | v | C1 | /ɡʌʃ/ | Water gushed from the pipe. | L'eau jaillissait du tuyau.
to salvage | récupérer, sauver | v | C1 | /ˈsælvɪdʒ/ | They salvaged what they could from the fire. | Ils ont récupéré ce qu'ils pouvaient de l'incendie.
to tangle | emmêler | v | C1 | /ˈtæŋɡl/ | The wind tangled her hair. | Le vent a emmêlé ses cheveux.
to untangle | démêler | v | C1 | /ʌnˈtæŋɡl/ | Can you untangle this rope? | Tu peux démêler cette corde ?
to render | rendre ; fournir | v | C1 | /ˈrendə/ | The news rendered him speechless. | La nouvelle l'a laissé sans voix.
to personalise | personnaliser | v | C1 | /ˈpɜːsənəlaɪz/ | You can personalise your profile. | Tu peux personnaliser ton profil.
to misplace | égarer | v | C1 | /ˌmɪsˈpleɪs/ | I've misplaced my glasses. | J'ai égaré mes lunettes.
to wrench | arracher, tordre | v | C1 | /rentʃ/ | He wrenched the door open. | Il a ouvert la porte d'un coup sec.
to scoff | se moquer | v | C1 | /skɒf/ | They scoffed at his ideas. | Ils se sont moqués de ses idées.
to fiddle | tripoter ; jouer du violon | v | C1 | /ˈfɪdl/ | Stop fiddling with your phone! | Arrête de tripoter ton téléphone !
to daunt | intimider, décourager | v | C1 | /dɔːnt/ | She was not daunted by the task. | La tâche ne l'a pas découragée.
to envisage | envisager | v | C1 | /ɪnˈvɪzɪdʒ/ | I don't envisage any problems. | Je ne prévois aucun problème.
to churn | baratter ; brasser | v | C2 | /tʃɜːn/ | They churned milk to make butter. | Ils barattaient le lait pour faire du beurre.
to transfix | pétrifier, clouer sur place | v | C2 | /trænsˈfɪks/ | She was transfixed by the view. | Elle était fascinée par la vue.
to dislodge | déloger, détacher | v | C1 | /dɪsˈlɒdʒ/ | The wind dislodged a tile. | Le vent a délogé une tuile.
to circulate | circuler, faire circuler | v | C1 | /ˈsɜːkjəleɪt/ | Rumours circulate quickly. | Les rumeurs circulent vite.
to rotate | tourner ; alterner | v | C1 | /rəʊˈteɪt/ | The Earth rotates once a day. | La Terre tourne sur elle-même une fois par jour.
to squander | gaspiller, dilapider | v | C1 | /ˈskwɒndə/ | Don't squander your time. | Ne gaspille pas ton temps.
to retrace | retracer, revenir sur | v | C1 | /rɪˈtreɪs/ | We retraced our steps to find the keys. | Nous sommes revenus sur nos pas pour retrouver les clés.
to embark | embarquer ; se lancer | v | C1 | /ɪmˈbɑːk/ | She embarked on a new career. | Elle s'est lancée dans une nouvelle carrière.
to plunge | plonger | v | C1 | /plʌndʒ/ | Prices plunged overnight. | Les prix ont chuté du jour au lendemain.
to elude | échapper à | v | C1 | /iˈluːd/ | Sleep eluded me all night. | Le sommeil m'a fui toute la nuit.
to gnaw | ronger | v | C1 | /nɔː/ | The dog gnawed a bone. | Le chien rongeait un os.
to elongate | allonger | v | C2 | /ˈiːlɒŋɡeɪt/ | The shadows elongated in the evening. | Les ombres s'allongeaient le soir.
to rustle | bruisser, froisser | v | C1 | /ˈrʌsl/ | The leaves rustled in the wind. | Les feuilles bruissaient dans le vent.
to glean | glaner, recueillir | v | C1 | /ɡliːn/ | We gleaned information from old books. | Nous avons glané des informations dans de vieux livres.
to unsettle | perturber, déstabiliser | v | C1 | /ʌnˈsetl/ | The news unsettled the markets. | La nouvelle a déstabilisé les marchés.
to pounce | bondir, sauter sur | v | C1 | /paʊns/ | The cat pounced on the mouse. | Le chat a bondi sur la souris.
to abound | abonder | v | C1 | /əˈbaʊnd/ | Fish abound in these waters. | Les poissons abondent dans ces eaux.
to neutralise | neutraliser | v | C1 | /ˈnjuːtrəlaɪz/ | The acid was neutralised. | L'acide a été neutralisé.
to salivate | saliver | v | C2 | /ˈsælɪveɪt/ | The smell of bread made me salivate. | L'odeur du pain m'a fait saliver.
to heighten | accroître, intensifier | v | C1 | /ˈhaɪtn/ | The music heightened the tension. | La musique a intensifié la tension.
to exude | dégager, respirer (une qualité) | v | C2 | /ɪɡˈzjuːd/ | She exudes confidence. | Elle respire la confiance.
to unravel | démêler, élucider ; se défaire | v | C2 | /ʌnˈrævl/ | Detectives unravelled the mystery. | Les enquêteurs ont élucidé le mystère.
to teem with | grouiller de | v | C2 | /ˈtiːm wɪð/ | The river teems with fish. | La rivière grouille de poissons.
to enthuse | s'enthousiasmer | v | C2 | /ɪnˈθjuːz/ | He enthused about his trip to Istanbul. | Il s'enthousiasmait pour son voyage à Istanbul.
to shamble | marcher en traînant les pieds | v | C2 | /ˈʃæmbl/ | The old man shambled along the road. | Le vieil homme avançait en traînant les pieds.
to whirr | ronronner, vrombir | v | C2 | /wɜː/ | The fan whirred quietly. | Le ventilateur ronronnait doucement.
to encumber | encombrer, entraver | v | C2 | /ɪnˈkʌmbə/ | Don't encumber yourself with luggage. | Ne t'encombre pas de bagages.
to laud | louer, faire l'éloge de | v | C2 | /lɔːd/ | Critics lauded the film. | Les critiques ont fait l'éloge du film.
to allot | attribuer, allouer | v | C2 | /əˈlɒt/ | Each speaker is allotted ten minutes. | Chaque intervenant dispose de dix minutes.
to brandish | brandir | v | C2 | /ˈbrændɪʃ/ | He brandished a knife. | Il brandissait un couteau.
to overlay | recouvrir, superposer | v | C2 | /ˌəʊvəˈleɪ/ | The wood is overlaid with gold. | Le bois est recouvert d'or.
to diffuse | diffuser, répandre | v | C2 | /dɪˈfjuːz/ | The light was diffused by the curtains. | La lumière était tamisée par les rideaux.
to materialise | se concrétiser | v | C2 | /məˈtɪəriəlaɪz/ | The promised help never materialised. | L'aide promise ne s'est jamais concrétisée.
to disperse | disperser, se disperser | v | C2 | /dɪˈspɜːs/ | The crowd dispersed slowly. | La foule s'est dispersée lentement.
to stabilise | stabiliser | v | C1 | /ˈsteɪbəlaɪz/ | The patient's condition has stabilised. | L'état du patient s'est stabilisé.
to succumb | succomber | v | C2 | /səˈkʌm/ | He succumbed to temptation. | Il a succombé à la tentation.
to glory in | se glorifier de, savourer | v | C2 | /ˈɡlɔːri ɪn/ | He gloried in his success. | Il savourait son succès.
to prolong | prolonger | v | C2 | /prəˈlɒŋ/ | Don't prolong the agony. | Ne prolonge pas le supplice.
to pressurise | faire pression sur | v | C2 | /ˈpreʃəraɪz/ | Don't let them pressurise you. | Ne te laisse pas mettre la pression.
to frolic | gambader | v | C2 | /ˈfrɒlɪk/ | Lambs frolicked in the field. | Des agneaux gambadaient dans le pré.
to sidestep | éluder, esquiver | v | C2 | /ˈsaɪdstep/ | He sidestepped the question. | Il a éludé la question.
to correlate | être en corrélation | v | C2 | /ˈkɒrəleɪt/ | Income correlates with health. | Le revenu est corrélé à la santé.
to mesh | s'accorder, s'engrener | v | C2 | /meʃ/ | Their ideas didn't mesh. | Leurs idées ne concordaient pas.
to perch | se percher | v | C2 | /pɜːtʃ/ | A bird perched on the minaret. | Un oiseau s'est perché sur le minaret.
to solicit | solliciter | v | C2 | /səˈlɪsɪt/ | They solicited donations for the mosque. | Ils ont sollicité des dons pour la mosquée.
to herald | annoncer | v | C2 | /ˈherəld/ | The crescent heralds the start of Ramadan. | Le croissant de lune annonce le début du ramadan.
to induce | provoquer, inciter | v | C2 | /ɪnˈdjuːs/ | The drug may induce sleep. | Le médicament peut provoquer le sommeil.
to rebound | rebondir | v | C2 | /rɪˈbaʊnd/ | The ball rebounded off the wall. | La balle a rebondi sur le mur.
to unnerve | déstabiliser, troubler | v | C2 | /ˌʌnˈnɜːv/ | The silence unnerved him. | Le silence le troublait.
to protrude | dépasser, saillir | v | C2 | /prəˈtruːd/ | A nail protruded from the wall. | Un clou dépassait du mur.
to demystify | démystifier | v | C2 | /ˌdiːˈmɪstɪfaɪ/ | The book demystifies Islamic finance. | Le livre démystifie la finance islamique.
to topple | renverser, basculer | v | C2 | /ˈtɒpl/ | The protests toppled the government. | Les manifestations ont renversé le gouvernement.
to clinch | décrocher, conclure | v | C2 | /klɪntʃ/ | They clinched the deal. | Ils ont conclu l'affaire.
to splinter | se fendre, éclater | v | C2 | /ˈsplɪntə/ | The wood splintered. | Le bois a éclaté.
to reproach | reprocher | v | C2 | /rɪˈprəʊtʃ/ | She reproached him for his laziness. | Elle lui a reproché sa paresse.
to dissemble | dissimuler | v | C2 | /dɪˈsembl/ | He tried to dissemble his fear. | Il tentait de dissimuler sa peur.
to mangle | broyer, mutiler | v | C2 | /ˈmæŋɡl/ | The car was mangled in the crash. | La voiture a été broyée dans l'accident.
to stultify | abrutir, étouffer | v | C2 | /ˈstʌltɪfaɪ/ | Routine can stultify the mind. | La routine peut abrutir l'esprit.
to wallow | se vautrer, se complaire | v | C2 | /ˈwɒləʊ/ | Don't wallow in self-pity. | Ne te complais pas dans l'apitoiement sur toi-même.
to wane | décliner | v | C2 | /weɪn/ | His popularity is waning. | Sa popularité décline.
to detract from | diminuer, nuire à | v | C2 | /dɪˈtrækt frəm/ | The mistakes don't detract from the book's value. | Les erreurs n'enlèvent rien à la valeur du livre.
to deprecate | désapprouver | v | C2 | /ˈdeprəkeɪt/ | He deprecates violence of any kind. | Il désapprouve toute forme de violence.
to revile | injurier, vilipender | v | C2 | /rɪˈvaɪl/ | He was reviled by the press. | Il a été vilipendé par la presse.
to flit | voleter | v | C2 | /flɪt/ | Butterflies flitted among the flowers. | Des papillons voletaient parmi les fleurs.
to emulate | imiter, prendre pour modèle | v | C2 | /ˈemjuleɪt/ | Muslims try to emulate the Prophet. | Les musulmans s'efforcent de suivre l'exemple du Prophète.
to disparage | dénigrer | v | C2 | /dɪˈspærɪdʒ/ | Don't disparage other religions. | Ne dénigre pas les autres religions.
to huddle | se blottir | v | C2 | /ˈhʌdl/ | We huddled around the fire. | Nous nous sommes blottis autour du feu.
to contrive | combiner, réussir à | v | C2 | /kənˈtraɪv/ | She contrived to meet him. | Elle s'est arrangée pour le rencontrer.
to gravitate | graviter, être attiré | v | C2 | /ˈɡrævɪteɪt/ | Young people gravitate towards cities. | Les jeunes sont attirés par les villes.
to adhere to | adhérer à, respecter | v | C2 | /ədˈhɪə tə/ | We must adhere to the rules. | Nous devons respecter les règles.
to prise | forcer (pour ouvrir) | v | C2 | /praɪz/ | He prised open the box. | Il a forcé la boîte.
to consign | reléguer ; confier | v | C2 | /kənˈsaɪn/ | The old books were consigned to the attic. | Les vieux livres ont été relégués au grenier.
to edify | édifier (moralement) | v | C2 | /ˈedɪfaɪ/ | These stories are meant to edify. | Ces histoires visent à édifier.
to romp | s'ébattre ; gagner haut la main | v | C2 | /rɒmp/ | The children romped in the garden. | Les enfants s'ébattaient dans le jardin.
to ingratiate oneself | s'insinuer dans les bonnes grâces | v | C2 | /ɪnˈɡreɪʃieɪt wʌnself/ | He tried to ingratiate himself with the boss. | Il essayait de s'attirer les bonnes grâces du patron.
to shimmer | miroiter, chatoyer | v | C2 | /ˈʃɪmə/ | The sea shimmered in the moonlight. | La mer miroitait au clair de lune.
to swivel | pivoter | v | C2 | /ˈswɪvl/ | She swivelled round in her chair. | Elle a pivoté sur sa chaise.
to quiver | frémir, trembler | v | C2 | /ˈkwɪvə/ | Her voice quivered with emotion. | Sa voix tremblait d'émotion.
to dampen | humidifier ; refroidir (l'enthousiasme) | v | C2 | /ˈdæmpən/ | The rain didn't dampen our spirits. | La pluie n'a pas entamé notre moral.
to singe | roussir | v | C2 | /sɪndʒ/ | The iron singed my shirt. | Le fer a roussi ma chemise.
to embed | encastrer, intégrer | v | C2 | /ɪmˈbed/ | The values are embedded in our culture. | Ces valeurs sont ancrées dans notre culture.
to brim with | déborder de | v | C2 | /ˈbrɪm wɪð/ | Her eyes brimmed with tears. | Ses yeux étaient pleins de larmes.
to resound | résonner, retentir | v | C2 | /rɪˈzaʊnd/ | The call to prayer resounded through the city. | L'appel à la prière résonnait dans toute la ville.
to suffuse | baigner, envahir | v | C2 | /səˈfjuːz/ | Light suffused the room. | La lumière baignait la pièce.
to totter | chanceler | v | C2 | /ˈtɒtə/ | The baby tottered across the room. | Le bébé a traversé la pièce d'un pas chancelant.
to abhor | abhorrer, avoir horreur de | v | C2 | /əbˈhɔː/ | God abhors injustice. | Dieu a horreur de l'injustice.
to feign | feindre | v | C2 | /feɪn/ | He feigned illness to miss school. | Il a feint d'être malade pour manquer l'école.
to cosset | dorloter | v | C2 | /ˈkɒsɪt/ | She cosseted her children. | Elle dorlotait ses enfants.
to banish | bannir, exiler | v | C2 | /ˈbænɪʃ/ | Banish such thoughts from your mind. | Chasse ces pensées de ton esprit.
to tantalise | tenter, faire miroiter | v | C2 | /ˈtæntəlaɪz/ | The smell of food tantalised us. | L'odeur de la nourriture nous mettait l'eau à la bouche.
to collide | entrer en collision | v | C2 | /kəˈlaɪd/ | Two cars collided at the junction. | Deux voitures sont entrées en collision au carrefour.
to interweave | entrelacer | v | C2 | /ˌɪntəˈwiːv/ | The novel interweaves several stories. | Le roman entrelace plusieurs histoires.
to hamper | entraver, gêner | v | C2 | /ˈhæmpə/ | Bad weather hampered the rescue. | Le mauvais temps a entravé les secours.
to assimilate | assimiler | v | C2 | /əˈsɪməleɪt/ | It takes time to assimilate new ideas. | Il faut du temps pour assimiler de nouvelles idées.
to intersperse | parsemer, entrecouper | v | C2 | /ˌɪntəˈspɜːs/ | The talk was interspersed with jokes. | La conférence était entrecoupée de blagues.
to coax | amadouer, persuader | v | C2 | /kəʊks/ | She coaxed the cat out of the tree. | Elle a persuadé le chat de descendre de l'arbre.
to hoist | hisser | v | C2 | /hɔɪst/ | They hoisted the flag. | Ils ont hissé le drapeau.
to ruminate | ruminer, méditer | v | C2 | /ˈruːmɪneɪt/ | He ruminated on the meaning of life. | Il méditait sur le sens de la vie.
to squirm | se tortiller ; être mal à l'aise | v | C2 | /skwɜːm/ | The question made him squirm. | La question l'a mis mal à l'aise.
to embody | incarner | v | C2 | /ɪmˈbɒdi/ | The Prophet embodied the teachings of the Qur'an. | Le Prophète incarnait les enseignements du Coran.
to skew | fausser | v | C2 | /skjuː/ | The small sample skewed the results. | L'échantillon réduit a faussé les résultats.
to subsist | subsister | v | C2 | /səbˈsɪst/ | They subsisted on bread and dates. | Ils subsistaient avec du pain et des dattes.
to adulterate | frelater | v | C2 | /əˈdʌltəreɪt/ | The honey was adulterated with sugar. | Le miel était frelaté avec du sucre.
to patronise | traiter avec condescendance | v | C2 | /ˈpætrənaɪz/ | Don't patronise me! | Ne me prends pas de haut !
to deaden | atténuer, amortir | v | C2 | /ˈdedn/ | The drug deadened the pain. | Le médicament a atténué la douleur.
to reverberate | résonner, se répercuter | v | C2 | /rɪˈvɜːbəreɪt/ | His voice reverberated in the hall. | Sa voix résonnait dans la salle.
to remonstrate | protester | v | C2 | /ˈremənstreɪt/ | He remonstrated with the referee. | Il a protesté auprès de l'arbitre.
to escalate | s'intensifier, dégénérer | v | C1 | /ˈeskəleɪt/ | The conflict escalated quickly. | Le conflit s'est rapidement intensifié.
to pinpoint | localiser précisément, cerner | v | C1 | /ˈpɪnpɔɪnt/ | Can you pinpoint the problem? | Peux-tu cerner le problème précisément ?
to revert | revenir (à un état antérieur) | v | C2 | /rɪˈvɜːt/ | He reverted to his old habits. | Il est revenu à ses vieilles habitudes.
to vie | rivaliser | v | C2 | /vaɪ/ | The two teams vied for first place. | Les deux équipes se disputaient la première place.
to inflict | infliger | v | C1 | /ɪnˈflɪkt/ | The storm inflicted heavy damage. | La tempête a infligé de lourds dégâts.
to fling | lancer, jeter | v | C2 | /flɪŋ/ | Don't fling your clothes on the floor. | Ne jette pas tes vêtements par terre.
to nip | pincer ; faire un saut | v | C1 | /nɪp/ | I'll nip to the shop for some bread. | Je fais un saut au magasin pour du pain.
to perish | périr | v | C2 | /ˈperɪʃ/ | Everything on earth will perish. | Tout ce qui est sur terre périra.
to relish | savourer | v | C1 | /ˈrelɪʃ/ | He relished the challenge. | Il a savouré le défi.
to shred | déchiqueter ; râper | v | C1 | /ʃred/ | Shred the documents before throwing them away. | Déchiquette les documents avant de les jeter.
to intimidate | intimider | v | C1 | /ɪnˈtɪmɪdeɪt/ | Don't let him intimidate you. | Ne te laisse pas intimider par lui.
to ascertain | établir, s'assurer de | v | C2 | /ˌæsəˈteɪn/ | The police are trying to ascertain the facts. | La police tente d'établir les faits.
to whine | geindre, pleurnicher | v | C1 | /waɪn/ | Stop whining and do your homework! | Arrête de pleurnicher et fais tes devoirs !
to withhold | retenir, refuser | v | C2 | /wɪðˈhəʊld/ | Never withhold important information. | Ne dissimule jamais des informations importantes.
to fret | se tracasser | v | C2 | /fret/ | Don't fret, it will be fine. | Ne te tracasse pas, tout ira bien.
to tweak | peaufiner, ajuster | v | C1 | /twiːk/ | We tweaked the design a little. | Nous avons légèrement ajusté le design.
to wiggle | remuer, tortiller | v | C1 | /ˈwɪɡl/ | Wiggle your toes. | Remue tes orteils.
to attest to | attester, témoigner de | v | C2 | /əˈtest tə/ | The ruins attest to a great civilisation. | Les ruines témoignent d'une grande civilisation.
to avenge | venger | v | C2 | /əˈvendʒ/ | He swore to avenge his brother. | Il a juré de venger son frère.
to brighten | égayer, s'éclaircir | v | C1 | /ˈbraɪtn/ | Flowers brighten up the room. | Les fleurs égaient la pièce.
to fathom | comprendre, sonder | v | C2 | /ˈfæðəm/ | I can't fathom why he did it. | Je n'arrive pas à comprendre pourquoi il l'a fait.
to prod | piquer, inciter | v | C2 | /prɒd/ | She prodded him to apologise. | Elle l'a poussé à s'excuser.
to stomp | marcher d'un pas lourd | v | C1 | /stɒmp/ | He stomped out of the room. | Il est sorti de la pièce d'un pas rageur.
to ascend | monter, s'élever | v | C2 | /əˈsend/ | They ascended the mountain at dawn. | Ils ont gravi la montagne à l'aube.
to relive | revivre | v | C1 | /ˌriːˈlɪv/ | He relives the accident in his dreams. | Il revit l'accident dans ses rêves.
to seduce | séduire | v | C1 | /sɪˈdjuːs/ | Don't be seduced by easy money. | Ne te laisse pas séduire par l'argent facile.
to shun | fuir, éviter | v | C2 | /ʃʌn/ | He shuns publicity. | Il fuit la publicité.
to budge | bouger, céder | v | C1 | /bʌdʒ/ | The door wouldn't budge. | La porte ne voulait pas bouger.
to downgrade | rétrograder, déclasser | v | C2 | /ˌdaʊnˈɡreɪd/ | The storm was downgraded. | La tempête a été déclassée.
to partake | prendre part ; partager (un repas) | v | C2 | /pɑːˈteɪk/ | They invited us to partake of the meal. | Ils nous ont invités à partager le repas.
to enlighten | éclairer, instruire | v | C2 | /ɪnˈlaɪtn/ | Can you enlighten me on this subject? | Peux-tu m'éclairer sur ce sujet ?
to reconstruct | reconstruire, reconstituer | v | C1 | /ˌriːkənˈstrʌkt/ | Police reconstructed the crime. | La police a reconstitué le crime.
to squirt | gicler, faire gicler | v | C1 | /skwɜːt/ | He squirted water at his brother. | Il a aspergé son frère d'eau.
to entail | impliquer, entraîner | v | C2 | /ɪnˈteɪl/ | The job entails a lot of travel. | Le poste implique beaucoup de déplacements.
to trot | trotter | v | C1 | /trɒt/ | The horse trotted along the road. | Le cheval trottait le long de la route.
to wield | manier ; exercer (le pouvoir) | v | C2 | /wiːld/ | The king wielded great power. | Le roi exerçait un grand pouvoir.
to affirm | affirmer | v | C2 | /əˈfɜːm/ | He affirmed his belief in one God. | Il a affirmé sa foi en un Dieu unique.
to appease | apaiser | v | C2 | /əˈpiːz/ | They tried to appease the angry crowd. | Ils ont tenté d'apaiser la foule en colère.
to enlarge | agrandir | v | B2 | /ɪnˈlɑːdʒ/ | Can you enlarge this photo? | Peux-tu agrandir cette photo ?
to equate | assimiler, mettre sur le même plan | v | C2 | /iˈkweɪt/ | Don't equate wealth with happiness. | N'assimile pas la richesse au bonheur.
to swoop | fondre sur, piquer | v | C2 | /swuːp/ | The eagle swooped on its prey. | L'aigle a fondu sur sa proie.
to confer | conférer ; s'entretenir | v | C2 | /kənˈfɜː/ | The judges conferred before deciding. | Les juges se sont concertés avant de décider.
to counteract | contrebalancer, neutraliser | v | C2 | /ˌkaʊntərˈækt/ | Exercise counteracts stress. | L'exercice contrebalance le stress.
to deepen | approfondir, s'approfondir | v | C1 | /ˈdiːpən/ | Reading deepens your knowledge. | La lecture approfondit tes connaissances.
to intersect | se croiser | v | C2 | /ˌɪntəˈsekt/ | The two roads intersect here. | Les deux routes se croisent ici.
to renounce | renoncer à, abjurer | v | C2 | /rɪˈnaʊns/ | He renounced his wealth. | Il a renoncé à sa fortune.
to dilute | diluer | v | C2 | /daɪˈluːt/ | Dilute the juice with water. | Dilue le jus avec de l'eau.
to streamline | rationaliser, simplifier | v | C2 | /ˈstriːmlaɪn/ | We need to streamline the process. | Nous devons simplifier la procédure.
to abate | diminuer, s'apaiser | v | C2 | /əˈbeɪt/ | The storm finally abated. | La tempête s'est enfin apaisée.
to abjure | abjurer, renier | v | C2 | /əbˈdʒʊə/ | He abjured violence. | Il a renoncé à la violence.
to abscond | s'enfuir, disparaître | v | C2 | /əbˈskɒnd/ | The treasurer absconded with the funds. | Le trésorier a disparu avec les fonds.
to belie | démentir, masquer | v | C2 | /bɪˈlaɪ/ | His smile belied his fear. | Son sourire masquait sa peur.
to burgeon | s'épanouir, croître rapidement | v | C2 | /ˈbɜːdʒən/ | The city's population burgeoned. | La population de la ville a explosé.
to cajole | enjôler, cajoler | v | C2 | /kəˈdʒəʊl/ | She cajoled him into helping. | Elle l'a persuadé de l'aider à force de cajoleries.
to castigate | fustiger | v | C2 | /ˈkæstɪɡeɪt/ | The report castigated the government. | Le rapport a fustigé le gouvernement.
to coalesce | s'unir, fusionner | v | C2 | /ˌkəʊəˈles/ | The groups coalesced into one movement. | Les groupes ont fusionné en un seul mouvement.
to confound | déconcerter ; confondre | v | C2 | /kənˈfaʊnd/ | The results confounded the experts. | Les résultats ont déconcerté les experts.
to debilitate | affaiblir, débiliter | v | C2 | /dɪˈbɪlɪteɪt/ | The illness debilitated him. | La maladie l'a affaibli.
to denigrate | dénigrer | v | C2 | /ˈdenɪɡreɪt/ | Don't denigrate other people's work. | Ne dénigre pas le travail des autres.
to digress | faire une digression | v | C2 | /daɪˈɡres/ | Sorry, I digress. | Pardon, je m'égare.
to enervate | affaiblir, épuiser | v | C2 | /ˈenəveɪt/ | The heat enervated us. | La chaleur nous a épuisés.
to extol | exalter, vanter | v | C2 | /ɪkˈstəʊl/ | He extolled the virtues of patience. | Il a vanté les vertus de la patience.
to mollify | apaiser, calmer | v | C2 | /ˈmɒlɪfaɪ/ | He tried to mollify his angry wife. | Il a essayé d'apaiser sa femme en colère.
to obfuscate | obscurcir, embrouiller | v | C2 | /ˈɒbfʌskeɪt/ | Politicians often obfuscate the truth. | Les politiciens obscurcissent souvent la vérité.
to palliate | pallier, atténuer | v | C2 | /ˈpælieɪt/ | The drug palliates the pain. | Le médicament atténue la douleur.
to renege | revenir sur (sa parole) | v | C2 | /rɪˈneɪɡ/ | He reneged on his promise. | Il est revenu sur sa promesse.
to vacillate | vaciller, hésiter | v | C2 | /ˈvæsəleɪt/ | He vacillated between two choices. | Il hésitait entre deux choix.
to vilify | calomnier, diffamer | v | C2 | /ˈvɪlɪfaɪ/ | The press vilified him. | La presse l'a calomnié.
to abase oneself | s'abaisser, s'humilier | v | C2 | /əˈbeɪs wʌnself/ | He refused to abase himself before the king. | Il a refusé de s'abaisser devant le roi.
to adumbrate | esquisser, annoncer | v | C2 | /ˈædʌmbreɪt/ | The report adumbrates future reforms. | Le rapport esquisse de futures réformes.
to aggrandise | agrandir, exalter | v | C2 | /əˈɡrændaɪz/ | He used his position to aggrandise himself. | Il s'est servi de sa position pour se mettre en valeur.
to amalgamate | fusionner, amalgamer | v | C2 | /əˈmælɡəmeɪt/ | The two schools were amalgamated. | Les deux écoles ont fusionné.
to appraise | évaluer, estimer | v | C2 | /əˈpreɪz/ | The jeweller appraised the ring. | Le bijoutier a estimé la bague.
to apprise | informer | v | C2 | /əˈpraɪz/ | Keep me apprised of any changes. | Tiens-moi informé de tout changement.
to assail | assaillir | v | C2 | /əˈseɪl/ | He was assailed by doubts. | Il était assailli de doutes.
to attenuate | atténuer | v | C2 | /əˈtenjueɪt/ | The walls attenuate the noise. | Les murs atténuent le bruit.
to avow | déclarer, avouer | v | C2 | /əˈvaʊ/ | He avowed his love for her. | Il lui a déclaré son amour.
to beguile | séduire, envoûter | v | C2 | /bɪˈɡaɪl/ | She was beguiled by his charm. | Elle a été séduite par son charme.
to belabour | s'étendre sur, ressasser | v | C2 | /bɪˈleɪbə/ | I won't belabour the point. | Je ne m'étendrai pas sur ce point.
to belittle | rabaisser, minimiser | v | C2 | /bɪˈlɪtl/ | Don't belittle his efforts. | Ne minimise pas ses efforts.
to bemoan | déplorer, se lamenter sur | v | C2 | /bɪˈməʊn/ | He bemoaned the lack of support. | Il déplorait le manque de soutien.
to berate | réprimander sévèrement | v | C2 | /bɪˈreɪt/ | She berated him for being late. | Elle l'a sévèrement réprimandé pour son retard.
to beseech | implorer | v | C2 | /bɪˈsiːtʃ/ | I beseech you to forgive him. | Je t'implore de lui pardonner.
to buttress | étayer, renforcer | v | C2 | /ˈbʌtrəs/ | He buttressed his argument with facts. | Il a étayé son argument par des faits.
to capitulate | capituler | v | C2 | /kəˈpɪtʃuleɪt/ | The army finally capitulated. | L'armée a fini par capituler.
to chastise | châtier, réprimander | v | C2 | /tʃæˈstaɪz/ | He was chastised for his rudeness. | Il a été réprimandé pour sa grossièreté.
to chide | gronder, réprimander | v | C2 | /tʃaɪd/ | She chided him for forgetting. | Elle l'a grondé pour son oubli.
to coerce | contraindre | v | C2 | /kəʊˈɜːs/ | He was coerced into signing. | Il a été contraint de signer.
to condescend | condescendre, daigner | v | C2 | /ˌkɒndɪˈsend/ | He condescended to speak to us. | Il a daigné nous adresser la parole.
to countenance | admettre, tolérer | v | C2 | /ˈkaʊntənəns/ | I won't countenance such behaviour. | Je ne tolérerai pas un tel comportement.
to covet | convoiter | v | C2 | /ˈkʌvɪt/ | Do not covet what belongs to others. | Ne convoite pas ce qui appartient aux autres.
to cower | se recroqueviller (de peur) | v | C2 | /ˈkaʊə/ | The dog cowered in the corner. | Le chien se recroquevillait dans le coin.
to culminate | culminer, aboutir | v | C2 | /ˈkʌlmɪneɪt/ | The festival culminates with a concert. | Le festival culmine avec un concert.
to debase | avilir, dévaloriser | v | C2 | /dɪˈbeɪs/ | Greed debases the soul. | La cupidité avilit l'âme.
to deign | daigner | v | C2 | /deɪn/ | She didn't deign to reply. | Elle n'a pas daigné répondre.
to deplore | déplorer | v | C2 | /dɪˈplɔː/ | We deplore all forms of violence. | Nous déplorons toute forme de violence.
to disavow | désavouer | v | C2 | /ˌdɪsəˈvaʊ/ | He disavowed the statement. | Il a désavoué la déclaration.
to dispel | dissiper | v | C2 | /dɪˈspel/ | Knowledge dispels ignorance. | Le savoir dissipe l'ignorance.
to dissipate | se dissiper ; dilapider | v | C2 | /ˈdɪsɪpeɪt/ | The fog dissipated in the morning. | Le brouillard s'est dissipé dans la matinée.
to distend | distendre, dilater | v | C2 | /dɪˈstend/ | His stomach was distended. | Son ventre était distendu.
to abort | interrompre, annuler | v | C1 | /əˈbɔːt/ | They had to abort the mission. | Ils ont dû annuler la mission.
to attest | attester, témoigner de | v | C1 | /əˈtest/ | Many witnesses attest to his honesty. | De nombreux témoins attestent de son honnêteté.
to deflect | détourner, faire dévier | v | C1 | /dɪˈflekt/ | He tried to deflect criticism. | Il a essayé de détourner les critiques.
to envision | envisager, imaginer | v | C1 | /ɪnˈvɪʒn/ | I envision a future without poverty. | J'imagine un avenir sans pauvreté.
to diversify | diversifier | v | C1 | /daɪˈvɜːsɪfaɪ/ | Farmers need to diversify their crops. | Les agriculteurs doivent diversifier leurs cultures.
to intensify | intensifier | v | B2 | /ɪnˈtensɪfaɪ/ | The storm will intensify tonight. | La tempête va s'intensifier cette nuit.
to propel | propulser | v | C1 | /prəˈpel/ | Steam propels the engine. | La vapeur propulse la locomotive.
to strut | se pavaner | v | C2 | /strʌt/ | He struts around like a peacock. | Il se pavane comme un paon.
to swirl | tourbillonner | v | C1 | /swɜːl/ | Leaves swirl in the wind. | Les feuilles tourbillonnent dans le vent.
to deteriorate | se détériorer | v | B2 | /dɪˈtɪəriəreɪt/ | His health began to deteriorate. | Sa santé a commencé à se détériorer.
to grunt | grogner | v | C1 | /ɡrʌnt/ | He grunts instead of answering. | Il grogne au lieu de répondre.
to ratchet up | augmenter progressivement | v | C2 | /ˈrætʃɪt ˈʌp/ | They ratchet up the pressure every day. | Ils augmentent la pression chaque jour.
to regenerate | (se) régénérer | v | C1 | /rɪˈdʒenəreɪt/ | The liver can regenerate itself. | Le foie peut se régénérer.
to sever | couper, rompre | v | C1 | /ˈsevə/ | They severed all ties with him. | Ils ont rompu tout lien avec lui.
to sharpen | aiguiser, tailler | v | B2 | /ˈʃɑːpən/ | Sharpen the knife before cooking. | Aiguise le couteau avant de cuisiner.
to thrash | rouer de coups ; battre à plates coutures | v | C1 | /θræʃ/ | Our team thrashes them every year. | Notre équipe les bat à plates coutures chaque année.
to avert | éviter, détourner | v | C1 | /əˈvɜːt/ | Quick action averted a disaster. | Une action rapide a évité une catastrophe.
to chime | sonner, carillonner | v | C1 | /tʃaɪm/ | The clock chimes every hour. | L'horloge sonne toutes les heures.
to delve into | fouiller, approfondir | v | C1 | /ˈdelv ˌɪntə/ | The book delves into the history of Andalusia. | Le livre approfondit l'histoire d'al-Andalus.
to stoop | se pencher, se baisser ; s'abaisser | v | C1 | /stuːp/ | I would never stoop to lying. | Je ne m'abaisserais jamais à mentir.
to vacate | quitter, libérer | v | C1 | /vəˈkeɪt/ | Guests must vacate the room by noon. | Les clients doivent libérer la chambre avant midi.
to blacklist | mettre sur liste noire | v | C1 | /ˈblæklɪst/ | The company was blacklisted. | L'entreprise a été mise sur liste noire.
to grapple with | se colleter avec, s'attaquer à | v | C1 | /ˈɡræpl wɪð/ | The country grapples with high unemployment. | Le pays est aux prises avec un fort chômage.
to groan | gémir, grogner | v | C1 | /ɡrəʊn/ | He groans with pain. | Il gémit de douleur.
to backfire | se retourner contre quelqu'un | v | C1 | /ˌbækˈfaɪə/ | His plan could backfire. | Son plan pourrait se retourner contre lui.
to exhale | expirer | v | C1 | /eksˈheɪl/ | Inhale slowly, then exhale. | Inspire lentement, puis expire.
to revel in | se délecter de | v | C2 | /ˈrevl ɪn/ | He revels in the attention. | Il se délecte de l'attention qu'on lui porte.
to shudder | frissonner, frémir | v | C1 | /ˈʃʌdə/ | I shudder to think what might happen. | Je frémis à l'idée de ce qui pourrait arriver.
to sully | souiller, ternir | v | C2 | /ˈsʌli/ | Don't sully your reputation. | Ne ternis pas ta réputation.
to clasp | serrer, étreindre | v | C1 | /klɑːsp/ | She clasps her hands in prayer. | Elle joint les mains pour prier.
to lurk | rôder, se cacher | v | C1 | /lɜːk/ | Danger lurks in the shadows. | Le danger rôde dans l'ombre.
to maximise | maximiser | v | C1 | /ˈmæksɪmaɪz/ | We want to maximise profits. | Nous voulons maximiser les bénéfices.
to plunder | piller | v | C1 | /ˈplʌndə/ | The invaders plundered the city. | Les envahisseurs ont pillé la ville.
to retaliate | riposter, user de représailles | v | C1 | /rɪˈtælieɪt/ | The army retaliated with air strikes. | L'armée a riposté par des frappes aériennes.
to rouse | réveiller ; susciter | v | C1 | /raʊz/ | The call to prayer rouses the town. | L'appel à la prière réveille la ville.
to impart | transmettre, communiquer | v | C2 | /ɪmˈpɑːt/ | Teachers impart knowledge. | Les enseignants transmettent le savoir.
to obstruct | obstruer, entraver | v | C1 | /əbˈstrʌkt/ | Don't obstruct the exit. | N'obstrue pas la sortie.
to toggle | basculer (entre deux options) | v | C1 | /ˈtɒɡl/ | Press here to toggle between languages. | Appuie ici pour basculer d'une langue à l'autre.
to beset | assaillir, accabler | v | C2 | /bɪˈset/ | The project is beset with problems. | Le projet est assailli de problèmes.
to regroup | se regrouper, se réorganiser | v | C1 | /ˌriːˈɡruːp/ | The team regroups after the defeat. | L'équipe se réorganise après la défaite.
to resurrect | ressusciter, faire revivre | v | C1 | /ˌrezəˈrekt/ | They want to resurrect old traditions. | Ils veulent faire revivre de vieilles traditions.
to subdue | maîtriser, soumettre | v | C1 | /səbˈdjuː/ | Police subdued the attacker. | La police a maîtrisé l'agresseur.
to coexist | coexister | v | C1 | /ˌkəʊɪɡˈzɪst/ | Different faiths coexist in the city. | Différentes religions coexistent dans la ville.
to convene | convoquer, se réunir | v | C1 | /kənˈviːn/ | The council will convene next week. | Le conseil se réunira la semaine prochaine.
to dredge | draguer (un fond) | v | C2 | /dredʒ/ | They dredge the harbour every year. | Ils draguent le port chaque année.
to drool | baver | v | C1 | /druːl/ | The baby drools when teeth come through. | Le bébé bave quand ses dents percent.
to replenish | réapprovisionner, remplir | v | C1 | /rɪˈplenɪʃ/ | Drink water to replenish your body after fasting. | Bois de l'eau pour réhydrater ton corps après le jeûne.
to smirk | sourire d'un air narquois | v | C1 | /smɜːk/ | Don't smirk at me! | Ne me fais pas ce sourire narquois !
to configure | configurer | v | C1 | /kənˈfɪɡə/ | Configure the settings before use. | Configure les paramètres avant l'utilisation.
to wobble | vaciller, branler | v | C1 | /ˈwɒbl/ | The bike wobbles on the gravel. | Le vélo vacille sur le gravier.
to underscore | souligner | v | C1 | /ˌʌndəˈskɔː/ | The report underscores the need for reform. | Le rapport souligne la nécessité d'une réforme.
to misread | mal interpréter | v | C1 | /ˌmɪsˈriːd/ | I misread the situation. | J'ai mal interprété la situation.
to tether | attacher | v | C2 | /ˈteðə/ | Tether your camel and trust in Allah. | Attache ton chameau et place ta confiance en Allah.
to whirl | tourbillonner, tournoyer | v | C1 | /wɜːl/ | The dancers whirl around the room. | Les danseurs tournoient dans la salle.
to subvert | subvertir, saper | v | C2 | /səbˈvɜːt/ | They tried to subvert the government. | Ils ont essayé de saper le gouvernement.
to caress | caresser | v | C1 | /kəˈres/ | The breeze caresses her face. | La brise caresse son visage.
to oust | évincer | v | C2 | /aʊst/ | The board ousted the director. | Le conseil a évincé le directeur.
to bask | se prélasser | v | C1 | /bɑːsk/ | Lizards bask in the sun. | Les lézards se prélassent au soleil.
to befriend | se lier d'amitié avec | v | C1 | /bɪˈfrend/ | She befriends the new students. | Elle se lie d'amitié avec les nouveaux élèves.
to hasten | hâter, accélérer | v | C2 | /ˈheɪsn/ | Hasten to do good deeds. | Hâte-toi de faire de bonnes actions.
to smite | frapper, châtier | v | C2 | /smaɪt/ | God will smite the oppressors. | Dieu châtiera les oppresseurs.
to dangle | pendre, balancer | v | C1 | /ˈdæŋɡl/ | His legs dangle over the edge. | Ses jambes pendent dans le vide.
to flaunt | étaler, faire étalage de | v | C1 | /flɔːnt/ | Don't flaunt your wealth. | N'étale pas ta richesse.
to flinch | tressaillir, sourciller | v | C1 | /flɪntʃ/ | He didn't flinch when the needle went in. | Il n'a pas sourcillé quand l'aiguille est entrée.
to siphon | siphonner | v | C2 | /ˈsaɪfn/ | They siphon petrol from the tank. | Ils siphonnent l'essence du réservoir.
to downplay | minimiser | v | C1 | /ˌdaʊnˈpleɪ/ | Don't downplay the danger. | Ne minimise pas le danger.
to ensue | s'ensuivre | v | C2 | /ɪnˈsjuː/ | A long silence ensued. | Un long silence s'est ensuivi.
to exterminate | exterminer | v | C2 | /ɪkˈstɜːmɪneɪt/ | They called in a company to exterminate the rats. | Ils ont fait venir une entreprise pour exterminer les rats.
to faze | déconcerter | v | C2 | /feɪz/ | Nothing seems to faze her. | Rien ne semble la déconcerter.
to hurl | lancer violemment | v | C1 | /hɜːl/ | Protesters hurl stones at the police. | Les manifestants lancent des pierres sur la police.
to expend | dépenser, consacrer | v | C2 | /ɪkˈspend/ | Don't expend energy on trivial things. | Ne gaspille pas ton énergie pour des futilités.
to fortify | fortifier | v | C2 | /ˈfɔːtɪfaɪ/ | Prayer fortifies the soul. | La prière fortifie l'âme.
to heave | soulever (avec effort) | v | C1 | /hiːv/ | They heave the box onto the lorry. | Ils hissent le carton dans le camion.
to maul | lacérer, malmener | v | C2 | /mɔːl/ | The hunter was mauled by a bear. | Le chasseur a été lacéré par un ours.
to snub | snober | v | C1 | /snʌb/ | She snubs her old friends. | Elle snobe ses anciens amis.
to spew | vomir, cracher | v | C2 | /spjuː/ | The factory spews smoke into the air. | L'usine crache de la fumée dans l'air.
to wail | gémir, se lamenter | v | C1 | /weɪl/ | Islam forbids wailing over the dead. | L'islam interdit les lamentations sur les morts.
to grandstand | jouer pour la galerie | v | C2 | /ˈɡrænstænd/ | Politicians love to grandstand. | Les politiciens adorent jouer pour la galerie.
to quench | étancher, éteindre | v | C1 | /kwentʃ/ | Water quenches your thirst. | L'eau étanche la soif.
to retort | rétorquer, riposter | v | C2 | /rɪˈtɔːt/ | "Mind your own business," she retorts. | « Occupe-toi de tes affaires », rétorque-t-elle.
to tamper with | trafiquer, toucher à | v | C1 | /ˈtæmpə wɪð/ | Someone tampered with the lock. | Quelqu'un a trafiqué la serrure.
to annihilate | anéantir | v | C2 | /əˈnaɪəleɪt/ | The army was annihilated. | L'armée a été anéantie.
to darken | (s')assombrir | v | C1 | /ˈdɑːkən/ | The sky darkens before the storm. | Le ciel s'assombrit avant l'orage.
to divest | se défaire de, priver | v | C2 | /daɪˈvest/ | The company divests its shares. | L'entreprise se défait de ses actions.
to screech | crisser, hurler | v | C1 | /skriːtʃ/ | The car screeches to a halt. | La voiture s'arrête dans un crissement de pneus.
to swoon | se pâmer | v | C2 | /swuːn/ | The fans swoon over the singer. | Les fans se pâment devant le chanteur.
to entrust | confier | v | C1 | /ɪnˈtrʌst/ | They entrust their children to the school. | Ils confient leurs enfants à l'école.
to populate | peupler | v | C1 | /ˈpɒpjuleɪt/ | Berbers populated North Africa first. | Les Berbères ont été les premiers à peupler l'Afrique du Nord.
to cede | céder | v | C2 | /siːd/ | The country ceded territory after the war. | Le pays a cédé des territoires après la guerre.
to quicken | accélérer | v | C2 | /ˈkwɪkən/ | Her heartbeat quickens. | Son cœur bat plus vite.
to suffocate | suffoquer, étouffer | v | C1 | /ˈsʌfəkeɪt/ | The heat is suffocating. | La chaleur est étouffante.
to tingle | picoter, fourmiller | v | C1 | /ˈtɪŋɡl/ | My fingers tingle with cold. | Mes doigts picotent à cause du froid.
to cleave | fendre ; s'attacher à | v | C2 | /kliːv/ | Cleave to the truth. | Attache-toi à la vérité.
to meddle | se mêler (de), s'immiscer | v | C1 | /ˈmedl/ | Don't meddle in other people's affairs. | Ne te mêle pas des affaires des autres.
to overpower | maîtriser, terrasser | v | C1 | /ˌəʊvəˈpaʊə/ | The guards overpower the thief. | Les gardes maîtrisent le voleur.
to ramble | divaguer ; se balader | v | C1 | /ˈræmbl/ | The old man rambles on about the past. | Le vieil homme radote sur le passé.
to smother | étouffer ; couvrir | v | C1 | /ˈsmʌðə/ | Don't smother your children with attention. | N'étouffe pas tes enfants avec trop d'attention.
to tarnish | ternir | v | C1 | /ˈtɑːnɪʃ/ | The scandal tarnished his reputation. | Le scandale a terni sa réputation.
to holler | brailler, hurler | v | C2 | /ˈhɒlə/ | He hollers at the children. | Il braille après les enfants.
to implore | implorer, supplier | v | C2 | /ɪmˈplɔː/ | She implores Allah for help. | Elle implore l'aide d'Allah.
to necessitate | nécessiter | v | C2 | /nəˈsesɪteɪt/ | The injury necessitates surgery. | La blessure nécessite une opération.
to overdo | exagérer, forcer | v | C1 | /ˌəʊvəˈduː/ | Don't overdo it at the gym. | N'en fais pas trop à la salle de sport.
to snip | couper (aux ciseaux) | v | C1 | /snɪp/ | She snips the thread. | Elle coupe le fil d'un coup de ciseaux.
to absolve | absoudre, disculper | v | C2 | /əbˈzɒlv/ | The court absolved him of blame. | Le tribunal l'a disculpé.
to enslave | asservir, réduire en esclavage | v | C2 | /ɪnˈsleɪv/ | Greed enslaves the heart. | La cupidité asservit le cœur.
to ingest | ingérer | v | C2 | /ɪnˈdʒest/ | The child ingested some bleach. | L'enfant a ingéré de l'eau de Javel.
to spearhead | mener, être le fer de lance de | v | C2 | /ˈspɪəhed/ | She spearheads the campaign. | Elle est le fer de lance de la campagne.
to squeal | pousser des cris aigus | v | C1 | /skwiːl/ | The children squeal with delight. | Les enfants poussent des cris de joie.
to whittle | tailler (au couteau) ; réduire | v | C2 | /ˈwɪtl/ | They whittle the list down to five. | Ils réduisent la liste à cinq.
to overreact | réagir de manière excessive | v | C1 | /ˌəʊvəriˈækt/ | Don't overreact; it's only a scratch. | Ne dramatise pas, ce n'est qu'une égratignure.
to conspire | conspirer, comploter | v | C1 | /kənˈspaɪə/ | They conspired to overthrow the king. | Ils ont comploté pour renverser le roi.
to outlast | survivre à, durer plus longtemps que | v | C2 | /ˌaʊtˈlɑːst/ | Good deeds outlast wealth. | Les bonnes actions durent plus longtemps que la richesse.
to aggravate | aggraver ; agacer | v | C1 | /ˈæɡrəveɪt/ | Smoking aggravates asthma. | Le tabac aggrave l'asthme.
to ooze | suinter | v | C1 | /uːz/ | Blood oozes from the wound. | Le sang suinte de la plaie.
to sizzle | grésiller | v | C1 | /ˈsɪzl/ | The meat sizzles in the pan. | La viande grésille dans la poêle.
to lurch | tanguer, faire une embardée | v | C2 | /lɜːtʃ/ | The boat lurches in the waves. | Le bateau tangue dans les vagues.
to ruffle | ébouriffer ; froisser | v | C1 | /ˈrʌfl/ | He ruffles the boy's hair. | Il ébouriffe les cheveux du garçon.
to seep | suinter, s'infiltrer | v | C1 | /siːp/ | Water seeps through the walls. | L'eau s'infiltre à travers les murs.
to skyrocket | monter en flèche | v | C1 | /ˈskaɪrɒkɪt/ | Prices skyrocket before Eid. | Les prix montent en flèche avant l'Aïd.
to crackle | crépiter | v | C1 | /ˈkrækl/ | The fire crackles in the hearth. | Le feu crépite dans l'âtre.
to dally | traîner, lambiner | v | C2 | /ˈdæli/ | Don't dally on the way home. | Ne traîne pas en rentrant.
to devolve | déléguer, transférer | v | C2 | /dɪˈvɒlv/ | Power devolves to local councils. | Le pouvoir est transféré aux conseils locaux.
to dupe | duper | v | C2 | /djuːp/ | They dupe tourists into paying more. | Ils dupent les touristes pour qu'ils paient plus.
to flounder | patauger, se débattre | v | C2 | /ˈflaʊndə/ | The economy is floundering. | L'économie patauge.
to pamper | dorloter, choyer | v | C1 | /ˈpæmpə/ | Grandparents love to pamper their grandchildren. | Les grands-parents adorent choyer leurs petits-enfants.
to precipitate | précipiter, provoquer | v | C2 | /prɪˈsɪpɪteɪt/ | The crisis precipitated his resignation. | La crise a précipité sa démission.
to reciprocate | rendre la pareille | v | C2 | /rɪˈsɪprəkeɪt/ | She was kind, so he reciprocated. | Elle a été gentille, alors il lui a rendu la pareille.
to amass | amasser | v | C2 | /əˈmæs/ | He amassed a huge fortune. | Il a amassé une immense fortune.
to straddle | chevaucher, enjamber | v | C2 | /ˈstrædl/ | The city straddles two continents. | La ville est à cheval sur deux continents.
to accentuate | accentuer, souligner | v | C2 | /əkˈsentʃueɪt/ | The lighting accentuates the arches. | L'éclairage met en valeur les arcades.
to fester | s'envenimer, suppurer | v | C2 | /ˈfestə/ | Resentment festers if not addressed. | La rancœur s'envenime si on ne la traite pas.
to offload | se décharger de, écouler | v | C2 | /ˌɒfˈləʊd/ | They offload their stock cheaply. | Ils écoulent leur stock à bas prix.
to peddle | colporter | v | C2 | /ˈpedl/ | They peddle lies on social media. | Ils colportent des mensonges sur les réseaux sociaux.
to pillage | piller | v | C2 | /ˈpɪlɪdʒ/ | The Mongols pillaged Baghdad. | Les Mongols ont pillé Bagdad.
to reek | puer, empester | v | C2 | /riːk/ | The room reeks of smoke. | La pièce empeste la fumée.
to shriek | hurler, pousser des cris perçants | v | C1 | /ʃriːk/ | The children shriek with laughter. | Les enfants hurlent de rire.
to ascribe | attribuer | v | C2 | /əˈskraɪb/ | This saying is wrongly ascribed to the Prophet. | Cette parole est faussement attribuée au Prophète.
to clothe | vêtir, habiller | v | C2 | /kləʊð/ | The charity clothes and feeds orphans. | L'association habille et nourrit des orphelins.
to ricochet | ricocher | v | C2 | /ˈrɪkəʃeɪ/ | The ball ricochets off the wall. | La balle ricoche sur le mur.
to waver | vaciller, hésiter | v | C1 | /ˈweɪvə/ | His faith never wavers. | Sa foi ne vacille jamais.
to dodge | esquiver, éviter | v | B2 | /dɒdʒ/ | He dodged the question. | Il a esquivé la question.
to trim | tailler, rafraîchir ; réduire | v | B2 | /trɪm/ | I need to trim the hedge. | Il faut que je taille la haie.
to tow | remorquer | v | B2 | /təʊ/ | The car was towed away by the police. | La voiture a été emmenée à la fourrière.
to smack | donner une tape, gifler | v | B2 | /smæk/ | Parents shouldn't smack their children. | Les parents ne devraient pas donner de fessées à leurs enfants.
to crank | tourner (une manivelle) | v | C1 | /kræŋk/ | He cranked the old engine into life. | Il a démarré le vieux moteur à la manivelle.
to swat | écraser (un insecte) | v | C1 | /swɒt/ | He swatted the fly with a newspaper. | Il a écrasé la mouche avec un journal.
to parry | parer, esquiver | v | C1 | /ˈpæri/ | She parried his questions with a smile. | Elle a esquivé ses questions avec un sourire.
to tack | punaiser ; louvoyer | v | C1 | /tæk/ | She tacked the notice to the board. | Elle a punaisé l'avis au tableau.
to dab | tamponner, appliquer par petites touches | v | B2 | /dæb/ | She dabbed her eyes with a tissue. | Elle s'est tamponné les yeux avec un mouchoir.
to taper | (s')effiler, diminuer progressivement | v | C1 | /ˈteɪpə/ | The trousers taper at the ankle. | Le pantalon s'affine à la cheville.
to tout | racoler ; vanter | v | C1 | /taʊt/ | Taxi drivers touted for business outside the station. | Les chauffeurs de taxi racolaient les clients devant la gare.
to hone | aiguiser, perfectionner | v | C1 | /həʊn/ | She honed her skills in a top restaurant. | Elle a perfectionné son savoir-faire dans un grand restaurant.
to lug | traîner, trimballer | v | C1 | /lʌɡ/ | I had to lug my suitcase up five floors. | J'ai dû trimballer ma valise sur cinq étages.
to pry | fouiner ; forcer (une ouverture) | v | C1 | /praɪ/ | I didn't mean to pry into your private life. | Je ne voulais pas fouiner dans ta vie privée.
to snort | grogner, renifler bruyamment | v | C1 | /snɔːt/ | She snorted with laughter. | Elle a pouffé de rire bruyamment.
to yank | tirer d'un coup sec | v | B2 | /jæŋk/ | She yanked the door open. | Elle a ouvert la porte d'un coup sec.
to stifle | étouffer, réprimer | v | C1 | /ˈstaɪfl/ | She stifled a yawn. | Elle a étouffé un bâillement.
to stonewall | faire de l'obstruction, éluder | v | C2 | /ˈstəʊnwɔːl/ | The minister stonewalled every question. | Le ministre a éludé toutes les questions.
to nestle | (se) nicher, se blottir | v | C1 | /ˈnesl/ | The village nestles in the valley. | Le village est niché dans la vallée.
to frustrate | contrarier, faire échouer | v | B2 | /frʌˈstreɪt/ | The bad weather frustrated our plans. | Le mauvais temps a contrarié nos projets.
to taint | entacher, contaminer | v | C1 | /teɪnt/ | The scandal tainted his reputation. | Le scandale a entaché sa réputation.
to outnumber | être plus nombreux que | v | C1 | /ˌaʊtˈnʌmbə/ | Women outnumber men in the class. | Les femmes sont plus nombreuses que les hommes dans la classe.
to flatten | aplatir, raser | v | B2 | /ˈflætn/ | The storm flattened the crops. | La tempête a couché les cultures.
to make an effort | faire un effort | expr | A2 | /meɪk ən ˈefət/ | You must make an effort to be on time. | Tu dois faire un effort pour être à l'heure.
to make a choice | faire un choix | expr | A2 | /meɪk ə ˈtʃɔɪs/ | It's hard to make a choice between them. | C'est difficile de choisir entre eux.
to make progress | faire des progrès | expr | A2 | /meɪk ˈprəʊɡres/ | You're making great progress in English. | Tu fais de gros progrès en anglais.
to make a difference | faire la différence, changer les choses | expr | B1 | /meɪk ə ˈdɪfrəns/ | Small actions can make a difference. | Les petits gestes peuvent changer les choses.
to spend time | passer du temps | expr | A1 | /spend ˈtaɪm/ | I like to spend time with my family. | J'aime passer du temps avec ma famille.
to take a look | jeter un coup d'œil | expr | A2 | /teɪk ə ˈlʊk/ | Can you take a look at my car? | Tu peux jeter un coup d'œil à ma voiture ?
to give advice | donner des conseils | expr | A2 | /ɡɪv ədˈvaɪs/ | My grandmother loves to give advice. | Ma grand-mère adore donner des conseils.
to give a speech | faire un discours | expr | B1 | /ɡɪv ə ˈspiːtʃ/ | The best man has to give a speech. | Le témoin doit faire un discours.
to keep a secret | garder un secret | expr | A2 | /kiːp ə ˈsiːkrət/ | Can you keep a secret? | Tu sais garder un secret ?
to ask a favour | demander un service | expr | B1 | /ɑːsk ə ˈfeɪvə/ | Can I ask a favour? | Je peux te demander un service ?
to do someone a favour | rendre service à quelqu'un | expr | B1 | /duː ˌsʌmwʌn ə ˈfeɪvə/ | Could you do me a favour and post this letter? | Tu peux me rendre service et poster cette lettre ?
to do damage | causer des dégâts | expr | B2 | /duː ˈdæmɪdʒ/ | Strong winds can do a lot of damage to roofs. | Les vents violents peuvent causer beaucoup de dégâts aux toits.
to do good | faire le bien | expr | B1 | /duː ˈɡʊd/ | A holiday will do you good. | Des vacances te feront du bien.
to make a suggestion | faire une suggestion | expr | A2 | /meɪk ə səˈdʒestʃən/ | Can I make a suggestion? | Je peux faire une suggestion ?
to make an excuse | trouver une excuse | expr | B1 | /meɪk ən ɪkˈskjuːs/ | He always makes an excuse to leave early. | Il trouve toujours une excuse pour partir tôt.
to make a promise | faire une promesse | expr | A2 | /meɪk ə ˈprɒmɪs/ | Don't make a promise you can't keep. | Ne fais pas de promesse que tu ne peux pas tenir.
to make plans | faire des projets, prévoir | expr | A2 | /meɪk ˈplænz/ | Let's make plans for the weekend. | Faisons des projets pour le week-end.
to make a wish | faire un vœu | expr | A2 | /meɪk ə ˈwɪʃ/ | Blow out the candles and make a wish. | Souffle les bougies et fais un vœu.
to make a noise | faire du bruit | expr | A1 | /meɪk ə ˈnɔɪz/ | Try not to make a noise when you come in. | Essaie de ne pas faire de bruit en rentrant.
to make room | faire de la place | expr | B1 | /meɪk ˈruːm/ | Can you make room for one more? | Tu peux faire de la place pour une personne de plus ?
to make way for | céder la place à | expr | B2 | /meɪk ˈweɪ fə/ | The old houses were demolished to make way for a road. | Les vieilles maisons ont été démolies pour faire place à une route.
to make a start | commencer, s'y mettre | expr | B1 | /meɪk ə ˈstɑːt/ | Let's make a start on the cleaning. | Mettons-nous au ménage.
to make an exception | faire une exception | expr | B1 | /meɪk ən ɪkˈsepʃn/ | We don't usually do this, but we'll make an exception. | D'habitude, on ne fait pas ça, mais on va faire une exception.
to make a point | souligner, faire une remarque | expr | B2 | /meɪk ə ˈpɔɪnt/ | You make a good point about the costs. | Tu soulèves un point important sur les coûts.
to make arrangements | prendre des dispositions | expr | B2 | /meɪk əˈreɪndʒmənts/ | We need to make arrangements for the funeral. | Il faut prendre des dispositions pour les obsèques.
to make contact | prendre contact | expr | B2 | /meɪk ˈkɒntækt/ | The rescuers are trying to make contact with the climbers. | Les secouristes essaient d'établir le contact avec les alpinistes.
to take action | agir, prendre des mesures | expr | B1 | /teɪk ˈækʃn/ | We must take action now. | Nous devons agir maintenant.
to take advantage of | profiter de | expr | B1 | /teɪk ədˈvɑːntɪdʒ əv/ | Take advantage of the good weather. | Profite du beau temps.
to take risks | prendre des risques | expr | B1 | /teɪk ˈrɪsks/ | Successful people are not afraid to take risks. | Les gens qui réussissent n'ont pas peur de prendre des risques.
to take a chance | tenter sa chance | expr | B1 | /teɪk ə ˈtʃɑːns/ | Take a chance and apply for the job. | Tente ta chance et postule.
to take responsibility | assumer la responsabilité | expr | B2 | /teɪk rɪˌspɒnsəˈbɪləti/ | You must take responsibility for your actions. | Tu dois assumer la responsabilité de tes actes.
to take control | prendre le contrôle | expr | B1 | /teɪk kənˈtrəʊl/ | It's time to take control of your life. | Il est temps de prendre ta vie en main.
to take charge | prendre les choses en main | expr | B2 | /teɪk ˈtʃɑːdʒ/ | When the boss is away, she takes charge. | Quand la patronne est absente, elle prend les choses en main.
to take steps | prendre des mesures | expr | B2 | /teɪk ˈsteps/ | The council is taking steps to reduce traffic. | La mairie prend des mesures pour réduire la circulation.
to take a stand | prendre position | expr | C1 | /teɪk ə ˈstænd/ | It's time to take a stand against bullying. | Il est temps de prendre position contre le harcèlement.
to take the blame | endosser la responsabilité | expr | B2 | /teɪk ðə ˈbleɪm/ | Why should I take the blame for your mistake? | Pourquoi devrais-je porter le chapeau pour ton erreur ?
to take the credit | s'attribuer le mérite | expr | B2 | /teɪk ðə ˈkredɪt/ | He always takes the credit for our work. | Il s'attribue toujours le mérite de notre travail.
to make a request | faire une demande | expr | B1 | /meɪk ə rɪˈkwest/ | You can make a request by email. | Vous pouvez faire une demande par e-mail.
to take a step | faire un pas | expr | A2 | /teɪk ə ˈstep/ | Take a step forward, please. | Faites un pas en avant, s'il vous plaît.
to have a think | réfléchir (un moment) | expr | B2 | /hæv ə ˈθɪŋk/ | Let me have a think and I'll call you back. | Laisse-moi réfléchir et je te rappelle.
to keep still | rester immobile, ne pas bouger | expr | B1 | /kiːp ˈstɪl/ | Keep still while I take the photo. | Ne bouge pas pendant que je prends la photo.
to catch sight of | apercevoir | expr | B2 | /kætʃ ˈsaɪt əv/ | We waited at the window to catch sight of the parade. | Nous attendions à la fenêtre pour apercevoir le défilé.
to break the silence | rompre le silence | expr | B2 | /breɪk ðə ˈsaɪləns/ | A child's laugh was the first thing to break the silence. | Le rire d'un enfant a été le premier à rompre le silence.
to pay the price | en payer le prix | expr | B2 | /peɪ ðə ˈpraɪs/ | If you don't sleep, you'll pay the price tomorrow. | Si tu ne dors pas, tu en paieras le prix demain.
to lose control | perdre le contrôle | expr | B1 | /luːz kənˈtrəʊl/ | The driver lost control of the car on the ice. | Le conducteur a perdu le contrôle de la voiture sur le verglas.
to raise a question | soulever une question | expr | B2 | /reɪz ə ˈkwestʃən/ | Your report raises an important question. | Ton rapport soulève une question importante.
to draw a conclusion | tirer une conclusion | expr | B2 | /drɔː ə kənˈkluːʒn/ | It's too early to draw a conclusion. | Il est trop tôt pour tirer une conclusion.
to draw attention to | attirer l'attention sur | expr | B2 | /drɔː əˈtenʃn tə/ | The report draws attention to the lack of doctors. | Le rapport attire l'attention sur le manque de médecins.
to tell the difference | faire la différence, distinguer | expr | B1 | /tel ðə ˈdɪfrəns/ | I can't tell the difference between the twins. | Je n'arrive pas à distinguer les jumeaux.
to play a role | jouer un rôle | expr | B1 | /pleɪ ə ˈrəʊl/ | Sleep plays a big role in your health. | Le sommeil joue un grand rôle dans la santé.
to miss an opportunity | rater une occasion | expr | B1 | /mɪs ən ˌɒpəˈtjuːnəti/ | Don't miss this opportunity to travel. | Ne rate pas cette occasion de voyager.
to seize the opportunity | saisir l'occasion | expr | B2 | /siːz ði ˌɒpəˈtjuːnəti/ | She seized the opportunity to study abroad. | Elle a saisi l'occasion d'étudier à l'étranger.
to take notice of | prêter attention à, tenir compte de | expr | B2 | /teɪk ˈnəʊtɪs əv/ | Nobody takes notice of the warning signs. | Personne ne prête attention aux panneaux d'avertissement.
to take shape | prendre forme | expr | B2 | /teɪk ˈʃeɪp/ | The new building is starting to take shape. | Le nouveau bâtiment commence à prendre forme.
to take into account | prendre en compte | expr | B2 | /teɪk ˌɪntʊ əˈkaʊnt/ | We must take the weather into account. | Nous devons prendre la météo en compte.
to take a guess | essayer de deviner | expr | B1 | /teɪk ə ˈɡes/ | Take a guess: how old is she? | Devine : quel âge a-t-elle ?
to insert | insérer | v | B2 | /ɪnˈsɜːt/ | Insert your card and enter your code. | Insérez votre carte et composez votre code.
to firmly believe | croire fermement | expr | B2 | /ˌfɜːmli bɪˈliːv/ | I firmly believe that education is the key. | Je crois fermement que l'éducation est la clé.
to vaguely remember | se souvenir vaguement | expr | B2 | /ˌveɪɡli rɪˈmembə/ | I vaguely remember meeting him once. | Je me souviens vaguement de l'avoir rencontré une fois.
quick question | petite question | n | B1 | /ˌkwɪk ˈkwestʃən/ | Can I ask you a quick question? | Je peux te poser une petite question ?
rough idea | idée approximative | n | B2 | /ˌrʌf aɪˈdɪə/ | Can you give me a rough idea of the price? | Tu peux me donner une idée approximative du prix ?
tough decision | décision difficile | n | B1 | /ˌtʌf dɪˈsɪʒn/ | Leaving home was a tough decision. | Quitter la maison a été une décision difficile.
to solve a problem | résoudre un problème | expr | A2 | /ˌsɒlv ə ˈprɒbləm/ | Can you help me solve this problem? | Tu peux m'aider à résoudre ce problème ?
`,
);
