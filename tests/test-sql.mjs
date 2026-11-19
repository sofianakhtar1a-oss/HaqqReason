// Vérifie le schéma et les règles de sécurité (RLS) dans un PostgreSQL embarqué.
// Lancer : npm run test:sql
import { PGlite } from "@electric-sql/pglite";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";

const db = new PGlite({ extensions: { unaccent, pg_trgm } });
let echecs = 0;
const ok = (nom, cond) => { console.log(`${cond ? "OK  " : "ECHEC"} ${nom}`); if (!cond) echecs++; };
const refuse = async (nom, sql) => {
  try { const r = await db.query(sql); ok(nom, (r.affectedRows ?? 0) === 0 && r.rows.length === 0); }
  catch { ok(nom, true); }
};

// Rôles que Supabase fournit d'office
await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;`);
// Ce que Supabase fournit d'office : le schéma « extensions » et la table des espaces de stockage.
await db.exec(`create schema extensions; grant usage on schema extensions to anon, authenticated, service_role;
  create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
for (const fichier of ["001_socle.sql", "002_structure.sql", "003_editeur.sql", "004_fichiers.sql", "005_recherche.sql", "006_innovations.sql", "007_sources_navigation.sql", "008_reglages.sql", "009_recherche_sens.sql", "010_contributions.sql", "011_espaces.sql", "011_espaces.sql", "012_islam_un_bloc.sql", "012_islam_un_bloc.sql", "013_messagerie.sql", "013_messagerie.sql", "014_comptes.sql", "014_comptes.sql", "015_classement.sql", "015_classement.sql", "016_assistant.sql", "016_assistant.sql", "017_portulan.sql", "017_portulan.sql", "018_portulan_social.sql", "018_portulan_social.sql"]) {
  await db.exec(readFileSync(new URL(`../supabase/migrations/${fichier}`, import.meta.url), "utf8"));
}

// 011 : deux espaces, la migration se relance sans rien casser
{
  const r = await db.query("select espace, count(*)::int as n from blocs group by espace order by espace");
  ok("011-012 : 1 bloc « islam » et 3 blocs « preuves »", JSON.stringify(r.rows) === JSON.stringify([{ espace: "islam", n: 1 }, { espace: "preuves", n: 3 }]));
  let refuseEspace = false;
  try { await db.exec("insert into blocs (slug, titre, accent, espace) values ('x-y', 'X', 'or', 'autre')"); } catch { refuseEspace = true; }
  ok("011 : un espace inconnu est refusé", refuseEspace);
}

// Données de test créées par le « serveur »
await db.exec(`
  insert into creator_auth (password_hash, recovery_hash) values ('h1', 'h2');
  insert into audit_log (action) values ('test');
  insert into auth_attempts (kind, ip_hash, success) values ('connexion', 'x', false);
  with b as (select id from blocs where slug = 'defense-de-l-islam')
  insert into categories (id, bloc_id, titre, slug, statut) select '11111111-1111-1111-1111-111111111111', id, 'Publiée', 'publiee', 'publie' from b;
  with b as (select id from blocs where slug = 'defense-de-l-islam')
  insert into categories (id, bloc_id, titre, slug, statut) select '22222222-2222-2222-2222-222222222222', id, 'Brouillon', 'brouillon', 'brouillon' from b;
  with b as (select id from blocs where slug = 'defense-de-l-islam')
  insert into categories (id, bloc_id, parent_id, titre, slug, statut) select '33333333-3333-3333-3333-333333333333', id, '22222222-2222-2222-2222-222222222222', 'Enfant publié d''un parent brouillon', 'enfant', 'publie' from b;
  insert into articles (bloc_id, categorie_id, titre, slug, statut) select bloc_id, id, 'Article publié', 'a1', 'publie' from categories where slug = 'publiee';
  insert into articles (bloc_id, categorie_id, titre, slug, statut) select bloc_id, id, 'Article brouillon', 'a2', 'brouillon' from categories where slug = 'publiee';
  insert into articles (bloc_id, categorie_id, titre, slug, statut, supprime_le) select bloc_id, id, 'Article supprimé', 'a3', 'publie', now() from categories where slug = 'publiee';
  insert into articles (bloc_id, categorie_id, titre, slug, statut) select bloc_id, id, 'Publié dans catégorie cachée', 'a4', 'publie' from categories where slug = 'enfant';
`);

const un = await db.query(`select count(*)::int n from creator_auth`);
ok("un seul compte créateur existe", un.rows[0].n === 1);
await refuse("un second compte créateur est impossible", `insert into creator_auth (id, password_hash, recovery_hash) values (2, 'a', 'b')`);
try { await db.exec(`insert into creator_auth (password_hash, recovery_hash) values ('a', 'b')`); ok("doublon du compte créateur refusé", false); } catch { ok("doublon du compte créateur refusé", true); }

for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  const blocs = await db.query(`select titre from blocs order by ordre`);
  ok(`[${role}] lit les 4 blocs (3 preuves, 1 islam)`, blocs.rows.length === 4);
  const cats = await db.query(`select slug from categories`);
  ok(`[${role}] ne voit que la catégorie publiée (pas le brouillon ni l'enfant d'un brouillon)`, cats.rows.length === 1 && cats.rows[0].slug === "publiee");
  const arts = await db.query(`select slug from articles`);
  ok(`[${role}] ne voit que l'article publié, non supprimé, dans une catégorie visible`, arts.rows.length === 1 && arts.rows[0].slug === "a1");
  await refuse(`[${role}] ne peut pas lire creator_auth`, `select * from creator_auth`);
  await refuse(`[${role}] ne peut pas lire audit_log`, `select * from audit_log`);
  await refuse(`[${role}] ne peut pas lire auth_attempts`, `select * from auth_attempts`);
  await refuse(`[${role}] ne peut pas créer d'article`, `insert into articles (bloc_id, categorie_id, titre, slug) select bloc_id, id, 'pirate', 'pirate' from categories limit 1`);
  await refuse(`[${role}] ne peut pas modifier un article`, `update articles set titre = 'pirate'`);
  await refuse(`[${role}] ne peut pas supprimer un article`, `delete from articles`);
  await refuse(`[${role}] ne peut pas modifier un bloc`, `update blocs set titre = 'pirate'`);
  await refuse(`[${role}] ne peut pas supprimer une catégorie`, `delete from categories`);
  await refuse(`[${role}] ne peut pas changer le mot de passe créateur`, `update creator_auth set password_hash = 'pirate'`);
  await refuse(`[${role}] ne peut pas créer de compte créateur`, `insert into creator_auth (password_hash, recovery_hash) values ('a','b')`);
  await db.exec(`reset role`);
}

await db.exec(`set role service_role`);
const tout = await db.query(`select count(*)::int n from articles`);
ok("[serveur] voit tous les articles, brouillons compris", tout.rows[0].n === 4);
const maj = await db.query(`update articles set titre = 'Titre modifié' where slug = 'a2'`);
ok("[serveur] peut modifier", maj.affectedRows === 1);
await db.exec(`reset role`);
const intact = await db.query(`select count(*)::int n from articles where titre = 'pirate'`);
ok("aucune donnée n'a été altérée par le public", intact.rows[0].n === 0);
const bloc = await db.query(`select a.bloc_id = c.bloc_id as meme from articles a join categories c on c.id = a.categorie_id`);
ok("chaque article hérite du bloc de sa catégorie", bloc.rows.every((r) => r.meme));

// ===================== Migration 002 =====================
const B = async (slug) => (await db.query(`select id from blocs where slug = $1`, [slug])).rows[0].id;
const veracite = await B("veracite-de-l-islam");
const defense = await B("defense-de-l-islam");
await db.exec(`
  insert into categories (id, bloc_id, titre, slug, statut) values
    ('a0000000-0000-0000-0000-000000000001', '${defense}', 'Racine', 'racine', 'publie');
  insert into categories (id, bloc_id, parent_id, titre, slug, statut) values
    ('a0000000-0000-0000-0000-000000000002', '${defense}', 'a0000000-0000-0000-0000-000000000001', 'Enfant', 'enfant', 'publie'),
    ('a0000000-0000-0000-0000-000000000004', '${defense}', 'a0000000-0000-0000-0000-000000000001', 'Enfant', 'enfant', 'publie');
  insert into categories (id, bloc_id, parent_id, titre, slug, statut) values
    ('a0000000-0000-0000-0000-000000000003', '${defense}', 'a0000000-0000-0000-0000-000000000002', 'Petit-enfant', 'petit-enfant', 'publie');
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut) values
    ('b0000000-0000-0000-0000-000000000001', '${defense}', 'a0000000-0000-0000-0000-000000000003', 'Profond', 'profond', 'publie'),
    ('b0000000-0000-0000-0000-000000000002', '${defense}', 'a0000000-0000-0000-0000-000000000003', 'Profond', 'profond', 'brouillon');
`);
ok("deux catégories sœurs peuvent porter le même titre", true);

try {
  await db.exec(`update categories set parent_id = 'a0000000-0000-0000-0000-000000000003' where id = 'a0000000-0000-0000-0000-000000000001'`);
  ok("boucle interdite (catégorie rangée dans sa petite-fille)", false);
} catch (e) { ok("boucle interdite (catégorie rangée dans sa petite-fille)", /propres sous-catégories/.test(e.message)); }
try {
  await db.exec(`select deplacer_categorie('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', null)`);
  ok("boucle interdite aussi via le déplacement", false);
} catch { ok("boucle interdite aussi via le déplacement", true); }

await db.exec(`select deplacer_categorie('a0000000-0000-0000-0000-000000000001', null, '${veracite}')`);
const blocsApres = await db.query(`
  select (select count(*) from categories where id::text like 'a0000000%' and bloc_id = '${veracite}')::int as cats,
         (select count(*) from articles where id::text like 'b0000000%' and bloc_id = '${veracite}')::int as arts`);
ok("déplacement vers un autre bloc : toutes les sous-catégories suivent", blocsApres.rows[0].cats === 4);
ok("déplacement vers un autre bloc : les articles suivent", blocsApres.rows[0].arts === 2);

await db.exec(`select deplacer_categorie('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', null)`);
const parent = await db.query(`select parent_id from categories where id = 'a0000000-0000-0000-0000-000000000003'`);
ok("déplacement sous une autre catégorie", parent.rows[0].parent_id === "a0000000-0000-0000-0000-000000000004");

const fil = await db.query(`select titre from ancetres_categorie('a0000000-0000-0000-0000-000000000003')`);
ok("fil d'Ariane du plus haut au plus bas", fil.rows.map((r) => r.titre).join(">") === "Racine>Enfant>Petit-enfant");

const tailles = await db.query(`select * from taille_sous_arbre('a0000000-0000-0000-0000-000000000001')`);
ok("taille du sous-arbre (3 sous-catégories, 2 articles)", Number(tailles.rows[0].categories) === 3 && Number(tailles.rows[0].articles) === 2);

await db.exec(`
  insert into etiquettes (id, nom, cle) values ('c0000000-0000-0000-0000-000000000001', 'Visible', 'visible'), ('c0000000-0000-0000-0000-000000000002', 'Cachée', 'cachee');
  insert into articles_etiquettes values ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
                                         ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002');
`);

for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  const c = await db.query(`select * from compter_contenus(array['a0000000-0000-0000-0000-000000000004']::uuid[])`);
  ok(`[${role}] compteurs : seuls les articles publiés sont comptés`, Number(c.rows[0].articles) === 0 && Number(c.rows[0].sous_categories) === 1);
  const c2 = await db.query(`select * from compter_contenus(array['a0000000-0000-0000-0000-000000000003']::uuid[])`);
  ok(`[${role}] compteurs : 1 article publié sur 2`, Number(c2.rows[0].articles) === 1);
  const et = await db.query(`select nom from etiquettes`);
  ok(`[${role}] ne voit que les étiquettes d'articles publiés`, et.rows.length === 1 && et.rows[0].nom === "Visible");
  const liens = await db.query(`select * from articles_etiquettes`);
  ok(`[${role}] ne voit que les liens d'articles publiés`, liens.rows.length === 1);
  await refuse(`[${role}] ne peut pas déplacer une catégorie`, `select deplacer_categorie('a0000000-0000-0000-0000-000000000003', null, '${defense}')`);
  await refuse(`[${role}] ne peut pas supprimer définitivement`, `select supprimer_categorie_definitivement('a0000000-0000-0000-0000-000000000001')`);
  await refuse(`[${role}] ne peut pas créer d'étiquette`, `insert into etiquettes (nom, cle) values ('pirate', 'pirate')`);
  await refuse(`[${role}] ne peut pas attacher d'étiquette`, `insert into articles_etiquettes values ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001')`);
  await db.exec(`reset role`);
}

