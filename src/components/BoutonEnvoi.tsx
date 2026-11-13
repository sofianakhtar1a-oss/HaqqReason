"use client";

import { useFormStatus } from "react-dom";

export function BoutonEnvoi({ children, enCours, className = "bouton bouton-principal w-full" }: { children: React.ReactNode; enCours: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? enCours : children}
    </button>
  );
}
