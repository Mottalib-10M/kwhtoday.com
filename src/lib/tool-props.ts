/** Props der Rechner beim Build : nur die Tage und Reihen, die der Rechner braucht (nie die ganzen Dateien). */
import { markt, letzteTage, negativeJeTag, EUR_PLN, CBS } from './engine/markt';
import { preisFn, type Zone } from './engine/tarif';
import type { Tool } from './guide-types';
import { P } from './engine/params';

export function tageFuer(tool: Tool, zonen: Zone[]) {
  const n = tool === 'vergleich' ? 31 : 3;
  return Object.fromEntries((tool === 'vergleich' ? zonen.slice(0, 1) : zonen).map((z) => [z, letzteTage(z, n)]));
}
export function verlaufFuer(zonen: Zone[]) {
  return Object.fromEntries(zonen.map((z) => {
    const m = markt(z);
    return [z, { tagesmittel: m.tagesmittel.slice(-31), monate: m.monate.slice(-13), negativ: negativeJeTag(z) }];
  }));
}
export function cbsGas() {
  return CBS.maanden.slice(-13).map((m) => ({ maand: m.maand, levIncl: m.incl.gasVariabel as number, ebIncl: m.incl.gasEb as number, levExcl: m.excl.gasVariabel as number }));
}
/** Festpreis-Vorgabe des Vergleichs : DE Monitoringbericht (anderer Lieferant, 1.4.2025) ; NL CBS (variabel + EB, inkl. btw). */
export function festVorgabe(zone: Zone): number {
  if (zone === 'NL') { const m = CBS.maanden.at(-1)!; return Math.round(((m.incl.stroomVariabel as number) + (m.incl.stroomEb as number)) * 10000) / 100; }
  return P.de.haushaltspreise2025_ct.andererLieferant;
}
export const stand = (zone: Zone) => markt(zone).abgerufen;
export const PLN = EUR_PLN.latest.value;
/** NL : kale leveringsprijs variabel excl. btw en EB (CBS, laatste maand), ct/kWh. */
export const kaleNl = () => Math.round((CBS.maanden.at(-1)!.excl.stroomVariabel as number) * 10000) / 100;
/** DE : Endpreis beim Börsenmittel der letzten 30 Tage (Bundesmittel Netzentgelt, ohne Aufschlag), ct/kWh, 2 Stellen. */
export function preisDe30() {
  const tage = markt('DE-LU').tage.slice(-30);
  const alle = tage.flatMap((t) => t.v);
  const spot = alle.reduce((s, v) => s + v, 0) / alle.length;
  const preis = Math.round(preisFn('DE-LU', { aufschlag: 0, netz: P.de.netzentgelt2025_ct.DE, gemeinde: 'bis100000' })(spot) * 100) / 100;
  return { preisCt: preis, preis, von: tage[0].d, bis: tage.at(-1)!.d };
}
/** NL : gemiddelden van de laatste CBS-maand, incl. btw : stroom ct/kWh (variabel + EB), gas €/m³ (variabel + EB), vaste kosten per jaar. */
export function nlCbs() {
  const m = CBS.maanden.at(-1)!;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return {
    maand: m.maand,
    stroomCt: festVorgabe('NL'),
    gasM3: Math.round(((m.incl.gasVariabel as number) + (m.incl.gasEb as number)) * 1000) / 1000,
    gasVast: r2(m.incl.gasTransport as number),
    stroomVast: r2(m.incl.stroomTransport as number),
    vermindering: r2(-(m.incl.vermindering as number)),
  };
}
