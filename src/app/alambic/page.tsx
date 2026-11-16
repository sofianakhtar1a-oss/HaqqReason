import type { Metadata } from "next";
import { Alambic } from "./Alambic";

export const metadata: Metadata = {
  title: "L'Alambic, studio de fichiers",
  description: "Convertir, fusionner, découper et protéger tes fichiers, dans ton navigateur : documents, tableurs, images, sons, vidéos et archives. Rien n'est envoyé.",
};

export default function PageAlambic() {
  return <Alambic />;
}
