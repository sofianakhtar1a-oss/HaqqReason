import { strFromU8, strToU8, unzipSync, zipSync, zlibSync } from "fflate";
import { PDFDocument, PDFName } from "@cantoo/pdf-lib";
import { examiner, nettoyer, FORMATS_NETTOYABLES, type Trace } from "../src/lib/alambic/traces";

let e = 0;
let n = 0;
const ok = (nom: string, c: boolean, x = "") => {
  n++;
  console.log((c ? "OK " : "ECHEC ") + nom + (c ? "" : ` ${x}`));
  if (!c) e++;
};
const texte = (t: string) => new TextEncoder().encode(t);
const latin = (b: Uint8Array) => Array.from(b, (x) => String.fromCharCode(x)).join("");
const concat = (...p: Uint8Array[]) => {
  const r = new Uint8Array(p.reduce((a, b) => a + b.length, 0));
  let o = 0;
  for (const m of p) {
    r.set(m, o);
    o += m.length;
  }
  return r;
};
const egaux = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);
const trouve = (t: Trace[], cle: string) => t.find((x) => x.cle === cle);

// ---------------------------------------------------------------- JPEG
const JPEG = Uint8Array.from(Buffer.from("ffd8ffe000104a46494600010100000100010000ffdb0043000a07070807060a0808080b0a0a0b0e18100e0d0d0e1d15161118231f2524221f2221262b372f26293429212230413134393b3e3e3e252e4449433c48373d3e3bffdb0043010a0b0b0e0d0e1c10101c3b2822283b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3bffc00011080008000803012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00e668a28af20fd10fffd9", "hex"));
type Ent = { tag: number; type: number; compte: number; octets: number[] };
const asc = (tag: number, s: string): Ent => ({ tag, type: 2, compte: s.length + 1, octets: [...texte(s), 0] });
const sh = (tag: number, v: number): Ent => ({ tag, type: 3, compte: 1, octets: [v & 255, v >> 8] });
const lg = (tag: number, v: number): Ent => ({ tag, type: 4, compte: 1, octets: [v & 255, (v >> 8) & 255, 0, 0] });
const oc = (tag: number, v: number): Ent => ({ tag, type: 1, compte: 1, octets: [v] });
const u32 = (v: number) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
const rat = (tag: number, l: [number, number][]): Ent => ({ tag, type: 5, compte: l.length, octets: l.flatMap(([a, b]) => [...u32(a), ...u32(b)]) });
function ifd(ents: Ent[], debut: number): number[] {
  const taille = 2 + 12 * ents.length + 4;
  const sortie = [ents.length & 255, ents.length >> 8];
  const data: number[] = [];
  for (const x of ents) {
    sortie.push(x.tag & 255, x.tag >> 8, x.type, 0, ...u32(x.compte));
    if (x.octets.length <= 4) sortie.push(...x.octets, ...new Array(4 - x.octets.length).fill(0));
    else {
      sortie.push(...u32(debut + taille + data.length));
      data.push(...x.octets);
      if (data.length & 1) data.push(0);
    }
  }
  sortie.push(0, 0, 0, 0);
  return [...sortie, ...data];
}
function tiffExif(): number[] {
  const g = (o: number) => [
    asc(0x0001, "N"), rat(0x0002, [[48, 1], [4, 1], [142, 10]]), asc(0x0003, "W"), rat(0x0004, [[0, 1], [46, 1], [239, 10]]), oc(0x0005, 0), rat(0x0006, [[62, 1]]),
  ].length && ifd([asc(0x0001, "N"), rat(0x0002, [[48, 1], [4, 1], [142, 10]]), asc(0x0003, "W"), rat(0x0004, [[0, 1], [46, 1], [239, 10]]), oc(0x0005, 0), rat(0x0006, [[62, 1]])], o);
  const exifEnts = [asc(0x9003, "2025:03:12 14:02:33"), asc(0xa431, "SN123456")];
  const i0 = (pe: number, pg: number) => ifd([asc(0x010f, "Canon"), asc(0x0110, "EOS 250D"), sh(0x0112, 6), asc(0x013b, "Jeanne Martin"), lg(0x8769, pe), lg(0x8825, pg)], 8);
  const t0 = i0(0, 0).length;
  const te = ifd(exifEnts, 8 + t0).length;
  return [0x49, 0x49, 42, 0, 8, 0, 0, 0, ...i0(8 + t0, 8 + t0 + te), ...ifd(exifEnts, 8 + t0), ...g(8 + t0 + te)];
}
const seg = (m: number, d: Uint8Array) => concat(new Uint8Array([0xff, m, (d.length + 2) >> 8, (d.length + 2) & 255]), d);
const exifSeg = seg(0xe1, concat(texte("Exif\0\0"), new Uint8Array(tiffExif())));
const xmpTxt = '<x:xmpmeta><rdf:RDF><rdf:Description xmp:CreatorTool="GIMP 2.10"><dc:creator><rdf:Seq><rdf:li>Jeanne M</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>';
const xmpSeg = seg(0xe1, texte("http://ns.adobe.com/xap/1.0/\0" + xmpTxt));
const comSeg = seg(0xfe, texte("Ma photo privée"));
const mpfSeg = seg(0xe2, texte("MPF\0abcdef"));
const junk = new Uint8Array(50).fill(7);
const jpgSale = concat(JPEG.subarray(0, 20), exifSeg, xmpSeg, comSeg, mpfSeg, JPEG.subarray(20), junk);
const sos = (b: Uint8Array) => {
  for (let i = 0; i < b.length - 1; i++) if (b[i] === 0xff && b[i + 1] === 0xda) return i;
  return -1;
};
{
  const ex = await examiner(jpgSale, "jpg", "photo.jpg");
  ok("jpg : nettoyable", ex.nettoyable && ex.format === "jpg");
  ok("jpg : Appareil", trouve(ex.traces, "appareil")?.valeur === "Canon" && trouve(ex.traces, "appareil")?.libelle === "Appareil");
  ok("jpg : Modèle", trouve(ex.traces, "modele")?.valeur === "EOS 250D" && trouve(ex.traces, "modele")?.libelle === "Modèle");
  const gps = trouve(ex.traces, "gps");
  ok("jpg : Position GPS lisible et sensible", gps?.valeur === "48,07061 N, 0,77331 O" && gps.sensible === true, gps?.valeur);
  ok("jpg : altitude", trouve(ex.traces, "altitude")?.valeur === "62 m");
  ok("jpg : auteur sensible", trouve(ex.traces, "auteur")?.sensible === true && trouve(ex.traces, "auteur")?.valeur === "Jeanne Martin");
  ok("jpg : date de prise de vue française", trouve(ex.traces, "prise")?.valeur === "12/03/2025 14:02", trouve(ex.traces, "prise")?.valeur);
  ok("jpg : numéro de série sensible", trouve(ex.traces, "serie")?.sensible === true);
  ok("jpg : XMP et outil", !!trouve(ex.traces, "xmp") && trouve(ex.traces, "xmp-outil")?.valeur === "GIMP 2.10");
  ok("jpg : commentaire", trouve(ex.traces, "commentaire")?.valeur === "Ma photo privée" || trouve(ex.traces, "commentaire")?.valeur.startsWith("Ma photo") === true);
  ok("jpg : octets parasites signalés", ex.remarques.some((r) => r.includes("50 octets")));
  const r = await nettoyer(jpgSale, "jpg");
  const s = latin(r.octets);
  ok("jpg : plus de GPS, de série ni d'XMP ni de commentaire", !s.includes("Canon") && !s.includes("SN123456") && !s.includes("xap") && !s.includes("Ma photo") && !s.includes("MPF"));
  ok("jpg : un seul Exif minimal, orientation 6", s.split("Exif").length === 2 && (await examiner(r.octets, "jpg")).traces.length === 0);
  ok("jpg : l'orientation 6 est conservée", /Exif\0\0MM\0\*\0\0\0\x08\0\x01\x01\x12\0\x03\0\0\0\x01\0\x06/.test(s));
  ok("jpg : plus de données après l'image", r.octets[r.octets.length - 2] === 0xff && r.octets[r.octets.length - 1] === 0xd9);
  ok("jpg : données de l'image identiques", egaux(r.octets.subarray(sos(r.octets)), JPEG.subarray(sos(JPEG))));
  ok("jpg : APP0 JFIF conservé", s.includes("JFIF"));
  ok("jpg : retirées comptées", r.retirees === ex.traces.length && r.retirees >= 8);
  ok("jpg : remarque GPS", r.remarques.includes("La position GPS a été retirée."));
  const propre = await nettoyer(JPEG, "jpg");
  ok("jpg : fichier déjà propre inchangé", egaux(propre.octets, JPEG));
  const casse = await examiner(JPEG.subarray(0, 30), "jpg");
  ok("jpg : fichier tronqué sans exception", Array.isArray(casse.traces));
}

