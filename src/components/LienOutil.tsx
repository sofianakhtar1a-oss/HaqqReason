"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Un raccourci de l'en-tête qui sait s'il mène à la page où l'on est (aria-current, voir finitions.css). */
export function LienOutil({ href, className, title, children }: { href: string; className: string; title: string; children: React.ReactNode }) {
  const chemin = usePathname() ?? "";
  const ici = chemin === href || chemin.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} title={title} aria-current={ici ? "page" : undefined}>
      {children}
    </Link>
  );
}
