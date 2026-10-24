import type { Home } from '../accueil';
import { letzter, fenster, monate, endDe, endNl } from '../../lib/fakten';
import type { Zone } from '../../lib/engine/tarif';

const ZN: Record<Zone, string> = { 'DE-LU': 'Germany/Luxembourg', NL: 'Netherlands', AT: 'Austria', BE: 'Belgium', PL: 'Poland' };
import { umlagenDe } from '../../lib/engine/tarif';

export const en: Home = {
  zonen: ['DE-LU', 'NL', 'AT', 'BE', 'PL'],
  title: 'Electricity price today: quarter-hourly rates with all taxes',
  description: 'Electricity price today and tomorrow for Germany, the Netherlands, Austria, Belgium and Poland: day-ahead prices per quarter hour, turned into what you pay.',
  h1: 'Electricity price today: what a kilowatt-hour costs this hour and tomorrow',
  intro: 'The day-ahead price of every quarter hour as published by Germany’s Federal Network Agency, and next to it what reaches your bill once taxes and fees are added.',
  resume: (h) => {
    const d = letzter('DE-LU'), n = letzter('NL');
    const w = fenster('DE-LU', 30);
    return `Today’s electricity price on the European power exchange is not one number but ninety-six: since October 2025 the day-ahead auction sets a separate price for every quarter hour of the following day, and it does so around noon the day before. For ${h.date(d.d)} the German and Luxembourg zone averages ${h.spot(d.mittel)}, ranging from ${h.spot(d.min)} at ${d.minUhr} to ${h.spot(d.max)} at ${d.maxUhr}; the Dutch zone averages ${h.spot(n.mittel)}. Those are wholesale figures. A German household also pays a supplier markup, a grid fee (a national average of ${h.ct(h.P.de.netzentgelt2025_ct.DE, 2)} net in 2025), electricity tax of ${h.ct(h.P.de.stromsteuer_ct, 2)}, levies of ${h.ct(umlagenDe(), 2)}, a municipal concession fee and ${h.num(h.P.de.ust * 100)}% VAT, which turns the day’s average into roughly ${h.ct(endDe(d.mittel))} before any markup. A Dutch household adds energy tax of ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 2)} and ${h.num(h.P.nl.btw * 100)}% VAT, about ${h.ct(endNl(n.mittel))}. Over the last ${h.num(w.n)} days the gap between a day’s cheapest and dearest quarter hour in Germany averaged ${h.spot(w.spreizung)}, and that gap is what a dynamic tariff lets you use.`;
  },
  faqs: (h) => {
    const w = fenster('NL', 30);
    const m = monate('DE-LU');
    return [
      { q: 'What time are tomorrow’s electricity prices published?', a: 'The day-ahead auction for the next day closes at noon Central European time, and the results for every quarter hour follow shortly afterwards. SMARD shows them in the early afternoon, and we reload the series several times in the afternoon and evening. From about 2 pm the “Tomorrow” switch in the calculator therefore shows the next day; before that it falls back to today.' },
      { q: 'Which hour is usually cheapest in the Netherlands?', a: `Over the last ${h.num(w.n)} days the cheapest hour in the Dutch zone was, on average, the one starting at ${String(w.billigsteStunde).padStart(2, '0')}:00 and the dearest the one starting at ${String(w.teuersteStunde).padStart(2, '0')}:00, local time. Sunny days push midday prices down, sometimes below zero, while the evening peak in demand pushes prices up. In winter, wind decides more than sunshine.` },
      { q: 'How much was the German wholesale price last month?', a: `In ${h.monat(m.letzt[0])} the monthly average of the day-ahead price for Germany and Luxembourg was ${h.spot(m.letzt[1], 2)}${m.vorjahr ? `, against ${h.spot(m.vorjahr[1], 2)} in the same month a year earlier` : ''}. That is the bare wholesale price, before grid fees, levies and taxes. On a fixed-price contract it only reaches your bill when your supplier changes its rates.` },
      { q: 'What is the difference between the exchange price and a unit rate?', a: 'The exchange price is the wholesale price of one quarter hour, agreed between generators and suppliers on the day-ahead market. The unit rate is the per-kWh amount in your contract, which bundles the supplier’s energy cost with grid fees, taxes, levies and VAT. That is why a unit rate almost always sits well above the exchange value shown here.' },
      { q: 'Which countries does the price calculator cover?', a: 'Five bidding zones: Germany with Luxembourg, the Netherlands, Austria, Belgium and Poland. For Germany and the Netherlands it adds the taxes and levies we have checked in the law. For Austria, Belgium and Poland it shows the exchange price and adds whatever you enter from your bill, because we have not verified those countries’ charges ourselves.' },
      { q: 'How often are the prices on this site refreshed?', a: 'Four times a day, at 2:30 pm, 5 pm, 8 pm and 11 pm Berlin time, when we load the latest quarter-hourly values from SMARD and rebuild the pages. After the early-afternoon run the next day is usually included. The date of the latest fetch is printed under every calculator next to the Federal Network Agency credit.' },
      { q: 'Does the exchange price apply to an ordinary fixed contract?', a: 'Only indirectly. A fixed contract bills every kilowatt-hour at the same unit rate whatever the time, because the supplier usually bought the power months in advance. You pay the quarter-hourly exchange price only on a dynamic tariff, and that needs a smart meter able to record your use per quarter hour, which in Germany means an intelligent metering system.' },
    ];
  },
  body: (h) => {
    const d = letzter('DE-LU'), n = letzter('NL');
    const w = fenster('DE-LU', 30);
    const m = monate('DE-LU');
    const j25 = m.jahr('2025'), j24 = m.jahr('2024');
    const hp = h.P.de.haushaltspreise2025_ct;
    const rows = [
      ['Exchange price (daily average)', h.spot(d.mittel, 2), h.spot(n.mittel, 2)],
      ['Grid fee', `${h.ct(h.P.de.netzentgelt2025_ct.DE, 2)} (2025 average)`, 'fixed charge per connection'],
      ['Electricity tax / energy tax', h.ct(h.P.de.stromsteuer_ct, 2), h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)],
      ['Levies (CHP, offshore, section 19)', h.ct(umlagenDe(), 3), 'none'],
      ['Concession fee (municipality up to 100,000)', h.ct(h.P.de.konzessionsabgabe_ct.bis100000, 2), 'none'],
      ['VAT', `${h.num(h.P.de.ust * 100)}%`, `${h.num(h.P.nl.btw * 100)}%`],
      ['All-in, before supplier markup', h.ct(endDe(d.mittel), 2), h.ct(endNl(n.mittel), 2)],
    ];
    return `<h2>From the exchange price to the price on your bill</h2>
<p>What apps and news sites call “the electricity price today” is nearly always the day-ahead exchange price: the wholesale price at which generators and suppliers trade power for each quarter hour of the next day. It is quoted in euros per megawatt-hour; divide by ten and you have cents per kilowatt-hour. No household pays it on its own. The table splits the daily average of ${h.date(d.d)} into the parts set by law and by grid operators in Germany and the Netherlands.</p>
${h.table(['Component', 'Germany', 'Netherlands'], rows, `All-in price from the exchange average of ${h.date(d.d)}`, ['l', 'r', 'r'])}
<p>The German electricity tax is set in ${h.src('stromstg')}, VAT in ${h.src('ustg')}, the concession fee caps in ${h.src('kav')}; the 2026 levies were published by the transmission operators in October 2025 (summary: ${h.src('ihk')}). The Dutch energy tax comes from ${h.src('wbm')} and VAT from ${h.src('wetob')}. Germany’s grid fee depends on the local operator, so the calculator starts from the average per federal state in the ${h.src('monitoring')}. In the Netherlands the network operator charges a fixed amount per connection, which does not change with the hour, so it is left out of the hourly price.</p>
<h2>Why the price changes every fifteen minutes</h2>
<p>Since 1 October 2025 the European day-ahead auction trades quarter hours rather than hours. A day therefore has 96 prices, or 92 and 100 on the days the clocks change. How far apart they are depends on the weather: on sunny days solar power often drives midday prices below zero, while on calm winter evenings gas plants set the price. Over the last ${h.num(w.n)} days in Germany (${h.date(w.von)} to ${h.date(w.bis)}), the dearest quarter hour reached ${h.spot(w.max)} and the cheapest ${h.spot(w.min)}. ${w.negativViertel > 0 ? `On ${h.num(w.negativTage)} of those days there were ${h.num(w.negativViertel)} quarter hours with a negative price in all.` : 'There were no negative prices in that period.'} More on ${h.a('negativ', 'negative electricity prices')}.</p>
<h2>What the spread means for your own use</h2>
<p>On a fixed price it does not matter when the washing machine runs. On a dynamic tariff you pay the exchange price of each quarter hour plus fixed parts, so moving flexible use into cheap hours pays: charging an electric car, a heat pump with a buffer tank, the dishwasher. ${h.a('fenster', 'Cheapest hour')} finds the best start for an appliance with a given running time, ${h.a('laden', 'EV charging cost')} prices a charge overnight or at midday, and ${h.a('vergleich', 'Dynamic electricity tariff')} checks a dynamic contract against your current unit rate over the last thirty days. In Germany every supplier has had to offer such a tariff since 1 January 2025 to customers with a smart metering system (${h.src('enwg41a')}).</p>
<h2>What German households actually pay</h2>
<p>According to the ${h.src('monitoring')}, households using 2,500 to 5,000 kWh a year paid an average of ${h.ct(hp.durchschnitt, 2)} including VAT on 1 April 2025, ${h.ct(hp.grundversorgung, 2)} on the default supply tariff and ${h.ct(hp.andererLieferant, 2)} with another supplier. For dynamic tariffs the same report gives a 2025 model price of ${h.ct(hp.modellDynamisch, 2)}. These figures include standing charges and are averages; your own contract may be higher or lower.</p>
<h2>The exchange price over the years</h2>
<p>${j25 && j24 ? `In Germany a megawatt-hour on the day-ahead market averaged ${h.eur(j25, 2)} in 2025 and ${h.eur(j24, 2)} in 2024, or ${h.spot(j25, 2)} against ${h.spot(j24, 2)}.` : ''} In ${h.monat(m.letzt[0])} the monthly average was ${h.spot(m.letzt[1], 2)}. The full series since 2018, day by day and month by month, is on ${h.a('verlauf', 'EPEX spot prices')}. Tomorrow alone has its own page, ${h.a('morgen', 'electricity price tomorrow')}, and today’s hours are on ${h.a('preis', 'hourly electricity prices')}.</p>
<h2>Five bidding zones</h2>
<p>Germany and Luxembourg share one bidding zone; Austria has had its own since October 2018, and the Netherlands, Belgium and Poland each have one. All are coupled into one European market, so prices often sit close together, yet on windy days they can drift far apart. The calculator above switches between zones. Country pages explain what is added in ${h.a('epex-oesterreich', 'Austria')}, ${h.a('belgie', 'Belgium')} and ${h.a('polen', 'Poland')}, where we show the exchange price and let you add the rest from your bill, since we have not checked those countries’ taxes line by line.</p>
<h2>Four euro zones over 30 days</h2>
${h.table(['Bidding zone', 'Average', 'Average daily spread', 'Negative quarter hours'], (['DE-LU', 'NL', 'AT', 'BE'] as Zone[]).map((z) => { const x = fenster(z, 30); return [ZN[z], h.spot(x.mittel, 2), h.spot(x.spreizung, 1), h.num(x.negativViertel)]; }), `Day-ahead exchange price ${h.date(w.von)} to ${h.date(w.bis)}, source SMARD; Poland in złoty on its own page`, ['l', 'r', 'r', 'r'])}
<p>The average daily spread is the gap between the cheapest and the dearest quarter hour of a day, averaged over the period. The wider it is, the more there is to gain from shifting use, and the more a dynamic tariff differs from a fixed price for households that use a lot of power at expensive times.</p>
<h2>Three kinds of household</h2>
<p>On a fixed contract every kilowatt-hour costs the same, so the curve shows when the grid is full of wind and solar power rather than what you pay. On a dynamic tariff without large loads, only the washing machine, dryer and dishwasher can move, and use peaks in the evening just when prices often do. On a dynamic tariff with an electric car or a heat pump with storage, 50 to 100 kWh a week can go into the cheapest hours, and that is where the daily spread pays off most, provided a wallbox timer or an energy manager does the shifting.</p>
<h2>When each day’s prices are fixed</h2>
<p>The routine is the same every day. Until noon, generators, traders and suppliers submit bids for every quarter hour of the next day. The auction clears all coupled European bidding zones together, taking into account how much power the lines between countries can carry. The results come out in the early afternoon, SMARD makes them available, and we load them several times in the afternoon and evening. From then on the next day’s prices are fixed, and a household tariff tied to the day-ahead price bills on exactly these values; what happens in intraday trading on the delivery day does not change that.</p>
<h2>How to read the calculator</h2>
<p>At the top you pick the bidding zone and the day. For Germany, choose your federal state and the calculator fills in that state’s average grid fee; if your bill shows a different amount, overwrite it. Your supplier’s markup is in the terms of a dynamic contract, usually a fixed amount per kWh above the exchange price, and the municipality size sets the concession fee. For the Netherlands you enter the purchase fee, and the energy tax and VAT are added for you. The result shows the all-in price now or as a daily average, the cheapest and dearest hours, the bare exchange value and the number of negative quarter hours, followed by the curve and an hour-by-hour table.</p>
<h2>What is not included</h2>
<p>Standing charges, metering fees and Dutch network charges are paid per year or per connection, whatever you use, so they are not part of a price per kWh. Reduced grid fees for controllable loads such as heat pumps or wallboxes depend on the grid operator and can be entered as a lower grid fee. For Austria, Belgium and Poland we add no taxes of our own. And the calculator only knows published prices: we show no forecasts for the day after tomorrow or next month.</p>
<h2>Where the figures come from</h2>
<p>All exchange prices come from ${h.src('smard')}, the electricity market platform of the Federal Network Agency, which publishes the day-ahead results under the CC BY 4.0 licence. We reload them four times a day and do not alter them. Dutch consumer averages come from ${h.src('cbs')}, the złoty rate from the ${h.src('ezb')}. The calculation, its assumptions and its tests are described in the method; who publishes the site is on the about page.</p>`;
  },
};
