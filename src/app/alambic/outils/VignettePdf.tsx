"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DocPdf = Awaited<ReturnType<typeof import("@/lib/alambic/navigateur/pdf").ouvrir>>["doc"];

/** Vignette d'une page de PDF, dessinée seulement quand elle approche de l'écran (un PDF de 500 pages reste fluide). */
export function VignettePdf({ doc, numero, largeur = 160, className, style }: { doc: DocPdf; numero: number; largeur?: number; className?: string; style?: React.CSSProperties }) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let fait = false;
    let lien: string | null = null;
    let vivant = true;
    const obs = new IntersectionObserver(
      async (entrees) => {
        if (fait || !entrees.some((e) => e.isIntersecting)) return;
        fait = true;
        obs.disconnect();
        try {
          const { vignettePage } = await import("@/lib/alambic/navigateur/pdf");
          lien = await vignettePage(doc, numero, largeur);
          if (vivant) setUrl(lien);
          else URL.revokeObjectURL(lien);
        } catch {
          // Page illisible : la vignette reste vide, la page sera tout de même gardée.
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => {
      vivant = false;
      obs.disconnect();
      if (lien) URL.revokeObjectURL(lien);
    };
  }, [doc, numero, largeur]);
  return (
    <span ref={ref} className={className ?? "alambic-vignette"}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image locale (blob:), rien à optimiser */}
      {url ? <img src={url} alt="" style={style} draggable={false} /> : <LoaderCircle className="size-5 animate-spin text-encre-douce" aria-hidden="true" />}
    </span>
  );
}
