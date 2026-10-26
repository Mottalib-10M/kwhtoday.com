import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { prixFinal, spotEnSousUnite, cout, fixeMensuel } from './prix';
import { stats, moyennesHoraires, meilleureFenetre, coutAppareil, recharge, dynamiqueContreFixe, jourLocal, heureLocale, creneauxDuJour, type Creneau } from './quarts';
import { zerlegen, umlagenDe, gasPrijs, verminderingMonat, preisFn } from './tarif';
import { tageAus, serieAus, vollstaendig, addTage } from './tage';
import { P as PAR } from './params';
import { markt, CBS } from './markt';

// Jour d'essai : 2026-10-21 (CEST, UTC+2) — minuit local = 22:00 UTC la veille.
const T0 = Date.UTC(2026, 9, 20, 22, 0);
const jour = (f: (i: number) => number, n = 96, t0 = T0): Creneau[] => Array.from({ length: n }, (_, i) => [t0 + i * 900000, f(i)]);

describe('prix final', () => {
  it('1 EUR/MWh = 0,1 ct/kWh ; change PLN', () => {
    expect(spotEnSousUnite(100)).toBeCloseTo(10, 9);
    expect(spotEnSousUnite(100, 4.3945)).toBeCloseTo(43.945, 9);
  });
  it('Pays-Bas : spot + inkoopvergoeding + energiebelasting 0,09161 €, puis 21 % de btw (Wbm art. 59, Wet OB art. 9)', () => {
    const z = zerlegen('NL', 100, { aufschlag: 2 });
    expect(z.netto).toBeCloseTo(10 + 2 + 9.161, 9);
    expect(z.brutto).toBeCloseTo(21.161 * 1.21, 9);
    expect(z.vollstaendig).toBe(true);
  });
  it('Allemagne : Stromsteuer 2,05 ct, Umlagen 2,946 ct, Konzessionsabgabe, 19 % USt', () => {
    expect(umlagenDe()).toBeCloseTo(2.946, 9);
    const z = zerlegen('DE-LU', 100, { aufschlag: 1.5, netz: 10, gemeinde: 'ueber500000' });
    expect(z.netto).toBeCloseTo(10 + 1.5 + 10 + 2.05 + 2.946 + 2.39, 9);
    expect(z.brutto).toBeCloseTo(z.netto * 1.19, 9);
    // valeur par défaut du réseau : moyenne nationale 2025 du Monitoringbericht (10,72 ct)
    expect(zerlegen('DE-LU', 0, { aufschlag: 0 }).teile.find((t) => t.k === 'netz')!.ct).toBe(10.72);
  });
  it('Autriche, Belgique, Pologne : bourse + saisie, jamais de taxe inventée', () => {
    for (const z of ['AT', 'BE'] as const) {
      const r = zerlegen(z, 80, { aufschlag: 0, zuschlag: 12 });
      expect(r.brutto).toBeCloseTo(8 + 12, 9);
      expect(r.vollstaendig).toBe(false);
    }
    expect(zerlegen('PL', 100, { aufschlag: 0, pln: 4.3945 }).boerse).toBeCloseTo(43.945, 9);
  });
  it('gaz NL : levering + EB 0,60066 €/m³, puis btw ; vermindering 519,80 € par an', () => {
    const g = gasPrijs(0.547);
    expect(g.netto).toBeCloseTo(1.14766, 9);
    expect(g.totaal).toBeCloseTo(1.14766 * 1.21, 9);
    expect(verminderingMonat()).toBeCloseTo((519.8 * 1.21) / 12, 9);
  });
  it('paramètres = valeurs lues dans les textes (2026)', () => {
    expect(PAR.de.stromsteuer_ct).toBe(2.05);
    expect(PAR.de.konzessionsabgabe_ct).toEqual({ bis25000: 1.32, bis100000: 1.59, bis500000: 1.99, ueber500000: 2.39 });
    expect(PAR.nl.eb_gas_eur_m3).toBe(0.60066);
    expect(PAR.de.netzentgelt2025_ct.HH).toBe(14.17);
    for (const s of Object.values(PAR.sources)) expect(s.url).toMatch(/^https:\/\//);
  });
  it('prix négatif : la taxe reste due', () => {
    const d = prixFinal({ spotEurMwh: -200, composantes: [{ cle: 'eb', sousUniteParKwh: 9.161 }], tva: 0.21 });
    expect(d.spot).toBeCloseTo(-20, 9);
    expect(d.total).toBeCloseTo((-20 + 9.161) * 1.21, 9);
  });
  it('refuse une TVA ou un spot invalides', () => {
    expect(() => prixFinal({ spotEurMwh: NaN, tva: 0.2 })).toThrow();
    expect(() => prixFinal({ spotEurMwh: 50, tva: 1.2 })).toThrow();
  });
  it('coût et part fixe', () => {
    expect(cout(2, 30)).toBeCloseTo(0.6, 9);
    expect(fixeMensuel(-519.8, 0.21)).toBeCloseTo((-519.8 * 1.21) / 12, 9);
  });
});

describe('quarts d’heure', () => {
  const s = jour((i) => (i >= 48 && i < 56 ? -5 : 80 + i));
  it('jour et heure locaux (Europe/Berlin)', () => {
    expect(jourLocal(T0)).toBe('2026-10-21');
    expect(heureLocale(T0)).toBe('00:00');
    expect(creneauxDuJour(s, '2026-10-21')).toHaveLength(96);
  });
  it('statistiques', () => {
    const st = stats(s);
    expect(st.n).toBe(96);
    expect(st.min).toBe(-5);
    expect(st.negatifs).toBe(8);
    expect(st.max).toBe(80 + 95);
    expect(heureLocale(st.tsMin)).toBe('12:00');
  });
  it('moyennes horaires : 24 heures', () => {
    const h = moyennesHoraires(s);
    expect(h).toHaveLength(24);
    expect(h[0].moyenne).toBeCloseTo(81.5, 9);
    expect(h[12].moyenne).toBe(-5);
  });
  it('meilleure fenêtre de 2 h = le creux de midi', () => {
    const f = meilleureFenetre(s, 120)!;
    expect(heureLocale(f.debut)).toBe('12:00');
    expect(f.moyenne).toBe(-5);
    expect(() => meilleureFenetre(s, 20)).toThrow();
    expect(meilleureFenetre(s.slice(0, 3), 60)).toBeNull();
  });
  it('fenêtre : un trou dans la série est évité', () => {
    const troue = s.filter((_, i) => i !== 50);
    const f = meilleureFenetre(troue, 60)!;
    expect(f.debut).toBe(s[51][0]);
  });
  it('coût d’un appareil au prorata des quarts d’heure', () => {
    const plat = jour(() => 100);
    const r = coutAppareil({ serie: plat, debutTs: T0 + 7 * 60000, dureeMin: 90, kwh: 1.5, prixKwh: (v) => v / 10 + 10 });
    expect(r.prixMoyen).toBeCloseTo(20, 9);
    expect(r.cout).toBeCloseTo(0.3, 9);
    expect(() => coutAppareil({ serie: plat, debutTs: T0 + 23.5 * 3600000, dureeMin: 60, kwh: 1, prixKwh: (v) => v })).toThrow();
  });
  it('recharge : pertes, durée au quart d’heure', () => {
    const r = recharge({ batterieKwh: 60, dePct: 20, aPct: 80, puissanceKw: 11, pertesPct: 10 });
    expect(r.kwhBatterie).toBeCloseTo(36, 9);
    expect(r.kwhReseau).toBeCloseTo(40, 9);
    expect(r.dureeMin).toBe(225); // 40/11 h = 218 min → 225
    expect(recharge({ batterieKwh: 60, dePct: 90, aPct: 20, puissanceKw: 11, pertesPct: 10 }).kwhReseau).toBe(0);
  });
  it('dynamique contre fixe sur deux jours complets', () => {
    const deux = [...jour(() => 100), ...jour(() => 200, 96, T0 + 86400000)];
    const r = dynamiqueContreFixe({ serie: deux, kwhParJour: 10, prixKwh: (v) => v / 10, fixeSousUniteKwh: 15 });
    expect(r.jours).toBe(2);
    expect(r.kwh).toBeCloseTo(20, 9);
    expect(r.coutDynamique).toBeCloseTo(3, 9);
    expect(r.coutFixe).toBeCloseTo(3, 9);
    expect(r.ecart).toBeCloseTo(0, 9);
  });
  it('jour de passage à l’heure d’hiver (25 octobre 2026) : 100 quarts d’heure', () => {
    const t = Date.UTC(2026, 9, 24, 22, 0);
    const s25 = jour(() => 50, 100, t);
    expect(creneauxDuJour(s25, '2026-10-25')).toHaveLength(100);
    expect(moyennesHoraires(s25)).toHaveLength(25);
  });
});

describe('données SMARD collectées', () => {
  for (const z of ['DE-LU', 'AT', 'NL', 'BE', 'PL']) {
    it(`${z} : au moins 28 jours de quarts d’heure, valeurs dans les limites SDAC`, () => {
      const d = JSON.parse(readFileSync(new URL(`../../data/prices/${z}.json`, import.meta.url), 'utf8'));
      expect(d.attribution).toContain('SMARD');
      expect(d.quarterHours.length).toBeGreaterThan(96 * 28);
      for (const [, v] of d.quarterHours) { expect(v).toBeGreaterThanOrEqual(-500); expect(v).toBeLessThanOrEqual(4000); }
    });
  }
});

describe('tage et marché', () => {
  it('tageAus / serieAus aller-retour, jour de 100 quarts', () => {
    const t = Date.UTC(2026, 9, 24, 22, 0);
    const s25: Creneau[] = Array.from({ length: 100 }, (_, i) => [t + i * 900000, i]);
    const tg = tageAus(s25);
    expect(tg).toHaveLength(1);
    expect(tg[0].d).toBe('2026-10-25');
    expect(vollstaendig(tg[0])).toBe(true);
    expect(serieAus(tg)).toEqual(s25);
    expect(addTage('2026-10-31', 1)).toBe('2026-11-01');
  });
  for (const z of ['DE-LU', 'NL', 'AT', 'BE', 'PL'] as const) {
    it(`${z} : jours complets récents et moyennes mensuelles`, () => {
      const m = markt(z);
      expect(m.tage.length).toBeGreaterThanOrEqual(28);
      expect(m.monate.length).toBeGreaterThan(24);
      expect(m.tage.every((t) => t.v.length >= 92 && t.v.length <= 100)).toBe(true);
    });
  }
  it('CBS : mois récents, incl. et excl. btw cohérents avec 21 %', () => {
    const last = CBS.maanden.at(-1)!;
    expect(last.incl.gasEb!).toBeCloseTo(last.excl.gasEb! * 1.21, 3);
    expect(last.excl.gasEb).toBeCloseTo(PAR.nl.eb_gas_eur_m3, 5);
    expect(last.excl.stroomEb).toBeCloseTo(PAR.nl.eb_stroom_eur_kwh, 5);
  });
  it('preisFn = zerlegen().brutto', () => {
    const f = preisFn('NL', { aufschlag: 1 });
    expect(f(50)).toBeCloseTo(zerlegen('NL', 50, { aufschlag: 1 }).brutto, 12);
  });
});

import { einspeiseSatz, saldering, modul14a } from './eigen';
describe('Eigenerzeugung (eigen.ts)', () => {
  it('Einspeisevergütung anteilig : 15 kWp Teileinspeisung = (10 × 7,70 + 5 × 6,66) / 15', () => {
    expect(einspeiseSatz(10, 'teil')).toBeCloseTo(7.7, 6);
    expect(einspeiseSatz(15, 'teil')).toBeCloseTo((10 * 7.7 + 5 * 6.66) / 15, 6);
    expect(einspeiseSatz(100, 'voll')).toBeCloseTo((10 * 12.22 + 90 * 10.24) / 100, 6);
  });
  it('Saldering : verlies = gesaldeerde kWh × (prijs − vergoeding)', () => {
    const r = saldering({ opwek: 3000, direct: 0.3, verbruik: 2500, prijsIncl: 26, vergoeding: 6, kosten: 0 });
    expect(r.terug).toBeCloseTo(2100, 6);
    expect(r.gesaldeerd).toBeCloseTo(1600, 6);
    expect(r.verlies).toBeCloseTo((1600 * 20) / 100, 6);
  });
  it('§ 14a : Modul 2 = kWh × AP × 60 % × 1,19 − Zähler', () => {
    const r = modul14a({ kwh: 4000, arbeitspreis: 10, pauschale: 150, zaehler: 20 });
    expect(r.modul2).toBeCloseTo((4000 * 10 * 0.6 * 1.19) / 100 - 20, 6);
    expect(r.besser).toBe(2);
  });
});
