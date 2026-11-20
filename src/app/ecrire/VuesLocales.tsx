"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { FileText, ImageOff, Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { lireFichier, urlFichier } from "@/lib/atelier/depot";

/**
 * Images et documents de l'atelier : ils ne viennent pas d'un serveur mais de
 * la base locale du navigateur. La vue va donc chercher l'adresse temporaire du
 * fichier au moment de l'afficher.
 */

export function useUrlLocale(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true;
    if (!id) return;
    void urlFichier(id).then((adresse) => {
      if (vivant) setUrl(adresse);
    });
    return () => {
      vivant = false;
    };
  }, [id]);
  return url;
}

export function VueImageLocale(props: NodeViewProps) {
  const attrs = props.node.attrs as { fichier: string; legende: string; alt: string; largeur: string };
  const url = useUrlLocale(attrs.fichier);
  const legende = useRef(attrs.legende ?? "");

  return (
    <NodeViewWrapper as="figure" className="image-bloc" data-largeur={attrs.largeur || "normale"}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={attrs.alt || ""} />
      ) : (
        <span className="image-absente">
          <ImageOff className="size-5" aria-hidden="true" />
          Image introuvable : elle est peut-être restée sur un autre appareil
        </span>
      )}
      <figcaption>
        <input
          key={attrs.legende}
          defaultValue={attrs.legende ?? ""}
          onChange={(e) => {
            legende.current = e.target.value;
          }}
          onBlur={() => props.updateAttributes({ legende: legende.current })}
          placeholder="Légende (facultative)"
          className="image-legende-champ"
          aria-label="Légende de l'image"
        />
      </figcaption>
    </NodeViewWrapper>
  );
}

export function VueDocumentLocal(props: NodeViewProps) {
  const attrs = props.node.attrs as { fichier: string; nom: string };
  const url = useUrlLocale(attrs.fichier);
  const [poids, setPoids] = useState<number | null>(null);

  useEffect(() => {
    let vivant = true;
    void lireFichier(attrs.fichier).then((f) => {
      if (vivant) setPoids(f?.taille ?? null);
    });
    return () => {
      vivant = false;
    };
  }, [attrs.fichier]);

  return (
    <NodeViewWrapper className="document-bloc" data-type="local">
      <FileText className="size-6 shrink-0 text-accent" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-semibold">{attrs.nom || "Document"}</span>
        <span className="block text-sm text-encre-douce">
          {poids !== null ? `${(poids / 1024 / 1024).toFixed(1)} Mo` : "Document joint"} · joint au document
        </span>
      </span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="bouton bouton-discret bouton-petit ml-auto shrink-0">
          <Paperclip className="size-4" aria-hidden="true" />
          Ouvrir
        </a>
      )}
    </NodeViewWrapper>
  );
}
