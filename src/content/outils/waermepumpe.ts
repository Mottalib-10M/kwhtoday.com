import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster, fensterTag, eDe, endDe } from '../../lib/fakten';

/** Wärmepumpe und Strompreis : vier Stunden Laufzeit mit 8 kWh (Beispiel), verschoben in das günstigste Fenster. */
function D(_h: Helpers) {
  const w = fenster('DE-LU', 30);
  const f4 = fensterTag('DE-LU', 240, 8, eDe(0));
  const f2 = fensterTag('DE-LU', 120, 4, eDe(0));
  const tagesmittel = endDe(w.mittel);
  return { w, f4, f2, tagesmittel };
}
const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

export default defineGuide({
  id: 'waermepumpe',
  group: 'nutzen',
  order: 30,
  tool: 'fenster',
  zone: 'DE-LU',
  zonen: ['AT'],
  toolProps: { dauerH: 4, kwh: 8, zeitraum: 'beide' },
  related: ['fenster', 'paragraph14a', 'vergleich', 'zusammensetzung', 'laden', 'wpkosten'],
  sources: ['smard', 'smardLizenz', 'monitoring', 'enwg41a', 'stromstg'],
  de: {
    slug: 'waermepumpe-strompreis',
    nav: 'Wärmepumpe und Strompreis',
    card: 'Wann die Wärmepumpe mit Speicher am günstigsten läuft und was das spart.',
    title: 'Wärmepumpe Strompreis: günstige Stunden für die Heizung',
    description: 'Wärmepumpe und Strompreis: Laufzeit und Verbrauch eintragen, das günstigste Fenster heute und morgen finden und sehen, was Verschieben mit Speicher spart.',
    h1: 'Wärmepumpe und Strompreis: wann die Heizung günstig läuft',
    intro: 'Eine Wärmepumpe mit Puffer- oder Warmwasserspeicher kann einige Stunden vorheizen. Der Rechner findet dafür das günstigste Fenster.',
    resume: (h) => {
      const { w, f4, tagesmittel } = D(h);
      return `Eine Wärmepumpe verbraucht im Winter viel Strom, und genau dann schwankt der Börsenpreis oft stark zwischen Nacht, Mittag und Abend. Mit einem dynamischen Tarif lohnt es sich, die Laufzeit in günstige Stunden zu legen, sofern das Haus oder ein Pufferspeicher die Wärme einige Stunden halten kann. Als Beispiel nehmen wir an, dass die Pumpe vier Stunden am Stück 8 kWh aufnimmt. Am ${h.date(f4.d)} liegt das günstigste Vier-Stunden-Fenster zwischen ${f4.billig.ab} und ${f4.billig.bis} Uhr; dort kostet der Block ${h.eur(f4.billig.kosten, 2)} bei einem mittleren Endpreis von ${h.ct(f4.billig.preis)}, im teuersten Fenster zwischen ${f4.teuer.ab} und ${f4.teuer.bis} Uhr dagegen ${h.eur(f4.teuer.kosten, 2)}. Gerechnet ist mit dem Bundesmittel des Netzentgelts, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer, ohne Aufschlag des Anbieters. Zum Vergleich lag der Endpreis beim mittleren Börsenpreis der letzten ${h.num(w.n)} Tage bei ${h.ct(tagesmittel)}. Ob die Wärmepumpe tatsächlich verschoben laufen kann, hängt von Speicher, Dämmung und Regelung ab: die Werte hier sind Annahmen, keine Messung Ihres Hauses.`;
    },
    faqs: () => [
      { q: 'Kann ich meine Wärmepumpe nach dem Strompreis steuern?', a: 'Wenn sie eine Schnittstelle für externe Signale hat, etwa einen Eingang für Sperrzeiten oder eine Smart-Grid-Funktion, kann ein Energiemanager oder ein Heimautomatisierungssystem sie in günstigen Stunden stärker heizen lassen. Ohne diese Funktion bleibt die Zeitsteuerung für Warmwasser und Speicher. Welche Möglichkeiten Ihr Gerät bietet, steht in der Anleitung des Herstellers.' },
      { q: 'Wie lange kann eine Wärmepumpe pausieren?', a: 'Das hängt vom Haus und vom Speicher ab. Eine Fußbodenheizung in einem gut gedämmten Haus hält Wärme oft einige Stunden, ein großer Pufferspeicher verlängert das. In einem schlecht gedämmten Haus mit Heizkörpern fällt die Temperatur schneller. Probieren Sie es schrittweise aus und achten Sie auf den Komfort, bevor Sie lange Pausen einplanen.' },
      { q: 'Lohnt sich für die Wärmepumpe ein eigener Zähler?', a: 'Ein separater Zähler war früher vor allem für vergünstigte Wärmepumpentarife nötig. Mit einem dynamischen Tarif auf dem Haushaltszähler kann das ganze Haus von günstigen Stunden profitieren. Ob ein zweiter Zähler mit eigenem Tarif günstiger ist, hängt von den Angeboten Ihres Netzbetreibers und Lieferanten sowie der zusätzlichen Grundgebühr ab.' },
    ],
    body: (h) => {
      const { w, f4, f2 } = D(h);
      const rows = [
        ['2 h, 4 kWh', `${f2.billig.ab} bis ${f2.billig.bis}`, h.eur(f2.billig.kosten, 2), h.eur(f2.teuer.kosten, 2), h.eur(f2.teuer.kosten - f2.billig.kosten, 2)],
        ['4 h, 8 kWh', `${f4.billig.ab} bis ${f4.billig.bis}`, h.eur(f4.billig.kosten, 2), h.eur(f4.teuer.kosten, 2), h.eur(f4.teuer.kosten - f4.billig.kosten, 2)],
      ];
      const blk = Array.from({ length: 8 }, (_, i) => [`${hh(i * 3)} bis ${hh(i * 3 + 3)}`, h.ct(endDe((w.stunde[i * 3] + w.stunde[i * 3 + 1] + w.stunde[i * 3 + 2]) / 3), 1)]);
      return `<h2>Zwei Heizblöcke am ${h.date(f4.d)}</h2>
${h.table(['Block (Annahme)', 'Günstigstes Fenster', 'Kosten günstig', 'Kosten teuer', 'Unterschied'], rows, 'Endpreis mit Bundesmittel des Netzentgelts, ohne Anbieteraufschlag', ['l', 'l', 'r', 'r', 'r'])}
<h2>Wann der Strom im Mittel günstig war</h2>
${h.table(['Uhrzeit', 'Endpreis ohne Aufschlag'], blk, `Mittel der letzten ${w.n} Tage, Deutschland, Quelle SMARD`, ['l', 'r'])}
<p>Die Börsenwerte stammen von ${h.src('smard')}, das Netzentgelt-Mittel aus dem ${h.src('monitoring')}. Im Winter verschiebt sich das Muster: die Mittagssenke durch Solarstrom ist schwächer, Wind bestimmt mehr, und die Abendspitze ist ausgeprägter.</p>
<h2>Was Sie brauchen</h2>
<p>Einen dynamischen Tarif, den jeder Lieferant Kunden mit intelligentem Messsystem anbieten muss (${h.src('enwg41a', '§ 41a EnWG')}), und eine Wärmepumpe, die Wärme vorhalten kann. Wie groß der Vorteil über einen ganzen Monat ist, rechnet ${h.a('vergleich', 'dynamischer Stromtarif')}; aus welchen festen Teilen der Preis besteht, ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}.</p>`;
    },
  },
  en: {
    slug: 'heat-pump-electricity-price',
    nav: 'Heat pump electricity price',
    card: 'When a heat pump with storage runs cheapest and what shifting saves.',
    title: 'Heat pump electricity price: cheap hours for heating',
    description: 'Heat pump electricity price: enter run time and energy use, find the cheapest window today and tomorrow, and see what shifting with a buffer tank saves.',
    h1: 'Heat pump electricity price: when heating runs cheapest',
    intro: 'A heat pump with a buffer or hot water tank can preheat for a few hours. The calculator finds the cheapest window for it.',
    resume: (h) => {
      const { w, f4, tagesmittel } = D(h);
      return `A heat pump uses a lot of electricity in winter, which is exactly when exchange prices often swing widely between night, midday and evening. On a dynamic tariff it pays to put its running time into cheap hours, as long as the house or a buffer tank can hold the heat for a while. As an example, we assume the pump draws 8 kWh over four hours in a row. On ${h.date(f4.d)} the cheapest four-hour window in Germany runs from ${f4.billig.ab} to ${f4.billig.bis}; there the block costs ${h.eur(f4.billig.kosten, 2)} at an average all-in price of ${h.ct(f4.billig.preis)}, while the dearest window, from ${f4.teuer.ab} to ${f4.teuer.bis}, costs ${h.eur(f4.teuer.kosten, 2)}. The figures use the German average grid fee, electricity tax, levies, concession fee and VAT, without any supplier markup. For comparison, the all-in price at the average exchange price of the last ${h.num(w.n)} days was ${h.ct(tagesmittel)}. Whether your heat pump can actually be shifted depends on storage, insulation and controls: the values here are assumptions, not a measurement of your home.`;
    },
    faqs: () => [
      { q: 'Can a heat pump be controlled by the power price?', a: 'If it has an interface for external signals, such as an input for blocking periods or a smart grid function, an energy manager or home automation system can make it heat harder during cheap hours. Without that, you still have the timer for hot water and the buffer tank. The manufacturer’s manual tells you which options your unit offers.' },
      { q: 'How long can a heat pump pause?', a: 'That depends on the house and the storage. Underfloor heating in a well-insulated house often holds heat for several hours, and a large buffer tank extends that. In a poorly insulated house with radiators the temperature drops faster. Try it step by step and keep an eye on comfort before planning long pauses.' },
      { q: 'Does a separate heat pump meter make sense?', a: 'A separate meter used to be needed mainly for discounted heat pump tariffs. With a dynamic tariff on the household meter, the whole home can benefit from cheap hours. Whether a second meter with its own tariff works out cheaper depends on what your grid operator and supplier offer and on the extra standing charge.' },
    ],
    body: (h) => {
      const { w, f4, f2 } = D(h);
      const rows = [
        ['2 h, 4 kWh', `${f2.billig.ab} to ${f2.billig.bis}`, h.eur(f2.billig.kosten, 2), h.eur(f2.teuer.kosten, 2), h.eur(f2.teuer.kosten - f2.billig.kosten, 2)],
        ['4 h, 8 kWh', `${f4.billig.ab} to ${f4.billig.bis}`, h.eur(f4.billig.kosten, 2), h.eur(f4.teuer.kosten, 2), h.eur(f4.teuer.kosten - f4.billig.kosten, 2)],
      ];
      const blk = Array.from({ length: 8 }, (_, i) => [`${hh(i * 3)} to ${hh(i * 3 + 3)}`, h.ct(endDe((w.stunde[i * 3] + w.stunde[i * 3 + 1] + w.stunde[i * 3 + 2]) / 3), 1)]);
      return `<h2>Two heating blocks on ${h.date(f4.d)}</h2>
${h.table(['Block (assumption)', 'Cheapest window', 'Cost, cheap', 'Cost, dear', 'Difference'], rows, 'German all-in price with the average grid fee, no supplier markup', ['l', 'l', 'r', 'r', 'r'])}
<h2>When power was cheap on average</h2>
${h.table(['Time of day', 'All-in, no markup'], blk, `Average of the last ${w.n} days, Germany, source SMARD`, ['l', 'r'])}
<p>Exchange values come from ${h.src('smard')}, the average grid fee from the ${h.src('monitoring')}. In winter the pattern shifts: the solar dip at midday is weaker, wind matters more and the evening peak is sharper.</p>
<h2>What you need</h2>
<p>A dynamic tariff, which every German supplier must offer customers with a smart metering system (${h.src('enwg41a')}), and a heat pump that can store heat. How large the advantage is over a whole month is on ${h.a('vergleich', 'dynamic electricity tariff')}; the fixed parts of the price are on ${h.a('zusammensetzung', 'German electricity price breakdown')}.</p>`;
    },
  },
});
