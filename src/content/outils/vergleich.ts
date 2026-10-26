import { defineGuide, type Helpers } from '../../lib/guide-types';
import { vergleich30, eDe, eNl, fenster } from '../../lib/fakten';
import { festVorgabe } from '../../lib/tool-props';

/** Dynamischer Tarif gegen Festpreis : dieselben 30 Tage und Profile wie im Rechner, Aufschlag 2 ct als benannte Annahme. */
function D(h: Helpers) {
  const festDe = h.P.de.haushaltspreise2025_ct.andererLieferant;
  const festNl = festVorgabe('NL');
  const de = { flach: vergleich30('DE-LU', eDe(2), festDe, 3000, 'flach'), abend: vergleich30('DE-LU', eDe(2), festDe, 3000, 'abend'), nacht: vergleich30('DE-LU', eDe(2), festDe, 3000, 'nacht'), mittag: vergleich30('DE-LU', eDe(2), festDe, 3000, 'mittag') };
  const nl = { flach: vergleich30('NL', eNl(2), festNl, 2500, 'flach'), abend: vergleich30('NL', eNl(2), festNl, 2500, 'abend'), nacht: vergleich30('NL', eNl(2), festNl, 2500, 'nacht'), mittag: vergleich30('NL', eNl(2), festNl, 2500, 'mittag') };
  return { festDe, festNl, de, nl, wd: fenster('DE-LU', 30), wn: fenster('NL', 30) };
}
const vz = (x: number) => (x < 0 ? '−' : '+');

