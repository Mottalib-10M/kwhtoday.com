/**
 * Endpreis je kWh aus dem Day-Ahead-Preis (EUR/MWh), Land für Land. Alle Beträge in Cent (bzw. Groszy) je kWh.
 * Nur Bestandteile, die wir im Gesetz oder bei einer Behörde gelesen haben (params-2026.json), gehen fest ein ;
 * was vom Vertrag oder vom Netz abhängt (Aufschlag des Anbieters, Netzentgelt), gibt der Nutzer ein.
 * Österreich, Belgien, Polen : nur der Börsenpreis plus die eigene Eingabe « Zuschläge » (Steuern und Netz dort
 * nicht verifiziert, also nicht eingerechnet : das sagt die Seite).
 */
import { P } from './params';
import { spotEnSousUnite } from './prix';

export type Zone = 'DE-LU' | 'NL' | 'AT' | 'BE' | 'PL';
export const ZONES: Zone[] = ['DE-LU', 'NL', 'AT', 'BE', 'PL'];
export type Land = 'DE' | 'NL' | 'AT' | 'BE' | 'PL';
export const LAND_DER_ZONE: Record<Zone, Land> = { 'DE-LU': 'DE', NL: 'NL', AT: 'AT', BE: 'BE', PL: 'PL' };
export type Gemeinde = keyof typeof P.de.konzessionsabgabe_ct;
export type Bundesland = Exclude<keyof typeof P.de.netzentgelt2025_ct, '_quelle'>;
export const BUNDESLAENDER = (Object.keys(P.de.netzentgelt2025_ct) as string[]).filter((k) => k !== '_quelle') as Bundesland[];

export interface Eingaben {
  /** Aufschlag des Anbieters (Arbeitspreis über Börse), netto, ct/kWh. NL : inkoopvergoeding. */
  aufschlag: number;
  /** DE : Netzentgelt netto ct/kWh. */
  netz?: number;
  /** DE : Gemeindegröße für die Konzessionsabgabe. */
  gemeinde?: Gemeinde;
  /** AT, BE, PL : eigene Zuschläge (Netz, Steuern) brutto ct/kWh, vom Nutzer. */
  zuschlag?: number;
  /** PL : Złoty je Euro (EZB). */
  pln?: number;
}

export interface Zerlegung { boerse: number; teile: Array<{ k: string; ct: number }>; netto: number; steuer: number; brutto: number; vollstaendig: boolean }

/** Umlagen DE 2026 zusammen (KWKG, Offshore, besondere Netznutzung Kat. A). */
export const umlagenDe = () => P.de.umlagen_ct.kwkg + P.de.umlagen_ct.offshore + P.de.umlagen_ct.besondereNetznutzung;

export function zerlegen(zone: Zone, spotEurMwh: number, e: Eingaben): Zerlegung {
  const land = LAND_DER_ZONE[zone];
  if (land === 'DE') {
    const boerse = spotEnSousUnite(spotEurMwh);
    const teile = [
      { k: 'aufschlag', ct: e.aufschlag },
      { k: 'netz', ct: e.netz ?? P.de.netzentgelt2025_ct.DE },
      { k: 'stromsteuer', ct: P.de.stromsteuer_ct },
      { k: 'umlagen', ct: umlagenDe() },
      { k: 'konzession', ct: P.de.konzessionsabgabe_ct[e.gemeinde ?? 'bis100000'] },
    ];
    const netto = boerse + teile.reduce((s, t) => s + t.ct, 0);
    const steuer = netto * P.de.ust;
    return { boerse, teile, netto, steuer, brutto: netto + steuer, vollstaendig: true };
  }
  if (land === 'NL') {
    const boerse = spotEnSousUnite(spotEurMwh);
    const teile = [{ k: 'aufschlag', ct: e.aufschlag }, { k: 'eb', ct: P.nl.eb_stroom_eur_kwh * 100 }];
    const netto = boerse + teile.reduce((s, t) => s + t.ct, 0);
    const steuer = netto * P.nl.btw;
    return { boerse, teile, netto, steuer, brutto: netto + steuer, vollstaendig: true };
  }
  const boerse = spotEnSousUnite(spotEurMwh, land === 'PL' ? e.pln ?? 1 : 1);
  const z = e.zuschlag ?? 0;
  return { boerse, teile: [{ k: 'zuschlag', ct: z }], netto: boerse + z, steuer: 0, brutto: boerse + z, vollstaendig: false };
}

/** Preisfunktion für die Fenster-, Geräte- und Vergleichsrechnung : EUR/MWh → ct/kWh brutto. */
export const preisFn = (zone: Zone, e: Eingaben) => (spot: number) => zerlegen(zone, spot, e).brutto;

/** NL : jährliche Steuerermäßigung (vermindering energiebelasting) brutto, je Monat. */
export const verminderingMonat = () => (P.nl.vermindering_eur * (1 + P.nl.btw)) / 12;

/** NL Gas : Preis je m³ brutto aus dem Lieferpreis netto (€/m³). */
export function gasPrijs(leveringExcl: number): { levering: number; eb: number; netto: number; btw: number; totaal: number } {
  const eb = P.nl.eb_gas_eur_m3;
  const netto = leveringExcl + eb;
  const btw = netto * P.nl.btw;
  return { levering: leveringExcl, eb, netto, btw, totaal: netto + btw };
}
