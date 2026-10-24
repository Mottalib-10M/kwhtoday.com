import { defineGuide, type Helpers } from '../../lib/guide-types';
import { tagAm, endDe, endNl } from '../../lib/fakten';

/** Strompreis pro Stunde : die Stunden des Build-Tags, je drei Stunden zusammengefasst, Börse und Endpreis. */
function D(h: Helpers) {
  const de = tagAm('DE-LU', h.today), nl = tagAm('NL', h.today);
  const bloecke = (s: typeof de.stunden) => Array.from({ length: 8 }, (_, i) => {
    const x = s.filter((y) => Math.floor(Number(y.heure.slice(0, 2)) / 3) === i);
    return { von: `${String(i * 3).padStart(2, '0')}:00`, bis: `${String(i * 3 + 3).padStart(2, '0')}:00`, m: x.reduce((a, b) => a + b.moyenne, 0) / Math.max(1, x.length) };
  });
  const viertelSpanne = (t: typeof de.t) => {
    // größter Sprung zwischen zwei Viertelstunden derselben Stunde
    let max = 0;
    for (let i = 0; i + 1 < t.v.length; i++) if (i % 4 !== 3) max = Math.max(max, Math.abs(t.v[i + 1] - t.v[i]));
    return max;
  };
  return { de, nl, bDe: bloecke(de.stunden), bNl: bloecke(nl.stunden), sprungDe: viertelSpanne(de.t), sprungNl: viertelSpanne(nl.t) };
}

