import { defineGuide, type Helpers } from '../../lib/guide-types';
import { letzter, vorletzter, endDe, endNl } from '../../lib/fakten';
import type { Zone } from '../../lib/engine/tarif';

/** Strompreis morgen : der zuletzt veröffentlichte Tag (ab dem frühen Nachmittag der Folgetag) gegen den Tag davor. */
const ZONEN: Zone[] = ['DE-LU', 'NL', 'AT', 'BE', 'PL'];
function D(_h: Helpers) {
  const z = Object.fromEntries(ZONEN.map((k) => [k, { l: letzter(k), v: vorletzter(k) }])) as Record<Zone, { l: ReturnType<typeof letzter>; v: ReturnType<typeof letzter> }>;
  return { z, de: z['DE-LU'], nl: z.NL };
}
const NAME: Record<Zone, [string, string, string]> = { 'DE-LU': ['Deutschland', 'Germany', 'Duitsland'], NL: ['Niederlande', 'Netherlands', 'Nederland'], AT: ['Österreich', 'Austria', 'Oostenrijk'], BE: ['Belgien', 'Belgium', 'België'], PL: ['Polen', 'Poland', 'Polen'] };

export default defineGuide({
  id: 'morgen',
  group: 'preise',
  order: 10,
  tool: 'morgen',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT', 'NL', 'BE', 'PL'], en: ['NL', 'AT', 'BE', 'PL'], nl: ['BE', 'DE-LU', 'AT', 'PL'] },
  related: ['preis', 'fenster', 'laden', 'negativ', 'jetzt'],
  sources: ['smard', 'smardLizenz', 'stromstg', 'ustg', 'wbm', 'monitoring'],
  de: {
    slug: 'strompreis-morgen',
    nav: 'Strompreis morgen',
    card: 'Alle Viertelstunden des nächsten Tages, sobald die Auktion veröffentlicht ist.',
    title: 'Strompreis morgen: alle 96 Viertelstunden mit Endpreis',
    description: 'Strompreis morgen je Viertelstunde, sobald die Day-Ahead-Auktion am frühen Nachmittag veröffentlicht ist: Börsenwert, Endpreis mit Abgaben, günstigste Stunde.',
    h1: 'Strompreis morgen: was die Kilowattstunde am nächsten Tag kostet',
    intro: 'Ab dem frühen Nachmittag stehen die Preise des nächsten Tages fest. Der Rechner zeigt sie je Viertelstunde, mit Ihrem Netzentgelt und Ihrem Aufschlag.',
    resume: (h) => {
      const { de } = D(h);
      const l = de.l, v = de.v;
      return `Der Strompreis für morgen wird jeden Tag um 12 Uhr in der europäischen Day-Ahead-Auktion festgelegt, für jede der 96 Viertelstunden des Folgetags, und kurz danach veröffentlicht. Der zuletzt veröffentlichte Tag ist der ${h.date(l.d)}: der Börsenpreis liegt für Deutschland und Luxemburg im Mittel bei ${h.spot(l.mittel)}, ${l.mittel < v.mittel ? 'niedriger' : 'höher'} als am ${h.date(v.d)} mit ${h.spot(v.mittel)}. Die günstigste Stunde beginnt um ${l.billigH} Uhr (${h.spot(l.billigWert)}), die teuerste um ${l.teuerH} Uhr (${h.spot(l.teuerWert)}). Mit dem Bundesmittel des Netzentgelts, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer, aber ohne Aufschlag des Anbieters, wird daraus ein Endpreis zwischen etwa ${h.ct(endDe(l.billigWert))} und ${h.ct(endDe(l.teuerWert))}. Diesen Preis zahlen nur Haushalte mit dynamischem Tarif und intelligentem Messsystem. Wer einen Festpreis hat, kann den Tag trotzdem lesen: er zeigt, wann das Netz mit viel Wind- und Solarstrom versorgt ist. ${l.negativ > 0 ? `Für diesen Tag sind ${h.num(l.negativ)} Viertelstunden mit negativem Börsenpreis veröffentlicht.` : 'Negative Börsenpreise gibt es an diesem Tag keine.'}`;
    },
    faqs: () => [
      { q: 'Ab wie viel Uhr sind die Strompreise für morgen da?', a: 'Die Gebote für den Folgetag nimmt die Börse bis 12 Uhr an; die Ergebnisse für alle Viertelstunden erscheinen meist zwischen 12.45 und 13.30 Uhr. SMARD stellt sie danach bereit, wir laden sie um 14.30 und 15.30 Uhr und noch dreimal am Abend. Steht im Rechner unter „Morgen“ noch der heutige Tag, sind die neuen Preise noch nicht eingetroffen.' },
      { q: 'Können sich die Preise für morgen noch ändern?', a: 'Nein, nicht die Preise der Day-Ahead-Auktion: sie stehen nach der Veröffentlichung fest und werden so abgerechnet, wenn Ihr dynamischer Tarif an diesen Markt gebunden ist. Im kurzfristigen Intraday-Handel entstehen am Liefertag zwar andere Preise, dynamische Haushaltstarife werden aber in der Regel nach dem Day-Ahead-Preis abgerechnet. Welcher Preis für Ihren Vertrag gilt, steht in den Vertragsbedingungen.' },
      { q: 'Warum ist der Strom am Wochenende oft billiger?', a: 'Weil Industrie und Gewerbe am Samstag und Sonntag weniger verbrauchen, während Wind- und Solaranlagen gleich viel liefern. Sinkt die Nachfrage bei gleichem Angebot, fällt der Preis, an sonnigen Sonntagen mittags oft unter null. Feiertage wirken ähnlich. Wer Wäsche, Trockner oder Ladevorgänge planen kann, findet die günstigsten Stunden deshalb häufig am Wochenende.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const rows = (Object.keys(z) as Zone[]).map((k) => [NAME[k][0], k === 'PL' ? 'in Złoty: siehe Polen' : h.spot(z[k].l.mittel, 2), k === 'PL' ? '' : h.spot(z[k].v.mittel, 2), `${z[k].l.billigH} Uhr`, h.num(z[k].l.negativ)]);
      const l = z['DE-LU'].l;
      return `<h2>Der nächste Tag in fünf Preiszonen</h2>
${h.table(['Preiszone', `Mittel ${h.date(l.d)}`, `Mittel ${h.date(z['DE-LU'].v.d)}`, 'Günstigste Stunde', 'Negative Viertelstunden'], rows.filter((r) => r[0] !== 'Polen'), 'Day-Ahead-Börsenpreis ohne Steuern und Netz, Quelle SMARD', ['l', 'r', 'r', 'r', 'r'])}
<p>Alle Zonen werden in derselben Auktion gemeinsam berechnet. Unterschiede entstehen, wenn die Leitungen zwischen den Ländern ausgelastet sind: dann kann der Strom in einer windreichen Zone billig und eine Grenze weiter teuer sein. Die Werte stammen von ${h.src('smard')}.</p>
<h2>Wie Sie den Tag lesen</h2>
<p>Die Kurve im Rechner zeigt den Endpreis jeder Viertelstunde mit Ihren Angaben. Tragen Sie unter „Aufschlag“ den Betrag ein, den Ihr Anbieter auf den Börsenpreis legt, und wählen Sie Ihr Bundesland für das Netzentgelt; die Vorgabe ist das Mittel aus dem ${h.src('monitoring')}. Stromsteuer (${h.src('stromstg', '§ 3 StromStG')}) und Umsatzsteuer (${h.src('ustg', '§ 12 UStG')}) rechnet der Rechner selbst. Für ein Gerät mit fester Laufzeit sucht ${h.a('fenster', 'günstigste Stunde')} den besten Startzeitpunkt über heute und morgen, für das Auto ${h.a('laden', 'E-Auto laden')}.</p>
<h2>Wenn „Morgen“ noch heute zeigt</h2>
<p>Vor der Veröffentlichung gegen 13 Uhr gibt es keine Preise für den nächsten Tag. Der Rechner zeigt dann den heutigen Tag und sagt das dazu. Schätzungen oder Prognosen für morgen veröffentlichen wir nicht, weil sie keine Abrechnungsgrundlage sind. Die heutigen Stunden im Detail stehen auf ${h.a('preis', 'Strompreis pro Stunde')}.</p>`;
    },
  },
  en: {
    slug: 'electricity-price-tomorrow',
    nav: 'Electricity price tomorrow',
    card: 'Every quarter hour of the next day, as soon as the auction result is out.',
    title: 'Electricity price tomorrow: all 96 quarter hours, all-in',
    description: 'Electricity price tomorrow for every quarter hour, once the day-ahead auction is out in the early afternoon: exchange value, all-in price and cheapest hour.',
    h1: 'Electricity price tomorrow: what a kilowatt-hour costs on the next day',
    intro: 'From early afternoon the next day’s prices are fixed. The calculator shows each quarter hour with your own grid fee and supplier markup.',
    resume: (h) => {
      const { de, nl } = D(h);
      const l = de.l;
      return `Tomorrow’s electricity price is set every day at noon Central European time in the European day-ahead auction, separately for each of the next day’s 96 quarter hours, and published shortly afterwards. The latest published day is ${h.date(l.d)}. In the German and Luxembourg zone the exchange price averages ${h.spot(l.mittel)}, against ${h.spot(de.v.mittel)} on ${h.date(de.v.d)}; the cheapest hour starts at ${l.billigH} (${h.spot(l.billigWert)}) and the dearest at ${l.teuerH} (${h.spot(l.teuerWert)}). In the Dutch zone the average is ${h.spot(nl.l.mittel)}, with the cheapest hour at ${nl.l.billigH}. Add a German household’s average grid fee, electricity tax, levies, concession fee and VAT, but no supplier markup, and the German range runs from about ${h.ct(endDe(l.billigWert))} to ${h.ct(endDe(l.teuerWert))}; with Dutch energy tax and VAT the Dutch range is about ${h.ct(endNl(nl.l.billigWert))} to ${h.ct(endNl(nl.l.teuerWert))}. Only customers on a dynamic tariff with a smart meter pay these prices directly, but the curve also shows when the grid is running on plenty of wind and solar power.`;
    },
    faqs: () => [
      { q: 'What time do tomorrow’s power prices come out?', a: 'The exchange accepts bids for the next day until noon Central European time, and the results for every quarter hour usually appear between 12:45 and 1:30 pm. SMARD makes them available after that; we load them at 2:30 pm and 3:30 pm and three more times in the evening. If “Tomorrow” in the calculator still shows today, the new prices have not arrived yet.' },
      { q: 'Can tomorrow’s day-ahead prices still change?', a: 'No. Once published, the day-ahead auction prices are final and are what a dynamic tariff tied to that market bills. Intraday trading on the delivery day produces other prices, but household dynamic tariffs are generally billed on the day-ahead result. Which price applies to your own contract is stated in its terms.' },
      { q: 'Why is power often cheaper at weekends?', a: 'Because industry and offices use less on Saturdays and Sundays while wind turbines and solar panels produce just as much. Lower demand with the same supply pushes prices down, often below zero at midday on sunny Sundays, and public holidays work the same way. If you can plan laundry or car charging, the cheapest hours often fall at the weekend.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const ks = (Object.keys(z) as Zone[]).filter((k) => k !== 'PL');
      const rows = ks.map((k) => [NAME[k][1], h.spot(z[k].l.mittel, 2), h.spot(z[k].v.mittel, 2), z[k].l.billigH, h.num(z[k].l.negativ)]);
      const l = z['DE-LU'].l;
      return `<h2>The next day in four euro bidding zones</h2>
${h.table(['Bidding zone', `Average ${h.date(l.d)}`, `Average ${h.date(z['DE-LU'].v.d)}`, 'Cheapest hour', 'Negative quarter hours'], rows, 'Day-ahead exchange price before taxes and grid fees, source SMARD', ['l', 'r', 'r', 'r', 'r'])}
<p>All zones are computed together in the same auction. Differences appear when the lines between countries are full: power can then be cheap in a windy zone and dear one border further on. Poland trades in złoty and has its own page, ${h.a('polen', 'Poland electricity price')}. The figures come from ${h.src('smard')}.</p>
<h2>How to read the day</h2>
<p>The curve shows the all-in price of every quarter hour with your inputs. Enter the markup your supplier adds to the exchange price and, for Germany, your federal state for the grid fee; the default is the average from the ${h.src('monitoring')}. The calculator adds electricity tax and VAT itself, and for the Netherlands the energy tax from the ${h.src('wbm')}. To find the best start for an appliance across today and tomorrow, use ${h.a('fenster', 'cheapest hour')}; for a car, ${h.a('laden', 'EV charging cost')}.</p>
<h2>When “Tomorrow” still shows today</h2>
<p>Before publication at around 1 pm there are no prices for the next day, so the calculator shows today and says so. We do not publish forecasts for tomorrow, because nobody is billed on them. Today’s hours in detail are on ${h.a('preis', 'hourly electricity prices')}.</p>`;
    },
  },
  nl: {
    slug: 'stroomprijs-morgen',
    nav: 'Stroomprijs morgen',
    card: 'Alle kwartieren van de volgende dag, zodra de veiling gepubliceerd is.',
    title: 'Stroomprijs morgen: alle 96 kwartieren met eindprijs',
    description: 'Stroomprijs morgen per kwartier, zodra de day-aheadveiling begin van de middag uit is: beursprijs, eindprijs met energiebelasting en btw, goedkoopste uur.',
    h1: 'Stroomprijs morgen: wat een kilowattuur de volgende dag kost',
    intro: 'Vanaf begin van de middag liggen de prijzen van morgen vast. De rekenhulp toont ze per kwartier, met je eigen inkoopvergoeding erbij.',
    resume: (h) => {
      const { nl } = D(h);
      const l = nl.l;
      return `De stroomprijs van morgen wordt elke dag om 12 uur vastgesteld in de Europese day-aheadveiling, voor elk van de 96 kwartieren van de volgende dag, en kort daarna gepubliceerd. De laatst gepubliceerde dag is ${h.date(l.d)}: in de Nederlandse biedzone is de beursprijs gemiddeld ${h.spot(l.mittel)}, ${l.mittel < nl.v.mittel ? 'lager' : 'hoger'} dan op ${h.date(nl.v.d)} met ${h.spot(nl.v.mittel)}. Het goedkoopste uur begint om ${l.billigH} uur (${h.spot(l.billigWert)}), het duurste om ${l.teuerH} uur (${h.spot(l.teuerWert)}). Met energiebelasting en btw, maar zonder inkoopvergoeding, wordt dat een eindprijs van ongeveer ${h.ct(endNl(l.billigWert))} tot ${h.ct(endNl(l.teuerWert))}. Die prijs betaal je alleen met een dynamisch contract en een slimme meter. Heb je een vast of variabel contract, dan laat de dag toch zien wanneer er veel wind- en zonnestroom op het net is. ${l.negativ > 0 ? `Voor deze dag zijn ${h.num(l.negativ)} kwartieren met een negatieve beursprijs gepubliceerd.` : 'Negatieve beursprijzen zijn er die dag niet.'} De netbeheerkosten betaal je per aansluiting en zitten niet in deze kwartierprijs.`;
    },
    faqs: () => [
      { q: 'Vanaf hoe laat staan de prijzen van morgen online?', a: 'De beurs neemt biedingen voor de volgende dag aan tot 12 uur; de uitkomst voor alle kwartieren verschijnt meestal tussen 12.45 en 13.30 uur. SMARD stelt ze daarna beschikbaar en wij laden ze om 14.30 en 15.30 uur, en ’s avonds nog drie keer. Toont de rekenhulp bij „Morgen” nog vandaag, dan zijn de nieuwe prijzen nog niet binnen.' },
      { q: 'Kunnen de prijzen van morgen nog veranderen?', a: 'Nee. Na publicatie liggen de prijzen van de day-aheadveiling vast, en dat zijn de prijzen waarmee een dynamisch contract afrekent. Op de dag zelf ontstaan in de intradayhandel wel andere prijzen, maar dynamische contracten voor huishoudens rekenen doorgaans af op de day-aheaduitkomst. Welke prijs voor jouw contract geldt, staat in de voorwaarden.' },
      { q: 'Waarom is stroom in het weekend vaak goedkoper?', a: 'Omdat bedrijven en industrie op zaterdag en zondag minder verbruiken, terwijl windmolens en zonnepanelen evenveel leveren. Minder vraag bij hetzelfde aanbod drukt de prijs, op zonnige zondagen rond het middaguur vaak onder nul. Feestdagen werken net zo. Wie de was of het laden van de auto kan plannen, vindt de goedkoopste uren dus vaak in het weekend.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const ks: Zone[] = ['NL', 'BE', 'DE-LU', 'AT'];
      const rows = ks.map((k) => [NAME[k][2], h.spot(z[k].l.mittel, 2), h.spot(z[k].v.mittel, 2), `${z[k].l.billigH} uur`, h.num(z[k].l.negativ)]);
      const l = z.NL.l;
      return `<h2>De volgende dag in vier biedzones</h2>
${h.table(['Biedzone', `Gemiddelde ${h.date(l.d)}`, `Gemiddelde ${h.date(z.NL.v.d)}`, 'Goedkoopste uur', 'Negatieve kwartieren'], rows, 'Day-aheadbeursprijs zonder belastingen en netkosten, bron SMARD', ['l', 'r', 'r', 'r', 'r'])}
<p>Alle zones worden in dezelfde veiling samen berekend. Verschillen ontstaan als de verbindingen tussen de landen vol zitten: dan kan stroom in een winderige zone goedkoop zijn en een grens verder duur. De cijfers komen van ${h.src('smard')}.</p>
<h2>Zo lees je de dag</h2>
<p>De grafiek in de rekenhulp toont de eindprijs van elk kwartier met jouw gegevens. Vul de inkoopvergoeding van je contract in; de energiebelasting uit de ${h.src('wbm')} en de btw rekent de rekenhulp zelf. Voor een apparaat met een vaste looptijd zoekt ${h.a('fenster', 'goedkoopste uur')} het beste starttijdstip over vandaag en morgen, voor de auto ${h.a('laden', 'auto laden')}.</p>
<h2>Als „Morgen” nog vandaag toont</h2>
<p>Voor de publicatie rond 13 uur zijn er geen prijzen voor de volgende dag. De rekenhulp toont dan vandaag en zegt dat erbij. Voorspellingen voor morgen publiceren we niet, omdat niemand erop afrekent. Het huidige kwartier staat op ${h.a('jetzt', 'stroomprijs nu')}, de uren van vandaag op ${h.a('preis', 'stroomprijs per uur')}.</p>`;
    },
  },
});
