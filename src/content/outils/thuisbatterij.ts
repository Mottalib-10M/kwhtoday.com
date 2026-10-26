import { defineGuide, type Helpers } from '../../lib/guide-types';
import { speicher, minVergoeding } from '../../lib/engine/eigen';
import { preisFn } from '../../lib/engine/tarif';
import { letzteTage } from '../../lib/engine/markt';
import { festVorgabe, kaleNl } from '../../lib/tool-props';

/** Thuisbatterij (NL) : één cyclus per dag op de uurprijzen van de laatste 30 dagen, plus de waarde van opgeslagen zonnestroom na 2027. */
function D(_h: Helpers) {
  const tage = letzteTage('NL', 30);
  const fn = preisFn('NL', { aufschlag: 2 });
  const klein = speicher(tage, { kwh: 5, kw: 2.5, wirkung: 0.9, preis: fn, kosten: 4000 });
  const groot = speicher(tage, { kwh: 10, kw: 5, wirkung: 0.9, preis: fn, kosten: 4000 });
  const prijs = festVorgabe('NL');
  const verg = minVergoeding(kaleNl());
  const zonKwh = prijs * 0.9 - verg; // ct per opgeslagen kWh zonnestroom, rendement 90 % (aanname)
  return { klein, groot, prijs, verg, zonKwh, von: tage[0].d, bis: tage.at(-1)!.d };
}
const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

