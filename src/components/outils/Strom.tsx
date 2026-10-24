/**
 * Die Rechner der Seite, alle aus demselben Motor (lib/engine) und denselben SMARD-Daten :
 *   PreisRechner     Endpreis je Viertelstunde heute, morgen, jetzt (Kurve, günstigste und teuerste Stunde)
 *   FensterRechner   günstigster Startzeitpunkt eines Geräts und was er gegenüber « sofort » spart
 *   LadenRechner     E-Auto oder Heimspeicher laden : kWh, Dauer, günstigstes Fenster, Kosten
 *   VergleichRechner dynamischer Tarif gegen Festpreis auf den letzten 30 vollständigen Tagen
 *   VerlaufRechner   Tagesmittel, Monatsmittel, negative Viertelstunden
 *   GasRekenhulp     NL : gasprijs per m³ met energiebelasting en btw, tegen het CBS-gemiddelde
 * Die Daten kommen als Props (nur die Tage, die der Rechner braucht). Erste Darstellung = Build-Tag (refDay),
 * die Uhrzeit des Besuchers wird erst nach dem Laden gelesen (RECETTE §17.5).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as M from '../../lib/engine';
import type { Tag, Zone, Eingaben, Gemeinde, Bundesland } from '../../lib/engine';
import { P } from '../../lib/engine/params';
import { formatNumber, formatMoney, displayDate } from '../../lib/format';
import { LANG_TAGS } from '../../data/site-config';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import { Shell, Head, Rows, Note, MethodLink, Row2, T, type L } from '../calc/kit';

/* ------------------------------------------------------------------ Format */
const ZONE_NAME: Record<Zone, Record<L, string>> = {
  'DE-LU': { de: 'Deutschland', en: 'Germany', nl: 'Duitsland' },
  NL: { de: 'Niederlande', en: 'Netherlands', nl: 'Nederland' },
  AT: { de: 'Österreich', en: 'Austria', nl: 'Oostenrijk' },
  BE: { de: 'Belgien', en: 'Belgium', nl: 'België' },
  PL: { de: 'Polen', en: 'Poland', nl: 'Polen' },
};
export const zoneName = (z: Zone, l: L) => ZONE_NAME[z][l];
const pl = (z: Zone) => z === 'PL';
/** Preis je kWh : Cent (Euro-Zonen) oder Złoty (Polen). */
export function preisText(ct: number, l: L, z: Zone): string {
  return pl(z) ? `${formatNumber(ct / 100, 2, l)} zł/kWh` : `${formatNumber(ct, 1, l)} ct/kWh`;
}
function geld(x: number, l: L, z: Zone, d = 2): string {
  return pl(z) ? `${formatNumber(x, d, l)} zł` : formatMoney(x, d, l);
}
const uhr = (ts: number) => M.heureLocale(ts);
const datum = (iso: string, l: L) => displayDate(iso, LANG_TAGS[l]);
const istTag = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso);