// ---------------------------------------------------------------- PNG
const tcrc = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = tcrc[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const be32 = (v: number) => new Uint8Array([v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255]);
const chunk = (type: string, d: Uint8Array) => concat(be32(d.length), texte(type), d, be32(crc32(concat(texte(type), d))));
const ihdr = chunk("IHDR", concat(be32(1), be32(1), new Uint8Array([8, 2, 0, 0, 0])));
const idat = chunk("IDAT", zlibSync(new Uint8Array([0, 255, 0, 0])));
const iend = chunk("IEND", new Uint8Array());
const png = concat(
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ihdr,
  chunk("tEXt", texte("Author\0Jeanne Martin")),
  chunk("iTXt", concat(texte("Description\0"), new Uint8Array([0, 0]), texte("fr\0Description\0Vacances à Laval"))),
  chunk("zTXt", concat(texte("Software\0"), new Uint8Array([0]), zlibSync(texte("Gimp 3")))),
  chunk("tIME", new Uint8Array([0x07, 0xe9, 3, 12, 14, 2, 33])),
  idat,
  iend,
);
{
  const ex = await examiner(png, "png");
  ok("png : auteur", trouve(ex.traces, "auteur")?.valeur === "Jeanne Martin" && trouve(ex.traces, "auteur")?.sensible === true);
  ok("png : description UTF-8", trouve(ex.traces, "description")?.valeur === "Vacances à Laval", trouve(ex.traces, "description")?.valeur);
  ok("png : zTXt décompressé", trouve(ex.traces, "logiciel")?.valeur === "Gimp 3");
  ok("png : tIME", trouve(ex.traces, "modifie")?.valeur === "12/03/2025 14:02", trouve(ex.traces, "modifie")?.valeur);
  const r = await nettoyer(png, "png");
  ok("png : nettoyé = signature + IHDR + IDAT + IEND", egaux(r.octets, concat(png.subarray(0, 8), ihdr, idat, iend)));
  ok("png : 4 traces retirées", r.retirees === 4, String(r.retirees));
}

// ---------------------------------------------------------------- WebP
const le32 = (v: number) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
const rchunk = (id: string, d: Uint8Array) => concat(texte(id), le32(d.length), d, d.length & 1 ? new Uint8Array(1) : new Uint8Array());
{
  const vp8x = rchunk("VP8X", concat(new Uint8Array([0x08 | 0x04 | 0x10, 0, 0, 0]), new Uint8Array([0, 0, 0, 0, 0, 0])));
  const exifB = new Uint8Array([...texte("Exif\0\0"), ...tiffExif()]);
  const img = rchunk("VP8L", new Uint8Array([0x2f, 0, 0, 0, 0, 1, 2]));
  const corps = concat(texte("WEBP"), vp8x, img, rchunk("EXIF", exifB), rchunk("XMP ", texte(xmpTxt)));
  const webp = concat(texte("RIFF"), le32(corps.length), corps);
  const ex = await examiner(webp, "webp");
  ok("webp : Exif et XMP lus", trouve(ex.traces, "appareil")?.valeur === "Canon" && !!trouve(ex.traces, "xmp") && !!trouve(ex.traces, "gps"));
  const r = await nettoyer(webp, "webp");
  const s = latin(r.octets);
  ok("webp : chunks EXIF et XMP retirés", !s.includes("EXIF") && !s.includes("XMP ") && !s.includes("Canon"));
  ok("webp : drapeaux effacés (reste 0x10)", r.octets[20] === 0x10, String(r.octets[20]));
  ok("webp : taille RIFF correcte", r.octets[4] + (r.octets[5] << 8) + (r.octets[6] << 16) === r.octets.length - 8);
  ok("webp : image intacte", s.includes(latin(img)));
}

// ---------------------------------------------------------------- MP3
{
  const sync = (v: number) => new Uint8Array([(v >> 21) & 127, (v >> 14) & 127, (v >> 7) & 127, v & 127]);
  const trame = (id: string, d: Uint8Array) => concat(texte(id), be32(d.length), new Uint8Array(2), d);
  const frames = concat(
    trame("TIT2", concat(new Uint8Array([3]), texte("Ma chanson"))),
    trame("TPE1", concat(new Uint8Array([1, 0xff, 0xfe]), new Uint8Array(Array.from("Léa", (c) => [c.charCodeAt(0), 0]).flat()))),
    trame("COMM", concat(new Uint8Array([3]), texte("fra\0Enregistré chez moi"))),
    trame("APIC", new Uint8Array(2048)),
  );
  const id3 = concat(texte("ID3"), new Uint8Array([3, 0, 0]), sync(frames.length + 100), frames, new Uint8Array(100));
  const mpeg = concat(...[0, 1, 2, 3].map((i) => new Uint8Array([0xff, 0xfb, 0x90, 0x00, i, i, i, i])));
  const v1 = new Uint8Array(128);
  v1.set(texte("TAG"), 0);
  v1.set(texte("Ancien titre"), 3);
  const mp3 = concat(id3, mpeg, v1);
  const ex = await examiner(mp3, "mp3");
  ok("mp3 : titre", trouve(ex.traces, "titre")?.valeur === "Ma chanson");
  ok("mp3 : artiste UTF-16", trouve(ex.traces, "artiste")?.valeur === "Léa", trouve(ex.traces, "artiste")?.valeur);
  ok("mp3 : commentaire", trouve(ex.traces, "commentaire")?.valeur === "Enregistré chez moi", trouve(ex.traces, "commentaire")?.valeur);
  ok("mp3 : pochette", !!trouve(ex.traces, "pochette"));
  const r = await nettoyer(mp3, "mp3");
  ok("mp3 : étiquettes retirées, trames identiques", egaux(r.octets, mpeg));
  const ape = concat(mpeg, texte("APETAGEX"), le32(2000), le32(32), le32(0), le32(0), new Uint8Array(8));
  ok("mp3 : étiquette APE détectée", !!trouve((await examiner(ape, "mp3")).traces, "ape"));
  ok("mp3 : étiquette APE retirée", egaux((await nettoyer(ape, "mp3")).octets, mpeg));
}

// ---------------------------------------------------------------- PDF
{
  const doc = await PDFDocument.create();
  doc.addPage();
  doc.addPage();
  doc.setAuthor("Jeanne Martin");
  doc.setTitle("Secret");
  doc.setProducer("MonLogiciel");
  doc.setCreator("Éditeur");
  doc.setKeywords(["a", "b"]);
  const flux = doc.context.stream(texte("<x:xmpmeta>auteur</x:xmpmeta>"), { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(flux));
  const pdf = await doc.save();
  const ex = await examiner(pdf, "pdf");
  ok("pdf : auteur sensible", trouve(ex.traces, "author")?.valeur === "Jeanne Martin" && trouve(ex.traces, "author")?.sensible === true, JSON.stringify(ex.traces));
  ok("pdf : titre, producteur, créé avec", trouve(ex.traces, "title")?.valeur === "Secret" && trouve(ex.traces, "producer")?.valeur === "MonLogiciel" && trouve(ex.traces, "creator")?.valeur === "Éditeur");
  ok("pdf : date de création lisible", /^\d\d\/\d\d\/\d{4} \d\d:\d\d$/.test(trouve(ex.traces, "creationdate")?.valeur ?? ""));
  ok("pdf : XMP signalé", !!trouve(ex.traces, "xmp"));
  const r = await nettoyer(pdf, "pdf");
  const relu = await PDFDocument.load(r.octets, { updateMetadata: false });
  ok("pdf : plus d'auteur ni de titre", !relu.getAuthor() && !relu.getTitle());
  ok("pdf : plus de producteur ni de créateur", !relu.getProducer() && !relu.getCreator() && !relu.getKeywords());
  ok("pdf : plus de Metadata au catalogue", !relu.catalog.has(PDFName.of("Metadata")));
  ok("pdf : mêmes pages", relu.getPageCount() === 2);
  ok("pdf : rien de sensible dans les octets", !latin(r.octets).includes("Jeanne") && !latin(r.octets).includes("MonLogiciel") && !latin(r.octets).includes("Secret"));
  const apres = await examiner(r.octets, "pdf");
  ok("pdf : examen du résultat vide", apres.traces.length === 0, JSON.stringify(apres.traces));

  const d2 = await PDFDocument.create();
  d2.addPage();
  d2.setAuthor("Quelqu'un");
  d2.encrypt({ userPassword: "", ownerPassword: "x", permissions: { printing: false } as never });
  const restreint = await d2.save();
  ok("pdf restreint : chiffré en entrée", latin(restreint).includes("/Encrypt"));
  const ex2 = await examiner(restreint, "pdf");
  ok("pdf restreint : examiné", ex2.nettoyable && trouve(ex2.traces, "author")?.valeur === "Quelqu'un", JSON.stringify(ex2));
  const r2 = await nettoyer(restreint, "pdf");
  const relu2 = await PDFDocument.load(r2.octets, { updateMetadata: false });
  ok("pdf restreint : sortie sans chiffrement", !relu2.isEncrypted && !latin(r2.octets).includes("/Encrypt") && relu2.getPageCount() === 1);

  const d3 = await PDFDocument.create();
  d3.addPage();
  d3.encrypt({ userPassword: "abc", ownerPassword: "abc" });
  const verrouille = await d3.save();
  const ex3 = await examiner(verrouille, "pdf");
  ok("pdf protégé : non nettoyable avec explication", !ex3.nettoyable && ex3.remarques[0].includes("mot de passe"));
  let nomErr = "";
  try {
    await nettoyer(verrouille, "pdf");
  } catch (err) {
    nomErr = (err as Error).name;
  }
  ok("pdf protégé : PdfProtege levée", nomErr === "PdfProtege", nomErr);
}

// ---------------------------------------------------------------- DOCX
const dateZip = (o: Uint8Array) => ({ methode: o[8] | (o[9] << 8), nom: latin(o.subarray(30, 30 + (o[26] | (o[27] << 8)))) });
{
  const doc = '<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:p><w:ins w:id="1"><w:r><w:t>Salut</w:t></w:r></w:ins></w:p></w:body></w:document>';
  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:creator>Jeanne Martin</dc:creator><cp:lastModifiedBy>Paul Durand</cp:lastModifiedBy><cp:revision>7</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2025-03-12T14:02:33Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2025-03-13T09:15:00Z</dcterms:modified></cp:coreProperties>';
  const app = '<?xml version="1.0"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Template>Normal.dotm</Template><TotalTime>205</TotalTime><Application>Microsoft Office Word</Application><Company>ACME SARL</Company><AppVersion>16.0000</AppVersion></Properties>';
  const comments = '<w:comments xmlns:w="x"><w:comment w:id="0" w:author="Paul"><w:p/></w:comment><w:comment w:id="1" w:author="Jeanne"><w:p/></w:comment></w:comments>';
  const docx = zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "_rels/.rels": strToU8("<Relationships/>"),
    "word/document.xml": strToU8(doc),
    "word/comments.xml": strToU8(comments),
    "docProps/core.xml": strToU8(core),
    "docProps/app.xml": strToU8(app),
  });
  const ex = await examiner(docx, "docx");
  ok("docx : auteur et dernier modificateur sensibles", trouve(ex.traces, "auteur")?.sensible === true && trouve(ex.traces, "derniere-modification-par")?.valeur === "Paul Durand");
  ok("docx : dates françaises", trouve(ex.traces, "cree")?.valeur === "12/03/2025 14:02" && trouve(ex.traces, "modifie")?.valeur === "13/03/2025 09:15");
  ok("docx : société sensible, temps d'édition", trouve(ex.traces, "societe")?.valeur === "ACME SARL" && trouve(ex.traces, "temps")?.valeur === "3 h 25 min", trouve(ex.traces, "temps")?.valeur);
  ok("docx : révisions et modèle", trouve(ex.traces, "revision")?.valeur === "7" && trouve(ex.traces, "modele")?.valeur === "Normal.dotm");
  ok("docx : remarque commentaires (2)", ex.remarques.some((r) => r.includes("2 commentaires")), JSON.stringify(ex.remarques));
  ok("docx : remarque modifications suivies", ex.remarques.some((r) => r.includes("modifications suivies")));
  const r = await nettoyer(docx, "docx");
  const z = unzipSync(r.octets);
  const c2 = strFromU8(z["docProps/core.xml"]);
  const a2 = strFromU8(z["docProps/app.xml"]);
  ok("docx : core.xml sans auteur ni dates", !c2.includes("creator") && !c2.includes("lastModifiedBy") && !c2.includes("2025") && c2.includes("cp:coreProperties") && c2.includes("xmlns:dc="));
  ok("docx : app.xml sans société, temps ni modèle", !a2.includes("Company") && !a2.includes("TotalTime") && !a2.includes("Template") && a2.includes("<Application>Microsoft Office Word</Application>"));
  ok("docx : document.xml identique", egaux(z["word/document.xml"], strToU8(doc)) && egaux(z["word/comments.xml"], strToU8(comments)));
  ok("docx : [Content_Types].xml en premier", dateZip(r.octets).nom === "[Content_Types].xml");
  ok("docx : même liste de fichiers", Object.keys(z).join() === Object.keys(unzipSync(docx)).join());
  ok("docx : examen du résultat sans traces sensibles", !(await examiner(r.octets, "docx")).traces.some((t) => t.sensible));
}

