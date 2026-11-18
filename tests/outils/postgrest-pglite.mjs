// Un petit PostgREST pour les essais : les requêtes de @supabase/supabase-js (lecture, écriture,
// mise à jour, suppression, comptage, fonctions) sont traduites en SQL et exécutées dans un vrai
// PostgreSQL embarqué (PGlite), avec TOUTES les migrations du site. Rien ne sort de la machine.
// Seul ce dont le site a besoin est géré : filtres eq/neq/gt/gte/lt/lte/in/is, order, limit,
// on_conflict, Prefer return/count, Accept objet.
import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync, readdirSync } from "node:fs";
import http from "node:http";

export async function ouvrirBase() {
  const db = new PGlite({ extensions: { unaccent, pg_trgm } });
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema extensions; grant usage on schema extensions to anon, authenticated, service_role;
    create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
  const dossier = new URL("../../supabase/migrations/", import.meta.url);
  for (const f of readdirSync(dossier).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(new URL(f, dossier), "utf8"));
  return db;
}

const IDENT = /^[a-z_][a-z0-9_]*$/i;
const ident = (n) => {
  if (!IDENT.test(n)) throw Object.assign(new Error(`identifiant refusé : ${n}`), { statut: 400 });
  return `"${n}"`;
};
const RESERVES = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };

function clauseWhere(params, valeurs) {
  const clauses = [];
  for (const [cle, val] of params) {
    if (RESERVES.has(cle)) continue;
    const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|in|is|like|ilike)\.([\s\S]*)$/.exec(val);
    if (!m) continue;
    const [, non, op, brut] = m;
    const col = ident(cle);
    let sql;
    if (op === "in") {
      const items = brut.replace(/^\(/, "").replace(/\)$/, "").split(",").map((x) => x.replace(/^"|"$/g, ""));
      valeurs.push(items);
      sql = `${col}::text = any($${valeurs.length}::text[])`;
    } else if (op === "is") sql = `${col} is ${brut === "null" ? "null" : brut === "true" ? "true" : "false"}`;
    else {
      valeurs.push(brut);
      sql = `${col} ${OPS[op]} $${valeurs.length}`;
    }
    clauses.push(non ? `not (${sql})` : sql);
  }
  return clauses.length ? ` where ${clauses.join(" and ")}` : "";
}

function colonnes(params) {
  const s = params.get("select");
  if (!s || s === "*") return "*";
  return s.split(",").map((c) => ident(c.trim())).join(", ");
}

function ordre(params) {
  const o = params.get("order");
  if (!o) return "";
  return ` order by ${o
    .split(",")
    .map((p) => {
      const [c, sens, nulls] = p.split(".");
      return `${ident(c)} ${sens === "desc" ? "desc" : "asc"}${nulls === "nullsfirst" ? " nulls first" : nulls === "nullslast" ? " nulls last" : ""}`;
    })
    .join(", ")}`;
}

const json = (v) => JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? Number(x) : x));

function repondre(res, statut, corps, entetes = {}) {
  res.writeHead(statut, { "Content-Type": "application/json; charset=utf-8", ...entetes });
  res.end(corps === undefined ? "" : json(corps));
}

function erreurPg(e) {
  const code = e.code ?? "";
  const statut = e.statut ?? (code === "23505" ? 409 : code === "42P01" ? 404 : code.startsWith("23") || code.startsWith("22") ? 400 : 400);
  return { statut, corps: { code, message: e.message, details: e.detail ?? null, hint: null } };
}

