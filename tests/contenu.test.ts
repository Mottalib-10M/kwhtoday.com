/**
 * Garde-fou du contenu (CONTRIBUTING-PAGES.md) : longueurs des titres et descriptions (RECETTE §11),
 * bloc citable (§21), FAQ (§7), nombre de mots, typographie de/en/nl. Tourne sans build.
 */
import { describe, it, expect } from 'vitest';
import { PAGES } from '../src/lib/guides';
import { HOME } from '../src/content/accueil';
import { helpers } from '../src/lib/helpers';
import type { Lang, PageText } from '../src/lib/guide-types';

const LANGS: Lang[] = ['de', 'en', 'nl'];
const txt = (html: string) => html.replace(/<\/?(a|strong|em|b|i|span)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s: string) => txt(s).split(' ').filter((w) => /[\p{L}\d]/u.test(w)).length;
const fragen = new Map<string, string>();

function pruefe(name: string, lang: Lang, x: Omit<PageText, 'slug' | 'nav' | 'card'>, home = false) {
  const h = helpers(lang);
  it(`${name} [${lang}] Titel 50–60, Beschreibung 150–160 Zeichen`, () => {
    expect(x.title.length, x.title).toBeGreaterThanOrEqual(50);
    expect(x.title.length, x.title).toBeLessThanOrEqual(60);
    expect(x.description.length, x.description).toBeGreaterThanOrEqual(150);
    expect(x.description.length, x.description).toBeLessThanOrEqual(160);
  });
  const resume = x.resume(h), faqs = x.faqs(h), body = x.body(h);
  it(`${name} [${lang}] Block ≥ 120 Wörter, ein Absatz`, () => {
    expect(words(resume)).toBeGreaterThanOrEqual(120);
    expect(resume).not.toMatch(/\n|<p|<br/);
  });
  it(`${name} [${lang}] FAQ ${home ? '6–8' : '3–5'}, Antworten 40–90 Wörter, Fragen nur einmal`, () => {
    expect(faqs.length).toBeGreaterThanOrEqual(home ? 6 : 3);
    expect(faqs.length).toBeLessThanOrEqual(home ? 8 : 5);
    for (const f of faqs) {
      const n = words(f.a);
      expect(n, `${f.q} (${n})`).toBeGreaterThanOrEqual(40);
      expect(n, `${f.q} (${n})`).toBeLessThanOrEqual(90);
      const k = f.q.toLowerCase().replace(/[^\p{L}\d]/gu, '');
      expect(fragen.get(k) ?? `${name}/${lang}`, `doppelte Frage : ${f.q}`).toBe(`${name}/${lang}`);
      fragen.set(k, `${name}/${lang}`);
    }
  });
  it(`${name} [${lang}] ≥ ${home ? 2000 : 500} Wörter`, () => {
    const n = words(resume) + words(body) + faqs.reduce((s, f) => s + words(f.q) + words(f.a), 0);
    expect(n).toBeGreaterThanOrEqual(home ? 2000 : 500);
  });
  it(`${name} [${lang}] Typografie : kein Leerzeichen vor : ; ? !, keine « »`, () => {
    const all = [x.title, x.description, x.h1, x.intro, resume, body, ...faqs.flatMap((f) => [f.q, f.a])].map(txt).join(' ');
    expect(all.match(/\S\s[:;?!](?=\s|$)/g) ?? []).toEqual([]);
    expect(all).not.toMatch(/[«»—]/);
    expect(all).not.toMatch(/NaN|undefined|Infinity|\[object/);
  });
}

describe('Startseiten', () => { for (const l of LANGS) pruefe('home', l, HOME[l], true); });
describe('Seiten', () => {
  for (const p of PAGES) for (const l of LANGS) { const x = p[l]; if (x) pruefe(p.id, l, x); }
  it('jede verwandte Seite existiert', () => {
    const ids = new Set(PAGES.map((p) => p.id));
    for (const p of PAGES) for (const r of p.related) expect(ids.has(r), `${p.id} → ${r}`).toBe(true);
  });
  it('Slugs eindeutig je Sprache', () => {
    for (const l of LANGS) { const s = PAGES.flatMap((p) => (p[l] ? [p[l]!.slug] : [])); expect(new Set(s).size).toBe(s.length); }
  });
});
