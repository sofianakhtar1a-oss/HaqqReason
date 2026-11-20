"use client";

import type { Editor } from "@tiptap/core";
import { Node as NoeudPM } from "@tiptap/pm/model";
import { Step } from "@tiptap/pm/transform";
import { fichiersCites, lireFichierLocal, rangerFichierRecu } from "@/lib/atelier/depot";
import type { MetaPartage, MonRole, Presence } from "@/lib/atelier/partage-commun";
import { EVENEMENT_FICHIER_RECU } from "../VuesLocales";
import { CLE_COLLAB, META_DISTANT, aEnvoyer, enAttente, pluginCollab, recevoir, versionCollab } from "./collab";
import { CLE_CURSEURS } from "./curseurs";

/*
 * Le Calame — la liaison d'un document partagé avec le serveur, tant qu'il est ouvert : elle envoie
 * nos changements, reçoit ceux des autres et leurs curseurs, échange les images, et dit où elle en est.
 * Elle interroge le serveur plus souvent quand quelqu'un d'autre écrit, moins quand on est seul ou
 * que l'onglet est caché.
 */

export type EtatLiaison = {
  etat: "connexion" | "a-jour" | "envoi" | "hors-ligne" | "arrete";
  role: MonRole | null;
  meta: MetaPartage | null;
  moi: string | null;
  presences: Presence[];
  message: string | null;
  version: number;
  attente: number;
};

type Options = {
  /** S'il restait des changements à envoyer au dernier enregistrement de cette copie. */
  attenteLocale: boolean;
  /** Garder la copie locale avant de la remplacer par le texte partagé (elle avait des changements non envoyés). */
  surCopieLocale: (contenu: unknown) => void;
  /** Le rôle, le titre et la mise en page du document partagé (à l'ouverture). */
  surOuverture: (o: { role: MonRole; meta: MetaPartage; reglages: unknown }) => void;
  /** Des mots écrits par les autres (pour ne pas les compter dans mon journal). */
  surMotsDistants: (delta: number) => void;
  /** Le partage s'arrête pour moi (retiré, ou arrêté par le propriétaire). */
  surFin: (message: string) => void;
};

class Arret extends Error {}

const INITIAL: EtatLiaison = { etat: "connexion", role: null, meta: null, moi: null, presences: [], message: null, version: 0, attente: 0 };

const motsDe = (doc: NoeudPM) => doc.textBetween(0, doc.content.size, " ", " ").split(/\s+/).filter(Boolean).length;

export class LiaisonPartage {
  private etatCourant: EtatLiaison = INITIAL;
  private abonnes = new Set<() => void>();
  private minuteur: ReturnType<typeof setTimeout> | undefined;
  private prochain = 0;
  private fini = false;
  private occupe = false;
  private echecs = 0;
  private readonly client = Math.floor(Math.random() * 0x7fffffff);
  private derniereSelection = "";
  private selectionQuand = 0;
  private deposes = new Set<string>();
  private absents = new Set<string>();
  private fichiersQuand = 0;
  private versionBase = 0;
  private baseEnvoi = 0;

  constructor(
    private readonly editor: Editor,
    private readonly id: string,
    private readonly options: Options,
  ) {}

  // ------------------------------------------------------------ pour React (useSyncExternalStore)
  abonner = (f: () => void) => {
    this.abonnes.add(f);
    return () => this.abonnes.delete(f);
  };
  lire = () => this.etatCourant;
  private changer(suite: Partial<EtatLiaison>) {
    this.etatCourant = { ...this.etatCourant, ...suite, attente: enAttente(this.editor.state) };
    for (const f of this.abonnes) f();
  }

  // ------------------------------------------------------------ le cycle
  async demarrer(): Promise<void> {
    this.editor.on("transaction", this.surTransaction);
    document.addEventListener("visibilitychange", this.surVisibilite);
    try {
      await this.charger(true);
      this.planifier(0);
    } catch (e) {
      if (e instanceof Arret) this.terminer(e.message);
      else {
        this.changer({ etat: "hors-ligne", message: "Hors ligne : le texte partagé se mettra à jour au retour de la connexion." });
        this.planifier(5_000, true);
      }
    }
  }

  arreter() {
    this.fini = true;
    clearTimeout(this.minuteur);
    this.editor.off("transaction", this.surTransaction);
    document.removeEventListener("visibilitychange", this.surVisibilite);
    if (!this.editor.isDestroyed) {
      this.editor.unregisterPlugin(CLE_COLLAB);
      this.editor.view.dispatch(this.editor.state.tr.setMeta(CLE_CURSEURS, []).setMeta("addToHistory", false));
    }
  }

  /** Des changements attendent d'être envoyés ? (avant de fermer la page) */
  enAttente(): boolean {
    return !this.fini && !this.editor.isDestroyed && enAttente(this.editor.state) > 0;
  }

