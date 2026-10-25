import { route, ROUTES, type Locale } from './routes';
import { PAGES, pageById, GROUPS } from '../lib/guides';
import type { Group } from '../lib/guide-types';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const CORE: Record<Locale, Record<string, string>> = {
  de: { home: 'Strompreis aktuell', method: 'Methode und Quellen', about: 'Über uns', widget: 'Rechner einbinden', contact: 'Kontakt', editorial: 'Redaktionelle Grundsätze', privacy: 'Datenschutz', terms: 'Impressum', cookies: 'Cookies' },
  en: { home: 'Electricity price today', method: 'Method and sources', about: 'About', widget: 'Embed the calculator', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies' },
  nl: { home: 'Stroomprijs vandaag', method: 'Methode en bronnen', about: 'Over ons', widget: 'Rekenhulp insluiten', contact: 'Contact', editorial: 'Redactiestatuut', privacy: 'Privacy', terms: 'Colofon', cookies: 'Cookies' },
};
const GROUP_LABEL: Record<Locale, Record<Group, string>> = {
  de: { preise: 'Preise heute und morgen', tarif: 'Dynamischer Tarif', nutzen: 'Günstig verbrauchen', laender: 'Länder', gas: 'Gas' },
  en: { preise: 'Prices today and tomorrow', tarif: 'Dynamic tariffs', nutzen: 'Use power cheaply', laender: 'Countries', gas: 'Gas' },
  nl: { preise: 'Prijzen vandaag en morgen', tarif: 'Dynamisch contract', nutzen: 'Slim verbruiken', laender: 'Landen', gas: 'Gas' },
};
const SITE: Record<Locale, string> = { de: 'Die Seite', en: 'Site', nl: 'De site' };
export const label = (id: string, lang: Locale) => CORE[lang][id] ?? pageById(id)?.[lang]?.nav ?? pageById(id)?.en.nav ?? id;
const has = (id: string, lang: Locale) => !!ROUTES.find((r) => r.id === id)?.paths[lang];
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
const inGroup = (g: Group, lang: Locale) => PAGES.filter((p) => p.group === g && p[lang]).sort((a, b) => a.order - b.order).map((p) => link(p.id, lang));
export function navCategories(lang: Locale): NavCategory[] {
  return GROUPS.map((g) => ({ label: GROUP_LABEL[lang][g], links: inGroup(g, lang) })).filter((c) => c.links.length);
}
// Methode : liee en bas de page, hors du menu du haut pour qu'il tienne sur une ligne.
export const navDirect = (_lang: Locale): NavLink[] => [];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang), { label: SITE[lang], links: ['home', 'method', 'about', 'contact', 'editorial', 'widget', 'terms', 'privacy', 'cookies'].filter((i) => has(i, lang)).map((i) => link(i, lang)) }];
export const popularLinks = (_lang: Locale): NavLink[] => [];
