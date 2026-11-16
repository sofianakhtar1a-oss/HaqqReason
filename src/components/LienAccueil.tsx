"use client";

import Link from "next/link";
import { useAdresseAccueil } from "@/lib/client/acces";

/** Lien « accueil » cloisonné : voir lib/client/acces.ts. */
export function LienAccueil({ className, children }: { className?: string; children: React.ReactNode }) {
  const href = useAdresseAccueil();
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
