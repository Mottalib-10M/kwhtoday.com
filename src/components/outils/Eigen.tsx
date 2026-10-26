/**
 * Rechner für Eigenerzeugung, Speicher und Netzentgelt (Motor : lib/engine/eigen.ts) :
 *   SalderingRekenhulp  NL : wat het einde van de salderingsregeling per jaar kost
 *   SpeicherRechner     NL : thuisbatterij op de uurprijzen van de laatste 30 dagen
 *   EinspeiseRechner    DE : Einspeisevergütung nach EEG 2023, Teil- oder Volleinspeisung
 *   Modul14aRechner     DE : § 14a EnWG, Modul 1 gegen Modul 2
 *   StromkostenRechner  DE : Stromkosten eines Geräts oder Haushalts
 * Erste Darstellung = Werte des Builds (keine Uhrzeit, keine URL beim ersten Rendern).
 */
import { useMemo, useState } from 'react';
import * as M from '../../lib/engine';
import type { Tag, Einspeiseart } from '../../lib/engine';
import { P } from '../../lib/engine/params';
import { formatNumber, formatMoney, displayDate } from '../../lib/format';
import { LANG_TAGS } from '../../data/site-config';
import NumberField from '../ui/NumberField';
import Toggle from '../ui/Toggle';
import { Shell, Head, Rows, Note, MethodLink, Row2, T, type L } from '../calc/kit';

const kwhT = (x: number, l: L) => `${formatNumber(x, 0, l)} kWh`;
const ctT = (x: number, l: L, d = 2) => `${formatNumber(x, d, l)} ct/kWh`;
const eu = (x: number, l: L, d = 0) => formatMoney(x, d, l);
const datum = (iso: string, l: L) => displayDate(iso, LANG_TAGS[l]);
const SMARD = ({ l, von, bis }: { l: L; von: string; bis: string }) => (
  <p className="mt-3 text-xs text-navy-600">{T(l, `Day-Ahead-Preise ${datum(von, l)} bis ${datum(bis, l)}: `, `Day-ahead prices ${datum(von, l)} to ${datum(bis, l)}: `, `Day-aheadprijzen ${datum(von, l)} tot en met ${datum(bis, l)}: `)}<a href={P.sources.smard.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">Bundesnetzagentur | SMARD.de</a> (<a href={P.sources.smardLizenz.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">CC BY 4.0</a>){T(l, '. Berechnung: Radif Partners', '. Calculation: Radif Partners', '. Berekening: Radif Partners')}</p>
);

