import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster, endDe, endNl } from '../../lib/fakten';
import { markt, negativeJeTag } from '../../lib/engine/markt';
import { heureLocale, QUART_MS } from '../../lib/engine/quarts';
import type { Zone } from '../../lib/engine/tarif';

/** Negative Strompreise : Zählung im ganzen Viertelstunden-Fenster (etwa sechs Wochen) und in den letzten 30 Tagen. */
const ZONEN: Zone[] = ['DE-LU', 'NL', 'AT', 'BE', 'PL'];
function tiefster(z: Zone) {
  let best = { v: Infinity, d: '', uhr: '' };
  for (const t of markt(z).tage) t.v.forEach((v, i) => { if (v < best.v) best = { v, d: t.d, uhr: heureLocale(t.t0 + i * QUART_MS) }; });
  return best;
}
function D(_h: Helpers) {
  const z = Object.fromEntries(ZONEN.map((k) => {
    const n = negativeJeTag(k);
    return [k, { w: fenster(k, 30), ganz: { tage: n.length, neg: n.reduce((s, x) => s + x.n, 0), negTage: n.filter((x) => x.n > 0).length, von: n[0].d, bis: n.at(-1)!.d }, tief: tiefster(k) }];
  })) as Record<Zone, { w: ReturnType<typeof fenster>; ganz: { tage: number; neg: number; negTage: number; von: string; bis: string }; tief: ReturnType<typeof tiefster> }>;
  return { z, de: z['DE-LU'], nl: z.NL };
}
const NAME: Record<Zone, [string, string, string]> = { 'DE-LU': ['Deutschland', 'Germany', 'Duitsland'], NL: ['Niederlande', 'Netherlands', 'Nederland'], AT: ['Österreich', 'Austria', 'Oostenrijk'], BE: ['Belgien', 'Belgium', 'België'], PL: ['Polen', 'Poland', 'Polen'] };

