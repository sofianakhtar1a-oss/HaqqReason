import { aligner, construirePhrases, depuisWhisper, motA, normaliser, phraseA, recoller } from "../src/lib/alambic/transcription/phrases";
import { versSrt, versTexte, versVtt } from "../src/lib/alambic/transcription/exports";
import { idYoutube } from "../src/lib/alambic/transcription/lien";
import { texteDe } from "../src/lib/alambic/transcription/types";

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${JSON.stringify(x)}`));
  if (!c) e++;
};

// ---------------------------------------------------------------- alignement
ok("normaliser ôte ponctuation, accents et voyelles arabes", normaliser("¿Qué?") === "que" && normaliser("الْحَمْدُ") === "الحمد");
const a = aligner("Hello, world! How are you?", 0, 3, [
  { t: "Hello", d: 0, f: 0.4 },
  { t: "world", d: 0.5, f: 0.9 },
  { t: "How", d: 1.5, f: 1.7 },
  { t: "are", d: 1.8, f: 1.9 },
  { t: "you", d: 2, f: 2.3 },
]);
ok("chaque mot ponctué reçoit les instants du moteur", a.length === 5 && a[1].t === "world!" && a[1].d === 0.5 && a[4].f === 2.3, a);
const trou = aligner("Un deux trois quatre", 10, 14, [{ t: "Un", d: 10, f: 10.5 }, { t: "quatre", d: 13, f: 14 }]);
ok("les mots manquants sont répartis entre leurs voisins", trou[1].d >= 10.5 && trou[2].f <= 13 && trou[1].d < trou[2].d, trou);
const coupe = aligner("Unbelievable story", 0, 2, [{ t: "Unbeliev", d: 0, f: 0.5 }, { t: "able", d: 0.5, f: 0.9 }, { t: "story", d: 1, f: 1.5 }]);
ok("un mot découpé en deux par Whisper est recollé", coupe[0].f === 0.9 && coupe[1].d === 1, coupe);
const arabe = aligner("بِسْمِ اللَّهِ الرَّحْمَنِ", 0, 2, [{ t: "بسم", d: 0, f: 0.5 }, { t: "الله", d: 0.6, f: 1 }, { t: "الرحمن", d: 1.1, f: 1.8 }]);
ok("l'arabe vocalisé s'aligne sur l'arabe nu", arabe.every((m, i) => m.d === [0, 0.6, 1.1][i]), arabe);

// ---------------------------------------------------------------- filtrage de Whisper
const frs = depuisWhisper(
  [
    { start: 0, end: 2, text: " Bonjour à tous.", no_speech_prob: 0.01, avg_logprob: -0.2 },
    { start: 2, end: 4, text: " Sous-titres réalisés par la communauté d'Amara.org", no_speech_prob: 0.7, avg_logprob: -1.2 },
    { start: 4, end: 5, text: " Merci.", no_speech_prob: 0.9, avg_logprob: -1.5 },
    { start: 5, end: 6, text: " Encore.", avg_logprob: -0.2 },
    { start: 6, end: 7, text: " Encore.", avg_logprob: -0.2 },
    { start: 7, end: 8, text: " Encore.", avg_logprob: -0.2 },
  ],
  [{ word: "Bonjour", start: 0, end: 0.5 }, { word: "à", start: 0.6, end: 0.7 }, { word: "tous", start: 0.8, end: 1.2 }],
);
ok("silences et génériques inventés sont écartés", frs.length === 3 && frs[0].texte === "Bonjour à tous.", frs.map((f) => f.texte));
ok("une boucle de répétition est coupée à deux", frs.filter((f) => f.texte === "Encore.").length === 2);

// ---------------------------------------------------------------- coutures entre morceaux
const mots = recoller([
  { decalage: 0, de: -Infinity, a: 600, fragments: [{ texte: "fin du premier morceau", d: 597, f: 601, mots: [{ t: "fin", d: 597, f: 597.5 }, { t: "du", d: 598, f: 598.4 }, { t: "premier", d: 599, f: 599.6 }, { t: "morc", d: 600.6, f: 601 }] }] },
  { decalage: 598.5, de: 600, a: Infinity, fragments: [{ texte: "premier morceau suite", d: 0.5, f: 4, mots: [{ t: "premier", d: 0.5, f: 1.1 }, { t: "morceau", d: 2.1, f: 2.8 }, { t: "suite", d: 3, f: 3.5 }] }] },
]);
ok("aucun mot en double ni coupé à la couture", mots.map((m) => m.t).join(" ") === "fin du premier morceau suite", mots.map((m) => m.t));
ok("les instants du second morceau sont replacés dans le fichier", Math.abs(mots[3].d - 600.6) < 0.001, mots[3]);

// ---------------------------------------------------------------- phrases et paragraphes
const flux = "This is the first sentence. And here is a second one! Is it a question? Dr. Smith agrees.".split(" ").map((t, i) => ({ t, d: i, f: i + 0.8 }));
const ph = construirePhrases(flux);
ok("le texte ponctué est coupé aux points, pas aux abréviations", ph.length === 4 && texteDe(ph[3]) === "Dr. Smith agrees.", ph.map(texteDe));
const sansPonctuation = Array.from({ length: 40 }, (_, i) => ({ t: `mot${i}`, d: i * 0.4 + (i === 12 ? 1 : 0) + (i >= 12 ? 1 : 0), f: i * 0.4 + 0.3 + (i >= 12 ? 1 : 0) }));
const ph2 = construirePhrases(sansPonctuation);
ok("sans ponctuation, les phrases suivent les pauses de la voix", ph2.length >= 2 && ph2[0].mots.length === 12, ph2.map((p) => p.mots.length));
const longs = Array.from({ length: 20 }, (_, k) => [`Phrase`, `numéro`, `${k}.`].map((t, i) => ({ t, d: k * 3 + i * 0.5, f: k * 3 + i * 0.5 + 0.4 }))).flat();
const ph3 = construirePhrases(longs);
ok("les paragraphes regroupent six phrases au plus", Math.max(...ph3.map((p) => p.paragraphe)) >= 3 && ph3.filter((p) => p.paragraphe === 0).length <= 6);
ok("la phrase lue est retrouvée à tout instant", phraseA(ph, 5.2) === 1 && phraseA(ph, -3) === -1 && phraseA(ph, 999) === 3);
ok("le mot lu est retrouvé dans la phrase", motA(ph[0], 2.1) === 2);

// ---------------------------------------------------------------- exports
const srt = versSrt(ph);
ok("le SRT est numéroté et horodaté à la milliseconde", /^1\n00:00:00,000 --> 00:00:0\d,\d{3}\nThis is the first sentence\.\n/.test(srt), srt.slice(0, 80));
const blocs = srt.trim().split(/\n\n/).map((b) => b.split("\n"));
const fins = blocs.map((b) => b[1].split(" --> "));
ok("les répliques ne se chevauchent jamais", fins.every((f, i) => i === 0 || f[0] >= fins[i - 1][1]));
const tresLongue = construirePhrases(Array.from({ length: 50 }, (_, i) => ({ t: i === 49 ? "fin." : "parole", d: i * 0.3, f: i * 0.3 + 0.25 })));
const repliques = versSrt(tresLongue).trim().split(/\n\n/);
ok("une phrase longue tient en répliques de deux lignes de 42 signes", repliques.length > 1 && repliques.every((r) => r.split("\n").slice(2).length <= 2 && r.split("\n").slice(2).every((l) => l.length <= 42)), repliques[0]);
ok("le WebVTT commence par son en-tête", versVtt(ph, "en").startsWith("WEBVTT\nLanguage: en\n\n00:00:00.000 --> "));
const txt = versTexte({ titre: "Cours", phrases: ph3, traductions: { 0: "Phrase numéro 0." } }, true);
ok("le texte propre garde les paragraphes et la traduction en regard", txt.startsWith("Cours\n\nPhrase numéro 0.") && txt.includes("— Phrase numéro 0.") && txt.split("\n\n").length > 4);

// ---------------------------------------------------------------- liens YouTube
const id = "dQw4w9WgXcQ";
ok(
  "toutes les formes de lien YouTube sont reconnues",
  [`https://www.youtube.com/watch?v=${id}&t=42`, `https://youtu.be/${id}?si=x`, `youtube.com/shorts/${id}`, `https://m.youtube.com/watch?v=${id}`, `https://www.youtube.com/embed/${id}`, `https://www.youtube.com/live/${id}`, id].every((l) => idYoutube(l) === id),
);
ok("un lien étranger est refusé", idYoutube("https://vimeo.com/123456") === null && idYoutube("https://evil.com/watch?v=dQw4w9WgXcQ") === null);

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
