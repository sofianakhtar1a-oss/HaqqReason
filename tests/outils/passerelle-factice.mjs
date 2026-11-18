/*
 * Une fausse passerelle IA, au format « Chat Completions » de la passerelle de Vercel, pour les
 * tests de bout en bout et l'essai dans un navigateur. Elle note chaque requête (jeton, modèle,
 * messages) et répond en flux, comme la vraie : réflexion, texte par morceaux, consommation et coût.
 *
 * Jeton accepté : JETON_ESSAI. Comportements, choisis par le modèle ou par un mot de la question :
 *   - un modèle de `refuses` : 403 « Free tier users do not have access to this model » ;
 *   - « SANS_CREDIT » : 402 insufficient_funds ; « VERIFICATION » : 403 customer_verification_required ;
 *   - « LENT » : réponse lente (pour l'arrêt en cours de route) ; « COUPURE » : erreur au milieu du flux.
 * Un même début de consigne revu plus tard est compté comme relu depuis le cache.
 */
import http from "node:http";

export const JETON_ESSAI = "jeton-passerelle-essai-0123456789";

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export async function servirPasserelle(port, options = {}) {
  const refuses = new Set(options.refuses ?? []);
  const journal = [];
  const consignesVues = new Set();
  const serveur = http.createServer(async (req, res) => {
    let brut = "";
    for await (const morceau of req) brut += morceau;
    let corps = {};
    try {
      corps = JSON.parse(brut);
    } catch {
      // Corps illisible : traité plus bas.
    }
    const jeton = String(req.headers.authorization ?? "").replace(/^Bearer /, "");
    journal.push({ chemin: req.url, jeton, corps });
    const json = (statut, o) => {
      res.writeHead(statut, { "content-type": "application/json" });
      res.end(JSON.stringify(o));
    };
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") return json(404, { error: { message: "Not found", type: "not_found" } });
    if (jeton !== JETON_ESSAI) return json(401, { error: { message: "Invalid authentication token", type: "authentication_error" } });
    const messages = Array.isArray(corps.messages) ? corps.messages : [];
    const consigne = String(messages[0]?.content ?? "");
    const question = String(messages.at(-1)?.content ?? "");
    if (refuses.has(corps.model)) {
      const message = "Free tier users do not have access to this model. Upgrade to paid credits at https://vercel.com/d?to=%2F[team]%2F~%2Fai%3Fmodal%3Dtop-up for unrestricted access.";
      return json(403, { error: { message, type: "no_providers_available", param: { error: message, statusCode: 403, name: "RestrictedModelsError" } } });
    }
    if (question.includes("SANS_CREDIT")) return json(402, { error: { message: "Insufficient funds. Please add credits to your account.", type: "insufficient_funds" } });
    if (question.includes("VERIFICATION")) return json(403, { error: { message: "A valid payment method is required to use free credits.", type: "customer_verification_required" } });

    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    let ferme = false;
    res.on("close", () => (ferme = true));
    const id = `gen_${journal.length}`;
    const envoyer = (o) => !ferme && res.write(`data: ${JSON.stringify(o)}\n\n`);
    envoyer({ id, object: "chat.completion.chunk", model: corps.model, choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] });
    envoyer({ id, object: "chat.completion.chunk", model: corps.model, choices: [{ index: 0, delta: { reasoning: "Je réfléchis." }, finish_reason: null }] });
    const pdf = consigne.includes("<documents>") || question.includes("<extraits>");
    const sujet = question.includes("<question>") ? question.split("<question>\n")[1]?.split("\n</question>")[0] : question;
    const lent = question.includes("LENT");
    const texte = `Tu demandes : « ${sujet} »${pdf ? " Voir [Doc 1, p. 2]." : ""} Voici un exemple :\n\n\`\`\`js\nconsole.log("ok");\n\`\`\`\n${lent ? "Suite. ".repeat(60) : ""}Fin.`;
    const morceaux = texte.match(/[\s\S]{1,12}/g) ?? [];
    for (const m of morceaux) {
      if (ferme) return;
      envoyer({ id, object: "chat.completion.chunk", model: corps.model, choices: [{ index: 0, delta: { content: m }, finish_reason: null }] });
      if (lent) await pause(150);
    }
    if (question.includes("COUPURE")) {
      envoyer({ error: { message: "Upstream provider error", type: "internal_server_error" } });
      return res.end();
    }
    envoyer({ id, object: "chat.completion.chunk", model: corps.model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] });
    const invite = Math.ceil(JSON.stringify(messages).length / 4);
    const relu = consigne.length > 1_500 && consignesVues.has(consigne) ? Math.ceil(consigne.length / 4) : 0;
    consignesVues.add(consigne);
    envoyer({ id, object: "chat.completion.chunk", model: corps.model, choices: [], usage: { prompt_tokens: invite, completion_tokens: Math.ceil(texte.length / 4), prompt_tokens_details: { cached_tokens: relu }, cost: 0.000123 } });
    if (!ferme) res.write("data: [DONE]\n\n");
    res.end();
  });
  await new Promise((r) => serveur.listen(port, "127.0.0.1", r));
  return { journal, fermer: () => new Promise((r) => serveur.close(r)) };
}
