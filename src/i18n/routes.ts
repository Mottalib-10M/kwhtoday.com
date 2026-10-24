import { makeRouter, type RouteDef } from './routes-core';
import { PAGES } from '../lib/guides';
export const LOCALES = ['de', 'en', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';
const R = (id: string, de: string, en: string, nl: string, noindex = false): RouteDef<Locale> => ({ id, paths: { de: `/de/${de}/`, en: `/en/${en}/`, nl: `/nl/${nl}/` }, ...(noindex ? { noindex } : {}) });
/** Seiten des Kerns. Preis- und Tarifseiten kommen aus `src/content/outils/` (lib/guides.ts) ; eine Seite
 *  kann auf Deutsch oder Niederländisch fehlen (Österreich nur de + en, Gas und Belgien nur nl + en, Polen nur en). */
const CORE: RouteDef<Locale>[] = [
  { id: 'home', paths: { de: '/de/', en: '/en/', nl: '/nl/' } },
  R('method', 'methode', 'method', 'methode'),
  R('about', 'ueber-uns', 'about', 'over-ons'),
  R('widget', 'widget', 'widget', 'widget', true),
  R('contact', 'kontakt', 'contact', 'contact', true),
  R('editorial', 'redaktionelle-grundsaetze', 'editorial-policy', 'redactiestatuut', true),
  R('privacy', 'datenschutz', 'privacy', 'privacy', true),
  R('terms', 'impressum', 'legal-notice', 'colofon', true),
  R('cookies', 'cookies', 'cookies', 'cookies', true),
];
export const ROUTES: RouteDef<Locale>[] = [
  CORE[0],
  ...PAGES.map((p) => ({ id: p.id, paths: Object.fromEntries(LOCALES.filter((l) => p[l]).map((l) => [l, `/${l}/${p[l]!.slug}/`])) as Partial<Record<Locale, string>> })),
  ...CORE.slice(1),
];
const core = makeRouter(LOCALES, ROUTES);
export const { NOINDEX_PATHS, altPaths, hasRoute } = core;
/** Pfad einer Seite in einer Sprache ; fehlt die Übersetzung, die englische, dann die deutsche Fassung. */
export function route(id: string, lang: Locale): string {
  const r = ROUTES.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown route id: ${id}`);
  const p = r.paths[lang] ?? r.paths.en ?? r.paths.de;
  if (!p) throw new Error(`Route ${id} ohne Pfad`);
  return p;
}
