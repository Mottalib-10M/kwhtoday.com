import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster } from '../../lib/fakten';
import { zerlegen, umlagenDe } from '../../lib/engine/tarif';

/** Netzentgelte 2026 (DE) : Anteil am kWh-Preis, Mittel 2025, Entlastung 2026 laut Bundesnetzagentur. */
const LAND: Record<string, string> = { BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen' };
function D(h: Helpers) {
  const w = fenster('DE-LU', 30);
  const netz = h.P.de.netzentgelt2025_ct.DE;
  const n26 = h.P.de.netzentgelt2026;
  const z = zerlegen('DE-LU', w.mittel, { aufschlag: 0, netz, gemeinde: 'bis100000' });
  const z26 = zerlegen('DE-LU', w.mittel, { aufschlag: 0, netz: netz - n26.senkung_ct, gemeinde: 'bis100000' });
  const netzBrutto = netz * (1 + h.P.de.ust);
  const anteil = netzBrutto / z.brutto;
  const laender = Object.entries(h.P.de.netzentgelt2025_ct).filter(([k]) => k in LAND).map(([k, v]) => ({ k, v: v as number })).sort((a, b) => b.v - a.v);
  return { w, netz, n26, z, z26, netzBrutto, anteil, laender, spanne: laender[0].v - laender.at(-1)!.v };
}

export default defineGuide({
  id: 'netzentgelte',
  group: 'tarif',
  order: 30,
  tool: 'preis',
  zone: 'DE-LU',
  related: ['zusammensetzung', 'paragraph14a', 'vergleich', 'stromkosten'],
  sources: ['bnetzaPreise', 'monitoring', 'stromstg', 'ustg', 'kav', 'smard'],
  de: {
    slug: 'netzentgelte-2026',
    nav: 'Netzentgelte 2026',
    card: 'Was Netzentgelte sind, wie viel vom kWh-Preis sie ausmachen und was 2026 sinkt.',
    title: 'Netzentgelte 2026: Anteil am Strompreis und was sinkt',
    description: 'Netzentgelte 2026: was sie sind, wer sie festlegt, welcher Anteil am Strompreis je kWh auf sie entfällt und wie stark sie laut Bundesnetzagentur sinken.',
    h1: 'Netzentgelte 2026: der Preis für die Leitung bis ins Haus',
    intro: 'Wählen Sie Ihr Bundesland oder tragen Sie das Netzentgelt Ihres Netzbetreibers ein: der Rechner zeigt den Endpreis jeder Viertelstunde von heute.',
    resume: (h) => {
      const { netz, n26, z, z26, netzBrutto, anteil, w } = D(h);
      return `Netzentgelte sind der Preis für den Transport des Stroms vom Kraftwerk über Übertragungs- und Verteilnetz bis zu Ihrem Hausanschluss. Sie gehen an den örtlichen Netzbetreiber, Ihr Lieferant zieht sie mit der Stromrechnung ein, und sie fallen bei jedem Tarif an, ob fest oder dynamisch. Laut Monitoringbericht von Bundesnetzagentur und Bundeskartellamt lag das Netzentgelt für Haushalte mit 2.500 bis 5.000 kWh Verbrauch am 1. April 2025 im Bundesmittel bei ${h.ct(netz, 2)} netto, einschließlich des umgelegten Grundpreises. Mit Umsatzsteuer sind das ${h.ct(netzBrutto, 2)}, beim Börsenmittel der letzten ${h.num(w.n)} Tage also ${h.pct(anteil, 0)} eines Endpreises von ${h.ct(z.brutto, 1)} ohne Anbieteraufschlag. Für 2026 bezuschusst der Bund die Übertragungsnetzentgelte mit ${h.num(n26.zuschuss_mrd_eur, 1)} Milliarden Euro. Die Bundesnetzagentur hat bei den ${h.num(n26.netzbetreiber)} größten Netzbetreibern ausgewertet, dass die Netzentgelte für Haushalte dadurch im Schnitt um knapp ${h.ct(n26.senkung_ct, 0)} sinken. Rechnet man diese Senkung auf das Bundesmittel von 2025, ergäbe sich ein Endpreis von etwa ${h.ct(z26.brutto, 1)}; das ist eine Größenordnung, kein amtlicher Wert für Ihr Netz. Wie stark Ihr Netzbetreiber gesenkt hat, steht in seinem Preisblatt und auf Ihrer nächsten Rechnung.`;
    },
    faqs: () => [
      { q: 'Wo finde ich das Netzentgelt meines Netzbetreibers?', a: 'Auf der Jahresabrechnung Ihres Lieferanten, die das Netzentgelt gesondert ausweist, und im Preisblatt des Netzbetreibers, das jeder Netzbetreiber auf seiner Internetseite veröffentlicht. Dort stehen ein Grundpreis in Euro pro Jahr und ein Arbeitspreis in Cent je Kilowattstunde für Haushalte ohne Leistungsmessung. Welcher Netzbetreiber für Ihre Adresse zuständig ist, steht ebenfalls auf der Rechnung.' },
      { q: 'Gibt der Lieferant gesunkene Netzentgelte automatisch weiter?', a: 'Nicht automatisch am Stichtag. Die Bundesnetzagentur weist darauf hin, dass Lieferanten Änderungen der Kostenbestandteile bei ihrer nächsten Preisanpassung berücksichtigen müssen. Bei einem Festpreisvertrag mit Preisgarantie kann das erst nach Ablauf der Garantie geschehen. Bei dynamischen Tarifen wird das Netzentgelt meist direkt in der Höhe weitergereicht, die der Netzbetreiber verlangt.' },
      { q: 'Kann ich das Netzentgelt senken?', a: 'Für den normalen Haushaltsstrom kaum, denn das Entgelt hängt vom Netzgebiet ab und nicht vom Lieferanten. Ein Lieferantenwechsel ändert es nicht. Anders bei Wärmepumpen, Wallboxen und Heimspeichern: Wer sie als steuerbare Verbrauchseinrichtung nach Paragraf 14a EnWG anmeldet, erhält eine Reduzierung, entweder als Pauschale oder als niedrigeren Arbeitspreis über einen eigenen Zähler.' },
    ],
    body: (h) => {
      const { z, w, laender, spanne, n26 } = D(h);
      const k = (key: string) => z.teile.find((x) => x.k === key)!.ct;
      const rows = [
        ['Börsenpreis (Mittel 30 Tage)', h.ct(z.boerse, 2), h.pct(z.boerse / z.netto, 0)],
        ['Netzentgelt (Bundesmittel 2025)', h.ct(k('netz'), 2), h.pct(k('netz') / z.netto, 0)],
        ['Stromsteuer', h.ct(k('stromsteuer'), 2), h.pct(k('stromsteuer') / z.netto, 0)],
        ['Umlagen', h.ct(umlagenDe(), 3), h.pct(umlagenDe() / z.netto, 0)],
        ['Konzessionsabgabe', h.ct(k('konzession'), 2), h.pct(k('konzession') / z.netto, 0)],
      ];
      const hoch = laender.slice(0, 3).map((x) => [LAND[x.k], h.ct(x.v, 2)]);
      const tief = laender.slice(-3).reverse().map((x) => [LAND[x.k], h.ct(x.v, 2)]);
      return `<h2>Wie viel vom Nettopreis das Netz ausmacht</h2>
${h.table(['Bestandteil', 'ct/kWh netto', 'Anteil'], rows, `Börsenmittel ${h.date(w.von)} bis ${h.date(w.bis)}, ohne Anbieteraufschlag und ohne Umsatzsteuer`, ['l', 'r', 'r'])}
<p>Nach dem Börsenpreis ist das Netzentgelt der größte einzelne Posten je Kilowattstunde. Den vollständigen Aufbau mit Quellen zeigt ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}. Ein Messentgelt für Zähler und Messstellenbetrieb kommt als fester Jahresbetrag hinzu und hängt nicht vom Verbrauch ab.</p>
<h2>Große Unterschiede zwischen den Netzen</h2>
${h.table(['Höchste Mittel 2025', 'Netzentgelt netto'], hoch, 'Monitoringbericht 2025, Haushaltskunden 2.500 bis 5.000 kWh', ['l', 'r'])}
${h.table(['Niedrigste Mittel 2025', 'Netzentgelt netto'], tief, 'Monitoringbericht 2025, Haushaltskunden 2.500 bis 5.000 kWh', ['l', 'r'])}
<p>Zwischen dem teuersten und dem günstigsten Landesmittel lagen ${h.ct(spanne, 2)}. Innerhalb eines Landes streuen die einzelnen Netzbetreiber noch stärker. Die Werte stammen aus dem ${h.src('monitoring')}; im Rechner oben lässt sich jedes Land wählen oder Ihr eigener Betrag eintragen.</p>
<h2>Was sich 2026 ändert</h2>
<p>Der Bund zahlt 2026 einen Zuschuss von ${h.num(n26.zuschuss_mrd_eur, 1)} Milliarden Euro zu den Übertragungsnetzentgelten, finanziert aus dem Klima- und Transformationsfonds. Laut ${h.src('bnetzaPreise', 'Bundesnetzagentur')} sinken die Netzentgelte für Haushalte bei den ${h.num(n26.netzbetreiber)} größten Netzbetreibern deshalb im Schnitt um knapp ${h.ct(n26.senkung_ct, 0)}. Weil die Netzentgelte regional verschieden sind, fällt die Entlastung je Netzgebiet unterschiedlich aus. Ein amtliches Bundesmittel für 2026 erscheint erst mit dem nächsten Monitoringbericht; bis dahin rechnet diese Seite mit dem Mittel von 2025.</p>
<h2>Weniger zahlen mit Wärmepumpe oder Wallbox</h2>
<p>Steuerbare Verbrauchseinrichtungen erhalten ein reduziertes Netzentgelt; welches der drei Module sich lohnt, rechnet ${h.a('paragraph14a', '§ 14a EnWG')}. Was ein Gerät oder der ganze Haushalt im Jahr kostet, zeigt ${h.a('stromkosten', 'Stromkosten berechnen')}, und ob ein ${h.a('vergleich', 'dynamischer Stromtarif')} trotz fester Netzentgelte spart, der Tarifvergleich.</p>`;
    },
  },
  en: {
    slug: 'grid-fees-germany-2026',
    nav: 'Grid fees Germany 2026',
    card: 'What German grid fees are, their share of the kWh price, and what falls in 2026.',
    title: 'Grid fees Germany 2026: share of the power price, cuts',
    description: 'Grid fees in Germany 2026: what they are, who sets them, their share of the price per kWh and how far they fall on average per the Federal Network Agency.',
    h1: 'German grid fees 2026: the price of the line to your home',
    intro: 'Pick your federal state or enter your grid operator’s fee: the calculator shows the all-in price for every quarter hour of today.',
    resume: (h) => {
      const { netz, n26, z, z26, netzBrutto, anteil, w } = D(h);
      return `German grid fees, the Netzentgelte, pay for carrying electricity from power plants through the transmission and distribution grids to your connection. They go to the local grid operator, your supplier collects them on your bill, and they apply on every tariff, fixed or dynamic. According to the monitoring report of the Federal Network Agency and the Federal Cartel Office, the average grid fee for households using 2,500 to 5,000 kWh was ${h.ct(netz, 2)} net on 1 April 2025, including the standing charge spread over consumption. With VAT that is ${h.ct(netzBrutto, 2)}, or ${h.pct(anteil, 0)} of an all-in price of ${h.ct(z.brutto, 1)} without supplier markup at the exchange average of the last ${h.num(w.n)} days. For 2026 the federal government subsidises transmission grid fees with ${h.num(n26.zuschuss_mrd_eur, 1)} billion euros. The Federal Network Agency analysed the ${h.num(n26.netzbetreiber)} largest grid operators and found household grid fees fall by just under ${h.ct(n26.senkung_ct, 0)} on average as a result. Applying that cut to the 2025 average would give an all-in price of about ${h.ct(z26.brutto, 1)}; that is an order of magnitude, not an official figure for your grid. Your grid operator’s price sheet and your next bill show how much yours actually fell.`;
    },
    faqs: () => [
      { q: 'Where do I find my German grid operator’s fee?', a: 'On your supplier’s annual statement, which shows the grid fee as a separate item, and in the grid operator’s price sheet, which every operator publishes on its website. It shows a standing charge in euros per year and an energy rate in cents per kilowatt-hour for households without power metering. Which operator serves your address is also on the bill.' },
      { q: 'Do suppliers pass lower grid fees on automatically?', a: 'Not on the day they change. The Federal Network Agency points out that suppliers must reflect changes in cost components at their next price adjustment. On a fixed price contract with a price guarantee, that may only happen once the guarantee ends. Dynamic tariffs usually pass the grid fee through at whatever the operator charges.' },
      { q: 'Can I lower my grid fee in Germany?', a: 'Hardly for ordinary household power, because the fee depends on the grid area, not the supplier, so switching supplier does not change it. Heat pumps, wallboxes and home batteries are different: registering them as controllable devices under section 14a of the Energy Industry Act earns a reduction, either as a flat amount or as a lower energy rate through a separate meter.' },
    ],
    body: (h) => {
      const { z, w, laender, spanne, n26 } = D(h);
      const k = (key: string) => z.teile.find((x) => x.k === key)!.ct;
      const rows = [
        ['Exchange price (30-day average)', h.ct(z.boerse, 2), h.pct(z.boerse / z.netto, 0)],
        ['Grid fee (2025 national average)', h.ct(k('netz'), 2), h.pct(k('netz') / z.netto, 0)],
        ['Electricity tax', h.ct(k('stromsteuer'), 2), h.pct(k('stromsteuer') / z.netto, 0)],
        ['Levies', h.ct(umlagenDe(), 3), h.pct(umlagenDe() / z.netto, 0)],
        ['Concession fee', h.ct(k('konzession'), 2), h.pct(k('konzession') / z.netto, 0)],
      ];
      const hoch = laender.slice(0, 3).map((x) => [LAND[x.k], h.ct(x.v, 2)]);
      const tief = laender.slice(-3).reverse().map((x) => [LAND[x.k], h.ct(x.v, 2)]);
      return `<h2>How much of the net price goes to the grid</h2>
${h.table(['Component', 'ct/kWh net', 'Share'], rows, `Exchange average ${h.date(w.von)} to ${h.date(w.bis)}, no supplier markup, before VAT`, ['l', 'r', 'r'])}
<p>After the exchange price, the grid fee is the largest single item per kilowatt-hour. The full structure with sources is on ${h.a('zusammensetzung', 'German electricity price breakdown')}. A metering charge for the meter itself comes on top as a fixed yearly amount that does not depend on use.</p>
<h2>Wide gaps between grids</h2>
${h.table(['Highest 2025 averages', 'Net grid fee'], hoch, 'Monitoring report 2025, households 2,500 to 5,000 kWh', ['l', 'r'])}
${h.table(['Lowest 2025 averages', 'Net grid fee'], tief, 'Monitoring report 2025, households 2,500 to 5,000 kWh', ['l', 'r'])}
<p>The dearest and cheapest state averages were ${h.ct(spanne, 2)} apart, and individual operators within a state vary even more. The figures come from the ${h.src('monitoring')}; the calculator above lets you pick any state or enter your own amount.</p>
<h2>What changes in 2026</h2>
<p>In 2026 the federal government pays a subsidy of ${h.num(n26.zuschuss_mrd_eur, 1)} billion euros towards transmission grid fees, funded from the Climate and Transformation Fund. According to the ${h.src('bnetzaPreise', 'Federal Network Agency')}, household grid fees at the ${h.num(n26.netzbetreiber)} largest operators fall by just under ${h.ct(n26.senkung_ct, 0)} on average as a result. Because grid fees differ by region, the relief varies by grid area. An official national average for 2026 will only come with the next monitoring report; until then this site uses the 2025 average.</p>
<h2>Paying less with a heat pump or wallbox</h2>
<p>Controllable devices get a reduced grid fee; which of the three modules pays off is worked out on ${h.a('paragraph14a', 'section 14a EnWG')}. What an appliance or a whole household costs per year is on ${h.a('stromkosten', 'electricity cost calculator')}, and whether a ${h.a('vergleich', 'dynamic electricity tariff')} saves money despite fixed grid fees is covered by the tariff comparison.</p>`;
    },
  },
});
