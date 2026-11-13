import "server-only";
import { dbAdmin } from "./supabase";

export type CompteCreateur = {
  password_hash: string;
  recovery_hash: string;
  session_version: number;
  password_changed_at: string;
  created_at: string;
  totp_secret: string | null;
  totp_actif: boolean;
  totp_dernier_pas: number;
};

/** Lit l'unique compte créateur. Renvoie null si l'application n'est pas encore configurée. */
export async function lireCompteCreateur(): Promise<CompteCreateur | null> {
  const { data, error } = await dbAdmin()
    .from("creator_auth")
    .select("password_hash, recovery_hash, session_version, password_changed_at, created_at, totp_secret, totp_actif, totp_dernier_pas")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    throw new Error(`Lecture du compte créateur impossible : ${error.message}`);
  }
  return data;
}