/** Uhrzeit des Besuchers, erst nach dem Laden (sonst Hydratationsfehler). */
function useJetzt(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
const berlinTag = (ts: number) => M.jourLocal(ts);

/* ------------------------------------------------------------------ Tarif-Eingaben je Land */
const GEMEINDE: Record<Gemeinde, Record<L, string>> = {
  bis25000: { de: 'bis 25.000 Einwohner', en: 'up to 25,000 inhabitants', nl: 'tot 25.000 inwoners' },
  bis100000: { de: 'bis 100.000 Einwohner', en: 'up to 100,000 inhabitants', nl: 'tot 100.000 inwoners' },
  bis500000: { de: 'bis 500.000 Einwohner', en: 'up to 500,000 inhabitants', nl: 'tot 500.000 inwoners' },
  ueber500000: { de: 'über 500.000 Einwohner', en: 'over 500,000 inhabitants', nl: 'meer dan 500.000 inwoners' },
};
const LAND_DE: Record<Bundesland, string> = {
  DE: 'Deutschland', BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen',
  ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen',
};
const netzVon = (b: Bundesland) => P.de.netzentgelt2025_ct[b] as number;

export interface TarifStart { bundesland?: Bundesland; aufschlag?: number; zuschlag?: number; gemeinde?: Gemeinde }

function useTarif(zone: Zone, l: L, id: string, start: TarifStart, pln?: number) {
  const [bl, setBl] = useState<Bundesland>(start.bundesland ?? 'DE');
  const [netz, setNetz] = useState(netzVon(start.bundesland ?? 'DE'));
  const [gem, setGem] = useState<Gemeinde>(start.gemeinde ?? 'bis100000');
  const [auf, setAuf] = useState(start.aufschlag ?? 0);
  const [zus, setZus] = useState(start.zuschlag ?? 0);
  const e: Eingaben = { aufschlag: auf, netz, gemeinde: gem, zuschlag: zus, pln };
  const land = M.LAND_DER_ZONE[zone];
  let felder: ReactNode = null;
  if (land === 'DE') {
    felder = (
      <>
        <Row2>
          <SelectField id={`${id}-bl`} label={T(l, 'Bundesland (Netzentgelt)', 'Federal state (grid fee)', 'Deelstaat (netkosten)')} value={bl}
            onChange={(v) => { setBl(v as Bundesland); setNetz(netzVon(v as Bundesland)); }}
            options={M.BUNDESLAENDER.map((b) => ({ value: b, label: b === 'DE' ? T(l, 'Bundesdurchschnitt', 'German average', 'Duits gemiddelde') : LAND_DE[b] }))} />
          <NumberField id={`${id}-netz`} label={T(l, 'Netzentgelt netto', 'Grid fee, net', 'Netkosten netto')} value={netz} onChange={setNetz} unit="ct" decimals={2} max={40}
            help={T(l, 'Mittel 2025 laut Bundesnetzagentur, Ihr Netzbetreiber steht auf der Rechnung', '2025 average per the Federal Network Agency; yours is on your bill', 'Gemiddelde 2025 volgens de Bundesnetzagentur')} />
          <NumberField id={`${id}-auf`} label={T(l, 'Aufschlag des Anbieters netto', 'Supplier markup, net', 'Opslag van de leverancier netto')} value={auf} onChange={setAuf} unit="ct" decimals={2} max={30}
            help={T(l, 'Aus Ihrem Vertrag (ohne Grundgebühr)', 'From your contract (excluding standing charge)', 'Uit uw contract (zonder vaste kosten)')} />
          <SelectField id={`${id}-gem`} label={T(l, 'Gemeinde (Konzessionsabgabe)', 'Municipality size (concession fee)', 'Gemeente (concessieheffing)')} value={gem} onChange={(v) => setGem(v as Gemeinde)}
            options={(Object.keys(GEMEINDE) as Gemeinde[]).map((g) => ({ value: g, label: GEMEINDE[g][l] }))} />
        </Row2>
      </>
    );
  } else if (land === 'NL') {
    felder = (
      <Row2>
        <NumberField id={`${id}-inkoop`} label={T(l, 'Einkaufsaufschlag netto', 'Purchase fee (inkoopvergoeding), excl. VAT', 'Inkoopvergoeding excl. btw')} value={auf} onChange={setAuf} unit="ct" decimals={2} max={30}
          help={T(l, 'Steht in Ihrem Vertrag', 'Listed in your contract', 'Staat in je contract, per kWh')} />
      </Row2>
    );
  } else {
    felder = (
      <Row2>
        <NumberField id={`${id}-zus`} label={T(l, 'Netz, Abgaben und Steuern', 'Grid, levies and taxes', 'Net, heffingen en belastingen')} value={zus} onChange={setZus} unit={pl(zone) ? 'gr' : 'ct'} decimals={2} max={200}
          help={T(l, 'Pro kWh laut Ihrer Rechnung, brutto', 'Per kWh from your bill, gross', 'Per kWh volgens je factuur, bruto')} />
      </Row2>
    );
  }
  return { e, felder, land };
}

/** Text, der unter dem Ergebnis sagt, was im Preis steckt. */
function wasDrinIst(zone: Zone, l: L, e: Eingaben): string {
  const land = M.LAND_DER_ZONE[zone];
  if (land === 'DE') return T(l,
    `Börsenpreis + ${formatNumber(e.aufschlag, 2, l)} ct Aufschlag + ${formatNumber(e.netz ?? 0, 2, l)} ct Netzentgelt + Stromsteuer ${formatNumber(P.de.stromsteuer_ct, 2, l)} ct + Umlagen ${formatNumber(M.umlagenDe(), 3, l)} ct + Konzessionsabgabe, darauf ${formatNumber(P.de.ust * 100, 0, l)} % Umsatzsteuer. Grundgebühr und Messstellenbetrieb nicht enthalten.`,
    `Exchange price + ${formatNumber(e.aufschlag, 2, l)} ct markup + ${formatNumber(e.netz ?? 0, 2, l)} ct grid fee + electricity tax ${formatNumber(P.de.stromsteuer_ct, 2, l)} ct + levies ${formatNumber(M.umlagenDe(), 3, l)} ct + concession fee, plus ${formatNumber(P.de.ust * 100, 0, l)}% VAT. Standing charge and meter fee not included.`,
    `Beursprijs + ${formatNumber(e.aufschlag, 2, l)} ct opslag + ${formatNumber(e.netz ?? 0, 2, l)} ct netkosten + Stromsteuer ${formatNumber(P.de.stromsteuer_ct, 2, l)} ct + heffingen ${formatNumber(M.umlagenDe(), 3, l)} ct + concessieheffing, plus ${formatNumber(P.de.ust * 100, 0, l)} % btw. Vaste kosten en meterhuur niet inbegrepen.`);
  if (land === 'NL') return T(l,
    `Börsenpreis + ${formatNumber(e.aufschlag, 2, l)} ct Einkaufsaufschlag + Energiesteuer ${formatNumber(P.nl.eb_stroom_eur_kwh * 100, 3, l)} ct, darauf ${formatNumber(P.nl.btw * 100, 0, l)} % MwSt. Netzkosten werden in den Niederlanden pauschal je Anschluss berechnet und fehlen hier.`,
    `Exchange price + ${formatNumber(e.aufschlag, 2, l)} ct purchase fee + energy tax ${formatNumber(P.nl.eb_stroom_eur_kwh * 100, 3, l)} ct, plus ${formatNumber(P.nl.btw * 100, 0, l)}% VAT. Dutch grid costs are a fixed charge per connection, so they are not in the hourly price.`,
    `Beursprijs + ${formatNumber(e.aufschlag, 2, l)} ct inkoopvergoeding + energiebelasting ${formatNumber(P.nl.eb_stroom_eur_kwh * 100, 3, l)} ct, plus ${formatNumber(P.nl.btw * 100, 0, l)} % btw. Netbeheerkosten betaal je per aansluiting, los van het uur: ze zitten hier niet in.`);
  return T(l,
    'Börsenpreis plus Ihre Eingabe. Netzentgelte und Steuern dieses Landes rechnen wir nicht selbst ein: Sie stehen auf Ihrer Rechnung.',
    'Exchange price plus what you entered. We do not add this country’s grid charges and taxes ourselves: take them from your bill.',
    'Beursprijs plus wat je invult. Netkosten en belastingen van dit land rekenen wij niet zelf: ze staan op je factuur.');
}

function Quelle({ l, stand, bis }: { l: L; stand: string; bis?: string }) {
  return <p className="mt-3 text-xs text-navy-600">{bis ? T(l, `Neuester Preistag: ${datum(bis, l)}. `, `Latest day with prices: ${datum(bis, l)}. `, `Laatste dag met prijzen: ${datum(bis, l)}. `) : ''}{T(l, 'Day-Ahead-Großhandelspreise: ', 'Day-ahead wholesale prices: ', 'Day-ahead groothandelsprijzen: ')}<a href={P.sources.smard.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">Bundesnetzagentur | SMARD.de</a> (<a href={P.sources.smardLizenz.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">CC BY 4.0</a>){T(l, ', abgerufen am ', ', fetched on ', ', opgehaald op ')}{datum(stand.slice(0, 10), l)}{T(l, '. Berechnung: Radif Partners', '. Calculation: Radif Partners', '. Berekening: Radif Partners')}</p>;
}

/* ------------------------------------------------------------------ Kurve */
function Kurve({ tag, preise, l, z, jetzt, fenster }: { tag: Tag; preise: number[]; l: L; z: Zone; jetzt?: number; fenster?: [number, number] | null }) {
  const n = preise.length;
  const W = 960, H = 200, pad = 22;
  const max = Math.max(...preise, 1), min = Math.min(...preise, 0);
  const y = (v: number) => pad + ((max - v) / (max - min || 1)) * (H - 2 * pad);
  const bw = W / n;
  const y0 = y(0);
  const ticks = Array.from({ length: n }, (_, i) => i).filter((i) => uhr(tag.t0 + i * M.QUART_MS).endsWith(':00') && Number(uhr(tag.t0 + i * M.QUART_MS).slice(0, 2)) % 3 === 0);
  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-auto w-full" role="img" aria-label={T(l, `Endpreis je Viertelstunde am ${datum(tag.d, l)}`, `All-in price per quarter hour on ${datum(tag.d, l)}`, `Eindprijs per kwartier op ${datum(tag.d, l)}`)}>
        {preise.map((v, i) => {
          const inF = fenster && i >= fenster[0] && i < fenster[1];
          const now = jetzt === i;
          const cls = now ? 'fill-navy-900' : v < 0 ? 'fill-emerald-700' : inF ? 'fill-emerald-600' : 'fill-accent-500';
          const top = Math.min(y(v), y0), h = Math.max(1, Math.abs(y(v) - y0));
          return <rect key={i} x={i * bw + 0.5} y={top} width={Math.max(1, bw - 1)} height={h} className={cls} />;
        })}
        <line x1="0" x2={W} y1={y0} y2={y0} className="stroke-navy-400" strokeWidth="1" />
        {ticks.map((i) => <text key={i} x={i * bw} y={H + 14} className="fill-navy-600" fontSize="13">{uhr(tag.t0 + i * M.QUART_MS)}</text>)}
        <text x="4" y="14" className="fill-navy-600" fontSize="13">{preisText(max, l, z)}</text>
      </svg>
      <figcaption className="mt-1 text-xs text-navy-600">{T(l, 'Jeder Balken = eine Viertelstunde, Endpreis mit Ihren Angaben', 'Each bar = one quarter hour, all-in price with your inputs', 'Elke staaf = één kwartier, eindprijs met jouw gegevens')}{fenster ? T(l, ' · grün: günstigstes Fenster', ' · green: cheapest window', ' · groen: goedkoopste venster') : ''}{jetzt != null && jetzt >= 0 ? T(l, ' · dunkel: jetzt', ' · dark: now', ' · donker: nu') : ''}</figcaption>
    </figure>
  );
}

