#!/usr/bin/env node
// Relit les prix day-ahead officiels publiés par la Bundesnetzagentur sur SMARD.de
// (licence CC BY 4.0, attribution « Bundesnetzagentur | SMARD.de », smard.de/home/datennutzung)
// et le cours de référence EUR/PLN de la BCE (« the ECB must be cited as the source »).
// Aucune dépendance : Node 18+ (fetch natif). Usage : node scripts/update-data.mjs [dossierSortie]
// Contrôles (scripts/serie-pruefen.mjs) : série à trous rejetée, jour à 92/96/100 quarts, prix périmés refusés.
// Écrit : <out>/prices/<zone>.json (quarts d'heure des 42 derniers jours + moyennes journalières
// et mensuelles), <out>/fx-eur-pln.json, <out>/cbs-nl.json (CBS 85592NED, CC BY 4.0), <out>/meta.json.
// Lancé par .github/workflows/update-data.yml (cron) avant chaque build.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pruefeSerie, frische, quartsParJour } from './serie-pruefen.mjs';

const OUT = process.argv[2] || 'src/data';
const BASE = 'https://www.smard.de/app/chart_data';
// Identifiants des séries « Großhandelspreise / Marktpreis » de SMARD (EUR/MWh).
// Vérifiés le 2026-10-24 par comparaison des valeurs (NL ≈ DE-LU, AT ≈ Italie Nord, PL distinct).
export const ZONES = {
  'DE-LU': { filter: 4169, label: 'Deutschland/Luxemburg' },
  AT: { filter: 4170, label: 'Österreich' },
  NL: { filter: 256, label: 'Niederlande' },
  BE: { filter: 4996, label: 'Belgien' },
  PL: { filter: 257, label: 'Polen' },
};
const UA = { 'User-Agent': 'Mozilla/5.0 (update-data; contact via site imprint)' };

async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((ok) => setTimeout(ok, 2000 * i));
    }
  }
}

async function serie(filter, res, chunks) {
  const idx = (await getJson(`${BASE}/${filter}/DE/index_${res}.json`)).timestamps;
  const pick = chunks ? idx.slice(-chunks) : idx;
  const out = [];
  for (const t of pick) {
    const j = await getJson(`${BASE}/${filter}/DE/${filter}_DE_${res}_${t}.json`);
    for (const [ts, v] of j.series) if (v !== null && v !== undefined) out.push([ts, v]);
  }
  // dédoublonne et trie
  const m = new Map(out);
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}

async function fxPln() {
  const url = 'https://data-api.ecb.europa.eu/service/data/EXR/D.PLN.EUR.SP00.A?lastNObservations=30&format=jsondata';
  const j = await getJson(url);
  const dates = j.structure.dimensions.observation[0].values.map((v) => v.id);
  const obs = Object.values(j.dataSets[0].series)[0].observations;
  const rows = Object.entries(obs).map(([i, v]) => [dates[Number(i)], v[0]]).sort();
  return {
    source: 'European Central Bank, ECB reference exchange rate (EXR.D.PLN.EUR.SP00.A)',
    sourceUrl: 'https://data.ecb.europa.eu/data/datasets/EXR/EXR.D.PLN.EUR.SP00.A',
    terms: 'https://www.ecb.europa.eu/home/disclaimer/html/index.en.html',
    unit: 'PLN per EUR',
    latest: { date: rows.at(-1)[0], value: rows.at(-1)[1] },
    series: rows,
  };
}

