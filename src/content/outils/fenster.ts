import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster as fenster30, fensterTag, eDe, eNl, endDe, endNl } from '../../lib/fakten';

/** Günstigste Stunde : Startzeit eines Geräts mit fester Laufzeit. Gerätewerte = Beispielannahmen, als solche beschriftet. */
const GERAETE = [
  { k: 'wasch', min: 120, kwh: 1.0, de: 'Waschmaschine, 40 °C', en: 'Washing machine, 40 °C', nl: 'Wasmachine, 40 °C' },
  { k: 'spuel', min: 180, kwh: 1.0, de: 'Geschirrspüler, Eco', en: 'Dishwasher, eco', nl: 'Vaatwasser, eco' },
  { k: 'trock', min: 120, kwh: 2.0, de: 'Wärmepumpentrockner', en: 'Heat pump dryer', nl: 'Warmtepompdroger' },
];
function D(_h: Helpers) {
  const de = fenster30('DE-LU', 30), nl = fenster30('NL', 30);
  const gDe = GERAETE.map((g) => ({ ...g, f: fensterTag('DE-LU', g.min, g.kwh, eDe(0)) }));
  const gNl = GERAETE.map((g) => ({ ...g, f: fensterTag('NL', g.min, g.kwh, eNl(0)) }));
  const bloecke = (s: number[]) => Array.from({ length: 8 }, (_, i) => ({ von: i * 3, m: (s[i * 3] + s[i * 3 + 1] + s[i * 3 + 2]) / 3 }));
  return { de, nl, gDe, gNl, bDe: bloecke(de.stunde), bNl: bloecke(nl.stunde) };
}
const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