try {
  await db.exec(`select supprimer_categorie_definitivement('a0000000-0000-0000-0000-000000000001')`);
  ok("suppression définitive refusée hors corbeille", false);
} catch { ok("suppression définitive refusée hors corbeille", true); }

await db.exec(`update categories set supprime_le = now() where id = 'a0000000-0000-0000-0000-000000000001'`);
await db.exec(`set role anon`);
const cachees = await db.query(`select count(*)::int n from categories where id::text like 'a0000000%'`);
ok("[anon] une catégorie dans la corbeille cache tout son contenu", cachees.rows[0].n === 0);
await db.exec(`reset role`);

await db.exec(`select supprimer_categorie_definitivement('a0000000-0000-0000-0000-000000000001')`);
const restes = await db.query(`
  select (select count(*) from categories where id::text like 'a0000000%')::int as cats,
         (select count(*) from articles where id::text like 'b0000000%')::int as arts,
         (select count(*) from articles_etiquettes)::int as liens`);
ok("suppression définitive : catégories, articles et liens d'étiquettes effacés",
  restes.rows[0].cats === 0 && restes.rows[0].arts === 0 && restes.rows[0].liens === 0);

// ===================== Migration 003 =====================
await db.exec(`
  insert into categories (id, bloc_id, titre, slug, statut) values ('d0000000-0000-0000-0000-000000000001', '${defense}', 'Versions', 'versions', 'publie');
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut) values ('e0000000-0000-0000-0000-000000000001', '${defense}', 'd0000000-0000-0000-0000-000000000001', 'Avec versions', 'avec-versions', 'publie');
  insert into modeles (nom, contenu) values ('Modèle privé', '{"type":"doc"}');
`);
for (let i = 0; i < 12; i++) {
  await db.query(`insert into versions_articles (article_id, titre, contenu, motif, created_at) values ('e0000000-0000-0000-0000-000000000001', $1, '{}', 'automatique', now() - ($2 || ' minutes')::interval)`, [`v${i}`, String(100 - i)]);
}
await db.exec(`select elaguer_versions('e0000000-0000-0000-0000-000000000001', 5)`);
const gardees = await db.query(`select titre from versions_articles order by created_at desc`);
ok("élagage : seules les 5 versions les plus récentes restent", gardees.rows.length === 5 && gardees.rows[0].titre === "v11" && gardees.rows[4].titre === "v7");

for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  await refuse(`[${role}] ne peut pas lire l'historique des versions (même d'un article publié)`, `select * from versions_articles`);
  await refuse(`[${role}] ne peut pas lire les modèles`, `select * from modeles`);
  await refuse(`[${role}] ne peut pas écrire de version`, `insert into versions_articles (article_id, titre, contenu, motif) values ('e0000000-0000-0000-0000-000000000001', 'x', '{}', 'automatique')`);
  await refuse(`[${role}] ne peut pas élaguer les versions`, `select elaguer_versions('e0000000-0000-0000-0000-000000000001', 1)`);
  await db.exec(`reset role`);
}

await db.exec(`delete from articles where id = 'e0000000-0000-0000-0000-000000000001'`);
const orphelines = await db.query(`select count(*)::int n from versions_articles`);
ok("supprimer un article efface son historique", orphelines.rows[0].n === 0);

// ===================== Migrations 004 et 005 =====================
const bucket = await db.query(`select public, file_size_limit from storage.buckets where id = 'fichiers'`);
ok("espace de stockage « fichiers » créé et privé", bucket.rows.length === 1 && bucket.rows[0].public === false);

await db.exec(`
  insert into categories (id, bloc_id, titre, slug, statut) values
    ('10000000-0000-0000-0000-000000000001', '${veracite}', 'Le Coran', 'coran', 'publie'),
    ('10000000-0000-0000-0000-000000000002', '${veracite}', 'Sous-dossier publié', 'sous', 'publie'),
    ('10000000-0000-0000-0000-000000000003', '${defense}', 'Dossier brouillon', 'brouillon', 'brouillon');
  update categories set parent_id = '10000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000002';
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut, resume, contenu_texte, texte_versets, etiquettes_texte) values
    ('20000000-0000-0000-0000-000000000001', '${veracite}', '10000000-0000-0000-0000-000000000002', 'La Trinité examinée', 't', 'publie', 'Un résumé', 'La doctrine de la Trinité affirme trois personnes. بِسْمِ اللَّهِ الرَّحْمَٰنِ', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'Évangiles'),
    ('20000000-0000-0000-0000-000000000002', '${veracite}', '10000000-0000-0000-0000-000000000001', 'Brouillon secret', 'b', 'brouillon', '', 'La Trinité en brouillon', '', ''),
    ('20000000-0000-0000-0000-000000000003', '${veracite}', '10000000-0000-0000-0000-000000000001', 'Les Évangiles', 'e', 'publie', '', 'Les quatre évangiles canoniques et la question de Paul', '', 'Paul'),
    ('20000000-0000-0000-0000-000000000004', '${defense}', '10000000-0000-0000-0000-000000000003', 'Dans un dossier caché', 'c', 'publie', '', 'Trinité cachée', '', '');
  insert into etiquettes (id, nom, cle) values ('30000000-0000-0000-0000-000000000001', 'Paul', 'paul');
  insert into articles_etiquettes values ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001');
  insert into fichiers (id, article_id, nom, chemin, type_mime, etat, pages) values
    ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Étude des manuscrits.pdf', 'a/1.pdf', 'application/pdf', 'pret', 2),
    ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Fichier du brouillon.pdf', 'a/2.pdf', 'application/pdf', 'pret', 1),
    ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Pas encore vérifié.pdf', 'a/3.pdf', 'application/pdf', 'envoi', 1);
  insert into fichiers (id, categorie_id, nom, chemin, type_mime, etat) values
    ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Image du dossier.png', 'c/4.png', 'image/png', 'pret');
  insert into pages_fichiers (fichier_id, numero, texte) values
    ('40000000-0000-0000-0000-000000000001', 1, 'Introduction générale'),
    ('40000000-0000-0000-0000-000000000001', 2, 'Le codex Sinaiticus et le codex Vaticanus'),
    ('40000000-0000-0000-0000-000000000002', 1, 'Le codex Sinaiticus en brouillon');
  insert into annotations (fichier_id, page, type, x, y, visible, texte) values
    ('40000000-0000-0000-0000-000000000001', 1, 'note', 0.1, 0.1, true, 'note publique'),
    ('40000000-0000-0000-0000-000000000001', 1, 'note', 0.2, 0.2, false, 'note privée');
`);

const n = async (t) => (await db.query(`select public.normaliser($1) as r`, [t])).rows[0].r;
ok("normalisation : accents et majuscules", (await n("Véracité de l'ÉVANGILE")) === "veracite de l'evangile");
ok("normalisation : voyelles arabes (harakat) retirées", (await n("بِسْمِ اللَّهِ")) === "بسم الله");
ok("normalisation : alif à hamza, ta marbuta, alif maqsura unifiés", (await n("إسلام رحمة على")) === "اسلام رحمه علي");

const rech = async (sqlTexte, params = []) => (await db.query(sqlTexte, params)).rows;
for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  const f = await rech(`select id from fichiers order by id`);
  ok(`[${role}] fichiers : seuls ceux d'un contenu publié et vérifié sont visibles`, f.map((x) => x.id.slice(-1)).join("") === "14");
  const pg = await rech(`select count(*)::int n from pages_fichiers`);
  ok(`[${role}] texte des PDF : seulement celui des fichiers visibles`, pg[0].n === 2);
  const an = await rech(`select texte from annotations`);
  ok(`[${role}] annotations : seules les annotations visibles`, an.length === 1 && an[0].texte === "note publique");
  await refuse(`[${role}] ne peut pas créer de fichier`, `insert into fichiers (article_id, nom, chemin, type_mime) values ('20000000-0000-0000-0000-000000000001', 'x', 'x', 'application/pdf')`);
  await refuse(`[${role}] ne peut pas écrire d'annotation`, `insert into annotations (fichier_id, page, type, x, y) values ('40000000-0000-0000-0000-000000000001', 1, 'note', 0, 0)`);
  await refuse(`[${role}] ne peut pas lire les synonymes`, `select * from synonymes`);
  await refuse(`[${role}] ne peut pas obtenir les chemins de stockage`, `select chemins_sous_arbre('10000000-0000-0000-0000-000000000001')`);

  const r1 = await rech(`select type, titre from rechercher('trinite')`);
  ok(`[${role}] recherche « trinite » (sans accent) : l'article publié, pas le brouillon ni le dossier caché`,
    r1.length === 1 && r1[0].titre === "La Trinité examinée", JSON.stringify(r1));
  const r2 = await rech(`select titre from rechercher('بسم الله')`);
  ok(`[${role}] recherche arabe sans voyelles trouve un texte vocalisé`, r2.some((r) => r.titre === "La Trinité examinée"));
  const r3 = await rech(`select type, page, titre from rechercher('sinaiticus')`);
  ok(`[${role}] recherche dans le texte d'un PDF : page 2 du document visible seulement`, r3.length === 1 && r3[0].type === "page" && r3[0].page === 2, JSON.stringify(r3));
  const r4 = await rech(`select titre from rechercher('"quatre evangiles"')`);
  ok(`[${role}] phrase exacte entre guillemets`, r4.length === 1 && r4[0].titre === "Les Évangiles", JSON.stringify(r4));
  const r5 = await rech(`select titre from rechercher('evangiles -paul')`);
  ok(`[${role}] exclusion d'un mot (-paul)`, !r5.some((r) => r.titre === "Les Évangiles") && r5.some((r) => r.titre === "La Trinité examinée"), JSON.stringify(r5));
  const r6 = await rech(`select titre from rechercher('sinaiticus OU canoniques')`);
  ok(`[${role}] opérateur OU`, r6.length === 2, JSON.stringify(r6));
  const r7 = await rech(`select titre, approchant from rechercher('evangilles')`);
  ok(`[${role}] faute de frappe : résultat approchant`, r7.some((r) => r.titre === "Les Évangiles" && r.approchant), JSON.stringify(r7));
  const r8 = await rech(`select titre from rechercher('trinite', null, array['10000000-0000-0000-0000-000000000001']::uuid[])`);
  ok(`[${role}] filtre par catégorie (sous-catégorie non cochée exclue)`, r8.length === 0, JSON.stringify(r8));
  const r9 = await rech(`select titre from rechercher('trinite', null, array['10000000-0000-0000-0000-000000000002']::uuid[])`);
  ok(`[${role}] filtre par sous-catégorie`, r9.length === 1);
  const r10 = await rech(`select titre from rechercher('trinite', array['${defense}']::uuid[])`);
  ok(`[${role}] filtre par bloc`, r10.length === 0);
  const r11 = await rech(`select type, titre from rechercher('بسم', null, null, array['verset'])`);
  ok(`[${role}] filtre « versets » : cherche dans les versets`, r11.length === 1 && r11[0].type === "verset", JSON.stringify(r11));
  const r12 = await rech(`select titre from rechercher('', null, null, array['article'], array['paul'])`);
  ok(`[${role}] filtre par étiquette (sans mot cherché)`, r12.length === 1 && r12[0].titre === "Les Évangiles", JSON.stringify(r12));
  const r13 = await rech(`select type, titre from rechercher('coran')`);
  ok(`[${role}] recherche des dossiers par leur titre`, r13.some((r) => r.type === "dossier" && r.titre === "Le Coran"));
  const r14 = await rech(`select titre, total from rechercher('trinite OU evangiles OU coran', null, null, null, null, null, null, false, 'titre', 2, 0)`);
  ok(`[${role}] tri par titre, pagination et total`, r14.length === 2 && Number(r14[0].total) >= 3 && r14[0].titre <= r14[1].titre, JSON.stringify(r14));
  const r15 = await rech(`select fenetre from rechercher('personnes')`);
  ok(`[${role}] extrait autour du mot trouvé (texte d'origine, avec accents)`, r15.length === 1 && r15[0].fenetre.includes("Trinité affirme trois personnes"), JSON.stringify(r15));
  const r16 = await rech(`select titre from rechercher('trinite', null, null, null, null, null, null, true)`);
  ok(`[${role}] demander les brouillons ne contourne pas les règles de sécurité`, r16.length === 1, JSON.stringify(r16));
  const ch = await rech(`select chemin from chemins_categories(array['10000000-0000-0000-0000-000000000002']::uuid[])`);
  ok(`[${role}] chemin « Bloc › Catégorie › Sous-catégorie »`, ch[0]?.chemin === "La véracité de l'islam › Le Coran › Sous-dossier publié", JSON.stringify(ch));
  await db.exec(`reset role`);
}

