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
`,
);
