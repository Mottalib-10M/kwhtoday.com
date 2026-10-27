import { defineGuide, type Helpers } from '../../lib/guide-types';
import { waermepumpe, kfw, isde } from '../../lib/engine/haus';
import { preisDe30, nlCbs } from '../../lib/tool-props';

/** Wärmepumpe Kosten (DE) / warmtepomp kosten (NL) : Heizkosten gegen Gaskessel, KfW bzw. ISDE, Amortisation. */
function D(h: Helpers) {
  const P = h.P;
  const p = preisDe30();
  const gasDe = P.de.gas.eurostat_ct['2026S1'].brutto;
  const wg = P.annahmen.kessel_wirkungsgrad;
  const k = P.de.kfw;
  const de = (jaz: number, foerderung = 0) => waermepumpe({ gasKwh: 18000, wirkungsgrad: wg, jaz, anteil: 1, stromCt: p.preis, gasCt: gasDe, gasGrundJahr: 0, invest: 30000, foerderung });
  const kfwGrund = kfw({ kosten: 30000, klima: false, einkommen: 'nein' });
  const kfwKlima = kfw({ kosten: 30000, klima: true, einkommen: 'nein' });
  const kfwMax = kfw({ kosten: 30000, klima: true, einkommen: 'bis30000' });
  const bspDe = de(3.5, kfwGrund.zuschuss);
  const jazRows = [3, 3.5, 4].map((jaz) => ({ jaz, r: de(jaz, kfwGrund.zuschuss) }));
  const foerd = [kfwGrund, kfwKlima, kfw({ kosten: 30000, klima: true, einkommen: 'bis40000' }), kfwMax].map((x) => ({ x, r: de(3.5, x.zuschuss) }));
  const n = nlCbs();
  const m3 = P.nl.gas_kwh_m3;
  const isdeBsp = isde({ kw: 4, label: true });
  const nlRun = (anteil: number, invest: number, vast: number, sub: number) => waermepumpe({ gasKwh: P.nl.milieucentraal.gas_m3 * m3, wirkungsgrad: wg, jaz: 3.5, anteil, stromCt: n.stroomCt, gasCt: (n.gasM3 * 100) / m3, gasGrundJahr: vast, invest, foerderung: sub });
  const hybride = nlRun(0.7, 5000, n.gasVast, isdeBsp);
  const isdeAllE = isde({ kw: 6, label: true });
  const allE = nlRun(1, 12000, n.gasVast, isdeAllE);
  return { p, gasDe, wg, k, bspDe, jazRows, foerd, kfwGrund, kfwKlima, kfwMax, n, m3, isdeBsp, isdeAllE, hybride, allE };
}
const j = (h: Helpers, x: number) => (Number.isFinite(x) ? h.num(x, 0) : '–');

