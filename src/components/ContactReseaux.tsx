import { Camera, Music2 } from "lucide-react";
import { CONTACT } from "@/lib/acces-modules-jeton";

/** Les deux comptes où demander le mot de passe des modules réservés. */
export function ContactReseaux({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid gap-3 ${className}`}>
      <li>
        <a href={CONTACT.instagram.url} target="_blank" rel="noopener noreferrer" className="reseau" data-reseau="instagram">
          <span className="reseau-icone" aria-hidden="true">
            <Camera className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-encre-douce">Instagram</span>
            <span className="block truncate font-bold">@{CONTACT.instagram.nom}</span>
          </span>
        </a>
      </li>
      <li>
        <a href={CONTACT.tiktok.url} target="_blank" rel="noopener noreferrer" className="reseau" data-reseau="tiktok">
          <span className="reseau-icone" aria-hidden="true">
            <Music2 className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-encre-douce">TikTok</span>
            <span className="block truncate font-bold">@{CONTACT.tiktok.nom}</span>
          </span>
        </a>
      </li>
    </ul>
  );
}