// ---------------------------------------------------------------- ODT
{
  const meta = '<?xml version="1.0" encoding="UTF-8"?>\n<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.3"><office:meta><meta:initial-creator>Jeanne Martin</meta:initial-creator><dc:creator>Paul Durand</dc:creator><meta:creation-date>2025-03-12T14:02:33.1</meta:creation-date><meta:editing-duration>PT3H25M10S</meta:editing-duration><meta:editing-cycles>4</meta:editing-cycles><meta:generator>LibreOffice/7.6</meta:generator><meta:user-defined meta:name="Projet">Alpha</meta:user-defined></office:meta></office:document-meta>';
  const content = "<office:document-content>Bonjour</office:document-content>";
  const odt = zipSync({
    mimetype: [texte("application/vnd.oasis.opendocument.text"), { level: 0 }],
    "content.xml": strToU8(content),
    "meta.xml": strToU8(meta),
  });
  const ex = await examiner(odt, "odt");
  ok("odt : auteur initial et dernier modificateur", trouve(ex.traces, "auteur-initial")?.sensible === true && trouve(ex.traces, "derniere-modification-par")?.valeur === "Paul Durand");
  ok("odt : durée d'édition lisible", trouve(ex.traces, "duree")?.valeur === "3 h 25 min", trouve(ex.traces, "duree")?.valeur);
  ok("odt : générateur, date, propriété perso", trouve(ex.traces, "generateur")?.valeur === "LibreOffice/7.6" && trouve(ex.traces, "cree")?.valeur === "12/03/2025 14:02" && trouve(ex.traces, "perso-Projet")?.valeur === "Alpha");
  const r = await nettoyer(odt, "odt");
  const z = unzipSync(r.octets);
  const m2 = strFromU8(z["meta.xml"]);
  ok("odt : meta.xml vidé", m2.includes("<office:meta/>") && !m2.includes("Jeanne") && m2.includes('office:version="1.3"') && m2.includes("xmlns:meta="));
  const e0 = dateZip(r.octets);
  ok("odt : mimetype premier et stocké", e0.nom === "mimetype" && e0.methode === 0, JSON.stringify(e0));
  ok("odt : contenu intact", strFromU8(z["content.xml"]) === content && strFromU8(z["mimetype"]) === "application/vnd.oasis.opendocument.text");
}

// ---------------------------------------------------------------- divers
{
  const ex = await examiner(texte("bonjour"), "txt");
  ok("format inconnu : non nettoyable", !ex.nettoyable && ex.traces.length === 0 && ex.remarques.length === 1);
  let leve = false;
  try {
    await nettoyer(texte("bonjour"), "txt");
  } catch (err) {
    leve = (err as Error).message.includes("n'est pas pris en charge");
  }
  ok("format inconnu : nettoyer lève une erreur française", leve);
  ok("formats annoncés", FORMATS_NETTOYABLES.length === 11 && FORMATS_NETTOYABLES.includes("odp"));
  const abime = await examiner(texte("n'importe quoi"), "pdf");
  ok("fichier abîmé : pas d'exception, non nettoyable", !abime.nettoyable);
  const zipAbime = await examiner(texte("PK pas un zip"), "docx");
  ok("zip abîmé : pas d'exception", !zipAbime.nettoyable && zipAbime.remarques.length > 0);
}

console.log(`\n${n} vérifications, ${e} échec(s)`);
process.exit(e ? 1 : 0);
