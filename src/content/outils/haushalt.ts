import { defineGuide, type Helpers } from '../../lib/guide-types';
import { preisDe30, nlCbs } from '../../lib/tool-props';

/** Stromverbrauch im Haushalt : Durchschnitt nach Personenzahl (DE : co2online / Stromspiegel 2025 ; NL : CBS 85140NED 2024), Kosten und Abschlag. */
function D(h: Helpers) {
  const p = preisDe30();
  const s = h.P.de.stromspiegel;
  const deRows = [0, 1, 2, 3, 4].map((i) => ({ n: i + 1, w: s.wohnung.ohneWw[i], wW: s.wohnung.mitWw[i], h: s.haus.ohneWw[i], hW: s.haus.mitWw[i] }));
  const deKosten = (kwh: number) => (kwh * p.preis) / 100;
  const n = nlCbs();
  const c = h.P.nl.verbruik_cbs2024;
  const nlJaar = (kwh: number) => (kwh * n.stroomCt) / 100 + n.stroomVast - n.vermindering;
  const nlRows = [0, 1, 2, 3, 4].map((i) => ({ n: i + 1, stroom: c.alle.stroom[i], netto: c.alle.netto[i], gas: c.alle.gas[i], app: c.appartement.stroom[i], vrij: c.vrijstaand.stroom[i] }));
  return { p, s, deRows, deKosten, n, c, nlJaar, nlRows, mc: h.P.nl.milieucentraal };
}

