/**
 * Rechner rund um Haus und Verbrauch (Motor : lib/engine/haus.ts) :
 *   BalkonRechner       DE : Ertrag und Amortisation eines Steckersolargeräts
 *   PvRechner           DE und NL : Photovoltaik-Ertrag, Einspeisung bzw. Saldering, Amortisation
 *   WpKostenRechner     DE und NL : Wärmepumpe (auch hybrid) gegen Gaskessel, Förderung, Amortisation
 *   GasDeRechner        DE : Gaskosten aus Zählerstand, Brennwert und Zustandszahl
 *   GeraeteRechner      DE : Stromverbrauch eines Geräts (Energielabel, Wasser, Watt)
 *   HaushaltRechner     DE und NL : Haushaltsverbrauch gegen den Durchschnitt, Abschlag
 *   EbRekenhulp         NL : energiebelasting 2026 op stroom en gas
 *   CapaciteitRekenhulp BE : capaciteitstarief in Vlaanderen
 * Erste Darstellung = Werte des Builds (keine Uhrzeit, keine URL beim ersten Rendern).
 */
import { useState } from 'react';
import * as H from '../../lib/engine/haus';
import type { Einspeiseart } from '../../lib/engine/eigen';
import { minVergoeding } from '../../lib/engine/eigen';
import { P } from '../../lib/engine/params';
import { formatNumber, formatMoney, formatPercent, displayDate } from '../../lib/format';
import { LANG_TAGS } from '../../data/site-config';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import { Shell, Head, Rows, Note, MethodLink, Row2, T, type L } from '../calc/kit';

type SK = keyof typeof P.sources;
const kwhT = (x: number, l: L) => `${formatNumber(x, 0, l)} kWh`;
const ctT = (x: number, l: L, d = 2) => `${formatNumber(x, d, l)} ct/kWh`;
const eu = (x: number, l: L, d = 0) => formatMoney(x, d, l);
const datum = (iso: string, l: L) => displayDate(iso, LANG_TAGS[l]);
const jahreT = (x: number, l: L) => (Number.isFinite(x) ? T(l, `${formatNumber(x, 1, l)} Jahre`, `${formatNumber(x, 1, l)} years`, `${formatNumber(x, 1, l)} jaar`) : T(l, 'nie', 'never', 'nooit'));
const Quellen = ({ l, keys }: { l: L; keys: SK[] }) => (
  <p className="mt-3 text-xs text-navy-600">{T(l, 'Quellen: ', 'Sources: ', 'Bronnen: ')}{keys.map((k, i) => (
    <span key={k}>{i > 0 ? ', ' : ''}<a href={P.sources[k].url} target="_blank" rel="nofollow noopener noreferrer" className="underline">{P.sources[k].label[l]}</a></span>
  ))}</p>
);
const PreisNote = ({ l, von, bis }: { l: L; von: string; bis: string }) => (
  <>{T(l, `Strompreis voreingestellt: Börsenmittel ${datum(von, l)} bis ${datum(bis, l)} (Bundesnetzagentur | SMARD.de, CC BY 4.0) plus Netzentgelt, Steuern, Umlagen und Umsatzsteuer.`, `Preset power price: exchange average ${datum(von, l)} to ${datum(bis, l)} (Bundesnetzagentur | SMARD.de, CC BY 4.0) plus grid fee, taxes, levies and VAT.`, `Ingevulde Duitse stroomprijs: beursgemiddelde ${datum(von, l)} tot ${datum(bis, l)} (Bundesnetzagentur | SMARD.de, CC BY 4.0) plus netkosten, belastingen en btw.`)}</>
);

