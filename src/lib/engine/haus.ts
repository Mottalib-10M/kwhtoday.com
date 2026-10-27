/**
 * Rechner rund um Haus und Verbrauch : Balkonkraftwerk, Photovoltaik (DE und NL), Wärmepumpe gegen Gaskessel,
 * Gaskosten (DE), Gerätverbrauch, Haushaltsverbrauch, Energiebelasting (NL), Capaciteitstarief (Vlaanderen).
 * Sätze und Tabellen aus params-2026.json ; was vom Vertrag, vom Gerät oder vom Haus abhängt, gibt der Nutzer ein.
 */
import { P } from './params';
import { einspeisung, saldering, type Einspeiseart } from './eigen';

const pos = (x: number) => (Number.isFinite(x) ? Math.max(0, x) : 0);
const anteil = (x: number) => Math.min(Math.max(Number.isFinite(x) ? x : 0, 0), 1);
const jahre = (invest: number, proJahr: number) => (proJahr > 0 && invest > 0 ? invest / proJahr : invest <= 0 ? 0 : Infinity);

/* ---------------------------------------------------------------- Balkonkraftwerk */
export function balkon(o: { wp: number; ertrag: number; eigen: number; preisCt: number; kosten: number }) {
  const erzeugt = (pos(o.wp) / 1000) * pos(o.ertrag);
  const eigenKwh = erzeugt * anteil(o.eigen);
  const ersparnis = (eigenKwh * pos(o.preisCt)) / 100;
  return { erzeugt, eigenKwh, ueberschuss: erzeugt - eigenKwh, ersparnis, amortisation: jahre(pos(o.kosten), ersparnis), ueberWp: o.wp > P.de.steckersolar.wp_max };
}

/* ---------------------------------------------------------------- Photovoltaik */
export function pvDe(o: { kwp: number; ertrag: number; eigen: number; preisCt: number; art: Einspeiseart; kosten: number }) {
  const e = einspeisung({ kwp: o.kwp, ertrag: o.ertrag, art: o.art, eigen: o.eigen, preisCt: o.preisCt });
  return { ...e, amortisation: jahre(pos(o.kosten), e.summe), rendite: o.kosten > 0 ? e.summe / o.kosten : 0 };
}
export function pvNl(o: { kwp: number; ertrag: number; direct: number; verbruik: number; prijsIncl: number; vergoeding: number; terugleverkosten: number; kosten: number }) {
  const opwek = pos(o.kwp) * pos(o.ertrag);
  const s = saldering({ opwek, direct: o.direct, verbruik: o.verbruik, prijsIncl: o.prijsIncl, vergoeding: o.vergoeding, kosten: o.terugleverkosten });
  const jaar2026 = s.directWaarde + s.waarde2026;
  const jaar2027 = s.directWaarde + s.waarde2027;
  return { ...s, opwek, jaar2026, jaar2027, terugverdien: jahre(pos(o.kosten), jaar2027) };
}

/* ---------------------------------------------------------------- Wärmepumpe gegen Gaskessel */
/**
 * Heizwärme = Gasverbrauch (kWh Brennwert) × Kesselwirkungsgrad. Die Wärmepumpe liefert `anteil` davon mit der
 * Jahresarbeitszahl `jaz` ; den Rest liefert bei einer Hybridanlage weiter der Kessel. Grundpreis Gas entfällt nur,
 * wenn kein Gas mehr gebraucht wird.
 */
export function waermepumpe(o: { gasKwh: number; wirkungsgrad: number; jaz: number; anteil: number; stromCt: number; gasCt: number; gasGrundJahr: number; invest: number; foerderung: number }) {
  const waerme = pos(o.gasKwh) * anteil(o.wirkungsgrad);
  const a = anteil(o.anteil);
  const stromKwh = (waerme * a) / Math.max(o.jaz, 1);
  const restGasKwh = a >= 1 ? 0 : pos(o.gasKwh) * (1 - a);
  const kostenGas = (pos(o.gasKwh) * pos(o.gasCt)) / 100 + pos(o.gasGrundJahr);
  const kostenWp = (stromKwh * pos(o.stromCt)) / 100 + (restGasKwh * pos(o.gasCt)) / 100 + (restGasKwh > 0 ? pos(o.gasGrundJahr) : 0);
  const ersparnis = kostenGas - kostenWp;
  const netto = Math.max(0, pos(o.invest) - pos(o.foerderung));
  return { waerme, stromKwh, restGasKwh, kostenGas, kostenWp, ersparnis, netto, amortisation: jahre(netto, ersparnis) };
}
/** KfW-Heizungsförderung (BEG EM, ab 21.07.2026) : Grundförderung + Boni, gedeckelt (80 % bei Einkommen bis 30.000 €). */
export type Einkommen = 'nein' | 'bis30000' | 'bis40000' | 'bis50000';
export function kfw(o: { kosten: number; klima: boolean; einkommen: Einkommen }) {
  const k = P.de.kfw;
  const roh = k.grund + (o.klima ? k.klima : 0) + (o.einkommen === 'nein' ? 0 : k.einkommen[o.einkommen]);
  const deckel = o.einkommen === 'bis30000' ? k.max_niedrig : k.max;
  const satz = Math.min(roh, deckel);
  const basis = Math.min(pos(o.kosten), k.kosten_max);
  return { satz, basis, zuschuss: basis * satz, gedeckelt: roh > deckel };
}

