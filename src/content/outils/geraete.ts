import { defineGuide, type Helpers } from '../../lib/guide-types';
import { geraet, wasserKwh } from '../../lib/engine/haus';
import { preisDe30 } from '../../lib/tool-props';

/** Stromverbrauch von Geräten (DE) : Energielabel (kWh/annum, kWh/100 Zyklen), Warmwasser über die Wärmekapazität, sonst Watt × Stunden. */
function D(h: Helpers) {
  const p = preisDe30();
  const dw = h.P.annahmen.dle_wirkungsgrad;
  const zeile = (de: string, en: string, basis: string, baseEn: string, kwhJahr: number, nutzungen: number) => ({ de, en, basis, baseEn, ...geraet({ kwhJahr, preisCt: p.preis, nutzungen }) });
  const liste = [
    zeile('Kühl-Gefrier-Kombination', 'Fridge-freezer', 'Label 150 kWh/annum', 'label 150 kWh/annum', 150, 365),
    zeile('Kühlschrank ohne Gefrierfach', 'Fridge without freezer', 'Label 100 kWh/annum', 'label 100 kWh/annum', 100, 365),
    zeile('Waschmaschine', 'Washing machine', '55 kWh je 100 Zyklen, 200 Wäschen', '55 kWh per 100 cycles, 200 washes', 0.55 * 200, 200),
    zeile('Geschirrspüler', 'Dishwasher', '75 kWh je 100 Zyklen, 250 Spülgänge', '75 kWh per 100 cycles, 250 runs', 0.75 * 250, 250),
    zeile('Durchlauferhitzer, 80 l am Tag', 'Instantaneous water heater, 80 l a day', '80 l von 10 auf 38 °C', '80 l from 10 to 38 °C', wasserKwh(80, 28, dw) * 365, 365),
    zeile('Fernseher, 100 W', 'Television, 100 W', '4 h am Tag', '4 h a day', 0.1 * 4 * 365, 365),
    zeile('Router, 10 W', 'Router, 10 W', 'rund um die Uhr', 'around the clock', 0.01 * 24 * 365, 365),
  ];
  const dusche = wasserKwh(50, 28, dw);
  return { p, liste, dusche, dw, kuehl: liste[0], wasch: liste[2] };
}

