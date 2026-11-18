/* Le Truchement : thème « Géographie et monde » (vocabulaire anglais → français). */
import { theme } from "./outil";

export const GEOGRAPHIE = theme(
  "geographie",
  "Géographie et monde",
  "Les pays, les reliefs, les océans, les cartes et les peuples.",
  "Globe",
  `
world | monde | n | A1 | /wɜːld/ | I want to travel around the world. | Je veux faire le tour du monde.
country | pays | n | A1 | /ˈkʌntri/ | Which country are you from? | De quel pays viens-tu ?
continent | continent | n | A2 | /ˈkɒntɪnənt/ | Africa is a huge continent. | L'Afrique est un immense continent.
border | frontière | n | A2 | /ˈbɔːdər/ | We crossed the border at night. | Nous avons franchi la frontière de nuit.
region | région | n | A2 | /ˈriːdʒən/ | This region is famous for its cheese. | Cette région est célèbre pour son fromage.
north | nord | n | A1 | /nɔːθ/ | Lille is in the north of France. | Lille est dans le nord de la France.
south | sud | n | A1 | /saʊθ/ | We spend summer in the south. | Nous passons l'été dans le sud.
east | est | n | A1 | /iːst/ | The sun rises in the east. | Le soleil se lève à l'est.
west | ouest | n | A1 | /west/ | The sun sets in the west. | Le soleil se couche à l'ouest.
northern | du nord | adj | B1 | /ˈnɔːðən/ | Northern towns are colder. | Les villes du nord sont plus froides.
southern | du sud | adj | B1 | /ˈsʌðən/ | Southern Spain is very hot. | Le sud de l'Espagne est très chaud.
ocean | océan | n | A2 | /ˈəʊʃn/ | The Pacific is the largest ocean. | Le Pacifique est le plus grand océan.
Mediterranean | Méditerranée | n | B1 | /ˌmedɪtəˈreɪniən/ | We swam in the Mediterranean. | Nous avons nagé dans la Méditerranée.
Atlantic | Atlantique | n | B1 | /ətˈlæntɪk/ | They sailed across the Atlantic. | Ils ont traversé l'Atlantique à la voile.
equator | équateur | n | B2 | /ɪˈkweɪtər/ | It's hot all year near the equator. | Il fait chaud toute l'année près de l'équateur.
pole | pôle | n | B1 | /pəʊl/ | Explorers reached the South Pole. | Des explorateurs ont atteint le pôle Sud.
hemisphere | hémisphère | n | C1 | /ˈhemɪsfɪər/ | Australia is in the southern hemisphere. | L'Australie est dans l'hémisphère sud.
latitude | latitude | n | C1 | /ˈlætɪtjuːd/ | Paris lies at a latitude of 48 degrees. | Paris se trouve à une latitude de 48 degrés.
longitude | longitude | n | C1 | /ˈlɒndʒɪtjuːd/ | Find the longitude on the map. | Trouve la longitude sur la carte.
atlas | atlas | n | B1 | /ˈætləs/ | Look up the country in the atlas. | Cherche le pays dans l'atlas.
globe | globe | n | B1 | /ɡləʊb/ | The teacher spun the globe. | Le professeur a fait tourner le globe.
compass | boussole | n | B1 | /ˈkʌmpəs/ | We used a compass in the forest. | Nous avons utilisé une boussole en forêt.
population | population | n | B1 | /ˌpɒpjuˈleɪʃn/ | The population of the city is growing. | La population de la ville augmente.
inhabitant | habitant | n | B1 | /ɪnˈhæbɪtənt/ | The village has 300 inhabitants. | Le village compte 300 habitants.
densely populated | densément peuplé | adj | C1 | /ˌdensli ˈpɒpjuleɪtɪd/ | Hong Kong is densely populated. | Hong Kong est densément peuplé.
mountain range | chaîne de montagnes | n | B1 | /ˈmaʊntɪn reɪndʒ/ | The Alps are a mountain range. | Les Alpes sont une chaîne de montagnes.
peak | sommet | n | B1 | /piːk/ | Snow covers the peak all year. | La neige couvre le sommet toute l'année.
summit | sommet | n | B2 | /ˈsʌmɪt/ | We reached the summit at dawn. | Nous avons atteint le sommet à l'aube.
plateau | plateau | n | C1 | /ˈplætəʊ/ | The village sits on a high plateau. | Le village est perché sur un haut plateau.
gorge | gorge (relief) | n | C1 | /ɡɔːdʒ/ | The river flows through a deep gorge. | La rivière coule dans une gorge profonde.
waterfall | cascade | n | A2 | /ˈwɔːtəfɔːl/ | We swam under the waterfall. | Nous avons nagé sous la cascade.
estuary | estuaire | n | C1 | /ˈestʃuəri/ | Birds feed in the estuary. | Les oiseaux se nourrissent dans l'estuaire.
delta | delta | n | C1 | /ˈdeltə/ | The Nile delta is very fertile. | Le delta du Nil est très fertile.
bay | baie | n | B1 | /beɪ/ | The boats are anchored in the bay. | Les bateaux sont ancrés dans la baie.
gulf | golfe | n | B2 | /ɡʌlf/ | Oil is drilled in the Gulf. | On fore du pétrole dans le Golfe.
strait | détroit | n | C1 | /streɪt/ | Ships pass through the Strait of Gibraltar. | Les navires passent par le détroit de Gibraltar.
archipelago | archipel | n | C2 | /ˌɑːkɪˈpeləɡəʊ/ | Indonesia is a vast archipelago. | L'Indonésie est un vaste archipel.
rainforest | forêt tropicale | n | B1 | /ˈreɪnfɒrɪst/ | The Amazon rainforest is shrinking. | La forêt amazonienne se réduit.
jungle | jungle | n | A2 | /ˈdʒʌŋɡl/ | Tigers live in the jungle. | Les tigres vivent dans la jungle.
savannah | savane | n | B2 | /səˈvænə/ | Lions roam the savannah. | Les lions parcourent la savane.
tundra | toundra | n | C1 | /ˈtʌndrə/ | Few trees grow in the tundra. | Peu d'arbres poussent dans la toundra.
terrain | terrain, relief | n | C1 | /təˈreɪn/ | The terrain is rocky and steep. | Le terrain est rocailleux et escarpé.
landmass | masse continentale | n | C2 | /ˈlændmæs/ | Asia is the largest landmass. | L'Asie est la plus grande masse continentale.
coastline | littoral | n | B2 | /ˈkəʊstlaɪn/ | Brittany has a beautiful coastline. | La Bretagne a un beau littoral.
inland | à l'intérieur des terres | adv | B2 | /ˌɪnˈlænd/ | The town is fifty kilometres inland. | La ville est à cinquante kilomètres à l'intérieur des terres.
overseas | outre-mer, à l'étranger | adv | B2 | /ˌəʊvəˈsiːz/ | She studied overseas for a year. | Elle a étudié à l'étranger pendant un an.
tropical | tropical | adj | B1 | /ˈtrɒpɪkl/ | They live on a tropical island. | Ils vivent sur une île tropicale.
arid | aride | adj | C1 | /ˈærɪd/ | Little grows in this arid region. | Peu de choses poussent dans cette région aride.
mountainous | montagneux | adj | B2 | /ˈmaʊntənəs/ | Switzerland is a mountainous country. | La Suisse est un pays montagneux.
landlocked | enclavé | adj | C1 | /ˈlændlɒkt/ | Mali is a landlocked country. | Le Mali est un pays enclavé.
urban | urbain | adj | B2 | /ˈɜːbən/ | Urban areas are growing fast. | Les zones urbaines grandissent vite.
native | natal ; autochtone | adj | B1 | /ˈneɪtɪv/ | He returned to his native country. | Il est retourné dans son pays natal.
ethnic group | groupe ethnique | n | B2 | /ˈeθnɪk ɡruːp/ | Many ethnic groups live in Nigeria. | De nombreux groupes ethniques vivent au Nigeria.
emigrate | émigrer | v | B2 | /ˈemɪɡreɪt/ | His parents emigrated to Canada. | Ses parents ont émigré au Canada.
expatriate | expatrié | n | C1 | /eksˈpætriət/ | Many expatriates live in Dubai. | De nombreux expatriés vivent à Dubaï.
Europe | Europe | n | A1 | /ˈjʊərəp/ | France is in Europe. | La France est en Europe.
Africa | Afrique | n | A1 | /ˈæfrɪkə/ | Algeria is in North Africa. | L'Algérie est en Afrique du Nord.
Asia | Asie | n | A1 | /ˈeɪʒə/ | China is the biggest country in Asia. | La Chine est le plus grand pays d'Asie.
Middle East | Moyen-Orient | n | B1 | /ˌmɪdl ˈiːst/ | Mecca is in the Middle East. | La Mecque est au Moyen-Orient.
Arabic | arabe (langue) | n | A2 | /ˈærəbɪk/ | She speaks Arabic and French. | Elle parle arabe et français.
English | anglais | n | A1 | /ˈɪŋɡlɪʃ/ | I'm learning English. | J'apprends l'anglais.
French | français | n | A1 | /frentʃ/ | French is spoken in many countries. | Le français est parlé dans de nombreux pays.
Spanish | espagnol | n | A1 | /ˈspænɪʃ/ | Spanish is easy to pronounce. | L'espagnol est facile à prononcer.
German | allemand | n | A1 | /ˈdʒɜːmən/ | My cousin studies German. | Mon cousin étudie l'allemand.
Chinese | chinois | n | A2 | /ˌtʃaɪˈniːz/ | Chinese has thousands of characters. | Le chinois compte des milliers de caractères.
Turkish | turc | n | A2 | /ˈtɜːkɪʃ/ | He learned Turkish in Istanbul. | Il a appris le turc à Istanbul.
America | Amérique | n | A1 | /əˈmerɪkə/ | They flew to America last summer. | Ils sont partis en Amérique l'été dernier.
Oceania | Océanie | n | B1 | /ˌəʊʃiˈɑːniə/ | Australia is the largest country in Oceania. | L'Australie est le plus grand pays d'Océanie.
Antarctica | Antarctique | n | B1 | /ænˈtɑːktɪkə/ | Nobody lives in Antarctica all year. | Personne ne vit toute l'année en Antarctique.
Arctic | Arctique | n | B1 | /ˈɑːktɪk/ | Polar bears live in the Arctic. | Les ours polaires vivent en Arctique.
England | Angleterre | n | A1 | /ˈɪŋɡlənd/ | London is in England. | Londres est en Angleterre.
Britain | Grande-Bretagne | n | A2 | /ˈbrɪtn/ | Tea is very popular in Britain. | Le thé est très populaire en Grande-Bretagne.
United Kingdom | Royaume-Uni | n | A2 | /juˌnaɪtɪd ˈkɪŋdəm/ | The United Kingdom includes Scotland. | Le Royaume-Uni comprend l'Écosse.
United States | États-Unis | n | A1 | /juˌnaɪtɪd ˈsteɪts/ | She lives in the United States. | Elle vit aux États-Unis.
Scotland | Écosse | n | A2 | /ˈskɒtlənd/ | Scotland is famous for its castles. | L'Écosse est célèbre pour ses châteaux.
Ireland | Irlande | n | A2 | /ˈaɪələnd/ | Ireland is very green. | L'Irlande est très verte.
Wales | pays de Galles | n | B1 | /weɪlz/ | Wales has its own language. | Le pays de Galles a sa propre langue.
Spain | Espagne | n | A1 | /speɪn/ | We drove to Spain. | Nous sommes allés en Espagne en voiture.
Germany | Allemagne | n | A1 | /ˈdʒɜːməni/ | Germany borders France. | L'Allemagne est frontalière de la France.
Italy | Italie | n | A1 | /ˈɪtəli/ | Italy is shaped like a boot. | L'Italie a la forme d'une botte.
Belgium | Belgique | n | A2 | /ˈbeldʒəm/ | Brussels is the capital of Belgium. | Bruxelles est la capitale de la Belgique.
Switzerland | Suisse | n | A2 | /ˈswɪtsələnd/ | Switzerland is known for its chocolate. | La Suisse est connue pour son chocolat.
Morocco | Maroc | n | A2 | /məˈrɒkəʊ/ | Morocco has beautiful markets. | Le Maroc a de magnifiques marchés.
Algeria | Algérie | n | A2 | /ælˈdʒɪəriə/ | Algeria is the largest country in Africa. | L'Algérie est le plus grand pays d'Afrique.
Tunisia | Tunisie | n | A2 | /tjuːˈnɪziə/ | We spent a week in Tunisia. | Nous avons passé une semaine en Tunisie.
Egypt | Égypte | n | A2 | /ˈiːdʒɪpt/ | The pyramids are in Egypt. | Les pyramides sont en Égypte.
Saudi Arabia | Arabie saoudite | n | B1 | /ˌsaʊdi əˈreɪbiə/ | Millions of pilgrims travel to Saudi Arabia. | Des millions de pèlerins se rendent en Arabie saoudite.
Senegal | Sénégal | n | B1 | /ˌsenɪˈɡɔːl/ | Dakar is the capital of Senegal. | Dakar est la capitale du Sénégal.
India | Inde | n | A2 | /ˈɪndiə/ | India has more than a billion people. | L'Inde compte plus d'un milliard d'habitants.
Japan | Japon | n | A2 | /dʒəˈpæn/ | Japan is made of many islands. | Le Japon est composé de nombreuses îles.
China | Chine | n | A1 | /ˈtʃaɪnə/ | The Great Wall is in China. | La Grande Muraille est en Chine.
Russia | Russie | n | A2 | /ˈrʌʃə/ | Russia is the biggest country in the world. | La Russie est le plus grand pays du monde.
Canada | Canada | n | A2 | /ˈkænədə/ | They speak French in parts of Canada. | On parle français dans certaines régions du Canada.
Brazil | Brésil | n | A2 | /brəˈzɪl/ | Brazil is famous for football. | Le Brésil est célèbre pour son football.
Indonesia | Indonésie | n | B1 | /ˌɪndəˈniːʒə/ | Indonesia has the largest Muslim population. | L'Indonésie a la plus grande population musulmane.
Pakistan | Pakistan | n | B1 | /ˌpɑːkɪˈstɑːn/ | Urdu is spoken in Pakistan. | L'ourdou est parlé au Pakistan.
Palestine | Palestine | n | B1 | /ˈpæləstaɪn/ | Jerusalem has a long history in Palestine. | Jérusalem a une longue histoire en Palestine.
European | européen | adj | A2 | /ˌjʊərəˈpiːən/ | Many European countries use the euro. | Beaucoup de pays européens utilisent l'euro.
African | africain | adj | A2 | /ˈæfrɪkən/ | She loves African music. | Elle adore la musique africaine.
Asian | asiatique | adj | A2 | /ˈeɪʒn/ | We cooked an Asian dish. | Nous avons cuisiné un plat asiatique.
American | américain | adj | A1 | /əˈmerɪkən/ | He watches American films. | Il regarde des films américains.
British | britannique | adj | A2 | /ˈbrɪtɪʃ/ | Her husband is British. | Son mari est britannique.
Moroccan | marocain | adj | A2 | /məˈrɒkən/ | We had Moroccan tea. | Nous avons bu du thé marocain.
Algerian | algérien | adj | A2 | /ælˈdʒɪəriən/ | My neighbour is Algerian. | Mon voisin est algérien.
Arab | arabe (personne) | adj | B1 | /ˈærəb/ | Arab countries share a language. | Les pays arabes partagent une langue.
Muslim world | monde musulman | n | B2 | /ˌmʊzlɪm ˈwɜːld/ | The Muslim world stretches from Morocco to Indonesia. | Le monde musulman s'étend du Maroc à l'Indonésie.
developing country | pays en développement | n | B2 | /dɪˌveləpɪŋ ˈkʌntri/ | Many developing countries lack clean water. | Beaucoup de pays en développement manquent d'eau potable.
superpower | superpuissance | n | C1 | /ˈsuːpəpaʊər/ | China is becoming a superpower. | La Chine devient une superpuissance.
nation | nation | n | B1 | /ˈneɪʃn/ | The whole nation watched the final. | Toute la nation a regardé la finale.
state | État | n | B1 | /steɪt/ | Texas is a large American state. | Le Texas est un grand État américain.
province | province | n | B2 | /ˈprɒvɪns/ | Quebec is a Canadian province. | Le Québec est une province canadienne.
territory | territoire | n | B2 | /ˈterətri/ | The country lost part of its territory. | Le pays a perdu une partie de son territoire.
frontier | frontière (zone) | n | C1 | /ˈfrʌntɪər/ | Soldiers guarded the frontier. | Des soldats gardaient la frontière.
time zone | fuseau horaire | n | B1 | /ˈtaɪm zəʊn/ | Russia has eleven time zones. | La Russie a onze fuseaux horaires.
sea level | niveau de la mer | n | B2 | /ˈsiː ˌlevl/ | The city is below sea level. | La ville est sous le niveau de la mer.
altitude | altitude | n | B2 | /ˈæltɪtjuːd/ | At high altitude it's hard to breathe. | En haute altitude, on respire mal.
cartography | cartographie | n | C2 | /kɑːˈtɒɡrəfi/ | Cartography has changed with satellites. | La cartographie a changé avec les satellites.
geographical | géographique | adj | B2 | /ˌdʒiːəˈɡræfɪkl/ | The country has a unique geographical position. | Le pays a une position géographique unique.
remote island | île isolée | n | B2 | /rɪˌməʊt ˈaɪlənd/ | They live on a remote island. | Ils vivent sur une île isolée.
mainland | continent (terre ferme) | n | C1 | /ˈmeɪnlænd/ | The ferry connects the island to the mainland. | Le ferry relie l'île au continent.
cape | cap | n | C1 | /keɪp/ | The lighthouse stands on the cape. | Le phare se dresse sur le cap.
fjord | fjord | n | C1 | /fjɔːd/ | Norway is famous for its fjords. | La Norvège est célèbre pour ses fjords.
steppe | steppe | n | C2 | /step/ | Horses run across the steppe. | Des chevaux galopent à travers la steppe.
basin | bassin (fluvial) | n | C1 | /ˈbeɪsn/ | The Amazon basin is enormous. | Le bassin amazonien est immense.
tributary | affluent | n | C2 | /ˈtrɪbjətri/ | The river has many tributaries. | Le fleuve a de nombreux affluents.
Spaniard | Espagnol (personne) | n | B1 | /ˈspænjəd/ | A Spaniard opened a café here. | Un Espagnol a ouvert un café ici.
Italian | italien | adj | A1 | /ɪˈtæliən/ | We love Italian food. | Nous adorons la cuisine italienne.
Portuguese | portugais | adj | A2 | /ˌpɔːtʃʊˈɡiːz/ | Portuguese is spoken in Brazil. | Le portugais est parlé au Brésil.
Russian | russe | adj | A2 | /ˈrʌʃn/ | He is learning Russian. | Il apprend le russe.
Japanese | japonais | adj | A2 | /ˌdʒæpəˈniːz/ | Japanese food is very healthy. | La cuisine japonaise est très saine.
Indian | indien | adj | A2 | /ˈɪndiən/ | We ate at an Indian restaurant. | Nous avons mangé dans un restaurant indien.
Egyptian | égyptien | adj | A2 | /iˈdʒɪpʃn/ | The Egyptian pyramids are ancient. | Les pyramides égyptiennes sont anciennes.
Tunisian | tunisien | adj | A2 | /tjuːˈnɪziən/ | My friend is Tunisian. | Mon ami est tunisien.
Senegalese | sénégalais | adj | B1 | /ˌsenɪɡəˈliːz/ | Senegalese music is joyful. | La musique sénégalaise est joyeuse.
Malian | malien | adj | B1 | /ˈmɑːliən/ | Our Malian neighbours invited us to dinner. | Nos voisins maliens nous ont invités à dîner.
Lebanese | libanais | adj | B1 | /ˌlebəˈniːz/ | Lebanese cuisine is famous. | La cuisine libanaise est célèbre.
Syrian | syrien | adj | B1 | /ˈsɪriən/ | Syrian refugees arrived last year. | Des réfugiés syriens sont arrivés l'an dernier.
Iraqi | irakien | adj | B1 | /ɪˈrɑːki/ | Baghdad is the Iraqi capital. | Bagdad est la capitale irakienne.
Iranian | iranien | adj | B1 | /ɪˈreɪniən/ | Iranian carpets are beautiful. | Les tapis iraniens sont magnifiques.
Pakistani | pakistanais | adj | B1 | /ˌpɑːkɪˈstɑːni/ | The Pakistani team won the match. | L'équipe pakistanaise a gagné le match.
Indonesian | indonésien | adj | B1 | /ˌɪndəˈniːʒn/ | Indonesian islands are very green. | Les îles indonésiennes sont très vertes.
Malaysian | malaisien | adj | B1 | /məˈleɪʒn/ | Malaysian food is spicy. | La cuisine malaisienne est épicée.
Saudi | saoudien | adj | B1 | /ˈsaʊdi/ | Saudi dates are famous. | Les dattes saoudiennes sont célèbres.
Palestinian | palestinien | adj | B1 | /ˌpæləˈstɪniən/ | Palestinian embroidery is very fine. | La broderie palestinienne est très fine.
Belgian | belge | adj | A2 | /ˈbeldʒən/ | Belgian chocolate is delicious. | Le chocolat belge est délicieux.
Swiss | suisse | adj | A2 | /swɪs/ | He works for a Swiss bank. | Il travaille pour une banque suisse.
Canadian | canadien | adj | A2 | /kəˈneɪdiən/ | She married a Canadian doctor. | Elle a épousé un médecin canadien.
Brazilian | brésilien | adj | A2 | /brəˈzɪliən/ | Brazilian football is famous. | Le football brésilien est célèbre.
Mexican | mexicain | adj | A2 | /ˈmeksɪkən/ | Mexican food is spicy. | La cuisine mexicaine est épicée.
Australian | australien | adj | A2 | /ɒˈstreɪliən/ | The Australian coast is beautiful. | La côte australienne est magnifique.
Scottish | écossais | adj | A2 | /ˈskɒtɪʃ/ | He has a Scottish accent. | Il a l'accent écossais.
Irish | irlandais | adj | A2 | /ˈaɪrɪʃ/ | Irish music is lively. | La musique irlandaise est entraînante.
Dutch | néerlandais | adj | A2 | /dʌtʃ/ | Dutch people ride bikes everywhere. | Les Néerlandais font du vélo partout.
Greek | grec | adj | A2 | /ɡriːk/ | Greek islands are popular in summer. | Les îles grecques sont populaires l'été.
Persian | persan | adj | B2 | /ˈpɜːʃn/ | Persian poetry is very old. | La poésie persane est très ancienne.
Urdu | ourdou | n | B2 | /ˈʊəduː/ | Urdu is written in Arabic script. | L'ourdou s'écrit en alphabet arabe.
Hebrew | hébreu | n | B2 | /ˈhiːbruː/ | The Torah was written in Hebrew. | La Torah a été écrite en hébreu.
Berber | berbère | adj | B2 | /ˈbɜːbər/ | Berber villages cling to the mountains. | Des villages berbères s'accrochent aux montagnes.
Netherlands | Pays-Bas | n | A2 | /ˈneðələndz/ | The Netherlands is very flat. | Les Pays-Bas sont très plats.
Portugal | Portugal | n | A2 | /ˈpɔːtʃʊɡl/ | Portugal has beautiful beaches. | Le Portugal a de belles plages.
Greece | Grèce | n | A2 | /ɡriːs/ | We sailed around Greece. | Nous avons navigué autour de la Grèce.
Mexico | Mexique | n | A2 | /ˈmeksɪkəʊ/ | Mexico City is huge. | Mexico est immense.
Australia | Australie | n | A2 | /ɒˈstreɪliə/ | Kangaroos live in Australia. | Les kangourous vivent en Australie.
Iran | Iran | n | B1 | /ɪˈrɑːn/ | Iran has a long history. | L'Iran a une longue histoire.
Iraq | Irak | n | B1 | /ɪˈrɑːk/ | The Tigris flows through Iraq. | Le Tigre traverse l'Irak.
Syria | Syrie | n | B1 | /ˈsɪriə/ | Damascus is the capital of Syria. | Damas est la capitale de la Syrie.
Lebanon | Liban | n | B1 | /ˈlebənən/ | Lebanon has cedar trees. | Le Liban a des cèdres.
Jordan | Jordanie | n | B1 | /ˈdʒɔːdn/ | Petra is in Jordan. | Pétra est en Jordanie.
Malaysia | Malaisie | n | B1 | /məˈleɪʒə/ | Kuala Lumpur is in Malaysia. | Kuala Lumpur est en Malaisie.
Mali | Mali | n | B1 | /ˈmɑːli/ | Timbuktu is a city in Mali. | Tombouctou est une ville du Mali.
Nigeria | Nigeria | n | B1 | /naɪˈdʒɪəriə/ | Nigeria is the most populous country in Africa. | Le Nigeria est le pays le plus peuplé d'Afrique.
South Africa | Afrique du Sud | n | B1 | /ˌsaʊθ ˈæfrɪkə/ | Cape Town is in South Africa. | Le Cap est en Afrique du Sud.
Sahara | Sahara | n | B1 | /səˈhɑːrə/ | We crossed the Sahara by jeep. | Nous avons traversé le Sahara en jeep.
Nile | Nil | n | B1 | /naɪl/ | The Nile is the longest river in Africa. | Le Nil est le plus long fleuve d'Afrique.
Alps | Alpes | n | B1 | /ælps/ | We went skiing in the Alps. | Nous sommes allés skier dans les Alpes.
Himalayas | Himalaya | n | B2 | /ˌhɪməˈleɪəz/ | Everest is in the Himalayas. | L'Everest est dans l'Himalaya.
Pacific | Pacifique | n | B1 | /pəˈsɪfɪk/ | They crossed the Pacific by boat. | Ils ont traversé le Pacifique en bateau.
Indian Ocean | océan Indien | n | B1 | /ˌɪndiən ˈəʊʃn/ | Madagascar is in the Indian Ocean. | Madagascar est dans l'océan Indien.
Red Sea | mer Rouge | n | B1 | /ˌred ˈsiː/ | We went diving in the Red Sea. | Nous sommes allés plonger en mer Rouge.
county | comté | n | B2 | /ˈkaʊnti/ | Kent is a county in England. | Le Kent est un comté d'Angleterre.
eastern | oriental, de l'est | adj | B1 | /ˈiːstən/ | Strasbourg is in eastern France. | Strasbourg se trouve dans l'est de la France.
western | occidental, de l'ouest | adj | B1 | /ˈwestən/ | Laval is in western France. | Laval se trouve dans l'ouest de la France.
north-east | nord-est | n | A2 | /ˌnɔːθ ˈiːst/ | The wind is blowing from the north-east. | Le vent souffle du nord-est.
south-west | sud-ouest | n | A2 | /ˌsaʊθ ˈwest/ | Bordeaux is in the south-west of France. | Bordeaux est dans le sud-ouest de la France.
northern hemisphere | hémisphère Nord | n | B2 | /ˌnɔːðən ˈhemɪsfɪər/ | Europe is in the northern hemisphere. | L'Europe est dans l'hémisphère Nord.
southern hemisphere | hémisphère Sud | n | B2 | /ˌsʌðən ˈhemɪsfɪər/ | Seasons are reversed in the southern hemisphere. | Les saisons sont inversées dans l'hémisphère Sud.
the tropics | les tropiques | n | B2 | /ðə ˈtrɒpɪks/ | It rains a lot in the tropics. | Il pleut beaucoup sous les tropiques.
Tropic of Cancer | tropique du Cancer | n | C1 | /ˌtrɒpɪk əv ˈkænsər/ | The Tropic of Cancer crosses the Sahara. | Le tropique du Cancer traverse le Sahara.
Antarctic | Antarctique | n | B2 | /ænˈtɑːktɪk/ | Penguins live in the Antarctic. | Les manchots vivent en Antarctique.
North Pole | pôle Nord | n | A2 | /ˌnɔːθ ˈpəʊl/ | The North Pole is covered in ice. | Le pôle Nord est couvert de glace.
South Pole | pôle Sud | n | A2 | /ˌsaʊθ ˈpəʊl/ | Amundsen reached the South Pole first. | Amundsen a atteint le premier le pôle Sud.
direction | direction | n | A2 | /dəˈrekʃn/ | Which direction is the sea? | Dans quelle direction est la mer ?
Dead Sea | mer Morte | n | B1 | /ˌded ˈsiː/ | You can float in the Dead Sea. | On peut flotter dans la mer Morte.
Black Sea | mer Noire | n | B1 | /ˌblæk ˈsiː/ | Istanbul lies on the Black Sea. | Istanbul se trouve au bord de la mer Noire.
North Sea | mer du Nord | n | B1 | /ˌnɔːθ ˈsiː/ | The North Sea is cold and grey. | La mer du Nord est froide et grise.
Caspian Sea | mer Caspienne | n | B2 | /ˌkæspiən ˈsiː/ | The Caspian Sea is the largest lake in the world. | La mer Caspienne est le plus grand lac du monde.
Persian Gulf | golfe Persique | n | B2 | /ˌpɜːʃn ˈɡʌlf/ | Oil tankers cross the Persian Gulf. | Les pétroliers traversent le golfe Persique.
English Channel | la Manche | n | B1 | /ˌɪŋɡlɪʃ ˈtʃænl/ | We crossed the English Channel by ferry. | Nous avons traversé la Manche en ferry.
Arabian Peninsula | péninsule Arabique | n | B2 | /əˌreɪbiən pəˈnɪnsjələ/ | Mecca is in the Arabian Peninsula. | La Mecque est dans la péninsule Arabique.
Andes | Andes | n | B2 | /ˈændiːz/ | The Andes run along South America. | Les Andes longent l'Amérique du Sud.
Atlas Mountains | massif de l'Atlas | n | B2 | /ˌætləs ˈmaʊntənz/ | Berber villages dot the Atlas Mountains. | Des villages berbères parsèment l'Atlas.
Rockies | montagnes Rocheuses | n | B2 | /ˈrɒkiz/ | We hiked in the Rockies. | Nous avons randonné dans les Rocheuses.
Pyrenees | Pyrénées | n | B1 | /ˌpɪrəˈniːz/ | The Pyrenees separate France and Spain. | Les Pyrénées séparent la France et l'Espagne.
Euphrates | Euphrate | n | B2 | /juːˈfreɪtiːz/ | The Euphrates flows through Iraq. | L'Euphrate traverse l'Irak.
Tigris | Tigre (fleuve) | n | B2 | /ˈtaɪɡrɪs/ | Baghdad lies on the Tigris. | Bagdad est située sur le Tigre.
Amazon | Amazone ; Amazonie | n | B1 | /ˈæməzən/ | The Amazon is the largest rainforest. | L'Amazonie est la plus grande forêt tropicale.
Danube | Danube | n | B2 | /ˈdænjuːb/ | The Danube flows into the Black Sea. | Le Danube se jette dans la mer Noire.
Rhine | Rhin | n | B2 | /raɪn/ | The Rhine forms part of the border with Germany. | Le Rhin forme une partie de la frontière avec l'Allemagne.
Loire | Loire | n | B1 | /lwɑːr/ | The Loire is the longest river in France. | La Loire est le plus long fleuve de France.
Seine | Seine | n | A2 | /seɪn/ | The Seine flows through Paris. | La Seine traverse Paris.
Thames | Tamise | n | B1 | /temz/ | London Bridge crosses the Thames. | Le London Bridge enjambe la Tamise.
Mississippi | Mississippi | n | B2 | /ˌmɪsɪˈsɪpi/ | The Mississippi flows into the Gulf of Mexico. | Le Mississippi se jette dans le golfe du Mexique.
climate zone | zone climatique | n | B2 | /ˈklaɪmət zəʊn/ | France has several climate zones. | La France a plusieurs zones climatiques.
population density | densité de population | n | C1 | /ˌpɒpjuˈleɪʃn ˌdensəti/ | Mayenne has a low population density. | La Mayenne a une faible densité de population.
sparsely populated | peu peuplé | adj | C1 | /ˌspɑːsli ˈpɒpjuleɪtɪd/ | The north of Canada is sparsely populated. | Le nord du Canada est peu peuplé.
coastal | côtier | adj | B2 | /ˈkəʊstl/ | Coastal towns attract tourists. | Les villes côtières attirent les touristes.
Near East | Proche-Orient | n | C1 | /ˌnɪər ˈiːst/ | The Near East has an ancient history. | Le Proche-Orient a une histoire ancienne.
Far East | Extrême-Orient | n | B2 | /ˌfɑːr ˈiːst/ | Marco Polo travelled to the Far East. | Marco Polo a voyagé jusqu'en Extrême-Orient.
Maghreb | Maghreb | n | B2 | /ˈmæɡreb/ | Morocco, Algeria and Tunisia form the Maghreb. | Le Maroc, l'Algérie et la Tunisie forment le Maghreb.
North Africa | Afrique du Nord | n | A2 | /ˌnɔːθ ˈæfrɪkə/ | Couscous is popular in North Africa. | Le couscous est populaire en Afrique du Nord.
sub-Saharan Africa | Afrique subsaharienne | n | C1 | /ˌsʌb səˌhɑːrən ˈæfrɪkə/ | Sub-Saharan Africa has a young population. | L'Afrique subsaharienne a une population jeune.
West Africa | Afrique de l'Ouest | n | A2 | /ˌwest ˈæfrɪkə/ | Senegal is in West Africa. | Le Sénégal est en Afrique de l'Ouest.
East Africa | Afrique de l'Est | n | A2 | /ˌiːst ˈæfrɪkə/ | Kenya is in East Africa. | Le Kenya est en Afrique de l'Est.
Southeast Asia | Asie du Sud-Est | n | B1 | /ˌsaʊθiːst ˈeɪʒə/ | Indonesia is in Southeast Asia. | L'Indonésie est en Asie du Sud-Est.
Central Asia | Asie centrale | n | B2 | /ˌsentrəl ˈeɪʒə/ | Samarkand is a city in Central Asia. | Samarcande est une ville d'Asie centrale.
Latin America | Amérique latine | n | B1 | /ˌlætɪn əˈmerɪkə/ | Spanish is spoken across Latin America. | L'espagnol est parlé dans toute l'Amérique latine.
South America | Amérique du Sud | n | A2 | /ˌsaʊθ əˈmerɪkə/ | Brazil is the largest country in South America. | Le Brésil est le plus grand pays d'Amérique du Sud.
North America | Amérique du Nord | n | A2 | /ˌnɔːθ əˈmerɪkə/ | Canada is in North America. | Le Canada est en Amérique du Nord.
Central America | Amérique centrale | n | B1 | /ˌsentrəl əˈmerɪkə/ | Panama is in Central America. | Le Panama est en Amérique centrale.
Caribbean | Caraïbes | n | B1 | /ˌkærɪˈbiːən/ | We sailed around the Caribbean. | Nous avons navigué dans les Caraïbes.
Scandinavia | Scandinavie | n | B1 | /ˌskændɪˈneɪviə/ | Winters are long in Scandinavia. | Les hivers sont longs en Scandinavie.
the Balkans | les Balkans | n | B2 | /ðə ˈbɔːlkənz/ | Bosnia is in the Balkans. | La Bosnie est dans les Balkans.
the Levant | le Levant | n | C1 | /ðə ləˈvænt/ | Syria and Lebanon are part of the Levant. | La Syrie et le Liban font partie du Levant.
Mesopotamia | Mésopotamie | n | B2 | /ˌmesəpəˈteɪmiə/ | Writing was born in Mesopotamia. | L'écriture est née en Mésopotamie.
Iberian Peninsula | péninsule Ibérique | n | B2 | /aɪˌbɪəriən pəˈnɪnsjələ/ | Spain and Portugal share the Iberian Peninsula. | L'Espagne et le Portugal se partagent la péninsule Ibérique.
British Isles | îles Britanniques | n | B2 | /ˌbrɪtɪʃ ˈaɪlz/ | The British Isles include Ireland. | Les îles Britanniques incluent l'Irlande.
Great Britain | Grande-Bretagne | n | A2 | /ˌɡreɪt ˈbrɪtn/ | Great Britain is an island. | La Grande-Bretagne est une île.
Northern Ireland | Irlande du Nord | n | A2 | /ˌnɔːðən ˈaɪələnd/ | Belfast is the capital of Northern Ireland. | Belfast est la capitale de l'Irlande du Nord.
Argentina | Argentine | n | A2 | /ˌɑːdʒənˈtiːnə/ | Argentina is famous for tango. | L'Argentine est célèbre pour le tango.
Bosnia | Bosnie | n | A2 | /ˈbɒzniə/ | Sarajevo is the capital of Bosnia. | Sarajevo est la capitale de la Bosnie.
Albania | Albanie | n | A2 | /ælˈbeɪniə/ | Albania lies on the Adriatic Sea. | L'Albanie est bordée par la mer Adriatique.
GMT | heure de Greenwich | n | B2 | /ˌdʒiː em ˈtiː/ | London is on GMT in winter. | Londres est à l'heure de Greenwich en hiver.
contour line | courbe de niveau | n | C1 | /ˈkɒntʊə laɪn/ | Contour lines show the height of the land. | Les courbes de niveau indiquent l'altitude.
grid reference | coordonnées (carte) | n | C1 | /ˈɡrɪd ˌrefrəns/ | Give me the grid reference of the farm. | Donne-moi les coordonnées de la ferme sur la carte.
mineral resources | ressources minérales | n | C1 | /ˌmɪnərəl rɪˈzɔːsɪz/ | The country is rich in mineral resources. | Le pays est riche en ressources minérales.
oil reserves | réserves de pétrole | n | B2 | /ˈɔɪl rɪˌzɜːvz/ | Saudi Arabia has huge oil reserves. | L'Arabie saoudite possède d'immenses réserves de pétrole.
trade winds | alizés | n | C1 | /ˈtreɪd wɪndz/ | Sailors used the trade winds to cross the ocean. | Les marins utilisaient les alizés pour traverser l'océan.
ocean current | courant océanique | n | B2 | /ˈəʊʃn ˌkʌrənt/ | Ocean currents affect the climate. | Les courants océaniques influencent le climat.
Gulf Stream | Gulf Stream | n | C1 | /ˈɡʌlf striːm/ | The Gulf Stream warms Western Europe. | Le Gulf Stream réchauffe l'Europe de l'Ouest.
tectonic plate | plaque tectonique | n | C1 | /tekˌtɒnɪk ˈpleɪt/ | Earthquakes happen where tectonic plates meet. | Les séismes se produisent là où les plaques tectoniques se rencontrent.
fault line | ligne de faille | n | C1 | /ˈfɔːlt laɪn/ | San Francisco sits on a fault line. | San Francisco se trouve sur une ligne de faille.
landform | forme de relief | n | C1 | /ˈlændfɔːm/ | Mountains and valleys are landforms. | Les montagnes et les vallées sont des formes de relief.
topography | topographie | n | C2 | /təˈpɒɡrəfi/ | The topography of the region is varied. | La topographie de la région est variée.
demography | démographie | n | C1 | /dɪˈmɒɡrəfi/ | Demography studies populations. | La démographie étudie les populations.
indigenous | autochtone, indigène | adj | C1 | /ɪnˈdɪdʒənəs/ | The Amazon is home to indigenous peoples. | L'Amazonie abrite des peuples autochtones.
official language | langue officielle | n | B1 | /əˌfɪʃl ˈlæŋɡwɪdʒ/ | Arabic is the official language of Egypt. | L'arabe est la langue officielle de l'Égypte.
dialect | dialecte | n | B2 | /ˈdaɪəlekt/ | Darija is a Moroccan dialect. | La darija est un dialecte marocain.
seat of government | siège du gouvernement | n | C1 | /ˌsiːt əv ˈɡʌvənmənt/ | The Hague is the seat of government in the Netherlands. | La Haye est le siège du gouvernement aux Pays-Bas.
principality | principauté | n | C1 | /ˌprɪnsɪˈpæləti/ | Monaco is a principality. | Monaco est une principauté.
emirate | émirat | n | B2 | /ˈemɪrət/ | Dubai is one of seven emirates. | Dubaï est l'un des sept émirats.
federation | fédération | n | C1 | /ˌfedəˈreɪʃn/ | Russia is a federation. | La Russie est une fédération.
commonwealth | Commonwealth | n | C1 | /ˈkɒmənwelθ/ | Canada is a member of the Commonwealth. | Le Canada est membre du Commonwealth.
overseas territory | territoire d'outre-mer | n | C1 | /ˌəʊvəsiːz ˈterətri/ | Réunion is a French overseas territory. | La Réunion est un territoire français d'outre-mer.
enclave | enclave | n | C1 | /ˈenkleɪv/ | Ceuta is a Spanish enclave in Morocco. | Ceuta est une enclave espagnole au Maroc.
microstate | micro-État | n | C2 | /ˈmaɪkrəʊsteɪt/ | San Marino is a microstate. | Saint-Marin est un micro-État.
city-state | cité-État | n | C1 | /ˈsɪti steɪt/ | Singapore is a city-state. | Singapour est une cité-État.
isle | île | n | B2 | /aɪl/ | The Isle of Wight is off the south coast. | L'île de Wight se trouve au large de la côte sud.
motherland | patrie, mère patrie | n | B2 | /ˈmʌðəlænd/ | He returned to his motherland. | Il est retourné dans sa patrie.
mountaintop | sommet de la montagne | n | B1 | /ˈmaʊntəntɒp/ | We watched the sunrise from the mountaintop. | Nous avons regardé le lever du soleil depuis le sommet.
northeast | nord-est | n | B1 | /ˌnɔːθˈiːst/ | The storm is moving to the northeast. | La tempête se déplace vers le nord-est.
northwest | nord-ouest | n | B1 | /ˌnɔːθˈwest/ | Brittany is in the northwest of France. | La Bretagne est dans le nord-ouest de la France.
southeast | sud-est | n | B1 | /ˌsaʊθˈiːst/ | Marseille is in the southeast. | Marseille est dans le sud-est.
southwest | sud-ouest | n | B1 | /ˌsaʊθˈwest/ | Bordeaux is in the southwest of France. | Bordeaux est dans le sud-ouest de la France.
northeastern | du nord-est | adj | B2 | /ˌnɔːθˈiːstən/ | They live in a northeastern town. | Ils habitent dans une ville du nord-est.
northwestern | du nord-ouest | adj | B2 | /ˌnɔːθˈwestən/ | It's a northwestern region. | C'est une région du nord-ouest.
regional | régional | adj | B1 | /ˈriːdʒənl/ | We tasted the regional dishes. | Nous avons goûté les plats régionaux.
lowland | plaine, basses terres | n | C1 | /ˈləʊlənd/ | The lowlands are often flooded. | Les plaines sont souvent inondées.
moonscape | paysage lunaire | n | C1 | /ˈmuːnskeɪp/ | The desert looked like a moonscape. | Le désert ressemblait à un paysage lunaire.
outback | arrière-pays australien, bush | n | C1 | /ˈaʊtbæk/ | They drove across the outback. | Ils ont traversé l'arrière-pays australien.
subcontinent | sous-continent | n | C1 | /ˌsʌbˈkɒntɪnənt/ | Urdu is spoken across the Indian subcontinent. | L'ourdou est parlé dans tout le sous-continent indien.
tropic | tropique | n | C1 | /ˈtrɒpɪk/ | The island lies near the Tropic of Cancer. | L'île se trouve près du tropique du Cancer.
continental | continental | adj | C1 | /ˌkɒntɪˈnentl/ | We had a continental breakfast. | Nous avons pris un petit-déjeuner continental.
homeland | patrie, pays d'origine | n | B2 | /ˈhəʊmlænd/ | They returned to their homeland. | Ils sont retournés dans leur pays d'origine.
territorial | territorial | adj | C1 | /ˌterəˈtɔːriəl/ | They have a territorial dispute. | Ils ont un différend territorial.
granite | granit | n | C1 | /ˈɡrænɪt/ | Brittany's coast is made of granite. | La côte bretonne est faite de granit.
flint | silex | n | C1 | /flɪnt/ | Early humans made tools from flint. | Les premiers hommes fabriquaient des outils en silex.
limestone | calcaire | n | C1 | /ˈlaɪmstəʊn/ | The cliffs are made of limestone. | Les falaises sont en calcaire.
vista | panorama, perspective | n | C2 | /ˈvɪstə/ | The road offers stunning vistas. | La route offre des panoramas superbes.
volcanic | volcanique | adj | C1 | /vɒlˈkænɪk/ | The island has volcanic soil. | L'île a un sol volcanique.
highland | hautes terres | n | C1 | /ˈhaɪlənd/ | They live in the highlands of Scotland. | Ils vivent dans les Highlands, en Écosse.
quartz | quartz | n | C1 | /kwɔːts/ | The watch runs on quartz. | La montre fonctionne au quartz.
southwestern | du sud-ouest | adj | B2 | /ˌsaʊθˈwestən/ | They live in southwestern France. | Ils vivent dans le sud-ouest de la France.
southeastern | du sud-est | adj | B2 | /ˌsaʊθˈiːstən/ | It's a southeastern town. | C'est une ville du sud-est.
alpine | alpin | adj | C1 | /ˈælpaɪn/ | We stayed in an alpine village. | Nous avons séjourné dans un village alpin.
mound | butte, monticule | n | C1 | /maʊnd/ | There was a mound of earth in the garden. | Il y avait un monticule de terre dans le jardin.
mesa | plateau, mesa | n | C2 | /ˈmeɪsə/ | The town sits on a mesa. | La ville est perchée sur un plateau.
sediment | sédiment | n | C2 | /ˈsedɪmənt/ | The river carries sediment to the sea. | Le fleuve transporte des sédiments jusqu'à la mer.
glacial | glaciaire, glacial | adj | C2 | /ˈɡleɪʃl/ | The valley was formed in the glacial period. | La vallée s'est formée pendant la période glaciaire.
meridian | méridien | n | C2 | /məˈrɪdiən/ | The Greenwich meridian is at zero degrees. | Le méridien de Greenwich est à zéro degré.
geological | géologique | adj | C1 | /ˌdʒiːəˈlɒdʒɪkl/ | They studied the geological layers. | Ils ont étudié les couches géologiques.
elevation | altitude ; élévation | n | C1 | /ˌelɪˈveɪʃn/ | The village is at an elevation of 1,000 metres. | Le village est situé à 1 000 mètres d'altitude.
quarry | carrière (de pierre) ; proie | n | C1 | /ˈkwɒri/ | The stone comes from a local quarry. | La pierre provient d'une carrière locale.
fissure | fissure | n | C2 | /ˈfɪʃə/ | A fissure appeared in the rock. | Une fissure est apparue dans la roche.
tract | étendue (de terre) ; tract | n | C2 | /trækt/ | They bought a large tract of land. | Ils ont acheté une vaste étendue de terre.
panorama | panorama | n | C1 | /ˌpænəˈrɑːmə/ | We enjoyed a panorama of the city. | Nous avons profité d'un panorama sur la ville.
panoramic | panoramique | adj | C1 | /ˌpænəˈræmɪk/ | The restaurant has panoramic views. | Le restaurant offre une vue panoramique.
ore | minerai | n | C2 | /ɔː/ | The region is rich in iron ore. | La région est riche en minerai de fer.
seismic | sismique | adj | C2 | /ˈsaɪzmɪk/ | The region has strong seismic activity. | La région connaît une forte activité sismique.
topographical | topographique | adj | C2 | /ˌtɒpəˈɡræfɪkl/ | They used a topographical map. | Ils ont utilisé une carte topographique.
moor | lande | n | C2 | /mɔː/ | We walked across the moor. | Nous avons traversé la lande à pied.
ice floe | banquise flottante | n | C2 | /ˈaɪs fləʊ/ | A polar bear stood on an ice floe. | Un ours polaire se tenait sur un bloc de glace flottant.
molten | en fusion | adj | C2 | /ˈməʊltən/ | Molten lava flowed down the volcano. | De la lave en fusion coulait sur le volcan.
bastion | bastion | n | C2 | /ˈbæstiən/ | The town was a bastion of tradition. | La ville était un bastion de la tradition.
shoreline | littoral, rivage | n | C1 | /ˈʃɔːlaɪn/ | We walked along the shoreline. | Nous avons marché le long du rivage.
peat | tourbe | n | C2 | /piːt/ | They burn peat for heat. | Ils brûlent de la tourbe pour se chauffer.
mirage | mirage | n | C1 | /ˈmɪrɑːʒ/ | We saw a mirage in the desert. | Nous avons vu un mirage dans le désert.
bedrock | socle, fondement | n | C2 | /ˈbedrɒk/ | Honesty is the bedrock of trust. | L'honnêteté est le socle de la confiance.
heartland | cœur, région centrale | n | C2 | /ˈhɑːtlænd/ | This is the industrial heartland of the country. | C'est le cœur industriel du pays.
strata | strates, couches | n | C2 | /ˈstrɑːtə/ | The rock has several strata. | La roche comporte plusieurs strates.
equatorial | équatorial | adj | C2 | /ˌekwəˈtɔːriəl/ | It has an equatorial climate. | Il y règne un climat équatorial.
expanse | étendue | n | C2 | /ɪkˈspæns/ | A vast expanse of desert lay before us. | Une vaste étendue de désert s'étendait devant nous.
magma | magma | n | C2 | /ˈmæɡmə/ | Magma rises from the volcano. | Le magma remonte du volcan.
confluence | confluent | n | C2 | /ˈkɒnfluəns/ | The city lies at the confluence of two rivers. | La ville se situe au confluent de deux rivières.
lakeside | bord du lac | n | B2 | /ˈleɪksaɪd/ | We had a picnic by the lakeside. | Nous avons pique-niqué au bord du lac.
cavern | caverne | n | C1 | /ˈkævən/ | The cavern was dark and damp. | La caverne était sombre et humide.
upland | hautes terres, plateau | n | C2 | /ˈʌplənd/ | Sheep graze in the uplands. | Les moutons paissent sur les hautes terres.
causeway | chaussée surélevée | n | C2 | /ˈkɔːzweɪ/ | A causeway links the island to the mainland. | Une chaussée relie l'île au continent.
seaboard | littoral, côte | n | C2 | /ˈsiːbɔːd/ | Cities grew along the eastern seaboard. | Des villes se sont développées sur la côte est.
catchment area | secteur (scolaire), bassin | n | C2 | /ˈkætʃmənt ˌeəriə/ | We live in the school's catchment area. | Nous habitons dans le secteur de l'école.
navigable | navigable | adj | C2 | /ˈnævɪɡəbl/ | The river is navigable as far as the city. | Le fleuve est navigable jusqu'à la ville.
chasm | gouffre, abîme | n | C2 | /ˈkæzəm/ | There's a chasm between rich and poor. | Il y a un gouffre entre riches et pauvres.
seashore | bord de mer, rivage | n | B2 | /ˈsiːʃɔː/ | We walked along the seashore. | Nous avons marché le long du rivage.
subtropical | subtropical | adj | C2 | /ˌsʌbˈtrɒpɪkl/ | The region has a subtropical climate. | La région a un climat subtropical.
environs | environs | n | C2 | /ɪnˈvaɪrənz/ | We explored Fez and its environs. | Nous avons exploré Fès et ses environs.
seaport | port maritime | n | B2 | /ˈsiːpɔːt/ | Marseille is a major seaport. | Marseille est un grand port maritime.
grotto | grotte | n | C2 | /ˈɡrɒtəʊ/ | We swam into a grotto. | Nous sommes entrés à la nage dans une grotte.
hinterland | arrière-pays | n | C2 | /ˈhɪntəlænd/ | We explored the hinterland of Agadir. | Nous avons exploré l'arrière-pays d'Agadir.
knoll | butte, monticule | n | C2 | /nəʊl/ | They sat on a grassy knoll. | Ils se sont assis sur une butte herbeuse.
alluvial | alluvial | adj | C2 | /əˈluːviəl/ | The Nile valley has alluvial soil. | La vallée du Nil a un sol alluvial.
cairn | cairn, tas de pierres | n | C2 | /keən/ | Walkers add a stone to the cairn. | Les randonneurs ajoutent une pierre au cairn.
backwater | coin perdu, trou | n | C2 | /ˈbækwɔːtə/ | The town is a sleepy backwater. | La ville est un coin perdu et endormi.
fen | marais, marécage | n | C2 | /fen/ | Birds nest in the fens. | Les oiseaux nichent dans les marais.
wadi | oued | n | C2 | /ˈwɒdi/ | The wadi fills with water after rain. | L'oued se remplit d'eau après la pluie.
demarcation | démarcation | n | C2 | /ˌdiːmɑːˈkeɪʃn/ | The line of demarcation between the two zones. | La ligne de démarcation entre les deux zones.
levee | digue | n | C2 | /ˈlevi/ | The levee broke during the flood. | La digue a cédé pendant l'inondation.
gulch | ravin | n | C2 | /ɡʌltʃ/ | The river runs through a deep gulch. | La rivière coule au fond d'un ravin.
southernmost | le plus au sud | adj | C1 | /ˈsʌðənməʊst/ | It's the southernmost point of Europe. | C'est le point le plus au sud de l'Europe.
islet | îlot | n | C2 | /ˈaɪlət/ | A small islet lies off the coast. | Un petit îlot se trouve au large.
mountainside | flanc de montagne | n | C1 | /ˈmaʊntənsaɪd/ | The village clings to the mountainside. | Le village s'accroche au flanc de la montagne.
outcrop | affleurement (rocheux) | n | C2 | /ˈaʊtkrɒp/ | We sat on a rocky outcrop. | Nous nous sommes assis sur un affleurement rocheux.
precipice | précipice | n | C2 | /ˈpresəpɪs/ | The economy is on the edge of a precipice. | L'économie est au bord du précipice.
sinkhole | doline, effondrement | n | C2 | /ˈsɪŋkhəʊl/ | A sinkhole opened in the road. | Un trou s'est ouvert dans la chaussée.
swampy | marécageux | adj | C1 | /ˈswɒmpi/ | The ground is swampy. | Le terrain est marécageux.
shale | schiste | n | C1 | /ʃeɪl/ | Shale gas is extracted by fracking. | Le gaz de schiste est extrait par fracturation hydraulique.
brink | bord (d'un précipice) | n | C1 | /brɪŋk/ | The country was on the brink of war. | Le pays était au bord de la guerre.
firth | estuaire (en Écosse) | n | C2 | /fɜːθ/ | Edinburgh lies on the Firth of Forth. | Édimbourg se trouve sur l'estuaire du Forth.
garnet | grenat | n | C2 | /ˈɡɑːnɪt/ | She wore a ring with a deep red garnet. | Elle portait une bague ornée d'un grenat rouge foncé.
sedimentary | sédimentaire | adj | C2 | /ˌsedɪˈmentri/ | Limestone is a sedimentary rock. | Le calcaire est une roche sédimentaire.
topographic | topographique | adj | C2 | /ˌtɒpəˈɡræfɪk/ | Hikers use topographic maps. | Les randonneurs utilisent des cartes topographiques.
geophysical | géophysique | adj | C2 | /ˌdʒiːəʊˈfɪzɪkl/ | They carried out a geophysical survey. | Ils ont réalisé une étude géophysique.
amethyst | améthyste | n | C2 | /ˈæməθɪst/ | She wore an amethyst pendant. | Elle portait un pendentif en améthyste.
mountain pass | col (de montagne) | n | B1 | /ˈmaʊntɪn pɑːs/ | The mountain pass is closed in winter. | Le col est fermé en hiver.
rock face | paroi rocheuse | n | B2 | /ˈrɒk feɪs/ | Climbers were scaling the rock face. | Des grimpeurs escaladaient la paroi rocheuse.
moorland | lande | n | B2 | /ˈmʊələnd/ | The road crosses miles of open moorland. | La route traverse des kilomètres de lande.
heathland | lande (de bruyère) | n | C1 | /ˈhiːθlənd/ | Heathland is home to rare birds. | La lande abrite des oiseaux rares.
marshland | marécage | n | B2 | /ˈmɑːʃlənd/ | The river flows through flat marshland. | La rivière traverse des marécages plats.
towpath | chemin de halage | n | C1 | /ˈtəʊpɑːθ/ | We cycled along the canal towpath. | Nous avons pédalé le long du chemin de halage.
river bed | lit de la rivière | n | B2 | /ˈrɪvə bed/ | In summer, the river bed dries up. | En été, le lit de la rivière s'assèche.
river mouth | embouchure | n | B2 | /ˈrɪvə maʊθ/ | The town lies at the river mouth. | La ville se trouve à l'embouchure du fleuve.
sand dune | dune de sable | n | A2 | /ˈsænd djuːn/ | The children rolled down the sand dunes. | Les enfants dévalaient les dunes en roulant.
shingle | galets | n | C1 | /ˈʃɪŋɡl/ | Brighton has a shingle beach. | Brighton a une plage de galets.
tidal wave | raz-de-marée | n | B2 | /ˈtaɪdl weɪv/ | A tidal wave swept away the village. | Un raz-de-marée a emporté le village.
undertow | ressac, contre-courant | n | C1 | /ˈʌndətəʊ/ | Swimmers were warned about the strong undertow. | On a averti les nageurs du fort contre-courant.
rip current | courant d'arrachement, baïne | n | C1 | /ˈrɪp ˌkʌrənt/ | Don't swim against a rip current. | Ne nage pas contre un courant d'arrachement.
coral reef | récif corallien | n | B1 | /ˈkɒrəl riːf/ | The Great Barrier Reef is the largest coral reef in the world. | La Grande Barrière est le plus grand récif corallien du monde.
headland | promontoire, cap | n | C1 | /ˈhedlənd/ | A lighthouse stands on the headland. | Un phare se dresse sur le promontoire.
inlet | crique, bras de mer | n | C1 | /ˈɪnlet/ | The boat sheltered in a narrow inlet. | Le bateau s'est abrité dans une crique étroite.
aftershock | réplique (sismique) | n | C1 | /ˈɑːftəʃɒk/ | Several aftershocks followed the earthquake. | Plusieurs répliques ont suivi le séisme.
mudslide | coulée de boue | n | B2 | /ˈmʌdslaɪd/ | Heavy rain caused a mudslide. | Des pluies diluviennes ont provoqué une coulée de boue.
flood plain | plaine inondable | n | C1 | /ˈflʌd pleɪn/ | Houses built on the flood plain are at risk. | Les maisons construites en zone inondable sont exposées.
onyx | onyx | n | C2 | /ˈɒnɪks/ | The table top is made of black onyx. | Le plateau de la table est en onyx noir.
mica | mica | n | C2 | /ˈmaɪkə/ | Mica glitters in the rock. | Le mica scintille dans la roche.
Jerusalem | Jérusalem | n | A2 | /dʒəˈruːsələm/ | Jerusalem is holy to Jews, Christians and Muslims. | Jérusalem est une ville sainte pour les juifs, les chrétiens et les musulmans.
Aramaic | araméen | n | C1 | /ˌærəˈmeɪɪk/ | Jesus probably spoke Aramaic. | Jésus parlait probablement araméen.
Latin | latin | n | A2 | /ˈlætɪn/ | Many English words come from Latin. | Beaucoup de mots anglais viennent du latin.
`,
);
