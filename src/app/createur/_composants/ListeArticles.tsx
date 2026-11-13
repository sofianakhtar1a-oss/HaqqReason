"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { BadgeStatut } from "@/components/BadgeStatut";
import type { ArticleResume } from "@/lib/contenu-admin";
import { ListeTriable } from "./Triable";

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
}

/** Les articles d'une catégorie, réordonnables par glisser-déposer. */
export function ListeArticles({ articles }: { articles: ArticleResume[] }) {
  return (
    <ListeTriable
      key={articles.map((a) => `${a.id}:${a.ordre}`).join(",")}
      table="articles"
      className="mt-6 space-y-1"
      elements={articles}
      rendre={(a) => (
        <>
          <FileText className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <Link href={`/createur/article/${a.id}`} className="min-w-0 flex-1 font-semibold hover:underline hover:underline-offset-4">
            <span className="block truncate">{a.titre}</span>
          </Link>
          <span className="hidden text-sm text-encre-douce md:inline">{dateCourte(a.updated_at)}</span>
          <BadgeStatut statut={a.statut} />
        </>
      )}
    />
  );
}
