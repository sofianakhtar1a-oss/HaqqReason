-- =====================================================================
-- 020 · Retrait des tables de l'ancien assistant (Le Vizir)
--   Le module a été retiré du site le 18 novembre 2026 (pages, routes, code) :
--   ses tables (016) ne servaient plus à rien. Ce script les efface pour de
--   bon, avec leurs fonctions : les conversations, le texte des PDF importés,
--   les clés API chiffrées, la consommation et les essais de clé disparaissent.
--   Rien d'autre n'est touché : les comptes et tout le reste restent.
--   Sans « cascade » : si un autre objet dépendait encore de ces tables,
--   le script s'arrêterait sans rien effacer.
-- Le script peut être relancé sans risque (016 avant lui ou non).
-- =====================================================================

-- 1. Les fonctions qui lisaient ces tables ---------------------------------
drop function if exists public.assistant_bilan(uuid);
drop function if exists public.assistant_page(uuid, uuid, integer);

-- 2. Les tables (le déclencheur des numéros de PDF part avec la sienne) -----
drop table if exists
  public.assistant_documents,
  public.assistant_messages,
  public.assistant_usage,
  public.assistant_verifications,
  public.assistant_conversations,
  public.assistant_reglages,
  public.assistant_cles;

-- 3. La fonction de ce déclencheur, désormais seule --------------------------
drop function if exists public.assistant_documents_numero();
