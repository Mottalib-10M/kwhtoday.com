// Travail sur la série des quarts d'heure day-ahead : [horodatage ms UTC, EUR/MWh].
// Les cinq zones (DE-LU, AT, NL, BE, PL) vivent à l'heure d'Europe centrale : un « jour »
// est un jour civil Europe/Berlin (23 ou 25 heures les jours de changement d'heure).

export type Creneau = [number, number];
export const QUART_MS = 15 * 60 * 1000;
export const FUSEAU = 'Europe/Berlin';

const fmtJour = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' });
const fmtHeure = new Intl.DateTimeFormat('en-GB', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function jourLocal(ts: number): string {
  return fmtJour.format(new Date(ts));
}
export function heureLocale(ts: number): string {
  return fmtHeure.format(new Date(ts));
}

export function creneauxDuJour(serie: Creneau[], jour: string): Creneau[] {
  return serie.filter(([ts]) => jourLocal(ts) === jour);
}

export function joursDisponibles(serie: Creneau[]): string[] {
  return [...new Set(serie.map(([ts]) => jourLocal(ts)))].sort();
}

export interface Stats {
  n: number;
  moyenne: number;
  min: number;
  max: number;
  tsMin: number;
  tsMax: number;
  negatifs: number; // nombre de quarts d'heure à prix négatif
}

export function stats(creneaux: Creneau[]): Stats {
  if (creneaux.length === 0) throw new Error('aucun créneau');
  let min = creneaux[0], max = creneaux[0], somme = 0, negatifs = 0;
  for (const c of creneaux) {
    somme += c[1];
    if (c[1] < min[1]) min = c;
    if (c[1] > max[1]) max = c;
    if (c[1] < 0) negatifs++;
  }
  return { n: creneaux.length, moyenne: somme / creneaux.length, min: min[1], max: max[1], tsMin: min[0], tsMax: max[0], negatifs };
}

/** Moyenne par heure civile (les 4 quarts d'heure d'une heure), dans l'ordre chronologique. */
export function moyennesHoraires(creneaux: Creneau[]): { ts: number; heure: string; moyenne: number }[] {
  const groupes = new Map<number, number[]>();
  for (const [ts, v] of creneaux) {
    const debut = ts - (ts % (60 * 60 * 1000)); // les heures CET/CEST tombent sur des heures pleines UTC
    (groupes.get(debut) ?? groupes.set(debut, []).get(debut)!).push(v);
  }
  return [...groupes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, vs]) => ({ ts, heure: heureLocale(ts), moyenne: vs.reduce((s, v) => s + v, 0) / vs.length }));
}

/**
 * Fenêtre continue la moins chère de `dureeMin` minutes (multiple de 15), démarrant sur un quart
 * d'heure, entre `depuisTs` (inclus) et la fin de la série. Retourne null si la série est trop courte
 * ou a un trou dans toutes les fenêtres possibles.
 */
export function meilleureFenetre(serie: Creneau[], dureeMin: number, depuisTs = -Infinity): { debut: number; fin: number; moyenne: number } | null {
  if (!(dureeMin > 0) || dureeMin % 15 !== 0) throw new Error('durée en multiples de 15 minutes');
  const k = dureeMin / 15;
  const s = serie.filter(([ts]) => ts >= depuisTs);
  let best: { debut: number; fin: number; moyenne: number } | null = null;
  for (let i = 0; i + k <= s.length; i++) {
    if (s[i + k - 1][0] - s[i][0] !== (k - 1) * QUART_MS) continue; // trou dans la fenêtre
    let somme = 0;
    for (let j = i; j < i + k; j++) somme += s[j][1];
    const moyenne = somme / k;
    if (!best || moyenne < best.moyenne) best = { debut: s[i][0], fin: s[i][0] + dureeMin * 60000, moyenne };
  }
  return best;
}

/**
 * Coût d'un appareil lancé à `debutTs` pendant `dureeMin`, qui consomme `kwh` répartis également
 * dans le temps. `prixKwh` transforme un spot (EUR/MWh) en prix final (sous-unité/kWh).
 * Les quarts d'heure partiellement couverts comptent au prorata. Erreur si la série ne couvre pas.
 */
