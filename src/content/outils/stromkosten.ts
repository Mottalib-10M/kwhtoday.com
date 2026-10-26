import { defineGuide, type Helpers } from '../../lib/guide-types';
import { geraetKwh, stromkosten } from '../../lib/engine/eigen';
import { preisDe30 } from '../../lib/tool-props';

/** Stromkosten berechnen (DE) : kWh × Preis, mit dem aktuellen Endpreis der Seite ; Gerätewerte sind Beispiele. */
const GERAETE: Array<{ de: string; en: string; w: number; h: number; tage: number }> = [
  { de: 'Wasserkocher', en: 'Kettle', w: 2000, h: 0.1, tage: 365 },
  { de: 'Waschmaschine, 60 °C', en: 'Washing machine, 60 °C', w: 1000, h: 1, tage: 200 },
  { de: 'Wäschetrockner', en: 'Tumble dryer', w: 2500, h: 1, tage: 150 },
  { de: 'Fernseher', en: 'Television', w: 100, h: 4, tage: 365 },
  { de: 'Kühlschrank (Durchschnitt)', en: 'Fridge (average)', w: 25, h: 24, tage: 365 },
  { de: 'Heizlüfter', en: 'Fan heater', w: 2000, h: 2, tage: 60 },
  { de: 'Laptop', en: 'Laptop', w: 50, h: 6, tage: 250 },
];
function D(h: Helpers) {
  const p = preisDe30();
  const geraete = GERAETE.map((g) => { const kwh = geraetKwh(g.w, g.h, g.tage); return { ...g, kwh, kosten: stromkosten({ kwhJahr: kwh, preisCt: p.preis, grundMonat: 0 }).jahr }; });
  const hp = h.P.de.haushaltspreise2025_ct;
  const haushalt = [1500, 2500, 3500, 5000].map((kwh) => ({ kwh, jetzt: stromkosten({ kwhJahr: kwh, preisCt: p.preis, grundMonat: 0 }).jahr, mb: stromkosten({ kwhJahr: kwh, preisCt: hp.durchschnitt, grundMonat: 0 }).jahr }));
  return { p, geraete, hp, haushalt, stunde2kw: (2 * p.preis) / 100 };
}

