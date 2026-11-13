import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

let clientPublic: SupabaseClient | null = null;
let clientAdmin: SupabaseClient | null = null;

/**
 * Accès « lecteur » : utilise la clé publique. La base applique les règles RLS,
 * donc seul le contenu publié est visible, même en cas d'erreur dans le code.
 */
export function dbPublic(): SupabaseClient {
  clientPublic ??= createClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), options);
  return clientPublic;
}

/**
 * Accès « créateur » : utilise la clé secrète, qui contourne RLS.
 * À n'appeler qu'APRÈS avoir vérifié la session créateur (voir session.ts).
 */
export function dbAdmin(): SupabaseClient {
  clientAdmin ??= createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), options);
  return clientAdmin;
}