  private surTransaction = ({ transaction }: { transaction: { docChanged: boolean; selectionSet: boolean; getMeta: (k: string) => unknown } }) => {
    if (this.fini) return;
    if (transaction.docChanged && !transaction.getMeta(META_DISTANT)) this.planifier(350);
    else if (transaction.selectionSet) this.planifier(900);
  };

  private surVisibilite = () => {
    if (!document.hidden) this.planifier(0);
  };

  private planifier(ms: number, force = false) {
    if (this.fini) return;
    const quand = Date.now() + ms;
    if (!force && this.minuteur && this.prochain <= quand) return;
    clearTimeout(this.minuteur);
    this.prochain = quand;
    this.minuteur = setTimeout(() => {
      this.minuteur = undefined;
      void this.tour();
    }, ms);
  }

  private delai(): number {
    if (this.echecs > 0) return Math.min(30_000, 2_000 * 2 ** Math.min(this.echecs, 4));
    if (enAttente(this.editor.state) > 0) return 600;
    if (document.hidden) return 15_000;
    const autres = this.etatCourant.presences.some((p) => Date.now() - p.quand < 15_000);
    return autres ? 1_200 : 3_500;
  }

  private async tour() {
    if (this.fini || this.occupe || this.editor.isDestroyed) return;
    this.occupe = true;
    try {
      if (versionCollab(this.editor.state) === null) await this.charger(false);
      if (aEnvoyer(this.editor.state)) await this.envoyer();
      await this.recevoir();
      if (Date.now() - this.fichiersQuand > 12_000) await this.fichiers();
      await this.peutEtreBase();
      this.echecs = 0;
      this.changer({ etat: enAttente(this.editor.state) ? "envoi" : "a-jour", message: null, version: versionCollab(this.editor.state) ?? 0 });
    } catch (e) {
      if (e instanceof Arret) {
        this.occupe = false;
        this.terminer(e.message);
        return;
      }
      this.echecs++;
      this.changer({ etat: "hors-ligne", message: "Hors ligne : tes changements partiront au retour de la connexion." });
    }
    this.occupe = false;
    this.planifier(this.delai(), true);
  }

  private terminer(message: string) {
    this.arreter();
    this.changer({ etat: "arrete", message });
    this.options.surFin(message);
  }