export default defineGuide({
  id: 'thuisbatterij',
  group: 'nutzen',
  order: 40,
  tool: 'speicher',
  zone: 'NL',
  related: ['saldering', 'terugleververgoeding', 'vergleich', 'fenster'],
  sources: ['smard', 'smardLizenz', 'cbs', 'wbm', 'acmSalderen'],
  nl: {
    slug: 'thuisbatterij-rendement',
    nav: 'Thuisbatterij',
    card: 'Wat een thuisbatterij met een dynamisch contract bespaart, gerekend op echte uurprijzen.',
    title: 'Thuisbatterij 2027: rendement met een dynamisch contract',
    description: 'Thuisbatterij na het einde van salderen in 2027: wat laden in goedkope en ontladen in dure uren de laatste 30 dagen opleverde, en wanneer je hem terugverdient.',
    h1: 'Thuisbatterij na 2027: wat ze met een dynamisch contract oplevert',
    intro: 'De rekenhulp laat een batterij op elke dag van de laatste 30 dagen één keer laden en ontladen, op de echte Nederlandse uurprijzen met energiebelasting en btw.',
    resume: (h) => {
      const { klein, groot, zonKwh, prijs, verg, von, bis } = D(h);
      return `Een thuisbatterij verdient op twee manieren: ze bewaart zonnestroom die je anders goedkoop teruglevert, en met een dynamisch contract laadt ze in goedkope uren om in dure uren je verbruik te dekken. Zolang de salderingsregeling loopt, tot het einde van 2026, levert het eerste vrijwel niets op, omdat teruggeleverde stroom tegen de volle prijs wordt weggestreept. Vanaf 2027 is elke opgeslagen kilowattuur zonnestroom het verschil waard tussen je stroomprijs en de terugleververgoeding: bij ${h.ct(prijs, 2)} en de wettelijke minimumvergoeding van ${h.ct(verg, 2)} en 90 % rendement (aanname) ongeveer ${h.ct(zonKwh, 1)}. Voor het tweede rekenen we op de uurprijzen van ${h.date(von)} tot ${h.date(bis)}. Een batterij van 5 kWh met 2,5 kW vermogen, die elke dag één keer laadt in het goedkoopste blok en later op de dag ontlaadt, had in die dagen ${h.eur(klein.summe, 2)} bespaard, doorgerekend ${h.eur(klein.jahr)} per jaar. Bij een prijs van 4.000 euro (aanname) duurt terugverdienen zo ${h.num(klein.amortisation, 0)} jaar. Een batterij van 10 kWh met 5 kW kwam op ${h.eur(groot.jahr)} per jaar. In de winter zijn de prijsverschillen vaak groter, in de zomer telt vooral de opgeslagen zonnestroom.`;
    },
    faqs: () => [
      { q: 'Is een thuisbatterij rendabel zolang er nog gesaldeerd wordt?', a: 'Nauwelijks. Tot en met 2026 streep je teruggeleverde stroom weg tegen je verbruik, dus het net werkt al als een gratis batterij. Een eigen batterij verdient dan alleen aan prijsverschillen met een dynamisch contract. Pas vanaf 2027 komt de waarde van opgeslagen zonnestroom erbij. Wie nu koopt, betaalt dus een jaar of langer voor een voordeel dat later begint.' },
      { q: 'Hoeveel laadcycli per dag zijn zinvol?', a: 'Meestal één. De meeste dagen hebben één duidelijk goedkoop moment, vaak ’s nachts of rond het middaguur, en één duur moment in de avond. Een tweede cyclus levert alleen iets op als er ook ’s ochtends een piek is, en elke extra cyclus kost slijtage en omzettingsverlies. De rekenhulp rekent daarom met één cyclus per dag en laat dagen zonder winst over.' },
      { q: 'Mag een thuisbatterij stroom terugleveren aan het net?', a: 'Technisch kan het, maar financieel is het na 2026 zelden zinvol. Je betaalt energiebelasting en btw over de stroom die je van het net laadt, en krijgt bij teruglevering alleen de terugleververgoeding zonder die belastingen. De rekenhulp gaat er daarom van uit dat de batterij alleen ontlaadt naar je eigen verbruik. Controleer of je huishouden in de dure uren genoeg verbruikt om de batterij leeg te trekken.' },
    ],
    body: (h) => {
      const { klein, von, bis } = D(h);
      const rows = klein.tage.slice(-12).reverse().map((t) => [h.date(t.d), t.gewinn > 0 ? `${hh(t.laden)} tot ${hh(t.laden + t.stunden)}` : 'geen cyclus', t.gewinn > 0 ? `${hh(t.entladen)} tot ${hh(t.entladen + t.stunden)}` : '–', t.gewinn > 0 ? `${h.ct(t.billig, 1)} / ${h.ct(t.teuer, 1)}` : '–', h.eur(t.gewinn, 2)]);
      return `<h2>De laatste twaalf dagen, dag voor dag</h2>
${h.table(['Dag', 'Laden', 'Ontladen', 'Prijs laden / ontladen', 'Besparing'], rows, `Batterij 5 kWh, 2,5 kW, rendement 90 % (aanname), eindprijs met inkoopvergoeding 2 ct (aanname), energiebelasting en btw. Uurprijzen ${h.date(von)} tot ${h.date(bis)}, bron SMARD.`, ['l', 'l', 'l', 'r', 'r'])}
<p>De besparing per dag is wat je in het dure blok niet van het net hoeft te kopen, min wat het laden in het goedkope blok kostte, inclusief het verlies van laden en ontladen. Op dagen waar de prijs nauwelijks beweegt, verdient de batterij niets en blijft ze in de rekenhulp stil. De uurprijzen zijn de Nederlandse day-aheadprijzen van ${h.src('smard')}; energiebelasting volgens de ${h.src('wbm')}.</p>
<h2>Wat de rekenhulp niet meeneemt</h2>
<p>Slijtage: elke cyclus kost een stukje levensduur, en fabrikanten geven garantie op een aantal jaren of cycli. Netbeheerkosten: die betaal je in Nederland per aansluiting, los van het uur. Zonnestroom: op zonnige dagen vul je de batterij liever gratis met je eigen panelen dan met netstroom, en de waarde daarvan staat in de samenvatting hierboven. Wie beide combineert, verdient meer dan elk van beide apart, maar nooit meer dan één volle batterij per cyclus.</p>
<h2>Verder rekenen</h2>
<p>Wat het einde van salderen zonder batterij kost, staat op ${h.a('saldering', 'salderingsregeling 2027')}; wat leveranciers voor teruggeleverde stroom betalen op ${h.a('terugleververgoeding', 'terugleververgoeding')}. Of een dynamisch contract ook zonder batterij loont, rekent ${h.a('vergleich', 'dynamisch energiecontract')}, en het goedkoopste moment voor één apparaat vind je met ${h.a('fenster', 'goedkoopste uur')}.</p>`;
    },
  },
  en: {
    slug: 'home-battery-netherlands',
    nav: 'Home battery (NL)',
    card: 'What a home battery saves on a Dutch dynamic contract, based on real hourly prices.',
    title: 'Home battery Netherlands 2027: payback on a dynamic tariff',
    description: 'Home battery in the Netherlands after net metering ends: what charging in cheap hours and discharging in dear ones saved over 30 days, and the payback in years.',
    h1: 'Home battery in the Netherlands after 2027: what it earns',
    intro: 'The calculator runs a battery through one charge and discharge on each of the last 30 days, on real Dutch hourly prices with energy tax and VAT.',
    resume: (h) => {
      const { klein, groot, zonKwh, prijs, verg, von, bis } = D(h);
      return `A home battery earns money in two ways: it stores solar power you would otherwise export cheaply, and on a dynamic contract it charges in cheap hours to cover your use in dear ones. As long as Dutch net metering runs, until the end of 2026, the first earns almost nothing, because exported power is offset at the full price. From 2027 each stored kilowatt-hour of solar power is worth the gap between your power price and the feed-in payment: at ${h.ct(prijs, 2)}, the legal minimum payment of ${h.ct(verg, 2)} and 90% efficiency (assumption), about ${h.ct(zonKwh, 1)}. For the second we use the hourly prices from ${h.date(von)} to ${h.date(bis)}. A 5 kWh battery with 2.5 kW of power, charging once a day in the cheapest block and discharging later that day, would have saved ${h.eur(klein.summe, 2)} over that period, or ${h.eur(klein.jahr)} a year extrapolated. At a price of 4,000 euros (assumption) the payback takes ${h.num(klein.amortisation, 0)} years. A 10 kWh battery with 5 kW reached ${h.eur(groot.jahr)} a year. Price gaps are often wider in winter, while in summer stored solar power matters most.`;
    },
    faqs: () => [
      { q: 'Does a home battery pay off while Dutch net metering still runs?', a: 'Hardly. Until the end of 2026 exported power is offset against your use, so the grid already works as a free battery. Your own battery then only earns from price gaps on a dynamic contract. The value of stored solar power only starts in 2027. Buying now means paying a year or more ahead for a benefit that begins later.' },
      { q: 'How many battery cycles a day make sense?', a: 'Usually one. Most days have one clearly cheap moment, often at night or around noon, and one dear moment in the evening. A second cycle only pays if there is also a morning peak, and every extra cycle costs wear and conversion losses. The calculator therefore uses one cycle a day and skips days without a gain.' },
      { q: 'Should a home battery export power to the grid?', a: 'It can, but after 2026 it rarely pays. You pay energy tax and VAT on power you charge from the grid, and exporting only earns the feed-in payment without those taxes. The calculator therefore assumes the battery only discharges into your own use. Check that your household uses enough in the dear hours to empty the battery.' },
    ],
    body: (h) => {
      const { klein, von, bis } = D(h);
      const rows = klein.tage.slice(-12).reverse().map((t) => [h.date(t.d), t.gewinn > 0 ? `${hh(t.laden)} to ${hh(t.laden + t.stunden)}` : 'no cycle', t.gewinn > 0 ? `${hh(t.entladen)} to ${hh(t.entladen + t.stunden)}` : '–', t.gewinn > 0 ? `${h.ct(t.billig, 1)} / ${h.ct(t.teuer, 1)}` : '–', h.eur(t.gewinn, 2)]);
      return `<h2>The last twelve days, one by one</h2>
${h.table(['Day', 'Charge', 'Discharge', 'Price charge / discharge', 'Saving'], rows, `Battery 5 kWh, 2.5 kW, 90% efficiency (assumption), all-in price with a 2 ct purchase fee (assumption), energy tax and VAT. Hourly prices ${h.date(von)} to ${h.date(bis)}, source SMARD.`, ['l', 'l', 'l', 'r', 'r'])}
<p>The daily saving is what you do not have to buy from the grid in the dear block, minus what charging in the cheap block cost, including the loss from charging and discharging. On days when the price barely moves, the battery earns nothing and the calculator leaves it idle. Hourly prices are the Dutch day-ahead prices from ${h.src('smard')}; energy tax as set in the ${h.src('wbm')}.</p>
<h2>What the calculator leaves out</h2>
<p>Wear: every cycle uses up some service life, and manufacturers guarantee a number of years or cycles. Grid charges: in the Netherlands they are paid per connection, independent of the hour. Solar power: on sunny days you would rather fill the battery for free from your own panels than from the grid, and that value is in the summary above. Combining both earns more than either alone, but never more than one full battery per cycle.</p>
<h2>Further calculations</h2>
<p>What the end of net metering costs without a battery is on ${h.a('saldering', 'net metering Netherlands 2027')}; what suppliers pay for exported power on ${h.a('terugleververgoeding', 'Dutch feed-in tariff')}. Whether a dynamic contract pays off without a battery is on ${h.a('vergleich', 'dynamic electricity tariff')}, and the cheapest time for a single appliance on ${h.a('fenster', 'cheapest hour')}.</p>`;
    },
  },
});
