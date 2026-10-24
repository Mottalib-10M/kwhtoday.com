import { defineGuide, type Helpers } from '../../lib/guide-types';
import { tagAm, fenster, endNl } from '../../lib/fakten';

/** Stroomprijs nu : het lopende kwartier (in de browser bepaald), met de dag van de build als context. */
function D(h: Helpers) {
  const nl = tagAm('NL', h.today), be = tagAm('BE', h.today);
  const w = fenster('NL', 30);
  const boven = nl.t.v.filter((v) => v > nl.f.mittel).length;
  return { nl, be, w, boven };
}

export default defineGuide({
  id: 'jetzt',
  group: 'preise',
  order: 15,
  tool: 'jetzt',
  zone: { en: 'NL', nl: 'NL' },
  zonen: ['BE', 'DE-LU'],
  related: ['morgen', 'preis', 'fenster', 'negativ', 'vergleich'],
  sources: ['smard', 'smardLizenz', 'wbm', 'wetob', 'cbs'],
  en: {
    slug: 'electricity-price-now',
    nav: 'Electricity price now',
    card: 'The price of the current quarter hour, all-in, refreshed every minute.',
    title: 'Electricity price now: this quarter hour with energy tax',
    description: 'Electricity price now for the current quarter hour in the Netherlands and Belgium: exchange value and all-in price with energy tax and VAT, against today.',
    h1: 'Electricity price now: what the current quarter hour costs',
    intro: 'The calculator reads your clock and picks the quarter hour you are in. Add your contract’s purchase fee to see what you pay right now.',
    resume: (h) => {
      const { nl, w, boven } = D(h);
      const f = nl.f;
      return `The electricity price right now, on a Dutch dynamic contract, is the day-ahead exchange price of the current quarter hour plus your supplier’s purchase fee, the energy tax of ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} per kWh and ${h.num(h.P.nl.btw * 100)}% VAT. The price for each quarter hour was fixed the day before, so “now” never surprises you: it was known since early yesterday afternoon. On ${h.date(f.d)} the exchange price in the Dutch zone averages ${h.spot(f.mittel)}, from ${h.spot(f.min)} at ${f.minUhr} to ${h.spot(f.max)} at ${f.maxUhr}; ${h.num(boven)} of the day’s ${h.num(f.n)} quarter hours are above that average. Before any purchase fee, the average comes to about ${h.ct(endNl(f.mittel))} all-in. Over the last ${h.num(w.n)} days the cheapest hour of the day was, on average, the one starting at ${String(w.billigsteStunde).padStart(2, '0')}:00, so if the price now is high, the calculator below shows how much waiting would save. Network charges are a daily amount per connection and are not part of this quarter-hourly price.`;
    },
    faqs: () => [
      { q: 'How does the page know which quarter hour it is?', a: 'It reads the clock of your device once the page has loaded and then every minute, converts it to Central European time and picks the matching quarter hour from the published day. If your device clock is wrong, the highlighted quarter hour is wrong too. Nothing about your device or location is sent anywhere; the calculation happens entirely in your browser.' },
      { q: 'Is the price now the same in the Netherlands and Belgium?', a: 'Often close, but not always. Both are separate bidding zones in the same coupled auction, so the exchange prices only match when the cross-border lines have spare room. Switch the zone in the calculator to compare. The all-in prices differ much more, because each country has its own taxes; for Belgium we only add what you enter yourself.' },
      { q: 'Should I wait if the price right now is high?', a: 'Only for use you can move: a dishwasher, a dryer, charging a car. The fridge and the lights run anyway. Compare the current quarter hour with the cheapest hour shown under it; if the gap is a few cents per kWh, a two-kilowatt-hour wash saves a few cents. For a car battery of tens of kWh, the same gap is worth waiting for.' },
    ],
    body: (h) => {
      const { nl, be } = D(h);
      const rows = [
        ['Average', h.spot(nl.f.mittel, 2), h.spot(be.f.mittel, 2)],
        ['Lowest quarter hour', `${h.spot(nl.f.min, 2)} (${nl.f.minUhr})`, `${h.spot(be.f.min, 2)} (${be.f.minUhr})`],
        ['Highest quarter hour', `${h.spot(nl.f.max, 2)} (${nl.f.maxUhr})`, `${h.spot(be.f.max, 2)} (${be.f.maxUhr})`],
        ['Negative quarter hours', h.num(nl.f.negativ), h.num(be.f.negativ)],
      ];
      return `<h2>Today in the Dutch and Belgian zones</h2>
${h.table(['', 'Netherlands', 'Belgium'], rows, `Day-ahead exchange price on ${h.date(nl.f.d)}, source SMARD`, ['l', 'r', 'r'])}
<p>The values come from ${h.src('smard')}, which publishes the results for all European bidding zones under the CC BY 4.0 licence. The Dutch energy tax is set in the ${h.src('wbm')}, VAT in the ${h.src('wetob')}.</p>
<h2>Now, today, tomorrow</h2>
<p>This page answers one question: what does the current quarter hour cost. The whole day hour by hour is on ${h.a('preis', 'hourly electricity prices')}, the next day from early afternoon on ${h.a('morgen', 'electricity price tomorrow')}, and the best start for an appliance on ${h.a('fenster', 'cheapest hour')}. Whether a dynamic contract beats your current one over a month is on ${h.a('vergleich', 'dynamic electricity tariff')}.</p>`;
    },
  },
  nl: {
    slug: 'stroomprijs-nu',
    nav: 'Stroomprijs nu',
    card: 'De prijs van het lopende kwartier, met belasting, elke minuut bijgewerkt.',
    title: 'Stroomprijs nu: het huidige kwartier met energiebelasting',
    description: 'Stroomprijs nu voor het lopende kwartier in Nederland en België: de beursprijs en je eindprijs met energiebelasting en btw, naast de rest van de hele dag.',
    h1: 'Stroomprijs nu: wat het huidige kwartier kost',
    intro: 'De rekenhulp leest de klok van je toestel en kiest het kwartier waarin je zit. Vul je inkoopvergoeding in en je ziet wat je op dit moment betaalt.',
    resume: (h) => {
      const { nl, w, boven } = D(h);
      const f = nl.f;
      return `De stroomprijs van dit moment is bij een dynamisch contract de day-aheadbeursprijs van het lopende kwartier, plus de inkoopvergoeding van je leverancier, de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} per kWh en ${h.num(h.P.nl.btw * 100)} % btw. Die kwartierprijs lag al sinds gistermiddag vast, dus „nu” is nooit een verrassing. Op ${h.date(f.d)} is de beursprijs in de Nederlandse biedzone gemiddeld ${h.spot(f.mittel)}, van ${h.spot(f.min)} om ${f.minUhr} uur tot ${h.spot(f.max)} om ${f.maxUhr} uur; ${h.num(boven)} van de ${h.num(f.n)} kwartieren van de dag liggen boven dat gemiddelde. Zonder inkoopvergoeding komt het daggemiddelde uit op ongeveer ${h.ct(endNl(f.mittel))}. Over de laatste ${h.num(w.n)} dagen was gemiddeld het uur vanaf ${String(w.billigsteStunde).padStart(2, '0')}:00 het goedkoopst; is de prijs nu hoog, dan zie je onder de uitkomst hoeveel wachten scheelt. Netbeheerkosten betaal je per dag en per aansluiting; ze zitten niet in deze kwartierprijs.`;
    },
    faqs: () => [
      { q: 'Hoe weet de pagina welk kwartier het is?', a: 'Ze leest na het laden de klok van je toestel, en daarna elke minuut opnieuw, rekent die om naar Nederlandse tijd en kiest het bijbehorende kwartier uit de gepubliceerde dag. Loopt je klok verkeerd, dan klopt ook het gemarkeerde kwartier niet. Er wordt niets over je toestel of locatie verstuurd: alles gebeurt in je browser.' },
      { q: 'Is de stroomprijs nu in België gelijk aan die in Nederland?', a: 'Vaak ongeveer, maar niet altijd. Het zijn twee biedzones in dezelfde gekoppelde veiling; de beursprijzen zijn alleen gelijk als de grensverbindingen ruimte hebben. Kies in de rekenhulp de andere zone om te vergelijken. De eindprijzen verschillen veel meer, omdat elk land eigen belastingen heeft; voor België tellen we alleen op wat je zelf invult.' },
      { q: 'Moet ik wachten als de stroomprijs nu hoog is?', a: 'Alleen met verbruik dat je kunt verschuiven: de vaatwasser, de droger, het laden van de auto. De koelkast en de verlichting lopen toch door. Vergelijk het huidige kwartier met het goedkoopste uur eronder; scheelt het een paar cent per kWh, dan levert een was van twee kWh een paar cent op. Bij een autoaccu van tientallen kWh loont hetzelfde verschil wel.' },
    ],
    body: (h) => {
      const { nl, be } = D(h);
      const rows = [
        ['Gemiddelde', h.spot(nl.f.mittel, 2), h.spot(be.f.mittel, 2)],
        ['Laagste kwartier', `${h.spot(nl.f.min, 2)} (${nl.f.minUhr})`, `${h.spot(be.f.min, 2)} (${be.f.minUhr})`],
        ['Hoogste kwartier', `${h.spot(nl.f.max, 2)} (${nl.f.maxUhr})`, `${h.spot(be.f.max, 2)} (${be.f.maxUhr})`],
        ['Negatieve kwartieren', h.num(nl.f.negativ), h.num(be.f.negativ)],
      ];
      return `<h2>Vandaag in de Nederlandse en Belgische zone</h2>
${h.table(['', 'Nederland', 'België'], rows, `Day-aheadbeursprijs op ${h.date(nl.f.d)}, bron SMARD`, ['l', 'r', 'r'])}
<p>De waarden komen van ${h.src('smard')}, dat de uitkomst voor alle Europese biedzones publiceert onder licentie CC BY 4.0. De energiebelasting staat in de ${h.src('wbm')}, de btw in de ${h.src('wetob')}. Ter vergelijking met een variabel contract gebruiken we de maandgemiddelden van ${h.src('cbs')}.</p>
<h2>Nu, vandaag, morgen</h2>
<p>Deze pagina beantwoordt één vraag: wat kost het huidige kwartier. De hele dag uur voor uur staat op ${h.a('preis', 'stroomprijs per uur')}, de volgende dag vanaf begin van de middag op ${h.a('morgen', 'stroomprijs morgen')}, en het beste starttijdstip voor een apparaat op ${h.a('fenster', 'goedkoopste uur')}. Of een dynamisch contract over een maand goedkoper uitvalt dan je huidige, rekent ${h.a('vergleich', 'dynamisch energiecontract')} uit.</p>`;
    },
  },
});
