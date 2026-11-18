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
  const autres = fauxAutres(journal);
  const servirAutre = (req, res, url, brut) => autres(req, res, url, brut);
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
    if (url.pathname.startsWith("/v1beta/") || req.headers.authorization) return servirAutre(req, res, url, brut);
    if (req.headers["anthropic-version"] !== "2023-06-01") return erreur(400, "invalid_request_error", "anthropic-version manquante");
    if (!CLE_VALIDE.test(cle) || cle.includes("REVOQUEE")) return erreur(401, "authentication_error", "invalid x-api-key");

    if (req.method === "GET" && url.pathname === "/v1/models") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ data: [{ id: "claude-opus-5-5" }, { id: "claude-sonnet-5-5" }, { id: "claude-haiku-5-5" }], has_more: false }));
    }
    if (req.method !== "POST" || url.pathname !== "/v1/messages") return erreur(404, "not_found_error", "inconnu");

    const corps = JSON.parse(brut);
    journal.push({ ia: "anthropic", cle, entetes: { version: req.headers["anthropic-version"], accept: req.headers.accept }, corps });
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

/* ---------- ChatGPT (API Responses) et Gemini (streamGenerateContent) ---------- */
function fauxAutres(journal) {
  return async (req, res, url, brut) => {
    const json = (statut, corps) => {
      res.writeHead(statut, { "Content-Type": "application/json" });
      res.end(JSON.stringify(corps));
    };
    const sse = () => res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    const reponseDe = (question, pdf) =>
      pdf ? `Réponse de test à « ${question.slice(0, 60)} ». Le document le dit [Doc 1, p. 2].` : `Réponse de test à « ${question.slice(0, 60)} ».\n\n- un point\n- un autre point`;

    if (url.pathname.startsWith("/v1beta/")) {
      // Gemini : la clé voyage dans l'en-tête, jamais dans l'adresse.
      const cle = req.headers["x-goog-api-key"] ?? "";
      if (url.searchParams.has("key")) return json(400, { error: { status: "INVALID_ARGUMENT", message: "clé dans l'adresse" } });
      if (!/^AIza[A-Za-z0-9_-]{30,}$/.test(cle) || cle.includes("REVOQUEE")) return json(400, { error: { code: 400, status: "INVALID_ARGUMENT", message: "API key not valid. Please pass a valid API key." } });
      if (req.method === "GET" && url.pathname === "/v1beta/models") return json(200, { models: [{ name: "models/gemini-3.8-flash" }, { name: "models/gemini-3.5-flash-lite" }, { name: "models/gemini-3.1-pro-preview" }] });
      const m = /^\/v1beta\/models\/([^/:]+):streamGenerateContent$/.exec(url.pathname);
      if (!m || req.method !== "POST" || url.searchParams.get("alt") !== "sse") return json(404, { error: { status: "NOT_FOUND", message: "inconnu" } });
      const corps = JSON.parse(brut);
      journal.push({ ia: "google", cle, chemin: url.pathname + url.search, corps });
      if (cle.includes("QUOTA")) return json(429, { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Quota exceeded" } });
      const derniere = corps.contents.at(-1).parts[0].text;
      const question = /<question>\n([\s\S]*?)\n<\/question>/.exec(derniere)?.[1] ?? derniere;
      const texte = reponseDe(question, JSON.stringify(corps.systemInstruction).includes("ChatPDF"));
      sse();
      res.write(`data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "…", thought: true }] } }], usageMetadata: { thoughtsTokenCount: 20 } })}\r\n\r\n`);
      for (let i = 0; i < texte.length; i += 16) res.write(`data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: texte.slice(i, i + 16) }] } }] })}\r\n\r\n`);
      const invite = Math.ceil(JSON.stringify(corps).length / 2.5);
      res.write(`data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: invite, cachedContentTokenCount: 0, candidatesTokenCount: Math.ceil(texte.length / 2.5), thoughtsTokenCount: 20 } })}\r\n\r\n`);
      return res.end();
    }

    // OpenAI
    const cle = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(cle) || cle.includes("REVOQUEE")) return json(401, { error: { type: "invalid_request_error", code: "invalid_api_key", message: "Incorrect API key provided" } });
    if (req.method === "GET" && url.pathname === "/v1/models") return json(200, { object: "list", data: [{ id: "gpt-6.2-sol" }, { id: "gpt-6-luna" }, { id: "gpt-6.2-astra" }] });
    if (req.method !== "POST" || url.pathname !== "/v1/responses") return json(404, { error: { code: "not_found", message: "inconnu" } });
    const corps = JSON.parse(brut);
    journal.push({ ia: "openai", cle, chemin: url.pathname, corps });
    if (cle.includes("QUOTA")) return json(429, { error: { type: "insufficient_quota", code: "insufficient_quota", message: "You exceeded your current quota, please check your plan and billing details." } });
    if (!corps.stream || !corps.model || !Array.isArray(corps.input)) return json(400, { error: { message: "requête incomplète" } });
    const derniere = corps.input.at(-1).content;
    const question = /<question>\n([\s\S]*?)\n<\/question>/.exec(derniere)?.[1] ?? derniere;
    const texte = reponseDe(question, String(corps.instructions).includes("ChatPDF"));
    sse();
    const ev = (o) => res.write(`event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`);
    ev({ type: "response.created", response: { id: "resp_test", status: "in_progress" } });
    ev({ type: "response.output_item.added", item: { type: "reasoning" } });
    for (let i = 0; i < texte.length; i += 16) ev({ type: "response.output_text.delta", delta: texte.slice(i, i + 16) });
    const invite = Math.ceil(JSON.stringify(corps).length / 2.5);
    ev({ type: "response.completed", response: { status: "completed", usage: { input_tokens: invite, input_tokens_details: { cached_tokens: 0 }, output_tokens: Math.ceil(texte.length / 2.5) } } });
    return res.end();
  };
}
