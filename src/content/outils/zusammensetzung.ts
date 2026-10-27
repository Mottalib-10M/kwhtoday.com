import { defineGuide, type Helpers } from '../../lib/guide-types';
import { tagAm, fenster, eDe } from '../../lib/fakten';
import { zerlegen, umlagenDe, BUNDESLAENDER, type Bundesland } from '../../lib/engine/tarif';

/** Strompreis-Zusammensetzung Deutschland : jeder Bestandteil je kWh, Netzentgelt je Bundesland. */
const LAND: Record<Bundesland, string> = {
  DE: 'Deutschland', BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen',
  ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen',
};
function D(h: Helpers) {
  const t = tagAm('DE-LU', h.today);
  const w = fenster('DE-LU', 30);
  const z = zerlegen('DE-LU', w.mittel, eDe(0));
  const netz = h.P.de.netzentgelt2025_ct as unknown as Record<string, number>;
  const laender = BUNDESLAENDER.filter((b) => b !== 'DE').map((b) => ({ b, n: netz[b], end: zerlegen('DE-LU', w.mittel, { aufschlag: 0, netz: netz[b], gemeinde: 'bis100000' }).brutto })).sort((a, b) => b.n - a.n);
  const fest = z.netto - z.boerse;
  return { t, w, z, laender, fest, anteilBoerse: z.boerse / z.netto };
}

