// Contrôles des séries SMARD avant écriture (utilisés par update-data.mjs, testés par tests/serie.test.ts).
// Une série à trous décale tous les prix suivants d'un quart d'heure dans le découpage par jour :
// elle est rejetée, jamais réparée. Un jour civil Europe/Berlin a exactement 92, 96 ou 100 quarts
// d'heure (passage à l'heure d'été, jour normal, passage à l'heure d'hiver).

export const QUART_MS = 900000;
const fmtJour = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const fmtHeure = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const jourBerlin = (ts) => fmtJour.format(new Date(ts));
const heureBerlin = (ts) => fmtHeure.format(new Date(ts));

/** Écarts entre horodatages consécutifs différents de 15 minutes : [{ avant, apres, minutes }]. */
export function trous(qh) {
  const out = [];
  for (let i = 1; i < qh.length; i++) {
    const d = qh[i][0] - qh[i - 1][0];
    if (d !== QUART_MS) out.push({ avant: new Date(qh[i - 1][0]).toISOString(), apres: new Date(qh[i][0]).toISOString(), minutes: d / 60000 });
  }
  return out;
}

/** Nombre de quarts d'heure par jour civil Berlin : { 'AAAA-MM-JJ': { n, debut, fin } }. */
export function quartsParJour(qh) {
  const m = {};
  for (const [ts] of qh) {
    const d = jourBerlin(ts);
    (m[d] ??= { n: 0, debut: heureBerlin(ts), fin: '' }).n++;
    m[d].fin = heureBerlin(ts);
  }
  return m;
}

/**
 * Rejette une série : valeurs invalides, hors limites SDAC, trou d'horodatage, ou jour complet
 * (00:00 → 23:45) dont le nombre de quarts d'heure n'est pas 92, 96 ou 100.
 * Lève une erreur au premier défaut ; ne renvoie rien si la série est saine.
 */
export function pruefeSerie(zone, qh, { minJours = 7 } = {}) {
  if (!Array.isArray(qh) || qh.length < 96 * minJours) throw new Error(`${zone} : moins de ${minJours} jours de quarts d'heure (${qh?.length ?? 0})`);
  for (const [ts, v] of qh) {
    if (!Number.isInteger(ts)) throw new Error(`${zone} : horodatage invalide ${ts}`);
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${zone} : valeur invalide à ${new Date(ts).toISOString()}`);
    // Limites harmonisées SDAC : -500 et +4000 EUR/MWh (2026). Au-delà, la donnée est suspecte.
    if (v < -500 || v > 4000) throw new Error(`${zone} : valeur hors limites SDAC ${v} à ${new Date(ts).toISOString()}`);
  }
  const t = trous(qh);
  if (t.length) throw new Error(`${zone} : série à trous rejetée (${t.length}), premier écart de ${t[0].minutes} min entre ${t[0].avant} et ${t[0].apres}`);
  for (const [d, j] of Object.entries(quartsParJour(qh))) {
    if (j.debut === '00:00' && j.fin === '23:45' && ![92, 96, 100].includes(j.n)) throw new Error(`${zone} : ${d} a ${j.n} quarts d'heure (attendu 92, 96 ou 100)`);
  }
}

/**
 * Fraîcheur : le dernier jour publié doit être au moins aujourd'hui (Berlin). Après 14 h,
 * heure de Berlin, le lendemain est attendu (enchère day-ahead publiée vers 13 h) : son absence
 * est signalée (`lendemainManquant`) sans bloquer.
 */
export function frische(lastIso, now = new Date()) {
  const dernierJour = jourBerlin(Date.parse(lastIso));
  const aujourdhui = jourBerlin(now.getTime());
  const [y, m, d] = aujourdhui.split('-').map(Number);
  const demain = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const heure = Number(heureBerlin(now.getTime()).slice(0, 2));
  return {
    dernierJour,
    aujourdhui,
    perime: dernierJour < aujourdhui,
    lendemainManquant: heure >= 14 && dernierJour < demain,
  };
}
