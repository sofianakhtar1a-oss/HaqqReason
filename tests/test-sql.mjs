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
for (const fichier of ["001_socle.sql", "002_structure.sql", "003_editeur.sql", "004_fichiers.sql", "005_recherche.sql", "006_innovations.sql", "007_sources_navigation.sql"]) {
  await db.exec(readFileSync(new URL(`../supabase/migrations/${fichier}`, import.meta.url), "utf8"));
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
  ok(`[${role}] lit les 3 blocs`, blocs.rows.length === 3);
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

console.log(echecs === 0 ? "\nTous les tests SQL passent." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