function Stundentabelle({ tag, preisFn, l, z, pln }: { tag: Tag; preisFn: (s: number) => number; l: L; z: Zone; pln?: number }) {
  const h = M.moyennesHoraires(tag.v.map((v, i) => [tag.t0 + i * M.QUART_MS, v] as M.Creneau));
  return (
    <details className="mt-4 rounded-lg border border-navy-200 px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Alle Stunden als Tabelle', 'Every hour as a table', 'Alle uren als tabel')}</summary>
      <div className="mt-2 overflow-x-auto"><table className="w-full text-sm">
        <thead><tr><th scope="col" className="py-1 text-left text-navy-700">{T(l, 'Stunde', 'Hour', 'Uur')}</th><th scope="col" className="py-1 text-right text-navy-700">{T(l, 'Börse', 'Exchange', 'Beurs')}</th><th scope="col" className="py-1 text-right text-navy-700">{T(l, 'Endpreis', 'All-in', 'Eindprijs')}</th></tr></thead>
        <tbody className="divide-y divide-navy-100">{h.map((x) => <tr key={x.ts}><td className="tabular-nums py-1 text-navy-800">{x.heure}</td><td className="tabular-nums py-1 text-right text-navy-800">{preisText(M.spotEnSousUnite(x.moyenne, pl(z) ? pln : 1), l, z)}</td><td className="tabular-nums py-1 text-right font-medium text-navy-900">{preisText(preisFn(x.moyenne), l, z)}</td></tr>)}</tbody>
      </table></div>
    </details>
  );
}

/* ------------------------------------------------------------------ gemeinsame Props */
export interface Basis {
  lang: L; refDay: string; methodHref?: string; id: string;
  zone: Zone;
  /** Tage je Zone (mindestens die Startzone). Mehrere Zonen = Auswahlliste. */
  tage: Partial<Record<Zone, Tag[]>>;
  stand: string;
  pln?: number;
  start?: TarifStart;
}
function ZoneWahl({ id, l, zonen, zone, setZone }: { id: string; l: L; zonen: Zone[]; zone: Zone; setZone: (z: Zone) => void }) {
  if (zonen.length < 2) return null;
  return <SelectField id={`${id}-zone`} label={T(l, 'Land (Preiszone)', 'Country (bidding zone)', 'Land (biedzone)')} value={zone} onChange={(v) => setZone(v as Zone)} options={zonen.map((z) => ({ value: z, label: `${zoneName(z, l)} (${z})` }))} />;
}
/** Welcher Tag gezeigt wird : heute (Besucher), morgen, oder der letzte veröffentlichte, wenn die Daten älter sind. */
function waehleTag(tage: Tag[], heute: string, wahl: 'heute' | 'morgen'): { tag: Tag | null; hinweis: 'ok' | 'morgen_fehlt' | 'alt' } {
  const ziel = wahl === 'heute' ? heute : M.addTage(heute, 1);
  const t = M.tagVon(tage, ziel);
  if (t) return { tag: t, hinweis: 'ok' };
  if (wahl === 'morgen' && M.tagVon(tage, heute)) return { tag: M.tagVon(tage, heute), hinweis: 'morgen_fehlt' };
  return { tag: tage.at(-1) ?? null, hinweis: 'alt' };
}

/* ------------------------------------------------------------------ PreisRechner */
export function PreisRechner(p: Basis & { modus?: 'heute' | 'morgen' | 'jetzt' }) {
  const { lang: l, refDay, methodHref, id } = p;
  const zonen = Object.keys(p.tage) as Zone[];
  const [zone, setZone] = useState<Zone>(p.zone);
  const [wahl, setWahl] = useState<'heute' | 'morgen'>(p.modus === 'morgen' ? 'morgen' : 'heute');
  const { e, felder } = useTarif(zone, l, id, p.start ?? {}, p.pln);
  const now = useJetzt();
  const heute = now ? berlinTag(now) : refDay;
  const tage = p.tage[zone] ?? [];
  const { tag, hinweis } = waehleTag(tage, heute, wahl);
  const fn = useMemo(() => M.preisFn(zone, e), [zone, e.aufschlag, e.netz, e.gemeinde, e.zuschlag, e.pln]);
  const preise = useMemo(() => (tag ? tag.v.map(fn) : []), [tag, fn]);
  if (!tag) return null;
  const serie = tag.v.map((v, i) => [tag.t0 + i * M.QUART_MS, v] as M.Creneau);
  const st = M.stats(serie);
  const stunden = M.moyennesHoraires(serie);
  const billig = stunden.reduce((a, b) => (b.moyenne < a.moyenne ? b : a));
  const teuer = stunden.reduce((a, b) => (b.moyenne > a.moyenne ? b : a));
  const jetztIdx = now && tag.d === heute ? M.viertelIndex(tag, now) : -1;
  const mittelEnd = M.mittel(preise);
  const zeigeJetzt = jetztIdx >= 0 && (p.modus === 'jetzt' || wahl === 'heute');
  const head = zeigeJetzt
    ? { label: T(l, `Jetzt, ${uhr(tag.t0 + jetztIdx * M.QUART_MS)} bis ${uhr(tag.t0 + (jetztIdx + 1) * M.QUART_MS)} Uhr`, `Now, ${uhr(tag.t0 + jetztIdx * M.QUART_MS)} to ${uhr(tag.t0 + (jetztIdx + 1) * M.QUART_MS)}`, `Nu, ${uhr(tag.t0 + jetztIdx * M.QUART_MS)} tot ${uhr(tag.t0 + (jetztIdx + 1) * M.QUART_MS)} uur`), value: preisText(preise[jetztIdx], l, zone) }
    : { label: T(l, `Durchschnitt ${datum(tag.d, l)}`, `Average for ${datum(tag.d, l)}`, `Gemiddelde ${datum(tag.d, l)}`), value: preisText(mittelEnd, l, zone) };
  const form = (
    <>
      <Row2>
        <ZoneWahl id={id} l={l} zonen={zonen} zone={zone} setZone={setZone} />
        <Toggle id={`${id}-tag`} label={T(l, 'Tag', 'Day', 'Dag')} value={wahl} onChange={(v) => setWahl(v as 'heute' | 'morgen')} options={[{ value: 'heute', label: T(l, 'Heute', 'Today', 'Vandaag') }, { value: 'morgen', label: T(l, 'Morgen', 'Tomorrow', 'Morgen') }]} />
      </Row2>
      {felder}
    </>
  );
  const result = (
    <>
      <Head label={head.label} value={head.value} sub={T(l, `Endpreis, ${zoneName(zone, l)}`, `All-in price, ${zoneName(zone, l)}`, `Eindprijs, ${zoneName(zone, l)}`)} />
      <Rows rows={[
        ...(zeigeJetzt ? [[T(l, 'Börsenpreis jetzt', 'Exchange price now', 'Beursprijs nu'), preisText(M.spotEnSousUnite(tag.v[jetztIdx], pl(zone) ? p.pln : 1), l, zone)] as [string, string]] : []),
        [T(l, 'Tagesmittel Endpreis', 'Daily average, all-in', 'Daggemiddelde eindprijs'), preisText(mittelEnd, l, zone), true],
        [T(l, `Günstigste Stunde (${billig.heure})`, `Cheapest hour (${billig.heure})`, `Goedkoopste uur (${billig.heure})`), preisText(fn(billig.moyenne), l, zone)],
        [T(l, `Teuerste Stunde (${teuer.heure})`, `Most expensive hour (${teuer.heure})`, `Duurste uur (${teuer.heure})`), preisText(fn(teuer.moyenne), l, zone)],
        [T(l, 'Börsenpreis Tagesmittel', 'Exchange price, daily average', 'Beursprijs daggemiddelde'), preisText(M.spotEnSousUnite(st.moyenne, pl(zone) ? p.pln : 1), l, zone)],
        [T(l, 'Negative Viertelstunden', 'Negative quarter hours', 'Negatieve kwartieren'), formatNumber(st.negatifs, 0, l)],
      ]} />
      {hinweis === 'morgen_fehlt' && <Note>{T(l, 'Die Preise für morgen sind noch nicht veröffentlicht: Sie sehen heute. Die Börse veröffentlicht sie am frühen Nachmittag, wir laden sie danach.', 'Tomorrow’s prices are not published yet, so this is today. The exchange publishes them in the early afternoon and we load them after that.', 'De prijzen van morgen zijn nog niet gepubliceerd: je ziet vandaag. De beurs publiceert ze begin van de middag, wij laden ze daarna.')}</Note>}
      {hinweis === 'alt' && <Note>{T(l, `Für ${wahl === 'morgen' ? 'morgen' : 'heute'} (${datum(wahl === 'morgen' ? M.addTage(heute, 1) : heute, l)}) liegen uns noch keine Preise vor. Angezeigt wird der neueste geladene Tag, der ${datum(tag.d, l)}: nicht die Preise von heute.`, `We do not have prices for ${wahl === 'morgen' ? 'tomorrow' : 'today'} (${datum(wahl === 'morgen' ? M.addTage(heute, 1) : heute, l)}) yet. This shows the latest loaded day, ${datum(tag.d, l)}, not today’s prices.`, `Voor ${wahl === 'morgen' ? 'morgen' : 'vandaag'} (${datum(wahl === 'morgen' ? M.addTage(heute, 1) : heute, l)}) hebben we nog geen prijzen. Je ziet de laatst geladen dag, ${datum(tag.d, l)}: niet de prijzen van vandaag.`)}</Note>}
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<>
    <Kurve tag={tag} preise={preise} l={l} z={zone} jetzt={zeigeJetzt ? jetztIdx : undefined} />
    <Stundentabelle tag={tag} preisFn={fn} l={l} z={zone} pln={p.pln} />
    <Note>{wasDrinIst(zone, l, e)}</Note>
    <Quelle l={l} stand={p.stand} bis={tage.at(-1)?.d} />
  </>} />;
}