export default defineGuide({
  id: 'preis',
  group: 'preise',
  order: 20,
  tool: 'preis',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT', 'NL', 'BE', 'PL'], en: ['NL', 'AT', 'BE', 'PL'], nl: ['BE', 'DE-LU', 'AT', 'PL'] },
  related: ['morgen', 'fenster', 'verlauf', 'zusammensetzung', 'jetzt'],
  sources: ['smard', 'smardLizenz', 'stromstg', 'kav', 'wbm', 'wetob'],
  de: {
    slug: 'strompreis-pro-stunde',
    nav: 'Strompreis pro Stunde',
    card: 'Jede Stunde des Tages mit ihren vier Viertelstunden, Börse und Endpreis.',
    title: 'Strompreis pro Stunde: heute Stunde für Stunde mit Abgaben',
    description: 'Strompreis pro Stunde für heute: Börsenpreis jeder Stunde und ihrer vier Viertelstunden, daneben der Endpreis mit Netzentgelt, Steuern, Umlagen und Abgaben.',
    h1: 'Strompreis pro Stunde: der heutige Tag Stunde für Stunde',
    intro: 'Die Tabelle unter der Kurve zeigt jede Stunde des Tages, links der Börsenpreis, rechts der Preis mit Ihren Abgaben.',
    resume: (h) => {
      const { de, sprungDe } = D(h);
      const f = de.f;
      return `Der Strompreis pro Stunde ist seit dem 1. Oktober 2025 eigentlich ein Preis pro Viertelstunde: die Day-Ahead-Auktion legt für jeden Tag 96 Werte fest, und eine „Stunde“ ist das Mittel ihrer vier Viertelstunden. Am ${h.date(f.d)} liegt der Börsenpreis für Deutschland und Luxemburg im Tagesmittel bei ${h.spot(f.mittel)}. Am günstigsten ist die Stunde ab ${f.billigH} Uhr mit ${h.spot(f.billigWert)}, am teuersten die ab ${f.teuerH} Uhr mit ${h.spot(f.teuerWert)}. Innerhalb einer Stunde sprang der Preis an diesem Tag von einer Viertelstunde zur nächsten um bis zu ${h.spot(sprungDe)}, deshalb zeigt die Kurve jede Viertelstunde einzeln. Für Ihre Rechnung kommen feste Beträge je Kilowattstunde hinzu: Netzentgelt, Stromsteuer, Umlagen und Konzessionsabgabe, dann ${h.num(h.P.de.ust * 100)} % Umsatzsteuer auf alles. Ohne Aufschlag des Anbieters kostet die günstigste Stunde so etwa ${h.ct(endDe(f.billigWert))} und die teuerste ${h.ct(endDe(f.teuerWert))}. Der Abstand zwischen beiden ist der Betrag, den ein dynamischer Tarif je verschobener Kilowattstunde spart.`;
    },
    faqs: () => [
      { q: 'Warum gibt es pro Stunde vier verschiedene Preise?', a: 'Weil die europäische Day-Ahead-Auktion seit dem 1. Oktober 2025 in Viertelstunden handelt. Vorher gab es einen Preis je Stunde. Mit Viertelstunden lässt sich der schnelle Anstieg am Morgen und das Abklingen der Solarleistung am Abend genauer abbilden. Die Stunde in der Tabelle ist das Mittel ihrer vier Viertelstunden; abgerechnet wird bei dynamischen Tarifen je nach Vertrag die Viertelstunde oder die Stunde.' },
      { q: 'Zu welcher Uhrzeit gelten die angezeigten Stunden?', a: 'Alle Zeiten sind deutsche Ortszeit, also im Winter MEZ und im Sommer MESZ. Die Stunde „14:00“ umfasst die Viertelstunden von 14:00 bis 14:59 Uhr. Am letzten Sonntag im Oktober hat der Tag 25 Stunden, weil die Stunde von 2 bis 3 Uhr doppelt vorkommt; im März fehlt sie, und der Tag hat nur 23 Stunden.' },
      { q: 'Welche Stunde ist abends meistens am teuersten?', a: 'Häufig die zwischen 18 und 20 Uhr: dann kochen viele Haushalte, die Beleuchtung geht an und die Solarleistung ist schon weg. Kraftwerke mit höheren Kosten setzen dann den Preis. An windreichen Abenden kann die Spitze ausbleiben. Welche Stunde es heute ist, steht in der Tabelle unter dem Rechner und in der Zeile „Teuerste Stunde“.' },
    ],
    body: (h) => {
      const { de, bDe } = D(h);
      const rows = bDe.map((b) => [`${b.von} bis ${b.bis}`, h.spot(b.m, 2), h.ct(endDe(b.m), 1)]);
      return `<h2>Der Tag in Drei-Stunden-Blöcken</h2>
${h.table(['Zeitraum', 'Börsenpreis', 'Endpreis ohne Aufschlag'], rows, `${h.date(de.f.d)}, Deutschland und Luxemburg, Endpreis mit Bundesmittel des Netzentgelts und Gemeinde bis 100.000 Einwohner`, ['l', 'r', 'r'])}
<p>Die Börsenwerte kommen von ${h.src('smard')} unter der Lizenz CC BY 4.0. Der Endpreis enthält die Stromsteuer nach ${h.src('stromstg', '§ 3 StromStG')}, die Umlagen 2026, die Konzessionsabgabe nach ${h.src('kav', '§ 2 KAV')} und die Umsatzsteuer; der Aufschlag Ihres Anbieters fehlt, solange Sie ihn nicht oben eintragen.</p>
<h2>Viertelstunde oder Stunde</h2>
<p>Die Kurve hat 96 Balken, die Tabelle im Rechner 24 Zeilen. Ob Ihr Anbieter je Viertelstunde oder je Stunde abrechnet, steht im Vertrag; bei Stundenabrechnung zahlen Sie das Mittel der vier Viertelstunden. Für ein Gerät, das 90 Minuten läuft, ist die Viertelstunde genauer: ${h.a('fenster', 'günstigste Stunde')} sucht deshalb in Viertelstunden.</p>
<h2>Morgen und die letzten Wochen</h2>
<p>Die Stunden des nächsten Tages stehen ab dem frühen Nachmittag auf ${h.a('morgen', 'Strompreis morgen')}. Wie sich die Tagesmittel über Wochen und Monate bewegen, zeigt ${h.a('verlauf', 'Börsenstrompreis')}; woraus der feste Teil des Preises besteht, ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}.</p>`;
    },
  },
  en: {
    slug: 'hourly-electricity-prices',
    nav: 'Hourly electricity prices',
    card: 'Every hour of the day with its four quarter hours, exchange and all-in.',
    title: 'Hourly electricity prices: today hour by hour, all-in',
    description: 'Hourly electricity prices for today: the exchange price of every hour and its four quarter hours, next to the all-in price with grid fee, taxes and VAT.',
    h1: 'Hourly electricity prices: today, one hour at a time',
    intro: 'The table under the curve lists every hour of the day, the exchange price on the left and the price with your taxes and fees on the right.',
    resume: (h) => {
      const { de, nl, sprungDe } = D(h);
      const f = de.f;
      return `Hourly electricity prices have really been quarter-hourly prices since 1 October 2025: the day-ahead auction sets 96 values for each day, and an “hour” is the average of its four quarter hours. On ${h.date(f.d)} the exchange price in the German and Luxembourg zone averages ${h.spot(f.mittel)}. The cheapest hour starts at ${f.billigH} with ${h.spot(f.billigWert)} and the dearest at ${f.teuerH} with ${h.spot(f.teuerWert)}; within a single hour the price moved by up to ${h.spot(sprungDe)} from one quarter hour to the next, which is why the curve shows each quarter hour. In the Dutch zone the cheapest hour starts at ${nl.f.billigH} and the dearest at ${nl.f.teuerH}. Your bill adds fixed amounts per kWh: in Germany the grid fee, electricity tax, levies and concession fee plus ${h.num(h.P.de.ust * 100)}% VAT, so before any supplier markup the cheapest German hour costs about ${h.ct(endDe(f.billigWert))} and the dearest ${h.ct(endDe(f.teuerWert))}; in the Netherlands energy tax and VAT give about ${h.ct(endNl(nl.f.billigWert))} and ${h.ct(endNl(nl.f.teuerWert))}.`;
    },
    faqs: () => [
      { q: 'Why does each hour have four different prices?', a: 'Because the European day-ahead auction has traded quarter hours since 1 October 2025; before that there was one price per hour. Quarter hours capture the steep morning ramp and the evening fade of solar output more precisely. The hour in the table is the average of its four quarter hours; dynamic tariffs bill either per quarter hour or per hour, depending on the contract.' },
      { q: 'Which time zone do the hours use?', a: 'Central European time, the same in Germany, the Netherlands, Belgium, Austria and Poland: CET in winter and CEST in summer. The hour “14:00” covers the quarter hours from 14:00 to 14:59. On the last Sunday in October the day has 25 hours because 2 to 3 am happens twice; in March that hour is missing and the day has 23.' },
      { q: 'Which evening hour is usually the most expensive?', a: 'Often the one between 6 and 8 pm, when many households cook, lights go on and solar output has already faded, so plants with higher running costs set the price. On windy evenings the peak can disappear. Today’s dearest hour is shown in the table under the calculator and in the “Most expensive hour” line of the result.' },
    ],
    body: (h) => {
      const { de, nl, bDe, bNl } = D(h);
      const rows = bDe.map((b, i) => [`${b.von} to ${b.bis}`, h.spot(b.m, 2), h.ct(endDe(b.m), 1), h.spot(bNl[i].m, 2), h.ct(endNl(bNl[i].m), 1)]);
      return `<h2>The day in three-hour blocks</h2>
${h.table(['Period', 'DE exchange', 'DE all-in', 'NL exchange', 'NL all-in'], rows, `${h.date(de.f.d)}${nl.f.d !== de.f.d ? ` (NL ${h.date(nl.f.d)})` : ''}; all-in without supplier markup, Germany with the average grid fee`, ['l', 'r', 'r', 'r', 'r'])}
<p>Exchange values come from ${h.src('smard')} under the CC BY 4.0 licence. The German all-in price includes electricity tax (${h.src('stromstg')}), the 2026 levies, the concession fee (${h.src('kav')}) and VAT; the Dutch one includes energy tax (${h.src('wbm')}) and VAT (${h.src('wetob')}). Your supplier’s markup is missing until you enter it above.</p>
<h2>Quarter hour or hour</h2>
<p>The curve has 96 bars and the table 24 rows. Whether your supplier bills by quarter hour or by hour is in your contract; with hourly billing you pay the average of the four quarter hours. For an appliance that runs for 90 minutes the quarter hour is more precise, which is why ${h.a('fenster', 'cheapest hour')} searches in quarter hours.</p>
<h2>Tomorrow and the past weeks</h2>
<p>The next day’s hours appear in the early afternoon on ${h.a('morgen', 'electricity price tomorrow')}. How daily averages move over weeks and months is on ${h.a('verlauf', 'day-ahead price history')}, and what the fixed part of a German price is made of on ${h.a('zusammensetzung', 'German electricity price breakdown')}.</p>`;
    },
  },
  nl: {
    slug: 'stroomprijs-per-uur',
    nav: 'Stroomprijs per uur',
    card: 'Elk uur van de dag met zijn vier kwartieren, beursprijs en eindprijs.',
    title: 'Stroomprijs per uur: vandaag uur voor uur met belasting',
    description: 'Stroomprijs per uur voor vandaag: de beursprijs van elk uur en van zijn vier kwartieren, en daarnaast de eindprijs met energiebelasting, btw en opslag.',
    h1: 'Stroomprijs per uur: de dag van vandaag uur voor uur',
    intro: 'De tabel onder de grafiek toont elk uur van de dag, links de beursprijs, rechts de prijs met belastingen en jouw inkoopvergoeding.',
    resume: (h) => {
      const { nl, sprungNl } = D(h);
      const f = nl.f;
      return `De stroomprijs per uur is sinds 1 oktober 2025 eigenlijk een prijs per kwartier: de day-aheadveiling stelt voor elke dag 96 bedragen vast, en een „uur” is het gemiddelde van zijn vier kwartieren. Op ${h.date(f.d)} is de beursprijs in de Nederlandse biedzone gemiddeld ${h.spot(f.mittel)}. Het goedkoopste uur begint om ${f.billigH} uur met ${h.spot(f.billigWert)}, het duurste om ${f.teuerH} uur met ${h.spot(f.teuerWert)}. Binnen één uur sprong de prijs die dag van het ene kwartier naar het volgende met maximaal ${h.spot(sprungNl)}, daarom toont de grafiek elk kwartier apart. Op je rekening komen er vaste bedragen per kWh bij: de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} en de inkoopvergoeding van je leverancier, en over alles ${h.num(h.P.nl.btw * 100)} % btw. Zonder inkoopvergoeding kost het goedkoopste uur zo ongeveer ${h.ct(endNl(f.billigWert))} en het duurste ${h.ct(endNl(f.teuerWert))}. Dat verschil is wat een dynamisch contract per verschoven kilowattuur oplevert. Netbeheerkosten betaal je per dag en per aansluiting, los van het uur.`;
    },
    faqs: () => [
      { q: 'Waarom heeft elk uur vier verschillende prijzen?', a: 'Omdat de Europese day-aheadveiling sinds 1 oktober 2025 in kwartieren handelt; daarvoor was er één prijs per uur. Met kwartieren is de snelle stijging in de ochtend en het wegvallen van zonnestroom in de avond nauwkeuriger te volgen. Het uur in de tabel is het gemiddelde van zijn vier kwartieren; je leverancier rekent per uur of per kwartier af, afhankelijk van je contract.' },
      { q: 'In welke tijd staan de uren?', a: 'In Nederlandse tijd, dus in de winter CET en in de zomer CEST, gelijk aan België en Duitsland. Het uur „14:00” loopt van 14:00 tot 14:59. Op de laatste zondag van oktober heeft de dag 25 uur, omdat het uur van 2 tot 3 uur twee keer voorkomt; in maart ontbreekt dat uur en heeft de dag er 23.' },
      { q: 'Welk uur is ’s avonds meestal het duurst?', a: 'Vaak het uur tussen 18 en 20 uur: dan koken veel huishoudens, gaan de lampen aan en is de zonnestroom al weg, zodat duurdere centrales de prijs bepalen. Op winderige avonden kan die piek uitblijven. Welk uur het vandaag is, staat in de tabel onder de rekenhulp en in de regel „Duurste uur” van de uitkomst.' },
    ],
    body: (h) => {
      const { nl, bNl } = D(h);
      const rows = bNl.map((b) => [`${b.von} tot ${b.bis}`, h.spot(b.m, 2), h.ct(endNl(b.m), 1)]);
      return `<h2>De dag in blokken van drie uur</h2>
${h.table(['Periode', 'Beursprijs', 'Eindprijs zonder inkoopvergoeding'], rows, `${h.date(nl.f.d)}, Nederland, met energiebelasting en btw`, ['l', 'r', 'r'])}
<p>De beurswaarden komen van ${h.src('smard')} onder licentie CC BY 4.0. De eindprijs bevat de energiebelasting uit de ${h.src('wbm')} en de btw uit de ${h.src('wetob')}; de inkoopvergoeding van je leverancier ontbreekt zolang je die niet bovenaan invult.</p>
<h2>Kwartier of uur</h2>
<p>De grafiek heeft 96 staven, de tabel in de rekenhulp 24 regels. Of je leverancier per kwartier of per uur afrekent, staat in je contract; bij afrekening per uur betaal je het gemiddelde van de vier kwartieren. Voor een apparaat dat anderhalf uur draait, is het kwartier preciezer: ${h.a('fenster', 'goedkoopste uur')} zoekt daarom per kwartier.</p>
<h2>Morgen en de afgelopen weken</h2>
<p>De uren van morgen verschijnen begin van de middag op ${h.a('morgen', 'stroomprijs morgen')}, het lopende kwartier op ${h.a('jetzt', 'stroomprijs nu')}. Hoe de daggemiddelden over weken en maanden bewegen, laat ${h.a('verlauf', 'day-aheadprijzen')} zien.</p>`;
    },
  },
});