export default defineGuide({
  id: 'zusammensetzung',
  group: 'tarif',
  order: 20,
  tool: 'preis',
  zone: 'DE-LU',
  related: ['netzentgelte', 'vergleich', 'stromkosten', 'preis', 'verlauf', 'negativ', 'gaspreis'],
  sources: ['stromstg', 'stromstg9b', 'bregNetzentgelte', 'ustg', 'kav', 'ihk', 'monitoring', 'smard'],
  de: {
    slug: 'strompreis-zusammensetzung',
    nav: 'Strompreis-Zusammensetzung',
    card: 'Börse, Netzentgelt, Stromsteuer, Umlagen, Konzessionsabgabe, Umsatzsteuer.',
    title: 'Strompreis-Zusammensetzung 2026: jeder Cent je kWh erklärt',
    description: 'Strompreis-Zusammensetzung 2026: Börsenpreis, Netzentgelt je Bundesland, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer, mit Quelle je Betrag.',
    h1: 'Strompreis-Zusammensetzung: woraus die Kilowattstunde besteht',
    intro: 'Der Rechner zerlegt jede Viertelstunde in Börsenpreis und feste Bestandteile. Wählen Sie Ihr Bundesland und Ihre Gemeindegröße.',
    resume: (h) => {
      const { w, z, fest, anteilBoerse } = D(h);
      return `Der Strompreis eines deutschen Haushalts setzt sich aus einem schwankenden und mehreren festen Teilen zusammen. Schwankend ist nur der Energiepreis, also der Börsenpreis plus der Aufschlag des Anbieters. Fest je Kilowattstunde sind das Netzentgelt (im Bundesmittel 2025 ${h.ct(h.P.de.netzentgelt2025_ct.DE, 2)} netto), die Stromsteuer von ${h.ct(h.P.de.stromsteuer_ct, 2)} nach § 3 Stromsteuergesetz, die drei Umlagen von zusammen ${h.ct(umlagenDe(), 3)} und die Konzessionsabgabe an die Gemeinde, für Tarifkunden zwischen ${h.ct(h.P.de.konzessionsabgabe_ct.bis25000, 2)} und ${h.ct(h.P.de.konzessionsabgabe_ct.ueber500000, 2)} je nach Einwohnerzahl. Auf die Summe kommen ${h.num(h.P.de.ust * 100)} % Umsatzsteuer. Beim mittleren Börsenpreis der letzten ${h.num(w.n)} Tage, ${h.spot(w.mittel, 2)}, machen die festen Teile ohne Umsatzsteuer ${h.ct(fest, 2)} aus und der Börsenpreis ${h.pct(anteilBoerse, 0)} des Nettopreises; mit Umsatzsteuer und ohne Anbieteraufschlag ergibt das ${h.ct(z.brutto, 2)}. Dazu kommen Grundgebühr und Messstellenbetrieb als feste Beträge im Jahr, die nicht von der Kilowattstunde abhängen. Weil die festen Teile so groß sind, verändert selbst ein Börsenpreis von null den Endpreis nur um einen Teil.`;
    },
    faqs: () => [
      { q: 'Wer bekommt das Netzentgelt?', a: 'Der Betreiber des örtlichen Verteilnetzes, an das Ihr Haus angeschlossen ist, und über ihn die vorgelagerten Netzbetreiber bis zum Übertragungsnetz. Die Höhe genehmigt die Bundesnetzagentur oder die Landesregulierungsbehörde; sie unterscheidet sich stark von Netz zu Netz. Ihr Anbieter zieht das Entgelt mit der Stromrechnung ein und reicht es weiter, auch bei einem dynamischen Tarif.' },
      { q: 'Wofür sind die drei Umlagen auf der Stromrechnung?', a: 'Die KWKG-Umlage finanziert die Förderung von Kraft-Wärme-Kopplungsanlagen, die Offshore-Netzumlage die Anbindung der Windparks auf See, und der Aufschlag für besondere Netznutzung gleicht Netzentgeltrabatte für stromintensive Betriebe aus. Die Übertragungsnetzbetreiber legen die Sätze jedes Jahr im Oktober für das Folgejahr fest. Die frühere EEG-Umlage gibt es seit Juli 2022 nicht mehr.' },
      { q: 'Warum ist das Netzentgelt im Norden oft anders als im Süden?', a: 'Weil Netzbetreiber ihre Kosten auf die Kunden in ihrem Gebiet umlegen: dünn besiedelte Regionen mit viel Leitung je Einwohner und hohem Ausbau für Wind- und Solaranlagen hatten lange höhere Entgelte. Seit 2025 verteilt die Bundesnetzagentur einen Teil dieser Mehrkosten bundesweit. Die Tabelle zeigt die Mittelwerte 2025 je Land aus dem Monitoringbericht.' },
      { q: 'Sinkt die Stromsteuer 2026 auch für private Haushalte?', a: 'Nein. Für Haushalte bleibt es nach § 3 StromStG bei 20,50 Euro je Megawattstunde, also 2,05 Cent je Kilowattstunde vor Umsatzsteuer. Seit dem 1. Januar 2026 erhalten Unternehmen des Produzierenden Gewerbes und der Land- und Forstwirtschaft nach § 9b eine dauerhafte Entlastung von 2 Cent, sodass sie nur den EU-Mindestsatz zahlen. Eine Strompreisbremse wie 2023 gibt es 2026 nicht; der Bund senkt stattdessen mit 6,5 Milliarden Euro die Übertragungsnetzentgelte.' },
    ],
    body: (h) => {
      const { z, w, laender } = D(h);
      const k = (key: string) => z.teile.find((x) => x.k === key)!.ct;
      const rows = [
        ['Börsenpreis (Mittel letzte 30 Tage)', h.ct(z.boerse, 2), h.src('smard', 'SMARD')],
        ['Aufschlag des Anbieters', 'laut Vertrag', 'Ihr Vertrag'],
        ['Netzentgelt (Bundesmittel 2025)', h.ct(k('netz'), 2), h.src('monitoring', 'Monitoringbericht')],
        ['Stromsteuer', h.ct(k('stromsteuer'), 2), h.src('stromstg', '§ 3 StromStG')],
        ['KWKG-Umlage', h.ct(h.P.de.umlagen_ct.kwkg, 3), h.src('ihk', 'ÜNB 2026')],
        ['Offshore-Netzumlage', h.ct(h.P.de.umlagen_ct.offshore, 3), h.src('ihk', 'ÜNB 2026')],
        ['Aufschlag besondere Netznutzung', h.ct(h.P.de.umlagen_ct.besondereNetznutzung, 3), h.src('ihk', 'ÜNB 2026')],
        ['Konzessionsabgabe (bis 100.000 Einwohner)', h.ct(k('konzession'), 2), h.src('kav', '§ 2 KAV')],
        [`Umsatzsteuer ${h.num(h.P.de.ust * 100)} %`, h.ct(z.steuer, 2), h.src('ustg', '§ 12 UStG')],
        ['Endpreis ohne Aufschlag', h.ct(z.brutto, 2), ''],
      ];
      const lr = laender.map((x) => [LAND[x.b], h.ct(x.n, 2), h.ct(x.end, 1)]);
      return `<h2>Jeder Bestandteil mit Quelle</h2>
${h.table(['Bestandteil', 'ct/kWh', 'Quelle'], rows, `Börsenmittel ${h.date(w.von)} bis ${h.date(w.bis)}, Gemeinde bis 100.000 Einwohner`, ['l', 'r', 'l'])}
<p>Die Umlagen gelten für Letztverbraucher bis 1 Gigawattstunde im Jahr (Kategorie A). Die Konzessionsabgabe ist der Höchstbetrag für Tarifkunden; viele Gemeinden verlangen ihn, einige weniger. Für Strom in Schwachlastzeiten sieht die Verordnung einen niedrigeren Satz vor, der bei Haushalten mit Nachtspeicher oder Wärmepumpentarif gelten kann.</p>
<h2>Netzentgelt nach Bundesland</h2>
${h.table(['Bundesland', 'Netzentgelt netto 2025', 'Endpreis ohne Aufschlag'], lr, 'Mittelwerte für Haushaltskunden laut Monitoringbericht 2025, einschließlich umgelegtem Grundpreis', ['l', 'r', 'r'])}
<p>Die Mittelwerte stammen aus dem ${h.src('monitoring')} von Bundesnetzagentur und Bundeskartellamt. Ihr eigener Netzbetreiber kann darüber oder darunter liegen; der Betrag steht auf Ihrer Jahresabrechnung und lässt sich im Rechner oben eintragen.</p>
<h2>Was das für dynamische Tarife heißt</h2>
<p>Weil nur der Börsenanteil schwankt, ist der Unterschied zwischen billigster und teuerster Viertelstunde für Sie genau so groß wie an der Börse, zuzüglich Umsatzsteuer. Wie viel das über einen Monat ausmacht, rechnet ${h.a('vergleich', 'dynamischer Stromtarif')}; wann der Börsenanteil unter null fällt, zeigt ${h.a('negativ', 'negative Strompreise')}.</p>`;
    },
  },
  en: {
    slug: 'german-electricity-price-breakdown',
    nav: 'German price breakdown',
    card: 'Exchange price, grid fee, electricity tax, levies, concession fee and VAT.',
    title: 'Electricity price breakdown Germany 2026, cent by cent',
    description: 'Electricity price breakdown for Germany in 2026: exchange price, grid fee by state, electricity tax, levies, concession fee and VAT, each with its source.',
    h1: 'German electricity price breakdown: what a kilowatt-hour is made of',
    intro: 'The calculator splits every quarter hour into the exchange price and the fixed parts. Pick your federal state and the size of your municipality.',
    resume: (h) => {
      const { w, z, fest, anteilBoerse } = D(h);
      return `The electricity price paid by a German household has one moving part and several fixed ones. Only the energy price moves: the exchange price plus the supplier’s markup. Fixed per kilowatt-hour are the grid fee (a 2025 national average of ${h.ct(h.P.de.netzentgelt2025_ct.DE, 2)} net), electricity tax of ${h.ct(h.P.de.stromsteuer_ct, 2)} under section 3 of the Electricity Tax Act, three levies totalling ${h.ct(umlagenDe(), 3)}, and the concession fee paid to the municipality, between ${h.ct(h.P.de.konzessionsabgabe_ct.bis25000, 2)} and ${h.ct(h.P.de.konzessionsabgabe_ct.ueber500000, 2)} for standard customers depending on population. VAT of ${h.num(h.P.de.ust * 100)}% is charged on the total. At the average exchange price of the last ${h.num(w.n)} days, ${h.spot(w.mittel, 2)}, the fixed parts come to ${h.ct(fest, 2)} before VAT and the exchange price makes up ${h.pct(anteilBoerse, 0)} of the net price; with VAT and no supplier markup the total is ${h.ct(z.brutto, 2)}. A standing charge and a metering fee come on top as fixed yearly amounts that do not depend on use. Because the fixed parts are so large, even an exchange price of zero moves the all-in price only part of the way down.`;
    },
    faqs: () => [
      { q: 'Who receives the German grid fee?', a: 'The operator of the local distribution grid your home is connected to, and through it the upstream operators up to the transmission grid. The level is approved by the Federal Network Agency or a state regulator and varies widely between grids. Your supplier collects the fee on your bill and passes it on, on a dynamic tariff as well.' },
      { q: 'What are the three levies on a German bill for?', a: 'The CHP levy funds support for combined heat and power plants, the offshore grid levy pays for connecting wind farms at sea, and the special grid use surcharge offsets grid fee discounts for energy-intensive businesses. The transmission operators set the rates every October for the following year. The former renewable energy (EEG) levy was abolished in July 2022.' },
      { q: 'Why do grid fees differ so much between German states?', a: 'Grid operators spread their costs over the customers in their area, so sparsely populated regions with a lot of line per inhabitant and heavy investment for wind and solar had higher fees for years. Since 2025 the Federal Network Agency spreads part of those extra costs nationwide. The table shows the 2025 averages per state from the monitoring report.' },
      { q: 'Does the German electricity tax fall for households in 2026?', a: 'No. For households it stays at 20.50 euros per megawatt-hour under section 3 of the Electricity Tax Act, or 2.05 cents per kilowatt-hour before VAT. Since 1 January 2026 manufacturing, farming and forestry businesses get a permanent relief of 2 cents under section 9b, so they pay only the EU minimum. There is no price brake like the one of 2023; instead the federal government spends 6.5 billion euros to lower transmission grid fees.' },
    ],
    body: (h) => {
      const { z, w, laender } = D(h);
      const k = (key: string) => z.teile.find((x) => x.k === key)!.ct;
      const rows = [
        ['Exchange price (30-day average)', h.ct(z.boerse, 2), h.src('smard', 'SMARD')],
        ['Supplier markup', 'per contract', 'your contract'],
        ['Grid fee (2025 national average)', h.ct(k('netz'), 2), h.src('monitoring', 'monitoring report')],
        ['Electricity tax', h.ct(k('stromsteuer'), 2), h.src('stromstg', 'StromStG s. 3')],
        ['CHP levy', h.ct(h.P.de.umlagen_ct.kwkg, 3), h.src('ihk', 'TSOs 2026')],
        ['Offshore grid levy', h.ct(h.P.de.umlagen_ct.offshore, 3), h.src('ihk', 'TSOs 2026')],
        ['Special grid use surcharge', h.ct(h.P.de.umlagen_ct.besondereNetznutzung, 3), h.src('ihk', 'TSOs 2026')],
        ['Concession fee (up to 100,000 inhabitants)', h.ct(k('konzession'), 2), h.src('kav', 'KAV s. 2')],
        [`VAT ${h.num(h.P.de.ust * 100)}%`, h.ct(z.steuer, 2), h.src('ustg', 'UStG s. 12')],
        ['All-in, no markup', h.ct(z.brutto, 2), ''],
      ];
      const lr = laender.map((x) => [LAND[x.b], h.ct(x.n, 2), h.ct(x.end, 1)]);
      return `<h2>Every component with its source</h2>
${h.table(['Component', 'ct/kWh', 'Source'], rows, `Exchange average ${h.date(w.von)} to ${h.date(w.bis)}, municipality up to 100,000 inhabitants`, ['l', 'r', 'l'])}
<p>The levies apply to final consumers using up to 1 gigawatt-hour a year (category A). The concession fee is the cap for standard customers; many municipalities charge it in full, some less. The ordinance sets a lower rate for off-peak supply, which can apply to households on a night storage or heat pump tariff.</p>
<h2>Grid fee by federal state</h2>
${h.table(['Federal state', 'Net grid fee 2025', 'All-in, no markup'], lr, 'Household averages from the 2025 monitoring report, standing charge share included', ['l', 'r', 'r'])}
<p>The averages come from the ${h.src('monitoring')} of the Federal Network Agency and the Federal Cartel Office. Your own grid operator may be above or below; the amount is on your annual bill and can be entered in the calculator above.</p>
<h2>What this means for dynamic tariffs</h2>
<p>Since only the exchange part moves, the gap between the cheapest and dearest quarter hour is exactly as wide for you as on the exchange, plus VAT. How much that adds up to over a month is on ${h.a('vergleich', 'dynamic electricity tariff')}; when the exchange part drops below zero, on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
});
