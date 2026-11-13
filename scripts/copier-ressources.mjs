// Copie dans public/vendor les fichiers dont le navigateur a besoin pour lire les PDF (pdf.js)
// et reconnaître le texte des PDF scannés (Tesseract). Lancé automatiquement après « npm install ».
// Tout est servi par l'application elle-même : aucun service extérieur n'est appelé.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const racine = new URL("..", import.meta.url).pathname;
const nm = (...p) => join(racine, "node_modules", ...p);
const cible = (...p) => join(racine, "public", "vendor", ...p);

rmSync(cible(), { recursive: true, force: true });
mkdirSync(cible("pdfjs"), { recursive: true });
mkdirSync(cible("tesseract", "core"), { recursive: true });
mkdirSync(cible("tesseract", "lang"), { recursive: true });

cpSync(nm("pdfjs-dist", "build", "pdf.worker.min.mjs"), cible("pdfjs", "pdf.worker.min.mjs"));
for (const dossier of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  if (existsSync(nm("pdfjs-dist", dossier))) cpSync(nm("pdfjs-dist", dossier), cible("pdfjs", dossier), { recursive: true });
}

cpSync(nm("tesseract.js", "dist", "worker.min.js"), cible("tesseract", "worker.min.js"));
for (const coeur of ["tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-relaxedsimd-lstm.wasm.js"]) {
  cpSync(nm("tesseract.js-core", coeur), cible("tesseract", "core", coeur));
}
for (const langue of ["fra", "ara", "eng"]) {
  cpSync(nm("@tesseract.js-data", langue, "4.0.0_best_int", `${langue}.traineddata.gz`), cible("tesseract", "lang", `${langue}.traineddata.gz`));
}
console.log("Ressources pdf.js et Tesseract copiées dans public/vendor.");