/* ------------------------------------------------------------------ Fenster-Logik */
function maxFenster(serie: M.Creneau[], dur: number, ab: number) {
  const f = M.meilleureFenetre(serie.map(([t, v]) => [t, -v] as M.Creneau), dur, ab);
  return f ? { ...f, moyenne: -f.moyenne } : null;
}
type Zeitraum = 'rest' | 'morgen' | 'beide';
function serieFuer(tage: Tag[], heute: string, zr: Zeitraum) {
  const h = M.tagVon(tage, heute), m = M.tagVon(tage, M.addTage(heute, 1));
  const auswahl = zr === 'morgen' ? [m] : zr === 'rest' ? [h] : [h, m];
  const ok = auswahl.filter((t): t is Tag => !!t);
  // Repli : ni le jour demandé ni le lendemain chargés → dernier jour disponible, signalé à l'écran (veraltet).
  const repli = ok.length ? null : tage.at(-1) ?? null;
  return { serie: M.serieAus(ok.length ? ok : tage.slice(-1)), morgenDa: !!m, heuteDa: !!h, repli };
}
/** Hinweis, wenn der Rechner auf einen älteren Tag ausweicht (Daten nicht aktuell). */
function RepliHinweis({ repli, heute, l }: { repli: Tag | null; heute: string; l: L }) {
  if (!repli) return null;
  return <Note>{T(l, `Für heute (${datum(heute, l)}) und morgen liegen uns noch keine Preise vor. Gerechnet wird mit dem neuesten geladenen Tag, dem ${datum(repli.d, l)}: ein Beispiel, kein Startzeitpunkt für heute.`, `We do not have prices for today (${datum(heute, l)}) or tomorrow yet. This uses the latest loaded day, ${datum(repli.d, l)}: an example, not a start time for today.`, `Voor vandaag (${datum(heute, l)}) en morgen hebben we nog geen prijzen. Gerekend wordt met de laatst geladen dag, ${datum(repli.d, l)}: een voorbeeld, geen starttijd voor vandaag.`)}</Note>;
}
function zeitraumOpt(l: L) {
  return [
    { value: 'rest', label: T(l, 'Heute (ab jetzt)', 'Today (from now)', 'Vandaag (vanaf nu)') },
    { value: 'beide', label: T(l, 'Heute und morgen', 'Today and tomorrow', 'Vandaag en morgen') },
    { value: 'morgen', label: T(l, 'Nur morgen', 'Tomorrow only', 'Alleen morgen') },
  ];
}
const viertelAb = (ts: number) => ts - (ts % M.QUART_MS);
function zeitpunkt(ts: number, l: L, heute: string) {
  const d = berlinTag(ts);
  const tagWort = d === heute ? T(l, 'heute', 'today', 'vandaag') : d === M.addTage(heute, 1) ? T(l, 'morgen', 'tomorrow', 'morgen') : datum(d, l);
  return T(l, `${tagWort}, ${uhr(ts)} Uhr`, `${tagWort} at ${uhr(ts)}`, `${tagWort} om ${uhr(ts)} uur`);
}

interface FensterErgebnis { best: { debut: number; fin: number; kosten: number; preis: number } | null; sofort: { kosten: number; preis: number } | null; teuer: { kosten: number } | null }
function fensterRechnen(serie: M.Creneau[], dur: number, kwh: number, ab: number, fn: (s: number) => number, sofortTs: number | null): FensterErgebnis {
  const b = M.meilleureFenetre(serie, dur, ab);
  const best = b ? (() => { const c = M.coutAppareil({ serie, debutTs: b.debut, dureeMin: dur, kwh, prixKwh: fn }); return { debut: b.debut, fin: b.fin, kosten: c.cout, preis: c.prixMoyen }; })() : null;
  let sofort: FensterErgebnis['sofort'] = null;
  if (sofortTs != null) { try { const c = M.coutAppareil({ serie, debutTs: sofortTs, dureeMin: dur, kwh, prixKwh: fn }); sofort = { kosten: c.cout, preis: c.prixMoyen }; } catch { sofort = null; } }
  const t = maxFenster(serie, dur, ab);
  const teuer = t ? { kosten: M.coutAppareil({ serie, debutTs: t.debut, dureeMin: dur, kwh, prixKwh: fn }).cout } : null;
  return { best, sofort, teuer };
}