// CBS StatLine 85592NED « Gemiddelde energietarieven voor consumenten » (maandcijfers, CC BY 4.0,
// « mits CBS als bron wordt vermeld », cbs.nl/nl-nl/over-ons/website/copyright).
async function cbsNl() {
  const url = "https://opendata.cbs.nl/ODataApi/odata/85592NED/TypedDataSet?$filter=substring(Perioden,0,4)%20ge%20'2024'";
  const j = await getJson(url);
  const k = { A048944: 'incl', A048945: 'excl' };
  const rows = {};
  for (const r of j.value) {
    if (!/MM\d\d$/.test(r.Perioden)) continue;
    const m = r.Perioden.replace('MM', '-');
    rows[m] ??= { maand: m };
    rows[m][k[r.Btw]] = {
      gasVariabel: r.VariabelLeveringstariefContractprijs_3, gasEb: r.Energiebelasting_6, gasTransport: r.Transporttarief_1,
      stroomVariabel: r.VariabelLeveringstariefContractprijs_9, stroomDynamisch: r.VariabelLeveringstariefDynamisch_12,
      stroomEb: r.Energiebelasting_14, vermindering: r.VerminderingEnergiebelasting_15, stroomTransport: r.Transporttarief_7,
      vastDynamisch: r.VastLeveringstariefDynamisch_11,
    };
  }
  const maanden = Object.values(rows).filter((r) => r.incl && r.excl && r.incl.gasVariabel != null).sort((a, b) => a.maand.localeCompare(b.maand));
  if (maanden.length < 6) throw new Error('CBS 85592NED : moins de 6 mois lus');
  return {
    source: 'CBS StatLine, Gemiddelde energietarieven voor consumenten (85592NED)',
    sourceUrl: 'https://opendata.cbs.nl/statline/#/CBS/nl/dataset/85592NED/table',
    licence: 'CC BY 4.0', terms: 'https://www.cbs.nl/nl-nl/over-ons/website/copyright',
    units: { gas: 'euro per m3', stroom: 'euro per kWh', transport: 'euro per jaar' },
    laatste: maanden.at(-1).maand, maanden,
  };
}

async function main() {
  const retrieved = new Date().toISOString();
  await mkdir(join(OUT, 'prices'), { recursive: true });
  const meta = {
    retrieved,
    source: 'Bundesnetzagentur | SMARD.de',
    sourceUrl: 'https://www.smard.de/home/marktdaten',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    termsUrl: 'https://www.smard.de/home/datennutzung',
    unit: 'EUR/MWh',
    zones: {},
  };
  // Tout est lu et contrôlé avant la première écriture : une zone rejetée laisse les cinq fichiers intacts.
  const ecritures = [];
  for (const [zone, z] of Object.entries(ZONES)) {
    const qh = await serie(z.filter, 'quarterhour', 7); // 7 semaines ≈ 42 jours et plus
    pruefeSerie(zone, qh); // rejette toute série à trous (sinon décalage d'un quart d'heure)
    const f = frische(new Date(qh.at(-1)[0]).toISOString());
    if (f.perime) throw new Error(`${zone} : prix périmés, dernier jour publié ${f.dernierJour} (aujourd'hui ${f.aujourdhui}) ; données non écrites`);
    if (f.lendemainManquant) console.warn(`${zone} : le lendemain n'est pas encore publié (dernier jour ${f.dernierJour})`);
    const day = await serie(z.filter, 'day', 60); // ≈ 14 mois
    const month = await serie(z.filter, 'month'); // tout l'historique mensuel
    const cutoff = qh.at(-1)[0] - 42 * 86400000;
    const data = {
      zone,
      label: z.label,
      smardFilter: z.filter,
      unit: 'EUR/MWh',
      resolution: 'PT15M',
      timezone: 'Europe/Berlin (horodatage SMARD en ms UTC)',
      first: new Date(qh.find((r) => r[0] >= cutoff)[0]).toISOString(),
      last: new Date(qh.at(-1)[0]).toISOString(),
      quarterHours: qh.filter((r) => r[0] >= cutoff),
      daily: day,
      monthly: month,
      retrieved,
      attribution: 'Bundesnetzagentur | SMARD.de (CC BY 4.0)',
    };
    ecritures.push([join(OUT, 'prices', `${zone}.json`), JSON.stringify(data)]);
    const parJour = quartsParJour(data.quarterHours);
    meta.zones[zone] = { last: data.last, lastDay: f.dernierJour, points: data.quarterHours.length, filter: z.filter };
    console.log(`${zone} : ${data.quarterHours.length} quarts d'heure jusqu'à ${data.last} (dernier jour ${f.dernierJour}, ${parJour[f.dernierJour].n} quarts)`);
  }
  const fx = await fxPln();
  ecritures.push([join(OUT, 'fx-eur-pln.json'), JSON.stringify(fx, null, 1)]);
  console.log(`EUR/PLN ${fx.latest.value} (${fx.latest.date})`);
  const cbs = await cbsNl();
  ecritures.push([join(OUT, 'cbs-nl.json'), JSON.stringify(cbs, null, 1)]);
  console.log(`CBS 85592NED jusqu'à ${cbs.laatste}`);
  ecritures.push([join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)]);
  for (const [f, c] of ecritures) await writeFile(f, c);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
