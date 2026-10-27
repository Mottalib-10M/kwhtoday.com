import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster, monate, tagAm } from '../../lib/fakten';
import { markt } from '../../lib/engine/markt';

/** Stroomprijs België : eigen biedzone ; Belgische heffingen niet nagelezen, dus beurs plus eigen invoer. */
function D(h: Helpers) {
  const be = tagAm('BE', h.today), nl = tagAm('NL', h.today);
  const wb = fenster('BE', 30), wn = fenster('NL', 30);
  const mb = monate('BE'), mn = monate('NL');
  const tb = markt('BE').tagesmittel.slice(-30), tn = new Map(markt('NL').tagesmittel.slice(-30));
  const duurder = tb.filter(([d, v]) => tn.has(d) && v > tn.get(d)!).length;
  return { be, nl, wb, wn, mb, mn, duurder, n: tb.length };
}

export default defineGuide({
  id: 'belgie',
  group: 'laender',
  order: 20,
  tool: 'preis',
  zone: 'BE',
  zonen: ['NL', 'DE-LU'],
  related: ['morgen', 'verlauf', 'negativ', 'fenster', 'jetzt', 'capaciteitstarief'],
  sources: ['smard', 'smardLizenz'],
  nl: {
    slug: 'stroomprijs-belgie',
    nav: 'Stroomprijs België',
    card: 'Day-aheadprijs van de Belgische zone per kwartier, met je eigen heffingen.',
    title: 'Stroomprijs België: beursprijs per kwartier vandaag',
    description: 'Stroomprijs België op de beurs voor vandaag en morgen per kwartier, naast de Nederlandse prijs, met netkosten en heffingen uit je eigen factuur erbij.',
    h1: 'Stroomprijs België: de day-aheadprijs van de Belgische zone',
    intro: 'België is een eigen biedzone. De rekenhulp toont de beursprijs; netkosten, heffingen en btw vul je zelf in vanaf je factuur.',
    resume: (h) => {
      const { be, wb, wn, duurder, n } = D(h);
      const f = be.f;
      return `De stroomprijs in België wordt op de beurs in een eigen biedzone gevormd, gekoppeld aan Nederland, Frankrijk en Duitsland in dezelfde Europese day-aheadveiling. Elke dag om 12 uur ligt de prijs vast voor elk kwartier van de volgende dag. Op ${h.date(f.d)} is de Belgische beursprijs gemiddeld ${h.spot(f.mittel)}; het goedkoopste uur begint om ${f.billigH} uur, het duurste om ${f.teuerH} uur. Over de laatste ${h.num(wb.n)} dagen was het gemiddelde ${h.spot(wb.mittel)}, tegen ${h.spot(wn.mittel)} in Nederland, en op ${h.num(duurder)} van de ${h.num(n)} dagen was België duurder. Wat Belgische gezinnen daarbovenop betalen, zoals netkosten, heffingen, de bijzondere accijns en btw, hebben we nog niet regel voor regel in de wet nagelezen. We rekenen het daarom niet zelf mee. Vul het bedrag per kWh van je factuur in bij „Net, heffingen en belastingen” en de rekenhulp toont je eindprijs voor elk kwartier. Beursprijs, grafiek en goedkoopste uur gelden hoe dan ook, en dynamische contracten in België rekenen doorgaans met deze day-aheadprijs.`;
    },
    faqs: () => [
      { q: 'Is stroom in België duurder dan in Nederland?', a: 'Op de beurs verschilt het per dag: de twee zones zijn gekoppeld, en de prijzen zijn gelijk zolang de grensverbindingen ruimte hebben. In de tabel hieronder zie je de maandgemiddelden van beide zones naast elkaar. Voor de eindprijs op je factuur tellen ook netkosten en belastingen mee, en die verschillen sterk tussen de twee landen en zelfs tussen de Belgische gewesten.' },
      { q: 'Wat vul ik in als net, heffingen en belastingen?', a: 'De som van de bedragen per kWh die je factuur naast de energieprijs vermeldt: distributie- en transmissiekosten per kWh, heffingen, accijns en de btw daarop, in cent per kWh bruto. Vaste bedragen per maand of per jaar, zoals het capaciteitstarief in Vlaanderen, horen er niet bij, want die hangen niet af van het uur. Zonder invoer toont de rekenhulp alleen de beursprijs.' },
      { q: 'Wanneer zijn de Belgische prijzen van morgen bekend?', a: 'Op hetzelfde moment als in Nederland en Duitsland: de gezamenlijke veiling sluit om 12 uur en de uitkomst voor alle zones volgt kort daarna. Wij laden de reeks om 14.30 en 15.30 uur en ’s avonds nog drie keer. Kies bovenaan „Morgen” om de volgende dag te zien zodra die gepubliceerd is.' },
    ],
    body: (h) => {
      const { mb, mn } = D(h);
      const rows = mb.alle.slice(-12).map(([m, v]) => [h.monat(m), h.spot(v, 2), (() => { const d = mn.alle.find(([k]) => k === m); return d ? h.spot(d[1], 2) : '–'; })()]);
      return `<h2>België en Nederland per maand</h2>
${h.table(['Maand', 'België', 'Nederland'], rows, 'Maandgemiddelde van de day-aheadprijs, bron SMARD', ['l', 'r', 'r'])}
<p>De waarden komen van ${h.src('smard')}, dat de uitkomst van de Europese marktkoppeling voor alle biedzones publiceert onder licentie CC BY 4.0.</p>
<h2>Waarom we de Belgische heffingen niet zelf rekenen</h2>
<p>Voor Nederland en Duitsland rekenen we de wettelijke belastingen zelf mee, omdat we ze in de wettekst nagelezen hebben. Voor België hebben we dat nog niet gedaan, en de bedragen verschillen bovendien per gewest en per netbeheerder. Liever laten we dat deel aan je eigen factuur over dan een bedrag te tonen dat we niet kunnen verantwoorden.</p>
<h2>Verder</h2>
<p>De goedkoopste uren voor een apparaat vind je met ${h.a('fenster', 'goedkoopste uur')}, ook voor de Belgische zone. Het verloop sinds 2019 staat op ${h.a('verlauf', 'day-aheadprijzen')}, de dagen met prijzen onder nul op ${h.a('negativ', 'negatieve stroomprijs')}.</p>`;
    },
  },
  en: {
    slug: 'belgium-electricity-price',
    nav: 'Belgium electricity price',
    card: 'Day-ahead price of the Belgian zone per quarter hour, with your own charges.',
    title: 'Electricity price Belgium: day-ahead per quarter hour',
    description: 'Electricity price in Belgium on the exchange today and tomorrow, per quarter hour, next to the Dutch price, with your own grid costs and taxes added on top.',
    h1: 'Belgium electricity price: the day-ahead price of the Belgian zone',
    intro: 'Belgium is a bidding zone of its own. The calculator shows its exchange price; you add grid costs, levies and VAT from your bill.',
    resume: (h) => {
      const { be, wb, wn, duurder, n } = D(h);
      const f = be.f;
      return `The Belgian electricity price is formed on the exchange in a bidding zone of its own, coupled with the Netherlands, France and Germany in the same European day-ahead auction. Every day at noon the price is fixed for each quarter hour of the next day. On ${h.date(f.d)} the Belgian exchange price averages ${h.spot(f.mittel)}; the cheapest hour starts at ${f.billigH} and the dearest at ${f.teuerH}. Over the last ${h.num(wb.n)} days the average was ${h.spot(wb.mittel)} against ${h.spot(wn.mittel)} in the Netherlands, and Belgium was the dearer zone on ${h.num(duurder)} of ${h.num(n)} days. What Belgian households pay on top, including distribution and transmission costs, levies, excise duty and VAT, we have not yet checked line by line in the law, so we do not add it ourselves. Enter the per-kWh amount from your bill in the “Grid, levies and taxes” field and the calculator shows your all-in price for each quarter hour. The exchange price, the curve and the cheapest hour hold either way, and Belgian dynamic contracts generally bill on this day-ahead price.`;
    },
    faqs: () => [
      { q: 'Is Belgian power dearer than Dutch power?', a: 'On the exchange it varies from day to day: the two zones are coupled and their prices match as long as the border lines have spare room. The table below sets the monthly averages of both zones side by side. On the bill, grid costs and taxes count too, and those differ widely between the two countries and even between Belgium’s regions.' },
      { q: 'What goes into the grid, levies and taxes field?', a: 'The sum of the per-kWh amounts your bill lists next to the energy price: distribution and transmission costs per kWh, levies, excise duty and the VAT on them, in gross cents per kWh. Fixed monthly or yearly amounts, such as the capacity tariff in Flanders, do not belong there, because they do not depend on the hour.' },
      { q: 'When are tomorrow’s Belgian prices known?', a: 'At the same time as the Dutch and German ones: the joint auction closes at noon and the results for all zones follow shortly afterwards. We load the series at 2:30 pm and 3:30 pm and three more times in the evening. Pick “Tomorrow” at the top of the calculator to see the next day once it is published.' },
    ],
    body: (h) => {
      const { mb, mn } = D(h);
      const rows = mb.alle.slice(-12).map(([m, v]) => [h.monat(m), h.spot(v, 2), (() => { const d = mn.alle.find(([k]) => k === m); return d ? h.spot(d[1], 2) : '–'; })()]);
      return `<h2>Belgium and the Netherlands month by month</h2>
${h.table(['Month', 'Belgium', 'Netherlands'], rows, 'Monthly average of the day-ahead price, source SMARD', ['l', 'r', 'r'])}
<p>The values come from ${h.src('smard')}, which publishes the results of European market coupling for every bidding zone under the CC BY 4.0 licence.</p>
<h2>Why we do not compute Belgian charges</h2>
<p>For the Netherlands and Germany we add statutory taxes ourselves because we have read them in the legal texts. We have not done that for Belgium yet, and the amounts also differ by region and by grid operator. We would rather leave that part to your own bill than show a figure we cannot back up.</p>
<h2>Next</h2>
<p>${h.a('fenster', 'Cheapest hour')} finds the best hours for an appliance, for the Belgian zone as well. The history since 2019 is on ${h.a('verlauf', 'day-ahead price history')}, days below zero on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
});