// Synonymes (ajoutés par le créateur)
await db.exec(`insert into synonymes (termes) values (array['Trinité', 'trinitaire', 'trois personnes'])`);
await db.exec(`set role anon`);
const s1 = await rech(`select titre from rechercher('trinitaire')`);
ok("synonymes : « trinitaire » trouve un article qui ne parle que de « Trinité »", s1.some((r) => r.titre === "La Trinité examinée"), JSON.stringify(s1));
await db.exec(`reset role`);

// Créateur (accès serveur) : brouillons inclus sur demande, corbeille toujours exclue
await db.exec(`set role service_role`);
const c1 = await rech(`select titre from rechercher('trinite', null, null, null, null, null, null, true) order by titre`);
ok("[créateur] brouillons et dossiers non publiés inclus sur demande", c1.map((r) => r.titre).join("|") === "Brouillon secret|Dans un dossier caché|La Trinité examinée", JSON.stringify(c1));
await db.exec(`reset role; update categories set supprime_le = now() where id = '10000000-0000-0000-0000-000000000003'; set role service_role`);
const c2 = await rech(`select titre from rechercher('trinite', null, null, null, null, null, null, true)`);
ok("[créateur] le contenu de la corbeille n'apparaît jamais", !c2.some((r) => r.titre === "Dans un dossier caché"));
const ch2 = await rech(`select * from chemins_sous_arbre('10000000-0000-0000-0000-000000000001') order by 1`);
ok("[créateur] chemins de stockage d'une catégorie et de tout son contenu", ch2.map((r) => r.chemins_sous_arbre).join(",") === "a/1.pdf,a/2.pdf,a/3.pdf,c/4.png", JSON.stringify(ch2));
await db.exec(`reset role`);

// ---------------------------------------------------------------- Phase 6
await db.exec(`
  insert into categories (id, bloc_id, titre, slug, statut) select '60000000-0000-0000-0000-000000000001', id, 'Liens', 'liens', 'publie' from blocs where slug = 'defense-de-l-islam';
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut) select '60000000-0000-0000-0000-0000000000a1', bloc_id, id, 'Le Tawhid', 'tawhid', 'publie' from categories where id = '60000000-0000-0000-0000-000000000001';
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut) select '60000000-0000-0000-0000-0000000000a2', bloc_id, id, 'Source publique', 'sp', 'publie' from categories where id = '60000000-0000-0000-0000-000000000001';
  insert into articles (id, bloc_id, categorie_id, titre, slug, statut) select '60000000-0000-0000-0000-0000000000a3', bloc_id, id, 'Source brouillon', 'sb', 'brouillon' from categories where id = '60000000-0000-0000-0000-000000000001';
  insert into liens_articles values ('60000000-0000-0000-0000-0000000000a2', normaliser('le tawhîd'), 'le tawhîd'), ('60000000-0000-0000-0000-0000000000a2', normaliser('Article futur'), 'Article futur'),
    ('60000000-0000-0000-0000-0000000000a3', normaliser('Le Tawhid'), 'Le Tawhid');
`);
await db.exec(`set role anon`);
const l1 = (await db.query(`select cible_texte, id from liens_resolus('60000000-0000-0000-0000-0000000000a2') order by cible_texte`)).rows;
ok("liens : [[le tawhîd]] mène à « Le Tawhid » malgré accents et majuscules ; lien futur non résolu", l1.length === 2 && l1[0].id === null && l1[1].id === "60000000-0000-0000-0000-0000000000a1");
const l2 = (await db.query(`select titre from retroliens('60000000-0000-0000-0000-0000000000a1')`)).rows;
ok("rétroliens : le public ne voit que les articles publiés qui citent", l2.length === 1 && l2[0].titre === "Source publique");
const gl = (await db.query(`select * from graphe_liens()`)).rows;
ok("graphe : le public ne voit que les liens entre articles visibles", gl.length === 1 && gl[0].cible_id === "60000000-0000-0000-0000-0000000000a1", JSON.stringify(gl));
await refuse("[anon] ne lit pas les liens d'un brouillon", `select * from liens_articles where source_id = '60000000-0000-0000-0000-0000000000a3'`);
await refuse("[anon] ne peut pas compter une vue lui-même", `select compter_vue('60000000-0000-0000-0000-0000000000a1')`);
await refuse("[anon] ne lit pas les statistiques", `select * from vues_articles`);
await refuse("[anon] ne lit pas les appareils connus", `select * from appareils_connus`);
await refuse("[anon] ne lit pas les liens cassés", `select * from liens_casses()`);
await db.exec(`reset role; set role service_role`);
await db.exec(`select compter_vue('60000000-0000-0000-0000-0000000000a1'); select compter_vue('60000000-0000-0000-0000-0000000000a1'); select compter_vue('60000000-0000-0000-0000-0000000000a3');`);
const v = (await db.query(`select titre, vues from articles_les_plus_lus(30, 10)`)).rows;
ok("statistiques : 2 vues comptées, aucune pour un brouillon", v.length === 1 && Number(v[0].vues) === 2, JSON.stringify(v));
await db.exec(`select noter_recherche_vide('Évangile de Barnabé'); select noter_recherche_vide('evangile de barnabe'); select noter_recherche_vide('a');`);
const rv = (await db.query(`select terme, nombre from recherches_sans_resultat(30, 10)`)).rows;
ok("recherches sans résultat regroupées sans accents, termes trop courts ignorés", rv.length === 1 && Number(rv[0].nombre) === 2 && rv[0].terme === "evangile de barnabe", JSON.stringify(rv));
const lc = (await db.query(`select cible_texte from liens_casses()`)).rows;
await db.exec(`select enregistrer_liens('60000000-0000-0000-0000-0000000000a3', array['Le Tawhid', ' le tawhid ', 'Autre', ''])`);
const el = (await db.query(`select cible_texte from liens_articles where source_id = '60000000-0000-0000-0000-0000000000a3' order by 1`)).rows;
ok("enregistrer_liens : remplace, dédoublonne, ignore le vide", el.map((r) => r.cible_texte).join("|") === "Autre|Le Tawhid", JSON.stringify(el));
await db.exec(`select enregistrer_liens('60000000-0000-0000-0000-0000000000a3', array['Le Tawhid'])`);
ok("liens cassés détectés", lc.length === 1 && lc[0].cible_texte === "Article futur", JSON.stringify(lc));
await db.exec(`reset role`);
ok("espace « sauvegardes » privé", (await db.query(`select public from storage.buckets where id = 'sauvegardes'`)).rows[0]?.public === false);
await db.exec(`insert into auth_attempts (kind, ip_hash, success) values ('double_authentification', 'x', false)`);
ok("tentatives de double authentification acceptées", true);

// ---------------------------------------------------------------- Phase 7
await db.exec(`
  insert into auteurs (id, nom, notes) values ('70000000-0000-0000-0000-0000000000f1', 'Auteur d''exemple', 'note privée');
  insert into ouvrages (id, titre, auteur_id, statut, notes) values
    ('70000000-0000-0000-0000-0000000000b1', 'Ouvrage cité', '70000000-0000-0000-0000-0000000000f1', 'verifiee', 'secret'),
    ('70000000-0000-0000-0000-0000000000b2', 'Ouvrage non cité', null, 'a-verifier', '');
  insert into citations (id, ouvrage_id, texte, page) values ('70000000-0000-0000-0000-0000000000c1', '70000000-0000-0000-0000-0000000000b1', 'Citation d''exemple', '12');
  select enregistrer_references('60000000-0000-0000-0000-0000000000a1', '[{"citation":"70000000-0000-0000-0000-0000000000c1"},{"ouvrage":"70000000-0000-0000-0000-0000000000b1","page":"40"}]'::jsonb);
  select enregistrer_references('60000000-0000-0000-0000-0000000000a3', '[{"ouvrage":"70000000-0000-0000-0000-0000000000b2"}]'::jsonb);
  insert into prerequis (article_id, prerequis_id) values ('60000000-0000-0000-0000-0000000000a2', '60000000-0000-0000-0000-0000000000a1'), ('60000000-0000-0000-0000-0000000000a1', '60000000-0000-0000-0000-0000000000a3');
  insert into articles_categories (article_id, categorie_id) select '60000000-0000-0000-0000-0000000000a1', id from categories where slug = 'veracite-test' limit 1;
`);
ok("références : 2 entrées (citation → son ouvrage, ouvrage + page)", (await db.query(`select count(*)::int n from references_articles where article_id = '60000000-0000-0000-0000-0000000000a1'`)).rows[0].n === 2);
await db.exec(`set role anon`);
const ov = (await db.query(`select titre from ouvrages`)).rows;
ok("[anon] ne voit que les ouvrages cités par un article publié", ov.length === 1 && ov[0].titre === "Ouvrage cité", JSON.stringify(ov));
await refuse("[anon] ne lit pas les notes privées d'un ouvrage", `select notes from ouvrages`);
await refuse("[anon] ne lit pas les notes privées d'un auteur", `select notes from auteurs`);
ok("[anon] voit l'auteur d'un ouvrage cité", (await db.query(`select nom from auteurs`)).rows.length === 1);
ok("[anon] voit la citation utilisée", (await db.query(`select texte from citations`)).rows.length === 1);
ok("[anon] prérequis : seulement entre articles publiés", (await db.query(`select * from prerequis`)).rows.length === 1);
await refuse("[anon] ne peut pas enregistrer de références", `select enregistrer_references('60000000-0000-0000-0000-0000000000a1', '[]'::jsonb)`);
await refuse("[anon] ne peut pas écrire de citation", `insert into citations (ouvrage_id, texte) values ('70000000-0000-0000-0000-0000000000b1', 'x')`);
const lies = (await db.query(`select titre from articles_lies('60000000-0000-0000-0000-0000000000a1', 5)`)).rows.map((r) => r.titre);
ok("articles liés : le public ne voit que des articles publiés", lies.includes("Source publique") && !lies.includes("Source brouillon"), JSON.stringify(lies));
await db.exec(`reset role; set role service_role`);
const sem = (await db.query(`select titre from ouvrages_semblables('ouvrage cite')`)).rows;
ok("doublons d'ouvrages repérés (accents ignorés)", sem.some((r) => r.titre === "Ouvrage cité"), JSON.stringify(sem));
await db.exec(`reset role`);
let refusEmpreinte = false; try { await db.exec(`update fichiers set empreinte = 'pas-une-empreinte' where false or true`); } catch { refusEmpreinte = true; }
ok("empreinte de fichier contrôlée", refusEmpreinte || (await db.query(`select count(*)::int n from fichiers`)).rows[0].n === 0);

