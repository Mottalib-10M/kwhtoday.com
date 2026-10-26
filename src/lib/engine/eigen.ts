/**
 * Eigenerzeugung, Speicher und Netzentgelt : Saldering (NL, bis 31.12.2026), Einspeisevergütung (DE, EEG 2023),
 * Heimspeicher auf Stundenpreisen, § 14a EnWG Modul 1 gegen Modul 2, Stromkosten eines Geräts.
 * Alle Sätze kommen aus params-2026.json ; was vom Vertrag abhängt, gibt der Nutzer ein.
 */
import { P } from './params';
import { moyennesHoraires, QUART_MS, type Creneau } from './quarts';
import type { Tag } from './tage';

/* ---------------------------------------------------------------- Saldering (NL) */
export interface SalderingIn {
  /** Opwek per jaar, kWh. */ opwek: number;
  /** Deel van de opwek dat direct in huis verbruikt wordt, 0–1. */ direct: number;
  /** Jaarverbruik van het huis, kWh. */ verbruik: number;
  /** Stroomprijs per kWh incl. energiebelasting en btw, cent. */ prijsIncl: number;
  /** Terugleververgoeding per kWh, cent. */ vergoeding: number;
  /** Terugleverkosten per teruggeleverde kWh, cent. */ kosten: number;
}
export function saldering(x: SalderingIn) {
  const directKwh = Math.max(0, x.opwek) * Math.min(Math.max(x.direct, 0), 1);
  const terug = Math.max(0, x.opwek - directKwh);
  const afname = Math.max(0, x.verbruik - directKwh);
  const gesaldeerd = Math.min(terug, afname);
  const overschot = terug - gesaldeerd;
  const kostenEur = (terug * x.kosten) / 100;
  // Tot en met 2026 : gesaldeerde kWh tegen de volle prijs, het overschot tegen de vergoeding.
  const waarde2026 = (gesaldeerd * x.prijsIncl + overschot * x.vergoeding) / 100 - kostenEur;
  // Vanaf 2027 : alle teruggeleverde kWh tegen de vergoeding.
  const waarde2027 = (terug * x.vergoeding) / 100 - kostenEur;
  const directWaarde = (directKwh * x.prijsIncl) / 100;
  return { directKwh, terug, afname, gesaldeerd, overschot, waarde2026, waarde2027, verlies: waarde2026 - waarde2027, directWaarde };
}
/** Wettelijke ondergrens van de vergoeding tot 1.1.2030 : aandeel van de kale leveringsprijs (excl. EB en btw). */
export const minVergoeding = (kaleCt: number) => kaleCt * P.nl.saldering.min_vergoeding_aandeel;

/* ---------------------------------------------------------------- Einspeisevergütung (DE) */
export type Einspeiseart = 'teil' | 'voll';
/** Anteiliger Satz einer Gebäudeanlage (ct/kWh) : die ersten 10 kW, die nächsten 30 kW, der Rest bis 100 kW. */
export function einspeiseSatz(kwp: number, art: Einspeiseart): number {
  const s = P.de.einspeiseverguetung_ct[art];
  const p = Math.min(Math.max(kwp, 0.01), 100);
  const a = Math.min(p, 10), b = Math.min(Math.max(p - 10, 0), 30), c = Math.max(p - 40, 0);
  return (a * s.bis10 + b * s.bis40 + c * s.bis100) / p;
}
export function einspeisung(o: { kwp: number; ertrag: number; art: Einspeiseart; eigen: number; preisCt: number }) {
  const erzeugt = Math.max(0, o.kwp) * Math.max(0, o.ertrag);
  const eigenAnteil = o.art === 'voll' ? 0 : Math.min(Math.max(o.eigen, 0), 1);
  const eigenKwh = erzeugt * eigenAnteil;
  const eingespeist = erzeugt - eigenKwh;
  const satz = einspeiseSatz(o.kwp, o.art);
  const verguetung = (eingespeist * satz) / 100;
  const ersparnis = (eigenKwh * Math.max(0, o.preisCt)) / 100;
  return { erzeugt, eigenKwh, eingespeist, satz, verguetung, ersparnis, summe: verguetung + ersparnis, ueber100: o.kwp > 100 };
}

