import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster, monate, tagAm } from '../../lib/fakten';
import { markt } from '../../lib/engine/markt';

/** Strompreis Österreich : eigene Preiszone seit Oktober 2018 ; Abgaben nicht verifiziert, also Börse plus Eingabe. */
function D(h: Helpers) {
  const at = tagAm('AT', h.today), de = tagAm('DE-LU', h.today);
  const wa = fenster('AT', 30), wd = fenster('DE-LU', 30);
  const ma = monate('AT'), md = monate('DE-LU');
  // Tage der letzten 30, an denen Österreich teurer war als Deutschland
  const ta = markt('AT').tagesmittel.slice(-30), td = new Map(markt('DE-LU').tagesmittel.slice(-30));
  const teurer = ta.filter(([d, v]) => td.has(d) && v > td.get(d)!).length;
  return { at, de, wa, wd, ma, md, teurer, n: ta.length };
}

export default defineGuide({
  id: 'epex-oesterreich',
  group: 'laender',
  order: 10,
  tool: 'preis',
  zone: 'AT',
  zonen: ['DE-LU'],
  related: ['verlauf', 'morgen', 'negativ', 'fenster'],
  sources: ['smard', 'smardLizenz'],
  de: {
    slug: 'strompreis-oesterreich',
    nav: 'Strompreis Österreich',
    card: 'Day-Ahead-Preis der österreichischen Zone je Viertelstunde, mit Ihren Abgaben.',
    title: 'Strompreis Österreich: Börsenpreis je Viertelstunde heute',
    description: 'Strompreis Österreich an der Börse für heute und morgen je Viertelstunde, im Vergleich zu Deutschland, mit Netz und Abgaben aus Ihrer Rechnung als Endpreis.',
    h1: 'Strompreis Österreich: der Day-Ahead-Preis der eigenen Zone',
    intro: 'Österreich ist seit 2018 eine eigene Preiszone. Der Rechner zeigt ihren Börsenpreis; Netz, Abgaben und Steuern tragen Sie aus Ihrer Rechnung ein.',
    resume: (h) => {
      const { at, wa, wd, teurer, n } = D(h);
      const f = at.f;
      return `Der Strompreis in Österreich wird an der Börse in einer eigenen Preiszone gebildet, seit die gemeinsame Zone mit Deutschland am 1. Oktober 2018 getrennt wurde. Wie in Deutschland legt die Day-Ahead-Auktion um 12 Uhr für jede Viertelstunde des Folgetags einen Preis fest. Am ${h.date(f.d)} liegt der österreichische Börsenpreis im Mittel bei ${h.spot(f.mittel)}, die günstigste Stunde beginnt um ${f.billigH} Uhr, die teuerste um ${f.teuerH} Uhr. Über die letzten ${h.num(wa.n)} Tage lag das Mittel bei ${h.spot(wa.mittel)} gegenüber ${h.spot(wd.mittel)} in Deutschland; an ${h.num(teurer)} von ${h.num(n)} Tagen war Österreich teurer. Was österreichische Haushalte zusätzlich zahlen, also Netzentgelte, Abgaben und Umsatzsteuer, haben wir nicht Zeile für Zeile im Gesetz nachgelesen und rechnen es deshalb nicht selbst ein. Tragen Sie den Betrag je Kilowattstunde aus Ihrer Rechnung ins Feld „Netz, Abgaben und Steuern“ ein, dann zeigt der Rechner Ihren Endpreis für jede Viertelstunde. Börsenwerte, Kurve und günstigste Stunde gelten unabhängig davon.`;
    },
    faqs: () => [
      { q: 'Seit wann hat Österreich eine eigene Strompreiszone?', a: 'Seit dem 1. Oktober 2018. Davor bildeten Deutschland, Österreich und Luxemburg eine gemeinsame Zone mit einem einzigen Börsenpreis. Seit der Trennung wird die Übertragungskapazität an der Grenze bewirtschaftet, und die Preise beider Länder können auseinanderlaufen, wenn die Leitungen ausgelastet sind. An vielen Tagen liegen sie trotzdem nahe beieinander.' },
      { q: 'Warum ist Strom in Österreich manchmal teurer als in Deutschland?', a: 'Weil Österreich weniger Wind- und Solarleistung hat als Deutschland und an windreichen Tagen nicht genug günstigen deutschen Strom importieren kann, wenn die Grenzleitungen voll sind. Umgekehrt helfen Wasserkraft und Speicherkraftwerke in den Alpen, Abendspitzen abzufedern. Die Tabelle unten zeigt, wie sich die Monatsmittel beider Zonen im letzten Jahr unterschieden.' },
      { q: 'Was trage ich als Netz, Abgaben und Steuern ein?', a: 'Die Summe der Beträge je Kilowattstunde, die Ihre Rechnung neben dem Energiepreis ausweist, also Netznutzung, Netzverlust, Abgaben und die Umsatzsteuer darauf, in Cent je kWh brutto. Feste Beträge pro Monat oder Jahr gehören nicht dazu, weil sie nicht von der Uhrzeit abhängen. Ohne Eintrag zeigt der Rechner nur den Börsenpreis.' },
    ],
    body: (h) => {
      const { ma, md } = D(h);
      const rows = ma.alle.slice(-12).map(([m, v]) => [h.monat(m), h.spot(v, 2), (() => { const d = md.alle.find(([k]) => k === m); return d ? h.spot(d[1], 2) : '–'; })()]);
      return `<h2>Österreich und Deutschland Monat für Monat</h2>
${h.table(['Monat', 'Österreich', 'Deutschland/Luxemburg'], rows, 'Monatsmittel des Day-Ahead-Preises, Quelle SMARD', ['l', 'r', 'r'])}
<p>Die Werte veröffentlicht ${h.src('smard')} für alle Preiszonen der europäischen Marktkopplung, unter der Lizenz CC BY 4.0. Dynamische Tarife österreichischer Anbieter beziehen sich in der Regel auf diesen Day-Ahead-Preis; welcher Index für Ihren Vertrag gilt, steht in den Vertragsbedingungen.</p>
<h2>Was der Rechner hier nicht kann</h2>
<p>Für Deutschland und die Niederlande rechnen wir die gesetzlichen Abgaben selbst ein, weil wir sie im Gesetzestext nachgelesen haben. Für Österreich haben wir das noch nicht getan, deshalb bleibt es bei Börsenpreis plus Ihrer Eingabe. Für Haushalte in Deutschland zeigt ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}, wie viel die festen Bestandteile ausmachen.</p>
<h2>Weiter</h2>
<p>Die günstigsten Stunden für ein Gerät findet ${h.a('fenster', 'günstigste Stunde')}, auch für die österreichische Zone. Den Verlauf seit 2019 zeigt ${h.a('verlauf', 'Börsenstrompreis')}, die Tage mit Preisen unter null ${h.a('negativ', 'negative Strompreise')}.</p>`;
    },
  },
  en: {
    slug: 'austria-electricity-price',
    nav: 'Austria electricity price',
    card: 'Day-ahead price of the Austrian zone per quarter hour, with your own charges.',
    title: 'Electricity price Austria: day-ahead per quarter hour',
    description: 'Electricity price in Austria on the exchange today and tomorrow, per quarter hour, compared with Germany, with your own grid fees and taxes added on top.',
    h1: 'Austria electricity price: the day-ahead price of its own zone',
    intro: 'Austria has been a bidding zone of its own since 2018. The calculator shows its exchange price; you add grid fees, levies and taxes from your bill.',
    resume: (h) => {
      const { at, wa, wd, teurer, n } = D(h);
      const f = at.f;
      return `The Austrian electricity price is set on the exchange in a bidding zone of its own, ever since the joint zone with Germany was split on 1 October 2018. As in Germany, the day-ahead auction fixes a price for every quarter hour of the next day at noon. On ${h.date(f.d)} the Austrian exchange price averages ${h.spot(f.mittel)}; the cheapest hour starts at ${f.billigH} and the dearest at ${f.teuerH}. Over the last ${h.num(wa.n)} days the Austrian average was ${h.spot(wa.mittel)} against ${h.spot(wd.mittel)} in Germany, and Austria was the dearer of the two on ${h.num(teurer)} of ${h.num(n)} days. What Austrian households pay on top, meaning grid charges, levies and VAT, we have not checked line by line in the law, so we do not add it ourselves. Enter the per-kWh amount from your bill in the “Grid, levies and taxes” field and the calculator shows your all-in price for each quarter hour. The exchange values, the curve and the cheapest hour stand on their own regardless.`;
    },
    faqs: () => [
      { q: 'Since when has Austria had its own bidding zone?', a: 'Since 1 October 2018. Before that, Germany, Austria and Luxembourg formed a single zone with one exchange price. Since the split, transmission capacity at the border is allocated, and the two countries’ prices can drift apart when the lines are full. On many days they still sit close together, as the monthly table below shows.' },
      { q: 'Why is Austrian power sometimes dearer than German power?', a: 'Because Austria has less wind and solar capacity than Germany and, when the border lines are full, cannot import enough cheap German power on windy days. In the other direction, Alpine hydro and pumped storage help Austria smooth evening peaks. The table compares the monthly averages of both zones over the past year.' },
      { q: 'What should I enter as grid, levies and taxes?', a: 'The sum of the per-kWh amounts your bill shows next to the energy price, such as grid use, grid losses, levies and the VAT on them, in gross cents per kWh. Fixed monthly or yearly amounts do not belong there, because they do not depend on the time of day. With nothing entered, the calculator shows the exchange price alone.' },
    ],
    body: (h) => {
      const { ma, md } = D(h);
      const rows = ma.alle.slice(-12).map(([m, v]) => [h.monat(m), h.spot(v, 2), (() => { const d = md.alle.find(([k]) => k === m); return d ? h.spot(d[1], 2) : '–'; })()]);
      return `<h2>Austria and Germany month by month</h2>
${h.table(['Month', 'Austria', 'Germany/Luxembourg'], rows, 'Monthly average of the day-ahead price, source SMARD', ['l', 'r', 'r'])}
<p>${h.src('smard')} publishes these values for every bidding zone of European market coupling under the CC BY 4.0 licence. Dynamic tariffs from Austrian suppliers generally refer to this day-ahead price; which index applies to your contract is stated in its terms.</p>
<h2>What the calculator cannot do here</h2>
<p>For Germany and the Netherlands we add the statutory charges ourselves because we have read them in the legal texts. We have not done so for Austria yet, so it stays at exchange price plus your input. For German households, ${h.a('zusammensetzung', 'German electricity price breakdown')} shows how large the fixed parts are.</p>
<h2>Next</h2>
<p>${h.a('fenster', 'Cheapest hour')} finds the best hours for an appliance, for the Austrian zone too. The history since 2019 is on ${h.a('verlauf', 'day-ahead price history')}, days with prices below zero on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
});