// ---------------------------------------------------------------- Phase 8 : réglages
ok("réglages : valeurs de départ en place", (await db.query(`select count(*)::int n from reglages`)).rows[0].n === 7);
ok("réglage inactivite_minutes = 30", (await db.query(`select valeur::text v from reglages where cle = 'inactivite_minutes'`)).rows[0].v === "30");
await db.exec(`set role anon`);
await refuse("[anon] ne voit aucun réglage", `select * from reglages`);
await refuse("[anon] ne peut pas écrire de réglage", `insert into reglages (cle, valeur) values ('pirate', 'true'::jsonb)`);
await db.exec(`reset role`);
let cleRefusee = false;
try { await db.exec(`insert into reglages (cle, valeur) values ('Clé Invalide !', '1'::jsonb)`); } catch { cleRefusee = true; }
ok("clé de réglage contrôlée", cleRefusee);

// ---------------------------------------------------------------- Phase 9 : recherche par le sens
ok("similarité : vecteurs identiques = 1", Number((await db.query(`select public.similarite(array[0.6,0.8]::real[], array[0.6,0.8]::real[]) s`)).rows[0].s) > 0.999);
ok("similarité : vecteurs opposés = -1", Number((await db.query(`select public.similarite(array[1,0]::real[], array[-1,0]::real[]) s`)).rows[0].s) < -0.999);
ok("similarité : tailles différentes = 0 (pas d'erreur)", Number((await db.query(`select public.similarite(array[1,0]::real[], array[1,0,0]::real[]) s`)).rows[0].s) === 0);
await db.exec(`
  insert into vecteurs_articles (article_id, morceau, texte, vecteur, modele, empreinte) values
    ('60000000-0000-0000-0000-0000000000a1', 0, 'Les signes de la prophetie', array[1,0,0,0,0,0,0,0]::real[], 'faux', repeat('a', 64)),
    ('60000000-0000-0000-0000-0000000000a1', 1, 'Un autre passage', array[0,1,0,0,0,0,0,0]::real[], 'faux', repeat('b', 64)),
    ('60000000-0000-0000-0000-0000000000a3', 0, 'Brouillon secret', array[1,0,0,0,0,0,0,0]::real[], 'faux', repeat('c', 64));
`);
const sens = (await db.query(`select id, score from rechercher_sens(array[1,0,0,0,0,0,0,0]::real[], 10, 0.2)`)).rows;
ok("recherche par le sens : un article par résultat, meilleur morceau retenu", sens.length === 2 && Number(sens[0].score) > 0.99, JSON.stringify(sens));
await db.exec(`set role anon`);
const sensPublic = (await db.query(`select id from rechercher_sens(array[1,0,0,0,0,0,0,0]::real[], 10, 0.2)`)).rows;
ok("[anon] la recherche par le sens ne remonte jamais un brouillon", sensPublic.length === 1 && sensPublic[0].id === "60000000-0000-0000-0000-0000000000a1", JSON.stringify(sensPublic));
await refuse("[anon] ne peut pas écrire de vecteur", `insert into vecteurs_articles (article_id, morceau, texte, vecteur, modele, empreinte) values ('60000000-0000-0000-0000-0000000000a1', 9, 'x', array[1,0,0,0,0,0,0,0]::real[], 'faux', repeat('d', 64))`);
await refuse("[anon] ne peut pas connaître l'état de l'indexation", `select * from etat_indexation()`);
await db.exec(`reset role`);
ok("état de l'indexation lisible par le serveur", Number((await db.query(`select morceaux from etat_indexation()`)).rows[0].morceaux) === 3);
let vecteurRefuse = false;
try { await db.exec(`insert into vecteurs_articles (article_id, morceau, texte, vecteur, modele, empreinte) values ('60000000-0000-0000-0000-0000000000a1', 5, 'x', array[1,0]::real[], 'faux', repeat('e', 64))`); } catch { vecteurRefuse = true; }
ok("vecteur trop court refusé", vecteurRefuse);
let empreinteRefusee = false;
try { await db.exec(`insert into vecteurs_articles (article_id, morceau, texte, vecteur, modele, empreinte) values ('60000000-0000-0000-0000-0000000000a1', 6, 'x', array[1,0,0,0,0,0,0,0]::real[], 'faux', 'pas-une-empreinte')`); } catch { empreinteRefusee = true; }
ok("empreinte de morceau contrôlée", empreinteRefusee);
await db.exec(`delete from articles where id = '60000000-0000-0000-0000-0000000000a1'`);
ok("les vecteurs disparaissent avec l'article", Number((await db.query(`select count(*)::int n from vecteurs_articles where article_id = '60000000-0000-0000-0000-0000000000a1'`)).rows[0].n) === 0);

// ---------------------------------------------------------------- Contributions des lecteurs
await db.exec(`reset role`);
const idArticlePublic = (await db.query(`select id from articles where slug = 'a1'`)).rows[0].id;
const idArticleCache = (await db.query(`select id from articles where slug = 'a2'`)).rows[0].id;
const idBloc = (await db.query(`select id from blocs where slug = 'veracite-de-l-islam'`)).rows[0].id;
await db.exec(`
  insert into contributions (id, type, bloc_id, pseudo, titre, texte, statut, ip_hash) values
    ('c0000000-0000-0000-0000-000000000001', 'idee', '${idBloc}', 'Yacine', 'Un sujet sur la préservation du Coran', 'Il manque un article sur la transmission du texte.', 'publiee', 'empreinte-secrete');
  insert into contributions (id, type, bloc_id, article_id, titre, texte, statut, ip_hash) values
    ('c0000000-0000-0000-0000-000000000002', 'argument', '${idBloc}', '${idArticlePublic}', 'Un argument de plus', 'On pourrait ajouter le témoignage des manuscrits anciens.', 'en_attente', 'x'),
    ('c0000000-0000-0000-0000-000000000003', 'argument', null, null, 'Proposition refusée', 'Ce texte a été refusé par le filtre automatique du site.', 'refusee', 'x');
`);
ok("une idée de sujet doit porter sur un bloc", await (async () => {
  try { await db.exec(`insert into contributions (type, titre, texte) values ('idee', 'Sans module', 'Un texte assez long pour passer la contrainte.')`); return false; } catch { return true; }
})());
ok("un argument peut n'être rattaché à aucun article", Number((await db.query(`select count(*)::int n from contributions where id = 'c0000000-0000-0000-0000-000000000003'`)).rows[0].n) === 1);
let titreCourtRefuse = false;
try { await db.exec(`insert into contributions (type, bloc_id, titre, texte) values ('idee', '${idBloc}', 'Hop', 'Un texte assez long pour passer la contrainte de longueur.')`); } catch { titreCourtRefuse = true; }
ok("un titre trop court est refusé", titreCourtRefuse);
let texteCourtRefuse = false;
try { await db.exec(`insert into contributions (type, bloc_id, titre, texte) values ('idee', '${idBloc}', 'Un titre bien assez long', 'Trop court.')`); } catch { texteCourtRefuse = true; }
ok("un texte trop court est refusé", texteCourtRefuse);
let statutInvalide = false;
try { await db.exec(`insert into contributions (type, bloc_id, titre, texte, statut) values ('idee', '${idBloc}', 'Un titre bien assez long', 'Un texte assez long pour passer la contrainte.', 'inventé')`); } catch { statutInvalide = true; }
ok("un statut inventé est refusé", statutInvalide);

await db.exec(`set role anon`);
const vues = (await db.query(`select id from contributions`)).rows;
ok("[anon] ne voit que les contributions publiées", vues.length === 1 && vues[0].id === "c0000000-0000-0000-0000-000000000001", JSON.stringify(vues));
let empreinteCachee = false;
try { await db.query(`select ip_hash from contributions`); } catch { empreinteCachee = true; }
ok("[anon] ne peut pas lire l'empreinte d'adresse de l'auteur", empreinteCachee);
let motifCache = false;
try { await db.query(`select motif from contributions`); } catch { motifCache = true; }
ok("[anon] ne peut pas lire le motif de refus", motifCache);
await refuse("[anon] ne peut pas déposer une contribution directement", `insert into contributions (type, bloc_id, titre, texte) values ('idee', '${idBloc}', 'Un titre bien assez long', 'Un texte assez long pour passer la contrainte.')`);
await refuse("[anon] ne peut pas publier une contribution en attente", `update contributions set statut = 'publiee' where id = 'c0000000-0000-0000-0000-000000000002'`);
await refuse("[anon] ne peut pas effacer une contribution", `delete from contributions where id = 'c0000000-0000-0000-0000-000000000001'`);
await refuse("[anon] ne voit pas qui a signalé quoi", `select * from contributions_signalements`);
await refuse("[anon] ne peut pas compter les contributions en attente", `select * from etat_contributions()`);
await db.exec(`reset role`);
const etatContrib = (await db.query(`select * from etat_contributions()`)).rows[0];
ok("le créateur compte ce qui attend, ce qui est publié et ce qui a été refusé",
  Number(etatContrib.en_attente) === 1 && Number(etatContrib.publiees) === 1 && Number(etatContrib.refusees) === 1, JSON.stringify(etatContrib));
await db.exec(`insert into contributions_signalements (contribution_id, ip_hash) values ('c0000000-0000-0000-0000-000000000001', 'voisin')`);
let doubleSignalement = false;
try { await db.exec(`insert into contributions_signalements (contribution_id, ip_hash) values ('c0000000-0000-0000-0000-000000000001', 'voisin')`); } catch { doubleSignalement = true; }
ok("une même adresse ne signale pas deux fois la même contribution", doubleSignalement);
ok("un article caché peut quand même être cité par une contribution en attente",
  Number((await db.query(`select count(*)::int n from contributions where article_id = '${idArticleCache}'`)).rows[0].n) === 0);
await db.exec(`delete from articles where slug = 'a1'`);
ok("si l'article cité disparaît, la contribution reste sans lien",
  (await db.query(`select article_id from contributions where id = 'c0000000-0000-0000-0000-000000000002'`)).rows[0].article_id === null);
ok("les signalements disparaissent avec la contribution", await (async () => {
  await db.exec(`delete from contributions where id = 'c0000000-0000-0000-0000-000000000001'`);
  return Number((await db.query(`select count(*)::int n from contributions_signalements`)).rows[0].n) === 0;
})());

// ---------------------------------------------------------------- 013 : messagerie et « Amélioration du site »
await db.exec(`reset role`);
await db.exec(`insert into contributions (id, type, nature, titre, texte, statut, jeton_hash) values
  ('c0000000-0000-0000-0000-000000000010', 'site', 'bug', 'La vidéo ne se lance pas', 'Dans Le Truchement, la vidéo reste noire sur mon téléphone.', 'publiee', 'empreinte-jeton')`);
ok("013 : « Amélioration du site » s'enregistre sans module", Number((await db.query(`select count(*)::int n from contributions where type = 'site'`)).rows[0].n) === 1);
let siteSansNature = false;
try { await db.exec(`insert into contributions (type, titre, texte) values ('site', 'Une idée de plus', 'Un texte assez long pour passer la contrainte.')`); } catch { siteSansNature = true; }
ok("013 : une amélioration du site doit dire si c'est un bug ou une fonctionnalité", siteSansNature);
let natureSurIdee = false;
try { await db.exec(`insert into contributions (type, bloc_id, nature, titre, texte) values ('idee', '${idBloc}', 'bug', 'Un titre bien assez long', 'Un texte assez long pour passer la contrainte.')`); } catch { natureSurIdee = true; }
ok("013 : seule une amélioration du site a une nature", natureSurIdee);
await db.exec(`insert into contributions_messages (contribution_id, auteur, texte) values
  ('c0000000-0000-0000-0000-000000000010', 'createur', 'Merci, c''est corrigé.'),
  ('c0000000-0000-0000-0000-000000000010', 'lecteur', 'Super, merci !')`);
let auteurInvente = false;
try { await db.exec(`insert into contributions_messages (contribution_id, auteur, texte) values ('c0000000-0000-0000-0000-000000000010', 'pirate', 'x')`); } catch { auteurInvente = true; }
ok("013 : un message vient du créateur ou du lecteur, personne d'autre", auteurInvente);
await db.exec(`set role anon`);
await refuse("[anon] ne lit pas les conversations", `select * from contributions_messages`);
await refuse("[anon] n'écrit pas dans une conversation", `insert into contributions_messages (contribution_id, auteur, texte) values ('c0000000-0000-0000-0000-000000000010', 'createur', 'Faux message')`);
let jetonCache = false;
try { await db.query(`select jeton_hash from contributions`); } catch { jetonCache = true; }
ok("[anon] ne lit pas l'empreinte du jeton de suivi", jetonCache);
ok("[anon] lit la nature d'une amélioration publiée", (await db.query(`select nature from contributions where id = 'c0000000-0000-0000-0000-000000000010'`)).rows[0]?.nature === "bug");
await db.exec(`reset role`);
await db.exec(`delete from contributions where id = 'c0000000-0000-0000-0000-000000000010'`);
ok("013 : la conversation disparaît avec la contribution", Number((await db.query(`select count(*)::int n from contributions_messages`)).rows[0].n) === 0);

