// Robustesse des séries SMARD : une série à trous est rejetée (audit données 2026-10-24),
// un jour civil a exactement 92, 96 ou 100 quarts d'heure, la fraîcheur se contrôle.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pruefeSerie, trous, quartsParJour, frische } from '../scripts/serie-pruefen.mjs';
import { tageAus, vollstaendig } from '../src/lib/engine/tage';

type C = [number, number];
const Q = 900000;
// 7 jours entiers à partir du 2026-10-19 00:00 Berlin (22:00 UTC la veille), passage à l'heure d'hiver inclus le 25.
const T0 = Date.UTC(2026, 9, 18, 22, 0);
const serie = (n: number, t0 = T0): C[] => Array.from({ length: n }, (_, i) => [t0 + i * Q, 50 + (i % 96)]);
const SAINE = serie(96 * 6 + 100); // 19 au 25 octobre : 6 jours de 96 + le 25 à 100

describe('série SMARD : trous rejetés', () => {
  it('série saine (avec le jour de 100 quarts du 25 octobre) acceptée', () => {
    expect(trous(SAINE)).toEqual([]);
    expect(() => pruefeSerie('DE-LU', SAINE)).not.toThrow();
    expect(quartsParJour(SAINE)['2026-10-25'].n).toBe(100);
  });
  it('un quart d’heure manquant au milieu : série rejetée', () => {
    const trouee = SAINE.filter((_, i) => i !== 300);
    expect(trous(trouee)).toHaveLength(1);
    expect(trous(trouee)[0].minutes).toBe(30);
    expect(() => pruefeSerie('DE-LU', trouee)).toThrow(/trous/);
  });
  it('un doublon d’horodatage : série rejetée', () => {
    const double = [...SAINE.slice(0, 200), SAINE[199], ...SAINE.slice(200)] as C[];
    expect(() => pruefeSerie('AT', double)).toThrow(/trous/);
  });
  it('valeur hors limites SDAC ou non numérique : rejetée', () => {
    expect(() => pruefeSerie('NL', SAINE.map(([t, v], i) => [t, i === 10 ? 5000 : v]) as C[])).toThrow(/SDAC/);
    expect(() => pruefeSerie('NL', SAINE.map(([t, v], i) => [t, i === 10 ? NaN : v]) as C[])).toThrow(/invalide/);
  });
  it('moins de 7 jours : rejetée', () => {
    expect(() => pruefeSerie('PL', serie(96 * 3))).toThrow(/7 jours/);
  });
});

describe('découpage par jour : pas de décalage d’un quart d’heure', () => {
  it('un jour à trou est écarté au lieu de décaler les prix suivants', () => {
    const s = serie(96 * 2);
    const trouee = s.filter((_, i) => i !== 40); // trou le 19 octobre à 10:00
    const tg = tageAus(trouee);
    expect(tg.map((t) => t.d)).toEqual(['2026-10-20']);
    expect(tg[0].v).toEqual(s.slice(96).map(([, v]) => v));
  });
  it('vollstaendig : exactement 92, 96 ou 100 quarts, de 00:00 à 23:45', () => {
    const [j96] = tageAus(serie(96));
    expect(vollstaendig(j96)).toBe(true);
    expect(vollstaendig({ ...j96, v: j96.v.slice(0, 95) })).toBe(false);
    const [j100] = tageAus(serie(100, Date.UTC(2026, 9, 24, 22, 0)));
    expect(j100.d).toBe('2026-10-25');
    expect(vollstaendig(j100)).toBe(true);
    const [j92] = tageAus(serie(92, Date.UTC(2026, 2, 28, 23, 0))); // 29 mars 2026, heure d'été
    expect(j92.d).toBe('2026-03-29');
    expect(vollstaendig(j92)).toBe(true);
  });
});

describe('fraîcheur des prix', () => {
  const now = new Date('2026-10-24T16:00:00Z'); // 18:00 à Berlin
  it('prix du jour seulement après 14 h : lendemain signalé manquant', () => {
    const f = frische('2026-10-24T21:45:00Z', now);
    expect(f).toMatchObject({ dernierJour: '2026-10-24', aujourdhui: '2026-10-24', perime: false, lendemainManquant: true });
  });
  it('lendemain publié : rien à signaler', () => {
    expect(frische('2026-10-25T22:45:00Z', now)).toMatchObject({ dernierJour: '2026-10-25', perime: false, lendemainManquant: false });
  });
  it('dernier jour d’hier : prix périmés', () => {
    expect(frische('2026-10-23T21:45:00Z', now).perime).toBe(true);
  });
});

describe('données collectées : sans trou, jours exacts', () => {
  for (const z of ['DE-LU', 'AT', 'NL', 'BE', 'PL']) {
    it(`${z} : série continue, 92/96/100 quarts par jour complet`, () => {
      const d = JSON.parse(readFileSync(new URL(`../src/data/prices/${z}.json`, import.meta.url), 'utf8'));
      expect(trous(d.quarterHours)).toEqual([]);
      expect(() => pruefeSerie(z, d.quarterHours, { minJours: 28 })).not.toThrow();
    });
  }
  it('25 octobre 2026 : 02:00 à 02:45 apparaissent deux fois (heure d’été puis d’hiver)', () => {
    const d = JSON.parse(readFileSync(new URL('../src/data/prices/DE-LU.json', import.meta.url), 'utf8'));
    const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const j = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' });
    const jour = (d.quarterHours as C[]).filter(([t]) => j.format(new Date(t)) === '2026-10-25');
    if (jour.length === 0) return; // le 25 n'est plus dans la fenêtre de 42 jours
    expect(jour).toHaveLength(100);
    for (const q of ['02:00', '02:15', '02:30', '02:45']) expect(jour.filter(([t]) => h.format(new Date(t)) === q)).toHaveLength(2);
  });
});
