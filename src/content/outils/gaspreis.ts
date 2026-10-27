import { defineGuide, type Helpers } from '../../lib/guide-types';
import { co2Ct, gasDe } from '../../lib/engine/haus';

/** Gaspreis (DE) : Eurostat-Halbjahresmittel, Zerlegung laut Monitoringbericht 2025, Steuern und CO₂-Preis aus Gesetz und DEHSt. Kein Tagespreis. */
function D(h: Helpers) {
  const g = h.P.de.gas;
  const e = g.eurostat_ct;
  const akt = e['2026S1'];
  const mb = g.monitoring2025_ct;
  const ust = 1 + h.P.de.ust;
  const co2 = co2Ct();
  const co2Brutto = co2 * ust;
  const steuerBrutto = g.energiesteuer_ct * ust;
  const mengen = [10000, 15000, 20000, 30000].map((kwh) => ({ kwh, r: gasDe({ kwh, arbeitspreisCt: akt.brutto, grundMonat: 0 }) }));
  const speicher20 = (20000 * g.speicherumlage_bis2025_ct * ust) / 100;
  return { g, e, akt, mb, co2, co2Brutto, steuerBrutto, mengen, speicher20, staat: akt.ohneUst - akt.ohneSteuern };
}

export default defineGuide({
  id: 'gaspreis',
  group: 'gas',
  order: 20,
  tool: 'gasde',
  zone: 'DE-LU',
  related: ['wpkosten', 'stromkosten', 'zusammensetzung', 'gas'],
  sources: ['eurostatGas', 'monitoringGas', 'bnetzaGas', 'energiestg', 'behg', 'dehst', 'ebev', 'bregSpeicher', 'kav', 'ustg'],
  de: {
    slug: 'gaspreis-aktuell',
    nav: 'Gaspreis aktuell',
    card: 'Was eine Kilowattstunde Gas für Haushalte kostet, woraus der Preis besteht und Ihre Jahreskosten.',
    title: 'Gaspreis aktuell 2026: Kosten je kWh und Bestandteile',
    description: 'Gaspreis aktuell für Haushalte: Mittel je kWh laut Eurostat für 2026, Steuern, CO₂-Preis und Netz laut Monitoringbericht, dazu Ihre Gaskosten vom Zählerstand.',
    h1: 'Gaspreis aktuell: was eine Kilowattstunde Gas 2026 kostet',
    intro: 'Tragen Sie den Verbrauch in Kubikmetern vom Zähler oder in Kilowattstunden von der Rechnung ein, dazu Ihren Arbeitspreis. Voreingestellt ist das Eurostat-Mittel für 2026.',
    resume: (h) => {
      const { g, e, akt, mb, co2, steuerBrutto, co2Brutto } = D(h);
      return `Der aktuellste amtliche Gaspreis für deutsche Haushalte ist das Halbjahresmittel von Eurostat: Im ersten Halbjahr 2026 zahlten Haushalte mit einem Verbrauch von rund 5.600 bis 55.000 kWh im Jahr im Schnitt ${h.ct(akt.brutto, 2)} einschließlich aller Steuern und Abgaben, nach ${h.ct(e['2025S2'].brutto, 2)} im zweiten Halbjahr 2025. Ohne Umsatzsteuer waren es ${h.ct(akt.ohneUst, 2)}. Einen Tagespreis für Gas veröffentlichen wir nicht, weil die Börsenpreise für Gas nicht frei verwendbar sind. Fest stehen die staatlichen Bestandteile: Die Energiesteuer beträgt nach § 2 EnergieStG ${h.ct(g.energiesteuer_ct, 2)} netto, der CO₂-Preis nach dem Brennstoffemissionshandelsgesetz ${h.num(g.co2_eur_t)} Euro je Tonne, das sind mit dem Emissionsfaktor für Erdgas rund ${h.ct(co2, 2)} netto. Mit ${h.num(h.P.de.ust * 100)} % Umsatzsteuer kosten beide zusammen ${h.ct(steuerBrutto + co2Brutto, 2)}. Die Gasspeicherumlage ist seit dem 1. Januar 2026 abgeschafft. Wie sich der Preis im Einzelnen zusammensetzt, zeigt der Monitoringbericht von Bundesnetzagentur und Bundeskartellamt: Am 1. April 2025 kostete Gas im Mittel ${h.ct(mb.gesamt, 2)}, davon ${h.ct(mb.beschaffung, 2)} für die Beschaffung und ${h.ct(mb.netz, 2)} für das Netz. Ihre eigenen Gaskosten rechnet der Rechner aus Zählerstand, Brennwert und Zustandszahl.`;
    },
    faqs: () => [
      { q: 'Wie rechne ich Kubikmeter Gas in Kilowattstunden um?', a: 'Multiplizieren Sie die Kubikmeter vom Zähler mit dem Brennwert und der Zustandszahl. Beide Werte stehen auf Ihrer Gasrechnung; der Brennwert liegt meist um 10 kWh je Kubikmeter, die Zustandszahl knapp unter 1. Aus 1.800 Kubikmetern werden so rund 17.000 kWh. Abgerechnet wird immer in Kilowattstunden, deshalb brauchen Sie diese Umrechnung, um Ihren Arbeitspreis anzuwenden.' },
      { q: 'Wird Gas 2027 teurer?', a: 'Eine Prognose für den Großhandelspreis geben wir nicht. Bekannt sind nur die festen Teile: Die Energiesteuer ist im Gesetz ohne Enddatum festgelegt, die Gasspeicherumlage ist seit 2026 abgeschafft, und der CO₂-Preis lag 2026 am oberen Rand des gesetzlichen Korridors. Wie sich Beschaffung und Netzentgelte entwickeln, zeigt erst die nächste Erhebung. Ein Festpreisvertrag schützt für seine Laufzeit vor Änderungen.' },
      { q: 'Warum zahlen Grundversorgungskunden mehr für Gas?', a: 'Laut Monitoringbericht zahlten Haushalte in der Grundversorgung am 1. April 2025 im Mittel 13,57 ct je kWh, Kunden bei einem anderen Lieferanten 11,56 ct. Die Grundversorgung ist jederzeit kündbar und muss jeden Haushalt beliefern, das kostet. Wer noch in der Grundversorgung ist, kann mit einem Wechsel meist sparen; vergleichen Sie Arbeitspreis und Grundpreis zusammen.' },
    ],
    body: (h) => {
      const { g, e, mb, co2Brutto, steuerBrutto, mengen, speicher20 } = D(h);
      const r1 = [
        ['Beschaffung', mb.beschaffung], ['Vertrieb und Marge', mb.vertrieb], ['Netzentgelt', mb.netz], ['Messung und Messstellenbetrieb', mb.messung + mb.messstellenbetrieb],
        ['Konzessionsabgabe', mb.konzession], ['CO₂-Preis', mb.co2], ['Energiesteuer', mb.energiesteuer], ['Umsatzsteuer', mb.ust], ['Gesamt', mb.gesamt],
      ].map(([k, v]) => [k as string, h.ct(v as number, 2)]);
      const r2 = (['2025S1', '2025S2', '2026S1'] as const).map((k) => [`${k.slice(5) === 'S1' ? '1.' : '2.'} Halbjahr ${k.slice(0, 4)}`, h.ct(e[k].brutto, 2), h.ct(e[k].ohneUst, 2), h.ct(e[k].ohneSteuern, 2)]);
      const r3 = mengen.map((x) => [`${h.num(x.kwh)} kWh`, h.eur(x.r.jahr), h.eur(x.r.monat), h.eur(x.r.energiesteuer + x.r.co2)]);
      return `<h2>Gaspreis je Halbjahr</h2>
${h.table(['Zeitraum', 'mit allen Steuern', 'ohne Umsatzsteuer', 'ohne Steuern und Abgaben'], r2, 'Haushalte in Deutschland, Verbrauch 20 bis 199 GJ im Jahr (Band D2), Eurostat nrg_pc_202', ['l', 'r', 'r', 'r'])}
<p>Die Werte stammen aus der Datenbank ${h.src('eurostatGas', 'Eurostat nrg_pc_202')} und erscheinen halbjährlich, einige Monate nach dem Ende des Halbjahres. Sie sind ein Mittel über alle Vertragsarten; Neukundentarife können darüber oder darunter liegen.</p>
<h2>Woraus der Gaspreis besteht</h2>
${h.table(['Bestandteil', 'ct/kWh'], r1, 'Mengengewichteter Mittelwert für Haushalte, Stichtag 1. April 2025, Monitoringbericht 2025, Tabelle 68', ['l', 'r'])}
<p>Die Zerlegung stammt aus dem ${h.src('monitoringGas', 'Monitoringbericht 2025')}; eine Übersicht bietet die ${h.src('bnetzaGas', 'Bundesnetzagentur')}. Damals galt noch der CO₂-Preis von 55 Euro je Tonne. Für 2026 sieht ${h.src('behg', '§ 10 BEHG')} einen Korridor von ${h.num(g.co2_min_eur_t)} bis ${h.num(g.co2_max_eur_t)} Euro vor; die ${h.src('dehst', 'Emissionshandelsstelle')} hat zu ${h.num(g.co2_eur_t)} Euro versteigert. Mit dem Emissionsfaktor aus der ${h.src('ebev', 'Emissionsberichterstattungsverordnung')} sind das ${h.ct(co2Brutto, 2)} mit Umsatzsteuer. Die Energiesteuer nach ${h.src('energiestg', '§ 2 EnergieStG')} kostet mit Umsatzsteuer ${h.ct(steuerBrutto, 2)}. Die Konzessionsabgabe an die Gemeinde ist in ${h.src('kav', '§ 2 KAV')} gedeckelt, bei Tarifkunden auf ${h.ct(g.konzession_ct.bis25000, 2)} bis ${h.ct(g.konzession_ct.ueber500000, 2)} je nach Gemeindegröße, bei Sonderverträgen auf ${h.ct(g.konzession_ct.sondervertrag, 2)}.</p>
<h2>Jahreskosten nach Verbrauch</h2>
${h.table(['Verbrauch', 'pro Jahr', 'pro Monat', 'darin Energiesteuer und CO₂'], r3, 'Zum Eurostat-Mittel des ersten Halbjahres 2026, einschließlich Umsatzsteuer und anteiligem Grundpreis', ['r', 'r', 'r', 'r'])}
<p>Die abgeschaffte ${h.src('bregSpeicher', 'Gasspeicherumlage')} hätte bei 20.000 kWh mit Umsatzsteuer rund ${h.eur(speicher20)} im Jahr gekostet. Ob sich der Wechsel zur Wärmepumpe rechnet, zeigt ${h.a('wpkosten', 'Wärmepumpe Kosten')}; den Strompreis zerlegt ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}.</p>`;
    },
  },
  en: {
    slug: 'gas-price-germany',
    nav: 'Gas price Germany',
    card: 'What a kilowatt-hour of gas costs German households, what is in the price, and your yearly bill.',
    title: 'Gas price Germany 2026: cost per kWh and what is in it',
    description: 'Gas price in Germany for households: the 2026 Eurostat average per kWh, tax, CO₂ price and grid fees from the monitoring report, and your bill from the meter.',
    h1: 'Gas price in Germany: what a kilowatt-hour costs in 2026',
    intro: 'Enter your consumption in cubic metres from the meter or in kilowatt-hours from your bill, plus your energy rate. The preset is the Eurostat average for 2026.',
    resume: (h) => {
      const { g, e, akt, mb, co2, steuerBrutto, co2Brutto } = D(h);
      return `The most recent official gas price for German households is Eurostat’s half-yearly average: in the first half of 2026, households using roughly 5,600 to 55,000 kWh a year paid ${h.ct(akt.brutto, 2)} on average, all taxes and levies included, after ${h.ct(e['2025S2'].brutto, 2)} in the second half of 2025. Before VAT it was ${h.ct(akt.ohneUst, 2)}. We do not publish a daily gas price, because exchange prices for gas are not free to reuse. The state components are fixed: energy tax under section 2 of the Energy Tax Act is ${h.ct(g.energiesteuer_ct, 2)} net, and the CO₂ price under the Fuel Emissions Trading Act is ${h.num(g.co2_eur_t)} euros per tonne, about ${h.ct(co2, 2)} net with the emission factor for natural gas. With ${h.num(h.P.de.ust * 100)}% VAT, the two together cost ${h.ct(steuerBrutto + co2Brutto, 2)}. The gas storage levy was abolished on 1 January 2026. The detailed make-up comes from the monitoring report of the Federal Network Agency and the Federal Cartel Office: on 1 April 2025 gas averaged ${h.ct(mb.gesamt, 2)}, of which ${h.ct(mb.beschaffung, 2)} was procurement and ${h.ct(mb.netz, 2)} the grid. The calculator works out your own bill from the meter reading, calorific value and correction factor.`;
    },
    faqs: () => [
      { q: 'How do I convert cubic metres of gas into kilowatt-hours?', a: 'Multiply the cubic metres on the meter by the calorific value and the volume correction factor, both printed on your German gas bill. The calorific value is usually around 10 kWh per cubic metre and the correction factor just below 1, so 1,800 cubic metres become roughly 17,000 kWh. Gas is always billed in kilowatt-hours, which is why you need this step.' },
      { q: 'Will German gas get dearer in 2027?', a: 'We do not forecast wholesale prices. Only the fixed parts are known: the energy tax is set in law without an end date, the gas storage levy was abolished in 2026, and the CO₂ price in 2026 sat at the top of the legal corridor. How procurement and grid fees move will only show in the next survey. A fixed-price contract protects you for its term.' },
      { q: 'Why do default supply customers pay more for gas?', a: 'According to the monitoring report, households on default supply (Grundversorgung) paid 13.57 ct per kWh on average on 1 April 2025, while customers of another supplier paid 11.56 ct. Default supply can be cancelled at any time and must serve every household, which costs more. Switching usually saves money; compare the energy rate and the standing charge together.' },
    ],
    body: (h) => {
      const { g, e, mb, co2Brutto, steuerBrutto, mengen, speicher20 } = D(h);
      const r1 = [
        ['Procurement', mb.beschaffung], ['Sales and margin', mb.vertrieb], ['Grid fee', mb.netz], ['Metering', mb.messung + mb.messstellenbetrieb],
        ['Concession fee', mb.konzession], ['CO₂ price', mb.co2], ['Energy tax', mb.energiesteuer], ['VAT', mb.ust], ['Total', mb.gesamt],
      ].map(([k, v]) => [k as string, h.ct(v as number, 2)]);
      const r2 = (['2025S1', '2025S2', '2026S1'] as const).map((k) => [`${k.slice(5) === 'S1' ? 'First' : 'Second'} half ${k.slice(0, 4)}`, h.ct(e[k].brutto, 2), h.ct(e[k].ohneUst, 2), h.ct(e[k].ohneSteuern, 2)]);
      const r3 = mengen.map((x) => [`${h.num(x.kwh)} kWh`, h.eur(x.r.jahr), h.eur(x.r.monat), h.eur(x.r.energiesteuer + x.r.co2)]);
      return `<h2>Gas price by half-year</h2>
${h.table(['Period', 'All taxes', 'Before VAT', 'Before taxes and levies'], r2, 'Households in Germany using 20 to 199 GJ a year (band D2), Eurostat nrg_pc_202', ['l', 'r', 'r', 'r'])}
<p>The figures come from ${h.src('eurostatGas', 'Eurostat nrg_pc_202')} and are published every six months, a few months after each half-year ends. They average all contract types; new-customer offers can be above or below.</p>
<h2>What the gas price is made of</h2>
${h.table(['Component', 'ct/kWh'], r1, 'Volume-weighted household average, 1 April 2025, Monitoring Report 2025, table 68', ['l', 'r'])}
<p>The breakdown is from the ${h.src('monitoringGas', 'Monitoring Report 2025')}; the ${h.src('bnetzaGas', 'Federal Network Agency')} has a summary. The CO₂ price was still 55 euros per tonne then. For 2026, ${h.src('behg', 'section 10 BEHG')} sets a corridor of ${h.num(g.co2_min_eur_t)} to ${h.num(g.co2_max_eur_t)} euros and the ${h.src('dehst', 'German Emissions Trading Authority')} auctioned at ${h.num(g.co2_eur_t)} euros; with the emission factor from the ${h.src('ebev', 'Emissions Reporting Ordinance')} that is ${h.ct(co2Brutto, 2)} including VAT. Energy tax under ${h.src('energiestg', 'section 2 EnergieStG')} costs ${h.ct(steuerBrutto, 2)} with VAT. The municipal concession fee is capped in ${h.src('kav', 'section 2 KAV')}: ${h.ct(g.konzession_ct.bis25000, 2)} to ${h.ct(g.konzession_ct.ueber500000, 2)} for standard tariff customers depending on town size, ${h.ct(g.konzession_ct.sondervertrag, 2)} on special contracts.</p>
<h2>Yearly cost by consumption</h2>
${h.table(['Consumption', 'Per year', 'Per month', 'Of which energy tax and CO₂'], r3, 'At the Eurostat average for the first half of 2026, VAT and a share of the standing charge included', ['r', 'r', 'r', 'r'])}
<p>The abolished ${h.src('bregSpeicher', 'gas storage levy')} would have cost about ${h.eur(speicher20)} a year at 20,000 kWh including VAT. Whether a heat pump pays off is on ${h.a('wpkosten', 'heat pump costs')}; the German power price is broken down on ${h.a('zusammensetzung', 'German electricity price breakdown')}.</p>`;
    },
  },
});
