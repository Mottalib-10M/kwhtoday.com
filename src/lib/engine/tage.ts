/**
 * Tage mit Viertelstundenpreisen, wie sie die Rechner im Browser bekommen (als Props, nie die ganzen Dateien).
 * Ein Tag = Kalendertag Europe/Berlin (alle fünf Zonen leben in MEZ/MESZ) ; 92, 96 oder 100 Viertelstunden.
 */
import { jourLocal, heureLocale, QUART_MS, type Creneau } from './quarts';

export interface Tag { d: string; t0: number; v: number[] }

export const serieAus = (tage: Tag[]): Creneau[] => tage.flatMap((t) => t.v.map((v, i) => [t.t0 + i * QUART_MS, v] as Creneau));

/**
 * Zerlegt die Reihe in Kalendertage. Ein Tag mit einer Lücke (zwei Zeitstempel, die nicht genau
 * 15 Minuten auseinanderliegen) wird verworfen : sonst rutschen alle folgenden Preise um eine
 * Viertelstunde nach vorn, weil ein Tag nur t0 und die Werte speichert.
 */
export function tageAus(serie: Creneau[]): Tag[] {
  const m = new Map<string, Tag & { last: number; luecke: boolean }>();
  for (const [ts, v] of [...serie].sort((a, b) => a[0] - b[0])) {
    const d = jourLocal(ts);
    const t = m.get(d);
    if (!t) m.set(d, { d, t0: ts, v: [v], last: ts, luecke: false });
    else {
      if (ts - t.last !== QUART_MS) t.luecke = true;
      t.v.push(v);
      t.last = ts;
    }
  }
  return [...m.values()].filter((t) => !t.luecke).map(({ d, t0, v }) => ({ d, t0, v })).sort((a, b) => a.d.localeCompare(b.d));
}

/**
 * Ein Tag ist vollständig, wenn er um 00:00 beginnt, genau 92, 96 oder 100 Viertelstunden hat
 * und die letzte um 23:45 liegt (also so viele, wie der Tag nach Sommer- oder Winterzeit hat).
 */
export const vollstaendig = (t: Tag) =>
  heureLocale(t.t0) === '00:00' && [92, 96, 100].includes(t.v.length) && heureLocale(t.t0 + (t.v.length - 1) * QUART_MS) === '23:45' && jourLocal(t.t0 + (t.v.length - 1) * QUART_MS) === t.d;

export function addTage(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return x.toISOString().slice(0, 10);
}

/** Tag `iso` aus der Liste, oder null. */
export const tagVon = (tage: Tag[], iso: string) => tage.find((t) => t.d === iso) ?? null;

/** Index der Viertelstunde, in der `ts` liegt (oder -1). */
export function viertelIndex(t: Tag, ts: number): number {
  const i = Math.floor((ts - t.t0) / QUART_MS);
  return i >= 0 && i < t.v.length ? i : -1;
}

export const mittel = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

/** Beispielprofile des Tagesverbrauchs (Gewichte je Stunde 0–23, keine Messung). */
export type Profil = 'flach' | 'abend' | 'nacht' | 'mittag';
/** Beispielprofile (24 Gewichte je Stunde). Keine Messwerte : Annahmen, als solche beschriftet. */
export const PROFILE: Record<Profil, number[]> = {
  flach: Array(24).fill(1),
  abend: Array.from({ length: 24 }, (_, h) => (h >= 17 && h < 22 ? 3 : h >= 7 && h < 17 ? 1 : 0.5)),
  nacht: Array.from({ length: 24 }, (_, h) => (h < 6 ? 4 : h >= 22 ? 2 : 0.6)),
  mittag: Array.from({ length: 24 }, (_, h) => (h >= 10 && h < 16 ? 3 : 0.7)),
};