/* ------------------------------------------------------------------ Saldering */
export function SalderingRekenhulp({ lang: l, methodHref, id, prijsIncl, kale }: { lang: L; methodHref?: string; id: string; prijsIncl: number; kale: number }) {
  const [opwek, setOpwek] = useState(3000);
  const [direct, setDirect] = useState(30);
  const [verbruik, setVerbruik] = useState(2500);
  const [prijs, setPrijs] = useState(prijsIncl);
  const [verg, setVerg] = useState(Math.round(M.minVergoeding(kale) * 100) / 100);
  const [kosten, setKosten] = useState(0);
  const r = M.saldering({ opwek, direct: direct / 100, verbruik, prijsIncl: prijs, vergoeding: verg, kosten });
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-opwek`} label={T(l, 'Erzeugung pro Jahr', 'Solar output per year', 'Opwek per jaar')} value={opwek} onChange={setOpwek} unit="kWh" max={100000} help={T(l, 'Laut Wechselrichter oder Angebot', 'From your inverter app or quote', 'Uit de app van je omvormer of je offerte')} />
        <NumberField id={`${id}-verbruik`} label={T(l, 'Verbrauch des Haushalts pro Jahr', 'Household use per year', 'Jaarverbruik van je huis')} value={verbruik} onChange={setVerbruik} unit="kWh" max={100000} help={T(l, 'Gesamtverbrauch, nicht nur aus dem Netz', 'Total use, not only from the grid', 'Totaal verbruik, dus ook je eigen zonnestroom')} />
        <NumberField id={`${id}-direct`} label={T(l, 'Direkt selbst verbraucht', 'Used directly at home', 'Direct zelf verbruikt')} value={direct} onChange={setDirect} unit="%" max={100} help={T(l, 'Annahme: 30 % ohne Batterie', 'Assumption: 30% without a battery', 'Aanname: 30 % zonder batterij')} />
        <NumberField id={`${id}-prijs`} label={T(l, 'Strompreis inkl. Steuern', 'Power price incl. taxes', 'Stroomprijs incl. belastingen')} value={prijs} onChange={setPrijs} unit="ct" decimals={2} max={200} help={T(l, 'Voreingestellt: CBS-Mittel variabel + Energiesteuer', 'Preset: CBS variable average + energy tax', 'Ingevuld: CBS-gemiddelde variabel + energiebelasting')} />
      </Row2>
      <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Vergütung und Kosten des Lieferanten', 'Supplier payment and fees', 'Terugleververgoeding en terugleverkosten')}</summary>
        <div className="mt-3"><Row2>
          <NumberField id={`${id}-verg`} label={T(l, 'Rückliefervergütung', 'Feed-in payment', 'Terugleververgoeding')} value={verg} onChange={setVerg} unit="ct" decimals={2} max={100} help={T(l, 'Voreingestellt: gesetzliches Minimum, 50 % des CBS-Lieferpreises', 'Preset: legal minimum, 50% of the CBS supply price', 'Ingevuld: wettelijk minimum, 50 % van de kale CBS-prijs')} />
          <NumberField id={`${id}-kosten`} label={T(l, 'Rückliefergebühr', 'Feed-in fee', 'Terugleverkosten')} value={kosten} onChange={setKosten} unit="ct" decimals={2} max={100} help={T(l, 'Pro kWh laut Vertrag, sonst 0', 'Per kWh in your contract, else 0', 'Per teruggeleverde kWh volgens je contract, anders 0')} />
        </Row2></div>
      </details>
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Weniger Ertrag ab 2027, pro Jahr', 'Less value from 2027, per year', 'Minder opbrengst vanaf 2027, per jaar')} value={eu(r.verlies, l)} sub={T(l, `etwa ${eu(r.verlies / 12, l)} pro Monat`, `about ${eu(r.verlies / 12, l)} a month`, `zo’n ${eu(r.verlies / 12, l)} per maand`)} />
      <Rows rows={[
        [T(l, 'Ins Netz zurückgeliefert', 'Fed back into the grid', 'Teruggeleverd aan het net'), kwhT(r.terug, l)],
        [T(l, 'Davon 2026 saldiert', 'Of which netted in 2026', 'Daarvan gesaldeerd in 2026'), kwhT(r.gesaldeerd, l)],
        [T(l, 'Wert der Rücklieferung 2026', 'Value of feed-in in 2026', 'Waarde teruglevering 2026'), eu(r.waarde2026, l)],
        [T(l, 'Wert der Rücklieferung ab 2027', 'Value of feed-in from 2027', 'Waarde teruglevering vanaf 2027'), eu(r.waarde2027, l)],
        [T(l, 'Direkter Eigenverbrauch, unverändert', 'Direct own use, unchanged', 'Direct eigen verbruik, blijft gelijk'), eu(r.directWaarde, l)],
      ]} />
      <Note>{T(l, 'Bis 31.12.2026 wird die zurückgelieferte Menge mit dem Verbrauch verrechnet, ab 1.1.2027 gibt es nur noch die Vergütung. Energiesteuer und Preise 2026 gelten als Annahme auch für 2027.', 'Until 31 December 2026 the kWh fed back are netted against use; from 1 January 2027 only the feed-in payment remains. 2026 tax and prices are assumed for 2027 too.', 'Tot en met 31 december 2026 worden teruggeleverde kWh weggestreept tegen je verbruik; vanaf 1 januari 2027 krijg je alleen de vergoeding. Prijs en energiebelasting van 2026 gelden als aanname ook voor 2027.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<p className="mt-3 text-xs text-navy-600">{T(l, 'Quellen: ', 'Sources: ', 'Bronnen: ')}<a href={P.sources.rijksSaldering.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">Rijksoverheid</a>, <a href={P.sources.acmSalderen.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">ACM</a>, <a href={P.sources.cbs.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">CBS StatLine 85592NED</a> (CC BY 4.0)</p>} />;
}

/* ------------------------------------------------------------------ Thuisbatterij */
export function SpeicherRechner({ lang: l, methodHref, id, tage }: { lang: L; methodHref?: string; id: string; tage: Tag[] }) {
  const [kwh, setKwh] = useState(5);
  const [kw, setKw] = useState(2.5);
  const [rend, setRend] = useState(90);
  const [prijs, setPrijs] = useState(4000);
  const [inkoop, setInkoop] = useState(2);
  const fn = useMemo(() => M.preisFn('NL', { aufschlag: inkoop }), [inkoop]);
  const r = useMemo(() => M.speicher(tage, { kwh, kw, wirkung: rend / 100, preis: fn, kosten: prijs }), [tage, kwh, kw, rend, fn, prijs]);
  const form = (
    <>
      <Row2>
        <NumberField id={`${id}-kwh`} label={T(l, 'Speicher (nutzbar)', 'Battery (usable)', 'Batterij (bruikbaar)')} value={kwh} onChange={setKwh} unit="kWh" decimals={1} max={100} />
        <NumberField id={`${id}-kw`} label={T(l, 'Lade- und Entladeleistung', 'Charge and discharge power', 'Laad- en ontlaadvermogen')} value={kw} onChange={setKw} unit="kW" decimals={1} max={50} />
        <NumberField id={`${id}-prijs`} label={T(l, 'Preis des Speichers', 'Battery price', 'Prijs van de batterij')} value={prijs} onChange={setPrijs} unit="€" max={100000} help={T(l, 'Annahme: tragen Sie Ihr Angebot ein', 'Assumption: enter your own quote', 'Aanname: vul je eigen offerte in')} />
        <NumberField id={`${id}-rend`} label={T(l, 'Wirkungsgrad hin und zurück', 'Round-trip efficiency', 'Rendement laden en ontladen')} value={rend} onChange={setRend} unit="%" max={100} help={T(l, 'Annahme: 90 %', 'Assumption: 90%', 'Aanname: 90 %')} />
      </Row2>
      <details className="rounded-lg border border-navy-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Dynamischer Vertrag', 'Dynamic contract', 'Dynamisch contract')}</summary>
        <div className="mt-3"><Row2>
          <NumberField id={`${id}-inkoop`} label={T(l, 'Einkaufsaufschlag netto', 'Purchase fee, excl. VAT', 'Inkoopvergoeding excl. btw')} value={inkoop} onChange={setInkoop} unit="ct" decimals={2} max={30} help={T(l, 'Annahme: 2 ct, steht in Ihrem Vertrag', 'Assumption: 2 ct, see your contract', 'Aanname: 2 ct, staat in je contract')} />
        </Row2></div>
      </details>
    </>
  );
  const jahre = Number.isFinite(r.amortisation) ? formatNumber(r.amortisation, 1, l) : '–';
  const result = (
    <>
      <Head label={T(l, 'Ersparnis pro Jahr, hochgerechnet', 'Saving per year, extrapolated', 'Besparing per jaar, doorgerekend')} value={eu(r.jahr, l)} sub={T(l, `aus ${r.n} Tagen mit Stundenpreisen, ${r.gefahren} davon mit Gewinn`, `from ${r.n} days of hourly prices, ${r.gefahren} of them profitable`, `uit ${r.n} dagen met uurprijzen, waarvan ${r.gefahren} met winst`)} />
      <Rows rows={[
        [T(l, `Ersparnis in ${r.n} Tagen`, `Saving over ${r.n} days`, `Besparing in ${r.n} dagen`), eu(r.summe, l, 2)],
        [T(l, 'Bester Tag', 'Best day', 'Beste dag'), r.bester ? `${datum(r.bester.d, l)}: ${eu(r.bester.gewinn, l, 2)}` : '–'],
        [T(l, 'Lade- und Entladeblock', 'Charge and discharge block', 'Blok laden en ontladen'), `${r.tage[0]?.stunden ?? 0} h`],
        [T(l, 'Amortisation', 'Payback', 'Terugverdientijd'), T(l, `${jahre} Jahre`, `${jahre} years`, `${jahre} jaar`), true],
      ]} />
      <Note>{T(l, 'Ein Zyklus pro Tag: laden in den günstigsten Stunden, entladen später am Tag in den eigenen Verbrauch. Endpreis mit Energiesteuer und MwSt. Ohne Solarstrom, Alterung und Netzkosten.', 'One cycle a day: charge in the cheapest hours, discharge later that day into your own use. All-in price with energy tax and VAT. Solar power, ageing and grid costs are left out.', 'Eén cyclus per dag: laden in de goedkoopste uren, later op de dag ontladen naar je eigen verbruik. Eindprijs met energiebelasting en btw. Zonder zonnestroom, slijtage en netbeheerkosten.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={tage.length ? <SMARD l={l} von={tage[0].d} bis={tage.at(-1)!.d} /> : null} />;
}

/* ------------------------------------------------------------------ Einspeisevergütung */
export function EinspeiseRechner({ lang: l, methodHref, id, preisCt }: { lang: L; methodHref?: string; id: string; preisCt: number }) {
  const [kwp, setKwp] = useState(8);
  const [ertrag, setErtrag] = useState(950);
  const [art, setArt] = useState<Einspeiseart>('teil');
  const [eigen, setEigen] = useState(30);
  const [preis, setPreis] = useState(preisCt);
  const r = M.einspeisung({ kwp, ertrag, art, eigen: eigen / 100, preisCt: preis });
  const form = (
    <>
      <Toggle id={`${id}-art`} label={T(l, 'Was wird eingespeist?', 'What is exported?', 'Wat lever je terug?')} value={art} onChange={(v) => setArt(v as Einspeiseart)}
        options={[{ value: 'teil', label: T(l, 'Überschuss', 'Surplus', 'Overschot') }, { value: 'voll', label: T(l, 'Alles', 'Everything', 'Alles') }]} />
      <Row2>
        <NumberField id={`${id}-kwp`} label={T(l, 'Leistung der Anlage', 'System size', 'Vermogen van de installatie')} value={kwp} onChange={setKwp} unit="kWp" decimals={1} max={1000} help={T(l, 'Auf dem Dach eines Gebäudes', 'Rooftop system on a building', 'Op het dak van een gebouw')} />
        <NumberField id={`${id}-ertrag`} label={T(l, 'Ertrag je kWp und Jahr', 'Yield per kWp per year', 'Opbrengst per kWp per jaar')} value={ertrag} onChange={setErtrag} unit="kWh" max={2000} help={T(l, 'Annahme: 950 kWh, je nach Lage und Ausrichtung', 'Assumption: 950 kWh, varies with site and orientation', 'Aanname: 950 kWh, afhankelijk van ligging')} />
        {art === 'teil' && <NumberField id={`${id}-eigen`} label={T(l, 'Eigenverbrauch', 'Own use', 'Eigen verbruik')} value={eigen} onChange={setEigen} unit="%" max={100} help={T(l, 'Annahme: 30 % ohne Speicher', 'Assumption: 30% without storage', 'Aanname: 30 % zonder batterij')} />}
        {art === 'teil' && <NumberField id={`${id}-preis`} label={T(l, 'Strompreis aus dem Netz', 'Grid power price', 'Stroomprijs van het net')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={T(l, 'Voreingestellt: Endpreis beim Börsenmittel der letzten 30 Tage', 'Preset: all-in price at the 30-day exchange average', 'Ingevuld: eindprijs bij het beursgemiddelde van 30 dagen')} />}
      </Row2>
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Einspeisevergütung pro Jahr', 'Feed-in payment per year', 'Vergoeding per jaar')} value={eu(r.verguetung, l)} sub={T(l, `${ctT(r.satz, l)} für ${kwhT(r.eingespeist, l)}`, `${ctT(r.satz, l)} for ${kwhT(r.eingespeist, l)}`, `${ctT(r.satz, l)} voor ${kwhT(r.eingespeist, l)}`)} />
      <Rows rows={[
        [T(l, 'Erzeugung pro Jahr', 'Output per year', 'Opwek per jaar'), kwhT(r.erzeugt, l)],
        [T(l, 'Satz der Anlage (anteilig)', 'Rate for this system (blended)', 'Tarief van de installatie (gewogen)'), ctT(r.satz, l)],
        ...(art === 'teil' ? [[T(l, 'Eigenverbrauch spart', 'Own use saves', 'Eigen verbruik bespaart'), eu(r.ersparnis, l)] as [string, string]] : []),
        [T(l, 'Zusammen pro Jahr', 'Total per year', 'Samen per jaar'), eu(r.summe, l), true],
      ]} />
      {r.ueber100 && <Note>{T(l, 'Über 100 kW gilt die Pflicht zur Direktvermarktung; der Rechner setzt den Satz bis 100 kW an.', 'Above 100 kW direct marketing is mandatory; the calculator applies the rate up to 100 kW.', 'Boven 100 kW geldt directe verkoop; de rekenhulp rekent met het tarief tot 100 kW.')}</Note>}
      <Note>{T(l, `Sätze der Bundesnetzagentur für Inbetriebnahme ${datum(P.de.einspeiseverguetung_ct.ab, l)} bis ${datum(P.de.einspeiseverguetung_ct.bis, l)}, fest für 20 Jahre. Bei negativem Börsenpreis entfällt die Vergütung, sobald die Regel für Ihre Anlage greift.`, `Federal Network Agency rates for systems commissioned ${datum(P.de.einspeiseverguetung_ct.ab, l)} to ${datum(P.de.einspeiseverguetung_ct.bis, l)}, fixed for 20 years. No payment at negative exchange prices once that rule applies to your system.`, `Tarieven van de Bundesnetzagentur voor ingebruikname ${datum(P.de.einspeiseverguetung_ct.ab, l)} tot en met ${datum(P.de.einspeiseverguetung_ct.bis, l)}, 20 jaar vast.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<p className="mt-3 text-xs text-navy-600">{T(l, 'Quelle: ', 'Source: ', 'Bron: ')}<a href={P.sources.bnetzaEeg.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">{P.sources.bnetzaEeg.label[l]}</a></p>} />;
}

/* ------------------------------------------------------------------ § 14a EnWG */
export function Modul14aRechner({ lang: l, methodHref, id, arbeitspreis }: { lang: L; methodHref?: string; id: string; arbeitspreis: number }) {
  const p = P.de.p14a;
  const [kwh, setKwh] = useState(4000);
  const [ap, setAp] = useState(arbeitspreis);
  const [pausch, setPausch] = useState((p.modul1_min_eur + p.modul1_max_eur) / 2);
  const [zaehler, setZaehler] = useState(0);
  const r = M.modul14a({ kwh, arbeitspreis: ap, pauschale: pausch, zaehler });
  const form = (
    <Row2>
      <NumberField id={`${id}-kwh`} label={T(l, 'Verbrauch Wärmepumpe oder Wallbox', 'Heat pump or wallbox use', 'Verbruik warmtepomp of laadpaal')} value={kwh} onChange={setKwh} unit="kWh" max={100000} help={T(l, 'Pro Jahr, Annahme 4.000 kWh', 'Per year, assumption 4,000 kWh', 'Per jaar, aanname 4.000 kWh')} />
      <NumberField id={`${id}-ap`} label={T(l, 'Arbeitspreis Netzentgelt netto', 'Grid fee energy rate, net', 'Netkosten per kWh netto')} value={ap} onChange={setAp} unit="ct" decimals={2} max={40} help={T(l, 'Preisblatt Ihres Netzbetreibers; voreingestellt: Bundesmittel 2025', 'From your grid operator’s price sheet; preset: 2025 average', 'Prijsblad van de netbeheerder; ingevuld: gemiddelde 2025')} />
      <NumberField id={`${id}-pausch`} label={T(l, 'Pauschale Modul 1', 'Module 1 flat amount', 'Vast bedrag module 1')} value={pausch} onChange={setPausch} unit="€" max={1000} help={T(l, `Je nach Netz ${p.modul1_min_eur} bis ${p.modul1_max_eur} € im Jahr, Annahme: Mitte`, `${p.modul1_min_eur} to ${p.modul1_max_eur} € a year by grid area; assumption: midpoint`, `${p.modul1_min_eur} tot ${p.modul1_max_eur} € per jaar; aanname: midden`)} />
      <NumberField id={`${id}-zaehler`} label={T(l, 'Kosten zweiter Zähler', 'Second meter cost', 'Kosten tweede meter')} value={zaehler} onChange={setZaehler} unit="€" max={1000} help={T(l, 'Pro Jahr, nur Modul 2; Annahme 0 €', 'Per year, Module 2 only; assumption €0', 'Per jaar, alleen module 2; aanname 0 €')} />
    </Row2>
  );
  const result = (
    <>
      <Head label={T(l, `Günstiger: Modul ${r.besser}`, `Better: Module ${r.besser}`, `Voordeliger: module ${r.besser}`)} value={eu(r.besser === 2 ? r.modul2 : r.modul1, l)} sub={T(l, `pro Jahr, ${eu(r.abstand, l)} mehr als das andere Modul`, `a year, ${eu(r.abstand, l)} more than the other module`, `per jaar, ${eu(r.abstand, l)} meer dan de andere module`)} />
      <Rows rows={[
        [T(l, 'Modul 1: Pauschale', 'Module 1: flat amount', 'Module 1: vast bedrag'), eu(r.modul1, l)],
        [T(l, `Modul 2: Arbeitspreis auf ${formatNumber(p.modul2_restfaktor * 100, 0, l)} %`, `Module 2: energy rate cut to ${formatNumber(p.modul2_restfaktor * 100, 0, l)}%`, `Module 2: tarief naar ${formatNumber(p.modul2_restfaktor * 100, 0, l)} %`), eu(r.modul2, l)],
        [T(l, 'Unterschied', 'Difference', 'Verschil'), eu(r.abstand, l), true],
      ]} />
      <Note>{T(l, `Modul 2 inklusive ${formatNumber(P.de.ust * 100, 0, l)} % Umsatzsteuer, abzüglich der Zählerkosten. Modul 3 (zeitvariabel) gibt es nur zusammen mit Modul 1 und einem intelligenten Messsystem.`, `Module 2 includes ${formatNumber(P.de.ust * 100, 0, l)}% VAT, minus the meter cost. Module 3 (time-of-use) only comes on top of Module 1 with a smart meter.`, `Module 2 inclusief ${formatNumber(P.de.ust * 100, 0, l)} % btw, min de meterkosten.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<p className="mt-3 text-xs text-navy-600">{T(l, 'Quelle: ', 'Source: ', 'Bron: ')}<a href={P.sources.bnetza14a.url} target="_blank" rel="nofollow noopener noreferrer" className="underline">{P.sources.bnetza14a.label[l]}</a></p>} />;
}

/* ------------------------------------------------------------------ Stromkosten */
export function StromkostenRechner({ lang: l, methodHref, id, preisCt, von, bis }: { lang: L; methodHref?: string; id: string; preisCt: number; von: string; bis: string }) {
  const [modus, setModus] = useState<'geraet' | 'haushalt'>('geraet');
  const [watt, setWatt] = useState(2000);
  const [std, setStd] = useState(1);
  const [tage, setTage] = useState(365);
  const [kwhJahr, setKwhJahr] = useState(3000);
  const [preis, setPreis] = useState(preisCt);
  const [grund, setGrund] = useState(0);
  const kwh = modus === 'geraet' ? M.geraetKwh(watt, std, tage) : kwhJahr;
  const r = M.stromkosten({ kwhJahr: kwh, preisCt: preis, grundMonat: modus === 'haushalt' ? grund : 0 });
  const proStunde = (watt / 1000) * preis / 100;
  const form = (
    <>
      <Toggle id={`${id}-modus`} label={T(l, 'Was berechnen?', 'What to calculate?', 'Wat berekenen?')} value={modus} onChange={(v) => setModus(v as 'geraet' | 'haushalt')}
        options={[{ value: 'geraet', label: T(l, 'Gerät', 'Appliance', 'Apparaat') }, { value: 'haushalt', label: T(l, 'Haushalt', 'Household', 'Huishouden') }]} />
      <Row2>
        {modus === 'geraet' ? (
          <>
            <NumberField id={`${id}-watt`} label={T(l, 'Leistung des Geräts', 'Appliance power', 'Vermogen van het apparaat')} value={watt} onChange={setWatt} unit="W" max={50000} help={T(l, 'Typenschild oder Anleitung', 'Rating plate or manual', 'Typeplaatje of handleiding')} />
            <NumberField id={`${id}-std`} label={T(l, 'Laufzeit pro Tag', 'Hours per day', 'Uren per dag')} value={std} onChange={setStd} unit="h" decimals={2} max={24} />
            <NumberField id={`${id}-tage`} label={T(l, 'Tage pro Jahr', 'Days per year', 'Dagen per jaar')} value={tage} onChange={setTage} unit={T(l, 'Tage', 'days', 'dagen')} max={366} />
          </>
        ) : (
          <>
            <NumberField id={`${id}-kwhjahr`} label={T(l, 'Jahresverbrauch', 'Annual use', 'Jaarverbruik')} value={kwhJahr} onChange={setKwhJahr} unit="kWh" max={1000000} help={T(l, 'Laut letzter Jahresabrechnung', 'From your last annual bill', 'Volgens je jaarafrekening')} />
            <NumberField id={`${id}-grund`} label={T(l, 'Grundpreis pro Monat', 'Standing charge per month', 'Vaste kosten per maand')} value={grund} onChange={setGrund} unit="€" decimals={2} max={1000} help={T(l, 'Aus Ihrem Vertrag, brutto', 'From your contract, gross', 'Uit je contract, bruto')} />
          </>
        )}
        <NumberField id={`${id}-preis`} label={T(l, 'Arbeitspreis brutto', 'Energy price, gross', 'Prijs per kWh bruto')} value={preis} onChange={setPreis} unit="ct" decimals={2} max={200} help={T(l, 'Voreingestellt: aktueller Endpreis dieser Seite', 'Preset: this site’s current all-in price', 'Ingevuld: actuele eindprijs van deze site')} />
      </Row2>
    </>
  );
  const result = (
    <>
      <Head label={T(l, 'Stromkosten pro Jahr', 'Electricity cost per year', 'Stroomkosten per jaar')} value={eu(r.jahr, l)} sub={T(l, `${kwhT(kwh, l)} zu ${ctT(preis, l)}`, `${kwhT(kwh, l)} at ${ctT(preis, l)}`, `${kwhT(kwh, l)} tegen ${ctT(preis, l)}`)} />
      <Rows rows={[
        [T(l, 'Pro Monat', 'Per month', 'Per maand'), eu(r.monat, l, 2)],
        [T(l, 'Pro Tag', 'Per day', 'Per dag'), eu(r.tag, l, 2)],
        ...(modus === 'geraet' ? [[T(l, 'Pro Betriebsstunde', 'Per hour of use', 'Per gebruiksuur'), eu(proStunde, l, 2)] as [string, string]] : [[T(l, 'Davon Grundpreis', 'Of which standing charge', 'Waarvan vaste kosten'), eu(r.grund, l)] as [string, string]]),
        [T(l, 'Verbrauch pro Jahr', 'Use per year', 'Verbruik per jaar'), kwhT(kwh, l), true],
      ]} />
      <Note>{T(l, `Voreingestellter Preis: Börsenmittel ${datum(von, l)} bis ${datum(bis, l)} plus Bundesmittel Netzentgelt, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer, ohne Anbieteraufschlag.`, `Preset price: exchange average ${datum(von, l)} to ${datum(bis, l)} plus German average grid fee, electricity tax, levies, concession fee and VAT, no supplier markup.`, `Ingevulde prijs: beursgemiddelde ${datum(von, l)} tot ${datum(bis, l)} plus Duitse netkosten, belastingen en btw.`)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>
  );
  return <Shell id={id} form={form} result={result} after={<SMARD l={l} von={von} bis={bis} />} />;
}