  private async lireReponse(r: Response): Promise<Record<string, unknown>> {
    if (r.status === 401) throw new Arret("Ta session a pris fin : reconnecte-toi pour écrire à plusieurs.");
    if (r.status === 404) throw new Arret("Ce partage a été arrêté : ta copie reste à toi.");
    if (r.status === 403) throw new Arret("Ce document n'est plus partagé avec toi : ta copie reste à toi.");
    const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok && r.status !== 409) throw new Error(String(d.erreur ?? r.status));
    return d;
  }

  // ------------------------------------------------------------ ouvrir : le texte partagé fait foi
  private async charger(premiere: boolean) {
    const d = (await this.lireReponse(await fetch(`/api/calame/partages/${this.id}`, { cache: "no-store" }))) as {
      meta: MetaPartage;
      role: MonRole;
      moi: string;
      base: { version: number; contenu: unknown; reglages: unknown };
      pas: unknown[];
      clients: number[];
      version: number;
      fichiers: string[];
    };
    const schema = this.editor.schema;
    let doc = NoeudPM.fromJSON(schema, d.base.contenu);
    for (const j of d.pas) {
      const r = Step.fromJSON(schema, j as never).apply(doc);
      if (!r.doc) throw new Error("Changement illisible");
      doc = r.doc;
    }
    if (this.editor.isDestroyed || this.fini) return;
    const ici = this.editor.state.doc;
    // Des changements faits ici n'étaient jamais partis : la copie est gardée dans les versions.
    if (premiere && this.options.attenteLocale && !ici.eq(doc)) this.options.surCopieLocale(this.editor.getJSON());
    const enAttenteIci = !premiere ? aEnvoyer(this.editor.state) : null;
    if (enAttenteIci) this.options.surCopieLocale(this.editor.getJSON());
    this.editor.unregisterPlugin(CLE_COLLAB);
    if (!this.editor.state.doc.eq(doc)) {
      const tr = this.editor.state.tr.replaceWith(0, this.editor.state.doc.content.size, doc.content);
      this.editor.view.dispatch(tr.setMeta("addToHistory", false).setMeta(META_DISTANT, true));
    }
    this.editor.registerPlugin(pluginCollab(d.version, this.client));
    this.deposes = new Set(d.fichiers);
    this.versionBase = d.base.version;
    if (this.editor.isEditable !== (d.role !== "lecture")) this.editor.setEditable(d.role !== "lecture", false);
    this.options.surOuverture({ role: d.role, meta: d.meta, reglages: d.base.reglages });
    this.changer({ etat: "a-jour", role: d.role, meta: d.meta, moi: d.moi, version: d.version, message: null });
  }

  // ------------------------------------------------------------ envoyer, recevoir
  private async envoyer() {
    const s = aEnvoyer(this.editor.state);
    if (!s) return;
    this.changer({ etat: "envoi" });
    const r = await fetch(`/api/calame/partages/${this.id}/pas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: s.version, pas: s.pas.map((p) => p.toJSON()), client: s.client }),
    });
    if (r.status === 403) {
      // Le propriétaire m'a passé en lecture : je ne peux plus envoyer.
      this.options.surCopieLocale(this.editor.getJSON());
      throw new Arret("Ce document t'est maintenant partagé en lecture seule : tes derniers changements sont gardés dans les versions.");
    }
    await this.lireReponse(r);
    // 409 : d'autres ont écrit avant nous ; recevoir() rejoue nos changements par-dessus, puis on renvoie.
  }

  private async recevoir() {
    const state = this.editor.state;
    const version = versionCollab(state);
    if (version === null) return;
    let adresse = `/api/calame/partages/${this.id}/pas?depuis=${version}&client=${this.client}`;
    const { from, to } = state.selection;
    const cle = `${from}:${to}`;
    if (cle !== this.derniereSelection || Date.now() - this.selectionQuand > 12_000) {
      adresse += `&de=${from}&a=${to}`;
      this.derniereSelection = cle;
      this.selectionQuand = Date.now();
    }
    const d = (await this.lireReponse(await fetch(adresse, { cache: "no-store" }))) as { pas?: unknown[]; clients?: number[]; presences?: Presence[]; recharger?: boolean; role?: MonRole; meta?: MetaPartage };
    // Le propriétaire a changé mon rôle, ou la liste des membres, ou rendu la copie : on suit.
    if (d.meta && d.meta.maj !== this.etatCourant.meta?.maj) this.changer({ meta: d.meta });
    if (d.role && d.role !== this.etatCourant.role) {
      this.changer({ role: d.role });
      if (!this.editor.isDestroyed && this.editor.isEditable !== (d.role !== "lecture")) this.editor.setEditable(d.role !== "lecture", false);
    }
    if (d.recharger) {
      await this.charger(false);
      return;
    }
    if (this.editor.isDestroyed || this.fini) return;
    const pas = d.pas ?? [];
    if (pas.length && versionCollab(this.editor.state) === version) {
      const schema = this.editor.schema;
      let lus: Step[];
      try {
        lus = pas.map((j) => Step.fromJSON(schema, j as never));
      } catch {
        await this.charger(false);
        return;
      }
      const avant = motsDe(this.editor.state.doc);
      this.editor.view.dispatch(recevoir(this.editor.state, lus, d.clients ?? []));
      const delta = motsDe(this.editor.state.doc) - avant;
      if (delta) this.options.surMotsDistants(delta);
    }
    const presences = d.presences ?? [];
    this.changer({ presences });
    this.editor.view.dispatch(this.editor.state.tr.setMeta(CLE_CURSEURS, presences).setMeta("addToHistory", false));
  }

  // ------------------------------------------------------------ images et PDF
  private async fichiers() {
    this.fichiersQuand = Date.now();
    const contenu = this.editor.getJSON();
    const noms = new Map<string, string>();
    const visiter = (n: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }) => {
      if (n.attrs && typeof n.attrs.fichier === "string") noms.set(n.attrs.fichier, String(n.attrs.nom || n.attrs.alt || "fichier"));
      for (const c of n.content ?? []) visiter(c as typeof n);
    };
    visiter(contenu as never);
    const ecrit = this.etatCourant.role !== null && this.etatCourant.role !== "lecture";
    for (const id of fichiersCites(contenu)) {
      const local = await lireFichierLocal(id);
      if (local && !this.deposes.has(id) && ecrit) {
        const r = await fetch(`/api/calame/partages/${this.id}/fichiers/${id}`, { method: "PUT", headers: { "content-type": local.type || "application/octet-stream" }, body: local.blob });
        if (r.ok || r.status === 413) this.deposes.add(id);
      } else if (!local && this.deposes.has(id) && !this.absents.has(id)) {
        const r = await fetch(`/api/calame/partages/${this.id}/fichiers/${id}`);
        if (!r.ok) {
          this.absents.add(id);
          continue;
        }
        await rangerFichierRecu(id, noms.get(id) ?? "fichier", await r.blob());
        window.dispatchEvent(new CustomEvent(EVENEMENT_FICHIER_RECU, { detail: id }));
      }
    }
  }

  // ------------------------------------------------------------ un point de départ récent
  private async peutEtreBase() {
    const version = versionCollab(this.editor.state);
    const role = this.etatCourant.role;
    if (version === null || !role || role === "lecture" || enAttente(this.editor.state) > 0) return;
    if (version - this.versionBase < 400 || Date.now() - this.baseEnvoi < 60_000) return;
    this.baseEnvoi = Date.now();
    const r = await fetch(`/api/calame/partages/${this.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "base", version, contenu: this.editor.getJSON(), titre: this.etatCourant.meta?.titre ?? "" }),
    });
    if (r.ok) this.versionBase = version;
  }
}
