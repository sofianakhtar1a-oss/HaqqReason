import { FileArchive, FileImage, FileSpreadsheet, FileText, Presentation } from "lucide-react";

export function IconeFichier({ typeMime, className = "size-6" }: { typeMime: string; className?: string }) {
  if (typeMime.startsWith("image/")) return <FileImage className={className} strokeWidth={1.5} aria-hidden="true" />;
  if (typeMime.includes("spreadsheet")) return <FileSpreadsheet className={className} strokeWidth={1.5} aria-hidden="true" />;
  if (typeMime.includes("presentation")) return <Presentation className={className} strokeWidth={1.5} aria-hidden="true" />;
  if (typeMime === "application/epub+zip") return <FileArchive className={className} strokeWidth={1.5} aria-hidden="true" />;
  return <FileText className={className} strokeWidth={1.5} aria-hidden="true" />;
}