/* ---------------------------------------------------------------- Heimspeicher auf Stundenpreisen */
/**
 * Ein Zyklus je Tag : laden im günstigsten Block von `stunden` Stunden, entladen in den eigenen Verbrauch im
 * teuersten Block, der erst nach dem Laden beginnt. Gewinn = kWh × Wirkungsgrad × Preis teuer − kWh × Preis günstig ;
 * ein Tag ohne Gewinn wird nicht gefahren. `preis` macht aus dem Börsenpreis (EUR/MWh) den Endpreis (ct/kWh).
 */
export function speicherTag(t: Tag, kwh: number, kw: number, wirkung: number, preis: (spot: number) => number) {
  const h = moyennesHoraires(t.v.map((v, i) => [t.t0 + i * QUART_MS, v] as Creneau)).map((x) => preis(x.moyenne));
  const n = Math.min(Math.max(1, Math.ceil(kwh / Math.max(kw, 0.1))), 12);
  const block = (i: number) => h.slice(i, i + n).reduce((s, x) => s + x, 0) / n;
  let best = { gewinn: 0, laden: -1, entladen: -1, billig: NaN, teuer: NaN };
  for (let i = 0; i + n <= h.length; i++) {
    const b = block(i);
    for (let j = i + n; j + n <= h.length; j++) {
      const e = block(j);
      const g = (kwh * wirkung * e - kwh * b) / 100;
      if (g > best.gewinn) best = { gewinn: g, laden: i, entladen: j, billig: b, teuer: e };
    }
  }
  return { d: t.d, ...best, stunden: n };
}
export function speicher(tage: Tag[], o: { kwh: number; kw: number; wirkung: number; preis: (spot: number) => number; kosten: number }) {
  const t = tage.map((x) => speicherTag(x, Math.max(o.kwh, 0), o.kw, Math.min(Math.max(o.wirkung, 0.5), 1), o.preis));
  const summe = t.reduce((s, x) => s + x.gewinn, 0);
  const n = t.length || 1;
  const jahr = (summe * 365) / n;
  const gefahren = t.filter((x) => x.gewinn > 0).length;
  const bester = t.reduce((a, b) => (b.gewinn > a.gewinn ? b : a), t[0]);
  return { tage: t, summe, jahr, gefahren, n: t.length, bester, amortisation: jahr > 0 ? o.kosten / jahr : Infinity };
}

/* ---------------------------------------------------------------- § 14a EnWG */
export function modul14a(o: { kwh: number; arbeitspreis: number; pauschale: number; zaehler: number }) {
  const ust = 1 + P.de.ust;
  const modul1 = Math.max(0, o.pauschale);
  const modul2 = (Math.max(0, o.kwh) * Math.max(0, o.arbeitspreis) * (1 - P.de.p14a.modul2_restfaktor) * ust) / 100 - Math.max(0, o.zaehler);
  return { modul1, modul2, besser: modul2 > modul1 ? 2 : 1, abstand: Math.abs(modul2 - modul1) };
}

/* ---------------------------------------------------------------- Stromkosten */
export function stromkosten(o: { kwhJahr: number; preisCt: number; grundMonat: number }) {
  const arbeit = (Math.max(0, o.kwhJahr) * Math.max(0, o.preisCt)) / 100;
  const grund = Math.max(0, o.grundMonat) * 12;
  const jahr = arbeit + grund;
  return { arbeit, grund, jahr, monat: jahr / 12, tag: jahr / 365 };
}
export const geraetKwh = (watt: number, stundenTag: number, tageJahr: number) => (Math.max(0, watt) / 1000) * Math.max(0, stundenTag) * Math.max(0, tageJahr);
