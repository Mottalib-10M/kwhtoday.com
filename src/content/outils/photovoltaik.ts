import { defineGuide, type Helpers } from '../../lib/guide-types';
import { pvDe, pvNl } from '../../lib/engine/haus';
import { minVergoeding } from '../../lib/engine/eigen';
import { preisDe30, festVorgabe, kaleNl } from '../../lib/tool-props';

/** Photovoltaik (DE) und zonnepanelen (NL) : Ertrag, Einspeisevergütung bzw. Saldering bis 2026, Amortisation. */
const KWP_PREISE = [1200, 1500, 1800];
function D(h: Helpers) {
  const p = preisDe30();
  const v = h.P.de.einspeiseverguetung_ct;
  const de = [5, 8, 10, 15].map((kwp) => ({ kwp, r: pvDe({ kwp, ertrag: 950, eigen: 0.3, preisCt: p.preis, art: 'teil', kosten: 0 }) }))
    .map((x) => ({ ...x, jahre: KWP_PREISE.map((e) => (x.kwp * e) / x.r.summe) }));
  const bsp = pvDe({ kwp: 8, ertrag: 950, eigen: 0.3, preisCt: p.preis, art: 'teil', kosten: 12000 });
  const prijs = festVorgabe('NL');
  const verg = minVergoeding(kaleNl());
  const mc = h.P.nl.milieucentraal;
  const verbruik = h.P.nl.verbruik_cbs2024.totaal.stroom;
  const nl = mc.zon.map((z) => {
    const kwp = (z.panelen * mc.wp_paneel) / 1000;
    return { ...z, kwp, r: pvNl({ kwp, ertrag: z.kwh / kwp, direct: 0.3, verbruik, prijsIncl: prijs, vergoeding: verg, terugleverkosten: 0, kosten: z.kosten }) };
  });
  return { p, v, de, bsp, prijs, verg, mc, nl, verbruik, n10: nl[nl.length - 1] };
}
const j = (h: Helpers, x: number) => (Number.isFinite(x) ? h.num(x, 1) : '–');