export default defineGuide({
  id: 'negativ',
  group: 'preise',
  order: 40,
  tool: 'negativ',
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' },
  zonen: { de: ['AT', 'NL', 'BE', 'PL'], en: ['NL', 'AT', 'BE', 'PL'], nl: ['BE', 'DE-LU', 'AT', 'PL'] },
  related: ['verlauf', 'fenster', 'terugleververgoeding', 'einspeiseverguetung', 'vergleich', 'morgen'],
  sources: ['smard', 'smardLizenz', 'stromstg', 'ustg', 'wbm'],
  de: {
    slug: 'negative-strompreise',
    nav: 'Negative Strompreise',
    card: 'Wie oft der Börsenpreis unter null fiel und was davon beim Haushalt ankommt.',
    title: 'Negative Strompreise: wie oft, wann und was sie bringen',
    description: 'Negative Strompreise an der Börse: wie viele Viertelstunden zuletzt unter null lagen, zu welchen Uhrzeiten und warum Ihr Endpreis dennoch fast nie negativ wird.',
    h1: 'Negative Strompreise: wann die Börse fürs Abnehmen zahlt',
    intro: 'Der Rechner zählt für jeden der letzten Tage die Viertelstunden mit negativem Börsenpreis. Die Ansicht lässt sich auf Tages- oder Monatsmittel umstellen.',
    resume: (h) => {
      const { de } = D(h);
      const g = de.ganz;
      return `Ein negativer Strompreis bedeutet, dass an der Day-Ahead-Börse für eine Viertelstunde mehr Strom angeboten als nachgefragt wird und Erzeuger dafür zahlen, ihren Strom loswerden zu dürfen. Das geschieht vor allem an sonnigen, windigen Tagen mit wenig Verbrauch, etwa am Wochenende um die Mittagszeit, wenn Solaranlagen auf Hochtouren laufen und unflexible Kraftwerke nicht schnell genug herunterfahren. In Deutschland und Luxemburg lagen vom ${h.date(g.von)} bis ${h.date(g.bis)} ${h.num(g.neg)} Viertelstunden unter null, verteilt auf ${h.num(g.negTage)} von ${h.num(g.tage)} Tagen. Der tiefste Wert dieses Zeitraums war ${h.spot(de.tief.v, 2)} am ${h.date(de.tief.d)} um ${de.tief.uhr} Uhr. Für Haushalte mit dynamischem Tarif heißt das selten Geld zurück: Netzentgelt, Stromsteuer, Umlagen und Konzessionsabgabe bleiben je Kilowattstunde gleich, und darauf kommt Umsatzsteuer. Selbst zum tiefsten Börsenpreis des Zeitraums lag der Endpreis ohne Anbieteraufschlag noch bei etwa ${h.ct(endDe(de.tief.v))}. Günstig ist eine solche Viertelstunde trotzdem, und wer Verbrauch verschieben kann, legt ihn genau dorthin.`;
    },
    faqs: () => [
      { q: 'Bekomme ich bei negativen Strompreisen Geld?', a: 'Mit einem Festpreis nicht: Sie zahlen Ihren Arbeitspreis wie immer. Mit einem dynamischen Tarif sinkt nur der Börsenanteil unter null, während Netzentgelt, Stromsteuer, Umlagen und Konzessionsabgabe weiter je Kilowattstunde anfallen. Der Endpreis bleibt deshalb fast immer positiv, nur eben deutlich niedriger. Ob ein Anbieter einen negativen Börsenanteil vollständig weitergibt, regelt der Vertrag.' },
      { q: 'Warum produzieren Kraftwerke trotz negativer Preise weiter?', a: 'Weil Abschalten für manche Anlagen teurer ist als kurz draufzuzahlen: Kohle- und Kernkraftwerke brauchen Stunden zum Anfahren, Kraft-Wärme-Anlagen liefern zugleich Wärme, und ältere Solar- und Windanlagen erhalten eine feste Vergütung unabhängig vom Börsenpreis. Bei grenzüberschreitend vollen Leitungen kann der Überschuss auch nicht schnell genug ins Ausland abfließen.' },
      { q: 'Zu welchen Uhrzeiten gibt es negative Strompreise?', a: 'Überwiegend mittags zwischen etwa 11 und 16 Uhr an sonnigen Tagen, besonders an Wochenenden und Feiertagen mit niedriger Nachfrage. Seltener treten sie nachts bei starkem Wind auf. Im Winter sind sie wegen der geringen Solarleistung viel seltener als zwischen April und September. Die Tagesansicht des Rechners zeigt für jeden Tag der letzten Wochen, wie viele Viertelstunden betroffen waren.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const rows = ZONEN.filter((k) => k !== 'PL').map((k) => [NAME[k][0], h.num(z[k].ganz.neg), h.num(z[k].ganz.negTage), h.spot(z[k].tief.v, 2), h.date(z[k].tief.d)]);
      return `<h2>Negative Viertelstunden der letzten Wochen</h2>
${h.table(['Preiszone', 'Viertelstunden unter null', 'Tage mit negativen Preisen', 'Tiefster Wert', 'am'], rows, `${h.date(z['DE-LU'].ganz.von)} bis ${h.date(z['DE-LU'].ganz.bis)}, Day-Ahead, Quelle SMARD`, ['l', 'r', 'r', 'r', 'r'])}
<p>Die Zählung beruht auf den Viertelstundenwerten von ${h.src('smard')}. Weil alle Zonen in einer gemeinsamen Auktion gerechnet werden, fallen negative Preise oft in mehreren Ländern gleichzeitig an; wie stark, hängt davon ab, wie viel Wind- und Solarleistung jedes Land hat und wie voll die Grenzleitungen sind.</p>
<h2>Warum der Endpreis fast nie negativ wird</h2>
<p>Von jeder Kilowattstunde gehen in Deutschland feste Beträge ab, unabhängig vom Börsenpreis: das Netzentgelt, die Stromsteuer nach ${h.src('stromstg', '§ 3 StromStG')}, die Umlagen und die Konzessionsabgabe. Darauf berechnet der Anbieter Umsatzsteuer nach ${h.src('ustg', '§ 12 UStG')}. Erst wenn der Börsenpreis tiefer fiele als diese Summe, wäre der Endpreis negativ; ${endDe(z['DE-LU'].tief.v) > 0 ? 'das kam im betrachteten Zeitraum nicht vor' : 'das kam im betrachteten Zeitraum vor'}.</p>
<h2>Was Sie daraus machen können</h2>
<p>Verbrauch, der sich verschieben lässt, gehört in diese Viertelstunden: das Laden des Autos, die Wärmepumpe mit Speicher, die Waschmaschine mit Startzeitvorwahl. ${h.a('fenster', 'Günstigste Stunde')} findet sie für morgen, sobald die Preise veröffentlicht sind. Wie sich solche Tage über den Monat auf den dynamischen Tarif auswirken, rechnet ${h.a('vergleich', 'dynamischer Stromtarif')}.</p>`;
    },
  },
  en: {
    slug: 'negative-electricity-prices',
    nav: 'Negative electricity prices',
    card: 'How often the exchange price fell below zero and what reaches a household.',
    title: 'Negative electricity prices: how often and what you gain',
    description: 'Negative electricity prices on the day-ahead market: how many quarter hours fell below zero lately, at what times, and why your bill almost never goes negative.',
    h1: 'Negative electricity prices: when the exchange pays you to take power',
    intro: 'The calculator counts the quarter hours with a negative exchange price for each recent day. Switch the view to daily or monthly averages.',
    resume: (h) => {
      const { de, nl } = D(h);
      const g = de.ganz;
      return `A negative electricity price means that, for a given quarter hour, more power is offered than wanted on the day-ahead market, so generators pay to be allowed to deliver it. It happens mostly on sunny, windy days with low demand, such as weekend middays when solar panels run flat out and inflexible plants cannot ramp down fast enough. In the German and Luxembourg zone, ${h.num(g.neg)} quarter hours fell below zero between ${h.date(g.von)} and ${h.date(g.bis)}, spread over ${h.num(g.negTage)} of ${h.num(g.tage)} days; the lowest was ${h.spot(de.tief.v, 2)} on ${h.date(de.tief.d)} at ${de.tief.uhr}. In the Dutch zone the count was ${h.num(nl.ganz.neg)}, with a low of ${h.spot(nl.tief.v, 2)}. On a dynamic tariff that rarely means money back: grid fees, taxes and levies stay the same per kWh, with VAT on top. Even at the lowest German exchange price of the period, the all-in price before any markup was still about ${h.ct(endDe(de.tief.v))}, and in the Netherlands about ${h.ct(endNl(nl.tief.v))}. Such quarter hours are cheap all the same, and they are where flexible use belongs.`;
    },
    faqs: () => [
      { q: 'Do I get paid when power prices turn negative?', a: 'Not on a fixed contract: you pay your usual unit rate. On a dynamic tariff only the exchange part drops below zero, while grid fees, energy or electricity tax and levies are still charged per kWh, so the all-in price nearly always stays positive, just much lower. Whether a supplier passes on a negative exchange part in full depends on the contract.' },
      { q: 'Why do plants keep running when prices are negative?', a: 'Because switching off can cost some plants more than paying briefly: coal and nuclear units need hours to restart, combined heat and power plants also supply heat, and older wind and solar installations receive fixed payments whatever the exchange price. When cross-border lines are full, the surplus cannot flow abroad quickly enough either.' },
      { q: 'At what times do negative prices usually occur?', a: 'Mostly around midday, roughly 11 am to 4 pm, on sunny days, and above all at weekends and on public holidays when demand is low. Less often they occur at night in strong wind. In winter they are far rarer than between April and September because solar output is low. The daily view of the calculator shows how many quarter hours each recent day had.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const rows = ZONEN.filter((k) => k !== 'PL').map((k) => [NAME[k][1], h.num(z[k].ganz.neg), h.num(z[k].ganz.negTage), h.spot(z[k].tief.v, 2), h.date(z[k].tief.d)]);
      return `<h2>Negative quarter hours in recent weeks</h2>
${h.table(['Bidding zone', 'Quarter hours below zero', 'Days with negative prices', 'Lowest value', 'on'], rows, `${h.date(z['DE-LU'].ganz.von)} to ${h.date(z['DE-LU'].ganz.bis)}, day-ahead, source SMARD`, ['l', 'r', 'r', 'r', 'r'])}
<p>The count is based on the quarter-hourly values from ${h.src('smard')}. Since all zones are cleared in one joint auction, negative prices often hit several countries at once; how strongly depends on each country’s wind and solar capacity and on how full the border lines are.</p>
<h2>Why the all-in price almost never turns negative</h2>
<p>Each German kilowatt-hour carries fixed amounts whatever the exchange price: the grid fee, electricity tax under ${h.src('stromstg')}, the levies and the concession fee, with VAT under ${h.src('ustg')} on top. In the Netherlands the energy tax from the ${h.src('wbm')} and VAT do the same. Only if the exchange price fell further than that sum would the all-in price go negative, and ${endDe(z['DE-LU'].tief.v) > 0 && endNl(z.NL.tief.v) > 0 ? 'that did not happen' : 'that did happen'} in the period shown.</p>
<h2>What you can do with it</h2>
<p>Use that can be moved belongs in these quarter hours: charging the car, a heat pump with storage, a washing machine with a delay timer. ${h.a('fenster', 'Cheapest hour')} finds them for tomorrow once prices are published, and ${h.a('vergleich', 'Dynamic electricity tariff')} shows how such days add up over a month.</p>`;
    },
  },
  nl: {
    slug: 'negatieve-stroomprijs',
    nav: 'Negatieve stroomprijs',
    card: 'Hoe vaak de beursprijs onder nul zakte en wat een huishouden ervan merkt.',
    title: 'Negatieve stroomprijs: hoe vaak, wanneer en wat het oplevert',
    description: 'Negatieve stroomprijs op de beurs: hoeveel kwartieren de laatste weken onder nul lagen, op welke tijden, en waarom je eindprijs bijna nooit negatief wordt.',
    h1: 'Negatieve stroomprijs: wanneer de beurs betaalt voor afname',
    intro: 'De rekenhulp telt voor elke recente dag de kwartieren met een negatieve beursprijs. Je kunt de weergave omzetten naar dag- of maandgemiddelden.',
    resume: (h) => {
      const { nl } = D(h);
      const g = nl.ganz;
      return `Een negatieve stroomprijs betekent dat er op de day-aheadmarkt voor een kwartier meer stroom wordt aangeboden dan gevraagd, zodat producenten betalen om hun stroom kwijt te kunnen. Dat gebeurt vooral op zonnige, winderige dagen met weinig verbruik, zoals rond het middaguur in het weekend, als zonnepanelen op volle kracht draaien en logge centrales niet snel genoeg terugschakelen. In de Nederlandse biedzone lagen van ${h.date(g.von)} tot ${h.date(g.bis)} ${h.num(g.neg)} kwartieren onder nul, verdeeld over ${h.num(g.negTage)} van de ${h.num(g.tage)} dagen. De laagste waarde was ${h.spot(nl.tief.v, 2)} op ${h.date(nl.tief.d)} om ${nl.tief.uhr} uur. Met een dynamisch contract krijg je dan zelden geld terug: de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} per kWh blijft gelijk, de inkoopvergoeding ook, en over alles gaat ${h.num(h.P.nl.btw * 100)} % btw. Zelfs bij de laagste beursprijs van die periode was de eindprijs zonder inkoopvergoeding nog ongeveer ${h.ct(endNl(nl.tief.v))}. Goedkoop is zo’n kwartier wel, en wie verbruik kan verschuiven, legt het precies daar.`;
    },
    faqs: () => [
      { q: 'Krijg ik geld bij een negatieve stroomprijs?', a: 'Met een vast of variabel contract niet: je betaalt je gewone prijs per kWh. Met een dynamisch contract zakt alleen het beursdeel onder nul, terwijl energiebelasting en inkoopvergoeding per kWh blijven staan, met btw erover. Je eindprijs blijft daardoor bijna altijd positief, alleen veel lager. Of je leverancier een negatief beursdeel volledig doorgeeft, staat in je contract.' },
      { q: 'Waarom blijven centrales draaien bij negatieve prijzen?', a: 'Omdat uitzetten voor sommige installaties duurder is dan even bijbetalen: kolen- en kerncentrales hebben uren nodig om weer op te starten, warmtekrachtcentrales leveren tegelijk warmte, en oudere wind- en zonneparken krijgen een vaste vergoeding los van de beursprijs. Als de grensverbindingen vol zitten, kan het overschot ook niet snel genoeg naar het buitenland.' },
      { q: 'Op welke tijden is de stroomprijs negatief?', a: 'Vooral rond het middaguur, ongeveer van 11 tot 16 uur, op zonnige dagen, en het meest in weekenden en op feestdagen met weinig vraag. Minder vaak gebeurt het ’s nachts bij harde wind. In de winter is het veel zeldzamer dan tussen april en september, omdat de zon dan weinig levert. De dagweergave van de rekenhulp laat per dag zien hoeveel kwartieren het waren.' },
    ],
    body: (h) => {
      const { z } = D(h);
      const order: Zone[] = ['NL', 'BE', 'DE-LU', 'AT'];
      const rows = order.map((k) => [NAME[k][2], h.num(z[k].ganz.neg), h.num(z[k].ganz.negTage), h.spot(z[k].tief.v, 2), h.date(z[k].tief.d)]);
      return `<h2>Negatieve kwartieren in de afgelopen weken</h2>
${h.table(['Biedzone', 'Kwartieren onder nul', 'Dagen met negatieve prijzen', 'Laagste waarde', 'op'], rows, `${h.date(z.NL.ganz.von)} tot ${h.date(z.NL.ganz.bis)}, day-ahead, bron SMARD`, ['l', 'r', 'r', 'r', 'r'])}
<p>De telling is gebaseerd op de kwartierwaarden van ${h.src('smard')}. Omdat alle zones in één gezamenlijke veiling worden berekend, vallen negatieve prijzen vaak in meerdere landen tegelijk; hoe sterk, hangt af van de wind- en zonnecapaciteit van elk land en van hoe vol de grensverbindingen zijn.</p>
<h2>Waarom de eindprijs bijna nooit negatief wordt</h2>
<p>Op elke kilowattuur zit een vast bedrag aan energiebelasting uit de ${h.src('wbm')}, los van de beursprijs, plus de inkoopvergoeding van je leverancier en de btw. Pas als de beursprijs dieper zou zakken dan die som, wordt de eindprijs negatief; in de getoonde periode ${endNl(z.NL.tief.v) > 0 ? 'gebeurde dat niet' : 'gebeurde dat wel'}. Heb je zonnepanelen, dan kan teruglevering in zulke kwartieren bij een dynamisch contract weinig of niets opleveren; hoe dat wordt verrekend, staat in je contract.</p>
<h2>Wat je ermee kunt</h2>
<p>Verbruik dat je kunt verschuiven, hoort in deze kwartieren: de auto laden, een warmtepomp met buffervat, de wasmachine met uitgestelde start. ${h.a('fenster', 'Goedkoopste uur')} vindt ze voor morgen zodra de prijzen gepubliceerd zijn, en ${h.a('vergleich', 'Dynamisch energiecontract')} laat zien hoe zulke dagen over een maand uitpakken.</p>`;
    },
  },
});
