/**
 * Eine Seite = EINE Datei in `src/content/outils/` (CONTRIBUTING-SEITEN.md). Sie trägt ihre Sprachen
 * (Englisch immer ; Deutsch und/oder Niederländisch, wo diese Leser suchen), Text, FAQ, Quellen, Rechner und
 * Verweise ; der Kern (Routen, Menüs, Fußzeile, Sitemap, hreflang, Schemas) liest sie selbst.
 */
import type { SourceKey, Params, Lang } from './engine/params';
import type { Zone } from './engine/tarif';
export type { Lang };
export type Group = 'preise' | 'tarif' | 'nutzen' | 'laender' | 'gas';
/** Rechner am Kopf der Seite (components/outils/Strom.tsx). */
export type Tool = 'preis' | 'morgen' | 'jetzt' | 'fenster' | 'laden' | 'vergleich' | 'verlauf' | 'negativ' | 'gas';
export interface FAQ { q: string; a: string }

/** Schreibwerkzeuge für den Seitentext : Links, Zahlen im Format der Sprache, Motor, Marktdaten. */
export interface Helpers {
  lang: Lang;
  /** Text der Sprache der Seite, Reihenfolge immer de, en, nl. */
  T: <A>(de: A, en: A, nl: A) => A;
  /** Interner Link auf eine Seite (id) ; fehlt sie in dieser Sprache, nur der Text. */
  a: (id: string, text: string) => string;
  eur: (n: number, decimals?: number) => string;
  num: (n: number, decimals?: number) => string;
  pct: (x: number, decimals?: number) => string;
  /** Cent je kWh (« 23,4 ct/kWh ») ; `d` Nachkommastellen (1). */
  ct: (n: number, d?: number) => string;
  /** Börsenpreis EUR/MWh als ct/kWh. */
  spot: (eurMwh: number, d?: number) => string;
  date: (iso: string) => string;
  /** Monat « Oktober 2026 ». */
  monat: (yyyymm: string) => string;
  table: (headers: string[], rows: Array<Array<string | number>>, caption?: string, align?: Array<'l' | 'r'>) => string;
  src: (key: SourceKey, text?: string) => string;
  P: Params;
  M: typeof import('./engine/index');
  /** Marktdaten beim Build (SMARD, CBS, EZB). */
  K: typeof import('./engine/markt');
  /** Tag des Builds (Berliner Zeit). */
  today: string;
}

export interface PageText {
  slug: string;
  nav: string;
  card: string;
  /** 50 bis 60 Zeichen, Suchbegriff vorn, Jahr enthalten (RECETTE §11). */
  title: string;
  /** 150 bis 160 Zeichen. */
  description: string;
  h1: string;
  intro: string;
  /** Zitierfähiger Block : EIN Absatz mit mindestens 120 Wörtern (RECETTE §21). */
  resume: (h: Helpers) => string;
  faqs: (h: Helpers) => FAQ[];
  body: (h: Helpers) => string;
}

export interface PageDef {
  id: string;
  group: Group;
  order: number;
  tool: Tool;
  /** Preiszone des Rechners ; je Sprache verschieden möglich (de : DE-LU, nl : NL, en : …). */
  zone: Zone | Partial<Record<Lang, Zone>>;
  /** Weitere Zonen in der Auswahlliste des Rechners (nur Preis-, Fenster-, Lade-, Verlaufsrechner). */
  zonen?: Zone[] | Partial<Record<Lang, Zone[]>>;
  /** Vorgaben des Rechners (Laufzeit, kWh, Akku, Festpreis, Ansicht…). */
  toolProps?: Record<string, unknown>;
  related: string[];
  sources: SourceKey[];
  de?: PageText;
  en: PageText;
  nl?: PageText;
}
export const defineGuide = (g: PageDef): PageDef => g;
export const zoneOf = (p: Pick<PageDef, 'zone'>, lang: Lang): Zone => (typeof p.zone === 'string' ? p.zone : p.zone[lang] ?? p.zone.en ?? 'DE-LU');
export const zonenOf = (p: Pick<PageDef, 'zone' | 'zonen'>, lang: Lang): Zone[] => {
  const z = zoneOf(p, lang);
  const extra = !p.zonen ? [] : Array.isArray(p.zonen) ? p.zonen : p.zonen[lang] ?? [];
  return [z, ...extra.filter((x) => x !== z)];
};