/* ------------------------------------------------------------------ FensterRechner */
export function FensterRechner(p: Basis & { dauerH?: number; kwh?: number; zeitraum?: Zeitraum }) {
  const { lang: l, refDay, methodHref, id } = p;
  const zonen = Object.keys(p.tage) as Zone[];
  const [zone, setZone] = useState<Zone>(p.zone);
  const [dauerH, setDauerH] = useState(p.dauerH ?? 2);
  const [kwh, setKwh] = useState(p.kwh ?? 1);
  const [zr, setZr] = useState<Zeitraum>(p.zeitraum ?? 'beide');
  const { e, felder } = useTarif(zone, l, id, p.start ?? {}, p.pln);
  const now = useJetzt();
  const heute = now ? berlinTag(now) : refDay;
  const tage = p.tage[zone] ?? [];
  const fn = useMemo(() => M.preisFn(zone, e), [zone, e.aufschlag, e.netz, e.gemeinde, e.zuschlag, e.pln]);
  const dur = Math.max(15, Math.round((dauerH * 60) / 15) * 15);
  const { serie, morgenDa, repli } = serieFuer(tage, heute, zr);
  const ab = zr === 'morgen' || !now || repli ? -Infinity : viertelAb(now);
  const r = fensterRechnen(serie, dur, kwh, ab, fn, now && zr !== 'morgen' && !repli ? viertelAb(now) : null);
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-dauer`} label={T(l, 'Laufzeit des Geräts', 'Appliance run time', 'Looptijd van het apparaat')} value={dauerH} onChange={setDauerH} unit="h" decimals={2} max={24} help={T(l, 'Auf Viertelstunden gerundet', 'Rounded to quarter hours', 'Afgerond op kwartieren')} />
        <NumberField id={`${id}-kwh`} label={T(l, 'Verbrauch pro Lauf', 'Energy per run', 'Verbruik per keer')} value={kwh} onChange={setKwh} unit="kWh" decimals={2} max={200} help={T(l, 'Laut Gerät oder Zwischenstecker', 'From the appliance label or a plug meter', 'Volgens het apparaat of een meetstekker')} />
        <SelectField id={`${id}-zr`} label={T(l, 'Wann darf es laufen?', 'When may it run?', 'Wanneer mag het draaien?')} value={zr} onChange={(v) => setZr(v as Zeitraum)} options={zeitraumOpt(l)} />
        <ZoneWahl id={id} l={l} zonen={zonen} zone={zone} setZone={setZone} />
      </Row2>
      <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Tarif: Netz, Aufschlag', 'Tariff: grid, markup', 'Tarief: net, opslag')}</summary><div className="mt-3">{felder}</div></details>
    </>
  );
  const sp = r.best && r.sofort ? r.sofort.kosten - r.best.kosten : null;
  const result = r.best ? (
    <>
      <Head label={T(l, 'Günstigster Start', 'Cheapest start', 'Goedkoopste start')} value={zeitpunkt(r.best.debut, l, heute)} sub={T(l, `${geld(r.best.kosten, l, zone)} für ${formatNumber(kwh, 2, l)} kWh, fertig ${uhr(r.best.fin)} Uhr`, `${geld(r.best.kosten, l, zone)} for ${formatNumber(kwh, 2, l)} kWh, done by ${uhr(r.best.fin)}`, `${geld(r.best.kosten, l, zone)} voor ${formatNumber(kwh, 2, l)} kWh, klaar om ${uhr(r.best.fin)} uur`)} />
      <Rows rows={[
        [T(l, 'Mittlerer Endpreis im Fenster', 'Average all-in price in the window', 'Gemiddelde eindprijs in het venster'), preisText(r.best.preis, l, zone)],
        ...(r.sofort ? [[T(l, 'Wenn Sie sofort starten', 'If you start now', 'Als je nu start'), geld(r.sofort.kosten, l, zone)] as [string, string]] : []),
        ...(sp != null ? [[T(l, 'Ersparnis gegenüber sofort', 'Saving against starting now', 'Besparing tegenover nu starten'), geld(sp, l, zone), true] as [string, string, boolean]] : []),
        ...(r.teuer ? [[T(l, 'Zum teuersten Zeitpunkt', 'At the most expensive time', 'Op het duurste moment'), geld(r.teuer.kosten, l, zone)] as [string, string]] : []),
        [T(l, 'Laufzeit gerechnet', 'Run time used', 'Gerekende looptijd'), `${formatNumber(dur / 60, 2, l)} h`],
      ]} />
      <RepliHinweis repli={repli} heute={heute} l={l} />
      {zr !== 'rest' && !morgenDa && !repli && <Note>{T(l, 'Morgen ist noch nicht veröffentlicht: gerechnet wird mit dem Rest von heute.', 'Tomorrow is not published yet: this uses the rest of today.', 'Morgen is nog niet gepubliceerd: gerekend met de rest van vandaag.')}</Note>}
      <MethodLink href={methodHref} lang={l} />
    </>
  ) : <Note>{T(l, 'Für diese Laufzeit gibt es im gewählten Zeitraum kein Fenster mehr. Wählen Sie „Heute und morgen“ oder eine kürzere Laufzeit.', 'No window of that length is left in the chosen period. Pick “Today and tomorrow” or a shorter run time.', 'Er is in die periode geen venster van die lengte meer. Kies “Vandaag en morgen” of een kortere looptijd.')}</Note>;
  return <Shell id={id} form={form} result={result} after={<><Note>{wasDrinIst(zone, l, e)}</Note><Quelle l={l} stand={p.stand} bis={tage.at(-1)?.d} /></>} />;
}

/* ------------------------------------------------------------------ LadenRechner */
export function LadenRechner(p: Basis & { batterie?: number; von?: number; bis?: number; kw?: number; verlust?: number }) {
  const { lang: l, refDay, methodHref, id } = p;
  const zonen = Object.keys(p.tage) as Zone[];
  const [zone, setZone] = useState<Zone>(p.zone);
  const [bat, setBat] = useState(p.batterie ?? 60);
  const [von, setVon] = useState(p.von ?? 20);
  const [bis, setBis] = useState(p.bis ?? 80);
  const [kw, setKw] = useState(p.kw ?? 11);
  const [verl, setVerl] = useState(p.verlust ?? 10);
  const { e, felder } = useTarif(zone, l, id, p.start ?? {}, p.pln);
  const now = useJetzt();
  const heute = now ? berlinTag(now) : refDay;
  const tage = p.tage[zone] ?? [];
  const fn = useMemo(() => M.preisFn(zone, e), [zone, e.aufschlag, e.netz, e.gemeinde, e.zuschlag, e.pln]);
  const ladung = (() => { try { return M.recharge({ batterieKwh: Math.max(bat, 1), dePct: von, aPct: bis, puissanceKw: Math.max(kw, 0.1), pertesPct: Math.min(Math.max(verl, 0), 49) }); } catch { return null; } })();
  const { serie, morgenDa, repli } = serieFuer(tage, heute, 'beide');
  const ab = now && !repli ? viertelAb(now) : -Infinity;
  const r = ladung && ladung.kwhReseau > 0 ? fensterRechnen(serie, ladung.dureeMin, ladung.kwhReseau, ab, fn, now && !repli ? viertelAb(now) : null) : null;
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-bat`} label={T(l, 'Akku (nutzbar)', 'Battery (usable)', 'Accu (bruikbaar)')} value={bat} onChange={setBat} unit="kWh" max={250} />
        <NumberField id={`${id}-kw`} label={T(l, 'Ladeleistung', 'Charging power', 'Laadvermogen')} value={kw} onChange={setKw} unit="kW" decimals={1} max={50} help={T(l, 'Wallbox meist 11 kW, Steckdose 2,3 kW', 'Wallbox usually 11 kW, socket 2.3 kW', 'Laadpaal vaak 11 kW, stopcontact 2,3 kW')} />
        <NumberField id={`${id}-von`} label={T(l, 'Ladestand jetzt', 'Charge now', 'Laadniveau nu')} value={von} onChange={setVon} unit="%" max={100} />
        <NumberField id={`${id}-bis`} label={T(l, 'Laden bis', 'Charge to', 'Laden tot')} value={bis} onChange={setBis} unit="%" max={100} />
      </Row2>
      <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Ladeverluste, Land, Tarif', 'Charging losses, country, tariff', 'Laadverlies, land, tarief')}</summary>
        <div className="mt-3 space-y-4"><Row2>
          <NumberField id={`${id}-verl`} label={T(l, 'Ladeverluste', 'Charging losses', 'Laadverlies')} value={verl} onChange={setVerl} unit="%" max={49} help={T(l, 'Annahme, je nach Auto und Leistung verschieden', 'Assumption, varies by car and power', 'Aanname, verschilt per auto en vermogen')} />
          <ZoneWahl id={id} l={l} zonen={zonen} zone={zone} setZone={setZone} />
        </Row2>{felder}</div>
      </details>
    </>
  );
  const sp = r?.best && r.sofort ? r.sofort.kosten - r.best.kosten : null;
  const result = !ladung || ladung.kwhReseau <= 0
    ? <Note>{T(l, 'Der Zielwert liegt nicht über dem Ladestand: nichts zu laden.', 'The target is not above the current charge: nothing to charge.', 'Het doel ligt niet boven het huidige niveau: niets te laden.')}</Note>
    : r?.best ? (
      <>
        <Head label={T(l, 'Günstigster Ladestart', 'Cheapest time to start charging', 'Goedkoopste moment om te laden')} value={zeitpunkt(r.best.debut, l, heute)} sub={T(l, `${geld(r.best.kosten, l, zone)} für ${formatNumber(ladung.kwhReseau, 1, l)} kWh aus dem Netz`, `${geld(r.best.kosten, l, zone)} for ${formatNumber(ladung.kwhReseau, 1, l)} kWh from the grid`, `${geld(r.best.kosten, l, zone)} voor ${formatNumber(ladung.kwhReseau, 1, l)} kWh van het net`)} />
        <Rows rows={[
          [T(l, 'Energie in den Akku', 'Energy into the battery', 'Energie in de accu'), `${formatNumber(ladung.kwhBatterie, 1, l)} kWh`],
          [T(l, 'Ladedauer', 'Charging time', 'Laadduur'), `${formatNumber(ladung.dureeMin / 60, 2, l)} h`],
          [T(l, 'Fertig um', 'Finished at', 'Klaar om'), zeitpunkt(r.best.fin, l, heute)],
          [T(l, 'Mittlerer Endpreis', 'Average all-in price', 'Gemiddelde eindprijs'), preisText(r.best.preis, l, zone)],
          ...(r.sofort ? [[T(l, 'Sofort laden', 'Charge now', 'Nu laden'), geld(r.sofort.kosten, l, zone)] as [string, string]] : []),
          ...(sp != null ? [[T(l, 'Ersparnis', 'Saving', 'Besparing'), geld(sp, l, zone), true] as [string, string, boolean]] : []),
        ]} />
        <RepliHinweis repli={repli} heute={heute} l={l} />
        {!morgenDa && !repli && <Note>{T(l, 'Morgen ist noch nicht veröffentlicht: das Fenster liegt im Rest von heute.', 'Tomorrow is not published yet: the window is in the rest of today.', 'Morgen is nog niet gepubliceerd: het venster ligt in de rest van vandaag.')}</Note>}
        <MethodLink href={methodHref} lang={l} />
      </>
    ) : <Note>{T(l, `Die Ladung dauert ${formatNumber(ladung.dureeMin / 60, 2, l)} h: so viele veröffentlichte Viertelstunden bleiben heute nicht mehr. Morgen erscheint am frühen Nachmittag.`, `Charging takes ${formatNumber(ladung.dureeMin / 60, 2, l)} h, longer than the published quarter hours left today. Tomorrow appears in the early afternoon.`, `Laden duurt ${formatNumber(ladung.dureeMin / 60, 2, l)} uur, langer dan de gepubliceerde kwartieren die vandaag nog over zijn. Morgen verschijnt begin van de middag.`)}</Note>;
  return <Shell id={id} form={form} result={result} after={<><Note>{wasDrinIst(zone, l, e)}</Note><Quelle l={l} stand={p.stand} bis={tage.at(-1)?.d} /></>} />;
}

