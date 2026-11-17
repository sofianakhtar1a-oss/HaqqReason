/* Le Truchement : thème « Mots de liaison et nuances » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const LIAISON = theme(
  "liaison",
  "Mots de liaison et nuances",
  "Connecteurs, adverbes et petits mots qui articulent la pensée.",
  "Link2",
  `
and | et | conj | A1 | /ænd/ | I like tea and coffee. | J'aime le thé et le café.
but | mais | conj | A1 | /bʌt/ | It's small but comfortable. | C'est petit mais confortable.
or | ou | conj | A1 | /ɔːr/ | Tea or coffee? | Thé ou café ?
because | parce que | conj | A1 | /bɪˈkɒz/ | I stayed home because I was ill. | Je suis resté à la maison parce que j'étais malade.
so | donc, alors | conj | A1 | /səʊ/ | It was raining, so we stayed in. | Il pleuvait, donc nous sommes restés à l'intérieur.
if | si | conj | A1 | /ɪf/ | Call me if you need help. | Appelle-moi si tu as besoin d'aide.
when | quand | conj | A1 | /wen/ | Call me when you arrive. | Appelle-moi quand tu arrives.
while | pendant que ; alors que | conj | A2 | /waɪl/ | I read while she cooked. | Je lisais pendant qu'elle cuisinait.
until | jusqu'à ce que | conj | A2 | /ənˈtɪl/ | Wait until I come back. | Attends jusqu'à ce que je revienne.
before | avant (que) | conj | A1 | /bɪˈfɔːr/ | Wash your hands before you eat. | Lave-toi les mains avant de manger.
after | après | prep | A1 | /ˈɑːftər/ | We went for a walk after lunch. | Nous nous sommes promenés après le déjeuner.
although | bien que | conj | B1 | /ɔːlˈðəʊ/ | Although it was late, we kept working. | Bien qu'il soit tard, nous avons continué à travailler.
even though | même si | conj | B1 | /ˌiːvn ˈðəʊ/ | Even though he's rich, he lives simply. | Même s'il est riche, il vit simplement.
however | cependant | adv | B1 | /haʊˈevər/ | It's cheap. However, it's not very good. | C'est bon marché. Cependant, ce n'est pas très bon.
therefore | par conséquent | adv | B2 | /ˈðeəfɔːr/ | He was ill and therefore absent. | Il était malade et donc absent.
moreover | de plus | adv | B2 | /mɔːrˈəʊvər/ | The flat is cheap; moreover, it's central. | L'appartement est bon marché ; de plus, il est central.
furthermore | en outre | adv | C1 | /ˌfɜːðəˈmɔːr/ | Furthermore, the plan is too expensive. | En outre, le projet est trop cher.
nevertheless | néanmoins | adv | C1 | /ˌnevəðəˈles/ | It was hard; nevertheless, we finished. | C'était dur ; néanmoins, nous avons terminé.
nonetheless | néanmoins | adv | C1 | /ˌnʌnðəˈles/ | The task was difficult but nonetheless fun. | La tâche était difficile mais néanmoins amusante.
thus | ainsi | adv | C1 | /ðʌs/ | Prices rose, thus reducing demand. | Les prix ont augmenté, réduisant ainsi la demande.
hence | d'où | adv | C1 | /hens/ | It's handmade, hence the price. | C'est fait main, d'où le prix.
consequently | en conséquence | adv | B2 | /ˈkɒnsɪkwəntli/ | He missed the bus and consequently arrived late. | Il a raté le bus et est donc arrivé en retard.
as a result | en conséquence | expr | B1 | /əz ə rɪˈzʌlt/ | It rained; as a result, the match was cancelled. | Il a plu ; en conséquence, le match a été annulé.
in addition | en plus | expr | B1 | /ɪn əˈdɪʃn/ | In addition, you will get a free gift. | En plus, vous recevrez un cadeau.
besides | d'ailleurs, en plus | adv | B2 | /bɪˈsaɪdz/ | I'm too tired; besides, it's late. | Je suis trop fatigué ; d'ailleurs, il est tard.
also | aussi | adv | A1 | /ˈɔːlsəʊ/ | She also speaks Arabic. | Elle parle aussi arabe.
too | aussi ; trop | adv | A1 | /tuː/ | I love it too. | Je l'adore aussi.
either | non plus ; l'un ou l'autre | adv | A2 | /ˈaɪðər/ | I don't like it either. | Je ne l'aime pas non plus.
neither | ni l'un ni l'autre ; non plus | adv | B1 | /ˈnaɪðər/ | Neither of them came. | Aucun des deux n'est venu.
both | les deux | pron | A2 | /bəʊθ/ | Both of my parents work. | Mes deux parents travaillent.
whereas | alors que | conj | B2 | /weərˈæz/ | He likes tea, whereas she prefers coffee. | Il aime le thé, alors qu'elle préfère le café.
unless | à moins que | conj | B1 | /ənˈles/ | We'll go unless it rains. | Nous irons à moins qu'il ne pleuve.
in case | au cas où | conj | B1 | /ɪn ˈkeɪs/ | Take a coat in case it gets cold. | Prends un manteau au cas où il ferait froid.
as long as | du moment que | conj | B1 | /əz ˈlɒŋ əz/ | You can stay as long as you're quiet. | Tu peux rester du moment que tu es silencieux.
provided that | à condition que | conj | C1 | /prəˈvaɪdɪd ðæt/ | You can go provided that you finish your work. | Tu peux y aller à condition de finir ton travail.
otherwise | sinon | adv | B1 | /ˈʌðəwaɪz/ | Hurry, otherwise we'll miss the train. | Dépêche-toi, sinon on va rater le train.
instead | à la place | adv | B1 | /ɪnˈsted/ | I didn't go out; I read instead. | Je ne suis pas sorti ; j'ai lu à la place.
instead of | au lieu de | prep | B1 | /ɪnˈsted əv/ | Drink water instead of soda. | Bois de l'eau au lieu du soda.
despite | malgré | prep | B1 | /dɪˈspaɪt/ | We went out despite the rain. | Nous sommes sortis malgré la pluie.
in spite of | en dépit de | prep | B2 | /ɪn ˈspaɪt əv/ | In spite of his age, he still runs. | En dépit de son âge, il court encore.
due to | en raison de | prep | B2 | /ˈdjuː tuː/ | The flight was delayed due to fog. | Le vol a été retardé en raison du brouillard.
thanks to | grâce à | prep | B1 | /ˈθæŋks tuː/ | Thanks to you, we won. | Grâce à toi, nous avons gagné.
according to | selon | prep | B1 | /əˈkɔːdɪŋ tuː/ | According to the forecast, it will rain. | Selon la météo, il va pleuvoir.
as well as | ainsi que | conj | B1 | /əz ˈwel əz/ | She speaks English as well as Arabic. | Elle parle anglais ainsi qu'arabe.
such as | tel que | prep | B1 | /ˈsʌtʃ əz/ | I like fruit such as apples and dates. | J'aime les fruits tels que les pommes et les dattes.
for example | par exemple | expr | A2 | /fər ɪɡˈzɑːmpl/ | Many birds, for example swallows, migrate. | Beaucoup d'oiseaux, par exemple les hirondelles, migrent.
for instance | par exemple | expr | B2 | /fər ˈɪnstəns/ | Some fruits, for instance mangoes, are tropical. | Certains fruits, par exemple les mangues, sont tropicaux.
in other words | autrement dit | expr | B1 | /ɪn ˌʌðə ˈwɜːdz/ | He's broke; in other words, he has no money. | Il est fauché ; autrement dit, il n'a pas d'argent.
that is to say | c'est-à-dire | expr | B2 | /ðæt ɪz tə ˈseɪ/ | Next month, that is to say June. | Le mois prochain, c'est-à-dire juin.
first of all | tout d'abord | expr | A2 | /ˌfɜːst əv ˈɔːl/ | First of all, thank you for coming. | Tout d'abord, merci d'être venus.
firstly | premièrement | adv | B1 | /ˈfɜːstli/ | Firstly, read the instructions. | Premièrement, lis les instructions.
secondly | deuxièmement | adv | B1 | /ˈsekəndli/ | Secondly, check your answers. | Deuxièmement, vérifie tes réponses.
finally | enfin | adv | A2 | /ˈfaɪnəli/ | Finally, we arrived home. | Enfin, nous sommes arrivés chez nous.
lastly | pour finir | adv | B2 | /ˈlɑːstli/ | Lastly, I want to thank my family. | Pour finir, je veux remercier ma famille.
to begin with | pour commencer | expr | B1 | /tə bɪˈɡɪn wɪð/ | To begin with, let's introduce ourselves. | Pour commencer, présentons-nous.
in conclusion | en conclusion | expr | B1 | /ɪn kənˈkluːʒn/ | In conclusion, the project was a success. | En conclusion, le projet a été un succès.
to sum up | pour résumer | expr | B2 | /tə ˈsʌm ʌp/ | To sum up, we need more time. | Pour résumer, il nous faut plus de temps.
on the one hand | d'une part | expr | B2 | /ɒn ðə ˈwʌn hænd/ | On the one hand, it's cheap. | D'une part, c'est bon marché.
on the other hand | d'autre part, en revanche | expr | B1 | /ɒn ði ˈʌðə hænd/ | On the other hand, it's far away. | En revanche, c'est loin.
in fact | en fait | expr | A2 | /ɪn ˈfækt/ | In fact, I've never been there. | En fait, je n'y suis jamais allé.
actually | en fait, en réalité | adv | A2 | /ˈæktʃuəli/ | Actually, I prefer tea. | En fait, je préfère le thé.
indeed | en effet | adv | B2 | /ɪnˈdiːd/ | It was indeed a great day. | Ce fut en effet une belle journée.
of course | bien sûr | expr | A1 | /əv ˈkɔːs/ | Of course you can come! | Bien sûr que tu peux venir !
obviously | évidemment | adv | B1 | /ˈɒbviəsli/ | Obviously, we were disappointed. | Évidemment, nous étions déçus.
clearly | clairement | adv | B1 | /ˈklɪəli/ | He clearly didn't understand. | Il n'a clairement pas compris.
apparently | apparemment | adv | B1 | /əˈpærəntli/ | Apparently, the shop is closed. | Apparemment, le magasin est fermé.
probably | probablement | adv | A2 | /ˈprɒbəbli/ | It will probably rain. | Il va probablement pleuvoir.
perhaps | peut-être | adv | A2 | /pəˈhæps/ | Perhaps she missed the train. | Peut-être a-t-elle raté le train.
maybe | peut-être | adv | A1 | /ˈmeɪbi/ | Maybe we can meet tomorrow. | On peut peut-être se voir demain.
certainly | certainement | adv | B1 | /ˈsɜːtnli/ | I will certainly come. | Je viendrai certainement.
definitely | absolument, sans aucun doute | adv | B1 | /ˈdefɪnətli/ | I'm definitely coming. | Je viens, c'est sûr.
almost | presque | adv | A2 | /ˈɔːlməʊst/ | I'm almost ready. | Je suis presque prêt.
nearly | presque | adv | A2 | /ˈnɪəli/ | It's nearly midnight. | Il est presque minuit.
hardly | à peine | adv | B2 | /ˈhɑːdli/ | I can hardly hear you. | Je t'entends à peine.
barely | à peine | adv | C1 | /ˈbeəli/ | She barely slept last night. | Elle a à peine dormi cette nuit.
quite | assez, plutôt | adv | A2 | /kwaɪt/ | The film was quite good. | Le film était plutôt bon.
rather | plutôt | adv | B1 | /ˈrɑːðər/ | It's rather cold today. | Il fait plutôt froid aujourd'hui.
fairly | assez | adv | B2 | /ˈfeəli/ | The test was fairly easy. | Le contrôle était assez facile.
pretty | assez, plutôt | adv | B1 | /ˈprɪti/ | I'm pretty sure he's right. | Je suis à peu près sûr qu'il a raison.
really | vraiment | adv | A1 | /ˈrɪəli/ | I really like this song. | J'aime vraiment cette chanson.
very | très | adv | A1 | /ˈveri/ | She is very kind. | Elle est très gentille.
extremely | extrêmement | adv | B1 | /ɪkˈstriːmli/ | The exam was extremely hard. | L'examen était extrêmement difficile.
completely | complètement | adv | B1 | /kəmˈpliːtli/ | I completely forgot! | J'ai complètement oublié !
totally | totalement | adv | B1 | /ˈtəʊtəli/ | I totally agree. | Je suis totalement d'accord.
entirely | entièrement | adv | B2 | /ɪnˈtaɪəli/ | It's entirely your choice. | C'est entièrement ton choix.
slightly | légèrement | adv | B2 | /ˈslaɪtli/ | Prices rose slightly. | Les prix ont légèrement augmenté.
especially | surtout, particulièrement | adv | B1 | /ɪˈspeʃəli/ | I love fruit, especially dates. | J'adore les fruits, surtout les dattes.
mainly | principalement | adv | B1 | /ˈmeɪnli/ | The audience was mainly young. | Le public était surtout jeune.
mostly | surtout, la plupart du temps | adv | B1 | /ˈməʊstli/ | I mostly work from home. | Je travaille surtout de chez moi.
generally | en général | adv | B1 | /ˈdʒenrəli/ | I generally go to bed at ten. | En général, je me couche à vingt-deux heures.
in general | en général | expr | A2 | /ɪn ˈdʒenrəl/ | In general, people are kind. | En général, les gens sont gentils.
only | seulement | adv | A1 | /ˈəʊnli/ | I only have five euros. | Je n'ai que cinq euros.
just | juste, venir de | adv | A2 | /dʒʌst/ | I've just arrived. | Je viens d'arriver.
even | même | adv | B1 | /ˈiːvn/ | Even my grandmother uses a smartphone. | Même ma grand-mère utilise un smartphone.
anyway | de toute façon | adv | B1 | /ˈeniweɪ/ | It's too late anyway. | De toute façon, c'est trop tard.
somehow | d'une manière ou d'une autre | adv | B2 | /ˈsʌmhaʊ/ | We'll find the money somehow. | Nous trouverons l'argent d'une manière ou d'une autre.
likewise | de même | adv | C1 | /ˈlaɪkwaɪz/ | Nice to meet you. Likewise! | Enchanté. De même !
similarly | de la même façon | adv | B2 | /ˈsɪmələli/ | Similarly, the second test failed. | De la même façon, le deuxième test a échoué.
in contrast | en revanche | expr | B2 | /ɪn ˈkɒntrɑːst/ | In contrast, the north is cold. | En revanche, le nord est froid.
on the contrary | au contraire | expr | B2 | /ɒn ðə ˈkɒntrəri/ | I'm not tired; on the contrary, I feel great. | Je ne suis pas fatigué ; au contraire, je me sens très bien.
unlike | contrairement à | prep | B2 | /ʌnˈlaɪk/ | Unlike his brother, he is calm. | Contrairement à son frère, il est calme.
regarding | concernant | prep | B2 | /rɪˈɡɑːdɪŋ/ | I'm writing regarding your order. | Je vous écris concernant votre commande.
concerning | au sujet de | prep | C1 | /kənˈsɜːnɪŋ/ | I have questions concerning the contract. | J'ai des questions au sujet du contrat.
as for | quant à | prep | B2 | /ˈæz fɔːr/ | As for me, I'll stay here. | Quant à moi, je reste ici.
apart from | à part | prep | B1 | /əˈpɑːt frəm/ | Apart from Ali, everyone came. | À part Ali, tout le monde est venu.
except | sauf | prep | A2 | /ɪkˈsept/ | Everyone came except Sara. | Tout le monde est venu sauf Sara.
including | y compris | prep | B1 | /ɪnˈkluːdɪŋ/ | Ten people came, including my parents. | Dix personnes sont venues, y compris mes parents.
throughout | tout au long de | prep | B2 | /θruːˈaʊt/ | It rained throughout the day. | Il a plu tout au long de la journée.
within | dans, en moins de | prep | B2 | /wɪˈðɪn/ | Reply within three days. | Réponds dans les trois jours.
towards | vers | prep | B1 | /təˈwɔːdz/ | He walked towards the door. | Il a marché vers la porte.
among | parmi | prep | B1 | /əˈmʌŋ/ | She is popular among students. | Elle est populaire parmi les étudiants.
beyond | au-delà de | prep | B2 | /bɪˈjɒnd/ | The village is just beyond the hill. | Le village est juste au-delà de la colline.
beneath | sous, au-dessous de | prep | C1 | /bɪˈniːθ/ | The cat hid beneath the table. | Le chat s'est caché sous la table.
above | au-dessus de | prep | A2 | /əˈbʌv/ | The plane flew above the clouds. | L'avion volait au-dessus des nuages.
below | en dessous de | prep | A2 | /bɪˈləʊ/ | Write your name below the title. | Écris ton nom sous le titre.
behind | derrière | prep | A1 | /bɪˈhaɪnd/ | The garden is behind the house. | Le jardin est derrière la maison.
in front of | devant | prep | A1 | /ɪn ˈfrʌnt əv/ | Meet me in front of the station. | Retrouve-moi devant la gare.
inside | à l'intérieur | adv | A2 | /ˌɪnˈsaɪd/ | Let's go inside, it's cold. | Rentrons, il fait froid.
outside | dehors | adv | A2 | /ˌaʊtˈsaɪd/ | The children are playing outside. | Les enfants jouent dehors.
upstairs | en haut, à l'étage | adv | A2 | /ˌʌpˈsteəz/ | My room is upstairs. | Ma chambre est à l'étage.
downstairs | en bas | adv | A2 | /ˌdaʊnˈsteəz/ | Breakfast is served downstairs. | Le petit déjeuner est servi en bas.
everywhere | partout | adv | A2 | /ˈevriweər/ | I looked everywhere for my keys. | J'ai cherché mes clés partout.
somewhere | quelque part | adv | A2 | /ˈsʌmweər/ | I left my phone somewhere. | J'ai laissé mon téléphone quelque part.
nowhere | nulle part | adv | B1 | /ˈnəʊweər/ | There's nowhere to park. | Il n'y a nulle part où se garer.
anywhere | n'importe où | adv | A2 | /ˈeniweər/ | Sit anywhere you like. | Assieds-toi où tu veux.
whatever | quoi que ce soit | pron | B1 | /wɒtˈevər/ | Whatever happens, I'll help you. | Quoi qu'il arrive, je t'aiderai.
whenever | chaque fois que | conj | B1 | /wenˈevər/ | Call me whenever you want. | Appelle-moi quand tu veux.
wherever | où que | conj | B1 | /weərˈevər/ | I'll follow you wherever you go. | Je te suivrai où que tu ailles.
whoever | quiconque | pron | B2 | /huːˈevər/ | Whoever wins will get a prize. | Quiconque gagne recevra un prix.
so that | pour que | conj | B1 | /ˈsəʊ ðæt/ | Speak slowly so that everyone understands. | Parle lentement pour que tout le monde comprenne.
in order to | afin de | expr | B1 | /ɪn ˈɔːdə tuː/ | He works hard in order to succeed. | Il travaille dur afin de réussir.
as soon as | dès que | conj | A2 | /əz ˈsuːn əz/ | Call me as soon as you arrive. | Appelle-moi dès que tu arrives.
since | depuis ; puisque | conj | A2 | /sɪns/ | I've lived here since 2010. | J'habite ici depuis 2010.
as | comme ; puisque | conj | B1 | /æz/ | As it was late, we took a taxi. | Comme il était tard, nous avons pris un taxi.
whether | si (alternative) | conj | B1 | /ˈweðər/ | I don't know whether he will come. | Je ne sais pas s'il viendra.
all the same | quand même, malgré tout | expr | B2 | /ˌɔːl ðə ˈseɪm/ | Thanks all the same. | Merci quand même.
after all | après tout | expr | B1 | /ˌɑːftər ˈɔːl/ | Don't blame him; he's only a child, after all. | Ne lui en veux pas ; ce n'est qu'un enfant, après tout.
above all | surtout | expr | B1 | /əˌbʌv ˈɔːl/ | Above all, be honest. | Surtout, sois honnête.
at least | au moins | expr | A2 | /ət ˈliːst/ | At least we tried. | Au moins, nous avons essayé.
at last | enfin | expr | A2 | /ət ˈlɑːst/ | At last, the holidays! | Enfin les vacances !
at once | immédiatement | expr | B1 | /ət ˈwʌns/ | Come here at once! | Viens ici immédiatement !
at the same time | en même temps | expr | A2 | /ət ðə ˌseɪm ˈtaɪm/ | We arrived at the same time. | Nous sommes arrivés en même temps.
by chance | par hasard | expr | B1 | /baɪ ˈtʃɑːns/ | We met by chance in the street. | Nous nous sommes rencontrés par hasard dans la rue.
by mistake | par erreur | expr | B1 | /baɪ mɪˈsteɪk/ | I took your bag by mistake. | J'ai pris ton sac par erreur.
in particular | en particulier | expr | B1 | /ɪn pəˈtɪkjələr/ | I love Arabic poetry, in particular old poems. | J'adore la poésie arabe, en particulier les poèmes anciens.
in any case | en tout cas | expr | B1 | /ɪn ˈeni keɪs/ | In any case, I'll call you. | En tout cas, je t'appellerai.
in short | bref | expr | B1 | /ɪn ˈʃɔːt/ | In short, it was a disaster. | Bref, ce fut une catastrophe.
in brief | en bref | expr | B2 | /ɪn ˈbriːf/ | In brief, the answer is no. | En bref, la réponse est non.
as if | comme si | conj | B1 | /əz ˈɪf/ | He acts as if nothing happened. | Il agit comme si rien ne s'était passé.
as though | comme si | conj | B2 | /əz ˈðəʊ/ | She looked as though she'd seen a ghost. | Elle avait l'air d'avoir vu un fantôme.
even if | même si | conj | B1 | /ˈiːvn ɪf/ | I'll go even if it rains. | J'irai même s'il pleut.
only if | seulement si | conj | B1 | /ˈəʊnli ɪf/ | You can go only if you finish. | Tu peux y aller seulement si tu as fini.
not only... but also | non seulement... mais aussi | expr | B1 | /nɒt ˈəʊnli bət ˈɔːlsəʊ/ | She is not only kind but also funny. | Elle est non seulement gentille mais aussi drôle.
rather than | plutôt que | expr | B1 | /ˈrɑːðə ðæn/ | I'd walk rather than take the bus. | Je préfère marcher plutôt que prendre le bus.
so as to | afin de | expr | B2 | /ˈsəʊ əz tuː/ | He left early so as to avoid traffic. | Il est parti tôt pour éviter les bouchons.
in the end | finalement | expr | B1 | /ɪn ði ˈend/ | In the end, we stayed home. | Finalement, nous sommes restés à la maison.
at first | au début | expr | A2 | /ət ˈfɜːst/ | At first, I didn't like it. | Au début, je n'aimais pas ça.
afterwards | ensuite, après | adv | B1 | /ˈɑːftəwədz/ | We ate and afterwards went for a walk. | Nous avons mangé, puis nous sommes allés nous promener.
beforehand | à l'avance | adv | B2 | /bɪˈfɔːhænd/ | Call beforehand to book a table. | Appelle à l'avance pour réserver une table.
immediately | immédiatement | adv | B1 | /ɪˈmiːdiətli/ | Call a doctor immediately. | Appelle un médecin immédiatement.
suddenly | soudain | adv | A2 | /ˈsʌdnli/ | Suddenly, it started to rain. | Soudain, il s'est mis à pleuvoir.
gradually | progressivement | adv | B1 | /ˈɡrædʒuəli/ | The weather gradually improved. | Le temps s'est progressivement amélioré.
fortunately | heureusement | adv | A2 | /ˈfɔːtʃənətli/ | Fortunately, nobody was hurt. | Heureusement, personne n'a été blessé.
unfortunately | malheureusement | adv | A2 | /ʌnˈfɔːtʃənətli/ | Unfortunately, the shop was closed. | Malheureusement, le magasin était fermé.
luckily | par chance | adv | A2 | /ˈlʌkɪli/ | Luckily, I had my umbrella. | Par chance, j'avais mon parapluie.
surprisingly | étonnamment | adv | B2 | /səˈpraɪzɪŋli/ | Surprisingly, the test was easy. | Étonnamment, le contrôle était facile.
honestly | franchement | adv | B1 | /ˈɒnɪstli/ | Honestly, I don't know. | Franchement, je ne sais pas.
frankly | franchement | adv | B2 | /ˈfræŋkli/ | Frankly, it's a bad idea. | Franchement, c'est une mauvaise idée.
personally | personnellement | adv | B1 | /ˈpɜːsənəli/ | Personally, I prefer tea. | Personnellement, je préfère le thé.
basically | en gros | adv | B1 | /ˈbeɪsɪkli/ | Basically, we need more money. | En gros, il nous faut plus d'argent.
essentially | essentiellement | adv | C1 | /ɪˈsenʃəli/ | The idea is essentially simple. | L'idée est essentiellement simple.
whatsoever | quel qu'il soit, du tout | adv | C1 | /ˌwɒtsəʊˈevər/ | I have no doubt whatsoever. | Je n'ai aucun doute.
therein | là, en cela | adv | C2 | /ˌðeərˈɪn/ | Therein lies the problem. | C'est là que réside le problème.
whereby | par lequel | adv | C2 | /weəˈbaɪ/ | A system whereby everyone can vote. | Un système par lequel chacun peut voter.
notwithstanding | nonobstant | prep | C2 | /ˌnɒtwɪθˈstændɪŋ/ | Notwithstanding the rain, the match went on. | Nonobstant la pluie, le match a continué.
albeit | quoique, bien que | conj | C2 | /ˌɔːlˈbiːɪt/ | It was a success, albeit a small one. | Ce fut un succès, quoique modeste.
insofar as | dans la mesure où | conj | C2 | /ˌɪnsəʊˈfɑːr əz/ | I'll help insofar as I can. | J'aiderai dans la mesure du possible.
inasmuch as | dans la mesure où | conj | C2 | /ˌɪnəzˈmʌtʃ əz/ | He is guilty inasmuch as he knew. | Il est coupable dans la mesure où il savait.
hitherto | jusqu'ici | adv | C2 | /ˌhɪðəˈtuː/ | A hitherto unknown manuscript was found. | Un manuscrit jusqu'ici inconnu a été découvert.
henceforth | désormais | adv | C2 | /ˌhensˈfɔːθ/ | Henceforth, the shop will open on Sundays. | Désormais, le magasin ouvrira le dimanche.
thereby | de ce fait | adv | C1 | /ˌðeəˈbaɪ/ | He saved money, thereby avoiding debt. | Il a économisé, évitant ainsi les dettes.
accordingly | en conséquence | adv | C1 | /əˈkɔːdɪŋli/ | Read the rules and act accordingly. | Lis les règles et agis en conséquence.
conversely | inversement | adv | C1 | /ˈkɒnvɜːsli/ | Conversely, cold weather slows growth. | Inversement, le froid ralentit la croissance.
notably | notamment | adv | C1 | /ˈnəʊtəbli/ | Several countries, notably Morocco, invest in solar power. | Plusieurs pays, notamment le Maroc, investissent dans le solaire.
namely | à savoir | adv | C1 | /ˈneɪmli/ | Two cities, namely Fez and Rabat. | Deux villes, à savoir Fès et Rabat.
`,
);
