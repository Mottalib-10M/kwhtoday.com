import { defineGuide, type Helpers } from '../../lib/guide-types';
import { monate, fenster } from '../../lib/fakten';

/** Börsenstrompreis im Verlauf : Jahresmittel seit 2019, die letzten 13 Monate, die letzten 30 Tage. */
const JAHRE = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
function D(_h: Helpers) {
  const de = monate('DE-LU'), nl = monate('NL'), at = monate('AT');
  const jahre = JAHRE.map((y) => ({ y, de: de.jahr(y), nl: nl.jahr(y), at: at.jahr(y) }));
  const hoch = jahre.filter((x) => x.de != null).reduce((a, b) => (b.de! > a.de! ? b : a));
  const letzte13 = de.alle.slice(-13).map(([m, v]) => ({ m, de: v, nl: nl.alle.find(([k]) => k === m)?.[1] ?? null }));
  return { de, nl, jahre, hoch, letzte13, wd: fenster('DE-LU', 30), wn: fenster('NL', 30) };
}

export default defineGuide({
  id: 'verlauf',
  group: 'preise',
  order: 30,
  tool: 'verlauf',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT', 'NL', 'BE', 'PL'], en: ['NL', 'AT', 'BE', 'PL'], nl: ['BE', 'DE-LU', 'AT', 'PL'] },
  related: ['preis', 'negativ', 'morgen', 'vergleich', 'epex-oesterreich'],
  sources: ['smard', 'smardLizenz', 'monitoring', 'cbs'],
  de: {
    slug: 'boersenstrompreis',
    nav: 'Börsenstrompreis',
    card: 'Tagesmittel, Monatsmittel und Jahresmittel des Day-Ahead-Preises seit 2019.',
    title: 'Börsenstrompreis aktuell und im Verlauf seit dem Jahr 2019',
    description: 'Börsenstrompreis Day-Ahead für Deutschland: Tagesmittel der letzten 30 Tage, Monatsmittel des letzten Jahres, Jahresmittel seit 2019 und Ihr Anteil daran.',
    h1: 'Börsenstrompreis: Tage, Monate und Jahre im Überblick',
    intro: 'Der Rechner zeigt die letzten 30 Tagesmittel oder 13 Monatsmittel und rechnet aus, was der Börsenanteil Ihres Monatsverbrauchs gekostet hat.',
    resume: (h) => {
      const { de, hoch, wd } = D(h);
      const j25 = de.jahr('2025'), j24 = de.jahr('2024');
      return `Der Börsenstrompreis, oft nach der Strombörse EPEX Spot benannt, ist der Preis der Day-Ahead-Auktion: der Großhandelspreis für den nächsten Tag, für Deutschland und Luxemburg in einer gemeinsamen Preiszone. Im ${h.monat(de.letzt[0])} lag sein Monatsmittel bei ${h.spot(de.letzt[1], 2)}${de.vorjahr ? `, ein Jahr davor bei ${h.spot(de.vorjahr[1], 2)}` : ''}. Über die letzten ${h.num(wd.n)} Tage waren es ${h.spot(wd.mittel, 2)}. Im Jahresmittel kostete die Megawattstunde 2025 ${h.eur(j25 ?? 0, 2)} und 2024 ${h.eur(j24 ?? 0, 2)}; das teuerste Jahr der Reihe war ${hoch.y} mit ${h.eur(hoch.de!, 2)}${hoch.y === '2022' ? ', als die Gaspreise nach dem russischen Angriff auf die Ukraine stiegen' : ''}. Für Haushalte ist der Börsenpreis nur ein Teil des Arbeitspreises: Netzentgelt, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer kommen hinzu und machen bei niedrigen Börsenpreisen den größeren Teil aus. Wer einen Festpreis hat, spürt Änderungen erst mit Verzögerung, wenn der Anbieter neu kalkuliert. Mit einem dynamischen Tarif zahlen Sie den Börsenpreis jeder Viertelstunde direkt.`;
    },
    faqs: () => [
      { q: 'Was bedeutet EPEX Spot beim Strompreis?', a: 'EPEX Spot ist die Strombörse in Paris, an der unter anderem die Day-Ahead-Auktion für Deutschland, Österreich, die Niederlande und Belgien stattfindet. Wenn Anbieter vom „EPEX-Preis“ sprechen, meinen sie meist das Ergebnis dieser Auktion. Die Zahlen auf dieser Seite kommen von SMARD, das die Auktionsergebnisse für alle Preiszonen veröffentlicht; es sind dieselben Day-Ahead-Werte.' },
      { q: 'Warum sind Monatsmittel und Rechnung so verschieden?', a: 'Weil das Monatsmittel ein Großhandelspreis ohne Netz, Steuern und Umlagen ist und jede Viertelstunde gleich gewichtet. Ihr Verbrauch verteilt sich nicht gleichmäßig: wer abends viel Strom braucht, zahlt mit einem dynamischen Tarif mehr als das Mittel. Mit Festpreis zahlen Sie den Preis, den der Anbieter im Voraus kalkuliert hat, unabhängig vom laufenden Monat.' },
      { q: 'Wie lange reicht die Reihe zurück?', a: 'Die Monatsmittel im Rechner und in der Tabelle reichen bis 2019 zurück, die Tagesmittel über gut ein Jahr und die Viertelstunden über sechs Wochen. SMARD führt die Reihe für Deutschland und Luxemburg seit der Trennung von Österreich im Oktober 2018 als eigene Preiszone; ältere Werte gelten für die frühere gemeinsame Zone und stehen hier nicht.' },
    ],
    body: (h) => {
      const { jahre, letzte13 } = D(h);
      const j = jahre.filter((x) => x.de != null).map((x) => [x.y, h.eur(x.de!, 2), h.spot(x.de!, 2), x.at != null ? h.eur(x.at, 2) : '–']);
      const m = letzte13.map((x) => [h.monat(x.m), h.spot(x.de, 2)]);
      return `<h2>Jahresmittel seit 2019</h2>
${h.table(['Jahr', 'Deutschland/Luxemburg €/MWh', 'ct/kWh', 'Österreich €/MWh'], j, 'Mittel der Monatsmittel des Day-Ahead-Preises, Quelle SMARD', ['l', 'r', 'r', 'r'])}
<h2>Die letzten 13 Monate</h2>
${h.table(['Monat', 'Börsenpreis'], m, 'Deutschland und Luxemburg; fehlende SMARD-Monatswerte aus den Tagesmitteln ergänzt', ['l', 'r'])}
<p>Alle Werte stammen von ${h.src('smard')}. Ein Monatsmittel aus Tagesmitteln weicht vom Mittel aller Viertelstunden nur an den Tagen der Zeitumstellung minimal ab. Was Haushalte mit Steuern und Netz tatsächlich zahlen, steht im ${h.src('monitoring')}.</p>
<h2>Vom Börsenanteil zur Rechnung</h2>
<p>Im Rechner tragen Sie Ihren Monatsverbrauch ein; er zeigt, was der reine Börsenanteil gekostet hätte. Den ganzen Endpreis mit allen Abgaben zeigt ${h.a('preis', 'Strompreis pro Stunde')}, den Vergleich mit Ihrem Festpreis ${h.a('vergleich', 'dynamischer Stromtarif')}. Wie oft der Preis unter null fiel, steht auf ${h.a('negativ', 'negative Strompreise')}.</p>`;
    },
  },
  en: {
    slug: 'epex-spot-prices',
    nav: 'EPEX spot prices',
    card: 'Daily, monthly and yearly averages of the day-ahead price since 2019.',
    title: 'EPEX spot prices: daily, monthly and yearly averages',
    description: 'EPEX spot prices for Germany and the Netherlands: daily averages of the last 30 days, monthly averages of the past year and yearly averages since 2019.',
    h1: 'EPEX spot prices: days, months and years at a glance',
    intro: 'The calculator shows the last 30 daily or 13 monthly averages and works out what the exchange share of your monthly use cost.',
    resume: (h) => {
      const { de, nl, hoch, wd, wn } = D(h);
      return `“EPEX spot price” is the everyday name for the result of the day-ahead auction held on the EPEX Spot power exchange: the wholesale price for each quarter hour of the next day, set separately for each bidding zone. In ${h.monat(de.letzt[0])} the monthly average was ${h.spot(de.letzt[1], 2)} in the German and Luxembourg zone and ${h.spot(nl.letzt[1], 2)} in the Dutch zone${de.vorjahr ? `; a year earlier the German figure was ${h.spot(de.vorjahr[1], 2)}` : ''}. Over the last ${h.num(wd.n)} days the averages were ${h.spot(wd.mittel, 2)} in Germany and ${h.spot(wn.mittel, 2)} in the Netherlands. The most expensive year in the series was ${hoch.y}, at ${h.eur(hoch.de!, 2)} per MWh in Germany${hoch.y === '2022' ? ', when gas prices soared after Russia’s attack on Ukraine' : ''}. For households the exchange price is only part of the unit rate: grid fees, taxes, levies and VAT come on top and make up the larger share whenever wholesale prices are low. On a fixed contract changes reach you late, when the supplier reprices; on a dynamic tariff you pay each quarter hour’s exchange price straight away. All figures here come from SMARD, the Federal Network Agency’s market data platform.`;
    },
    faqs: () => [
      { q: 'Is the EPEX spot price the same as the SMARD price?', a: 'Yes, for the day-ahead market. EPEX Spot runs the auction in which Germany, Austria, the Netherlands and Belgium take part, and SMARD, the Federal Network Agency’s platform, republishes the resulting prices for every bidding zone under an open licence. When a supplier says its dynamic tariff follows “EPEX day-ahead”, it means these same values.' },
      { q: 'Why does the monthly average differ from what I pay?', a: 'The monthly average is a wholesale price before grid fees, taxes and levies, and it weights every quarter hour equally. Your use is not spread evenly: if you use a lot in the evening, a dynamic tariff charges you more than the average. On a fixed contract you pay a rate the supplier set in advance, whatever the current month did.' },
      { q: 'How far back does the price history go?', a: 'Monthly averages here go back to 2019, daily averages cover a little over a year and quarter-hourly prices six weeks. Germany and Luxembourg have formed a bidding zone of their own since Austria was split off in October 2018, so earlier values belong to the former joint zone and are not shown.' },
    ],
    body: (h) => {
      const { jahre, letzte13 } = D(h);
      const j = jahre.filter((x) => x.de != null).map((x) => [x.y, h.eur(x.de!, 2), x.nl != null ? h.eur(x.nl, 2) : '–', x.at != null ? h.eur(x.at, 2) : '–']);
      const m = letzte13.map((x) => [h.monat(x.m), h.spot(x.de, 2), x.nl != null ? h.spot(x.nl, 2) : '–']);
      return `<h2>Yearly averages since 2019</h2>
${h.table(['Year', 'Germany €/MWh', 'Netherlands €/MWh', 'Austria €/MWh'], j, 'Mean of monthly day-ahead averages, source SMARD', ['l', 'r', 'r', 'r'])}
<h2>The last 13 months</h2>
${h.table(['Month', 'Germany', 'Netherlands'], m, 'Day-ahead exchange price; months missing from SMARD’s monthly series filled from daily averages', ['l', 'r', 'r'])}
<p>All values come from ${h.src('smard')}. A monthly average built from daily averages differs from the mean of all quarter hours only marginally, on clock-change days. What German households pay with taxes and grid fees is in the ${h.src('monitoring')}; Dutch consumer averages are published by ${h.src('cbs')}.</p>
<h2>From exchange share to bill</h2>
<p>Enter your monthly use in the calculator to see what the bare exchange share would have cost. The full all-in price is on ${h.a('preis', 'hourly electricity prices')}, the comparison with your fixed rate on ${h.a('vergleich', 'dynamic electricity tariff')}, and how often prices fell below zero on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
  nl: {
    slug: 'epex-prijzen',
    nav: 'EPEX-prijzen',
    card: 'Dag-, maand- en jaargemiddelden van de day-aheadprijs sinds 2019.',
    title: 'EPEX-prijzen: dag-, maand- en jaargemiddelden stroom',
    description: 'EPEX-prijzen voor stroom in Nederland: daggemiddelden van de laatste 30 dagen, maandgemiddelden van het afgelopen jaar en de jaargemiddelden sinds 2019.',
    h1: 'EPEX-prijzen: dagen, maanden en jaren op een rij',
    intro: 'De rekenhulp toont de laatste 30 daggemiddelden of 13 maandgemiddelden en rekent uit wat het beursdeel van je maandverbruik kostte.',
    resume: (h) => {
      const { nl, wn } = D(h);
      const j25 = nl.jahr('2025'), j24 = nl.jahr('2024');
      const hoogNl = JAHRE.map((y) => ({ y, v: nl.jahr(y) })).filter((x) => x.v != null).reduce((a, b) => (b.v! > a.v! ? b : a));
      return `De EPEX-prijs is de gangbare naam voor de uitkomst van de day-aheadveiling op de stroombeurs EPEX Spot: de groothandelsprijs voor elk kwartier van de volgende dag, per biedzone apart vastgesteld. Dynamische contracten in Nederland rekenen met deze prijs. In ${h.monat(nl.letzt[0])} was het maandgemiddelde in de Nederlandse zone ${h.spot(nl.letzt[1], 2)}${nl.vorjahr ? `, een jaar eerder ${h.spot(nl.vorjahr[1], 2)}` : ''}. Over de laatste ${h.num(wn.n)} dagen was het ${h.spot(wn.mittel, 2)}. Als jaargemiddelde kostte een megawattuur in 2025 ${h.eur(j25 ?? 0, 2)} en in 2024 ${h.eur(j24 ?? 0, 2)}; het duurste jaar van de reeks was ${hoogNl.y} met ${h.eur(hoogNl.v!, 2)}${hoogNl.y === '2022' ? ', toen de gasprijzen na de Russische inval in Oekraïne omhoogschoten' : ''}. Voor huishoudens is de beursprijs maar een deel van de prijs per kWh: energiebelasting, inkoopvergoeding en btw komen erbij, en bij lage beursprijzen zijn die samen het grootste deel. Met een vast of variabel contract merk je beursbewegingen pas later, als je leverancier zijn tarieven aanpast.`;
    },
    faqs: () => [
      { q: 'Zijn EPEX-prijzen hetzelfde als de prijzen van SMARD?', a: 'Ja, voor de day-aheadmarkt. EPEX Spot voert de veiling uit waarin Nederland, België, Duitsland en Oostenrijk meedoen, en SMARD, het platform van de Duitse Bundesnetzagentur, publiceert de uitkomst voor alle biedzones onder een open licentie. Zegt je leverancier dat je dynamische prijs de EPEX day-ahead volgt, dan bedoelt hij precies deze waarden.' },
      { q: 'Waarom wijkt het maandgemiddelde af van mijn rekening?', a: 'Het maandgemiddelde is een groothandelsprijs zonder energiebelasting, inkoopvergoeding en btw, en het telt elk kwartier even zwaar mee. Jouw verbruik is niet gelijk verdeeld: gebruik je veel stroom in de avond, dan betaal je met een dynamisch contract meer dan het gemiddelde. Met een vast contract betaal je de prijs die je leverancier vooraf heeft vastgesteld.' },
      { q: 'Hoe ver gaat de prijsreeks terug?', a: 'De maandgemiddelden in de tabel en de rekenhulp gaan terug tot 2019, de daggemiddelden ruim een jaar en de kwartierprijzen zes weken. Oudere jaren laten we weg, omdat de Duitse en Oostenrijkse zone tot oktober 2018 nog samen waren en de reeksen daardoor niet goed vergelijkbaar zijn met de huidige zones.' },
    ],
    body: (h) => {
      const { jahre, letzte13 } = D(h);
      const j = jahre.filter((x) => x.nl != null).map((x) => [x.y, h.eur(x.nl!, 2), h.spot(x.nl!, 2), x.de != null ? h.eur(x.de, 2) : '–']);
      const m = letzte13.map((x) => [h.monat(x.m), x.nl != null ? h.spot(x.nl, 2) : '–']);
      return `<h2>Jaargemiddelden sinds 2019</h2>
${h.table(['Jaar', 'Nederland €/MWh', 'ct/kWh', 'Duitsland €/MWh'], j, 'Gemiddelde van de maandgemiddelden van de day-aheadprijs, bron SMARD', ['l', 'r', 'r', 'r'])}
<h2>De laatste 13 maanden</h2>
${h.table(['Maand', 'Beursprijs Nederland'], m, 'Day-aheadprijs; maanden die bij SMARD nog ontbreken, aangevuld uit de daggemiddelden', ['l', 'r'])}
<p>Alle waarden komen van ${h.src('smard')}. Wat huishoudens gemiddeld per kWh betalen, inclusief belasting, publiceert ${h.src('cbs')} per maand.</p>
<h2>Van beursdeel naar rekening</h2>
<p>Vul in de rekenhulp je maandverbruik in en je ziet wat alleen het beursdeel gekost zou hebben. De hele eindprijs per kwartier staat op ${h.a('preis', 'stroomprijs per uur')}, de vergelijking met je huidige contract op ${h.a('vergleich', 'dynamisch energiecontract')}, en hoe vaak de prijs onder nul zakte op ${h.a('negativ', 'negatieve stroomprijs')}.</p>`;
    },
  },
});