export default defineGuide({
  id: 'vergleich',
  group: 'tarif',
  order: 10,
  tool: 'vergleich',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  toolProps: { start: { aufschlag: 2 } },
  related: ['fenster', 'laden', 'saldering', 'thuisbatterij', 'stromkosten', 'preis', 'verlauf'],
  sources: ['enwg41a', 'monitoring', 'smard', 'stromstg', 'cbs', 'wbm'],
  de: {
    slug: 'dynamischer-stromtarif',
    nav: 'Dynamischer Stromtarif',
    card: 'Rechnet Ihren Verbrauch auf den letzten 30 Tagen dynamisch und zum Festpreis.',
    title: 'Dynamischer Stromtarif 2026: lohnt er sich für Ihr Zuhause?',
    description: 'Dynamischer Stromtarif im Test auf den Börsenpreisen der letzten 30 Tage: Ihr Verbrauch, Ihr Festpreis, Ihr Tagesprofil, mit allen Abgaben und Umsatzsteuer.',
    h1: 'Dynamischer Stromtarif: rechnet er sich gegen Ihren Festpreis?',
    intro: 'Tragen Sie Jahresverbrauch und heutigen Arbeitspreis ein: der Rechner legt Ihren Verbrauch auf jede Viertelstunde der letzten 30 Tage.',
    resume: (h) => {
      const { festDe, de, wd } = D(h);
      return `Ein dynamischer Stromtarif rechnet jede Kilowattstunde zum Börsenpreis der Viertelstunde ab, in der Sie sie verbrauchen, plus Aufschlag des Anbieters, Netzentgelt, Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer. Seit dem 1. Januar 2025 muss jeder Lieferant in Deutschland einen solchen Tarif anbieten, wenn der Kunde ein intelligentes Messsystem hat (§ 41a Energiewirtschaftsgesetz). Ob er sich lohnt, hängt weniger vom Börsenpreis ab als davon, wann Sie Strom brauchen. Auf den Preisen vom ${h.date(de.flach.von)} bis ${h.date(de.flach.bis)}, mit 3.000 kWh im Jahr, dem Bundesmittel des Netzentgelts und einem angenommenen Aufschlag von 2 ct, lag der mittlere Endpreis bei gleichmäßigem Verbrauch bei ${h.ct(de.flach.prixMoyenDynamique)} gegenüber ${h.ct(festDe, 2)} beim Festpreis eines Lieferanten außerhalb der Grundversorgung (Monitoringbericht, April 2025). Wer vor allem abends verbraucht, zahlte ${h.ct(de.abend.prixMoyenDynamique)}, wer nachts lädt, ${h.ct(de.nacht.prixMoyenDynamique)}. Die tägliche Spanne zwischen billigster und teuerster Viertelstunde lag in diesen Tagen im Mittel bei ${h.spot(wd.spreizung)}.`;
    },
    faqs: (h) => {
      const { de } = D(h);
      return [
        { q: 'Brauche ich für den dynamischen Tarif einen Smart Meter?', a: 'Ja, ein intelligentes Messsystem: einen digitalen Zähler mit Kommunikationseinheit, der Ihren Verbrauch je Viertelstunde an den Messstellenbetreiber meldet. Ohne diese Messung kann der Anbieter nicht wissen, wann Sie Strom verbraucht haben, und rechnet nach einem Standardprofil ab. Den Einbau können Sie beim grundzuständigen Messstellenbetreiber verlangen; die jährlichen Kosten sind gesetzlich gedeckelt.' },
        { q: 'Für wen lohnt sich ein dynamischer Stromtarif am ehesten?', a: `Für Haushalte, die große Mengen zeitlich verschieben können: ein E-Auto, das nachts oder mittags lädt, eine Wärmepumpe mit Speicher, ein Heimspeicher. Auf den letzten 30 Tagen lag der Endpreis mit dem Nachtprofil des Rechners bei ${h.ct(de.nacht.prixMoyenDynamique)}, mit dem Abendprofil bei ${h.ct(de.abend.prixMoyenDynamique)}. Wer vor allem abends kocht und wäscht, hat wenig vom günstigen Mittag.` },
        { q: 'Kann ein dynamischer Tarif teurer werden als mein Festpreis?', a: 'Ja. Steigt der Börsenpreis über Wochen, etwa in einem windarmen Winter, zahlen Sie den höheren Preis sofort, während ein Festpreisvertrag ihn bis zur nächsten Preisanpassung abfedert. Der Rechner zeigt deshalb nur, was in den letzten 30 Tagen geschehen wäre, und keine Prognose. Wer das Risiko scheut, kann mit kurzen Kündigungsfristen ausprobieren und zurückwechseln.' },
      ];
    },
    body: (h) => {
      const { festDe, de } = D(h);
      const rows = (['flach', 'abend', 'nacht', 'mittag'] as const).map((k) => [
        { flach: 'Gleichmäßig', abend: 'Vor allem abends', nacht: 'Vor allem nachts', mittag: 'Vor allem mittags' }[k],
        h.ct(de[k].prixMoyenDynamique, 2),
        `${vz(de[k].jahr)}${h.eur(Math.abs(de[k].jahr))}`,
      ]);
      return `<h2>Vier Verbrauchsprofile auf denselben 30 Tagen</h2>
${h.table(['Profil (Beispiel)', 'Mittlerer Endpreis', 'Aufs Jahr gegen Festpreis'], rows, `3.000 kWh im Jahr, Festpreis ${h.ct(festDe, 2)}, Aufschlag 2 ct (Annahme), Netzentgelt Bundesmittel, ${h.date(de.flach.von)} bis ${h.date(de.flach.bis)}`, ['l', 'r', 'r'])}
<p>Die Profile sind Beispiele, keine Messungen: „abends“ legt dreimal so viel Verbrauch auf 17 bis 22 Uhr wie auf den Tag, „nachts“ den größten Teil vor 6 Uhr, wie bei einem Auto, das über Nacht lädt. Die Hochrechnung aufs Jahr wiederholt einfach diese 30 Tage; ein Winter mit wenig Wind und Sonne sieht anders aus. Grundgebühr und Messstellenbetrieb stehen in beiden Verträgen und fehlen deshalb im Vergleich.</p>
<h2>Was im dynamischen Preis steckt</h2>
<p>Nur der Börsenanteil schwankt. Netzentgelt, ${h.src('stromstg', 'Stromsteuer')} von ${h.ct(h.P.de.stromsteuer_ct, 2)}, Umlagen und Konzessionsabgabe sind je Kilowattstunde fest, und auf alles kommt die Umsatzsteuer. Bei einem Börsenpreis von null zahlen Sie also immer noch deutlich über 20 Cent. Das ist der Grund, warum negative Börsenpreise den Endpreis fast nie unter null drücken. Wie sich der feste Teil zusammensetzt, zeigt ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')}.</p>
<h2>Was der Monitoringbericht sagt</h2>
<p>Bundesnetzagentur und Bundeskartellamt nennen im ${h.src('monitoring')} für 2025 einen Modellpreis von ${h.ct(h.P.de.haushaltspreise2025_ct.modellDynamisch, 2)} für dynamische Tarife und ${h.ct(h.P.de.haushaltspreise2025_ct.modellNeukunden, 2)} für Neukundenverträge, jeweils mit Grundgebühr und Steuern. Der Abstand ist im Jahresmittel klein; groß wird er erst, wenn Sie Verbrauch gezielt verschieben. Die Pflicht zum Angebot steht in ${h.src('enwg41a')}.</p>
<h2>So nutzen Sie den Rechner</h2>
<p>Jahresverbrauch und Arbeitspreis stehen auf Ihrer letzten Jahresabrechnung. Unter „Tarif des dynamischen Vertrags“ tragen Sie den Aufschlag ein, den der Anbieter auf den Börsenpreis legt, und Ihr Bundesland für das Netzentgelt. Welche Stunden Sie verschieben könnten, zeigen ${h.a('fenster', 'günstigste Stunde')} und ${h.a('laden', 'E-Auto laden')}.</p>`;
    },
  },
  en: {
    slug: 'dynamic-electricity-tariff',
    nav: 'Dynamic electricity tariff',
    card: 'Runs your consumption over the last 30 days on a dynamic and a fixed price.',
    title: 'Dynamic electricity tariff: cheaper than a fixed price?',
    description: 'Dynamic electricity tariff tested on the exchange prices of the last 30 days: your usage, your fixed price and your daily profile, with taxes and levies.',
    h1: 'Dynamic electricity tariff: does it beat your fixed price?',
    intro: 'Enter your annual use and current unit rate: the calculator spreads your consumption over every quarter hour of the last 30 days.',
    resume: (h) => {
      const { festDe, de, festNl, nl } = D(h);
      return `A dynamic electricity tariff bills each kilowatt-hour at the exchange price of the quarter hour in which you use it, plus the supplier’s markup and the fixed taxes and fees of your country. In Germany every supplier has had to offer one since 1 January 2025 to customers with a smart metering system (section 41a of the Energy Industry Act); in the Netherlands dynamic contracts have been common for longer. Whether it pays depends less on the exchange price than on when you use power. On prices from ${h.date(de.flach.von)} to ${h.date(de.flach.bis)}, with 3,000 kWh a year, the German average grid fee and an assumed 2 ct markup, an even daily profile came to ${h.ct(de.flach.prixMoyenDynamique)} against a fixed ${h.ct(festDe, 2)} (other-supplier average, April 2025 monitoring report), while a mostly-evening profile came to ${h.ct(de.abend.prixMoyenDynamique)}. In the Netherlands, with 2,500 kWh and the same assumed fee, the even profile came to ${h.ct(nl.flach.prixMoyenDynamique)} against the CBS variable-contract average of ${h.ct(festNl, 2)}.`;
    },
    faqs: (h) => {
      const { de } = D(h);
      return [
        { q: 'Do I need a smart meter for a dynamic tariff?', a: 'Yes. The supplier can only bill each quarter hour if a meter records your use per quarter hour and passes it on. In Germany that means an intelligent metering system, a digital meter with a communication unit, which you can request from the default metering operator at a capped annual cost. In the Netherlands most homes already have a smart meter.' },
        { q: 'Who gains most from a dynamic tariff?', a: `Households that can shift large amounts of use in time: an electric car charging overnight or at midday, a heat pump with storage, a home battery. Over the last 30 days the night profile of the calculator came to ${h.ct(de.nacht.prixMoyenDynamique)} in Germany and the evening profile to ${h.ct(de.abend.prixMoyenDynamique)}. If you mostly cook and wash in the evening, cheap middays help little.` },
        { q: 'Can a dynamic tariff end up dearer than a fixed price?', a: 'Yes. If exchange prices stay high for weeks, for example in a calm winter, you pay the higher price at once, whereas a fixed contract cushions it until the next price change. The calculator therefore shows what the last 30 days would have cost, not a forecast. Short notice periods let you try a dynamic contract and switch back.' },
      ];
    },
    body: (h) => {
      const { festDe, de, festNl, nl } = D(h);
      const names = { flach: 'Even', abend: 'Mostly evening', nacht: 'Mostly night', mittag: 'Mostly midday' };
      const rows = (['flach', 'abend', 'nacht', 'mittag'] as const).map((k) => [names[k], h.ct(de[k].prixMoyenDynamique, 2), `${vz(de[k].jahr)}${h.eur(Math.abs(de[k].jahr))}`, h.ct(nl[k].prixMoyenDynamique, 2), `${vz(nl[k].jahr)}${h.eur(Math.abs(nl[k].jahr))}`]);
      return `<h2>Four usage profiles on the same 30 days</h2>
${h.table(['Profile (example)', 'Germany, average', 'DE per year', 'Netherlands, average', 'NL per year'], rows, `Germany 3,000 kWh, fixed ${h.ct(festDe, 2)}; Netherlands 2,500 kWh, fixed ${h.ct(festNl, 2)}; assumed 2 ct markup; ${h.date(de.flach.von)} to ${h.date(de.flach.bis)}`, ['l', 'r', 'r', 'r', 'r'])}
<p>The profiles are examples, not measurements: “evening” puts three times as much use on 5 to 10 pm as on the daytime, “night” puts most of it before 6 am, like a car charging overnight. The yearly figure simply repeats those 30 days; a winter with little wind and sun looks different. Standing charges and network costs apply to both contracts and are left out of the comparison.</p>
<h2>What is inside the dynamic price</h2>
<p>Only the exchange part moves. In Germany the grid fee, ${h.src('stromstg', 'electricity tax')} of ${h.ct(h.P.de.stromsteuer_ct, 2)}, levies and concession fee are fixed per kWh, with VAT on top, so at an exchange price of zero you still pay well over 20 cents. In the Netherlands the energy tax of ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} (${h.src('wbm')}) plus VAT plays the same role. That is why negative exchange prices almost never make the all-in price negative. The German breakdown is on ${h.a('zusammensetzung', 'German electricity price breakdown')}.</p>
<h2>What the official figures say</h2>
<p>For 2025 the German ${h.src('monitoring')} gives a model price of ${h.ct(h.P.de.haushaltspreise2025_ct.modellDynamisch, 2)} for dynamic tariffs against ${h.ct(h.P.de.haushaltspreise2025_ct.modellNeukunden, 2)} for new-customer contracts, both with standing charges and taxes. Over a year the gap is small; it only widens when use is shifted on purpose. The obligation to offer such tariffs is in ${h.src('enwg41a')}. Dutch averages come from ${h.src('cbs')}.</p>
<h2>How to use the calculator</h2>
<p>Annual use and unit rate are on your last annual bill. Under “Dynamic contract details” enter the markup the supplier adds to the exchange price and, in Germany, your federal state for the grid fee. Which hours you could shift is shown by ${h.a('fenster', 'cheapest hour')} and ${h.a('laden', 'EV charging cost')}.</p>`;
    },
  },
  nl: {
    slug: 'dynamisch-energiecontract',
    nav: 'Dynamisch energiecontract',
    card: 'Rekent je verbruik van de laatste 30 dagen dynamisch en tegen je vaste prijs.',
    title: 'Dynamisch energiecontract: goedkoper dan vast of variabel?',
    description: 'Dynamisch energiecontract getoetst op de beursprijzen van de laatste 30 dagen: je jaarverbruik, je huidige prijs en je dagprofiel, met energiebelasting en btw.',
    h1: 'Dynamisch energiecontract: goedkoper dan je huidige prijs?',
    intro: 'Vul je jaarverbruik en je huidige prijs per kWh in: de rekenhulp legt je verbruik op elk kwartier van de laatste 30 dagen.',
    resume: (h) => {
      const { festNl, nl, wn } = D(h);
      return `Met een dynamisch energiecontract betaal je voor elke kilowattuur de beursprijs van het kwartier waarin je hem verbruikt, plus de inkoopvergoeding van je leverancier, de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} en ${h.num(h.P.nl.btw * 100)} % btw. Of dat goedkoper is dan een vast of variabel contract, hangt vooral af van wanneer je stroom gebruikt. Op de prijzen van ${h.date(nl.flach.von)} tot ${h.date(nl.flach.bis)}, met 2.500 kWh per jaar en een aangenomen inkoopvergoeding van 2 cent, kwam een gelijkmatig verbruik uit op gemiddeld ${h.ct(nl.flach.prixMoyenDynamique)} per kWh, tegen ${h.ct(festNl, 2)} voor een variabel contract volgens het CBS (leveringstarief plus energiebelasting, inclusief btw). Wie vooral ’s avonds verbruikt, kwam uit op ${h.ct(nl.abend.prixMoyenDynamique)}, wie ’s nachts de auto laadt op ${h.ct(nl.nacht.prixMoyenDynamique)} en wie midden op de dag draait op ${h.ct(nl.mittag.prixMoyenDynamique)}. Het verschil tussen het goedkoopste en het duurste kwartier van een dag was in die periode gemiddeld ${h.spot(wn.spreizung)}. Vaste leveringskosten en netbeheer betaal je bij elk contract en tellen niet mee.`;
    },
    faqs: (h) => {
      const { nl } = D(h);
      return [
        { q: 'Wat is het verschil tussen dynamisch en variabel?', a: 'Bij een variabel contract stelt de leverancier zelf een prijs per kWh vast en past die een paar keer per jaar aan; je betaalt elk uur van de dag hetzelfde. Bij een dynamisch contract volgt je prijs per uur of kwartier de day-aheadbeurs, met daarbovenop een vaste inkoopvergoeding. Je merkt prijsdalingen dus meteen, maar prijsstijgingen ook.' },
        { q: 'Voor wie loont een dynamisch contract het meest?', a: `Voor huishoudens die veel verbruik kunnen verschuiven: een elektrische auto die ’s nachts of midden op de dag laadt, een warmtepomp met buffervat, een thuisbatterij. In de laatste 30 dagen kwam het nachtprofiel van de rekenhulp uit op ${h.ct(nl.nacht.prixMoyenDynamique)} en het avondprofiel op ${h.ct(nl.abend.prixMoyenDynamique)}. Wie vooral ’s avonds kookt en wast, heeft weinig aan de goedkope middag.` },
        { q: 'Wat gebeurt er met mijn zonnepanelen bij een dynamisch contract?', a: 'Stroom die je teruglevert, krijgt bij de meeste dynamische contracten de beursprijs van dat kwartier, en die is midden op zonnige dagen vaak laag of negatief. Zolang de salderingsregeling geldt, verrekent je leverancier teruglevering en verbruik met elkaar; de precieze afrekening staat in je contract. De rekenhulp hier rekent alleen het verbruik, niet de teruglevering.' },
      ];
    },
    body: (h) => {
      const { festNl, nl } = D(h);
      const names = { flach: 'Gelijkmatig', abend: 'Vooral ’s avonds', nacht: 'Vooral ’s nachts', mittag: 'Vooral midden op de dag' };
      const rows = (['flach', 'abend', 'nacht', 'mittag'] as const).map((k) => [names[k], h.ct(nl[k].prixMoyenDynamique, 2), `${vz(nl[k].jahr)}${h.eur(Math.abs(nl[k].jahr))}`]);
      return `<h2>Vier verbruiksprofielen op dezelfde 30 dagen</h2>
${h.table(['Profiel (voorbeeld)', 'Gemiddelde eindprijs', 'Op jaarbasis tegen variabel'], rows, `2.500 kWh per jaar, variabel ${h.ct(festNl, 2)} (CBS), inkoopvergoeding 2 ct (aanname), ${h.date(nl.flach.von)} tot ${h.date(nl.flach.bis)}`, ['l', 'r', 'r'])}
<p>De profielen zijn voorbeelden, geen metingen: „’s avonds” legt drie keer zoveel verbruik op 17 tot 22 uur als op de dag, „’s nachts” het grootste deel voor 6 uur, zoals bij een auto die ’s nachts laadt. De jaarraming herhaalt gewoon die 30 dagen; een winter met weinig wind en zon ziet er anders uit.</p>
<h2>Wat er in de dynamische prijs zit</h2>
<p>Alleen de beursprijs beweegt. De energiebelasting uit de ${h.src('wbm')} is per kWh vast en de btw komt over alles heen. Bij een beursprijs van nul betaal je dus nog altijd ${h.ct((h.P.nl.eb_stroom_eur_kwh * 100 + 2) * (1 + h.P.nl.btw), 1)} met een inkoopvergoeding van 2 cent. Daarom wordt de eindprijs bij een negatieve beursprijs maar zelden zelf negatief; meer op ${h.a('negativ', 'negatieve stroomprijs')}.</p>
<h2>Het CBS-gemiddelde als vergelijking</h2>
<p>Als standaard voor je huidige prijs nemen we het gemiddelde variabele leveringstarief van de laatste maand bij ${h.src('cbs')}, plus de energiebelasting, alles inclusief btw. Staat in je contract een andere prijs, vul die dan in. Vaste leveringskosten en netbeheerkosten vallen weg, omdat je ze bij beide contracten betaalt.</p>
<h2>Zo gebruik je de rekenhulp</h2>
<p>Je jaarverbruik staat op je jaarafrekening of in de app van je leverancier. Onder „Gegevens van het dynamische contract” vul je de inkoopvergoeding in die de leverancier op de beursprijs zet. Welke uren je kunt verschuiven, laten ${h.a('fenster', 'goedkoopste uur')} en ${h.a('laden', 'auto laden')} zien.</p>`;
    },
  },
});