export default defineGuide({
  id: 'stromkosten',
  group: 'nutzen',
  order: 50,
  tool: 'stromkosten',
  zone: 'DE-LU',
  related: ['zusammensetzung', 'fenster', 'netzentgelte', 'vergleich'],
  sources: ['smard', 'smardLizenz', 'monitoring', 'stromstg', 'ustg'],
  de: {
    slug: 'stromkosten-berechnen',
    nav: 'Stromkosten berechnen',
    card: 'Was ein Gerät oder der ganze Haushalt im Jahr kostet, mit dem aktuellen kWh-Preis.',
    title: 'Stromkosten berechnen 2026: Gerät und Haushalt je kWh',
    description: 'Stromkosten berechnen 2026: Watt und Laufzeit oder Jahresverbrauch eintragen, mit dem aktuellen Strompreis je kWh. Kosten pro Jahr, Monat, Tag und Stunde.',
    h1: 'Stromkosten berechnen: was ein Gerät oder Ihr Haushalt kostet',
    intro: 'Wählen Sie ein Gerät mit Watt und Laufzeit oder Ihren Jahresverbrauch. Voreingestellt ist der Endpreis, der sich aus den Börsenpreisen der letzten 30 Tage ergibt.',
    resume: (h) => {
      const { p, hp, stunde2kw } = D(h);
      return `Stromkosten berechnen Sie mit einer einfachen Formel: Verbrauch in Kilowattstunden mal Preis je Kilowattstunde. Den Verbrauch eines Geräts erhalten Sie aus seiner Leistung in Watt, geteilt durch 1.000, mal den Betriebsstunden: ein Gerät mit 2.000 Watt, das eine Stunde läuft, verbraucht 2 kWh. Den Preis je Kilowattstunde finden Sie als Arbeitspreis auf Ihrer Rechnung. Wer keinen zur Hand hat, kann mit dem Wert dieser Seite rechnen: beim mittleren Börsenpreis vom ${h.date(p.von)} bis ${h.date(p.bis)} ergibt sich mit dem Bundesmittel des Netzentgelts, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer ein Endpreis von ${h.ct(p.preis, 2)}, ohne Aufschlag des Anbieters. Eine Stunde mit 2.000 Watt kostet damit ${h.eur(stunde2kw, 2)}. Zum Vergleich nennt der Monitoringbericht von Bundesnetzagentur und Bundeskartellamt einen durchschnittlichen Haushaltspreis von ${h.ct(hp.durchschnitt, 2)} am 1. April 2025, einschließlich Grundpreis. Ein Festpreisvertrag enthält zusätzlich den Aufschlag des Anbieters und dessen Preisrisiko. Für die Jahreskosten des Haushalts kommt der Grundpreis hinzu, den Sie im Rechner monatlich eintragen können.`;
    },
    faqs: () => [
      { q: 'Wie rechne ich Watt in Kilowattstunden um?', a: 'Teilen Sie die Leistung in Watt durch 1.000 und multiplizieren Sie mit der Laufzeit in Stunden. Ein Fernseher mit 100 Watt verbraucht in vier Stunden 0,4 kWh. Die Angabe auf dem Typenschild ist meist die Höchstleistung; viele Geräte wie Waschmaschinen oder Kühlschränke ziehen sie nur zeitweise. Genauer misst ein Zwischenstecker mit Verbrauchsanzeige, der über einige Tage die tatsächlichen Kilowattstunden zählt.' },
      { q: 'Welcher Strompreis gehört in die Rechnung?', a: 'Der Arbeitspreis brutto aus Ihrem Vertrag oder Ihrer Jahresabrechnung, also der Betrag je Kilowattstunde einschließlich Steuern. Der Grundpreis gehört nicht dazu, weil er unabhängig vom Verbrauch anfällt. Bei einem dynamischen Tarif hängt der Preis von der Uhrzeit ab; dann rechnen Sie besser mit dem Mittel, das der Rechner voreinstellt, oder mit dem Preis der Stunde, in der das Gerät läuft.' },
      { q: 'Was verbraucht im Haushalt am meisten Strom?', a: 'Meist alles, was Wärme erzeugt: Wäschetrockner, Elektroherd, Heizlüfter, Durchlauferhitzer und, wo vorhanden, Wärmepumpe und Elektroauto. Dauerläufer wie Kühlschrank und Gefriertruhe fallen über das Jahr ebenfalls ins Gewicht, obwohl ihre Leistung klein ist. Geräte im Bereitschaftsbetrieb summieren sich zu einigen Dutzend Kilowattstunden. Die Beispieltabelle unten zeigt die Größenordnungen mit dem aktuellen Preis.' },
    ],
    body: (h) => {
      const { p, geraete, haushalt, hp } = D(h);
      const rows = geraete.map((g) => [g.de, `${h.num(g.w)} W`, `${h.num(g.h, g.h < 1 ? 1 : 0)} h × ${h.num(g.tage)}`, `${h.num(g.kwh)} kWh`, h.eur(g.kosten)]);
      const hr = haushalt.map((x) => [`${h.num(x.kwh)} kWh`, h.eur(x.jetzt), h.eur(x.mb)]);
      return `<h2>Beispielgeräte mit dem aktuellen Preis</h2>
${h.table(['Gerät (Beispiel)', 'Leistung', 'Laufzeit × Tage', 'Verbrauch pro Jahr', 'Kosten pro Jahr'], rows, `Leistung und Nutzung sind Annahmen. Preis ${h.ct(p.preis, 2)}: Endpreis beim Börsenmittel ${h.date(p.von)} bis ${h.date(p.bis)}, ohne Grundpreis und Aufschlag`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die Werte sind Beispiele für typische Geräte, keine Messung Ihrer Geräte. Ein Kühlschrank mit 25 Watt im Mittel steht hier für einen Kompressor, der nur einen Teil der Zeit läuft. Wer es genau wissen will, misst mit einem Zwischenstecker und trägt die gemessenen Kilowattstunden in den Rechner ein.</p>
<h2>Haushalt nach Jahresverbrauch</h2>
${h.table(['Jahresverbrauch', `Mit ${h.ct(p.preis, 2)}`, `Mit ${h.ct(hp.durchschnitt, 2)} (Mittel April 2025)`], hr, 'Arbeitskosten ohne Grundpreis; Durchschnittspreis laut Monitoringbericht 2025 einschließlich Grundpreisanteil', ['r', 'r', 'r'])}
<p>Der Durchschnittspreis stammt aus dem ${h.src('monitoring')} und enthält den Grundpreis bereits anteilig. Der Endpreis dieser Seite folgt dagegen der Börse der letzten 30 Tage und enthält ${h.src('stromstg', 'Stromsteuer')}, Umlagen, Konzessionsabgabe und ${h.src('ustg', 'Umsatzsteuer')}, aber keinen Anbieteraufschlag. Woraus er besteht, zeigt ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}; den größten festen Posten erklärt ${h.a('netzentgelte', 'Netzentgelte 2026')}.</p>
<h2>Stromkosten senken</h2>
<p>Mit einem dynamischen Tarif kostet dieselbe Kilowattstunde zu verschiedenen Uhrzeiten verschieden viel. Wann ein Gerät am günstigsten läuft, findet ${h.a('fenster', 'günstigste Stunde')}; ob sich der Wechsel insgesamt lohnt, rechnet ${h.a('vergleich', 'dynamischer Stromtarif')} auf den letzten 30 Tagen.</p>`;
    },
  },
  en: {
    slug: 'electricity-cost-calculator-germany',
    nav: 'Electricity cost calculator',
    card: 'What an appliance or a whole household costs per year at today’s German kWh price.',
    title: 'Electricity cost Germany 2026: appliance and home per kWh',
    description: 'Electricity cost calculator for Germany 2026: enter watts and hours or annual use, priced at the current all-in rate per kWh. Cost per year, month, day, hour.',
    h1: 'Electricity cost in Germany: what an appliance or your home costs',
    intro: 'Choose an appliance with watts and running time, or your annual use. The preset is the all-in price that results from the last 30 days of exchange prices.',
    resume: (h) => {
      const { p, hp, stunde2kw } = D(h);
      return `Electricity cost follows a simple formula: consumption in kilowatt-hours times the price per kilowatt-hour. An appliance’s consumption is its power in watts divided by 1,000, times the hours it runs: a 2,000-watt appliance running for one hour uses 2 kWh. The price per kilowatt-hour is the energy rate on your bill. If you do not have it to hand, use this site’s figure: at the average exchange price from ${h.date(p.von)} to ${h.date(p.bis)}, adding the German average grid fee, electricity tax, levies, concession fee and VAT gives an all-in price of ${h.ct(p.preis, 2)}, without any supplier markup. One hour at 2,000 watts therefore costs ${h.eur(stunde2kw, 2)}. For comparison, the monitoring report of the Federal Network Agency and the Federal Cartel Office gives an average household price of ${h.ct(hp.durchschnitt, 2)} on 1 April 2025, standing charge included. A fixed-price contract also includes the supplier’s markup and its price risk. For a household’s yearly cost, add the standing charge, which you can enter per month in the calculator.`;
    },
    faqs: () => [
      { q: 'How do I convert watts into kilowatt-hours?', a: 'Divide the power in watts by 1,000 and multiply by the running time in hours. A 100-watt television uses 0.4 kWh in four hours. The rating plate usually shows maximum power; many appliances, such as washing machines or fridges, only draw it some of the time. A plug-in energy meter that counts actual kilowatt-hours over a few days is more accurate.' },
      { q: 'Which electricity price should I use?', a: 'The gross energy rate from your contract or annual statement, meaning the amount per kilowatt-hour including taxes. The standing charge does not belong here because it is due regardless of use. On a dynamic tariff the price depends on the time of day; use the average preset in the calculator, or the price of the hour in which the appliance runs.' },
      { q: 'Which appliances use the most electricity at home?', a: 'Usually anything that makes heat: tumble dryers, electric cookers, fan heaters, instantaneous water heaters and, where present, heat pumps and electric cars. Always-on appliances like fridges and freezers also add up over a year despite their low power. Devices on standby add a few dozen kilowatt-hours. The example table below shows the orders of magnitude at the current price.' },
    ],
    body: (h) => {
      const { p, geraete, haushalt, hp } = D(h);
      const rows = geraete.map((g) => [g.en, `${h.num(g.w)} W`, `${h.num(g.h, g.h < 1 ? 1 : 0)} h × ${h.num(g.tage)}`, `${h.num(g.kwh)} kWh`, h.eur(g.kosten)]);
      const hr = haushalt.map((x) => [`${h.num(x.kwh)} kWh`, h.eur(x.jetzt), h.eur(x.mb)]);
      return `<h2>Example appliances at the current price</h2>
${h.table(['Appliance (example)', 'Power', 'Hours × days', 'Use per year', 'Cost per year'], rows, `Power and use are assumptions. Price ${h.ct(p.preis, 2)}: all-in price at the exchange average ${h.date(p.von)} to ${h.date(p.bis)}, no standing charge or markup`, ['l', 'r', 'r', 'r', 'r'])}
<p>These are examples of typical appliances, not a measurement of yours. A fridge averaging 25 watts stands for a compressor that only runs part of the time. For exact figures, measure with a plug-in meter and enter the kilowatt-hours in the calculator.</p>
<h2>Household by annual use</h2>
${h.table(['Annual use', `At ${h.ct(p.preis, 2)}`, `At ${h.ct(hp.durchschnitt, 2)} (April 2025 average)`], hr, 'Energy cost without standing charge; average price per the 2025 monitoring report, standing charge share included', ['r', 'r', 'r'])}
<p>The average price comes from the ${h.src('monitoring')} and already includes a share of the standing charge. This site’s all-in price instead follows the exchange over the last 30 days and includes ${h.src('stromstg', 'electricity tax')}, levies, concession fee and ${h.src('ustg', 'VAT')}, but no supplier markup. Its make-up is on ${h.a('zusammensetzung', 'German electricity price breakdown')}; the largest fixed item is explained on ${h.a('netzentgelte', 'grid fees Germany 2026')}.</p>
<h2>Cutting electricity costs</h2>
<p>On a dynamic tariff the same kilowatt-hour costs different amounts at different times. ${h.a('fenster', 'Cheapest hour')} finds when an appliance runs cheapest; ${h.a('vergleich', 'dynamic electricity tariff')} works out whether switching pays over the last 30 days.</p>`;
    },
  },
});