export default defineGuide({
  id: 'photovoltaik',
  group: 'nutzen',
  order: 62,
  tool: 'pv',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  related: ['einspeiseverguetung', 'saldering', 'terugleververgoeding', 'thuisbatterij', 'balkonkraftwerk'],
  sources: ['bnetzaEeg', 'eeg9', 'ustg', 'estg3', 'rijksSaldering', 'acmSalderen', 'acmModel', 'btwZon', 'mcZon', 'cbs', 'cbsVerbruik', 'smard', 'smardLizenz'],
  de: {
    slug: 'photovoltaik-rechner',
    nav: 'Photovoltaik-Rechner',
    card: 'Ertrag, Einspeisevergütung, Eigenverbrauch und Amortisation einer Dachanlage.',
    title: 'Photovoltaik Rechner 2026: Ertrag, Vergütung, Amortisation',
    description: 'Photovoltaik-Rechner 2026: Anlagengröße, Ertrag und Eigenverbrauch eintragen, Einspeisevergütung, Ersparnis und Amortisation in Jahren sehen. Mit EEG-Sätzen.',
    h1: 'Photovoltaik-Rechner: was eine Dachanlage bringt und wann sie sich rechnet',
    intro: 'Tragen Sie Leistung, Ertrag, Eigenverbrauch und Preis Ihrer Anlage ein. Der Rechner verbindet die Einspeisevergütung der Bundesnetzagentur mit dem aktuellen Strompreis.',
    resume: (h) => {
      const { p, v, bsp } = D(h);
      return `Eine Photovoltaikanlage auf dem eigenen Dach bringt Geld auf zwei Wegen: Selbst verbrauchter Solarstrom ersetzt Netzstrom zum vollen Endpreis, und der Überschuss wird nach dem EEG mit einem festen Satz je Kilowattstunde vergütet. Für Anlagen, die bis zum ${h.date(v.bis)} in Betrieb gehen, zahlt der Netzbetreiber bei Teileinspeisung ${h.ct(v.teil.bis10, 2)} für die ersten 10 kW, 20 Jahre lang. Weil dieser Satz weit unter dem Strompreis liegt, entscheidet der Eigenverbrauch über die Rendite. Eine Anlage mit 8 kWp, 950 kWh Ertrag je kWp und 30 % Eigenverbrauch (Annahmen) erzeugt ${h.num(bsp.erzeugt)} kWh im Jahr. Die eingespeisten ${h.num(bsp.eingespeist)} kWh bringen ${h.eur(bsp.verguetung)}, der selbst genutzte Strom spart beim Endpreis von ${h.ct(p.preis, 2)} weitere ${h.eur(bsp.ersparnis)}, zusammen ${h.eur(bsp.summe)} pro Jahr. Bei einem Preis von 12.000 Euro (Annahme, 1.500 Euro je kWp) hat sich die Anlage nach ${j(h, bsp.amortisation)} Jahren bezahlt gemacht. Der Strompreis folgt dem Börsenmittel vom ${h.date(p.von)} bis ${h.date(p.bis)} mit Netzentgelt, Steuern und Umlagen. Wartung, Versicherung und ein späterer Tausch des Wechselrichters verlängern die Rechnung.`;
    },
    faqs: () => [
      { q: 'Wie viel Strom erzeugt eine Photovoltaikanlage pro kWp?', a: 'Das hängt von Standort, Ausrichtung, Neigung und Verschattung ab. Der Rechner nimmt 950 kWh je kWp und Jahr als Annahme für ein Süddach ohne Schatten an; im Norden und auf Ost-West-Dächern ist es weniger, im Süden Deutschlands oft mehr. Nach dem ersten vollen Jahr zeigt die App des Wechselrichters den echten Wert, den Sie dann eintragen.' },
      { q: 'Wie erhöhe ich den Eigenverbrauch meiner Solaranlage?', a: 'Indem Sie Verbrauch in die sonnigen Stunden legen: Waschmaschine, Spülmaschine und Trockner mittags starten, das E-Auto tagsüber laden, die Wärmepumpe Warmwasser bereiten lassen, solange die Sonne scheint. Ein Batteriespeicher hebt den Eigenverbrauch weiter, kostet aber selbst Geld. Ohne solche Maßnahmen liegt der Anteil bei vielen Haushalten um ein Drittel, mit Speicher deutlich höher.' },
      { q: 'Muss ich auf den Solarstrom Steuern zahlen?', a: 'Für die meisten Hausanlagen nicht mehr. Kauf und Installation von Anlagen bis 30 kWp tragen nach § 12 Abs. 3 UStG null Prozent Umsatzsteuer, und nach § 3 Nr. 72 EStG sind Einnahmen aus Anlagen auf Gebäuden bis 30 kWp je Wohn- oder Gewerbeeinheit, insgesamt bis 100 kWp je Steuerpflichtigem, von der Einkommensteuer befreit. Größere Anlagen klären Sie mit dem Finanzamt.' },
    ],
    body: (h) => {
      const { p, de } = D(h);
      const rows = de.map((x) => [`${h.num(x.kwp)} kWp`, `${h.num(x.r.erzeugt)} kWh`, h.ct(x.r.satz, 2), h.eur(x.r.summe), ...x.jahre.map((y) => j(h, y))]);
      return `<h2>Amortisation nach Anlagengröße und Preis</h2>
${h.table(['Anlage', 'Erzeugung', 'Mischsatz', 'Ertrag pro Jahr', '1.200 €/kWp', '1.500 €/kWp', '1.800 €/kWp'], rows, `Jahre bis zur Amortisation. 950 kWh je kWp, 30 % Eigenverbrauch, Teileinspeisung; Preise je kWp sind Annahmen. Strompreis ${h.ct(p.preis, 2)}`, ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>Größere Anlagen sind je kWp meist günstiger, erhalten für den Teil über 10 kW aber einen niedrigeren Satz, und ihr Eigenverbrauchsanteil sinkt, weil der Haushalt nicht mitwächst. Die Spalten zeigen, wie stark der Preis je kWp die Amortisation bestimmt: Holen Sie mehrere Angebote ein und tragen Sie den Gesamtpreis inklusive Montage oben ein.</p>
<h2>Vergütung und Regeln</h2>
<p>Die Sätze stammen von der ${h.src('bnetzaEeg')} und gelten für Inbetriebnahmen bis Ende 2026; die genaue Staffel zeigt ${h.a('einspeiseverguetung', 'Einspeisevergütung 2026')}. Neue Anlagen zwischen 2 und 100 kW dürfen nach ${h.src('eeg9', '§ 9 EEG')} bis zum Einbau eines intelligenten Messsystems höchstens 60 Prozent ihrer Leistung einspeisen. In Viertelstunden mit negativem Börsenpreis entfällt für neue Anlagen die Vergütung; wie oft das vorkommt, zeigt ${h.a('negativ', 'negative Strompreise')}. Lieferung und Montage tragen nach ${h.src('ustg', '§ 12 Abs. 3 UStG')} keine Umsatzsteuer, die Einnahmen bleiben nach ${h.src('estg3', '§ 3 Nr. 72 EStG')} bis 30 kWp je Einheit einkommensteuerfrei.</p>
<h2>Kleiner anfangen oder speichern</h2>
<p>Wer kein Dach hat, rechnet mit ${h.a('balkonkraftwerk', 'Balkonkraftwerk-Rechner')}. Ob sich Strom vom Mittag für den Abend lohnt, hängt von Speicherpreis und Eigenverbrauch ab; Ihre Stromkosten ohne Anlage zeigt ${h.a('stromkosten', 'Stromkosten berechnen')}.</p>`;
    },
  },
  nl: {
    slug: 'zonnepanelen-terugverdientijd',
    nav: 'Zonnepanelen',
    card: 'Opbrengst en terugverdientijd van zonnepanelen voor en na het einde van salderen.',
    title: 'Zonnepanelen terugverdientijd 2027: opbrengst berekenen',
    description: 'Zonnepanelen terugverdientijd na het einde van salderen: opwek, eigen verbruik en terugleververgoeding invullen, opbrengst per jaar en terugverdientijd zien.',
    h1: 'Zonnepanelen: opbrengst en terugverdientijd na 2027',
    intro: 'Vul het vermogen, de opbrengst, je eigen verbruik en de prijs van de panelen in. De rekenhulp rekent met de CBS-stroomprijs en het wettelijke minimum voor terugleveren.',
    resume: (h) => {
      const { prijs, verg, n10 } = D(h);
      return `Zonnepanelen verdienen zich terug via de stroom die je niet meer van het net koopt. Tot en met 2026 telt elke teruggeleverde kilowattuur dankzij de salderingsregeling mee tegen de volle prijs; vanaf 1 januari 2027 stopt die regeling en krijg je voor teruggeleverde stroom alleen nog een terugleververgoeding van je leverancier. Die moet tot 2030 minstens de helft zijn van de kale leveringsprijs. Daarom telt na 2027 vooral wat je direct zelf verbruikt. Milieu Centraal rekent met panelen van ${h.num(h.P.nl.milieucentraal.wp_paneel)} Wp: tien stuks leveren ongeveer ${h.num(n10.kwh)} kWh per jaar en kosten ongeveer ${h.eur(n10.kosten)}. Bij 30 % direct eigen verbruik (aanname), een stroomprijs van ${h.ct(prijs, 2)} inclusief energiebelasting en btw volgens het CBS en een vergoeding van ${h.ct(verg, 2)} levert dat vanaf 2027 ${h.eur(n10.r.jaar2027)} per jaar op, in 2026 nog ${h.eur(n10.r.jaar2026)}. De terugverdientijd komt daarmee op ${j(h, n10.r.terugverdien)} jaar. Op zonnepanelen voor woningen geldt 0 % btw. Terugleverkosten van je leverancier verlengen de terugverdientijd; vul ze in als je contract ze noemt.`;
    },
    faqs: () => [
      { q: 'Zijn zonnepanelen na 2027 nog rendabel?', a: 'Meestal wel, maar de terugverdientijd wordt langer. Na het einde van salderen bespaart vooral de stroom die je direct gebruikt de volle prijs, terwijl teruggeleverde stroom alleen de vergoeding van je leverancier oplevert. Hoe meer je overdag verbruikt, hoe gunstiger. Milieu Centraal noemt geen vaste terugverdientijd, omdat die per situatie verschilt; de rekenhulp rekent jouw situatie door.' },
      { q: 'Hoeveel kWh levert één zonnepaneel per jaar op?', a: 'Een paneel van rond de 435 Wp levert in Nederland ongeveer 380 kWh per jaar, afgeleid uit de cijfers van Milieu Centraal voor tien panelen. Op een dak op het zuiden met een helling van zo’n 35 graden is het meer, op een plat dak, oost of west of met schaduw minder. Je omvormer-app laat na een jaar het echte getal zien.' },
      { q: 'Mag mijn leverancier kosten rekenen voor teruglevering?', a: 'Ja. Volgens de ACM mag een leverancier terugleverkosten rekenen, als vast bedrag of per teruggeleverde kilowattuur, zolang het in het contract staat. Sinds de nieuwe modelcontracten van 2026 staat die mogelijkheid er uitdrukkelijk in. Vergelijk daarom niet alleen de stroomprijs, maar ook vergoeding en kosten voor teruglevering als je zonnepanelen hebt.' },
    ],
    body: (h) => {
      const { nl, verbruik, prijs, verg } = D(h);
      const rows = nl.map((z) => [String(z.panelen), `${h.num(z.kwh)} kWh`, h.eur(z.kosten), h.eur(z.r.jaar2026), h.eur(z.r.jaar2027), j(h, z.r.terugverdien)]);
      return `<h2>Zes, acht of tien panelen</h2>
${h.table(['Panelen', 'Opwek per jaar', 'Prijs', 'Opbrengst 2026', 'Vanaf 2027', 'Terugverdientijd'], rows, `Opwek en prijs: Milieu Centraal (panelen van 435 Wp). Jaarverbruik ${h.num(verbruik)} kWh (CBS-gemiddelde), 30 % direct eigen verbruik (aanname), stroomprijs ${h.ct(prijs, 2)}, vergoeding ${h.ct(verg, 2)}, geen terugleverkosten`, ['r', 'r', 'r', 'r', 'r', 'r'])}
<p>De opwek en de prijzen zijn de voorbeelden van ${h.src('mcZon', 'Milieu Centraal')}. De opbrengst rekenen we zelf: direct eigen verbruik tegen de volle prijs, de rest tegen de vergoeding, en in 2026 nog gesaldeerd tot je jaarverbruik. Het gemiddelde jaarverbruik is het CBS-cijfer voor alle huishoudens uit ${h.src('cbsVerbruik', 'CBS StatLine 85140NED')}; de stroomprijs het CBS-gemiddelde voor een variabel contract plus energiebelasting.</p>
<h2>Wat er in 2027 verandert</h2>
<p>De ${h.src('rijksSaldering', 'Rijksoverheid')} bevestigt dat de salderingsregeling op 1 januari 2027 stopt. Volgens de ${h.src('acmSalderen', 'ACM')} moet de vergoeding tot 1 januari 2030 minstens 50 % zijn van de prijs zonder energiebelasting en btw. Wat het einde van salderen per jaar kost, rekent ${h.a('saldering', 'salderingsregeling 2027')} precies uit; hoe leveranciers vergoeding en kosten regelen, staat op ${h.a('terugleververgoeding', 'terugleververgoeding')}. De ${h.src('acmModel', 'nieuwe modelcontracten')} maken terugleverkosten uitdrukkelijk mogelijk.</p>
<h2>Btw en batterij</h2>
<p>Op de levering en installatie van zonnepanelen op of bij een woning geldt volgens de ${h.src('btwZon', 'Belastingdienst')} 0 % btw. Wie meer zonnestroom zelf wil gebruiken, kan een batterij overwegen; wat die met een dynamisch contract oplevert, staat op ${h.a('thuisbatterij', 'thuisbatterij')}.</p>`;
    },
  },
  en: {
    slug: 'solar-panel-payback',
    nav: 'Solar panel payback',
    card: 'Solar yield, feed-in payment and payback for Germany and the Netherlands.',
    title: 'Solar panel payback 2026: Germany and the Netherlands',
    description: 'Solar panel payback calculator for Germany and the Netherlands: yield, own use, feed-in tariff or net metering, yearly value and years until the panels pay off.',
    h1: 'Solar panel payback in Germany and the Netherlands',
    intro: 'Choose the country, then enter system size, yield, own use and price. The calculator applies the German feed-in tariff or the Dutch net metering rules and their 2027 end.',
    resume: (h) => {
      const { p, bsp, prijs, verg, n10 } = D(h);
      return `Rooftop solar pays back through power you no longer buy from the grid, and the rules for the surplus differ sharply between Germany and the Netherlands. In Germany the grid operator pays a fixed feed-in tariff for 20 years, far below the retail price, so own use drives the return. An 8 kWp system yielding 950 kWh per kWp with 30% own use (assumptions) produces ${h.num(bsp.erzeugt)} kWh a year and earns ${h.eur(bsp.summe)} in feed-in payments and savings at an all-in price of ${h.ct(p.preis, 2)}; at 12,000 euros (assumption) it pays back in ${j(h, bsp.amortisation)} years. In the Netherlands net metering offsets exports at the full price until the end of 2026; from 1 January 2027 exports earn only the supplier’s feed-in payment, which must be at least half the bare supply price until 2030. Ten 435 Wp panels, which Milieu Centraal puts at about ${h.num(n10.kwh)} kWh a year and ${h.eur(n10.kosten)}, then yield ${h.eur(n10.r.jaar2027)} a year at a CBS price of ${h.ct(prijs, 2)} and a payment of ${h.ct(verg, 2)}, a payback of ${j(h, n10.r.terugverdien)} years. Both countries charge zero VAT on home solar panels.`;
    },
    faqs: () => [
      { q: 'Why does own use matter more than the feed-in payment?', a: 'Because a kilowatt-hour used at home saves the full retail price, taxes and grid fees included, while an exported one earns only the feed-in rate. In Germany that rate is a fraction of the retail price, and in the Netherlands it drops to the supplier’s payment once net metering ends in 2027. Running appliances at midday and charging a car in daylight therefore shortens the payback.' },
      { q: 'Are solar panels still worth it in the Netherlands after 2027?', a: 'Usually, but they take longer to pay back. Once net metering ends, only power used directly saves the full price and exports earn the supplier’s payment, which by law must be at least half the bare supply price until 2030. Suppliers may also charge a feed-in fee. Enter your own contract terms in the calculator to see your case.' },
      { q: 'How much does one solar panel produce in a year?', a: 'In the Netherlands a panel of about 435 Wp produces roughly 380 kWh a year, derived from Milieu Centraal’s figures for ten panels. In Germany the calculator assumes 950 kWh per kWp on an unshaded south-facing roof. North-western sites, flat roofs and east or west faces produce less, so use the figure from your inverter app once you have a year of data.' },
    ],
    body: (h) => {
      const { p, de, nl, prijs, verg } = D(h);
      const r1 = de.map((x) => [`${h.num(x.kwp)} kWp`, `${h.num(x.r.erzeugt)} kWh`, h.ct(x.r.satz, 2), h.eur(x.r.summe), ...x.jahre.map((y) => j(h, y))]);
      const r2 = nl.map((z) => [String(z.panelen), `${h.num(z.kwh)} kWh`, h.eur(z.kosten), h.eur(z.r.jaar2026), h.eur(z.r.jaar2027), j(h, z.r.terugverdien)]);
      return `<h2>Germany: payback by size and price</h2>
${h.table(['System', 'Output', 'Blended rate', 'Value per year', '€1,200/kWp', '€1,500/kWp', '€1,800/kWp'], r1, `Years to pay back. 950 kWh per kWp, 30% own use, partial export; prices per kWp are assumptions. Power price ${h.ct(p.preis, 2)}`, ['l', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>Feed-in rates come from the ${h.src('bnetzaEeg')} and apply to systems commissioned by the end of 2026; the full table is on ${h.a('einspeiseverguetung', 'German feed-in tariff 2026')}. New systems from 2 to 100 kW may export at most 60 percent of their capacity until a smart meter is installed, under ${h.src('eeg9', 'section 9 EEG')}. Supply and installation carry zero VAT under ${h.src('ustg', 'section 12(3) of the VAT Act')}.</p>
<h2>Netherlands: six, eight or ten panels</h2>
${h.table(['Panels', 'Output per year', 'Price', 'Value 2026', 'From 2027', 'Payback'], r2, `Output and price: Milieu Centraal (435 Wp panels). CBS average use, 30% direct own use (assumption), power price ${h.ct(prijs, 2)}, feed-in payment ${h.ct(verg, 2)}, no feed-in fee`, ['r', 'r', 'r', 'r', 'r', 'r'])}
<p>Output and prices are the examples of ${h.src('mcZon', 'Milieu Centraal')}; the value is our own calculation with CBS averages from ${h.src('cbsVerbruik', 'CBS StatLine 85140NED')} and ${h.src('cbs', 'CBS StatLine 85592NED')}. The ${h.src('rijksSaldering', 'Dutch government')} confirms that net metering ends on 1 January 2027, and the ${h.src('acmSalderen', 'ACM')} sets the minimum payment until 2030. What the end of netting costs is on ${h.a('saldering', 'net metering Netherlands 2027')}; how suppliers set payments and fees on ${h.a('terugleververgoeding', 'Dutch feed-in tariff')}. The ${h.src('btwZon', 'Dutch Tax Administration')} applies 0% VAT to panels on or near a home.</p>
<h2>Smaller or with storage</h2>
<p>Without a roof, ${h.a('balkonkraftwerk', 'balcony solar')} is the small version. Whether a battery adds enough on a Dutch dynamic contract is on ${h.a('thuisbatterij', 'home battery Netherlands')}.</p>`;
    },
  },
});
