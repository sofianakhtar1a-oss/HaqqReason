import { Logo } from "./Logo";

/** Mise en page commune aux écrans d'accès du mode créateur (connexion, configuration, récupération). */
export function CadreCreateur({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10">
      <div className="sans-impression mb-6">
        <Logo />
      </div>
      <div className="verre panneau">{children}</div>
    </main>
  );
}
