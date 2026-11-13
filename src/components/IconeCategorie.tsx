import {
  BookOpen,
  Feather,
  Flame,
  Folder,
  Globe,
  Hourglass,
  KeyRound,
  Landmark,
  Lightbulb,
  MessagesSquare,
  Moon,
  Scale,
  ScrollText,
  Search,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { CleIcone } from "@/lib/icones";

const IMAGES: Record<CleIcone, LucideIcon> = {
  dossier: Folder,
  livre: BookOpen,
  parchemin: ScrollText,
  plume: Feather,
  balance: Scale,
  bouclier: Shield,
  lumiere: Lightbulb,
  lune: Moon,
  etoile: Star,
  sablier: Hourglass,
  monument: Landmark,
  globe: Globe,
  dialogue: MessagesSquare,
  cle: KeyRound,
  flamme: Flame,
  loupe: Search,
};

export function IconeCategorie({ icone, className = "size-7" }: { icone: string; className?: string }) {
  const Composant = IMAGES[icone as CleIcone] ?? Folder;
  return <Composant className={className} strokeWidth={1.5} aria-hidden="true" />;
}
