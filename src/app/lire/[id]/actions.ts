"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jetonDeLecture, lirePublication, motDePasseJuste, nomCookieLecture } from "@/lib/atelier/publications";

/** Le mot de passe d'une page publiée : juste, il ouvre la lecture pour trente jours sur cet appareil. */
export async function deverrouillerLecture(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const p = await lirePublication(id);
  if (!p) redirect("/");
  const essai = String(formData.get("motDePasse") ?? "").slice(0, 100);
  if (!motDePasseJuste(p, essai)) {
    // Un temps d'attente : essayer des mots de passe à la chaîne devient très lent.
    await new Promise((r) => setTimeout(r, 900));
    redirect(`/lire/${id}?erreur=1`);
  }
  (await cookies()).set(nomCookieLecture(id), jetonDeLecture(p), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/lire/${id}`,
    maxAge: 30 * 86400,
  });
  redirect(`/lire/${id}`);
}