/* ------------------------------------------------------------------ VergleichRechner */
type Profil = M.Profil;
const PROFILE = M.PROFILE;
export function VergleichRechner(p: Basis & { kwhJahr?: number; fest?: number; profil?: Profil }) {
  const { lang: l, methodHref, id } = p;
  const zone = p.zone;
  const [kwhJahr, setKwhJahr] = useState(p.kwhJahr ?? 3000);
  const [fest, setFest] = useState(p.fest ?? 30);
  const [profil, setProfil] = useState<Profil>(p.profil ?? 'flach');
  const { e, felder } = useTarif(zone, l, id, p.start ?? {}, p.pln);
  const fn = useMemo(() => M.preisFn(zone, e), [zone, e.aufschlag, e.netz, e.gemeinde, e.zuschlag, e.pln]);
  const tage = (p.tage[zone] ?? []).slice(-30);
  const r = useMemo(() => M.dynamiqueContreFixe({ serie: M.serieAus(tage), kwhParJour: kwhJahr / 365, prixKwh: fn, fixeSousUniteKwh: fest, profil: PROFILE[profil] }), [tage, kwhJahr, fn, fest, profil]);
  const jahr = r.jours ? (r.ecart * 365) / r.jours : 0;
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-kwh`} label={T(l, 'Jahresverbrauch', 'Annual consumption', 'Jaarverbruik')} value={kwhJahr} onChange={setKwhJahr} unit="kWh" max={100000} />
        <NumberField id={`${id}-fest`} label={T(l, 'Ihr Festpreis brutto', 'Your fixed price, gross', 'Je vaste prijs, bruto')} value={fest} onChange={setFest} unit="ct" decimals={2} max={150} help={T(l, 'Arbeitspreis je kWh laut Vertrag', 'Unit rate per kWh from your contract', 'Kale prijs per kWh incl. belasting')} />
        <SelectField id={`${id}-profil`} label={T(l, 'Wann Sie Strom brauchen', 'When you use power', 'Wanneer je stroom gebruikt')} value={profil} onChange={(v) => setProfil(v as Profil)} options={[
          { value: 'flach', label: T(l, 'Gleichmäßig über den Tag', 'Evenly through the day', 'Gelijk verdeeld over de dag') },
          { value: 'abend', label: T(l, 'Vor allem abends (17–22 Uhr)', 'Mostly in the evening (5–10 pm)', 'Vooral ’s avonds (17–22 uur)') },
          { value: 'nacht', label: T(l, 'Vor allem nachts (E-Auto)', 'Mostly at night (EV)', 'Vooral ’s nachts (elektrische auto)') },
          { value: 'mittag', label: T(l, 'Vor allem mittags (10–16 Uhr)', 'Mostly midday (10 am–4 pm)', 'Vooral midden op de dag (10–16 uur)') },
        ]} help={T(l, 'Beispielprofil, keine Messung', 'Example profile, not a measurement', 'Voorbeeldprofiel, geen meting')} />
      </Row2>
      <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Tarif des dynamischen Vertrags', 'Dynamic contract details', 'Gegevens van het dynamische contract')}</summary><div className="mt-3">{felder}</div></details>
    </>
  );
  const besser = r.ecart < 0;
  const result = (
    <>
      <Head label={T(l, `Letzte ${r.jours} Tage: dynamisch ${besser ? 'günstiger' : 'teurer'} um`, `Last ${r.jours} days: dynamic ${besser ? 'cheaper' : 'dearer'} by`, `Laatste ${r.jours} dagen: dynamisch ${besser ? 'goedkoper' : 'duurder'} met`)} value={geld(Math.abs(r.ecart), l, zone)} sub={T(l, `für ${formatNumber(r.kwh, 0, l)} kWh in diesem Zeitraum`, `for ${formatNumber(r.kwh, 0, l)} kWh over that period`, `voor ${formatNumber(r.kwh, 0, l)} kWh in die periode`)} />
      <Rows rows={[
        [T(l, 'Dynamisch, Kosten', 'Dynamic, cost', 'Dynamisch, kosten'), geld(r.coutDynamique, l, zone)],
        [T(l, 'Festpreis, Kosten', 'Fixed price, cost', 'Vaste prijs, kosten'), geld(r.coutFixe, l, zone)],
        [T(l, 'Mittlerer dynamischer Endpreis', 'Average dynamic all-in price', 'Gemiddelde dynamische eindprijs'), preisText(r.prixMoyenDynamique, l, zone)],
        [T(l, 'Aufs Jahr gerechnet (wenn es so bliebe)', 'Over a year (if it stayed like this)', 'Op jaarbasis (als het zo bleef)'), `${jahr < 0 ? '−' : '+'}${geld(Math.abs(jahr), l, zone, 0)}`, true],
      ]} />
      <Note>{T(l, 'Grundgebühren und feste Kosten sind nicht enthalten, weil sie in beiden Verträgen anfallen. Die letzten 30 Tage sind keine Vorhersage: Winter und Sommer unterscheiden sich stark.', 'Standing charges and fixed costs are left out because both contracts carry them. The last 30 days are not a forecast: winter and summer differ a lot.', 'Vaste leveringskosten en netbeheer tellen niet mee, die betaal je bij beide contracten. De laatste 30 dagen zijn geen voorspelling: winter en zomer verschillen sterk.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<><Note>{wasDrinIst(zone, l, e)}</Note><Quelle l={l} stand={p.stand} bis={tage.at(-1)?.d} /></>} />;
}

/* ------------------------------------------------------------------ VerlaufRechner */
export interface Verlauf { tagesmittel: Array<[string, number]>; monate: Array<[string, number]>; negativ: Array<{ d: string; n: number; min: number }> }
export function VerlaufRechner(p: Omit<Basis, 'tage'> & { verlauf: Partial<Record<Zone, Verlauf>>; ansicht?: 'tage' | 'monate' | 'negativ'; kwhMonat?: number }) {
  const { lang: l, methodHref, id } = p;
  const zonen = Object.keys(p.verlauf) as Zone[];
  const [zone, setZone] = useState<Zone>(p.zone);
  const [ansicht, setAnsicht] = useState<'tage' | 'monate' | 'negativ'>(p.ansicht ?? 'tage');
  const [kwh, setKwh] = useState(p.kwhMonat ?? 250);
  const v = p.verlauf[zone]!;
  const k = pl(zone) ? p.pln ?? 1 : 1;
  const reihe: Array<[string, number]> = ansicht === 'monate' ? v.monate.slice(-13) : ansicht === 'negativ' ? v.negativ.map((x) => [x.d, x.n]) : v.tagesmittel.slice(-30);
  const werte = reihe.map(([, x]) => x);
  const lbl = (s: string) => (s.length === 7 ? new Intl.DateTimeFormat(LANG_TAGS[l], { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${s}-15T12:00:00Z`)) : datum(s, l));
  const form = (
    <Row2>
      <SelectField id={`${id}-ans`} label={T(l, 'Ansicht', 'View', 'Weergave')} value={ansicht} onChange={(x) => setAnsicht(x as 'tage' | 'monate' | 'negativ')} options={[
        { value: 'tage', label: T(l, 'Tagesmittel, 30 Tage', 'Daily average, 30 days', 'Daggemiddelde, 30 dagen') },
        { value: 'monate', label: T(l, 'Monatsmittel, 13 Monate', 'Monthly average, 13 months', 'Maandgemiddelde, 13 maanden') },
        { value: 'negativ', label: T(l, 'Negative Viertelstunden je Tag', 'Negative quarter hours per day', 'Negatieve kwartieren per dag') },
      ]} />
      <NumberField id={`${id}-kwh`} label={T(l, 'Ihr Verbrauch pro Monat', 'Your use per month', 'Je verbruik per maand')} value={kwh} onChange={setKwh} unit="kWh" max={50000} help={T(l, 'Für den Börsenanteil Ihrer Rechnung', 'For the exchange share of your bill', 'Voor het beursdeel van je rekening')} />
      <ZoneWahl id={id} l={l} zonen={zonen} zone={zone} setZone={setZone} />
    </Row2>
  );
  const mT = v.tagesmittel.slice(-30).map(([, x]) => x);
  const m30 = M.mittel(mT);
  const mon = v.monate.slice(-13);
  const negSum = v.negativ.reduce((s, x) => s + x.n, 0);
  const negTage = v.negativ.filter((x) => x.n > 0).length;
  const result = ansicht === 'negativ' ? (
    <>
      <Head label={T(l, `Negative Viertelstunden in ${v.negativ.length} Tagen`, `Negative quarter hours in ${v.negativ.length} days`, `Negatieve kwartieren in ${v.negativ.length} dagen`)} value={formatNumber(negSum, 0, l)} sub={T(l, `an ${negTage} Tagen, ${zoneName(zone, l)}`, `on ${negTage} days, ${zoneName(zone, l)}`, `op ${negTage} dagen, ${zoneName(zone, l)}`)} />
      <Rows rows={[
        [T(l, 'Tiefster Börsenpreis', 'Lowest exchange price', 'Laagste beursprijs'), preisText(M.spotEnSousUnite(Math.min(...v.negativ.map((x) => x.min)), k), l, zone)],
        [T(l, 'Entspricht Stunden', 'Equivalent hours', 'Komt overeen met uren'), formatNumber(negSum / 4, 2, l)],
      ]} />
      <MethodLink href={methodHref} lang={l} />
    </>
  ) : (
    <>
      <Head label={T(l, 'Börsenpreis, Mittel der letzten 30 Tage', 'Exchange price, last 30 days average', 'Beursprijs, gemiddelde laatste 30 dagen')} value={preisText(M.spotEnSousUnite(m30, k), l, zone)} sub={T(l, `Börsenanteil für ${formatNumber(kwh, 0, l)} kWh: ${geld((kwh * M.spotEnSousUnite(m30, k)) / 100, l, zone)}`, `Exchange share for ${formatNumber(kwh, 0, l)} kWh: ${geld((kwh * M.spotEnSousUnite(m30, k)) / 100, l, zone)}`, `Beursdeel voor ${formatNumber(kwh, 0, l)} kWh: ${geld((kwh * M.spotEnSousUnite(m30, k)) / 100, l, zone)}`)} />
      <Rows rows={[
        [T(l, `Monat ${lbl(mon.at(-1)![0])}`, `Month ${lbl(mon.at(-1)![0])}`, `Maand ${lbl(mon.at(-1)![0])}`), preisText(M.spotEnSousUnite(mon.at(-1)![1], k), l, zone)],
        [T(l, `Vor einem Jahr (${lbl(mon[0][0])})`, `A year earlier (${lbl(mon[0][0])})`, `Een jaar eerder (${lbl(mon[0][0])})`), preisText(M.spotEnSousUnite(mon[0][1], k), l, zone)],
        [T(l, 'Höchstes Tagesmittel (30 Tage)', 'Highest daily average (30 days)', 'Hoogste daggemiddelde (30 dagen)'), preisText(M.spotEnSousUnite(Math.max(...mT), k), l, zone)],
        [T(l, 'Tiefstes Tagesmittel (30 Tage)', 'Lowest daily average (30 days)', 'Laagste daggemiddelde (30 dagen)'), preisText(M.spotEnSousUnite(Math.min(...mT), k), l, zone)],
      ]} />
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  const max = Math.max(...werte, 1), min = Math.min(...werte, 0);
  const W = 960, H = 180;
  const y = (x: number) => 10 + ((max - x) / (max - min || 1)) * (H - 20);
  const bw = W / Math.max(werte.length, 1);
  return <Shell id={id} form={form} result={result} after={<>
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-auto w-full" role="img" aria-label={T(l, 'Verlauf', 'History', 'Verloop')}>
        {werte.map((x, i) => <rect key={i} x={i * bw + 1} y={Math.min(y(x), y(0))} width={Math.max(1, bw - 2)} height={Math.max(1, Math.abs(y(x) - y(0)))} className={ansicht === 'negativ' ? 'fill-emerald-700' : x < 0 ? 'fill-emerald-700' : 'fill-accent-500'} />)}
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="stroke-navy-400" strokeWidth="1" />
        {reihe.map(([d], i) => (i % Math.ceil(reihe.length / 6) === 0 ? <text key={d} x={i * bw} y={H + 14} className="fill-navy-600" fontSize="13">{lbl(d)}</text> : null))}
      </svg>
      <figcaption className="mt-1 text-xs text-navy-600">{ansicht === 'negativ' ? T(l, 'Anzahl der Viertelstunden mit negativem Börsenpreis je Tag', 'Number of quarter hours with a negative exchange price per day', 'Aantal kwartieren met negatieve beursprijs per dag') : T(l, 'Börsenpreis ohne Steuern und Netz', 'Exchange price without taxes or grid fees', 'Beursprijs zonder belastingen en netkosten')}</figcaption>
    </figure>
    <Quelle l={l} stand={p.stand} />
  </>} />;
}

