import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fensterTag, eDe, eNl, recharge } from '../../lib/fakten';

/** E-Auto laden : 60-kWh-Akku von 20 auf 80 %, Verlust 10 % (Annahme), Wallbox 11 kW gegen Steckdose 2,3 kW. */
function D(_h: Helpers) {
  const wb = recharge({ batterieKwh: 60, dePct: 20, aPct: 80, puissanceKw: 11, pertesPct: 10 });
  const sd = recharge({ batterieKwh: 60, dePct: 20, aPct: 80, puissanceKw: 2.3, pertesPct: 10 });
  const de = { wb: fensterTag('DE-LU', wb.dureeMin, wb.kwhReseau, eDe(0)), sd: fensterTag('DE-LU', sd.dureeMin, sd.kwhReseau, eDe(0)) };
  const nl = { wb: fensterTag('NL', wb.dureeMin, wb.kwhReseau, eNl(0)), sd: fensterTag('NL', sd.dureeMin, sd.kwhReseau, eNl(0)) };
  return { wb, sd, de, nl };
}

export default defineGuide({
  id: 'laden',
  group: 'nutzen',
  order: 20,
  tool: 'laden',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT'], en: ['NL', 'AT', 'BE'], nl: ['BE', 'DE-LU'] },
  toolProps: { batterie: 60, kw: 11, von: 20, bis: 80 },
  related: ['fenster', 'vergleich', 'morgen', 'negativ'],
  sources: ['smard', 'smardLizenz', 'enwg41a', 'stromstg', 'wbm'],
  de: {
    slug: 'e-auto-laden',
    nav: 'E-Auto laden',
    card: 'Was eine Ladung zu Hause kostet und wann sie am günstigsten ist.',
    title: 'E-Auto laden zu Hause: Kosten je Ladung und beste Uhrzeit',
    description: 'E-Auto laden zu Hause mit dynamischem Tarif: Akku, Ladestand und Wallbox eintragen, günstigstes Ladefenster heute oder morgen und die Kosten mit Abgaben sehen.',
    h1: 'E-Auto laden: was die Ladung zu Hause heute kostet',
    intro: 'Tragen Sie Akku, Ladestand und Ladeleistung ein. Der Rechner sucht das günstigste zusammenhängende Ladefenster in den veröffentlichten Preisen.',
    resume: (h) => {
      const { wb, sd, de } = D(h);
      return `Ein Elektroauto zu Hause zu laden kostet mit einem dynamischen Tarif so viel wie die Kilowattstunden aus dem Netz mal dem Endpreis der Viertelstunden, in denen geladen wird. Als Beispiel: ein Akku mit 60 kWh nutzbarer Kapazität, geladen von 20 auf 80 %, nimmt 36 kWh auf; mit angenommenen 10 % Ladeverlust kommen ${h.num(wb.kwhReseau, 1)} kWh aus dem Netz. An einer Wallbox mit 11 kW dauert das rund ${h.num(wb.dureeMin / 60, 1)} Stunden, an einer Haushaltssteckdose mit 2,3 kW etwa ${h.num(sd.dureeMin / 60, 1)} Stunden. Am ${h.date(de.wb.d)} kostet die Ladung an der Wallbox im günstigsten Fenster ab ${de.wb.billig.ab} Uhr ${h.eur(de.wb.billig.kosten, 2)}, im teuersten ab ${de.wb.teuer.ab} Uhr ${h.eur(de.wb.teuer.kosten, 2)}, jeweils mit Bundesmittel des Netzentgelts, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer, aber ohne Aufschlag des Anbieters. An der Steckdose verteilt sich die Ladung über so viele Stunden, dass sich teure und billige Zeiten mischen: ${h.eur(de.sd.billig.kosten, 2)} im besten Fenster. Je schneller geladen wird, desto genauer trifft die Ladung die günstigsten Viertelstunden.`;
    },
    faqs: () => [
      { q: 'Wie hoch sind die Ladeverluste beim E-Auto?', a: 'Ein Teil der Energie geht im Ladegerät des Autos, in Kabeln und im Akku als Wärme verloren. Wie viel, hängt von Fahrzeug, Ladeleistung und Temperatur ab; bei sehr niedriger Leistung an der Steckdose ist der Anteil meist höher als an der Wallbox. Der Rechner nimmt 10 % an; den Wert können Sie unter „Ladeverluste“ an Ihr Auto anpassen.' },
      { q: 'Kann ich das Laden automatisch in die günstigen Stunden legen?', a: 'Viele Wallboxen und Fahrzeuge lassen sich so einstellen, dass sie zu einer bestimmten Uhrzeit beginnen oder bis zu einer Abfahrtszeit fertig sind; manche lesen dynamische Preise selbst ein. Ohne solche Funktion stellen Sie den Start von Hand auf das Fenster, das der Rechner nennt. Ab dem frühen Nachmittag sind auch die Preise der kommenden Nacht bekannt.' },
      { q: 'Lohnt sich eine Wallbox gegenüber der Steckdose?', a: 'Für die Wahl der günstigen Stunden ja: mit 11 kW passt eine Ladung von 20 auf 80 % in wenige Stunden und damit in das billigste Fenster, mit 2,3 kW braucht sie fast einen ganzen Tag. Dazu kommen Sicherheit und geringere Verluste. Ob sich die Anschaffung rechnet, hängt von Ihrer Fahrleistung und den Installationskosten ab, die wir hier nicht kennen.' },
    ],
    body: (h) => {
      const { wb, sd, de } = D(h);
      const rows = [
        ['Wallbox 11 kW', `${h.num(wb.dureeMin / 60, 2)} h`, `${de.wb.billig.ab} bis ${de.wb.billig.bis}`, h.eur(de.wb.billig.kosten, 2), h.eur(de.wb.teuer.kosten, 2)],
        ['Steckdose 2,3 kW', `${h.num(sd.dureeMin / 60, 2)} h`, `${de.sd.billig.ab} bis ${de.sd.billig.bis}`, h.eur(de.sd.billig.kosten, 2), h.eur(de.sd.teuer.kosten, 2)],
      ];
      return `<h2>Eine Ladung am ${h.date(de.wb.d)}</h2>
${h.table(['Ladepunkt', 'Dauer', 'Günstigstes Fenster', 'Kosten günstig', 'Kosten teuer'], rows, `60 kWh Akku, 20 auf 80 %, ${h.num(wb.kwhReseau, 1)} kWh aus dem Netz (10 % Verlust angenommen), Endpreis ohne Anbieteraufschlag`, ['l', 'r', 'l', 'r', 'r'])}
<p>Die Preise je Viertelstunde stammen von ${h.src('smard')}. Ein Fenster, das über Mitternacht reicht, kann der Rechner nur suchen, wenn der Folgetag schon veröffentlicht ist; vorher bleibt die Suche auf den Rest des Tages beschränkt.</p>
<h2>Was in den Kosten steckt</h2>
<p>Der Endpreis enthält das Netzentgelt (Bundesmittel), die ${h.src('stromstg', 'Stromsteuer')}, die Umlagen, die Konzessionsabgabe und die Umsatzsteuer; der Aufschlag Ihres Anbieters kommt hinzu, wenn Sie ihn unter „Ladeverluste, Land, Tarif“ eintragen. Den dynamischen Tarif muss jeder Lieferant Kunden mit intelligentem Messsystem anbieten (${h.src('enwg41a', '§ 41a EnWG')}).</p>
<h2>Über den Monat</h2>
<p>Wer jede Nacht oder jeden Mittag lädt, sieht in ${h.a('vergleich', 'dynamischer Stromtarif')} mit dem Nachtprofil, was das über 30 Tage gegenüber einem Festpreis ausmacht. Die besonders günstigen Viertelstunden mit Börsenpreisen unter null zeigt ${h.a('negativ', 'negative Strompreise')}.</p>`;
    },
  },
  en: {
    slug: 'ev-charging-cost',
    nav: 'EV charging cost',
    card: 'What a home charge costs and when it is cheapest.',
    title: 'EV charging cost at home: price per charge and best time',
    description: 'EV charging cost at home on a dynamic tariff: enter battery, charge level and charger power to see the cheapest window today or tomorrow and the all-in cost.',
    h1: 'EV charging cost: what a home charge costs today',
    intro: 'Enter battery size, charge level and charging power. The calculator finds the cheapest continuous charging window in the published prices.',
    resume: (h) => {
      const { wb, sd, de, nl } = D(h);
      return `Charging an electric car at home on a dynamic tariff costs the kilowatt-hours drawn from the grid times the all-in price of the quarter hours in which you charge. As an example, a battery with 60 kWh usable capacity charged from 20 to 80% takes in 36 kWh; with an assumed 10% charging loss, ${h.num(wb.kwhReseau, 1)} kWh come from the grid. On an 11 kW wallbox that takes about ${h.num(wb.dureeMin / 60, 1)} hours, on a 2.3 kW household socket about ${h.num(sd.dureeMin / 60, 1)} hours. On ${h.date(de.wb.d)}, a wallbox charge in Germany costs ${h.eur(de.wb.billig.kosten, 2)} in the cheapest window starting at ${de.wb.billig.ab} and ${h.eur(de.wb.teuer.kosten, 2)} in the dearest starting at ${de.wb.teuer.ab}, with the average grid fee, electricity tax, levies, concession fee and VAT but no supplier markup. In the Netherlands, with energy tax and VAT, the same charge costs ${h.eur(nl.wb.billig.kosten, 2)} at best and ${h.eur(nl.wb.teuer.kosten, 2)} at worst. On a socket the charge stretches over so many hours that cheap and dear times mix. The faster you charge, the more precisely the charge hits the cheapest quarter hours.`;
    },
    faqs: () => [
      { q: 'How large are EV charging losses?', a: 'Some energy is lost as heat in the car’s on-board charger, the cables and the battery. How much depends on the car, the charging power and the temperature; at very low power from a household socket the share is usually higher than on a wallbox. The calculator assumes 10%, and you can adjust that under “Charging losses” to match your car.' },
      { q: 'Can charging start automatically in the cheap hours?', a: 'Many wallboxes and cars can be set to start at a given time or to finish by a departure time, and some read dynamic prices themselves. Without such a feature, set the start by hand to the window the calculator shows. From early afternoon the prices for the coming night are known as well, so an overnight charge can be planned the same day.' },
      { q: 'Is a wallbox worth it compared with a socket?', a: 'For catching the cheap hours, yes: at 11 kW a charge from 20 to 80% fits into a few hours and so into the cheapest window, while at 2.3 kW it takes nearly a whole day. Safety and lower losses come on top. Whether the purchase pays off depends on your mileage and installation costs, which we cannot know here.' },
    ],
    body: (h) => {
      const { wb, sd, de, nl } = D(h);
      const rows = [
        ['Wallbox 11 kW', `${h.num(wb.dureeMin / 60, 2)} h`, de.wb.billig.ab, h.eur(de.wb.billig.kosten, 2), nl.wb.billig.ab, h.eur(nl.wb.billig.kosten, 2)],
        ['Socket 2.3 kW', `${h.num(sd.dureeMin / 60, 2)} h`, de.sd.billig.ab, h.eur(de.sd.billig.kosten, 2), nl.sd.billig.ab, h.eur(nl.sd.billig.kosten, 2)],
      ];
      return `<h2>One charge on ${h.date(de.wb.d)}</h2>
${h.table(['Charge point', 'Duration', 'DE best start', 'DE cost', 'NL best start', 'NL cost'], rows, `60 kWh battery, 20 to 80%, ${h.num(wb.kwhReseau, 1)} kWh from the grid (10% loss assumed), all-in before markup`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Quarter-hourly prices come from ${h.src('smard')}. A window that runs past midnight can only be found once the next day is published; before that, the search stays within the rest of today.</p>
<h2>What the cost includes</h2>
<p>The German all-in price includes the average grid fee, ${h.src('stromstg', 'electricity tax')}, levies, concession fee and VAT; the Dutch one includes energy tax from the ${h.src('wbm')} and VAT. Your supplier’s markup is added once you enter it under “Charging losses, country, tariff”. In Germany every supplier must offer a dynamic tariff to customers with a smart metering system (${h.src('enwg41a')}).</p>
<h2>Over a month</h2>
<p>If you charge every night or every midday, ${h.a('vergleich', 'dynamic electricity tariff')} with the night profile shows what that adds up to over 30 days against a fixed price. The particularly cheap quarter hours with exchange prices below zero are on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
  nl: {
    slug: 'auto-laden',
    nav: 'Auto laden',
    card: 'Wat een laadbeurt thuis kost en wanneer het het goedkoopst is.',
    title: 'Auto laden thuis: kosten per laadbeurt en het beste uur',
    description: 'Auto laden thuis met een dynamisch contract: vul accu, laadniveau en laadvermogen in en zie het goedkoopste venster vandaag of morgen en de kosten met btw.',
    h1: 'Auto laden: wat een laadbeurt thuis vandaag kost',
    intro: 'Vul accu, laadniveau en laadvermogen in. De rekenhulp zoekt het goedkoopste aaneengesloten laadvenster in de gepubliceerde prijzen.',
    resume: (h) => {
      const { wb, sd, nl } = D(h);
      return `Je elektrische auto thuis laden kost met een dynamisch contract de kilowatturen uit het net maal de eindprijs van de kwartieren waarin je laadt. Een voorbeeld: een accu met 60 kWh bruikbare capaciteit, geladen van 20 naar 80 %, neemt 36 kWh op; met een aangenomen laadverlies van 10 % komt er ${h.num(wb.kwhReseau, 1)} kWh uit het net. Aan een laadpaal van 11 kW duurt dat ongeveer ${h.num(wb.dureeMin / 60, 1)} uur, aan een gewoon stopcontact van 2,3 kW zo’n ${h.num(sd.dureeMin / 60, 1)} uur. Op ${h.date(nl.wb.d)} kost een laadbeurt aan de laadpaal in het goedkoopste venster vanaf ${nl.wb.billig.ab} uur ${h.eur(nl.wb.billig.kosten, 2)} en in het duurste vanaf ${nl.wb.teuer.ab} uur ${h.eur(nl.wb.teuer.kosten, 2)}, met energiebelasting en btw maar zonder inkoopvergoeding. Aan het stopcontact loopt het laden over zoveel uren dat dure en goedkope tijden door elkaar gaan: ${h.eur(nl.sd.billig.kosten, 2)} in het beste venster. Hoe sneller je laadt, hoe preciezer je de goedkoopste kwartieren raakt. Netbeheerkosten betaal je per aansluiting en tellen hier niet mee.`;
    },
    faqs: () => [
      { q: 'Hoe groot is het laadverlies van een elektrische auto?', a: 'Een deel van de energie gaat als warmte verloren in de lader van de auto, in de kabels en in de accu. Hoeveel, hangt af van auto, laadvermogen en temperatuur; bij laag vermogen aan het stopcontact is het aandeel meestal groter dan aan een laadpaal. De rekenhulp gaat uit van 10 %; pas het aan onder „Laadverlies” als je auto daar duidelijk van afwijkt.' },
      { q: 'Kan het laden automatisch in de goedkope uren vallen?', a: 'Veel laadpalen en auto’s kun je zo instellen dat ze op een bepaald tijdstip starten of klaar zijn bij je vertrektijd, en sommige lezen dynamische prijzen zelf in. Zonder zo’n functie zet je de start met de hand op het venster dat de rekenhulp toont. Vanaf begin van de middag zijn ook de prijzen van de komende nacht bekend.' },
      { q: 'Is een laadpaal de moeite waard tegenover het stopcontact?', a: 'Om de goedkope uren te raken wel: met 11 kW past een lading van 20 naar 80 % in een paar uur en dus in het goedkoopste venster, met 2,3 kW duurt het bijna een hele dag. Daar komen veiligheid en minder verlies bij. Of de aanschaf loont, hangt af van hoeveel je rijdt en van de installatiekosten, die we hier niet kennen.' },
    ],
    body: (h) => {
      const { wb, sd, nl } = D(h);
      const rows = [
        ['Laadpaal 11 kW', `${h.num(wb.dureeMin / 60, 2)} u`, `${nl.wb.billig.ab} tot ${nl.wb.billig.bis}`, h.eur(nl.wb.billig.kosten, 2), h.eur(nl.wb.teuer.kosten, 2)],
        ['Stopcontact 2,3 kW', `${h.num(sd.dureeMin / 60, 2)} u`, `${nl.sd.billig.ab} tot ${nl.sd.billig.bis}`, h.eur(nl.sd.billig.kosten, 2), h.eur(nl.sd.teuer.kosten, 2)],
      ];
      return `<h2>Eén laadbeurt op ${h.date(nl.wb.d)}</h2>
${h.table(['Laadpunt', 'Duur', 'Goedkoopste venster', 'Kosten goedkoop', 'Kosten duur'], rows, `Accu 60 kWh, 20 naar 80 %, ${h.num(wb.kwhReseau, 1)} kWh uit het net (10 % verlies aangenomen), met energiebelasting en btw`, ['l', 'r', 'l', 'r', 'r'])}
<p>De kwartierprijzen komen van ${h.src('smard')}, de energiebelasting uit de ${h.src('wbm')}. Een venster dat over middernacht loopt, kan de rekenhulp pas zoeken als de volgende dag gepubliceerd is; daarvoor blijft het zoeken beperkt tot de rest van vandaag.</p>
<h2>Over een maand</h2>
<p>Laad je elke nacht of elke middag, dan laat ${h.a('vergleich', 'dynamisch energiecontract')} met het nachtprofiel zien wat dat over 30 dagen scheelt tegenover een vaste prijs. De extra goedkope kwartieren met een beursprijs onder nul staan op ${h.a('negativ', 'negatieve stroomprijs')}. Wanneer andere apparaten het goedkoopst draaien, laat ${h.a('fenster', 'goedkoopste uur')} zien.</p>`;
    },
  },
});
