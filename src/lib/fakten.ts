/**
 * Kennzahlen für die Seitentexte, beim Build aus den SMARD-Reihen gerechnet (nie fest im Text) :
 * letzter veröffentlichter Tag, Mittel der letzten 30 Tage, Monatsmittel, negative Viertelstunden, Spreizung.
 * Alle Börsenwerte in EUR/MWh ; Endpreise in ct/kWh brutto über tarif.preisFn.
 */
import { markt, negativeJeTag } from './engine/markt';
import { stats, moyennesHoraires, heureLocale, QUART_MS, type Creneau } from './engine/quarts';
import { preisFn, type Zone, type Eingaben } from './engine/tarif';
import { mittel, type Tag } from './engine/tage';
import { P } from './engine/params';

const serieVon = (t: Tag): Creneau[] => t.v.map((v, i) => [t.t0 + i * QUART_MS, v] as Creneau);

export function tagFakten(t: Tag) {
  const s = stats(serieVon(t));
  const h = moyennesHoraires(serieVon(t));
  const billig = h.reduce((a, b) => (b.moyenne < a.moyenne ? b : a));
  const teuer = h.reduce((a, b) => (b.moyenne > a.moyenne ? b : a));
  return { d: t.d, n: s.n, mittel: s.moyenne, min: s.min, max: s.max, minUhr: heureLocale(s.tsMin), maxUhr: heureLocale(s.tsMax), negativ: s.negatifs,
    billigH: billig.heure, billigWert: billig.moyenne, teuerH: teuer.heure, teuerWert: teuer.moyenne, spreizung: s.max - s.min };
}

/** Der zuletzt veröffentlichte vollständige Tag (oft schon morgen). */
export const letzter = (z: Zone) => tagFakten(markt(z).tage.at(-1)!);
/** Der vorletzte (heute, wenn morgen schon da ist). */
export const vorletzter = (z: Zone) => tagFakten(markt(z).tage.at(-2)!);

/** Die letzten n vollständigen Tage im Fenster. */
export function fenster(z: Zone, n = 30) {
  const tage = markt(z).tage.slice(-n);
  const f = tage.map(tagFakten);
  const neg = negativeJeTag(z).slice(-n);
  const alle = tage.flatMap((t) => t.v);
  // Stundenmittel über das Fenster : 24 Werte, Index = Stunde Ortszeit
  const proStunde = Array.from({ length: 24 }, () => [] as number[]);
  for (const t of tage) for (const x of moyennesHoraires(serieVon(t))) proStunde[Number(x.heure.slice(0, 2))].push(x.moyenne);
  const stunde = proStunde.map((v) => (v.length ? mittel(v) : NaN));
  const billigsteStunde = stunde.indexOf(Math.min(...stunde.filter((x) => !Number.isNaN(x))));
  const teuersteStunde = stunde.indexOf(Math.max(...stunde.filter((x) => !Number.isNaN(x))));
  return {
    n: tage.length, von: tage[0].d, bis: tage.at(-1)!.d,
    mittel: mittel(alle),
    spreizung: mittel(f.map((x) => x.spreizung)),
    min: Math.min(...f.map((x) => x.min)), max: Math.max(...f.map((x) => x.max)),
    negativViertel: neg.reduce((s, x) => s + x.n, 0), negativTage: neg.filter((x) => x.n > 0).length,
    stunde, billigsteStunde, teuersteStunde,
  };
}

/** Monatsmittel : der letzte vollständige Monat und derselbe Monat ein Jahr davor. */
export function monate(z: Zone) {
  const m = markt(z).monate;
  const heute = markt(z).letzterTag.slice(0, 7);
  const voll = m.filter(([k]) => k < heute);
  const letzt = voll.at(-1)!;
  const vorjahr = m.find(([k]) => k === `${Number(letzt[0].slice(0, 4)) - 1}${letzt[0].slice(4)}`) ?? null;
  const jahr = (y: string) => { const v = m.filter(([k]) => k.startsWith(y)).map(([, x]) => x); return v.length === 12 ? mittel(v) : null; };
  return { letzt, vorjahr, alle: m, jahr };
}

/** Endpreis brutto (ct/kWh) mit den Standardannahmen der Rechner : DE Bundesmittel Netz, Gemeinde bis 100 000, Aufschlag a. */
export const endDe = (spot: number, aufschlag = 0) => preisFn('DE-LU', { aufschlag, netz: P.de.netzentgelt2025_ct.DE, gemeinde: 'bis100000' } as Eingaben)(spot);
export const endNl = (spot: number, aufschlag = 0) => preisFn('NL', { aufschlag } as Eingaben)(spot);

/** Dynamisch gegen Festpreis auf den letzten 30 vollständigen Tagen (wie der Vergleichsrechner). */
import { dynamiqueContreFixe } from './engine/quarts';
import { serieAus, PROFILE, type Profil } from './engine/tage';
const vcache = new Map<string, ReturnType<typeof vergleichRoh>>();
export function vergleich30(z: Zone, e: Eingaben, fest: number, kwhJahr: number, profil: Profil = 'flach') {
  const k = JSON.stringify([z, e, fest, kwhJahr, profil]);
  if (!vcache.has(k)) vcache.set(k, vergleichRoh(z, e, fest, kwhJahr, profil));
  return vcache.get(k)!;
}
function vergleichRoh(z: Zone, e: Eingaben, fest: number, kwhJahr: number, profil: Profil) {
  const tage = markt(z).tage.slice(-30);
  const r = dynamiqueContreFixe({ serie: serieAus(tage), kwhParJour: kwhJahr / 365, prixKwh: preisFn(z, e), fixeSousUniteKwh: fest, profil: PROFILE[profil] });
  return { ...r, jahr: r.jours ? (r.ecart * 365) / r.jours : 0, von: tage[0].d, bis: tage.at(-1)!.d };
}
export const eDe = (aufschlag = 0): Eingaben => ({ aufschlag, netz: P.de.netzentgelt2025_ct.DE, gemeinde: 'bis100000' });
export const eNl = (aufschlag = 0): Eingaben => ({ aufschlag });

/** Der Tag `iso` (meist der Build-Tag), sonst der letzte veröffentlichte. */
export function tagAm(z: Zone, iso: string) {
  const t = markt(z).tage.find((x) => x.d === iso) ?? markt(z).tage.at(-1)!;
  return { f: tagFakten(t), t, stunden: moyennesHoraires(serieVon(t)) };
}

/** Günstigstes und teuerstes Fenster einer Laufzeit am letzten veröffentlichten Tag, Kosten für `kwh` mit Endpreis. */
import { meilleureFenetre, coutAppareil, recharge } from './engine/quarts';
export function fensterTag(z: Zone, dauerMin: number, kwh: number, e: Eingaben) {
  const t = markt(z).tage.at(-1)!;
  const serie = serieVon(t);
  const fn = preisFn(z, e);
  const b = meilleureFenetre(serie, dauerMin)!;
  const w = meilleureFenetre(serie.map(([ts, v]) => [ts, -v] as Creneau), dauerMin)!;
  const kb = coutAppareil({ serie, debutTs: b.debut, dureeMin: dauerMin, kwh, prixKwh: fn });
  const kw = coutAppareil({ serie, debutTs: w.debut, dureeMin: dauerMin, kwh, prixKwh: fn });
  return { d: t.d, billig: { ab: heureLocale(b.debut), bis: heureLocale(b.fin), kosten: kb.cout, preis: kb.prixMoyen }, teuer: { ab: heureLocale(w.debut), bis: heureLocale(w.fin), kosten: kw.cout, preis: kw.prixMoyen } };
}
export { recharge };