export function servirPostgrest(db, port) {
  const appels = [];
  const serveur = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    let corps = "";
    for await (const morceau of req) corps += morceau;
    appels.push({ methode: req.method, chemin: url.pathname, recherche: url.search });
    try {
      if (!url.pathname.startsWith("/rest/v1/")) return repondre(res, 404, { message: "inconnu" });
      const reste = url.pathname.slice("/rest/v1/".length);
      const prefer = req.headers.prefer ?? "";
      const objet = (req.headers.accept ?? "").includes("vnd.pgrst.object+json");

      if (reste.startsWith("rpc/")) {
        const nom = reste.slice(4);
        ident(nom);
        const args = corps ? JSON.parse(corps) : {};
        const valeurs = [];
        const liste = Object.entries(args).map(([k, v]) => {
          valeurs.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v);
          return `${ident(k)} => $${valeurs.length}`;
        });
        const info = await db.query(`select p.proretset, t.typtype from pg_proc p join pg_type t on t.oid = p.prorettype where p.proname = $1 and p.pronamespace = 'public'::regnamespace limit 1`, [nom]);
        if (!info.rows.length) return repondre(res, 404, { code: "PGRST202", message: `Could not find the function public.${nom}` });
        const { proretset, typtype } = info.rows[0];
        if (proretset || typtype === "c") {
          const r = await db.query(`select * from public.${ident(nom)}(${liste.join(", ")})`, valeurs);
          return repondre(res, 200, proretset ? r.rows : (r.rows[0] ?? null));
        }
        const r = await db.query(`select public.${ident(nom)}(${liste.join(", ")}) as r`, valeurs);
        return repondre(res, 200, r.rows[0]?.r ?? null);
      }

      const table = ident(reste);
      const params = url.searchParams;
      const valeurs = [];

      if (req.method === "GET" || req.method === "HEAD") {
        const where = clauseWhere(params, valeurs);
        if (req.method === "HEAD" || /count=exact/.test(prefer)) {
          const n = Number((await db.query(`select count(*)::int as n from public.${table}${where}`, valeurs)).rows[0].n);
          if (req.method === "HEAD") {
            res.writeHead(200, { "Content-Range": `*/${n}` });
            return res.end();
          }
        }
        const limite = params.get("limit") ? ` limit ${Number(params.get("limit"))}` : "";
        const decalage = params.get("offset") ? ` offset ${Number(params.get("offset"))}` : "";
        const r = await db.query(`select ${colonnes(params)} from public.${table}${where}${ordre(params)}${limite}${decalage}`, valeurs);
        if (objet) {
          if (r.rows.length !== 1) return repondre(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
          return repondre(res, 200, r.rows[0]);
        }
        return repondre(res, 200, r.rows);
      }

      const retour = /return=representation/.test(prefer);
      const choix = retour ? ` returning ${colonnes(params)}` : "";
      let r;
      if (req.method === "POST") {
        const lignes = [].concat(JSON.parse(corps || "[]"));
        if (!lignes.length) return repondre(res, 201, retour ? [] : undefined);
        const cols = [...new Set(lignes.flatMap((l) => Object.keys(l)))];
        const tuples = lignes.map(
          (l) =>
            `(${cols
              .map((c) => {
                if (!(c in l)) return "default";
                const v = l[c];
                valeurs.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v);
                return `$${valeurs.length}`;
              })
              .join(", ")})`,
        );
        let conflit = "";
        if (params.get("on_conflict")) {
          const cles = params.get("on_conflict").split(",").map((c) => ident(c.trim()));
          const maj = cols.filter((c) => !cles.includes(`"${c}"`)).map((c) => `${ident(c)} = excluded.${ident(c)}`);
          conflit = /resolution=ignore-duplicates/.test(prefer) || !maj.length ? ` on conflict (${cles.join(", ")}) do nothing` : ` on conflict (${cles.join(", ")}) do update set ${maj.join(", ")}`;
        }
        r = await db.query(`insert into public.${table} (${cols.map(ident).join(", ")}) values ${tuples.join(", ")}${conflit}${choix}`, valeurs);
        if (!retour) return repondre(res, 201, undefined);
        if (objet) return r.rows.length === 1 ? repondre(res, 201, r.rows[0]) : repondre(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
        return repondre(res, 201, r.rows);
      }
      if (req.method === "PATCH") {
        const champs = JSON.parse(corps || "{}");
        const sets = Object.entries(champs).map(([k, v]) => {
          valeurs.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v);
          return `${ident(k)} = $${valeurs.length}`;
        });
        if (!sets.length) return repondre(res, 200, []);
        r = await db.query(`update public.${table} set ${sets.join(", ")}${clauseWhere(params, valeurs)}${choix}`, valeurs);
      } else if (req.method === "DELETE") {
        r = await db.query(`delete from public.${table}${clauseWhere(params, valeurs)}${choix}`, valeurs);
      } else return repondre(res, 405, { message: "méthode" });
      if (!retour) return repondre(res, 204, undefined);
      if (objet) return r.rows.length === 1 ? repondre(res, 200, r.rows[0]) : repondre(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
      return repondre(res, 200, r.rows);
    } catch (e) {
      const { statut, corps: c } = erreurPg(e);
      return repondre(res, statut, c);
    }
  });
  return new Promise((ok) => serveur.listen(port, "127.0.0.1", () => ok({ serveur, appels })));
}