// 014 : comptes des utilisateurs et données rangées par compte
{
  const a = (await db.query(`select * from compte_ouvrir('google-1', 'a@exemple.fr', 'Aïcha')`)).rows[0];
  const a2 = (await db.query(`select * from compte_ouvrir('google-1', 'a@exemple.fr', 'Aïcha B.')`)).rows[0];
  const b = (await db.query(`select * from compte_ouvrir('google-2', 'b@exemple.fr', 'Bilal')`)).rows[0];
  ok("014 : la première connexion crée le compte, la suivante le retrouve", a.nouveau === true && a2.nouveau === false && a2.id === a.id && a2.nom === "Aïcha B." && b.id !== a.id);
  const ecrire = async (uid, e, plafond = 1000000) => (await db.query(`select donnees_ecrire($1, $2::jsonb, $3) r`, [uid, JSON.stringify(e), plafond])).rows[0].r;
  const lire = async (uid, depuis = 0, limite = 100, octets = 1000000) => (await db.query(`select * from donnees_lire($1, $2, $3, $4)`, [uid, depuis, limite, octets])).rows;
  await ecrire(a.id, [{ m: "regles", c: "lecon-1", v: { etoiles: 2 }, q: 1000 }, { m: "calame-documents", c: "d1", v: { titre: "Un" }, q: 1000 }]);
  await ecrire(a.id, [{ m: "regles", c: "lecon-1", v: { etoiles: 1 }, q: 900 }]);
  ok("014 : une modification plus ancienne ne remplace pas la plus récente", (await lire(a.id)).find((l) => l.cle === "lecon-1").valeur.etoiles === 2);
  const avant = Math.max(...(await lire(a.id)).map((l) => Number(l.maj)));
  await ecrire(a.id, [{ m: "regles", c: "lecon-1", v: { etoiles: 3 }, q: 2000 }]);
  const apres = await lire(a.id, avant);
  ok("014 : un appareil ne reçoit que ce qui a changé depuis sa dernière visite", apres.length === 1 && apres[0].valeur.etoiles === 3);
  await ecrire(a.id, [{ m: "calame-documents", c: "d1", v: null, q: 3000 }]);
  const supprime = (await lire(a.id)).find((l) => l.cle === "d1");
  ok("014 : une suppression laisse une trace pour les autres appareils", supprime && supprime.valeur === null);
  ok("014 : chaque compte ne lit que ses données", (await lire(b.id)).length === 0);
  const r = await ecrire(a.id, [{ m: "regles", c: "gros", v: { texte: "x".repeat(500) }, q: 1 }], 100);
  ok("014 : au-delà du plafond du compte, l'écriture est refusée et signalée", r.refusees.length === 1 && !(await lire(a.id)).some((l) => l.cle === "gros"));
  for (let i = 0; i < 5; i++) await ecrire(b.id, [{ m: "regles", c: `l${i}`, v: { t: "y".repeat(200) }, q: 1 }]);
  ok("014 : la lecture est bornée en poids, la suite se redemande", (await lire(b.id, 0, 100, 450)).length === 3 && (await lire(b.id, 0, 2, 100000)).length === 2);
  let magasinRefuse = false;
  try { await ecrire(a.id, [{ m: "Pas Valide", c: "x", v: 1, q: 1 }]); } catch { magasinRefuse = true; }
  ok("014 : un nom de magasin fantaisiste est refusé", magasinRefuse);
  let inconnu = false;
  try { await ecrire("00000000-0000-0000-0000-000000000000", [{ m: "regles", c: "x", v: 1, q: 1 }]); } catch { inconnu = true; }
  ok("014 : on n'écrit pas pour un compte qui n'existe pas", inconnu);
  await db.exec(`insert into fichiers_utilisateur (utilisateur_id, id, taille) values ('${a.id}', 'f1', 1234)`);
  const place = (await db.query(`select * from compte_place($1)`, [a.id])).rows[0];
  ok("014 : la place occupée compte les données et les fichiers", Number(place.fichiers) === 1234 && Number(place.donnees) > 0 && Number(place.nb_fichiers) === 1);
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await refuse(`[${role}] ne lit pas les comptes`, `select * from utilisateurs`);
    await refuse(`[${role}] ne lit pas les données des comptes`, `select * from donnees_utilisateur`);
    await refuse(`[${role}] ne lit pas les fichiers des comptes`, `select * from fichiers_utilisateur`);
    await refuse(`[${role}] n'appelle pas la lecture des données`, `select * from donnees_lire('${a.id}', 0, 10, 100000)`);
    await refuse(`[${role}] n'ouvre pas de compte`, `select * from compte_ouvrir('pirate', 'p@x.fr', 'P')`);
    await db.exec(`reset role`);
  }
  await db.exec(`delete from utilisateurs where id = '${a.id}'`);
  ok("014 : supprimer un compte efface toutes ses données", Number((await db.query(`select count(*)::int n from donnees_utilisateur where utilisateur_id = '${a.id}'`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from fichiers_utilisateur`)).rows[0].n) === 0);
}

// 015 : points du vocabulaire et classement
{
  const u1 = (await db.query(`select * from compte_ouvrir('google-p1', 'p1@exemple.fr', 'Yasmine Benali')`)).rows[0].id;
  const u2 = (await db.query(`select * from compte_ouvrir('google-p2', 'p2@exemple.fr', 'Karim Haddad')`)).rows[0].id;
  // Entre deux envois, le serveur exige 600 ms : les tests font « passer le temps ».
  const vieillir = (uid) => db.exec(`update scores_vocabulaire set derniere_reponse = derniere_reponse - interval '2 seconds' where utilisateur_id = '${uid}'`);
  const repondre = async (uid, reponses, attendre = true) => {
    if (attendre) await vieillir(uid);
    return (await db.query(`select vocabulaire_repondre($1, $2::jsonb) r`, [uid, JSON.stringify(reponses)])).rows[0].r;
  };
  const j = (mot, resultat = "juste", base = 10) => ({ mot, resultat, base });

  const mult = (await db.query(`select array_agg(vocabulaire_multiplicateur(x)::float order by x) m from unnest(array[0,4,5,9,10,19,20,39,40,100]) x`)).rows[0].m;
  ok("015 : multiplicateur de série ×1 / ×1,5 dès 5 / ×2 dès 10 / ×2,5 dès 20 / ×3 dès 40", JSON.stringify(mult) === JSON.stringify([1, 1, 1.5, 1.5, 2, 2, 2.5, 2.5, 3, 3]));

  let r = await repondre(u1, [j("famille:brother")]);
  ok("015 : première bonne réponse : 10 points + 5 de bonus du jour", r.gain === 10 && r.bonus === 5 && r.points === 15 && r.serie === 1 && r.jours === 1);
  r = await repondre(u1, [j("famille:brother")]);
  ok("015 : le même mot le même jour ne rapporte rien (mais compte dans la série)", r.gain === 0 && r.bonus === 0 && r.serie === 2 && r.points === 15);
  const trop = await repondre(u1, [j("famille:sister")], false);
  ok("015 : deux envois à moins de 600 ms : le second est refusé", trop.erreur === "trop_vite");
  r = await repondre(u1, [j("famille:sister"), j("famille:uncle"), j("famille:aunt"), j("famille:cousin")]);
  ok("015 : dès la 5e bonne réponse d'affilée, ×1,5 (15 points)", r.gain === 50 && r.serie === 6 && r.details[2].gain === 15 && r.details[1].gain === 10 && r.points === 65);
  r = await repondre(u1, [j("famille:niece", "presque", 15)]);
  ok("015 : « presque » : la moitié de la base (arrondie au-dessus), la série tient", r.gain === 8 && r.serie === 6);
  r = await repondre(u1, [j("famille:nephew", "faux")]);
  ok("015 : une erreur : 0 point, jamais de malus, la série repart de zéro", r.gain === 0 && r.serie === 0 && r.points === 73 && r.meilleure_serie === 6);
  r = await repondre(u1, [j("famille:x1"), j("famille:x2"), j("famille:x3"), j("famille:x4"), j("famille:x5"), j("famille:x6"), j("famille:x7")]);
  ok("015 : plus de 6 réponses d'un coup : refusé", r.erreur === "illisible");
  ok("015 : un compte inconnu ne marque rien", (await repondre("00000000-0000-0000-0000-000000000000", [j("famille:a")], false)).erreur === "inconnu");
  r = await repondre(u1, [{ mot: "famille:z", resultat: "triche", base: 10 }, { mot: "famille:y", resultat: "juste", base: 999 }]);
  ok("015 : résultat inconnu ignoré, base bornée à 20", r.gain === 20 && r.details.length === 1);

  // Jours d'affilée
  await db.exec(`update scores_vocabulaire set dernier_jour = dernier_jour - 1, jours = 3 where utilisateur_id = '${u1}'`);
  r = await repondre(u1, [j("famille:jour4")]);
  ok("015 : bonne réponse le lendemain : 4 jours d'affilée, bonus 20", r.jours === 4 && r.bonus === 20);
  await db.exec(`update scores_vocabulaire set dernier_jour = dernier_jour - 3, jours = 9 where utilisateur_id = '${u1}'`);
  r = await repondre(u1, [j("famille:retour")]);
  ok("015 : après des jours manqués, la série de jours repart à 1", r.jours === 1 && r.bonus === 5);

  // Plafond du jour
  await db.exec(`update points_jour set points = 2495 where utilisateur_id = '${u1}'`);
  r = await repondre(u1, [j("famille:plafond1"), j("famille:plafond2")]);
  ok("015 : 2 500 points par jour au plus", r.gain === 5 && r.plafond === true && r.aujourdhui === 2500);
  await db.exec(`update points_jour set points = 100 where utilisateur_id = '${u1}'`);

  // Le classement : seuls ceux qui l'ont rejoint y figurent.
  await repondre(u2, [j("voyage:a"), j("voyage:b")]);
  let cl = (await db.query(`select vocabulaire_classement($1, 'semaine') c`, [u2])).rows[0].c;
  ok("015 : personne au classement tant qu'on ne l'a pas rejoint", cl.participants === 0 && cl.top.length === 0 && cl.moi.rang === null && cl.moi.classement === false && cl.moi.points === 25);
  await db.exec(`update utilisateurs set classement = true where id in ('${u1}', '${u2}')`);
  cl = (await db.query(`select vocabulaire_classement($1, 'semaine') c`, [u2])).rows[0].c;
  const total1 = Number((await db.query(`select points from scores_vocabulaire where utilisateur_id = '${u1}'`)).rows[0].points);
  ok("015 : semaine : les points depuis lundi, du plus haut au plus bas", cl.participants === 2 && cl.top[0].id === u1 && cl.top[0].points === 100 && cl.top[1].rang === 2 && cl.moi.rang === 2);
  cl = (await db.query(`select vocabulaire_classement($1, 'toujours') c`, [u2])).rows[0].c;
  ok("015 : depuis toujours : le total du compte", cl.periode === "toujours" && cl.top[0].points === total1 && cl.moi.total === 25);
  await db.exec(`update points_jour set jour = jour - 14 where utilisateur_id = '${u2}'`);
  cl = (await db.query(`select vocabulaire_classement($1, 'semaine') c`, [u2])).rows[0].c;
  ok("015 : les points d'une autre semaine ne comptent pas cette semaine", cl.participants === 1 && cl.moi.rang === null && cl.moi.semaine === 0);

  // La photo : seulement une adresse de Google.
  let refusee = false;
  try { await db.exec(`update utilisateurs set avatar = 'https://pirate.example/x.png' where id = '${u1}'`); } catch { refusee = true; }
  let refusee2 = false;
  try { await db.exec(`update utilisateurs set avatar = 'javascript:alert(1)' where id = '${u1}'`); } catch { refusee2 = true; }
  await db.exec(`update utilisateurs set avatar = 'https://lh3.googleusercontent.com/a/ACg8ocJ-xyz=s96-c' where id = '${u1}'`);
  ok("015 : la photo n'accepte qu'une adresse googleusercontent.com", refusee && refusee2);

  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await refuse(`[${role}] ne lit pas les scores`, `select * from scores_vocabulaire`);
    await refuse(`[${role}] ne lit pas les points du jour`, `select * from points_jour`);
    await refuse(`[${role}] n'écrit pas de points`, `select vocabulaire_repondre('${u1}', '[{"mot":"a","resultat":"juste","base":20}]'::jsonb)`);
    await refuse(`[${role}] ne lit pas le classement`, `select vocabulaire_classement('${u1}', 'semaine')`);
    await db.exec(`reset role`);
  }
  await db.exec(`delete from utilisateurs where id = '${u1}'`);
  ok("015 : supprimer un compte efface ses points", Number((await db.query(`select count(*)::int n from scores_vocabulaire where utilisateur_id = '${u1}'`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from points_jour where utilisateur_id = '${u1}'`)).rows[0].n) === 0);
}

// 016 : l'Assistant (clé API chiffrée par compte, conversations, PDF, consommation)
{
  const u1 = (await db.query(`select * from compte_ouvrir('google-ia1', 'ia1@exemple.fr', 'Ilyas M')`)).rows[0].id;
  const u2 = (await db.query(`select * from compte_ouvrir('google-ia2', 'ia2@exemple.fr', 'Nour S')`)).rows[0].id;
  const echoue = async (sql) => { try { await db.exec(sql); return false; } catch { return true; } };

  ok("016 : une clé en clair est refusée (seul le format chiffré « v1. » passe)", await echoue(`insert into assistant_cles (utilisateur_id, cle_chiffree, apercu) values ('${u1}', 'sk-ant-api03-secret', 'x')`));
  await db.exec(`insert into assistant_cles (utilisateur_id, cle_chiffree, apercu) values ('${u1}', 'v1.QUJDRA==', 'sk-ant-…ABCD')`);
  await db.exec(`insert into assistant_cles (utilisateur_id, fournisseur, cle_chiffree, apercu) values ('${u1}', 'openai', 'v1.QUJDRA==', 'sk-proj-…ABCD'), ('${u1}', 'google', 'v1.QUJDRA==', 'AIza…ABCD')`);
  ok("016 : une clé par IA (Claude, ChatGPT, Gemini) pour un même compte", Number((await db.query(`select count(*)::int n from assistant_cles where utilisateur_id = '${u1}'`)).rows[0].n) === 3);
  ok("016 : pas deux clés pour la même IA", await echoue(`insert into assistant_cles (utilisateur_id, fournisseur, cle_chiffree, apercu) values ('${u1}', 'openai', 'v1.QQ==', 'x')`));
  ok("016 : une IA inconnue est refusée", await echoue(`insert into assistant_cles (utilisateur_id, fournisseur, cle_chiffree, apercu) values ('${u2}', 'mistral', 'v1.QQ==', 'x')`));
  await db.exec(`insert into assistant_reglages (utilisateur_id, modele) values ('${u1}', 'gpt-6.2-sol')`);
  ok("016 : un modèle fantaisiste est refusé", await echoue(`update assistant_reglages set modele = 'gpt-4; drop table x' where utilisateur_id = '${u1}'`));
  ok("016 : un effort inconnu est refusé", await echoue(`update assistant_reglages set effort = 'max' where utilisateur_id = '${u1}'`));

  const c1 = (await db.query(`insert into assistant_conversations (utilisateur_id, espace, titre) values ('${u1}', 'pdf', 'Rapports') returning id`)).rows[0].id;
  ok("016 : un espace de conversation inconnu est refusé", await echoue(`insert into assistant_conversations (utilisateur_id, espace) values ('${u1}', 'autre')`));
  await db.exec(`insert into assistant_messages (conversation_id, utilisateur_id, role, contenu) values ('${c1}', '${u1}', 'user', 'Résume les deux rapports')`);
  ok("016 : un rôle de message inconnu est refusé", await echoue(`insert into assistant_messages (conversation_id, utilisateur_id, role, contenu) values ('${c1}', '${u1}', 'system', 'x')`));
  const empreinte = "a".repeat(64);
  await db.exec(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte) values ('${c1}', '${u1}', 'a.pdf', 3, 1200, 480, '${empreinte}', '[Page 1] Bonjour')`);
  ok("016 : le même PDF n'entre pas deux fois dans une conversation", await echoue(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte) values ('${c1}', '${u1}', 'a-copie.pdf', 3, 1200, 480, '${empreinte}', 'x')`));
  ok("016 : une empreinte mal formée est refusée", await echoue(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte) values ('${c1}', '${u1}', 'b.pdf', 1, 1, 1, 'pas-une-empreinte', 'x')`));

  await db.exec(`insert into assistant_usage (utilisateur_id, conversation_id, modele, jetons_entree, jetons_sortie, cout_usd, statut) values
    ('${u1}', '${c1}', 'claude-sonnet-5-5', 1000, 500, 0.007, 'ok'),
    ('${u1}', '${c1}', 'claude-sonnet-5-5', 2000, 100, 0.005, 'ok'),
    ('${u1}', null, 'claude-haiku-5-5', 10, 10, 0.0001, 'ok'),
    ('${u2}', null, 'claude-opus-5-5', 99999, 9999, 9.99, 'ok')`);
  await db.exec(`insert into assistant_usage (utilisateur_id, modele, cout_usd, statut, cree_le) values ('${u1}', 'claude-sonnet-5-5', 5, 'ok', now() - interval '40 days')`);
  const bilan = (await db.query(`select assistant_bilan($1) b`, [u1])).rows[0].b;
  ok("016 : bilan du mois : coût et jetons de ce compte seulement, ce mois-ci", Math.abs(Number(bilan.mois_cout) - 0.0121) < 1e-9 && Number(bilan.mois_jetons) === 3620 && Number(bilan.mois_appels) === 3);
  ok("016 : bilan : rythme des dix dernières minutes et place des PDF", Number(bilan.dix_minutes) === 3 && Number(bilan.documents_caracteres) === 1200 && Number(bilan.conversations) === 1);

  await db.exec(`insert into assistant_verifications (utilisateur_id, reussie) values ('${u1}', false), ('${u1}', true), ('${u2}', false)`);
  await db.exec(`insert into assistant_verifications (utilisateur_id, reussie, cree_le) values ('${u1}', false, now() - interval '2 hours')`);
  ok("016 : bilan : essais de clé de la dernière heure, pour ce compte seulement", Number((await db.query(`select assistant_bilan($1) b`, [u1])).rows[0].b.verifications_heure) === 2);

  const texte = "[Page 1]\nIntroduction du rapport.\n\n[Page 2]\nLe chiffre clé : 42.\n\n[Page 10]\nAnnexe : [Page 2] cité dans le texte.";
  const d2 = (await db.query(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte) values ($1, $2, 'rapport.pdf', 10, $3, 40, $4, $5) returning id`, [c1, u1, texte.length, "b".repeat(64), texte])).rows[0].id;
  const page = async (u, n) => (await db.query(`select assistant_page($1, $2, $3) t`, [u, d2, n])).rows[0].t;
  ok("016 : une page précise d'un PDF se relit seule", (await page(u1, 2)) === "[Page 2]\nLe chiffre clé : 42.");
  ok("016 : la dernière page va jusqu'au bout, et « Page 1 » ne prend pas « Page 10 »", (await page(u1, 10)) === "[Page 10]\nAnnexe : [Page 2] cité dans le texte." && (await page(u1, 1)) === "[Page 1]\nIntroduction du rapport.");
  ok("016 : une page absente ne renvoie rien", (await page(u1, 7)) === null);
  const numeros = async () => (await db.query(`select numero from assistant_documents where conversation_id = $1 order by numero`, [c1])).rows.map((r) => r.numero).join(",");
  ok("016 : chaque PDF reçoit son numéro dans la conversation (Doc 1, Doc 2…)", (await numeros()) === "1,2");
  await db.exec(`delete from assistant_documents where conversation_id = '${c1}' and numero = 1`);
  await db.exec(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte, numero) values ('${c1}', '${u1}', 'c.pdf', 1, 1, 1, '${"c".repeat(64)}', 'x', 1)`);
  ok("016 : un numéro ne se réutilise pas et ne se choisit pas : retirer « Doc 1 » ne décale pas les autres", (await numeros()) === "2,3");
  await db.exec(`delete from assistant_documents where conversation_id = '${c1}' and numero = 3`);
  await db.exec(`insert into assistant_documents (conversation_id, utilisateur_id, nom, pages, caracteres, jetons_estimes, empreinte, texte) values ('${c1}', '${u1}', 'd.pdf', 1, 1, 1, '${"d".repeat(64)}', 'x')`);
  ok("016 : même le dernier numéro retiré n'est pas redonné", (await numeros()) === "2,4");
  ok("016 : la page d'un PDF ne se lit pas depuis un autre compte", (await page(u2, 2)) === null);
  await db.exec(`delete from assistant_documents where id = '${d2}'`);

  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await refuse(`[${role}] ne lit pas les clés de l'assistant`, `select * from assistant_cles`);
    await refuse(`[${role}] ne lit pas les réglages de l'assistant`, `select * from assistant_reglages`);
    await refuse(`[${role}] ne lit pas les conversations`, `select * from assistant_conversations`);
    await refuse(`[${role}] ne lit pas les messages`, `select * from assistant_messages`);
    await refuse(`[${role}] ne lit pas les PDF importés`, `select * from assistant_documents`);
    await refuse(`[${role}] ne lit pas la consommation`, `select * from assistant_usage`);
    await refuse(`[${role}] n'appelle pas le bilan`, `select assistant_bilan('${u1}')`);
    await refuse(`[${role}] ne lit pas une page de PDF`, `select assistant_page('${u1}', gen_random_uuid(), 1)`);
    await refuse(`[${role}] ne lit pas les essais de clé`, `select * from assistant_verifications`);
    await refuse(`[${role}] n'écrit pas de clé`, `insert into assistant_cles (utilisateur_id, cle_chiffree, apercu) values ('${u2}', 'v1.QQ==', 'x')`);
    await db.exec(`reset role`);
  }

  await db.exec(`delete from assistant_conversations where id = '${c1}'`);
  ok("016 : supprimer une conversation efface ses messages et ses PDF, mais garde la consommation", Number((await db.query(`select count(*)::int n from assistant_messages where conversation_id = '${c1}'`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from assistant_documents where conversation_id = '${c1}'`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from assistant_usage where utilisateur_id = '${u1}'`)).rows[0].n) === 4);
  await db.exec(`delete from utilisateurs where id = '${u1}'`);
  ok("016 : supprimer un compte efface sa clé et toute sa consommation", Number((await db.query(`select count(*)::int n from assistant_cles where utilisateur_id = '${u1}'`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from assistant_usage where utilisateur_id = '${u1}'`)).rows[0].n) === 0);
}

// 016 : mise à niveau d'une base où la première version (une seule clé, Claude) avait été lancée
// 017 : Le Portulan — XP, classement et duels
{
  const a = (await db.query(`select * from compte_ouvrir('google-pt1', 'pt1@exemple.fr', 'Inès Moreau')`)).rows[0].id;
  const b = (await db.query(`select * from compte_ouvrir('google-pt2', 'pt2@exemple.fr', 'Omar Diallo')`)).rows[0].id;
  const neuf = (await db.query(`select portulan_classement($1, 'semaine') c`, [b])).rows[0].c;
  ok("017 : sans aucune réponse, on voit quand même sa ligne (pour rejoindre le classement)", neuf.moi !== null && neuf.moi.classement === false && neuf.moi.xp === 0 && neuf.moi.rang === null);
  const vieillir = (uid) => db.exec(`update portulan_scores set derniere_reponse = derniere_reponse - interval '2 seconds' where utilisateur_id = '${uid}'`);
  const repondre = async (uid, reponses, attendre = true) => {
    if (attendre) await vieillir(uid);
    return (await db.query(`select portulan_repondre($1, $2::jsonb) r`, [uid, JSON.stringify(reponses)])).rows[0].r;
  };
  const r1 = await repondre(a, [{ cle: "drapeau-nom:fr", resultat: "juste", base: 10 }, { cle: "drapeau-nom:de", resultat: "presque", base: 12 }, { cle: "drapeau-nom:it", resultat: "faux", base: 10 }], false);
  ok("017 : juste = la base, presque = la moitié, faux = 0", r1.gain === 16 && r1.xp === 16 && r1.details[2].gain === 0);
  const trop = await repondre(a, [{ cle: "drapeau-nom:es", resultat: "juste", base: 10 }], false);
  ok("017 : deux envois à moins de 500 ms : le second est refusé", trop.erreur === "trop_vite");
  const r2 = await repondre(a, [{ cle: "drapeau-nom:fr", resultat: "juste", base: 10 }, { cle: "nom-drapeau:fr", resultat: "juste", base: 10 }]);
  ok("017 : un même pays et une même méthode ne rapportent qu'une fois par jour", r2.gain === 10 && r2.details[0].gain === 0);
  ok("017 : base bornée à 15", (await repondre(a, [{ cle: "carte-nom:jp", resultat: "juste", base: 999 }])).gain === 15);
  ok("017 : plus de 12 réponses d'un coup : refusé", (await repondre(a, Array.from({ length: 13 }, (_, i) => ({ cle: `drapeau-nom:x${i}`, resultat: "juste", base: 10 })))).erreur === "illisible");
  ok("017 : un compte inconnu ne marque rien", (await repondre("00000000-0000-0000-0000-000000000000", [{ cle: "drapeau-nom:fr", resultat: "juste", base: 10 }], false)).erreur === "inconnu");
  await db.exec(`update portulan_jour set xp = 2995 where utilisateur_id = '${a}'`);
  const plaf = await repondre(a, [{ cle: "pays-capitale:fr", resultat: "juste", base: 10 }]);
  ok("017 : 3 000 XP par jour au plus", plaf.gain === 5 && plaf.plafond === true);

  let cl = (await db.query(`select portulan_classement($1, 'jour') c`, [a])).rows[0].c;
  ok("017 : personne au classement tant qu'on ne l'a pas rejoint", cl.participants === 0 && cl.moi.classement === false && cl.moi.rang === null);
  await db.exec(`update utilisateurs set classement = true where id in ('${a}', '${b}')`);
  cl = (await db.query(`select portulan_classement($1, 'jour') c`, [a])).rows[0].c;
  ok("017 : classement du jour", cl.participants === 1 && cl.top[0].id === a && cl.moi.rang === 1);

  // Un duel entre amis
  let d = (await db.query(`select portulan_duel_creer($1, 'ABCDE2', 'drapeaux', 42, false) r`, [a])).rows[0].r;
  ok("017 : un duel s'ouvre en attente", d.etat === "attente" && d.code === "ABCDE2" && d.adversaire === null);
  ok("017 : pas deux duels en moins de 2 secondes", (await db.query(`select portulan_duel_creer($1, 'ABCDE3', 'drapeaux', 1, false) r`, [a])).rows[0].r.erreur === "trop_vite");
  ok("017 : code inconnu", (await db.query(`select portulan_duel_rejoindre($1, 'ZZZZZ9') r`, [b])).rows[0].r.erreur === "introuvable");
  d = (await db.query(`select portulan_duel_rejoindre($1, 'abcde2') r`, [b])).rows[0].r;
  ok("017 : rejoindre avec le code : le duel commence 4 s plus tard", d.etat === "en_cours" && d.debut - d.maintenant > 3000);
  ok("017 : trop tôt, la réponse n'est pas comptée", (await db.query(`select portulan_duel_repondre($1, $2, 0, true, 150) r`, [a, d.id])).rows[0].r.moi.reponses.length === 0);
  await db.exec(`update portulan_duels set debut = now() - interval '1 second' where id = '${d.id}'`);
  for (let i = 0; i < 10; i++) {
    await db.query(`select portulan_duel_repondre($1, $2, $3, true, 140) r`, [a, d.id, i]);
    await db.query(`select portulan_duel_repondre($1, $2, $3, $4, 999) r`, [b, d.id, i, i % 2 === 0]);
  }
  const doublon = (await db.query(`select portulan_duel_repondre($1, $2, 3, true, 150) r`, [a, d.id])).rows[0].r;
  const fin = (await db.query(`select portulan_duel_lire($1, $2) r`, [a, d.id])).rows[0].r;
  ok("017 : points bornés à 150, une réponse par question, dans l'ordre", doublon.moi.points === 1400 && fin.adversaire.points === 750);
  ok("017 : duel clos, gagnant et trophées", fin.etat === "fini" && fin.resultat === "victoire" && fin.moi.trophees === 20 && fin.adversaire.justes === 5);
  const sc = (await db.query(`select trophees, duels, victoires from portulan_scores where utilisateur_id = $1`, [a])).rows[0];
  ok("017 : les trophées ne sont donnés qu'une fois", sc.trophees === 20 && sc.duels === 1 && sc.victoires === 1);
  const c = (await db.query(`select * from compte_ouvrir('google-pt3', 'pt3@exemple.fr', 'Intrus')`)).rows[0].id;
  ok("017 : un tiers ne voit pas le duel", (await db.query(`select portulan_duel_lire($1, $2) r`, [c, d.id])).rows[0].r.erreur === "introuvable");

  // Au hasard, puis un abandon
  await db.exec(`update portulan_duels set cree = cree - interval '10 seconds'`);
  const h1 = (await db.query(`select portulan_duel_hasard($1, 'HASRD2', 'capitales', 7) r`, [a])).rows[0].r;
  const h2 = (await db.query(`select portulan_duel_hasard($1, 'HASRD3', 'capitales', 8) r`, [b])).rows[0].r;
  ok("017 : au hasard, le second rejoint le duel public du premier", h1.etat === "attente" && h2.id === h1.id && h2.etat === "en_cours" && h2.graine === 7);
  const ab = (await db.query(`select portulan_duel_quitter($1, $2) r`, [b, h1.id])).rows[0].r;
  ok("017 : quitter un duel commencé, c'est le perdre", ab.etat === "abandon" && ab.resultat === "defaite" && (await db.query(`select portulan_duel_lire($1, $2) r`, [a, h1.id])).rows[0].r.resultat === "victoire");
  cl = (await db.query(`select portulan_classement($1, 'trophees') c`, [b])).rows[0].c;
  ok("017 : classement des trophées", cl.top[0].id === a && cl.top[0].points === 40);

  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await refuse(`[${role}] ne lit pas les scores du Portulan`, `select * from portulan_scores`);
    await refuse(`[${role}] ne lit pas les duels`, `select * from portulan_duels`);
    await refuse(`[${role}] n'écrit pas d'XP`, `select portulan_repondre('${a}', '[{"cle":"drapeau-nom:fr","resultat":"juste","base":15}]'::jsonb)`);
    await refuse(`[${role}] ne joue pas un duel à la place d'un autre`, `select portulan_duel_repondre('${a}', '${d.id}', 0, true, 150)`);
    await refuse(`[${role}] ne lit pas le classement`, `select portulan_classement('${a}', 'jour')`);
    await db.exec(`reset role`);
  }
  await db.exec(`delete from utilisateurs where id in ('${a}', '${b}', '${c}')`);
  ok("017 : supprimer un compte efface ses scores et ses duels", Number((await db.query(`select count(*)::int n from portulan_scores`)).rows[0].n) === 0 && Number((await db.query(`select count(*)::int n from portulan_duels`)).rows[0].n) === 0);
}

// 018 : Le Portulan — défis, records, double XP, duels à distance, amis, salons, classes, notifications
{
  const q = async (sql, args = []) => (await db.query(sql, args)).rows[0].r;
  const a = (await db.query(`select * from compte_ouvrir('google-so1', 'so1@exemple.fr', 'Inès Moreau')`)).rows[0].id;
  const b = (await db.query(`select * from compte_ouvrir('google-so2', 'so2@exemple.fr', 'Omar Diallo')`)).rows[0].id;
  const c = (await db.query(`select * from compte_ouvrir('google-so3', 'so3@exemple.fr', 'Léa Martin')`)).rows[0].id;
  await db.exec(`update utilisateurs set classement = true where id in ('${a}', '${b}')`);

  // Le double XP : une fois par jour, et l'XP compte double.
  const d1 = await q(`select portulan_double($1) r`, [a]);
  ok("018 : le double XP s'ouvre", typeof d1.jusqua === "number");
  ok("018 : une seule fois par jour", (await q(`select portulan_double($1) r`, [a])).erreur === "deja");
  const x = await q(`select portulan_repondre($1, '[{"cle":"drapeau-nom:fr","resultat":"juste","base":10}]'::jsonb) r`, [a]);
  ok("018 : l'XP double", x.gain === 20 && typeof x.double === "number");
  await db.exec(`update portulan_scores set derniere_reponse = derniere_reponse - interval '2 seconds'`);
  const x2 = await q(`select portulan_repondre($1, '[{"cle":"drapeau-nom:fr","resultat":"juste","base":10}]'::jsonb) r`, [b]);
  ok("018 : sans double, l'XP reste simple", x2.gain === 10 && x2.double === null);

  // Les records en ligne.
  ok("018 : un premier record", (await q(`select portulan_record_envoyer($1, 'eclair', 30) r`, [a])).nouveau === true);
  ok("018 : un score plus bas ne remplace rien", (await q(`select portulan_record_envoyer($1, 'eclair', 20) r`, [a])).record === 30);
  ok("018 : le plafond de l'éclair", (await q(`select portulan_record_envoyer($1, 'eclair', 500) r`, [b])).record === 90);
  ok("018 : un mode inconnu est refusé", (await q(`select portulan_record_envoyer($1, 'triche', 5) r`, [a])).erreur === "illisible");
  const rec = await q(`select portulan_records_lire($1, 'eclair') r`, [a]);
  ok("018 : le classement des records", rec.top.length === 2 && rec.top[0].id === b && rec.moi.rang === 2 && rec.mien === 30);

  // Les défis : une seule tentative.
  const df = await q(`select portulan_defi_envoyer($1, 'jour', 8, 41000) r`, [a]);
  ok("018 : le défi du jour", df.deja === false && df.score === 8);
  ok("018 : une seule tentative", (await q(`select portulan_defi_envoyer($1, 'jour', 10, 1000) r`, [a])).deja === true);
  await q(`select portulan_defi_envoyer($1, 'jour', 9, 50000) r`, [b]);
  const dl = await q(`select portulan_defi_lire($1, 'jour') r`, [a]);
  ok("018 : le classement du défi", dl.participants === 2 && dl.top[0].id === b && dl.moi.rang === 2);
  ok("018 : un score impossible est refusé", (await q(`select portulan_defi_envoyer($1, 'semaine', 99, 0) r`, [a])).erreur === "illisible");

  // Les amis.
  ok("018 : un code ami", (await q(`select portulan_ami_code($1, 'AMIA2345') r`, [a])).code === "AMIA2345");
  ok("018 : le code ne change plus", (await q(`select portulan_ami_code($1, 'AUTRE234') r`, [a])).code === "AMIA2345");
  ok("018 : un code déjà pris", (await q(`select portulan_ami_code($1, 'AMIA2345') r`, [b])).erreur === "code_pris");
  ok("018 : une demande", (await q(`select portulan_ami_ajouter($1, 'amia2345') r`, [b])).etat === "demande");
  ok("018 : pas soi-même", (await q(`select portulan_ami_ajouter($1, 'AMIA2345') r`, [a])).erreur === "soi");
  let am = await q(`select portulan_amis_lire($1) r`, [a]);
  ok("018 : la demande reçue", am.recues.length === 1 && am.recues[0].id === b && am.amis.length === 0);
  await q(`select portulan_ami_repondre($1, $2, true) r`, [a, b]);
  am = await q(`select portulan_amis_lire($1) r`, [b]);
  ok("018 : amis des deux côtés", am.amis.length === 1 && am.amis[0].id === a && (await q(`select portulan_amis_lire($1) r`, [a])).amis.length === 1);

  // Un duel à distance, réglé à 5 questions.
  let du = await q(`select portulan_duel_ouvrir($1, 'DIST22', 'capitales', 9, false, true, 5, 12000) r`, [a]);
  ok("018 : un duel à distance s'ouvre", du.etat === "attente" && du.asynchrone === true && du.nombre === 5);
  for (let i = 0; i < 5; i++) du = await q(`select portulan_duel_repondre($1, $2, $3, true, 120) r`, [a, du.id, i]);
  ok("018 : le créateur joue avant que l'autre arrive", du.moi.reponses.length === 5 && du.etat === "attente");
  ok("018 : chaque réponse porte l'heure du serveur", du.moi.reponses.every((r, i) => typeof r.t === "number" && r.t > 0 && (i === 0 || r.t >= du.moi.reponses[i - 1].t)));
  ok("018 : personne n'a encore rejoint", du.rejoint === null);
  ok("018 : pas de sixième question", (await q(`select portulan_duel_repondre($1, $2, 5, true, 120) r`, [a, du.id])).moi.reponses.length === 5);
  du = await q(`select portulan_duel_rejoindre($1, 'dist22') r`, [b]);
  ok("018 : l'adversaire rejoint", du.etat === "en_cours" && du.adversaire.nombre === 5);
  ok("018 : l'heure à laquelle il a rejoint (ses 24 heures partent de là)", typeof du.rejoint === "number" && du.rejoint >= du.cree);
  await q(`select portulan_duel_reagir($1, $2, 'bravo') r`, [a, du.id]);
  ok("018 : une réaction rapide", (await q(`select portulan_duel_lire($1, $2) r`, [b, du.id])).adversaire.reaction.r === "bravo");
  ok("018 : une réaction inconnue", (await q(`select portulan_duel_reagir($1, $2, 'insulte') r`, [a, du.id])).erreur === "illisible");
  for (let i = 0; i < 5; i++) du = await q(`select portulan_duel_repondre($1, $2, $3, $4, 100) r`, [b, du.id, i, i < 2]);
  ok("018 : le duel se termine", du.etat === "fini" && du.resultat === "defaite");
  const elos = (await db.query(`select utilisateur_id, elo from portulan_scores where utilisateur_id in ($1, $2)`, [a, b])).rows;
  ok("018 : la cote bouge", elos.find((r) => r.utilisateur_id === a).elo === 1216 && elos.find((r) => r.utilisateur_id === b).elo === 1184);
  ok("018 : mes duels à distance", (await q(`select portulan_duels_mes($1) r`, [b])).duels.length === 1);
  am = await q(`select portulan_amis_lire($1) r`, [a]);
  ok("018 : le face-à-face entre amis", am.amis[0].victoires === 1 && am.amis[0].defaites === 0);

  // Un salon à élimination, à trois.
  let sa = await q(`select portulan_salon_creer($1, 'SALON2', 'drapeaux', 5, 'elimination', 9, 4) r`, [a]);
  ok("018 : un salon s'ouvre", sa.etat === "attente" && sa.joueurs.length === 1 && sa.createur === true);
  await q(`select portulan_salon_rejoindre($1, 'salon2') r`, [b]);
  ok("018 : pas assez de joueurs", (await q(`select portulan_salon_lancer($1, $2) r`, [a, sa.id])).erreur === "pas_assez");
  await q(`select portulan_salon_rejoindre($1, 'SALON2') r`, [c]);
  ok("018 : seul l'hôte lance", (await q(`select portulan_salon_lancer($1, $2) r`, [b, sa.id])).erreur === "introuvable");
  sa = await q(`select portulan_salon_lancer($1, $2) r`, [a, sa.id]);
  ok("018 : le salon commence", sa.etat === "en_cours" && sa.joueurs.length === 3);
  await db.exec(`update portulan_salons set debut = now() - interval '1 second' where id = '${sa.id}'`);
  for (let i = 0; i < 3; i++) {
    await q(`select portulan_salon_repondre($1, $2, $3, true, 140) r`, [a, sa.id, i]);
    await q(`select portulan_salon_repondre($1, $2, $3, true, 100) r`, [b, sa.id, i]);
    await q(`select portulan_salon_repondre($1, $2, $3, false, 100) r`, [c, sa.id, i]);
  }
  sa = await q(`select portulan_salon_lire($1, $2) r`, [a, sa.id]);
  ok("018 : les réponses du salon portent l'heure du serveur", sa.joueurs.find((j) => j.id === a).reponses.every((r) => typeof r.t === "number") && sa.joueurs.find((j) => j.id === b).reponses === null);
  ok("018 : le dernier est éliminé après trois questions", sa.joueurs.find((j) => j.id === c).elimine === 3 && sa.joueurs.find((j) => j.id === a).elimine === null);
  ok("018 : un éliminé ne joue plus", (await q(`select portulan_salon_repondre($1, $2, 3, true, 150) r`, [c, sa.id])).joueurs.find((j) => j.id === c).nombre === 3);
  for (let i = 3; i < 6; i++) {
    await q(`select portulan_salon_repondre($1, $2, $3, true, 140) r`, [a, sa.id, i]);
    await q(`select portulan_salon_repondre($1, $2, $3, false, 100) r`, [b, sa.id, i]);
  }
  sa = await q(`select portulan_salon_lire($1, $2) r`, [b, sa.id]);
  ok("018 : le salon se termine quand il ne reste qu'un joueur", sa.etat === "fini" && sa.joueurs[0].id === a && sa.joueurs[0].rang === 1 && sa.joueurs.find((j) => j.id === c).rang === 3);
  ok("018 : un tiers ne voit pas le salon", (await db.query(`select * from compte_ouvrir('google-so4', 'so4@exemple.fr', 'Zoé') `)).rows.length === 1);

  // Une classe.
  let cl = await q(`select portulan_classe_creer($1, 'CLASS2', 'Cinquième B') r`, [a]);
  ok("018 : une classe", cl.nom === "Cinquième B" && cl.proprietaire === true && cl.membres.length === 0);
  await q(`select portulan_classe_rejoindre($1, 'class2') r`, [b]);
  cl = await q(`select portulan_classe_lire($1, $2) r`, [a, cl.id]);
  ok("018 : l'enseignant voit ses élèves", cl.membres.length === 1 && cl.membres[0].id === b && cl.membres[0].xp === 10);
  ok("018 : un inconnu ne voit pas la classe", (await q(`select portulan_classe_lire($1, $2) r`, [c, cl.id])).erreur === "introuvable");
  ok("018 : mes classes", (await q(`select portulan_classes_mes($1) r`, [b])).suivies.length === 1 && (await q(`select portulan_classes_mes($1) r`, [a])).miennes[0].membres === 1);
  await q(`select portulan_classe_quitter($1, $2, $3) r`, [a, cl.id, b]);
  ok("018 : l'enseignant retire un élève", (await q(`select portulan_classe_lire($1, $2) r`, [a, cl.id])).membres.length === 0);

  // Les notifications.
  ok("018 : un abonnement", (await q(`select portulan_abonner($1, 'https://push.exemple/abc', '{"p256dh":"x","auth":"y"}'::jsonb) r`, [a])).ok === true);
  ok("018 : un abonnement non https refusé", (await q(`select portulan_abonner($1, 'http://push.exemple/abc', '{}'::jsonb) r`, [a])).erreur === "illisible");
  ok("018 : les abonnements d'un compte", (await q(`select portulan_abonnements_de($1) r`, [a])).length === 1);
  await q(`select portulan_desabonner($1, 'https://push.exemple/abc') r`, [a]);
  ok("018 : désabonné", (await q(`select portulan_abonnements_de($1) r`, [a])).length === 0);

  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await refuse(`[${role}] ne lit pas les amis`, `select * from portulan_amis`);
    await refuse(`[${role}] ne lit pas les salons`, `select * from portulan_salons`);
    await refuse(`[${role}] ne lit pas les classes`, `select * from portulan_classe_membres`);
    await refuse(`[${role}] ne lit pas les abonnements`, `select * from portulan_abonnements`);
    await refuse(`[${role}] n'écrit pas de record`, `select portulan_record_envoyer('${a}', 'eclair', 90)`);
    await refuse(`[${role}] n'ouvre pas le double XP`, `select portulan_double('${b}')`);
    await refuse(`[${role}] ne se fait pas d'amis à la place d'un autre`, `select portulan_ami_ajouter('${c}', 'AMIA2345')`);
    await db.exec(`reset role`);
  }
  await db.exec(`delete from utilisateurs where email like 'so_@exemple.fr'`);
  ok("018 : supprimer les comptes efface tout", Number((await db.query(`select (select count(*) from portulan_amis) + (select count(*) from portulan_salons) + (select count(*) from portulan_classes) + (select count(*) from portulan_records) + (select count(*) from portulan_defis) as n`)).rows[0].n) === 0);
}

{
  const ancienne = new PGlite({ extensions: { unaccent, pg_trgm } });
  await ancienne.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema extensions; grant usage on schema extensions to anon, authenticated, service_role;
    create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
  for (const f of ["001_socle.sql", "002_structure.sql", "003_editeur.sql", "004_fichiers.sql", "005_recherche.sql", "006_innovations.sql", "007_sources_navigation.sql", "008_reglages.sql", "009_recherche_sens.sql", "010_contributions.sql", "011_espaces.sql", "012_islam_un_bloc.sql", "013_messagerie.sql", "014_comptes.sql", "015_classement.sql"]) {
    await ancienne.exec(readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8"));
  }
  await ancienne.exec(`create table public.assistant_cles (
    utilisateur_id uuid primary key references public.utilisateurs (id) on delete cascade,
    cle_chiffree text not null, apercu text not null,
    modele text not null default 'claude-sonnet-5-5', effort text not null default 'medium',
    plafond_mensuel_usd numeric(10, 2), statut text not null default 'valide',
    verifiee_le timestamptz not null default now(), cree_le timestamptz not null default now(), maj timestamptz not null default now())`);
  const u = (await ancienne.query(`select * from compte_ouvrir('google-maj', 'maj@exemple.fr', 'Maj')`)).rows[0].id;
  await ancienne.exec(`insert into assistant_cles (utilisateur_id, cle_chiffree, apercu, modele, effort, plafond_mensuel_usd) values ('${u}', 'v1.QQ==', 'sk-ant-…AAAA', 'claude-opus-5-5', 'high', 7)`);
  await ancienne.exec(readFileSync(new URL("../supabase/migrations/016_assistant.sql", import.meta.url), "utf8"));
  const cle = (await ancienne.query(`select fournisseur from assistant_cles where utilisateur_id = $1`, [u])).rows;
  const reg = (await ancienne.query(`select modele, effort, plafond_mensuel_usd::float p from assistant_reglages where utilisateur_id = $1`, [u])).rows[0];
  ok("016 mise à niveau : l'ancienne clé devient la clé Claude du compte", cle.length === 1 && cle[0].fournisseur === "anthropic");
  ok("016 mise à niveau : ses réglages sont repris", reg?.modele === "claude-opus-5-5" && reg.effort === "high" && reg.p === 7);
  await ancienne.exec(`insert into assistant_cles (utilisateur_id, fournisseur, cle_chiffree, apercu) values ('${u}', 'google', 'v1.QQ==', 'AIza…BBBB')`);
  ok("016 mise à niveau : une seconde clé (Gemini) s'ajoute", Number((await ancienne.query(`select count(*)::int n from assistant_cles where utilisateur_id = $1`, [u])).rows[0].n) === 2);
  await ancienne.exec(readFileSync(new URL("../supabase/migrations/016_assistant.sql", import.meta.url), "utf8"));
  ok("016 mise à niveau : relancer le script ne change rien", Number((await ancienne.query(`select count(*)::int n from assistant_cles where utilisateur_id = $1`, [u])).rows[0].n) === 2);
  await ancienne.close();
}

console.log(echecs === 0 ? "\nTous les tests SQL passent." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