export function coutAppareil(o: {
  serie: Creneau[];
  debutTs: number;
  dureeMin: number;
  kwh: number;
  prixKwh: (spotEurMwh: number) => number;
}): { cout: number; prixMoyen: number } {
  const { serie, debutTs, dureeMin, kwh, prixKwh } = o;
  if (!(dureeMin > 0) || !(kwh >= 0)) throw new Error('durée ou consommation invalide');
  const finTs = debutTs + dureeMin * 60000;
  const parMs = kwh / (finTs - debutTs);
  let sousUnites = 0, couvert = 0;
  for (const [ts, v] of serie) {
    const a = Math.max(ts, debutTs), b = Math.min(ts + QUART_MS, finTs);
    if (b <= a) continue;
    const e = (b - a) * parMs;
    sousUnites += e * prixKwh(v);
    couvert += b - a;
  }
  if (Math.abs(couvert - (finTs - debutTs)) > 1) throw new Error('prix non encore publiés pour toute la durée');
  return { cout: sousUnites / 100, prixMoyen: kwh > 0 ? sousUnites / kwh : prixKwh(0) };
}

/** Énergie tirée du réseau et durée d'une recharge de batterie (voiture, batterie domestique). */
export function recharge(o: { batterieKwh: number; dePct: number; aPct: number; puissanceKw: number; pertesPct: number }): { kwhBatterie: number; kwhReseau: number; dureeMin: number } {
  const { batterieKwh, dePct, aPct, puissanceKw, pertesPct } = o;
  if (!(batterieKwh > 0) || !(puissanceKw > 0)) throw new Error('batterie ou puissance invalide');
  if (!(pertesPct >= 0 && pertesPct < 50)) throw new Error('pertes invalides');
  const kwhBatterie = Math.max(0, ((Math.min(aPct, 100) - Math.max(dePct, 0)) / 100) * batterieKwh);
  const kwhReseau = kwhBatterie / (1 - pertesPct / 100);
  // la durée est arrondie au quart d'heure supérieur, la fenêtre de prix se cherche par quarts d'heure
  const dureeMin = Math.ceil(((kwhReseau / puissanceKw) * 60) / 15) * 15;
  return { kwhBatterie, kwhReseau, dureeMin };
}

/**
 * Contrat dynamique contre prix fixe sur les jours complets de la série.
 * `profil` : 24 poids (heure locale 0 à 23) de la consommation d'une journée ; plat par défaut
 * (hypothèse affichée comme telle). Les jours à 23 ou 25 heures sont renormalisés.
 */
export function dynamiqueContreFixe(o: {
  serie: Creneau[];
  kwhParJour: number;
  prixKwh: (spotEurMwh: number) => number;
  fixeSousUniteKwh: number;
  profil?: number[];
}): { jours: number; kwh: number; coutDynamique: number; coutFixe: number; ecart: number; prixMoyenDynamique: number } {
  const profil = o.profil ?? Array(24).fill(1);
  if (profil.length !== 24 || profil.some((p) => !(p >= 0)) || profil.every((p) => p === 0)) throw new Error('profil de 24 poids positifs');
  let jours = 0, kwh = 0, sousUnites = 0;
  for (const jour of joursDisponibles(o.serie)) {
    const cr = creneauxDuJour(o.serie, jour);
    const attendu = cr.length;
    if (attendu < 92) continue; // jour incomplet (premier ou dernier de la série)
    const poids = cr.map(([ts]) => profil[Number(heureLocale(ts).slice(0, 2))] / 4);
    const total = poids.reduce((s, p) => s + p, 0);
    if (total === 0) continue;
    cr.forEach(([, v], i) => {
      const e = (o.kwhParJour * poids[i]) / total;
      kwh += e;
      sousUnites += e * o.prixKwh(v);
    });
    jours++;
  }
  const coutDynamique = sousUnites / 100;
  const coutFixe = (kwh * o.fixeSousUniteKwh) / 100;
  return { jours, kwh, coutDynamique, coutFixe, ecart: coutDynamique - coutFixe, prixMoyenDynamique: kwh ? sousUnites / kwh : 0 };
}
