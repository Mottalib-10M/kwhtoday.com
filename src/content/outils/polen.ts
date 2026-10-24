import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster, monate, tagAm } from '../../lib/fakten';
import { EUR_PLN } from '../../lib/engine/markt';

/** Poland : day-ahead price of the PL zone, converted to złoty at the ECB reference rate ; Polish charges not checked. */
function D(h: Helpers) {
  const pl = tagAm('PL', h.today), de = tagAm('DE-LU', h.today);
  const w = fenster('PL', 30), wd = fenster('DE-LU', 30);
  const m = monate('PL'), md = monate('DE-LU');
  const k = EUR_PLN.latest.value;
  const zl = (eurMwh: number) => `${h.num((eurMwh * k) / 1000, 2)} zł/kWh`;
  return { pl, de, w, wd, m, md, k, zl };
}

export default defineGuide({
  id: 'polen',
  group: 'laender',
  order: 30,
  tool: 'preis',
  zone: 'PL',
  zonen: ['DE-LU'],
  related: ['verlauf', 'morgen', 'fenster', 'epex-oesterreich'],
  sources: ['smard', 'smardLizenz', 'ezb'],
  en: {
    slug: 'poland-electricity-price',
    nav: 'Poland electricity price',
    card: 'Day-ahead price of the Polish zone per quarter hour, in złoty and euros.',
    title: 'Electricity price Poland: day-ahead in złoty per kWh',
    description: 'Electricity price in Poland on the day-ahead market today and tomorrow, per quarter hour, in złoty at the ECB reference rate, compared with the German zone.',
    h1: 'Poland electricity price: the day-ahead price in złoty',
    intro: 'The calculator shows the Polish zone’s exchange price per quarter hour in złoty. Add your own grid and tax charges from your bill for an all-in figure.',
    resume: (h) => {
      const { pl, w, wd, k, zl } = D(h);
      const f = pl.f;
      return `The Polish electricity price on the exchange is the day-ahead price of the Polish bidding zone, which takes part in the same coupled European auction as Germany, the Netherlands and Austria. It is set at noon for every quarter hour of the next day. SMARD publishes it in euros per megawatt-hour; we convert it to złoty per kilowatt-hour at the European Central Bank reference rate of ${h.date(EUR_PLN.latest.date)}, €1 = ${h.num(k, 4)} zł. On ${h.date(f.d)} the Polish price averages ${zl(f.mittel)} (${h.eur(f.mittel, 2)} per MWh); the cheapest hour starts at ${f.billigH} and the dearest at ${f.teuerH}. Over the last ${h.num(w.n)} days the average was ${zl(w.mittel)}, against ${zl(wd.mittel)} for the German zone at the same rate. Polish households mostly pay regulated or fixed tariffs, and what they pay on top of the exchange price, such as distribution charges, excise duty and VAT, we have not checked line by line, so we do not add it. Enter the gross amount per kWh from your bill, in grosze, and the calculator shows an all-in price for every quarter hour.`;
    },
    faqs: () => [
      { q: 'Which exchange rate is used for the złoty?', a: 'The euro foreign exchange reference rate published by the European Central Bank on each working day, taken from the latest date available when the site was built. Exchange prices are quoted in euros per megawatt-hour, so the conversion is the price times the rate, divided by a thousand. A different rate on your bill would shift the figures slightly.' },
      { q: 'Why is the Polish price often higher than the German one?', a: 'Poland still generates much of its power from coal, whose running costs include carbon allowances, and it has less wind and solar capacity relative to demand than Germany. When the lines between the two countries are full, cheap German power on sunny or windy days cannot flow east fast enough. The monthly table shows how large the gap has been.' },
      { q: 'Can Polish households use a dynamic tariff?', a: 'Dynamic contracts based on the day-ahead price exist in Poland, but most households are on fixed or regulated tariffs, and a dynamic contract also needs a meter that records use per quarter hour or hour. The conditions differ by supplier, so check them in the offer. This page shows the exchange price such a contract would follow.' },
    ],
    body: (h) => {
      const { m, md, k, zl } = D(h);
      const rows = m.alle.slice(-12).map(([mm, v]) => [h.monat(mm), h.eur(v, 2), zl(v), (() => { const d = md.alle.find(([x]) => x === mm); return d ? h.eur(d[1], 2) : '–'; })()]);
      return `<h2>Poland and Germany month by month</h2>
${h.table(['Month', 'Poland €/MWh', 'Poland zł/kWh', 'Germany €/MWh'], rows, `Monthly day-ahead averages from SMARD; złoty at the ECB rate of ${h.date(EUR_PLN.latest.date)} (${h.num(k, 4)})`, ['l', 'r', 'r', 'r'])}
<p>Exchange values come from ${h.src('smard')} under the CC BY 4.0 licence, the rate from the ${h.src('ezb')}. Converting every month at today’s rate keeps the comparison simple but is an approximation for older months, when the złoty stood at a different level.</p>
<h2>What the calculator does not add</h2>
<p>For Germany and the Netherlands we add statutory taxes ourselves because we have checked them in the legal texts. For Poland we have not, so the all-in figure is the exchange price plus the amount you enter. Fixed monthly charges stay out because they do not depend on the hour.</p>
<h2>Next</h2>
<p>The best hours for an appliance in the Polish zone are on ${h.a('fenster', 'cheapest hour')}, the history of all zones since 2019 on ${h.a('verlauf', 'EPEX spot prices')}, and tomorrow’s prices from early afternoon on ${h.a('morgen', 'electricity price tomorrow')}.</p>`;
    },
  },
});