/* ------------------------------------------------------------------ GasRekenhulp (NL) */
export interface CbsMaand { maand: string; levIncl: number; ebIncl: number; levExcl: number }
export function GasRekenhulp({ lang: l, methodHref, id, cbs, verbruik: v0 }: { lang: L; methodHref?: string; id: string; cbs: CbsMaand[]; verbruik?: number }) {
  const laatst = cbs.at(-1)!;
  const [levCt, setLevCt] = useState(Math.round(laatst.levExcl * 10000) / 100);
  const lev = levCt / 100;
  const [m3, setM3] = useState(v0 ?? 1000);
  const g = M.gasPrijs(lev);
  const gemiddeld = laatst.levIncl + laatst.ebIncl;
  const maand = (m3 * g.totaal) / 12;
  const mnd = (s: string) => new Intl.DateTimeFormat(LANG_TAGS[l], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${s}-15T12:00:00Z`));
  const eu3 = (x: number) => `${formatMoney(x, 3, l)}/m³`;
  const form = (
    <Row2>
      <NumberField id={`${id}-lev`} label={T(l, 'Lieferpreis Gas ohne MwSt. (Cent je m³)', 'Gas supply price excl. VAT (cents per m³)', 'Leveringsprijs gas excl. btw (cent per m³)')} value={levCt} onChange={setLevCt} unit="ct/m³" decimals={2} max={1000} help={T(l, `Voreingestellt: CBS-Mittel ${mnd(laatst.maand)}`, `Preset: CBS average for ${mnd(laatst.maand)}`, `Ingevuld: CBS-gemiddelde ${mnd(laatst.maand)}`)} />
      <NumberField id={`${id}-m3`} label={T(l, 'Verbrauch pro Jahr', 'Use per year', 'Verbruik per jaar')} value={m3} onChange={setM3} unit="m³" max={100000} help={T(l, 'Laut Jahresrechnung', 'From your annual statement', 'Volgens je jaarafrekening')} />
    </Row2>
  );
  const result = (
    <>
      <Head label={T(l, 'Gaspreis pro m³ mit Steuern', 'Gas price per m³ with taxes', 'Gasprijs per m³ met belastingen')} value={formatMoney(g.totaal, 3, l)} sub={T(l, `etwa ${formatMoney(maand, 0, l)} pro Monat für ${formatNumber(m3, 0, l)} m³ im Jahr`, `about ${formatMoney(maand, 0, l)} a month for ${formatNumber(m3, 0, l)} m³ a year`, `zo’n ${formatMoney(maand, 0, l)} per maand bij ${formatNumber(m3, 0, l)} m³ per jaar`)} />
      <Rows rows={[
        [T(l, 'Lieferpreis', 'Supply price', 'Leveringsprijs'), eu3(g.levering)],
        [T(l, 'Energiesteuer', 'Energy tax', 'Energiebelasting'), eu3(g.eb)],
        [T(l, `MwSt. ${formatNumber(P.nl.btw * 100, 0, l)} %`, `VAT ${formatNumber(P.nl.btw * 100, 0, l)}%`, `Btw ${formatNumber(P.nl.btw * 100, 0, l)} %`), eu3(g.btw)],
        [T(l, `CBS-Mittel variabel, ${mnd(laatst.maand)}`, `CBS variable average, ${mnd(laatst.maand)}`, `CBS-gemiddelde variabel, ${mnd(laatst.maand)}`), eu3(gemiddeld), true],
      ]} />
      <Note>{T(l, 'Ohne Netzkosten und feste Lieferkosten, die je Anschluss und Jahr anfallen.', 'Grid costs and the fixed supply charge, billed per connection per year, are not included.', 'Zonder netbeheerkosten en vaste leveringskosten, die je per aansluiting per jaar betaalt.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<>
    <details className="mt-4 rounded-lg border border-navy-200 px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'CBS-Monatsmittel, 12 Monate', 'CBS monthly averages, 12 months', 'CBS-maandgemiddelden, 12 maanden')}</summary>
      <div className="mt-2 overflow-x-auto"><table className="w-full text-sm">
        <thead><tr><th scope="col" className="py-1 text-left text-navy-700">{T(l, 'Monat', 'Month', 'Maand')}</th><th scope="col" className="py-1 text-right text-navy-700">{T(l, 'Lieferung', 'Supply', 'Levering')}</th><th scope="col" className="py-1 text-right text-navy-700">{T(l, 'Mit Steuer', 'With tax', 'Met belasting')}</th></tr></thead>
        <tbody className="divide-y divide-navy-100">{cbs.slice(-12).reverse().map((c) => <tr key={c.maand}><td className="py-1 text-navy-800">{mnd(c.maand)}</td><td className="tabular-nums py-1 text-right text-navy-800">{eu3(c.levIncl)}</td><td className="tabular-nums py-1 text-right font-medium text-navy-900">{eu3(c.levIncl + c.ebIncl)}</td></tr>)}</tbody>
      </table></div>
    </details>
    <p className="mt-3 text-xs text-navy-600">{T(l, 'Quelle: ', 'Source: ', 'Bron: ')}<a href={P.sources.cbs.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">CBS StatLine 85592NED</a> (<a href={P.sources.cbsLizenz.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">CC BY 4.0</a>), {T(l, 'inkl. MwSt.', 'incl. VAT', 'incl. btw')}</p>
  </>} />;
}
export { istTag };