/** ISDE 2026 (NL), lucht-waterwarmtepomp ook hybride : startbedrag + bedrag per kW + labelbonus, minimaal het minimum. */
export function isde(o: { kw: number; label: boolean }) {
  const i = P.nl.isde;
  return Math.max(i.minimum_eur, i.start_eur + pos(o.kw) * i.per_kw_eur + (o.label ? i.label_bonus_eur : 0));
}

/* ---------------------------------------------------------------- Gas (DE) */
/** m³ am Zähler → kWh : m³ × Brennwert × Zustandszahl (beide auf der Rechnung). */
export const gasKwh = (m3: number, brennwert: number, zustandszahl: number) => pos(m3) * pos(brennwert) * pos(zustandszahl);
export function gasDe(o: { kwh: number; arbeitspreisCt: number; grundMonat: number }) {
  const arbeit = (pos(o.kwh) * pos(o.arbeitspreisCt)) / 100;
  const grund = pos(o.grundMonat) * 12;
  const jahr = arbeit + grund;
  const g = P.de.gas;
  const ust = 1 + P.de.ust;
  const energiesteuer = (pos(o.kwh) * g.energiesteuer_ct * ust) / 100;
  const co2 = (pos(o.kwh) * co2Ct() * ust) / 100;
  return { arbeit, grund, jahr, monat: jahr / 12, energiesteuer, co2 };
}
/** CO₂-Preis (BEHG) je kWh Erdgas, netto, ct : €/t × t/MWh ÷ 10. */
export const co2Ct = (eurT = P.de.gas.co2_eur_t) => (eurT * P.de.gas.co2_t_mwh) / 10;

/* ---------------------------------------------------------------- Geräte */
/** Wasser erwärmen : Liter × ΔT × 1,163 Wh/(l·K) ÷ Wirkungsgrad. */
export const wasserKwh = (liter: number, deltaK: number, wirkungsgrad = 1) => (pos(liter) * pos(deltaK) * 1.163) / 1000 / Math.max(anteil(wirkungsgrad), 0.1);
export function geraet(o: { kwhJahr: number; preisCt: number; nutzungen: number }) {
  const kosten = (pos(o.kwhJahr) * pos(o.preisCt)) / 100;
  return { kwhJahr: pos(o.kwhJahr), kosten, monat: kosten / 12, jeNutzung: o.nutzungen > 0 ? pos(o.kwhJahr) / o.nutzungen : 0, kostenJeNutzung: o.nutzungen > 0 ? kosten / o.nutzungen : 0 };
}

/* ---------------------------------------------------------------- Energiebelasting (NL) */
type Schijf = { tot: number | null; tarief: number };
/** Belasting over een jaarverbruik volgens de schijven (tarief per eenheid, excl. btw). */
export function schijven(verbruik: number, tabel: Schijf[]) {
  let rest = pos(verbruik), onder = 0, som = 0;
  const regels: Array<{ van: number; tot: number | null; hoeveel: number; tarief: number; bedrag: number }> = [];
  for (const s of tabel) {
    const breedte = s.tot === null ? Infinity : s.tot - onder;
    const hoeveel = Math.min(rest, breedte);
    if (hoeveel > 0) regels.push({ van: onder, tot: s.tot, hoeveel, tarief: s.tarief, bedrag: hoeveel * s.tarief });
    som += hoeveel * s.tarief;
    rest -= hoeveel;
    if (s.tot === null || rest <= 0) break;
    onder = s.tot;
  }
  return { som, regels };
}
export function energiebelasting(o: { kwh: number; m3: number; vermindering: boolean }) {
  const e = P.nl.eb2026;
  const stroom = schijven(o.kwh, e.stroom);
  const gas = schijven(o.m3, e.gas);
  const verm = o.vermindering ? P.nl.vermindering_eur : 0;
  const excl = stroom.som + gas.som - verm;
  const btw = 1 + P.nl.btw;
  return { stroom, gas, vermindering: verm, excl, incl: excl * btw, maand: (excl * btw) / 12, stroomIncl: stroom.som * btw, gasIncl: gas.som * btw, verminderingIncl: verm * btw };
}

/* ---------------------------------------------------------------- Capaciteitstarief (Vlaanderen) */
export type Netgebied = keyof typeof P.be.capaciteit.netgebieden;
export const NETGEBIEDEN = Object.keys(P.be.capaciteit.netgebieden) as Netgebied[];
/** Distributienetkosten afname per jaar incl. btw : capaciteit (gemiddelde maandpiek, minimum 2,5 kW) + kWh-tarieven + databeheer. */
export function capaciteit(o: { gebied: Netgebied; piekKw: number; kwh: number }) {
  const c = P.be.capaciteit;
  const g = c.netgebieden[o.gebied];
  const btw = 1 + P.be.btw;
  const kw = Math.max(pos(o.piekKw), c.min_kw);
  const cap = kw * g.kw * btw;
  const kwhTarief = g.kwh.reduce((s, x) => s + x, 0);
  const afname = pos(o.kwh) * kwhTarief * btw;
  const data = c.databeheer_eur * btw;
  const totaal = cap + afname + data;
  return { kw, opMinimum: pos(o.piekKw) < c.min_kw, cap, afname, data, totaal, maand: totaal / 12, perKw: g.kw * btw, kwhTarief: kwhTarief * btw };
}
