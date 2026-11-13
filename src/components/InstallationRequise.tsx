import { Sceau } from "./Logo";

/** Écran affiché tant que le serveur n'a pas reçu ses réglages (voir le guide d'installation). */
export function InstallationRequise({ manquantes }: { manquantes: string[] }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <div className="verre panneau">
        <span className="text-or">
          <Sceau taille={40} />
        </span>
        <h1 className="mt-5 text-3xl font-bold">HaqqReason attend ses réglages</h1>
        <p className="mt-3 text-encre-douce">
          Le serveur ne trouve pas certaines variables d&apos;environnement. Suis l&apos;étape « Réglages » du guide
          d&apos;installation, puis recharge cette page.
        </p>
        <p className="mt-5 font-semibold">À renseigner :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {manquantes.map((nom) => (
            <li key={nom}>
              <code>{nom}</code>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
