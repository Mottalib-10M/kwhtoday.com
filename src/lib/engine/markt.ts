/**
 * Marktdaten beim Build (nur Astro-Seiten und Texte, nie im Browser importieren : fünf Dateien à 150–190 kB).
 * Quelle : Bundesnetzagentur | SMARD.de, CC BY 4.0, geladen von scripts/update-data.mjs.
 */
import de from '../../data/prices/DE-LU.json';
import nl from '../../data/prices/NL.json';
import at from '../../data/prices/AT.json';
import be from '../../data/prices/BE.json';
import pl from '../../data/prices/PL.json';
import fx from '../../data/fx-eur-pln.json';
import cbs from '../../data/cbs-nl.json';
import meta from '../../data/meta.json';
import { jourLocal, stats, type Creneau } from './quarts';
import { tageAus, vollstaendig, mittel, type Tag } from './tage';
import type { Zone } from './tarif';

interface Roh { quarterHours: Creneau[]; daily: Creneau[]; monthly: Creneau[]; last: string; retrieved: string }
const ROH: Record<Zone, Roh> = { 'DE-LU': de as Roh, NL: nl as Roh, AT: at as Roh, BE: be as Roh, PL: pl as Roh };

export interface Markt {
  zone: Zone;
  /** Vollständige Tage, ältester zuerst (etwa 42). */
  tage: Tag[];
  /** Tagesmittel EUR/MWh, [Datum, Wert], etwa 14 Monate. */
  tagesmittel: Array<[string, number]>;
  /** Monatsmittel EUR/MWh, [JJJJ-MM, Wert], ganze Reihe seit 2018. */
  monate: Array<[string, number]>;
  /** Letzter veröffentlichter Tag. */
  letzterTag: string;
  /** Zeitpunkt des Abrufs (ISO). */
  abgerufen: string;
}

const cache = new Map<Zone, Markt>();
export function markt(zone: Zone): Markt {
  const c = cache.get(zone);
  if (c) return c;
  const r = ROH[zone];
  const tage = tageAus(r.quarterHours).filter(vollstaendig);
  const tagesmittel = r.daily.filter(([, v]) => v != null).map(([ts, v]) => [jourLocal(ts), v] as [string, number]).slice(-430);
  const monate = r.monthly.filter(([, v]) => v != null).map(([ts, v]) => [jourLocal(ts).slice(0, 7), v] as [string, number]);
  // SMARD veröffentlicht das Monatsmittel mit Verzögerung : fehlende ganze Monate aus den Tagesmitteln ergänzen.
  const proMonat = new Map<string, number[]>();
  for (const [d, v] of tagesmittel) (proMonat.get(d.slice(0, 7)) ?? proMonat.set(d.slice(0, 7), []).get(d.slice(0, 7))!).push(v);
  const letzterVoll = tage.at(-1)!.d;
  for (const [m, v] of proMonat) {
    const tageImMonat = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)).getUTCDate();
    if (v.length === tageImMonat && !monate.some(([k]) => k === m) && `${m}-${tageImMonat}` <= letzterVoll) monate.push([m, mittel(v)]);
  }
  monate.sort((a, b) => a[0].localeCompare(b[0]));
  const m: Markt = { zone, tage, tagesmittel, monate, letzterTag: tage.at(-1)!.d, abgerufen: r.retrieved };
  cache.set(zone, m);
  return m;
}

/** Die letzten `n` Tage (für die Props eines Rechners). */
export const letzteTage = (zone: Zone, n: number) => markt(zone).tage.slice(-n);

export const EUR_PLN = fx as { latest: { date: string; value: number }; source: string; sourceUrl: string };
export const CBS = cbs as {
  laatste: string; sourceUrl: string;
  maanden: Array<{ maand: string; incl: Record<string, number | null>; excl: Record<string, number | null> }>;
};
export const META = meta as { retrieved: string };

/** Kennzahlen eines Tages (EUR/MWh) : Mittel, Min, Max, negative Viertelstunden. */
export function kennzahlen(zone: Zone, d: string) {
  const t = markt(zone).tage.find((x) => x.d === d);
  if (!t) return null;
  const s = stats(t.v.map((v, i) => [t.t0 + i * 900000, v] as Creneau));
  return { ...s, tag: t };
}

/** Negative Viertelstunden je Tag im ganzen Fenster. */
export function negativeJeTag(zone: Zone) {
  return markt(zone).tage.map((t) => ({ d: t.d, n: t.v.filter((v) => v < 0).length, min: Math.min(...t.v) }));
}
export { mittel };