export default defineGuide({
  id: 'wpkosten',
  group: 'nutzen',
  order: 32,
  tool: 'wpkosten',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  related: ['waermepumpe', 'paragraph14a', 'gaspreis', 'gas', 'energiebelasting'],
  sources: ['kfw458', 'kfwPresse', 'gmg', 'eurostatGas', 'smard', 'smardLizenz', 'rvoIsde', 'rvoIsde2026', 'rvoIsde2027', 'rijksNormering', 'cbs', 'mcVerbruik', 'sleutel2027'],
  de: {
    slug: 'waermepumpe-kosten',
    nav: 'Wärmepumpe Kosten',
    card: 'Heizkosten mit Wärmepumpe gegen Gas, KfW-Zuschuss 2026 und Amortisation.',
    title: 'Wärmepumpe Kosten 2026: Betrieb, Förderung, Amortisation',
    description: 'Wärmepumpe Kosten 2026: Gasverbrauch, Jahresarbeitszahl und Strompreis eintragen, Heizkosten gegen Gas, KfW-Zuschuss nach den Regeln ab Juli 2026, Amortisation.',
    h1: 'Wärmepumpe: was Betrieb und Kauf 2026 kosten',
    intro: 'Tragen Sie Ihren Gasverbrauch, die erwartete Jahresarbeitszahl, Ihre Preise und das Angebot ein. Der Rechner zieht den KfW-Zuschuss nach den Bedingungen ab 21. Juli 2026 ab.',
    resume: (h) => {
      const { p, gasDe, k, bspDe, kfwGrund } = D(h);
      return `Was eine Wärmepumpe im Betrieb kostet, hängt an drei Zahlen: der Heizwärme, die Ihr Haus im Jahr braucht, der Jahresarbeitszahl der Anlage und dem Strompreis. Die Heizwärme lässt sich aus dem bisherigen Gasverbrauch ableiten. Ein Haus mit 18.000 kWh Gas und 90 % Kesselwirkungsgrad (Annahme) braucht rund ${h.num(bspDe.waerme)} kWh Wärme; eine Wärmepumpe mit Jahresarbeitszahl 3,5 (Annahme) erzeugt sie aus ${h.num(bspDe.stromKwh)} kWh Strom. Beim Endpreis von ${h.ct(p.preis, 2)} aus den Börsenpreisen vom ${h.date(p.von)} bis ${h.date(p.bis)} kostet das ${h.eur(bspDe.kostenWp)} im Jahr, gegenüber ${h.eur(bspDe.kostenGas)} mit Gas zum Durchschnittspreis von ${h.ct(gasDe, 2)} laut Eurostat für das erste Halbjahr 2026. Seit dem ${h.date(k.ab)} zahlt die KfW eine Grundförderung von ${h.num(k.grund * 100)} % auf höchstens ${h.eur(k.kosten_max)} förderfähige Kosten, dazu Boni bis zusammen ${h.num(k.max * 100)} %, bei kleinem Einkommen bis ${h.num(k.max_niedrig * 100)} %. Bei einem Angebot von 30.000 Euro (Annahme) und nur der Grundförderung bleiben ${h.eur(30000 - kfwGrund.zuschuss)} Eigenanteil; mit der Ersparnis des Beispiels dauert die Amortisation ${j(h, bspDe.amortisation)} Jahre. Ein günstiger Wärmepumpentarif und eine hohe Jahresarbeitszahl verkürzen sie deutlich.`;
    },
    faqs: () => [
      { q: 'Was ist ein Wärmepumpentarif und lohnt er sich?', a: 'Ein Wärmepumpentarif ist ein eigener Stromvertrag für die Heizung, meist mit eigenem Zähler und einem niedrigeren Arbeitspreis als der Haushaltsstrom. Der Netzbetreiber darf die Anlage dafür nach § 14a EnWG bei Netzengpässen begrenzen und senkt im Gegenzug das Netzentgelt. Ob sich der zweite Zähler rechnet, hängt vom Verbrauch ab. Tragen Sie den Arbeitspreis des Tarifs im Rechner ein, um den Unterschied zu sehen.' },
      { q: 'Welche Jahresarbeitszahl erreicht eine Wärmepumpe im Altbau?', a: 'Die Jahresarbeitszahl ist das Verhältnis von erzeugter Wärme zu verbrauchtem Strom über ein ganzes Jahr. Entscheidend ist die Vorlauftemperatur: Fußbodenheizungen kommen mit niedrigen Temperaturen aus und erreichen höhere Werte, alte Heizkörper brauchen wärmeres Wasser und senken sie. Der Rechner nimmt 3,5 an; der Heizungsbauer kann für Ihr Haus eine Prognose rechnen, die Sie dann eintragen.' },
      { q: 'Wie ändert sich die KfW-Förderung für Wärmepumpen 2027?', a: 'Laut KfW sinkt der Klimageschwindigkeitsbonus ab dem 1. Februar 2027 alle sechs Monate um vier Prozentpunkte, und die förderfähigen Kosten sinken im selben Takt um 750 Euro. Für das erste Quartal 2027 ist angekündigt, die Grundförderung auf 15 Prozent zu senken und einen Bonus von 15 Prozent für in der EU gefertigte Wärmepumpen einzuführen. Maßgeblich ist der Tag des Antrags.' },
      { q: 'Muss ich 2026 noch eine Wärmepumpe einbauen?', a: 'Eine Pflicht zur Wärmepumpe gab es nie, wohl aber die Vorgabe, neue Heizungen zu 65 Prozent mit erneuerbaren Energien zu betreiben. Nach Angabe der Bundesregierung gilt seit dem 29. Juli 2026 das Gebäudemodernisierungsgesetz, mit dem diese Vorgabe entfallen ist. Wer heute die Heizung tauscht, entscheidet also nach Kosten. Die Förderung der KfW für Wärmepumpen läuft weiter.' },
    ],
    body: (h) => {
      const { p, gasDe, jazRows, foerd, k } = D(h);
      const r1 = jazRows.map((x) => [h.num(x.jaz, 1), `${h.num(x.r.stromKwh)} kWh`, h.eur(x.r.kostenWp), h.eur(x.r.kostenGas), h.eur(x.r.ersparnis)]);
      const r2 = foerd.map((x) => [`${h.num(x.x.satz * 100)} %`, h.eur(x.x.zuschuss), h.eur(x.r.netto), j(h, x.r.amortisation)]);
      return `<h2>Heizkosten nach Jahresarbeitszahl</h2>
${h.table(['Jahresarbeitszahl', 'Strom', 'Wärmepumpe pro Jahr', 'Gas pro Jahr', 'Ersparnis'], r1, `18.000 kWh Gas, Kesselwirkungsgrad 90 % (Annahme). Strom ${h.ct(p.preis, 2)}, Gas ${h.ct(gasDe, 2)} (Eurostat, 1. Halbjahr 2026), ohne Grundpreise`, ['r', 'r', 'r', 'r', 'r'])}
<p>Der Gaspreis ist der Mittelwert für Haushalte mit 20 bis 199 Gigajoule im Jahr aus ${h.src('eurostatGas', 'Eurostat')}, einschließlich aller Steuern; wie er sich zusammensetzt, zeigt ${h.a('gaspreis', 'Gaspreis aktuell')}. Der Strompreis folgt den Börsenpreisen der letzten 30 Tage mit Netzentgelt, Steuern und Umlagen. Den Grundpreis für Gas sparen Sie nur, wenn Sie den Gasanschluss kündigen; tragen Sie ihn dann im Rechner ein.</p>
<h2>KfW-Zuschuss und Amortisation</h2>
${h.table(['Fördersatz', 'Zuschuss', 'Eigenanteil', 'Jahre'], r2, `Angebot 30.000 € (Annahme), förderfähig höchstens ${h.eur(k.kosten_max)}; Grundförderung, mit Klimageschwindigkeitsbonus, mit Einkommensbonus bis 40.000 € und bis 30.000 €. Jahresarbeitszahl 3,5`, ['r', 'r', 'r', 'r'])}
<p>Seit dem ${h.date(k.ab)} gelten nach ${h.src('kfwPresse', 'Mitteilung der KfW')} neue Sätze: ${h.num(k.grund * 100)} % Grundförderung, ${h.num(k.klima * 100)} % Klimageschwindigkeitsbonus für den Austausch einer alten fossilen Heizung und ein Einkommensbonus von ${h.num(k.einkommen.bis30000 * 100)} %, ${h.num(k.einkommen.bis40000 * 100)} % oder ${h.num(k.einkommen.bis50000 * 100)} % bei einem zu versteuernden Haushaltseinkommen bis 30.000, 40.000 oder 50.000 Euro. Der Effizienzbonus ist entfallen. Die Einzelheiten, auch für Familien mit Kindern, stehen im ${h.src('kfw458', 'KfW-Merkblatt 458')}. Seit dem 29. Juli 2026 gilt das ${h.src('gmg', 'Gebäudemodernisierungsgesetz')}.</p>
<h2>Strom günstig einkaufen</h2>
<p>Wer die Wärmepumpe als steuerbare Verbrauchseinrichtung anmeldet, zahlt ein geringeres Netzentgelt; die Module vergleicht ${h.a('paragraph14a', '§ 14a EnWG')}. Mit einem dynamischen Tarif und Pufferspeicher lässt sich der Betrieb in günstige Stunden legen, wie ${h.a('waermepumpe', 'Wärmepumpe und Strompreis')} zeigt.</p>`;
    },
  },
  nl: {
    slug: 'warmtepomp-kosten',
    nav: 'Warmtepomp kosten',
    card: 'Stookkosten met een (hybride) warmtepomp tegen gas, ISDE 2026 en terugverdientijd.',
    title: 'Warmtepomp kosten 2026: hybride, ISDE en terugverdientijd',
    description: 'Warmtepomp kosten 2026: zie wat een hybride of all-electric warmtepomp per jaar kost tegenover gas, met de ISDE-subsidie van 2026 en de terugverdientijd.',
    h1: 'Warmtepomp kosten: stoken, subsidie en terugverdientijd',
    intro: 'Vul je gasverbruik, het soort warmtepomp en de offerte in. De rekenhulp rekent met de CBS-prijzen voor stroom en gas en trekt de ISDE-subsidie van 2026 af.',
    resume: (h) => {
      const { n, m3, isdeBsp, hybride } = D(h);
      const i = h.P.nl.isde;
      return `Een warmtepomp maakt warmte uit stroom, met een rendement van drie tot vier keer de stroom die erin gaat. Of dat goedkoper is dan stoken op gas, hangt af van de verhouding tussen stroom- en gasprijs. Volgens het CBS kost stroom gemiddeld ${h.ct(n.stroomCt, 2)} en gas ${h.eur(n.gasM3, 3)} per m³, beide met energiebelasting en btw voor een variabel contract. Een huishouden met het gemiddelde verbruik van ${h.num(h.P.nl.milieucentraal.gas_m3)} m³ gas volgens Milieu Centraal, dat 70 % van de warmte met een hybride warmtepomp maakt (aanname, seizoensrendement 3,5, ketelrendement 90 %, ${h.num(m3, 2)} kWh per m³), betaalt ${h.eur(hybride.kostenWp)} per jaar in plaats van ${h.eur(hybride.kostenGas)}. De ISDE-subsidie voor een lucht-waterwarmtepomp, ook hybride, is in 2026 een startbedrag van ${h.eur(i.start_eur)} plus ${h.eur(i.per_kw_eur)} per kW, met ${h.eur(i.label_bonus_eur)} extra bij energielabel A+++ en altijd minstens ${h.eur(i.minimum_eur)}: voor 4 kW is dat ${h.eur(isdeBsp)}. Bij een prijs van 5.000 euro (aanname) is een hybride warmtepomp daarmee in ${j(h, hybride.amortisation)} jaar terugverdiend. Wie vóór eind 2026 koopt, houdt het bedrag per kW van 2026; voor 2027 kondigt RVO lagere bedragen aan.`;
    },
    faqs: (h) => [
      { q: 'Wat kost een hybride warmtepomp per jaar aan stroom?', a: `Dat hangt af van je warmtevraag en het deel dat de warmtepomp levert. Bij het gemiddelde gasverbruik van ${h.num(h.P.nl.milieucentraal.gas_m3)} m³ en 70 procent van de warmte uit de warmtepomp (aanname) gaat het om zo’n ${h.num(D(h).hybride.stromKwh)} kWh stroom per jaar, ongeveer ${h.eur((D(h).hybride.stromKwh * D(h).n.stroomCt) / 100)}. De ketel springt bij op koude dagen. De rekenhulp geeft het getal voor jouw verbruik en seizoensrendement.` },
      { q: 'Is een hybride warmtepomp vanaf 2026 verplicht?', a: 'Nee. Het kabinet heeft afgezien van de normering die vanaf 2026 een hybride warmtepomp of een vergelijkbaar duurzaam alternatief zou voorschrijven bij vervanging van een cv-ketel. Je mag je ketel dus gewoon vervangen door een nieuwe ketel. De ISDE-subsidie voor warmtepompen blijft wel bestaan, met lagere bedragen per kW vanaf 2027.' },
      { q: 'Wanneer vraag ik de ISDE voor een warmtepomp aan?', a: 'Na de installatie, binnen 24 maanden, bij RVO. Het bedrag hangt af van het type warmtepomp, het vermogen in kilowatt en het energielabel; een lucht-waterwarmtepomp met label A+++ krijgt een bonus. Split-units met weinig koudemiddel en een hoge GWP-waarde zijn uitgesloten. Wie in 2026 koopt en installeert, krijgt de bedragen van 2026, ook als de aanvraag pas in 2027 volgt.' },
    ],
    body: (h) => {
      const { n, hybride, allE, isdeBsp, isdeAllE } = D(h);
      const i = h.P.nl.isde;
      const rows = [
        ['Hybride, 4 kW, 70 % warmte', h.eur(hybride.kostenWp), h.eur(hybride.ersparnis), h.eur(isdeBsp), '5.000 €', j(h, hybride.amortisation)],
        ['All-electric, 6 kW', h.eur(allE.kostenWp), h.eur(allE.ersparnis), h.eur(isdeAllE), '12.000 €', j(h, allE.amortisation)],
      ];
      return `<h2>Hybride of all-electric</h2>
${h.table(['Warmtepomp', 'Stookkosten per jaar', 'Besparing', 'ISDE', 'Prijs (aanname)', 'Jaar'], rows, `Gasverbruik ${h.num(h.P.nl.milieucentraal.gas_m3)} m³ (Milieu Centraal), seizoensrendement 3,5, CBS-prijzen ${h.monat(n.maand)}. All-electric bespaart ook de vaste netbeheerkosten voor gas van ${h.eur(n.gasVast)}; zonder nieuwe radiatoren of isolatie`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>De prijzen van stroom en gas zijn de CBS-gemiddelden voor een variabel contract, met energiebelasting en btw, uit ${h.src('cbs')}. Een all-electric warmtepomp heeft vaak een goed geïsoleerd huis en lage-temperatuurverwarming nodig; die kosten zitten niet in de tabel. Het gemiddelde gasverbruik komt van ${h.src('mcVerbruik', 'Milieu Centraal')}.</p>
<h2>ISDE 2026 en 2027</h2>
<p>Volgens ${h.src('rvoIsde2026', 'RVO')} is het startbedrag voor een lucht-waterwarmtepomp in 2026 ${h.eur(i.start_eur)}, tegen ${h.eur(i.start_2025_eur)} in 2025, plus ${h.eur(i.per_kw_eur)} per kW en ${h.eur(i.label_bonus_eur)} bij label A+++. Voor 2027 staat op de ${h.src('rvoIsde2027', 'pagina over 2027')} een verlaging naar ${h.eur(i.per_kw_2027_eur)} per kW, nog niet definitief. De voorwaarden, zoals de apparatenlijst en de termijn van 24 maanden, staan bij ${h.src('rvoIsde', 'RVO')}. De verplichte hybride warmtepomp vanaf 2026 is ${h.src('rijksNormering', 'van tafel')}.</p>
<h2>Belasting en stroomprijs</h2>
<p>De energiebelasting op gas is per kWh warmte veel hoger dan die op stroom. Het voorstel voor 2027 in het ${h.src('sleutel2027', 'Belastingplan 2027')} verhoogt het tarief op gas en verlaagt dat op stroom; de bedragen staan op ${h.a('energiebelasting', 'energiebelasting 2026')}. Wat gas per kuub kost, zie je op ${h.a('gas', 'gasprijs vandaag')}.</p>`;
    },
  },
  en: {
    slug: 'heat-pump-costs',
    nav: 'Heat pump costs',
    card: 'Heat pump running costs against gas, 2026 grants in Germany and the Netherlands, payback.',
    title: 'Heat pump costs 2026: running costs, grants and payback',
    description: 'Heat pump costs in Germany and the Netherlands 2026: running costs against a gas boiler, the KfW grant or Dutch ISDE subsidy, hybrid or all-electric, payback.',
    h1: 'Heat pump costs in Germany and the Netherlands',
    intro: 'Choose the country, then enter your gas use, the expected efficiency, your prices and the quote. The calculator deducts the KfW grant or the Dutch ISDE subsidy.',
    resume: (h) => {
      const { p, gasDe, k, bspDe, kfwGrund, n, isdeBsp, hybride } = D(h);
      return `What a heat pump costs to run depends on the heat your home needs, the seasonal efficiency of the unit and the power price. The heat can be derived from your current gas use. A German home burning 18,000 kWh of gas at 90% boiler efficiency (assumption) needs about ${h.num(bspDe.waerme)} kWh of heat; a heat pump with a seasonal efficiency of 3.5 (assumption) makes it from ${h.num(bspDe.stromKwh)} kWh of power. At an all-in price of ${h.ct(p.preis, 2)} that costs ${h.eur(bspDe.kostenWp)} a year, against ${h.eur(bspDe.kostenGas)} with gas at the Eurostat average of ${h.ct(gasDe, 2)} for the first half of 2026. Since ${h.date(k.ab)} Germany’s KfW grant is ${h.num(k.grund * 100)}% of up to ${h.eur(k.kosten_max)} of eligible costs, plus bonuses up to ${h.num(k.max * 100)}% in total; on a 30,000-euro quote (assumption) the base grant leaves ${h.eur(30000 - kfwGrund.zuschuss)} to pay. In the Netherlands, CBS averages put power at ${h.ct(n.stroomCt, 2)} and gas at ${h.eur(n.gasM3, 3)} per cubic metre with taxes. A hybrid heat pump covering 70% of the heat cuts an average household’s heating bill from ${h.eur(hybride.kostenGas)} to ${h.eur(hybride.kostenWp)} a year, and the 2026 ISDE subsidy for a 4 kW unit with an A+++ label is ${h.eur(isdeBsp)}.`;
    },
    faqs: () => [
      { q: 'What seasonal efficiency should I expect from a heat pump?', a: 'Seasonal efficiency is the ratio of heat produced to electricity used over a whole year. It depends mostly on the flow temperature: underfloor heating works at low temperatures and reaches higher values, while old radiators need hotter water and lower it. The calculator assumes 3.5. An installer can estimate a figure for your home, which you can then enter.' },
      { q: 'How is the German KfW heat pump grant changing in 2027?', a: 'According to KfW, the climate speed bonus falls by four percentage points every six months from 1 February 2027, and the eligible costs fall by 750 euros on the same schedule. For the first quarter of 2027 KfW has announced a cut of the base grant to 15 percent plus a new 15 percent bonus for heat pumps made in the EU. The date of the application decides.' },
      { q: 'Is a hybrid heat pump mandatory in the Netherlands?', a: 'No. The Dutch government dropped the planned standard that would have required a hybrid heat pump or similar option when replacing a boiler from 2026. You may still replace a gas boiler with a new one. The ISDE subsidy for heat pumps continues, with lower amounts per kilowatt announced for 2027 that are not yet final.' },
    ],
    body: (h) => {
      const { p, gasDe, jazRows, foerd, k, n, hybride, allE, isdeBsp, isdeAllE } = D(h);
      const i = h.P.nl.isde;
      const r1 = jazRows.map((x) => [h.num(x.jaz, 1), `${h.num(x.r.stromKwh)} kWh`, h.eur(x.r.kostenWp), h.eur(x.r.kostenGas), h.eur(x.r.ersparnis)]);
      const r2 = foerd.map((x) => [`${h.num(x.x.satz * 100)}%`, h.eur(x.x.zuschuss), h.eur(x.r.netto), j(h, x.r.amortisation)]);
      const r3 = [
        ['Hybrid, 4 kW, 70% of heat', h.eur(hybride.kostenWp), h.eur(hybride.ersparnis), h.eur(isdeBsp), j(h, hybride.amortisation)],
        ['All-electric, 6 kW', h.eur(allE.kostenWp), h.eur(allE.ersparnis), h.eur(isdeAllE), j(h, allE.amortisation)],
      ];
      return `<h2>Germany: running costs by efficiency</h2>
${h.table(['Seasonal efficiency', 'Power', 'Heat pump per year', 'Gas per year', 'Saving'], r1, `18,000 kWh of gas, 90% boiler efficiency (assumption). Power ${h.ct(p.preis, 2)}, gas ${h.ct(gasDe, 2)} (Eurostat, first half of 2026), standing charges excluded`, ['r', 'r', 'r', 'r', 'r'])}
<p>The gas price is the ${h.src('eurostatGas', 'Eurostat')} average for households using 20 to 199 gigajoules a year, all taxes included; its make-up is on ${h.a('gaspreis', 'gas price Germany')}. A heat pump registered as a controllable device pays a lower grid fee, see ${h.a('paragraph14a', 'section 14a EnWG')}, and running it in cheap hours is covered on ${h.a('waermepumpe', 'heat pump electricity price')}.</p>
<h2>Germany: KfW grant and payback</h2>
${h.table(['Grant rate', 'Grant', 'Your share', 'Years'], r2, `Quote €30,000 (assumption), eligible up to ${h.eur(k.kosten_max)}: base grant, with climate speed bonus, with income bonus up to €40,000 and up to €30,000. Seasonal efficiency 3.5`, ['r', 'r', 'r', 'r'])}
<p>From ${h.date(k.ab)} the ${h.src('kfwPresse', 'KfW')} pays ${h.num(k.grund * 100)}% base grant, a ${h.num(k.klima * 100)}% climate speed bonus for replacing an old fossil heating system, and an income bonus of ${h.num(k.einkommen.bis30000 * 100)}%, ${h.num(k.einkommen.bis40000 * 100)}% or ${h.num(k.einkommen.bis50000 * 100)}% for taxable household income up to 30,000, 40,000 or 50,000 euros. The efficiency bonus has gone. Details are in ${h.src('kfw458', 'KfW leaflet 458')}. The ${h.src('gmg', 'Building Modernisation Act')} has applied since 29 July 2026.</p>
<h2>Netherlands: hybrid or all-electric</h2>
${h.table(['Heat pump', 'Heating per year', 'Saving', 'ISDE', 'Years'], r3, `Gas use ${h.num(h.P.nl.milieucentraal.gas_m3)} m³ (Milieu Centraal), seasonal efficiency 3.5, CBS prices ${h.monat(n.maand)}, prices €5,000 and €12,000 (assumptions)`, ['l', 'r', 'r', 'r', 'r'])}
<p>The ${h.src('rvoIsde2026', 'RVO')} sets the 2026 ISDE for an air-to-water heat pump, hybrid included, at ${h.eur(i.start_eur)} plus ${h.eur(i.per_kw_eur)} per kW and ${h.eur(i.label_bonus_eur)} for an A+++ label, at least ${h.eur(i.minimum_eur)}. Conditions are on the ${h.src('rvoIsde', 'RVO heat pump page')}; the planned 2027 cut to ${h.eur(i.per_kw_2027_eur)} per kW is on the ${h.src('rvoIsde2027', '2027 page')}. Dutch energy tax rates are on ${h.a('energiebelasting', 'energy tax Netherlands 2026')}.</p>`;
    },
  },
});