export default defineGuide({
  id: 'haushalt',
  group: 'nutzen',
  order: 56,
  tool: 'haushalt',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  related: ['geraete', 'stromkosten', 'vergleich', 'energiebelasting', 'photovoltaik'],
  sources: ['stromspiegel', 'stromspiegelFlyer', 'cbsVerbruik', 'mcVerbruik', 'cbs', 'cbsLizenz', 'smard', 'smardLizenz'],
  de: {
    slug: 'stromverbrauch-haushalt',
    nav: 'Stromverbrauch Haushalt',
    card: 'Durchschnittlicher Stromverbrauch nach Personenzahl, Ihr Vergleich und der passende Abschlag.',
    title: 'Stromverbrauch Haushalt 2026: Durchschnitt nach Personen',
    description: 'Stromverbrauch im Haushalt: Durchschnitt für 1 bis 5 Personen in Wohnung und Haus laut Stromspiegel, Ihr Verbrauch im Vergleich, Kosten und Abschlag pro Monat.',
    h1: 'Stromverbrauch im Haushalt: was 1 bis 5 Personen im Jahr brauchen',
    intro: 'Wählen Sie Personenzahl, Wohnform und ob Warmwasser mit Strom erzeugt wird, und tragen Sie Ihren Verbrauch ein. Der Rechner vergleicht ihn mit dem Durchschnitt und zeigt den Abschlag.',
    resume: (h) => {
      const { p, deRows, deKosten } = D(h);
      const zwei = deRows[1], vier = deRows[3];
      return `Wie viel Strom ein Haushalt verbraucht, hängt vor allem von drei Dingen ab: der Zahl der Personen, der Wohnform und davon, ob das Warmwasser elektrisch erzeugt wird. Nach den Durchschnittswerten von co2online auf Basis des Stromspiegels 2025 braucht ein Zwei-Personen-Haushalt in einer Wohnung ${h.num(zwei.w)} kWh im Jahr, im Haus ${h.num(zwei.h)} kWh; mit Durchlauferhitzer oder elektrischem Boiler sind es ${h.num(zwei.wW)} und ${h.num(zwei.hW)} kWh. Vier Personen kommen in der Wohnung auf ${h.num(vier.w)} kWh, im Haus auf ${h.num(vier.h)} kWh und mit elektrischem Warmwasser im Haus auf ${h.num(vier.hW)} kWh. Ein Haus braucht mehr, weil Heizungspumpe, Garten, Keller und oft mehr Geräte dazukommen. Beim Endpreis von ${h.ct(p.preis, 2)}, der sich aus den Börsenpreisen vom ${h.date(p.von)} bis ${h.date(p.bis)} ergibt, kosten ${h.num(zwei.w)} kWh rund ${h.eur(deKosten(zwei.w) / 12)} im Monat und ${h.num(vier.h)} kWh rund ${h.eur(deKosten(vier.h) / 12)}, jeweils ohne Grundpreis. Den monatlichen Abschlag legt der Lieferant aus Ihrem Vorjahresverbrauch fest: Jahreskosten mit Grundpreis geteilt durch zwölf. Wärmepumpe und Elektroauto sind in diesen Werten nicht enthalten und kommen gesondert hinzu.`;
    },
    faqs: () => [
      { q: 'Wie berechne ich meinen Stromabschlag?', a: 'Nehmen Sie den Jahresverbrauch der letzten Abrechnung, multiplizieren Sie ihn mit dem Arbeitspreis und addieren Sie zwölf Monate Grundpreis. Geteilt durch zwölf ergibt das den Abschlag. Liegt er deutlich unter diesem Wert, droht eine Nachzahlung; liegt er darüber, gibt es Geld zurück. Sie können Ihren Lieferanten bitten, den Abschlag anzupassen, wenn sich Verbrauch oder Preis geändert haben.' },
      { q: 'Ab wann ist ein Stromverbrauch zu hoch?', a: 'Der Stromspiegel teilt Haushalte gleicher Größe und Wohnform in sieben Klassen von A bis G ein. Liegen Sie deutlich über dem Durchschnitt, lohnt die Suche nach großen Verbrauchern: alter Kühlschrank oder Gefriertruhe, Wäschetrockner, elektrisches Warmwasser, Aquarium, Pumpen oder Geräte im Dauerbetrieb. Ein Zwischenstecker mit Messfunktion zeigt, welches Gerät wie viel braucht.' },
      { q: 'Zählt die Wärmepumpe zum Haushaltsstrom?', a: 'In den Durchschnittswerten nicht. Wärmepumpe und Wallbox verbrauchen oft mehr als der übrige Haushalt zusammen und werden deshalb häufig über einen eigenen Zähler abgerechnet. Wer beide über einen Zähler bezieht, sollte ihren Verbrauch abziehen, bevor er sich mit dem Durchschnitt vergleicht. Was die Heizung allein braucht, zeigt die Seite zu den Kosten der Wärmepumpe.' },
    ],
    body: (h) => {
      const { p, deRows, deKosten } = D(h);
      const rows = deRows.map((r) => [r.n === 5 ? '5' : String(r.n), `${h.num(r.w)} kWh`, `${h.num(r.wW)} kWh`, `${h.num(r.h)} kWh`, `${h.num(r.hW)} kWh`]);
      const k = deRows.map((r) => [String(r.n), h.eur(deKosten(r.w) / 12), h.eur(deKosten(r.h) / 12), h.eur(deKosten(r.hW) / 12)]);
      return `<h2>Durchschnittlicher Stromverbrauch nach Personen</h2>
${h.table(['Personen', 'Wohnung', 'Wohnung, Warmwasser elektrisch', 'Haus', 'Haus, Warmwasser elektrisch'], rows, 'Kilowattstunden pro Jahr, Durchschnittswerte von co2online auf Basis des Stromspiegels 2025', ['l', 'r', 'r', 'r', 'r'])}
<p>Die Werte stammen von ${h.src('stromspiegel', 'co2online')}. Der ${h.src('stromspiegelFlyer', 'Stromspiegel 2025')} selbst beruht auf rund 57.000 Haushalten und ordnet jeden Verbrauch einer Klasse von A bis G zu; ein Single in der Wohnung ohne elektrisches Warmwasser liegt zum Beispiel bis 700 kWh in Klasse A und über 2.000 kWh in Klasse G.</p>
<h2>Kosten pro Monat</h2>
${h.table(['Personen', 'Wohnung', 'Haus', 'Haus, Warmwasser elektrisch'], k, `Arbeitskosten pro Monat zum Endpreis ${h.ct(p.preis, 2)} (Börsenmittel ${h.date(p.von)} bis ${h.date(p.bis)} plus Netzentgelt, Steuern und Umlagen), ohne Grundpreis und Anbieteraufschlag`, ['l', 'r', 'r', 'r'])}
<p>Für Ihren Abschlag kommt der Grundpreis Ihres Vertrags hinzu; tragen Sie ihn im Rechner ein. Welche Geräte den größten Teil ausmachen, zeigt ${h.a('geraete', 'Stromverbrauch Geräte')}, die Kosten eines einzelnen Geräts ${h.a('stromkosten', 'Stromkosten berechnen')}. Ob ein dynamischer Tarif für Ihren Verbrauch günstiger ist, rechnet ${h.a('vergleich', 'dynamischer Stromtarif')}; wie viel davon Solarstrom vom Dach decken kann, ${h.a('photovoltaik', 'Photovoltaik-Rechner')}.</p>`;
    },
  },
  nl: {
    slug: 'gemiddeld-stroomverbruik',
    nav: 'Gemiddeld stroomverbruik',
    card: 'Gemiddeld stroom- en gasverbruik per huishoudgrootte en woningtype, met je termijnbedrag.',
    title: 'Gemiddeld stroomverbruik 2026: per persoon en woningtype',
    description: 'Gemiddeld stroomverbruik per jaar voor 1 tot 5 personen en per woningtype volgens het CBS, met gasverbruik, je eigen verbruik ernaast en wat het per maand kost.',
    h1: 'Gemiddeld stroomverbruik: per huishouden, per persoon en per woning',
    intro: 'Kies het aantal personen en het type woning en vul je eigen verbruik in. De rekenhulp zet het naast het CBS-gemiddelde en rekent je stroomkosten per maand uit.',
    resume: (h) => {
      const { n, c, nlJaar, nlRows, mc } = D(h);
      const twee = nlRows[1];
      return `Een Nederlands huishouden verbruikt gemiddeld ${h.num(c.totaal.stroom)} kWh stroom en ${h.num(c.totaal.gas)} m³ gas per jaar, volgens de cijfers van het CBS over 2024; Milieu Centraal noemt als afgerond gemiddelde ${h.num(mc.stroom_kwh)} kWh en ${h.num(mc.gas_m3)} m³. Per huishoudgrootte verschilt het sterk: een alleenstaande gebruikt ${h.num(nlRows[0].stroom)} kWh, twee personen ${h.num(twee.stroom)} kWh, vier personen ${h.num(nlRows[3].stroom)} kWh en vijf of meer ${h.num(nlRows[4].stroom)} kWh. Het type woning telt ook: twee personen in een appartement komen op ${h.num(twee.app)} kWh, in een vrijstaande woning op ${h.num(twee.vrij)} kWh. Dit is de stroom die het net levert; wie zonnepanelen heeft, verbruikt in huis meer, maar neemt na salderen netto minder af. Met de gemiddelde CBS-prijs van ${h.ct(n.stroomCt, 2)} voor een variabel contract, de netbeheerkosten en de vermindering energiebelasting kost het verbruik van twee personen ongeveer ${h.eur(nlJaar(twee.stroom) / 12)} per maand. Het termijnbedrag van je leverancier rekent met je verwachte jaarverbruik en wordt bij de jaarafrekening verrekend.`;
    },
    faqs: () => [
      { q: 'Hoeveel stroom verbruikt één persoon per jaar?', a: 'Een eenpersoonshuishouden verbruikt volgens het CBS gemiddeld 1.650 kWh stroom per jaar, in een appartement minder en in een vrijstaande woning meer. Per persoon daalt het verbruik naarmate het huishouden groter wordt, omdat koelkast, verlichting en apparaten gedeeld worden. Een vijfpersoonshuishouden verbruikt dus geen vijf keer zoveel als een alleenstaande.' },
      { q: 'Waarom is mijn termijnbedrag hoger dan mijn verbruik doet vermoeden?', a: 'Het termijnbedrag bevat ook de vaste leveringskosten, de netbeheerkosten en de btw, en het is gebaseerd op het verbruik dat je leverancier verwacht. Was je vorige jaar duurder of is je contract verlengd tegen een hogere prijs, dan stijgt het mee. De vermindering energiebelasting verlaagt het juist. Je kunt het termijnbedrag meestal zelf aanpassen in de app of op de website van je leverancier.' },
      { q: 'Telt teruggeleverde zonnestroom mee in het gemiddelde?', a: 'Het CBS publiceert twee getallen: de stroom die het net levert en het netto verbruik na aftrek van teruglevering. Het tweede is voor alle huishoudens samen ongeveer 700 kWh lager, omdat veel woningen zonnepanelen hebben. Vergelijk je eigen levering van het net met het eerste getal; wat je zonnepanelen zelf in huis opleveren staat daar niet in.' },
    ],
    body: (h) => {
      const { n, nlJaar, nlRows, c } = D(h);
      const rows = nlRows.map((r) => [r.n === 5 ? '5 of meer' : String(r.n), `${h.num(r.stroom)} kWh`, `${h.num(r.netto)} kWh`, `${h.num(r.gas)} m³`, h.eur(nlJaar(r.stroom) / 12)]);
      const types = (['appartement', 'tussenwoning', 'hoekwoning', 'twee_onder_een_kap', 'vrijstaand'] as const).map((t) => [({ appartement: 'Appartement', tussenwoning: 'Tussenwoning', hoekwoning: 'Hoekwoning', twee_onder_een_kap: 'Twee-onder-een-kap', vrijstaand: 'Vrijstaand' })[t], ...c[t].stroom.map((x) => h.num(x))]);
      return `<h2>Gemiddeld stroomverbruik per huishoudgrootte</h2>
${h.table(['Personen', 'Stroom geleverd', 'Netto na teruglevering', 'Gas', 'Stroom per maand'], rows, `CBS, energieverbruik particuliere woningen 2024 (nader voorlopig). Kosten: CBS-prijs ${h.ct(n.stroomCt, 2)} plus netbeheer ${h.eur(n.stroomVast)} min vermindering ${h.eur(n.vermindering)} per jaar, ${h.monat(n.maand)}`, ['l', 'r', 'r', 'r', 'r'])}
<h2>Per woningtype, in kWh per jaar</h2>
${h.table(['Woning', '1', '2', '3', '4', '5+'], types, 'Geleverde stroom naar aantal bewoners, CBS 2024', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>De cijfers komen uit ${h.src('cbsVerbruik', 'CBS StatLine 85140NED')}, de prijzen uit ${h.src('cbs', 'CBS StatLine 85592NED')}, beide onder licentie CC BY 4.0. ${h.src('mcVerbruik', 'Milieu Centraal')} geeft daarnaast voorbeelden per woningtype voor nieuwe en oude woningen. Welke belasting er in je stroomprijs zit, staat op ${h.a('energiebelasting', 'energiebelasting 2026')}; of een dynamisch contract bij jouw verbruik goedkoper is, rekent ${h.a('vergleich', 'dynamisch energiecontract')} uit. Wat zonnepanelen met dat verbruik opleveren, zie je bij ${h.a('photovoltaik', 'zonnepanelen terugverdientijd')}.</p>`;
    },
  },
  en: {
    slug: 'average-electricity-consumption',
    nav: 'Average electricity use',
    card: 'Average household electricity use by size in Germany and the Netherlands, and your monthly cost.',
    title: 'Average electricity consumption by household size 2026',
    description: 'Average electricity consumption per year for 1 to 5 people in Germany and the Netherlands, by type of home, with your own use compared and the monthly cost.',
    h1: 'Average electricity consumption by household size',
    intro: 'Choose the country, household size and type of home, and enter your own use. The calculator compares it with the national average and works out your monthly cost.',
    resume: (h) => {
      const { p, deRows, deKosten, n, c, nlJaar, nlRows } = D(h);
      return `How much electricity a household uses depends mainly on the number of people, the type of home and, in Germany, whether hot water comes from an electric heater. According to co2online’s averages based on the German Stromspiegel 2025, two people in a flat use ${h.num(deRows[1].w)} kWh a year and two in a house ${h.num(deRows[1].h)} kWh; four people need ${h.num(deRows[3].w)} kWh in a flat and ${h.num(deRows[3].h)} kWh in a house, more with electric hot water. In the Netherlands, CBS figures for 2024 put the average household at ${h.num(c.totaal.stroom)} kWh delivered from the grid, from ${h.num(nlRows[0].stroom)} kWh for one person to ${h.num(nlRows[3].stroom)} kWh for four. Dutch averages are higher partly because they cover all homes, including houses. At the German all-in price of ${h.ct(p.preis, 2)}, two people in a flat pay about ${h.eur(deKosten(deRows[1].w) / 12)} a month before the standing charge. At the Dutch CBS average of ${h.ct(n.stroomCt, 2)}, including the grid charge and the energy tax reduction, two people pay about ${h.eur(nlJaar(nlRows[1].stroom) / 12)} a month. Heat pumps and electric cars come on top of these figures.`;
    },
    faqs: () => [
      { q: 'How do I work out my monthly electricity instalment?', a: 'Take your annual use from the last statement, multiply it by the energy rate and add twelve months of standing charges, then divide by twelve. If your instalment is well below that figure, expect a top-up bill; if above, a refund. Suppliers in Germany and the Netherlands let you adjust the instalment when your use or price changes.' },
      { q: 'Why does a house use more electricity than a flat?', a: 'Houses usually have more rooms to light, a heating circulation pump, often a garden, garage or basement, and more appliances such as a second freezer or a tumble dryer. Flats share stairwell lighting and lifts, which are billed separately. The tables below show the gap for each household size in both countries.' },
      { q: 'Do heat pumps and electric cars count in these averages?', a: 'Not in the German figures, which cover ordinary household use. A heat pump or an electric car can use more than the rest of the home and is often metered separately. The Dutch CBS figures cover all power delivered to the home, so they include whatever is connected there, averaged over all households.' },
    ],
    body: (h) => {
      const { p, deRows, deKosten, n, nlJaar, nlRows } = D(h);
      const r1 = deRows.map((r) => [String(r.n), `${h.num(r.w)} kWh`, `${h.num(r.wW)} kWh`, `${h.num(r.h)} kWh`, `${h.num(r.hW)} kWh`, h.eur(deKosten(r.w) / 12)]);
      const r2 = nlRows.map((r) => [r.n === 5 ? '5+' : String(r.n), `${h.num(r.stroom)} kWh`, `${h.num(r.app)} kWh`, `${h.num(r.vrij)} kWh`, h.eur(nlJaar(r.stroom) / 12)]);
      return `<h2>Germany: average use by household size</h2>
${h.table(['People', 'Flat', 'Flat, electric hot water', 'House', 'House, electric hot water', 'Flat per month'], r1, `kWh per year, co2online averages based on the Stromspiegel 2025. Monthly cost at ${h.ct(p.preis, 2)}, no standing charge`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The German figures are from ${h.src('stromspiegel', 'co2online')}. The ${h.src('stromspiegelFlyer', 'Stromspiegel 2025')} itself rests on about 57,000 households and ranks every consumption level in classes A to G.</p>
<h2>Netherlands: average use by household size</h2>
${h.table(['People', 'All homes', 'Flat', 'Detached house', 'All homes per month'], r2, `kWh delivered per year, CBS 2024. Monthly cost at the CBS price of ${h.ct(n.stroomCt, 2)} plus grid charge ${h.eur(n.stroomVast)} minus tax reduction ${h.eur(n.vermindering)} a year`, ['l', 'r', 'r', 'r', 'r'])}
<p>The Dutch figures come from ${h.src('cbsVerbruik', 'CBS StatLine 85140NED')} and the prices from ${h.src('cbs', 'CBS StatLine 85592NED')}, both under CC BY 4.0; ${h.src('mcVerbruik', 'Milieu Centraal')} gives further examples by type of home. Which appliances make up the total is on ${h.a('geraete', 'appliance electricity use')}; the Dutch energy tax on ${h.a('energiebelasting', 'energy tax Netherlands 2026')}; and whether a dynamic tariff suits your use on ${h.a('vergleich', 'dynamic electricity tariff')}.</p>`;
    },
  },
});