export default defineGuide({
  id: 'fenster',
  group: 'nutzen',
  order: 10,
  tool: 'fenster',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT'], en: ['NL', 'AT', 'BE'], nl: ['BE', 'DE-LU'] },
  toolProps: { dauerH: 2, kwh: 1 },
  related: ['laden', 'waermepumpe', 'morgen', 'vergleich', 'negativ'],
  sources: ['smard', 'smardLizenz', 'stromstg', 'wbm', 'monitoring'],
  de: {
    slug: 'guenstigste-stunde',
    nav: 'Günstigste Stunde',
    card: 'Bester Startzeitpunkt für Waschmaschine, Spüler oder Trockner heute und morgen.',
    title: 'Günstigste Stunde für Strom heute und morgen schnell finden',
    description: 'Günstigste Stunde für Strom heute und morgen: Laufzeit und Verbrauch eines Geräts eintragen, Start mit dem niedrigsten Endpreis und die Ersparnis sehen.',
    h1: 'Günstigste Stunde: wann sich Waschmaschine und Co. lohnen',
    intro: 'Tragen Sie Laufzeit und Verbrauch eines Durchgangs ein. Der Rechner sucht in den veröffentlichten Viertelstunden den günstigsten Start ab jetzt.',
    resume: (h) => {
      const { de, gDe } = D(h);
      const w = gDe[0].f;
      return `Die günstigste Stunde für Strom ist bei einem dynamischen Tarif die Zeit, in der der Börsenpreis am niedrigsten ist, denn alle anderen Bestandteile kosten je Kilowattstunde immer gleich viel. Für ein Gerät mit fester Laufzeit zählt nicht die einzelne Viertelstunde, sondern das Fenster: eine Waschmaschine, die zwei Stunden läuft, braucht acht günstige Viertelstunden am Stück. Über die letzten ${h.num(de.n)} Tage war in Deutschland im Mittel die Stunde ab ${hh(de.billigsteStunde)} Uhr die günstigste und die ab ${hh(de.teuersteStunde)} Uhr die teuerste. Am ${h.date(w.d)} liegt das günstigste Zwei-Stunden-Fenster zwischen ${w.billig.ab} und ${w.billig.bis} Uhr mit einem Endpreis von ${h.ct(w.billig.preis)} ohne Anbieteraufschlag, das teuerste zwischen ${w.teuer.ab} und ${w.teuer.bis} Uhr mit ${h.ct(w.teuer.preis)}. Für einen Waschgang mit angenommen 1 kWh ist das ein Unterschied von ${h.eur(w.teuer.kosten - w.billig.kosten, 2)}: wenig für ein Gerät, viel über ein Jahr mit großen Verbrauchern wie Auto oder Wärmepumpe. Mit einem Festpreis spart das Verschieben nichts, entlastet aber das Netz.`;
    },
    faqs: () => [
      { q: 'Wie viel Strom braucht ein Waschgang?', a: 'Das hängt von Programm, Temperatur und Gerät ab. Ein Waschgang bei 40 °C liegt bei vielen modernen Maschinen um 1 kWh, ein Eco-Programm darunter, ein 60-°C-Programm deutlich darüber. Am genauesten messen Sie mit einem Zwischenstecker mit Energiezähler, oder Sie lesen den Wert für das Eco-Programm auf dem EU-Energielabel. Unsere Gerätewerte sind Beispiele.' },
      { q: 'Lohnt sich die Startzeitvorwahl der Waschmaschine?', a: 'Mit einem dynamischen Tarif ja, weil Sie den Start in das günstigste Fenster legen können, auch nachts oder mittags, wenn Sie nicht zu Hause sind. Viele Geräte haben eine Endzeit- statt einer Startzeitvorwahl; dann stellen Sie das Ende des Fensters ein, das der Rechner unter „fertig“ nennt. Mit Festpreis bringt die Vorwahl keine Ersparnis.' },
      { q: 'Warum ist die günstigste Stunde jeden Tag anders?', a: 'Weil Wind, Sonne und Nachfrage jeden Tag anders sind. An sonnigen Tagen fällt der Preis mittags, an windigen Tagen kann die Nacht am günstigsten sein, an trüben, windstillen Wintertagen liegt das Minimum oft in den frühen Morgenstunden. Deshalb rechnet der Rechner mit den veröffentlichten Preisen von heute und morgen statt mit einer festen Uhrzeit.' },
    ],
    body: (h) => {
      const { gDe, bDe } = D(h);
      const r1 = gDe.map((g) => [g.de, `${h.num(g.min / 60, 1)} h, ${h.num(g.kwh, 1)} kWh`, `${g.f.billig.ab} Uhr`, h.eur(g.f.billig.kosten, 2), h.eur(g.f.teuer.kosten, 2)]);
      const r2 = bDe.map((b) => [`${hh(b.von)} bis ${hh(b.von + 3)}`, h.spot(b.m, 2), h.ct(endDe(b.m), 1)]);
      return `<h2>Drei Geräte am ${h.date(gDe[0].f.d)}</h2>
${h.table(['Gerät (Beispielwerte)', 'Laufzeit, Verbrauch', 'Günstigster Start', 'Kosten günstig', 'Kosten teuer'], r1, 'Endpreis mit Bundesmittel des Netzentgelts, ohne Anbieteraufschlag; Laufzeiten und Verbräuche sind Annahmen', ['l', 'l', 'r', 'r', 'r'])}
<h2>Das Muster der letzten 30 Tage</h2>
${h.table(['Uhrzeit', 'Börsenpreis im Mittel', 'Endpreis ohne Aufschlag'], r2, 'Deutschland und Luxemburg, Mittel je Drei-Stunden-Block, Quelle SMARD', ['l', 'r', 'r'])}
<p>Die Börsenwerte kommen von ${h.src('smard')}. Der Endpreis enthält Netzentgelt (Mittel aus dem ${h.src('monitoring')}), ${h.src('stromstg', 'Stromsteuer')}, Umlagen, Konzessionsabgabe und Umsatzsteuer. Das Muster ist ein Durchschnitt; der einzelne Tag kann stark davon abweichen.</p>
<h2>Große Verbraucher</h2>
<p>Bei Geräten mit 1 bis 2 kWh geht es um Cent. Bei einem Elektroauto mit 30 kWh oder einer Wärmepumpe, die mehrere Stunden läuft, wird aus derselben Preisspanne ein spürbarer Betrag: dafür gibt es ${h.a('laden', 'E-Auto laden')} und ${h.a('waermepumpe', 'Wärmepumpe und Strompreis')}. Die Preise für morgen stehen ab dem frühen Nachmittag auf ${h.a('morgen', 'Strompreis morgen')}.</p>`;
    },
  },
  en: {
    slug: 'cheapest-hour-electricity',
    nav: 'Cheapest hour',
    card: 'The best start time for a washing machine, dishwasher or dryer, today and tomorrow.',
    title: 'Cheapest hour for electricity: today and tomorrow compared',
    description: 'Cheapest hour for electricity today and tomorrow: enter an appliance’s run time and energy use, see the start with the lowest all-in price and the saving.',
    h1: 'Cheapest hour: when to run the washing machine and the rest',
    intro: 'Enter the run time and energy use of one cycle. The calculator searches the published quarter hours for the cheapest start from now on.',
    resume: (h) => {
      const { de, nl, gNl } = D(h);
      const w = gNl[0].f;
      return `On a dynamic tariff the cheapest hour for electricity is when the exchange price is lowest, because every other part of the price costs the same per kilowatt-hour at any time. For an appliance with a fixed run time it is the window that counts, not the single quarter hour: a washing machine that runs for two hours needs eight cheap quarter hours in a row. Over the last ${h.num(de.n)} days the cheapest hour on average started at ${hh(de.billigsteStunde)} in Germany and at ${hh(nl.billigsteStunde)} in the Netherlands, and the dearest at ${hh(de.teuersteStunde)} and ${hh(nl.teuersteStunde)}. On ${h.date(w.d)} the cheapest two-hour window in the Dutch zone runs from ${w.billig.ab} to ${w.billig.bis}, at ${h.ct(w.billig.preis)} all-in before any purchase fee, and the dearest from ${w.teuer.ab} to ${w.teuer.bis} at ${h.ct(w.teuer.preis)}. For a wash assumed at 1 kWh that is a difference of ${h.eur(w.teuer.kosten - w.billig.kosten, 2)}: small for one appliance, but the same spread matters a great deal for an electric car or a heat pump. On a fixed price, shifting saves nothing, though it eases the load on the grid.`;
    },
    faqs: () => [
      { q: 'How much power does one wash cycle use?', a: 'It depends on the programme, temperature and machine. A 40 °C wash on many modern machines is around 1 kWh, an eco programme less and a 60 °C wash noticeably more. The most accurate way is a plug-in energy meter, or the eco-programme figure on the EU energy label. The appliance figures on this page are examples, not measurements.' },
      { q: 'Is a delay timer on the washing machine worth using?', a: 'On a dynamic tariff, yes, because you can put the start into the cheapest window, even at night or at midday while you are out. Many machines offer an end-time rather than a start-time delay; then set the end of the window that the calculator shows under “finished”. On a fixed price the timer saves nothing.' },
      { q: 'Why does the cheapest hour change from day to day?', a: 'Because wind, sun and demand change every day. On sunny days prices fall at midday, on windy days the night can be cheapest, and on grey, calm winter days the low often comes in the early morning. That is why the calculator works from the published prices for today and tomorrow rather than from a fixed time of day.' },
    ],
    body: (h) => {
      const { gDe, gNl, bDe, bNl } = D(h);
      const r1 = gDe.map((g, i) => [g.en, `${h.num(g.min / 60, 1)} h, ${h.num(g.kwh, 1)} kWh`, g.f.billig.ab, h.eur(g.f.billig.kosten, 2), gNl[i].f.billig.ab, h.eur(gNl[i].f.billig.kosten, 2)]);
      const r2 = bDe.map((b, i) => [`${hh(b.von)} to ${hh(b.von + 3)}`, h.ct(endDe(b.m), 1), h.ct(endNl(bNl[i].m), 1)]);
      return `<h2>Three appliances on ${h.date(gDe[0].f.d)}</h2>
${h.table(['Appliance (example values)', 'Run time, energy', 'DE best start', 'DE cost', 'NL best start', 'NL cost'], r1, 'All-in price without supplier markup or purchase fee; run times and energy use are assumptions', ['l', 'l', 'r', 'r', 'r', 'r'])}
<h2>The pattern of the last 30 days</h2>
${h.table(['Time of day', 'Germany all-in', 'Netherlands all-in'], r2, 'Average per three-hour block, before markup, source SMARD', ['l', 'r', 'r'])}
<p>Exchange values come from ${h.src('smard')}. The German all-in price includes the average grid fee from the ${h.src('monitoring')}, ${h.src('stromstg', 'electricity tax')}, levies, concession fee and VAT; the Dutch one includes energy tax from the ${h.src('wbm')} and VAT. The pattern is an average, and a single day can look very different.</p>
<h2>Large loads</h2>
<p>For appliances using 1 to 2 kWh the stakes are cents. For an electric car taking 30 kWh, or a heat pump running for hours, the same price spread becomes a real amount: see ${h.a('laden', 'EV charging cost')} and ${h.a('waermepumpe', 'heat pump electricity price')}. Tomorrow’s prices appear in the early afternoon on ${h.a('morgen', 'electricity price tomorrow')}.</p>`;
    },
  },
  nl: {
    slug: 'goedkoopste-uur',
    nav: 'Goedkoopste uur',
    card: 'Het beste starttijdstip voor wasmachine, vaatwasser of droger, vandaag en morgen.',
    title: 'Goedkoopste uur voor stroom vandaag en morgen vinden',
    description: 'Goedkoopste uur voor stroom vandaag en morgen: vul looptijd en verbruik van een apparaat in en zie de start met de laagste eindprijs en wat het scheelt.',
    h1: 'Goedkoopste uur: wanneer de wasmachine het minst kost',
    intro: 'Vul de looptijd en het verbruik van één keer draaien in. De rekenhulp zoekt in de gepubliceerde kwartieren de goedkoopste start vanaf nu.',
    resume: (h) => {
      const { nl, gNl } = D(h);
      const w = gNl[0].f;
      return `Het goedkoopste uur voor stroom is bij een dynamisch contract het moment waarop de beursprijs het laagst is, want energiebelasting en inkoopvergoeding kosten per kWh altijd hetzelfde. Voor een apparaat met een vaste looptijd telt niet het losse kwartier maar het venster: een wasmachine die twee uur draait, heeft acht goedkope kwartieren achter elkaar nodig. Over de laatste ${h.num(nl.n)} dagen was in Nederland gemiddeld het uur vanaf ${hh(nl.billigsteStunde)} het goedkoopst en het uur vanaf ${hh(nl.teuersteStunde)} het duurst. Op ${h.date(w.d)} ligt het goedkoopste venster van twee uur tussen ${w.billig.ab} en ${w.billig.bis} uur, met een eindprijs van ${h.ct(w.billig.preis)} zonder inkoopvergoeding, het duurste tussen ${w.teuer.ab} en ${w.teuer.bis} uur met ${h.ct(w.teuer.preis)}. Voor een wasbeurt van naar aanname 1 kWh scheelt dat ${h.eur(w.teuer.kosten - w.billig.kosten, 2)}: weinig voor één apparaat, maar bij een elektrische auto of een warmtepomp wordt hetzelfde prijsverschil een flink bedrag. Met een vast of variabel contract levert verschuiven niets op, al ontlast het wel het net.`;
    },
    faqs: () => [
      { q: 'Hoeveel stroom verbruikt één wasbeurt?', a: 'Dat hangt af van programma, temperatuur en machine. Een was op 40 °C ligt bij veel moderne machines rond 1 kWh, een ecoprogramma lager en een was op 60 °C duidelijk hoger. Het nauwkeurigst meet je met een energiemeter in het stopcontact, of je leest de waarde voor het ecoprogramma op het Europese energielabel. Onze apparaatwaarden zijn voorbeelden.' },
      { q: 'Heeft de uitgestelde start van de wasmachine zin?', a: 'Met een dynamisch contract wel, want je kunt de start in het goedkoopste venster leggen, ook ’s nachts of overdag als je niet thuis bent. Veel machines hebben een eindtijd- in plaats van een starttijdinstelling; stel dan het einde van het venster in dat de rekenhulp bij „klaar” noemt. Met een vaste prijs levert het niets op.' },
      { q: 'Waarom verschilt het goedkoopste uur elke dag?', a: 'Omdat wind, zon en vraag elke dag anders zijn. Op zonnige dagen zakt de prijs rond het middaguur, op winderige dagen kan de nacht het goedkoopst zijn, en op grijze, windstille winterdagen ligt het laagste punt vaak vroeg in de ochtend. Daarom rekent de rekenhulp met de gepubliceerde prijzen van vandaag en morgen in plaats van met een vast tijdstip.' },
    ],
    body: (h) => {
      const { gNl, bNl } = D(h);
      const r1 = gNl.map((g) => [g.nl, `${h.num(g.min / 60, 1)} u, ${h.num(g.kwh, 1)} kWh`, `${g.f.billig.ab} uur`, h.eur(g.f.billig.kosten, 2), h.eur(g.f.teuer.kosten, 2)]);
      const r2 = bNl.map((b) => [`${hh(b.von)} tot ${hh(b.von + 3)}`, h.spot(b.m, 2), h.ct(endNl(b.m), 1)]);
      return `<h2>Drie apparaten op ${h.date(gNl[0].f.d)}</h2>
${h.table(['Apparaat (voorbeeldwaarden)', 'Looptijd, verbruik', 'Goedkoopste start', 'Kosten goedkoop', 'Kosten duur'], r1, 'Eindprijs met energiebelasting en btw, zonder inkoopvergoeding; looptijden en verbruik zijn aannames', ['l', 'l', 'r', 'r', 'r'])}
<h2>Het patroon van de laatste 30 dagen</h2>
${h.table(['Tijd', 'Gemiddelde beursprijs', 'Eindprijs zonder inkoopvergoeding'], r2, 'Nederland, gemiddelde per blok van drie uur, bron SMARD', ['l', 'r', 'r'])}
<p>De beurswaarden komen van ${h.src('smard')}, de energiebelasting uit de ${h.src('wbm')}. Het patroon is een gemiddelde; een losse dag kan er heel anders uitzien.</p>
<h2>Grote verbruikers</h2>
<p>Bij apparaten van 1 tot 2 kWh gaat het om centen. Bij een elektrische auto van 30 kWh wordt hetzelfde prijsverschil een merkbaar bedrag: zie ${h.a('laden', 'auto laden')}. De prijzen van morgen staan vanaf begin van de middag op ${h.a('morgen', 'stroomprijs morgen')}, en of een dynamisch contract over een maand goedkoper is, rekent ${h.a('vergleich', 'dynamisch energiecontract')} uit.</p>`;
    },
  },
});
