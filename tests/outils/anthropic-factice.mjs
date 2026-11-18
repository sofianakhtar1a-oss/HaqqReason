// Une fausse API Anthropic pour les essais : mêmes adresses, mêmes en-têtes, mêmes événements
// en flux (SSE) que l'API Messages. Chaque requête reçue est notée, pour vérifier ce que le site
// envoie VRAIMENT : la clé de quel utilisateur, quel modèle, quels documents, quel cache.
// Comportements selon la clé : « REVOQUEE » → 401 ; « CREDIT » → crédit épuisé ;
// « SANSEFFORT » → refuse output_config une fois ; « LENT » → réponse longue et lente.
import http from "node:http";
import { createHash } from "node:crypto";

const CLE_VALIDE = /^sk-ant-api03-[A-Za-z0-9_-]{20,}$/;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

function texteDe(bloc) {
  if (typeof bloc === "string") return bloc;
  if (Array.isArray(bloc)) return bloc.map(texteDe).join("\n");
  return bloc?.text ?? "";
}

export function servirAnthropic(port) {
  const journal = [];
  const caches = new Set();
  const serveur = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    let brut = "";
    for await (const m of req) brut += m;
    const cle = req.headers["x-api-key"] ?? "";
    const erreur = (statut, type, message) => {
      res.writeHead(statut, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ type: "error", error: { type, message } }));
    };

    if (url.pathname === "/__journal") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(journal));
    }
    if (url.pathname === "/__vider") {
      journal.length = 0;
      res.writeHead(204);
      return res.end();
    }
    if (req.headers["anthropic-version"] !== "2023-06-01") return erreur(400, "invalid_request_error", "anthropic-version manquante");
    if (!CLE_VALIDE.test(cle) || cle.includes("REVOQUEE")) return erreur(401, "authentication_error", "invalid x-api-key");

    if (req.method === "GET" && url.pathname === "/v1/models") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ data: [{ id: "claude-opus-5-5" }, { id: "claude-sonnet-5-5" }, { id: "claude-haiku-5-5" }], has_more: false }));
    }
    if (req.method !== "POST" || url.pathname !== "/v1/messages") return erreur(404, "not_found_error", "inconnu");

    const corps = JSON.parse(brut);
    journal.push({ cle, entetes: { version: req.headers["anthropic-version"], accept: req.headers.accept }, corps });
    if (cle.includes("CREDIT")) return erreur(400, "invalid_request_error", "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.");
    if (cle.includes("SANSEFFORT") && corps.output_config) return erreur(400, "invalid_request_error", "output_config.effort: Extra inputs are not permitted");
    if (typeof corps.temperature !== "undefined" || typeof corps.top_p !== "undefined") return erreur(400, "invalid_request_error", "temperature is not supported on this model");
    if (!corps.stream || !corps.model || !Array.isArray(corps.messages) || !corps.max_tokens) return erreur(400, "invalid_request_error", "requête incomplète");

    // Le cache : un bloc marqué « cache_control » déjà vu est relu, sinon écrit.
    let ecriture = 0;
    let lecture = 0;
    const blocs = [...[].concat(corps.system ?? []), ...corps.messages.flatMap((m) => [].concat(m.content))];
    let prefixe = "";
    for (const b of blocs) {
      prefixe += texteDe(b);
      if (b?.cache_control) {
        const h = createHash("sha256").update(prefixe).digest("hex");
        const n = Math.ceil(prefixe.length / 2.5);
        if (caches.has(h)) lecture = n;
        else {
          ecriture = n - lecture;
          caches.add(h);
        }
      }
    }
    const total = Math.ceil(blocs.map(texteDe).join("").length / 2.5);
    const entree = Math.max(1, total - ecriture - lecture);

    const derniere = texteDe(corps.messages.at(-1)?.content);
    const question = (/<question>\n([\s\S]*?)\n<\/question>/.exec(derniere)?.[1] ?? derniere).slice(0, 80);
    const pdf = JSON.stringify(corps.system ?? "").includes("ChatPDF");
    const lent = cle.includes("LENT");
    const reponse = pdf
      ? `Tu demandes : « ${question} ».\n\n## Ce que disent les documents\n\nLe premier document l'affirme clairement [Doc 1, p. 2], puis le précise [Doc 1, p. 3-4].\n\n| Document | Thèse |\n| --- | --- |\n| Doc 1 | La raison mène à la vérité |\n\n> « Une citation exacte » [Doc 1, p. 2]`
      : `Tu demandes : « ${question} ».\n\nVoici une réponse de **test** :\n\n- premier point\n- second point\n\n\`\`\`js\nconsole.log("bonjour");\n\`\`\`\n${lent ? "\nUne longue suite. ".repeat(400) : ""}`;

    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    const envoyer = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    let ferme = false;
    req.on("close", () => (ferme = true));
    res.on("close", () => (ferme = true));
    envoyer("message_start", { type: "message_start", message: { id: "msg_test", type: "message", role: "assistant", model: corps.model, content: [], usage: { input_tokens: entree, cache_creation_input_tokens: ecriture, cache_read_input_tokens: lecture, output_tokens: 1 } } });
    envoyer("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "" } });
    envoyer("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "c2lnbmF0dXJl" } });
    envoyer("content_block_stop", { type: "content_block_stop", index: 0 });
    envoyer("content_block_start", { type: "content_block_start", index: 1, content_block: { type: "text", text: "" } });
    res.write(": ping\n\n");
    for (let i = 0; i < reponse.length; i += 14) {
      if (ferme) return;
      envoyer("content_block_delta", { type: "content_block_delta", index: 1, delta: { type: "text_delta", text: reponse.slice(i, i + 14) } });
      await attendre(lent ? 60 : 4);
    }
    envoyer("content_block_stop", { type: "content_block_stop", index: 1 });
    const raison = question.includes("COUPE") ? "max_tokens" : "end_turn";
    envoyer("message_delta", { type: "message_delta", delta: { stop_reason: raison, stop_sequence: null }, usage: { output_tokens: Math.ceil(reponse.length / 2.5) } });
    envoyer("message_stop", { type: "message_stop" });
    res.end();
  });
  return new Promise((ok) => serveur.listen(port, "127.0.0.1", () => ok({ serveur, journal })));
}