export default defineGuide({
  id: 'geraete',
  group: 'nutzen',
  order: 55,
  tool: 'geraete',
  zone: 'DE-LU',
  related: ['haushalt', 'stromkosten', 'fenster', 'balkonkraftwerk'],
  sources: ['euLabel', 'euLabelInfo', 'stromspiegelFlyer', 'smard', 'smardLizenz'],
  de: {
    slug: 'stromverbrauch-geraete',
    nav: 'Stromverbrauch Geräte',
    card: 'Was Kühlschrank, Waschmaschine, Durchlauferhitzer und andere Geräte im Jahr verbrauchen.',
    title: 'Stromverbrauch Geräte 2026: Kühlschrank, Waschmaschine',
    description: 'Stromverbrauch von Geräten: Kühlschrank und Waschmaschine nach Energielabel, Durchlauferhitzer nach Litern, alle anderen nach Watt. Mit Tabelle und Kosten.',
    h1: 'Stromverbrauch von Geräten: was Kühlschrank, Waschmaschine & Co. brauchen',
    intro: 'Wählen Sie das Gerät und tragen Sie den Wert vom Energielabel, die Liter Warmwasser oder Watt und Stunden ein. Der Rechner zeigt kWh im Jahr, je Nutzung und die Kosten.',
    resume: (h) => {
      const { p, kuehl, wasch, dusche } = D(h);
      return `Den Stromverbrauch eines Geräts muss man selten schätzen: Bei Kühlschränken, Gefriergeräten, Waschmaschinen und Geschirrspülern steht er auf dem EU-Energielabel. Kühl- und Gefriergeräte geben den Jahresverbrauch in kWh/annum an, Waschmaschinen und Geschirrspüler seit März 2021 den Verbrauch je 100 Programmzyklen im Eco-Programm. Eine Kühl-Gefrier-Kombination mit 150 kWh auf dem Label (Beispiel) braucht ${h.num(kuehl.jeNutzung, 2)} kWh am Tag und kostet beim Endpreis von ${h.ct(p.preis, 2)} rund ${h.eur(kuehl.kosten)} im Jahr. Eine Waschmaschine mit 55 kWh je 100 Zyklen verbraucht ${h.num(wasch.jeNutzung, 2)} kWh je Waschgang; bei 200 Wäschen im Jahr sind das ${h.num(wasch.kwhJahr)} kWh. Ohne Label hilft Physik: Wasser um ein Grad zu erwärmen kostet 1,163 Wattstunden je Liter, eine Dusche mit 50 Litern von 10 auf 38 Grad also rund ${h.num(dusche, 1)} kWh am Durchlauferhitzer. Für alle anderen Geräte gilt Leistung mal Laufzeit. Der Preis folgt dem Börsenmittel vom ${h.date(p.von)} bis ${h.date(p.bis)} mit Netzentgelt, Steuern und Umlagen, ohne Grundpreis.`;
    },
    faqs: (h) => [
      { q: 'Was bedeutet kWh/100 Zyklen auf dem Energielabel?', a: 'Seit März 2021 nennt das Label von Waschmaschinen und Geschirrspülern den Stromverbrauch für 100 Durchläufe des Eco-Programms. Teilen Sie den Wert durch 100, erhalten Sie den Verbrauch eines Waschgangs; multiplizieren Sie ihn mit Ihren Wäschen pro Jahr, erhalten Sie den Jahresverbrauch. Heißere oder kürzere Programme brauchen mehr als das Eco-Programm, auf das sich der Wert bezieht.' },
      { q: 'Wie viel Strom braucht ein Durchlauferhitzer beim Duschen?', a: 'Das hängt nur von der Wassermenge und der Temperaturerhöhung ab, nicht von der Leistung des Geräts. Eine Dusche mit 50 Litern, erwärmt von 10 auf 38 Grad, braucht rund 1,7 kWh. Ein Sparduschkopf, der weniger Liter durchlässt, oder eine etwas niedrigere Temperatur senken den Verbrauch direkt. Die Leistung in Kilowatt bestimmt nur, wie schnell das Wasser warm wird.' },
      { q: 'Lohnt sich ein neuer Kühlschrank wegen des Stromverbrauchs?', a: `Rechnen Sie den Unterschied der Labelwerte mal Strompreis: Spart das neue Gerät 100 kWh im Jahr, sind das beim Preis dieser Seite ${h.eur(preisDe30().preis)}. Ein neuer Kühlschrank allein wegen des Verbrauchs amortisiert sich daher oft erst nach vielen Jahren. Anders bei sehr alten Geräten ohne Label oder mit defekter Dichtung: Messen Sie deren Verbrauch mit einem Zwischenstecker über eine Woche.` },
    ],
    body: (h) => {
      const { p, liste, dw } = D(h);
      const rows = liste.map((g) => [g.de, g.basis, `${h.num(g.kwhJahr)} kWh`, h.eur(g.kosten)]);
      return `<h2>Stromverbrauch Geräte: Tabelle mit Beispielen</h2>
${h.table(['Gerät (Beispiel)', 'Grundlage', 'kWh pro Jahr', 'Kosten pro Jahr'], rows, `Labelwerte, Nutzung und Leistung sind Annahmen für typische Geräte. Preis ${h.ct(p.preis, 2)}: Börsenmittel ${h.date(p.von)} bis ${h.date(p.bis)} plus Netzentgelt, Steuern und Umlagen`, ['l', 'l', 'r', 'r'])}
<p>Die Tabelle rechnet mit Beispielwerten; Ihr Gerät steht mit seinem echten Wert auf dem Label oder in der Produktdatenbank EPREL der EU. Wie das Label zu lesen ist, erklärt die ${h.src('euLabelInfo', 'Europäische Kommission')}; für Waschmaschinen nennt sie den Verbrauch je 100 Zyklen des Eco-Programms (${h.src('euLabel', 'EU-Seite zu Waschmaschinen')}). Beim Durchlauferhitzer rechnen wir mit 1,163 Wh je Liter und Kelvin und ${h.num(dw * 100)} % Wirkungsgrad (Annahme).</p>
<h2>Was im Haushalt zusammenkommt</h2>
<p>Die Summe aller Geräte ist Ihr Haushaltsverbrauch. Ob er hoch oder niedrig ist, zeigt der Vergleich mit Haushalten gleicher Größe auf ${h.a('haushalt', 'Stromverbrauch Haushalt')}, nach den Werten des ${h.src('stromspiegelFlyer', 'Stromspiegels 2025')}. Für ein Gerät mit bekannter Leistung in Watt rechnet auch ${h.a('stromkosten', 'Stromkosten berechnen')}.</p>
<h2>Verbrauch verschieben</h2>
<p>Waschmaschine und Geschirrspüler lassen sich zeitlich verschieben. Mit einem dynamischen Tarif lohnt es sich, sie in die billigsten Stunden zu legen, die ${h.a('fenster', 'günstigste Stunde')} für jede Laufzeit findet. Mit einem ${h.a('balkonkraftwerk', 'Balkonkraftwerk')} decken sie mittags einen Teil ihres Verbrauchs mit eigenem Solarstrom.</p>`;
    },
  },
  en: {
    slug: 'appliance-electricity-use',
    nav: 'Appliance electricity use',
    card: 'What a fridge, washing machine, water heater and other appliances use in a year.',
    title: 'Appliance electricity use 2026: fridge, washer, heater',
    description: 'Appliance electricity use: fridges and washing machines from the EU energy label, water heaters from litres, anything else from watts. With a table and costs.',
    h1: 'Appliance electricity use: what a fridge, washer and water heater need',
    intro: 'Choose the appliance and enter the energy label value, the litres of hot water, or watts and hours. The calculator shows kWh per year and per use, and the cost in Germany.',
    resume: (h) => {
      const { p, kuehl, wasch, dusche } = D(h);
      return `You rarely need to guess how much electricity an appliance uses: for fridges, freezers, washing machines and dishwashers it is printed on the EU energy label. Fridges and freezers state annual use in kWh/annum, while washing machines and dishwashers have shown use per 100 cycles of the eco programme since March 2021. A fridge-freezer labelled 150 kWh (example) uses ${h.num(kuehl.jeNutzung, 2)} kWh a day and costs about ${h.eur(kuehl.kosten)} a year at the German all-in price of ${h.ct(p.preis, 2)}. A washing machine labelled 55 kWh per 100 cycles uses ${h.num(wasch.jeNutzung, 2)} kWh per wash, or ${h.num(wasch.kwhJahr)} kWh a year at 200 washes. Without a label, physics helps: heating one litre of water by one degree takes 1.163 watt-hours, so a 50-litre shower heated from 10 to 38 degrees uses about ${h.num(dusche, 1)} kWh on an instantaneous heater. For anything else, power times running time gives the answer. The price follows the exchange average from ${h.date(p.von)} to ${h.date(p.bis)} with grid fee, taxes and levies, standing charge excluded.`;
    },
    faqs: (h) => [
      { q: 'What does kWh per 100 cycles on the energy label mean?', a: 'Since March 2021 the label on washing machines and dishwashers gives the electricity used for 100 runs of the eco programme. Divide by 100 for one cycle, then multiply by your cycles per year for annual use. Hotter or quicker programmes use more than the eco programme the figure refers to, so treat it as a lower bound.' },
      { q: 'How much electricity does a shower on an instantaneous heater use?', a: 'It depends only on the volume of water and the temperature rise, not on the heater’s power rating. A 50-litre shower heated from 10 to 38 degrees takes about 1.7 kWh. A low-flow shower head or a slightly cooler setting cuts that directly. The kilowatt rating only decides how quickly the water warms up.' },
      { q: 'Is it worth replacing a fridge to save electricity?', a: `Multiply the difference in label values by your power price: a new model that saves 100 kWh a year is worth ${h.eur(preisDe30().preis)} at this site’s German price. Replacing a working fridge for consumption alone therefore often takes many years to pay off. Very old units without a label or with a worn door seal are different; measure them with a plug-in meter for a week.` },
    ],
    body: (h) => {
      const { p, liste, dw } = D(h);
      const rows = liste.map((g) => [g.en, g.baseEn, `${h.num(g.kwhJahr)} kWh`, h.eur(g.kosten)]);
      return `<h2>Appliance electricity use: example table</h2>
${h.table(['Appliance (example)', 'Basis', 'kWh per year', 'Cost per year'], rows, `Label values, use and power are assumptions for typical appliances. Price ${h.ct(p.preis, 2)}: exchange average ${h.date(p.von)} to ${h.date(p.bis)} plus German grid fee, taxes and levies`, ['l', 'l', 'r', 'r'])}
<p>The table uses example values; your appliance has its real figure on the label or in the EU’s EPREL product database. The ${h.src('euLabelInfo', 'European Commission')} explains how to read the label, and for washing machines it states use per 100 cycles of the eco programme (${h.src('euLabel', 'EU page on washing machines')}). For water heaters we use 1.163 Wh per litre and kelvin and ${h.num(dw * 100)}% efficiency (assumption).</p>
<h2>Adding it up for the household</h2>
<p>All appliances together make up your household use. Whether that is high or low shows in the comparison with households of the same size on ${h.a('haushalt', 'average electricity consumption')}, based on the ${h.src('stromspiegelFlyer', 'Stromspiegel 2025')}. For an appliance with a known wattage, ${h.a('stromkosten', 'electricity cost calculator')} also works.</p>
<h2>Shifting use</h2>
<p>Washing machines and dishwashers can run later. On a dynamic tariff it pays to put them in the cheapest hours, which ${h.a('fenster', 'cheapest hour')} finds for any run time. With ${h.a('balkonkraftwerk', 'balcony solar')}, part of their midday use comes from your own panels.</p>`;
    },
  },
});
