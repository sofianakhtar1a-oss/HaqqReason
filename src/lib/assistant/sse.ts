/*
 * Lecture d'un flux SSE (server-sent events), tel que la passerelle IA l'envoie en direct.
 * Module pur, testé dans tests/test-assistant.mts.
 */

export type EvenementSse = { event: string; data: string };

/** Découpe un flux d'octets en événements SSE (gère les coupures au milieu d'une ligne). */
export async function* lireSse(flux: ReadableStream<Uint8Array>): AsyncGenerator<EvenementSse> {
  const lecteur = flux.getReader();
  const decodeur = new TextDecoder();
  let tampon = "";
  let evenement = "";
  let donnees: string[] = [];
  const emettre = function* () {
    if (donnees.length) yield { event: evenement || "message", data: donnees.join("\n") };
    evenement = "";
    donnees = [];
  };
  try {
    for (;;) {
      const { value, done } = await lecteur.read();
      tampon += done ? decodeur.decode() : decodeur.decode(value, { stream: true });
      let fin: number;
      while ((fin = tampon.search(/\r\n|\r|\n/)) !== -1) {
        const ligne = tampon.slice(0, fin);
        tampon = tampon.slice(tampon[fin] === "\r" && tampon[fin + 1] === "\n" ? fin + 2 : fin + 1);
        if (ligne === "") yield* emettre();
        else if (ligne.startsWith(":")) continue;
        else {
          const deuxPoints = ligne.indexOf(":");
          const champ = deuxPoints === -1 ? ligne : ligne.slice(0, deuxPoints);
          let valeur = deuxPoints === -1 ? "" : ligne.slice(deuxPoints + 1);
          if (valeur.startsWith(" ")) valeur = valeur.slice(1);
          if (champ === "event") evenement = valeur;
          else if (champ === "data") donnees.push(valeur);
        }
      }
      if (done) {
        if (tampon) {
          if (tampon.startsWith("data:")) donnees.push(tampon.slice(5).trimStart());
          tampon = "";
        }
        yield* emettre();
        return;
      }
    }
  } finally {
    lecteur.releaseLock();
  }
}
