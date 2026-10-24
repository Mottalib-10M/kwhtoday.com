/** Props der Rechner beim Build : nur die Tage und Reihen, die der Rechner braucht (nie die ganzen Dateien). */
import { markt, letzteTage, negativeJeTag, EUR_PLN, CBS } from './engine/markt';
import type { Zone } from './engine/tarif';
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