/* ------------------------------------------------------------------ Balkonkraftwerk */
export function BalkonRechner({ lang: l, methodHref, id, preisCt, von, bis }: { lang: L; methodHref?: string; id: string; preisCt: number; von: string; bis: string }) {
  const [wp, setWp] = useState(800);
  const [ertrag, setErtrag] = useState(800);
  const [eigen, setEigen] = useState(70);
  const [preis, setPreis] = useState(preisCt);
  const [kosten, setKosten] = useState(500);
  const r = H.balkon({ wp, ertrag, eigen: eigen / 100, preisCt: preis, kosten });
  const form = (
    <Row2>
      <NumberField id={`${id}-wp`} label={T(l, 'Modulleistung zusammen', 'Total panel power', 'Totaal paneelvermogen')} value={wp} onChange={setWp} unit="Wp" max={5000} help={T(l, `Erlaubt: bis ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp Module, ${formatNumber(P.de.steckersolar.va_max, 0, l)} VA Wechselrichter`, `Allowed: up to ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp of panels, ${formatNumber(P.de.steckersolar.va_max, 0, l)} VA inverter`, `Toegestaan in Duitsland: ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp`)} />
      <NumberField id={`${id}-ertrag`} label={T(l, 'Ertrag je kWp und Jahr', 'Yield per kWp per year', 'Opbrengst per kWp per jaar')} value={ertrag} onChange={setErtrag} unit="kWh" max={2000} help={T(l, 'Annahme: 800 kWh am Balkon nach Süden; senkrecht oder Ost/West weniger', 'Assumption: 800 kWh on a south-facing balcony; less when vertical or east/west', 'Aanname: 800 kWh op het zuiden')} />
      <NumberField id={`${id}-eigen`} label={T(l, 'Davon selbst verbraucht', 'Share used at home', 'Zelf verbruikt')} value={eigen} onChange={setEigen} unit="%" max={100} help={T(l, 'Annahme: 70 %; der Rest fließt ohne Vergütung ins Netz', 'Assumption: 70%; the rest flows into the grid unpaid', 'Aanname: 70 %')} />
      <NumberField id={`${id}-preis`} label={T(l, 'Strompreis brutto', 'Power price, gross', 'Stroomprijs bruto')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={T(l, 'Voreingestellt: Endpreis beim Börsenmittel der letzten 30 Tage', 'Preset: all-in price at the 30-day exchange average', 'Ingevuld: Duitse eindprijs')} />
      <NumberField id={`${id}-kosten`} label={T(l, 'Kaufpreis mit Halterung', 'Price incl. mounting', 'Aankoopprijs')} value={kosten} onChange={setKosten} unit="€" max={100000} help={T(l, 'Annahme: 500 €; tragen Sie Ihr Angebot ein', 'Assumption: €500; enter your own quote', 'Aanname: 500 €')} />
    </Row2>
  );
  const result = (
    <>
      <Head label={T(l, 'Ersparnis pro Jahr', 'Saving per year', 'Besparing per jaar')} value={eu(r.ersparnis, l)} sub={T(l, `Amortisation: ${jahreT(r.amortisation, l)}`, `Pays back in ${jahreT(r.amortisation, l)}`, `Terugverdiend in ${jahreT(r.amortisation, l)}`)} />
      <Rows rows={[
        [T(l, 'Erzeugung pro Jahr', 'Output per year', 'Opwek per jaar'), kwhT(r.erzeugt, l)],
        [T(l, 'Selbst verbraucht', 'Used at home', 'Zelf verbruikt'), kwhT(r.eigenKwh, l)],
        [T(l, 'Ohne Vergütung ins Netz', 'Exported unpaid', 'Onbetaald teruggeleverd'), kwhT(r.ueberschuss, l)],
        [T(l, 'Ersparnis pro Monat', 'Saving per month', 'Besparing per maand'), eu(r.ersparnis / 12, l, 2)],
        [T(l, 'Amortisation', 'Payback', 'Terugverdientijd'), jahreT(r.amortisation, l), true],
      ]} />
      {r.ueberWp && <Note>{T(l, `Mehr als ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp gilt nicht mehr als Steckersolargerät: dann gelten die Regeln einer normalen Solaranlage.`, `More than ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp no longer counts as a plug-in solar device: normal solar system rules then apply.`, `Boven ${formatNumber(P.de.steckersolar.wp_max, 0, l)} Wp geldt het niet meer als stekkerpaneel.`)}</Note>}
      <Note>{T(l, 'Liegt die Modulleistung über der Wechselrichterleistung, kappt der Wechselrichter die Mittagsspitze; der Rechner zieht dafür nichts ab. ', 'If panel power exceeds inverter power, the inverter clips the midday peak; the calculator does not deduct this. ', 'Boven het omvormervermogen wordt de piek afgekapt; niet afgetrokken. ')}<PreisNote l={l} von={von} bis={bis} /></Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={['eeg8', 'bnetzaBalkon', 'ustg', 'smard']} />} />;
}

/* ------------------------------------------------------------------ Photovoltaik */
type Land = 'DE' | 'NL';
export function PvRechner({ lang: l, methodHref, id, land: land0, preisDe, prijsNl, kaleNl }: { lang: L; methodHref?: string; id: string; land: Land | 'beide'; preisDe: number; prijsNl: number; kaleNl: number }) {
  const [land, setLand] = useState<Land>(land0 === 'NL' ? 'NL' : 'DE');
  const nl = land === 'NL';
  const [kwp, setKwp] = useState(nl ? 4 : 8);
  const [ertrag, setErtrag] = useState(nl ? 875 : 950);
  const [eigen, setEigen] = useState(30);
  const [verbruik, setVerbruik] = useState(nl ? 2800 : 4000);
  const [art, setArt] = useState<Einspeiseart>('teil');
  const [preis, setPreis] = useState(nl ? prijsNl : preisDe);
  const [verg, setVerg] = useState(Math.round(minVergoeding(kaleNl) * 100) / 100);
  const [tlk, setTlk] = useState(0);
  const [kosten, setKosten] = useState(nl ? 4500 : 12000);
  const wechsel = (x: string) => {
    const n = x === 'NL';
    setLand(x as Land); setKwp(n ? 4 : 8); setErtrag(n ? 875 : 950); setPreis(n ? prijsNl : preisDe); setKosten(n ? 4500 : 12000); setVerbruik(n ? 2800 : 4000);
  };
  const de = H.pvDe({ kwp, ertrag, eigen: eigen / 100, preisCt: preis, art, kosten });
  const n = H.pvNl({ kwp, ertrag, direct: eigen / 100, verbruik, prijsIncl: preis, vergoeding: verg, terugleverkosten: tlk, kosten });
  const form = (
    <>
      {land0 === 'beide' && <Toggle id={`${id}-land`} label={T(l, 'Land', 'Country', 'Land')} value={land} onChange={wechsel} options={[{ value: 'DE', label: T(l, 'Deutschland', 'Germany', 'Duitsland') }, { value: 'NL', label: T(l, 'Niederlande', 'Netherlands', 'Nederland') }]} />}
      {!nl && <Toggle id={`${id}-art`} label={T(l, 'Einspeisung', 'Export', 'Teruglevering')} value={art} onChange={(v) => setArt(v as Einspeiseart)} options={[{ value: 'teil', label: T(l, 'Überschuss', 'Surplus', 'Overschot') }, { value: 'voll', label: T(l, 'Alles', 'Everything', 'Alles') }]} />}
      <Row2>
        <NumberField id={`${id}-kwp`} label={T(l, 'Leistung der Anlage', 'System size', 'Vermogen van de panelen')} value={kwp} onChange={setKwp} unit="kWp" decimals={2} max={100} help={T(l, 'Summe der Module, z. B. 20 × 0,42 kWp', 'Sum of the panels, e.g. 20 × 0.42 kWp', 'Som van de panelen, bijvoorbeeld 10 × 0,43 kWp')} />
        <NumberField id={`${id}-ertrag`} label={T(l, 'Ertrag je kWp und Jahr', 'Yield per kWp per year', 'Opbrengst per kWp per jaar')} value={ertrag} onChange={setErtrag} unit="kWh" max={2000} help={nl ? T(l, 'Annahme: 875 kWh', 'Assumption: 875 kWh, south-facing roof', 'Aanname: 875 kWh bij een dak op het zuiden') : T(l, 'Annahme: 950 kWh, Süddach', 'Assumption: 950 kWh, south-facing roof', 'Aanname: 950 kWh')} />
        {(nl || art === 'teil') && <NumberField id={`${id}-eigen`} label={T(l, 'Direkt selbst verbraucht', 'Used directly at home', 'Direct zelf verbruikt')} value={eigen} onChange={setEigen} unit="%" max={100} help={T(l, 'Annahme: 30 % ohne Speicher', 'Assumption: 30% without a battery', 'Aanname: 30 % zonder batterij')} />}
        {nl && <NumberField id={`${id}-verbruik`} label={T(l, 'Jahresverbrauch', 'Annual use', 'Jaarverbruik')} value={verbruik} onChange={setVerbruik} unit="kWh" max={100000} help={T(l, 'Laut Jahresabrechnung', 'From your annual statement', 'Volgens je jaarafrekening')} />}
        {(nl || art === 'teil') && <NumberField id={`${id}-preis`} label={T(l, 'Strompreis brutto', 'Power price, gross', 'Stroomprijs incl. belastingen')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={nl ? T(l, 'CBS-Mittel variabel + Energiesteuer', 'Preset: CBS variable average + energy tax', 'Ingevuld: CBS-gemiddelde variabel + energiebelasting') : T(l, 'Voreingestellt: Endpreis beim Börsenmittel der letzten 30 Tage', 'Preset: all-in price at the 30-day exchange average', 'Duitse eindprijs')} />}
        <NumberField id={`${id}-kosten`} label={T(l, 'Preis der Anlage', 'System price', 'Prijs van de installatie')} value={kosten} onChange={setKosten} unit="€" max={1000000} help={T(l, 'Annahme: tragen Sie Ihr Angebot ein', 'Assumption: enter your own quote', 'Aanname: vul je eigen offerte in')} />
      </Row2>
      {nl && (
        <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Vergütung und Gebühr ab 2027', 'Feed-in payment and fee from 2027', 'Terugleververgoeding en terugleverkosten')}</summary>
          <div className="mt-3"><Row2>
            <NumberField id={`${id}-verg`} label={T(l, 'Rückliefervergütung', 'Feed-in payment', 'Terugleververgoeding')} value={verg} onChange={setVerg} unit="ct" decimals={2} max={100} help={T(l, 'Gesetzliches Minimum: 50 % des CBS-Lieferpreises', 'Preset: legal minimum, 50% of the CBS supply price', 'Ingevuld: wettelijk minimum, 50 % van de kale CBS-prijs')} />
            <NumberField id={`${id}-tlk`} label={T(l, 'Rückliefergebühr', 'Feed-in fee', 'Terugleverkosten')} value={tlk} onChange={setTlk} unit="ct" decimals={2} max={100} help={T(l, 'Pro kWh laut Vertrag', 'Per kWh in your contract', 'Per teruggeleverde kWh volgens je contract')} />
          </Row2></div>
        </details>
      )}
    </>
  );
  const result = nl ? (
    <>
      <Head label={T(l, 'Ertrag pro Jahr ab 2027', 'Value per year from 2027', 'Opbrengst per jaar vanaf 2027')} value={eu(n.jaar2027, l)} sub={T(l, `Amortisation: ${jahreT(n.terugverdien, l)}`, `Pays back in ${jahreT(n.terugverdien, l)}`, `Terugverdiend in ${jahreT(n.terugverdien, l)}`)} />
      <Rows rows={[
        [T(l, 'Erzeugung pro Jahr', 'Output per year', 'Opwek per jaar'), kwhT(n.opwek, l)],
        [T(l, 'Direkt selbst verbraucht', 'Used directly', 'Direct zelf verbruikt'), eu(n.directWaarde, l)],
        [T(l, 'Rücklieferung 2026 (Saldering)', 'Exports in 2026 (net metering)', 'Teruglevering 2026 (salderen)'), eu(n.waarde2026, l)],
        [T(l, 'Rücklieferung ab 2027', 'Exports from 2027', 'Teruglevering vanaf 2027'), eu(n.waarde2027, l)],
        [T(l, 'Ertrag 2026', 'Value in 2026', 'Opbrengst 2026'), eu(n.jaar2026, l)],
        [T(l, 'Amortisation ab 2027', 'Payback at 2027 values', 'Terugverdientijd vanaf 2027'), jahreT(n.terugverdien, l), true],
      ]} />
      <Note>{T(l, 'Bis 31.12.2026 wird zurückgelieferter Strom saldiert, ab 2027 gibt es nur die Vergütung. Preise und Energiesteuer 2026 gelten als Annahme weiter; ohne Wartung, Wechselrichtertausch und Rendite.', 'Until 31 December 2026 exports are offset; from 2027 only the feed-in payment remains. 2026 prices and tax are assumed to continue; maintenance, inverter replacement and interest are left out.', 'Tot en met 31 december 2026 wordt teruglevering gesaldeerd, vanaf 2027 krijg je alleen de vergoeding. Prijzen en energiebelasting van 2026 gelden als aanname; zonder onderhoud, nieuwe omvormer en rente.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  ) : (
    <>
      <Head label={T(l, 'Ertrag pro Jahr', 'Value per year', 'Opbrengst per jaar')} value={eu(de.summe, l)} sub={T(l, `Amortisation: ${jahreT(de.amortisation, l)}`, `Pays back in ${jahreT(de.amortisation, l)}`, `Terugverdiend in ${jahreT(de.amortisation, l)}`)} />
      <Rows rows={[
        [T(l, 'Erzeugung pro Jahr', 'Output per year', 'Opwek per jaar'), kwhT(de.erzeugt, l)],
        [T(l, `Einspeisevergütung (${ctT(de.satz, l)})`, `Feed-in tariff (${ctT(de.satz, l)})`, `Vergoeding (${ctT(de.satz, l)})`), eu(de.verguetung, l)],
        ...(art === 'teil' ? [[T(l, 'Eigenverbrauch spart', 'Own use saves', 'Eigen verbruik bespaart'), eu(de.ersparnis, l)] as [string, string]] : []),
        [T(l, 'Ertrag je investiertem Euro', 'Return per euro invested', 'Opbrengst per geïnvesteerde euro'), formatPercent(de.rendite, 1, l)],
        [T(l, 'Amortisation', 'Payback', 'Terugverdientijd'), jahreT(de.amortisation, l), true],
      ]} />
      <Note>{T(l, `Einspeisesätze der Bundesnetzagentur für Inbetriebnahme bis ${datum(P.de.einspeiseverguetung_ct.bis, l)}, fest für 20 Jahre. Ohne Wartung, Wechselrichtertausch, Zinsen und Preissteigerung.`, `Federal Network Agency feed-in rates for systems commissioned by ${datum(P.de.einspeiseverguetung_ct.bis, l)}, fixed for 20 years. Maintenance, inverter replacement, interest and price rises are left out.`, `Duitse vergoeding voor ingebruikname tot ${datum(P.de.einspeiseverguetung_ct.bis, l)}.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={nl ? ['rijksSaldering', 'acmSalderen', 'cbs'] : ['bnetzaEeg', 'smard']} />} />;
}

/* ------------------------------------------------------------------ Wärmepumpe gegen Gas */
export function WpKostenRechner({ lang: l, methodHref, id, land: land0, stromDe, gasDe, stromNl, gasNlM3, gasNlVast }: { lang: L; methodHref?: string; id: string; land: Land | 'beide'; stromDe: number; gasDe: number; stromNl: number; gasNlM3: number; gasNlVast: number }) {
  const [land, setLand] = useState<Land>(land0 === 'NL' ? 'NL' : 'DE');
  const nl = land === 'NL';
  const m3kwh = P.nl.gas_kwh_m3;
  const [gas, setGas] = useState(nl ? P.nl.milieucentraal.gas_m3 : 18000);
  const [jaz, setJaz] = useState(3.5);
  const [hybrid, setHybrid] = useState(nl ? 'hybrid' : 'voll');
  const [anteil, setAnteil] = useState(70);
  const [strom, setStrom] = useState(nl ? stromNl : stromDe);
  const [gasPreis, setGasPreis] = useState(nl ? gasNlM3 : gasDe);
  const [grund, setGrund] = useState(nl ? gasNlVast : 0);
  const [invest, setInvest] = useState(nl ? 5000 : 30000);
  const [wpKw, setWpKw] = useState(4);
  const [aaa, setAaa] = useState(true);
  const [klima, setKlima] = useState(false);
  const [eink, setEink] = useState<H.Einkommen>('nein');
  const wechsel = (x: string) => {
    const n = x === 'NL';
    setLand(x as Land); setGas(n ? P.nl.milieucentraal.gas_m3 : 18000); setHybrid(n ? 'hybrid' : 'voll'); setStrom(n ? stromNl : stromDe); setGasPreis(n ? gasNlM3 : gasDe); setGrund(n ? gasNlVast : 0); setInvest(n ? 5000 : 30000);
  };
  const k = H.kfw({ kosten: invest, klima, einkommen: eink });
  const foerderung = nl ? H.isde({ kw: wpKw, label: aaa }) : k.zuschuss;
  const gasKwh = nl ? gas * m3kwh : gas;
  const gasCt = nl ? (gasPreis * 100) / m3kwh : gasPreis;
  const r = H.waermepumpe({ gasKwh, wirkungsgrad: P.annahmen.kessel_wirkungsgrad, jaz, anteil: hybrid === 'hybrid' ? anteil / 100 : 1, stromCt: strom, gasCt, gasGrundJahr: grund, invest, foerderung });
  const form = (
    <>
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {land0 === 'beide' && <Toggle id={`${id}-land`} label={T(l, 'Land', 'Country', 'Land')} value={land} onChange={wechsel} options={[{ value: 'DE', label: T(l, 'Deutschland', 'Germany', 'Duitsland') }, { value: 'NL', label: T(l, 'Niederlande', 'Netherlands', 'Nederland') }]} />}
        <Toggle id={`${id}-typ`} label={T(l, 'Wärmepumpe', 'Heat pump', 'Soort warmtepomp')} value={hybrid} onChange={setHybrid} options={[{ value: 'voll', label: T(l, 'Allein', 'Alone', 'All-electric') }, { value: 'hybrid', label: T(l, 'Hybrid', 'Hybrid', 'Hybride') }]} />
      </div>
      <Row2>
        <NumberField id={`${id}-gas`} label={T(l, nl ? 'Gasverbrauch heute' : 'Gasverbrauch heute', 'Gas use today', 'Gasverbruik nu')} value={gas} onChange={setGas} unit={nl ? 'm³' : 'kWh'} max={1000000} help={T(l, 'Pro Jahr, laut Abrechnung', 'Per year, from your bill', 'Per jaar, volgens je jaarafrekening')} />
        <NumberField id={`${id}-jaz`} label={T(l, 'Jahresarbeitszahl', 'Seasonal efficiency (SCOP)', 'Seizoensrendement (SCOP)')} value={jaz} onChange={setJaz} unit="" decimals={1} max={8} help={T(l, 'Annahme: 3,5; Altbau mit Heizkörpern eher 3', 'Assumption: 3.5; older homes with radiators nearer 3', 'Aanname: 3,5')} />
        {hybrid === 'hybrid' && <NumberField id={`${id}-anteil`} label={T(l, 'Anteil der Wärme aus der Wärmepumpe', 'Share of heat from the heat pump', 'Deel van de warmte uit de warmtepomp')} value={anteil} onChange={setAnteil} unit="%" max={100} help={T(l, 'Annahme: 70 %, den Rest liefert der Kessel', 'Assumption: 70%, the boiler covers the rest', 'Aanname: 70 %, de ketel doet de rest')} />}
        <NumberField id={`${id}-strom`} label={T(l, 'Strompreis brutto', 'Power price, gross', 'Stroomprijs incl. belastingen')} value={strom} onChange={setStrom} unit="ct" decimals={2} max={200} help={nl ? T(l, 'CBS-Mittel', 'Preset: CBS variable average + energy tax', 'Ingevuld: CBS-gemiddelde + energiebelasting') : T(l, 'Voreingestellt: Endpreis der letzten 30 Tage; mit Wärmepumpentarif eintragen', 'Preset: 30-day all-in price; enter a heat pump tariff if you have one', 'Duitse eindprijs')} />
        <NumberField id={`${id}-gp`} label={T(l, 'Gaspreis brutto', 'Gas price, gross', 'Gasprijs incl. belastingen')} value={gasPreis} onChange={setGasPreis} unit={nl ? '€/m³' : 'ct'} decimals={nl ? 3 : 2} max={nl ? 10 : 100} help={nl ? T(l, 'CBS-Mittel', 'Preset: CBS variable average + energy tax', 'Ingevuld: CBS-gemiddelde variabel + energiebelasting') : T(l, 'Voreingestellt: Mittel laut Monitoringbericht 2025', 'Preset: average per the 2025 monitoring report', 'Duits gemiddelde')} />
        <NumberField id={`${id}-grund`} label={T(l, 'Fixkosten Gas pro Jahr', 'Fixed gas costs per year', 'Vaste kosten gas per jaar')} value={grund} onChange={setGrund} unit="€" decimals={2} max={5000} help={nl ? T(l, 'CBS: Netzkosten Gas', 'Preset: CBS gas network charge', 'Ingevuld: CBS-gemiddelde netbeheer gas; vervalt alleen zonder gas') : T(l, 'Grundpreis, entfällt nur ohne Gasanschluss', 'Standing charge, saved only if gas is cut off', 'Vaste kosten')} />
        <NumberField id={`${id}-invest`} label={T(l, 'Preis mit Einbau', 'Price installed', 'Prijs met installatie')} value={invest} onChange={setInvest} unit="€" max={1000000} help={T(l, 'Annahme: tragen Sie Ihr Angebot ein', 'Assumption: enter your own quote', 'Aanname: vul je offerte in')} />
        {nl && <NumberField id={`${id}-wpkw`} label={T(l, 'Heizleistung der Wärmepumpe', 'Heat pump rated output', 'Vermogen van de warmtepomp')} value={wpKw} onChange={setWpKw} unit="kW" decimals={1} max={100} help={T(l, 'Laut RVO-Geräteliste', 'From the RVO equipment list', 'Volgens de RVO-apparatenlijst; voor de ISDE')} />}
      </Row2>
      {nl && <Toggle id={`${id}-aaa`} label={T(l, 'Energielabel A+++', 'Energy label A+++', 'Energielabel A+++ (bonus)')} value={aaa ? 'ja' : 'nee'} onChange={(v) => setAaa(v === 'ja')} options={[{ value: 'ja', label: T(l, 'Ja', 'Yes', 'Ja') }, { value: 'nee', label: T(l, 'Nein', 'No', 'Nee') }]} />}
      {!nl && (
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <Toggle id={`${id}-klima`} label={T(l, 'Klimageschwindigkeitsbonus', 'Climate speed bonus', 'Klimaatbonus')} value={klima ? 'ja' : 'nein'} onChange={(v) => setKlima(v === 'ja')} options={[{ value: 'nein', label: T(l, 'Nein', 'No', 'Nee') }, { value: 'ja', label: T(l, 'Ja', 'Yes', 'Ja') }]} />
          <SelectField id={`${id}-eink`} label={T(l, 'Zu versteuerndes Haushaltseinkommen', 'Taxable household income', 'Belastbaar huishoudinkomen')} value={eink} onChange={(v) => setEink(v as H.Einkommen)} options={[
            { value: 'nein', label: T(l, 'über 50.000 € (kein Einkommensbonus)', 'over €50,000 (no income bonus)', 'boven 50.000 €') },
            { value: 'bis50000', label: T(l, `bis 50.000 € (+${formatNumber(P.de.kfw.einkommen.bis50000 * 100, 0, l)} %)`, `up to €50,000 (+${formatNumber(P.de.kfw.einkommen.bis50000 * 100, 0, l)}%)`, 'tot 50.000 €') },
            { value: 'bis40000', label: T(l, `bis 40.000 € (+${formatNumber(P.de.kfw.einkommen.bis40000 * 100, 0, l)} %)`, `up to €40,000 (+${formatNumber(P.de.kfw.einkommen.bis40000 * 100, 0, l)}%)`, 'tot 40.000 €') },
            { value: 'bis30000', label: T(l, `bis 30.000 € (+${formatNumber(P.de.kfw.einkommen.bis30000 * 100, 0, l)} %)`, `up to €30,000 (+${formatNumber(P.de.kfw.einkommen.bis30000 * 100, 0, l)}%)`, 'tot 30.000 €') },
          ]} />
        </div>
      )}
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Heizkosten pro Jahr mit Wärmepumpe', 'Heating cost per year with a heat pump', 'Stookkosten per jaar met warmtepomp')} value={eu(r.kostenWp, l)} sub={T(l, `${eu(r.ersparnis, l)} ${r.ersparnis >= 0 ? 'weniger' : 'mehr'} als mit Gas (${eu(r.kostenGas, l)})`, `${eu(Math.abs(r.ersparnis), l)} ${r.ersparnis >= 0 ? 'less' : 'more'} than with gas (${eu(r.kostenGas, l)})`, `${eu(Math.abs(r.ersparnis), l)} ${r.ersparnis >= 0 ? 'minder' : 'meer'} dan met alleen gas (${eu(r.kostenGas, l)})`)} />
      <Rows rows={[
        [T(l, 'Heizwärme pro Jahr', 'Heat needed per year', 'Warmtevraag per jaar'), kwhT(r.waerme, l)],
        [T(l, 'Strom für die Wärmepumpe', 'Power for the heat pump', 'Stroom voor de warmtepomp'), kwhT(r.stromKwh, l)],
        ...(r.restGasKwh > 0 ? [[T(l, 'Restgas', 'Remaining gas', 'Resterend gas'), nl ? `${formatNumber(r.restGasKwh / m3kwh, 0, l)} m³` : kwhT(r.restGasKwh, l)] as [string, string]] : []),
        [nl ? T(l, 'ISDE-Zuschuss', 'ISDE subsidy', 'ISDE-subsidie') : T(l, `KfW-Zuschuss (${formatNumber(k.satz * 100, 0, l)} %)`, `KfW grant (${formatNumber(k.satz * 100, 0, l)}%)`, `KfW-subsidie (${formatNumber(k.satz * 100, 0, l)} %)`), eu(foerderung, l)],
        [T(l, 'Eigenanteil', 'Your share of the price', 'Eigen bijdrage'), eu(r.netto, l)],
        [T(l, 'Amortisation', 'Payback', 'Terugverdientijd'), jahreT(r.amortisation, l), true],
      ]} />
      <Note>{T(l, `Heizwärme = Gasverbrauch × ${formatNumber(P.annahmen.kessel_wirkungsgrad * 100, 0, l)} % Kesselwirkungsgrad (Annahme). Ohne Wartung, Schornsteinfeger, Preissteigerung und Kosten für neue Heizkörper.`, `Heat = gas use × ${formatNumber(P.annahmen.kessel_wirkungsgrad * 100, 0, l)}% boiler efficiency (assumption)${nl ? `, 1 m³ = ${formatNumber(m3kwh, 2, l)} kWh` : ''}. Maintenance, price changes and new radiators are left out.`, `Warmte = gasverbruik × ${formatNumber(m3kwh, 2, l)} kWh per m³ × ${formatNumber(P.annahmen.kessel_wirkungsgrad * 100, 0, l)} % ketelrendement (aanname). Zonder onderhoud, prijsstijging en nieuwe radiatoren.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={nl ? ['rvoIsde', 'cbs'] : ['kfw458', 'monitoringGas', 'smard']} />} />;
}

/* ------------------------------------------------------------------ Gaskosten DE */
export function GasDeRechner({ lang: l, methodHref, id, arbeitspreis }: { lang: L; methodHref?: string; id: string; arbeitspreis: number }) {
  const [modus, setModus] = useState<'m3' | 'kwh'>('m3');
  const [m3, setM3] = useState(1800);
  const [bw, setBw] = useState(P.annahmen.brennwert_kwh_m3);
  const [zz, setZz] = useState(P.annahmen.zustandszahl);
  const [kwhIn, setKwhIn] = useState(18000);
  const [ap, setAp] = useState(arbeitspreis);
  const [grund, setGrund] = useState(0);
  const kwh = modus === 'm3' ? H.gasKwh(m3, bw, zz) : kwhIn;
  const r = H.gasDe({ kwh, arbeitspreisCt: ap, grundMonat: grund });
  const form = (
    <>
      <Toggle id={`${id}-modus`} label={T(l, 'Verbrauch in', 'Consumption in', 'Verbruik in')} value={modus} onChange={(v) => setModus(v as 'm3' | 'kwh')} options={[{ value: 'm3', label: 'm³' }, { value: 'kwh', label: 'kWh' }]} />
      <Row2>
        {modus === 'm3' ? (
          <>
            <NumberField id={`${id}-m3`} label={T(l, 'Verbrauch am Zähler', 'Meter reading difference', 'Verbruik op de meter')} value={m3} onChange={setM3} unit="m³" max={1000000} help={T(l, 'Pro Jahr: Zählerstand neu minus alt', 'Per year: new reading minus old', 'Per jaar')} />
            <NumberField id={`${id}-bw`} label={T(l, 'Brennwert', 'Calorific value', 'Verbrandingswaarde')} value={bw} onChange={setBw} unit="kWh/m³" decimals={3} max={15} help={T(l, 'Auf der Gasrechnung; Annahme 10,0', 'On your gas bill; assumption 10.0', 'Op de rekening')} />
            <NumberField id={`${id}-zz`} label={T(l, 'Zustandszahl', 'Volume correction factor', 'Correctiefactor')} value={zz} onChange={setZz} unit="" decimals={4} max={1.5} help={T(l, 'Auf der Gasrechnung; Annahme 0,95', 'On your gas bill; assumption 0.95', 'Op de rekening')} />
          </>
        ) : (
          <NumberField id={`${id}-kwh`} label={T(l, 'Verbrauch pro Jahr', 'Use per year', 'Verbruik per jaar')} value={kwhIn} onChange={setKwhIn} unit="kWh" max={10000000} help={T(l, 'Laut Jahresabrechnung', 'From your annual statement', 'Volgens je jaarafrekening')} />
        )}
        <NumberField id={`${id}-ap`} label={T(l, 'Arbeitspreis brutto', 'Energy rate, gross', 'Prijs per kWh bruto')} value={ap} onChange={setAp} unit="ct" decimals={2} max={100} help={T(l, 'Aus Ihrem Vertrag; voreingestellt: Mittel laut Monitoringbericht', 'From your contract; preset: monitoring report average', 'Uit je contract')} />
        <NumberField id={`${id}-grund`} label={T(l, 'Grundpreis pro Monat', 'Standing charge per month', 'Vaste kosten per maand')} value={grund} onChange={setGrund} unit="€" decimals={2} max={1000} help={T(l, 'Aus Ihrem Vertrag, brutto; das Mittel oben enthält ihn anteilig', 'From your contract, gross; the preset average already includes a share', 'Uit je contract')} />
      </Row2>
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Gaskosten pro Jahr', 'Gas cost per year', 'Gaskosten per jaar')} value={eu(r.jahr, l)} sub={T(l, `Abschlag rund ${eu(r.monat, l)} im Monat`, `Monthly instalment about ${eu(r.monat, l)}`, `Termijnbedrag zo’n ${eu(r.monat, l)} per maand`)} />
      <Rows rows={[
        [T(l, 'Verbrauch in kWh', 'Use in kWh', 'Verbruik in kWh'), kwhT(kwh, l)],
        [T(l, 'Arbeitspreis × kWh', 'Energy rate × kWh', 'Prijs × kWh'), eu(r.arbeit, l)],
        [T(l, 'Grundpreis', 'Standing charge', 'Vaste kosten'), eu(r.grund, l)],
        [T(l, 'Darin Energiesteuer mit USt', 'Of which energy tax incl. VAT', 'Waarvan energiebelasting incl. btw'), eu(r.energiesteuer, l)],
        [T(l, `Darin CO₂-Preis mit USt (${formatNumber(P.de.gas.co2_eur_t, 0, l)} €/t)`, `Of which CO₂ price incl. VAT (€${formatNumber(P.de.gas.co2_eur_t, 0, l)}/t)`, `Waarvan CO₂-prijs (${formatNumber(P.de.gas.co2_eur_t, 0, l)} €/t)`), eu(r.co2, l)],
        [T(l, 'Pro Monat', 'Per month', 'Per maand'), eu(r.monat, l, 2), true],
      ]} />
      <Note>{T(l, `kWh = m³ × Brennwert × Zustandszahl. Energiesteuer ${formatNumber(P.de.gas.energiesteuer_ct, 2, l)} ct/kWh, CO₂-Preis ${formatNumber(H.co2Ct(), 2, l)} ct/kWh netto, je zuzüglich ${formatNumber(P.de.ust * 100, 0, l)} % Umsatzsteuer: beide sind im Arbeitspreis schon enthalten.`, `kWh = m³ × calorific value × correction factor. Energy tax ${formatNumber(P.de.gas.energiesteuer_ct, 2, l)} ct/kWh and CO₂ price ${formatNumber(H.co2Ct(), 2, l)} ct/kWh net, each plus ${formatNumber(P.de.ust * 100, 0, l)}% VAT: both are already part of the energy rate.`, `kWh = m³ × verbrandingswaarde × correctiefactor.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={['monitoringGas', 'energiestg', 'behg']} />} />;
}

/* ------------------------------------------------------------------ Gerät */
type Geraet = 'kuehl' | 'wasch' | 'dle' | 'watt';
export function GeraeteRechner({ lang: l, methodHref, id, preisCt, von, bis }: { lang: L; methodHref?: string; id: string; preisCt: number; von: string; bis: string }) {
  const [g, setG] = useState<Geraet>('kuehl');
  const [label, setLabel] = useState(150);
  const [w100, setW100] = useState(55);
  const [wg, setWg] = useState(200);
  const [liter, setLiter] = useState(80);
  const [dk, setDk] = useState(28);
  const [watt, setWatt] = useState(100);
  const [std, setStd] = useState(4);
  const [tage, setTage] = useState(365);
  const [preis, setPreis] = useState(preisCt);
  const kwhJahr = g === 'kuehl' ? label : g === 'wasch' ? (w100 / 100) * wg : g === 'dle' ? H.wasserKwh(liter, dk, P.annahmen.dle_wirkungsgrad) * 365 : (watt / 1000) * std * tage;
  const nutzungen = g === 'wasch' ? wg : g === 'watt' ? tage : 365;
  const r = H.geraet({ kwhJahr, preisCt: preis, nutzungen });
  const form = (
    <>
      <SelectField id={`${id}-g`} label={T(l, 'Gerät', 'Appliance', 'Apparaat')} value={g} onChange={(v) => setG(v as Geraet)} options={[
        { value: 'kuehl', label: T(l, 'Kühlschrank oder Gefriergerät (Energielabel)', 'Fridge or freezer (energy label)', 'Koelkast of vriezer (energielabel)') },
        { value: 'wasch', label: T(l, 'Waschmaschine oder Geschirrspüler (Energielabel)', 'Washing machine or dishwasher (energy label)', 'Wasmachine of vaatwasser (energielabel)') },
        { value: 'dle', label: T(l, 'Durchlauferhitzer oder Boiler (Warmwasser)', 'Instantaneous or tank water heater', 'Doorstromer of boiler (warm water)') },
        { value: 'watt', label: T(l, 'Anderes Gerät (Watt und Stunden)', 'Other appliance (watts and hours)', 'Ander apparaat (watt en uren)') },
      ]} />
      <Row2>
        {g === 'kuehl' && <NumberField id={`${id}-label`} label={T(l, 'Verbrauch laut Energielabel', 'Use on the energy label', 'Verbruik op het energielabel')} value={label} onChange={setLabel} unit="kWh" max={5000} help={T(l, 'Angabe „kWh/annum“ auf dem Label; Annahme 150', 'The “kWh/annum” figure on the label; assumption 150', 'De waarde „kWh/annum“; aanname 150')} />}
        {g === 'wasch' && <>
          <NumberField id={`${id}-w100`} label={T(l, 'Verbrauch je 100 Zyklen', 'Use per 100 cycles', 'Verbruik per 100 cycli')} value={w100} onChange={setW100} unit="kWh" decimals={1} max={1000} help={T(l, 'Angabe auf dem Label seit März 2021; Annahme 55', 'Shown on labels since March 2021; assumption 55', 'Op het label sinds maart 2021; aanname 55')} />
          <NumberField id={`${id}-wg`} label={T(l, 'Waschgänge pro Jahr', 'Cycles per year', 'Wasbeurten per jaar')} value={wg} onChange={setWg} unit="" max={3650} help={T(l, 'Annahme: 200, etwa vier pro Woche', 'Assumption: 200, about four a week', 'Aanname: 200')} />
        </>}
        {g === 'dle' && <>
          <NumberField id={`${id}-liter`} label={T(l, 'Warmwasser pro Tag', 'Hot water per day', 'Warm water per dag')} value={liter} onChange={setLiter} unit="l" max={5000} help={T(l, 'Annahme: 80 l, etwa zwei Duschen', 'Assumption: 80 l, about two showers', 'Aanname: 80 l')} />
          <NumberField id={`${id}-dk`} label={T(l, 'Erwärmung um', 'Temperature rise', 'Opwarming')} value={dk} onChange={setDk} unit="K" max={90} help={T(l, 'Annahme: von 10 auf 38 °C = 28 K', 'Assumption: from 10 to 38 °C = 28 K', 'Aanname: van 10 naar 38 °C')} />
        </>}
        {g === 'watt' && <>
          <NumberField id={`${id}-watt`} label={T(l, 'Leistung', 'Power', 'Vermogen')} value={watt} onChange={setWatt} unit="W" max={50000} />
          <NumberField id={`${id}-std`} label={T(l, 'Stunden pro Tag', 'Hours per day', 'Uren per dag')} value={std} onChange={setStd} unit="h" decimals={2} max={24} />
          <NumberField id={`${id}-tage`} label={T(l, 'Tage pro Jahr', 'Days per year', 'Dagen per jaar')} value={tage} onChange={setTage} unit="" max={366} />
        </>}
        <NumberField id={`${id}-preis`} label={T(l, 'Strompreis brutto', 'Power price, gross', 'Stroomprijs bruto')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={T(l, 'Voreingestellt: Endpreis beim Börsenmittel der letzten 30 Tage', 'Preset: all-in price at the 30-day exchange average', 'Duitse eindprijs')} />
      </Row2>
    </>
  );
  const je = g === 'wasch' ? T(l, 'je Waschgang', 'per cycle', 'per wasbeurt') : g === 'watt' ? T(l, 'je Nutzungstag', 'per day of use', 'per gebruiksdag') : T(l, 'je Tag', 'per day', 'per dag');
  const result = (
    <>
      <Head label={T(l, 'Stromverbrauch pro Jahr', 'Electricity use per year', 'Stroomverbruik per jaar')} value={kwhT(r.kwhJahr, l)} sub={T(l, `kostet ${eu(r.kosten, l)} im Jahr`, `costs ${eu(r.kosten, l)} a year`, `kost ${eu(r.kosten, l)} per jaar`)} />
      <Rows rows={[
        [`${T(l, 'Verbrauch', 'Use', 'Verbruik')} ${je}`, `${formatNumber(r.jeNutzung, 2, l)} kWh`],
        [`${T(l, 'Kosten', 'Cost', 'Kosten')} ${je}`, eu(r.kostenJeNutzung, l, 2)],
        [T(l, 'Kosten pro Monat', 'Cost per month', 'Kosten per maand'), eu(r.monat, l, 2)],
        [T(l, 'Kosten pro Jahr', 'Cost per year', 'Kosten per jaar'), eu(r.kosten, l), true],
      ]} />
      <Note>{g === 'dle' ? T(l, `Wasser: 1,163 Wh je Liter und Kelvin, Wirkungsgrad ${formatNumber(P.annahmen.dle_wirkungsgrad * 100, 0, l)} % (Annahme). `, `Water: 1.163 Wh per litre and kelvin, ${formatNumber(P.annahmen.dle_wirkungsgrad * 100, 0, l)}% efficiency (assumption). `, `Water: 1,163 Wh per liter en kelvin. `) : g === 'wasch' ? T(l, 'Der Labelwert gilt für das Eco-Programm; heißere Programme brauchen mehr. ', 'The label value is for the eco programme; hotter programmes use more. ', 'De labelwaarde geldt voor het eco-programma. ') : ''}<PreisNote l={l} von={von} bis={bis} /></Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={['euLabel', 'smard']} />} />;
}

/* ------------------------------------------------------------------ Energiebelasting NL */
export function EbRekenhulp({ lang: l, methodHref, id }: { lang: L; methodHref?: string; id: string }) {
  const [kwh, setKwh] = useState(2500);
  const [m3, setM3] = useState(1000);
  const [verm, setVerm] = useState(true);
  const r = H.energiebelasting({ kwh, m3, vermindering: verm });
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-kwh`} label={T(l, 'Stromverbrauch pro Jahr', 'Electricity use per year', 'Stroomverbruik per jaar')} value={kwh} onChange={setKwh} unit="kWh" max={100000000} help={T(l, 'Netto vom Netz, nach Saldierung', 'Net from the grid, after netting', 'Netto van het net, na salderen')} />
        <NumberField id={`${id}-m3`} label={T(l, 'Gasverbrauch pro Jahr', 'Gas use per year', 'Gasverbruik per jaar')} value={m3} onChange={setM3} unit="m³" max={100000000} help={T(l, 'Laut Jahresabrechnung', 'From your annual statement', 'Volgens je jaarafrekening')} />
      </Row2>
      <Toggle id={`${id}-verm`} label={T(l, 'Steuerermäßigung', 'Tax reduction', 'Vermindering energiebelasting')} value={verm ? 'ja' : 'nee'} onChange={(v) => setVerm(v === 'ja')} options={[{ value: 'ja', label: T(l, 'Wohnung', 'Home', 'Woning') }, { value: 'nee', label: T(l, 'Keine', 'None', 'Geen') }]} />
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Energiesteuer pro Jahr', 'Energy tax per year', 'Energiebelasting per jaar')} value={eu(r.incl, l)} sub={T(l, `inkl. ${formatNumber(P.nl.btw * 100, 0, l)} % MwSt., ${eu(r.maand, l, 2)} im Monat`, `incl. ${formatNumber(P.nl.btw * 100, 0, l)}% VAT, ${eu(r.maand, l, 2)} a month`, `incl. ${formatNumber(P.nl.btw * 100, 0, l)} % btw, ${eu(r.maand, l, 2)} per maand`)} />
      <Rows rows={[
        [T(l, 'Auf Strom', 'On electricity', 'Op stroom'), eu(r.stroomIncl, l, 2)],
        [T(l, 'Auf Gas', 'On gas', 'Op gas'), eu(r.gasIncl, l, 2)],
        [T(l, 'Steuerermäßigung', 'Tax reduction', 'Vermindering'), eu(-r.verminderingIncl, l, 2)],
        [T(l, 'Ohne MwSt.', 'Excl. VAT', 'Excl. btw'), eu(r.excl, l, 2)],
        [T(l, 'Mit MwSt.', 'Incl. VAT', 'Incl. btw'), eu(r.incl, l, 2), true],
      ]} />
      <Note>{T(l, 'Ein negativer Betrag wird mit den übrigen Kosten der Rechnung verrechnet.', 'A negative total is set off against the rest of your energy bill.', 'Een negatief bedrag verrekent je leverancier met de rest van je energierekening.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={['belastingdienstEb', 'wbm']} />} />;
}

/* ------------------------------------------------------------------ Haushaltsverbrauch */
type Wohnform = 'haus' | 'wohnung';
type Woning = keyof Omit<typeof P.nl.verbruik_cbs2024, '_quelle' | 'totaal'>;
const WONINGEN: Woning[] = ['alle', 'appartement', 'tussenwoning', 'hoekwoning', 'twee_onder_een_kap', 'vrijstaand'];
const woningNaam = (w: Woning, l: L) => ({
  alle: T(l, 'alle Wohnungen', 'all homes', 'alle woningen'), appartement: T(l, 'Wohnung', 'flat', 'appartement'), tussenwoning: T(l, 'Reihenmittelhaus', 'terraced house', 'tussenwoning'),
  hoekwoning: T(l, 'Reiheneckhaus', 'end-of-terrace house', 'hoekwoning'), twee_onder_een_kap: T(l, 'Doppelhaushälfte', 'semi-detached house', 'twee-onder-een-kapwoning'), vrijstaand: T(l, 'freistehendes Haus', 'detached house', 'vrijstaande woning'),
})[w];
export function HaushaltRechner({ lang: l, methodHref, id, land: land0, preisDe, prijsNl, netNl, verminderingNl }: { lang: L; methodHref?: string; id: string; land: Land | 'beide'; preisDe: number; prijsNl: number; netNl: number; verminderingNl: number }) {
  const [land, setLand] = useState<Land>(land0 === 'NL' ? 'NL' : 'DE');
  const nl = land === 'NL';
  const [pers, setPers] = useState('2');
  const [form, setForm] = useState<Wohnform>('wohnung');
  const [ww, setWw] = useState(false);
  const [woning, setWoning] = useState<Woning>('alle');
  const [eigen, setEigen] = useState(2500);
  const [preis, setPreis] = useState(nl ? prijsNl : preisDe);
  const [grund, setGrund] = useState(nl ? netNl - verminderingNl : 0);
  const wechsel = (x: string) => { const n = x === 'NL'; setLand(x as Land); setPreis(n ? prijsNl : preisDe); setGrund(n ? netNl - verminderingNl : 0); };
  const i = Number(pers) - 1;
  const schnitt = nl ? P.nl.verbruik_cbs2024[woning].stroom[i] : P.de.stromspiegel[form][ww ? 'mitWw' : 'ohneWw'][i];
  const gasNl = nl ? P.nl.verbruik_cbs2024[woning].gas[i] : 0;
  const abw = schnitt > 0 ? eigen / schnitt - 1 : 0;
  const kosten = (eigen * preis) / 100 + grund * (nl ? 1 : 12);
  const formEl = (
    <>
      {land0 === 'beide' && <Toggle id={`${id}-land`} label={T(l, 'Land', 'Country', 'Land')} value={land} onChange={wechsel} options={[{ value: 'DE', label: T(l, 'Deutschland', 'Germany', 'Duitsland') }, { value: 'NL', label: T(l, 'Niederlande', 'Netherlands', 'Nederland') }]} />}
      <Row2>
        <SelectField id={`${id}-pers`} label={T(l, 'Personen im Haushalt', 'People in the household', 'Personen in het huishouden')} value={pers} onChange={setPers} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: n === 5 ? '5+' : String(n) }))} />
        {nl
          ? <SelectField id={`${id}-woning`} label={T(l, 'Wohnform', 'Type of home', 'Type woning')} value={woning} onChange={(v) => setWoning(v as Woning)} options={WONINGEN.map((w) => ({ value: w, label: woningNaam(w, l) }))} />
          : <Toggle id={`${id}-form`} label={T(l, 'Wohnform', 'Type of home', 'Type woning')} value={form} onChange={(v) => setForm(v as Wohnform)} options={[{ value: 'wohnung', label: T(l, 'Wohnung', 'Flat', 'Appartement') }, { value: 'haus', label: T(l, 'Haus', 'House', 'Huis') }]} />}
        {!nl && <Toggle id={`${id}-ww`} label={T(l, 'Warmwasser mit Strom', 'Hot water from electricity', 'Warm water met stroom')} value={ww ? 'ja' : 'nein'} onChange={(v) => setWw(v === 'ja')} options={[{ value: 'nein', label: T(l, 'Nein', 'No', 'Nee') }, { value: 'ja', label: T(l, 'Ja', 'Yes', 'Ja') }]} />}
        <NumberField id={`${id}-eigen`} label={T(l, 'Ihr Verbrauch pro Jahr', 'Your use per year', 'Jouw verbruik per jaar')} value={eigen} onChange={setEigen} unit="kWh" max={1000000} help={T(l, 'Laut Jahresabrechnung', 'From your annual statement', 'Volgens je jaarafrekening (levering)')} />
        <NumberField id={`${id}-preis`} label={T(l, 'Strompreis brutto', 'Power price, gross', 'Stroomprijs incl. belastingen')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={nl ? T(l, 'CBS-Mittel', 'Preset: CBS variable average + energy tax', 'Ingevuld: CBS-gemiddelde variabel + energiebelasting') : T(l, 'Voreingestellt: Endpreis beim Börsenmittel der letzten 30 Tage', 'Preset: all-in price at the 30-day exchange average', 'Duitse eindprijs')} />
        <NumberField id={`${id}-grund`} label={nl ? T(l, 'Fixkosten pro Jahr', 'Fixed costs per year', 'Vaste kosten per jaar') : T(l, 'Grundpreis pro Monat', 'Standing charge per month', 'Vaste kosten per maand')} value={grund} onChange={setGrund} unit="€" decimals={2} max={10000} min={-10000} help={nl ? T(l, 'Netzkosten minus Steuerermäßigung (CBS)', 'Preset: grid charge minus tax reduction (CBS)', 'Ingevuld: netbeheerkosten min vermindering energiebelasting (CBS)') : T(l, 'Aus Ihrem Vertrag, brutto', 'From your contract, gross', 'Uit je contract')} />
      </Row2>
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Durchschnitt vergleichbarer Haushalte', 'Average for similar households', 'Gemiddelde van vergelijkbare huishoudens')} value={kwhT(schnitt, l)} sub={T(l, `Ihr Verbrauch liegt ${formatNumber(Math.abs(abw) * 100, 0, l)} % ${abw >= 0 ? 'darüber' : 'darunter'}`, `Your use is ${formatNumber(Math.abs(abw) * 100, 0, l)}% ${abw >= 0 ? 'above' : 'below'} it`, `Jouw verbruik ligt ${formatNumber(Math.abs(abw) * 100, 0, l)} % ${abw >= 0 ? 'hoger' : 'lager'}`)} />
      <Rows rows={[
        ...(nl ? [[T(l, 'Gas im Durchschnitt', 'Average gas use', 'Gemiddeld gasverbruik'), `${formatNumber(gasNl, 0, l)} m³`] as [string, string]] : []),
        [T(l, 'Ihr Verbrauch', 'Your use', 'Jouw verbruik'), kwhT(eigen, l)],
        [T(l, 'Stromkosten pro Jahr', 'Electricity cost per year', 'Stroomkosten per jaar'), eu(kosten, l)],
        [T(l, 'Abschlag pro Monat', 'Monthly instalment', 'Termijnbedrag per maand'), eu(kosten / 12, l), true],
      ]} />
      <Note>{nl ? T(l, 'Durchschnitt: CBS 2024 nach Haushaltsgröße und Wohnform.', 'Average: CBS 2024 by household size and type of home, electricity delivered before netting.', 'Gemiddelde: CBS 2024 naar huishoudgrootte en woningtype, geleverde stroom vóór salderen.') : T(l, 'Durchschnitt: co2online, Stromspiegel 2025, nach Personenzahl, Wohnform und Warmwasser.', 'Average: co2online, Stromspiegel 2025 (German electricity benchmark), by household size, type of home and hot water.', 'Gemiddelde: co2online, Stromspiegel 2025.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={formEl} result={result} after={<Quellen l={l} keys={nl ? ['cbsVerbruik', 'cbs'] : ['stromspiegel', 'smard']} />} />;
}

/* ------------------------------------------------------------------ Capaciteitstarief */
export function CapaciteitRekenhulp({ lang: l, methodHref, id }: { lang: L; methodHref?: string; id: string }) {
  const [gebied, setGebied] = useState<H.Netgebied>('Antwerpen');
  const [piek, setPiek] = useState(P.be.capaciteit.gemiddelde_piek_kw);
  const [kwh, setKwh] = useState(3500);
  const r = H.capaciteit({ gebied, piekKw: piek, kwh });
  const minder = H.capaciteit({ gebied, piekKw: Math.max(piek - 1, 0), kwh });
  const form = (
    <Row2>
      <SelectField id={`${id}-gebied`} label={T(l, 'Netzgebiet von Fluvius', 'Fluvius grid area', 'Netgebied van Fluvius')} value={gebied} onChange={(v) => setGebied(v as H.Netgebied)} options={H.NETGEBIEDEN.map((g) => ({ value: g, label: g }))} help={T(l, 'Steht auf Ihrer Rechnung', 'Shown on your bill', 'Staat op je factuur')} />
      <NumberField id={`${id}-piek`} label={T(l, 'Mittlere Monatsspitze', 'Average monthly peak', 'Gemiddelde maandpiek')} value={piek} onChange={setPiek} unit="kW" decimals={2} max={100} help={T(l, 'Mittel der letzten 12 Monate; Fluvius: im Schnitt 4,26 kW bei 3.500 kWh', 'Average of the last 12 months; Fluvius: 4.26 kW on average at 3,500 kWh', 'Gemiddelde van de laatste 12 maanden in Mijn Fluvius; gemiddeld gezin: 4,26 kW')} />
      <NumberField id={`${id}-kwh`} label={T(l, 'Abnahme pro Jahr', 'Consumption per year', 'Afname per jaar')} value={kwh} onChange={setKwh} unit="kWh" max={1000000} help={T(l, 'Vom Netz', 'From the grid', 'Van het net, volgens je jaarafrekening')} />
    </Row2>
  );
  const result = (
    <>
      <Head label={T(l, 'Netzkosten pro Jahr inkl. MwSt.', 'Grid costs per year incl. VAT', 'Distributienettarief per jaar incl. btw')} value={eu(r.totaal, l)} sub={T(l, `davon Leistungspreis ${eu(r.cap, l)}`, `of which capacity charge ${eu(r.cap, l)}`, `waarvan capaciteitstarief ${eu(r.cap, l)}`)} />
      <Rows rows={[
        [T(l, 'Berechnete Spitze', 'Peak charged', 'Aangerekende piek'), `${formatNumber(r.kw, 2, l)} kW${r.opMinimum ? T(l, ' (Minimum)', ' (minimum)', ' (minimum)') : ''}`],
        [T(l, 'Leistungspreis je kW und Jahr', 'Capacity rate per kW per year', 'Tarief per kW per jaar'), eu(r.perKw, l, 2)],
        [T(l, 'kWh-Anteil', 'Per-kWh part', 'kWh-tarieven'), eu(r.afname, l)],
        [T(l, 'Datenverwaltung', 'Data management', 'Databeheer'), eu(r.data, l, 2)],
        [T(l, '1 kW weniger Spitze spart', '1 kW lower peak saves', '1 kW lagere piek bespaart'), eu(r.totaal - minder.totaal, l), true],
      ]} />
      <Note>{T(l, `Tarife 2026 von Fluvius ohne MwSt., hier mit ${formatNumber(P.be.btw * 100, 0, l)} % MwSt. Ohne Energiepreis, Abgaben und Verbrauchsteuer.`, `Fluvius 2026 tariffs excl. VAT, shown here with ${formatNumber(P.be.btw * 100, 0, l)}% VAT. Energy price, levies and excise duty are not included.`, `Tarieven 2026 van Fluvius excl. btw, hier met ${formatNumber(P.be.btw * 100, 0, l)} % btw. Zonder energieprijs, heffingen en bijzondere accijns.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<Quellen l={l} keys={['fluviusTarieven', 'fluviusCapaciteit']} />} />;
}
