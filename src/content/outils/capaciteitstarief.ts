import { defineGuide, type Helpers } from '../../lib/guide-types';
import { capaciteit, NETGEBIEDEN } from '../../lib/engine/haus';

/** Capaciteitstarief (Vlaanderen) : tarieven 2026 per netgebied van Fluvius, gemiddelde maandpiek, minimum 2,5 kW, btw 6 %. */
function D(h: Helpers) {
  const c = h.P.be.capaciteit;
  const gem = { piek: c.gemiddelde_piek_kw, kwh: c.gemiddeld_verbruik_kwh };
  const rows = NETGEBIEDEN.map((g) => ({ g, laag: capaciteit({ gebied: g, piekKw: c.min_kw, kwh: gem.kwh }), mid: capaciteit({ gebied: g, piekKw: gem.piek, kwh: gem.kwh }), hoog: capaciteit({ gebied: g, piekKw: 7, kwh: 6000 }) }));
  const sorted = rows.slice().sort((a, b) => a.mid.totaal - b.mid.totaal);
  const ant = rows.find((r) => r.g === 'Antwerpen')!;
  const kw1 = ant.mid.perKw;
  return { c, gem, rows, laagste: sorted[0], hoogste: sorted[sorted.length - 1], ant, kw1, btw: h.P.be.btw };
}

export default defineGuide({
  id: 'capaciteitstarief',
  group: 'laender',
  order: 25,
  tool: 'capaciteit',
  zone: 'BE',
  related: ['belgie', 'fenster', 'laden', 'thuisbatterij'],
  sources: ['fluviusCapaciteit', 'fluviusTarieven', 'creg', 'cwapeOres', 'smard', 'smardLizenz'],
  nl: {
    slug: 'capaciteitstarief',
    nav: 'Capaciteitstarief',
    card: 'Wat het capaciteitstarief in jouw Fluvius-netgebied kost en wat een lagere piek bespaart.',
    title: 'Capaciteitstarief 2026: kosten per netgebied in Vlaanderen',
    description: 'Capaciteitstarief 2026: kies je Fluvius-netgebied, vul je gemiddelde maandpiek en verbruik in en zie je netkosten per jaar en wat 1 kW minder piek bespaart.',
    h1: 'Capaciteitstarief: wat je piekverbruik in Vlaanderen kost',
    intro: 'Kies je netgebied en vul je gemiddelde maandpiek en je jaarverbruik in. De rekenhulp gebruikt de tarieven 2026 van Fluvius en telt 6 % btw erbij.',
    resume: (h) => {
      const { c, gem, laagste, hoogste, ant, kw1, btw } = D(h);
      return `Sinds ${c.sinds} betaal je in Vlaanderen een groot deel van de netkosten niet meer per kilowattuur, maar volgens je piekverbruik: het capaciteitstarief. Fluvius meet met de digitale meter elke maand het hoogste kwartiervermogen, je maandpiek. Op je factuur telt het gemiddelde van je laatste twaalf maandpieken, met een minimum van ${h.num(c.min_kw, 1)} kW, ook als je werkelijke piek lager ligt. Die piek vermenigvuldigt Fluvius met een vast bedrag per kW per jaar, dat per netgebied verschilt: in 2026 van ${h.eur(laagste.mid.perKw / (1 + btw), 2)} tot ${h.eur(hoogste.mid.perKw / (1 + btw), 2)} exclusief btw. Daarnaast betaal je nog een deel per kWh en een vast bedrag voor databeheer. Een gemiddeld gezin met ${h.num(gem.kwh)} kWh heeft volgens Fluvius een piek van ${h.num(gem.piek, 2)} kW. In het netgebied Antwerpen kost dat met ${h.num(btw * 100)} % btw ${h.eur(ant.mid.cap)} aan capaciteit en ${h.eur(ant.mid.totaal)} aan distributienetkosten in totaal per jaar. Elke kilowatt minder piek bespaart daar ${h.eur(kw1)} per jaar. Wie wasmachine, droogkast, oven en laadpaal niet tegelijk laat draaien, houdt de piek laag. Energieprijs, heffingen en accijns komen er nog bovenop.`;
    },
    faqs: () => [
      { q: 'Hoe verlaag ik mijn maandpiek?', a: 'Door grote verbruikers niet tegelijk te laten draaien. Een laadpaal, een kookplaat, een droogkast en een warmtepomp vragen elk enkele kilowatt; samen in hetzelfde kwartier drijven ze je piek op. Laat de auto ’s nachts met een lager vermogen laden, start de vaatwasser uitgesteld en zet een warmtepomp of boiler op een slimme sturing. In Mijn Fluvius zie je per kwartier wanneer je piek viel.' },
      { q: 'Wat betaal ik met een klassieke meter?', a: 'Een klassieke meter kan geen pieken meten. Fluvius rekent dan een vast bedrag aan dat overeenkomt met een piek van 2,5 kW, vermenigvuldigd met het tarief per kW van je netgebied. Volgens Fluvius is de kost per kWh bij een analoge meter wel hoger dan bij een digitale meter. Een digitale meter kun je gratis aanvragen.' },
      { q: 'Geldt het capaciteitstarief ook in Wallonië en Brussel?', a: 'De regels verschillen per gewest. In Wallonië bestaat in de tarieven van ORES een capaciteitscomponent, maar die is volgens de CWaPE voor 2026 tot 2029 vastgezet op 0 euro per kW. Brussel heeft eigen distributienettarieven. Deze rekenhulp gebruikt alleen de tarieven van Fluvius in Vlaanderen; voor de andere gewesten kijk je op de website van je netbeheerder.' },
    ],
    body: (h) => {
      const { c, rows, gem, btw } = D(h);
      const t = rows.map((r) => [r.g, h.eur(r.mid.perKw / (1 + btw), 2), h.eur(r.laag.totaal), h.eur(r.mid.totaal), h.eur(r.hoog.totaal)]);
      return `<h2>Tarieven en kosten per netgebied</h2>
${h.table(['Netgebied', 'Per kW per jaar, excl. btw', `Piek ${h.num(c.min_kw, 1)} kW`, `Piek ${h.num(gem.piek, 2)} kW`, 'Piek 7 kW, 6.000 kWh'], t, `Distributienetkosten afname per jaar incl. ${h.num(btw * 100)} % btw: capaciteit, kWh-tarieven en databeheer. ${h.num(gem.kwh)} kWh tenzij anders vermeld`, ['l', 'r', 'r', 'r', 'r'])}
<p>De tarieven komen uit de tarieflijsten 2026 van ${h.src('fluviusTarieven', 'Fluvius')}, die zonder btw zijn opgesteld. Per kWh rekenen we het nettarief, de openbaredienstverplichtingen en de toeslagen van je netgebied; databeheer kost ${h.eur(c.databeheer_eur, 2)} per jaar exclusief btw. Hoe de maandpiek en het gemiddelde over twaalf maanden worden bepaald, legt ${h.src('fluviusCapaciteit', 'Fluvius')} uit. Volgens de ${h.src('creg', 'CREG')} geldt op alle onderdelen van de elektriciteitsfactuur 6 % btw.</p>
<h2>Piek en verbruik</h2>
<p>Het capaciteitstarief beloont spreiden, niet alleen besparen. Wie zijn auto laadt, laat dat beter met een lager vermogen over de nacht verspreid gebeuren dan in één kwartier met volle kracht. Wanneer de stroom op de beurs goedkoop is, zie je op ${h.a('belgie', 'stroomprijs België')} en ${h.a('fenster', 'goedkoopste uur')}; met een dynamisch contract betaal je de energie volgens die uurprijs, terwijl de netkosten van je piek afhangen. Een thuisbatterij kan pieken afvlakken; wat ze op prijsverschillen verdient, rekent ${h.a('thuisbatterij', 'thuisbatterij')} voor Nederland.</p>
<h2>Wallonië en Brussel</h2>
<p>Volgens de tarieven van ORES die de ${h.src('cwapeOres', 'CWaPE')} publiceert, staat de capaciteitscomponent in Wallonië voor 2026 tot 2029 op 0 euro per kW. Voor Brussel en Wallonië gelden andere nettarieven dan in de tabel; vraag ze op bij je netbeheerder.</p>`;
    },
  },
  en: {
    slug: 'capacity-tariff-flanders',
    nav: 'Capacity tariff Flanders',
    card: 'What the Flemish capacity tariff costs in your Fluvius area and what a lower peak saves.',
    title: 'Capacity tariff Flanders 2026: cost per kW by grid area',
    description: 'Capacity tariff in Flanders 2026: choose your Fluvius grid area, enter your average monthly peak and use, see your yearly grid costs and what 1 kW less saves.',
    h1: 'Capacity tariff in Flanders: what your peak demand costs',
    intro: 'Choose your grid area and enter your average monthly peak and annual use. The calculator applies the 2026 Fluvius tariffs and adds 6% VAT.',
    resume: (h) => {
      const { c, gem, laagste, hoogste, ant, kw1, btw } = D(h);
      return `Since ${c.sinds}, households in Flanders have paid most of their grid costs not per kilowatt-hour but according to their peak demand: the capacity tariff, capaciteitstarief in Dutch. With the digital meter, the grid operator Fluvius records the highest quarter-hour power of each month, your monthly peak. Your bill uses the average of your last twelve monthly peaks, with a minimum of ${h.num(c.min_kw, 1)} kW even if your real peak is lower. Fluvius multiplies that peak by a fixed amount per kW per year that differs by grid area: in 2026 from ${h.eur(laagste.mid.perKw / (1 + btw), 2)} to ${h.eur(hoogste.mid.perKw / (1 + btw), 2)} before VAT. On top come a per-kWh part and a fixed data management fee. According to Fluvius, an average household using ${h.num(gem.kwh)} kWh has a peak of ${h.num(gem.piek, 2)} kW. In the Antwerp grid area that costs ${h.eur(ant.mid.cap)} in capacity charges and ${h.eur(ant.mid.totaal)} in total distribution charges a year, ${h.num(btw * 100)}% VAT included. Each kilowatt less peak saves ${h.eur(kw1)} a year there. Not running the washing machine, dryer, oven and car charger at the same time keeps the peak low. Energy, levies and excise duty come on top.`;
    },
    faqs: () => [
      { q: 'How can I lower my monthly peak in Flanders?', a: 'By not running large loads at the same time. A car charger, a hob, a tumble dryer and a heat pump each draw several kilowatts; together in one quarter hour they push your peak up. Charge the car overnight at lower power, delay the dishwasher and put a heat pump or water heater on smart control. Mijn Fluvius shows per quarter hour when your peak occurred.' },
      { q: 'What do I pay with an old analogue meter?', a: 'An analogue meter cannot measure peaks, so Fluvius charges a fixed amount equal to a 2.5 kW peak times the per-kW rate of your grid area. According to Fluvius the cost per kWh is higher with an analogue meter than with a digital one. You can ask Fluvius for a digital meter free of charge.' },
      { q: 'Does Wallonia or Brussels have a capacity tariff?', a: 'Rules differ by region. Wallonia’s ORES tariffs include a capacity component, but the regulator CWaPE has set it at zero euros per kW for 2026 to 2029. Brussels has its own distribution tariffs. This calculator only uses the Fluvius tariffs for Flanders; for the other regions, check your grid operator’s website.' },
    ],
    body: (h) => {
      const { c, rows, gem, btw } = D(h);
      const t = rows.map((r) => [r.g, h.eur(r.mid.perKw / (1 + btw), 2), h.eur(r.laag.totaal), h.eur(r.mid.totaal), h.eur(r.hoog.totaal)]);
      return `<h2>Rates and costs by grid area</h2>
${h.table(['Grid area', 'Per kW per year, excl. VAT', `Peak ${h.num(c.min_kw, 1)} kW`, `Peak ${h.num(gem.piek, 2)} kW`, 'Peak 7 kW, 6,000 kWh'], t, `Distribution charges per year incl. ${h.num(btw * 100)}% VAT: capacity, per-kWh rates and data management. ${h.num(gem.kwh)} kWh unless stated`, ['l', 'r', 'r', 'r', 'r'])}
<p>The rates come from the 2026 tariff sheets of ${h.src('fluviusTarieven', 'Fluvius')}, which are stated before VAT. Per kWh we add the network rate, public service obligations and surcharges of your grid area; data management costs ${h.eur(c.databeheer_eur, 2)} a year before VAT. ${h.src('fluviusCapaciteit', 'Fluvius')} explains how the monthly peak and the twelve-month average are set. According to the ${h.src('creg', 'CREG')}, 6% VAT applies to every part of the electricity bill.</p>
<h2>Peak and consumption</h2>
<p>The capacity tariff rewards spreading use, not only saving. Charging a car at lower power across the night costs less than one quarter hour at full power. When exchange power is cheap is on ${h.a('belgie', 'Belgium electricity price')} and ${h.a('fenster', 'cheapest hour')}; on a dynamic contract you pay energy at that hourly price, while grid costs follow your peak. A home battery can flatten peaks; what it earns from price gaps is on ${h.a('thuisbatterij', 'home battery Netherlands')}.</p>
<h2>Wallonia and Brussels</h2>
<p>In the ORES tariffs published by the ${h.src('cwapeOres', 'CWaPE')}, Wallonia’s capacity component is set at zero euros per kW for 2026 to 2029. Brussels and Wallonia have different grid tariffs from those in the table; ask your grid operator for them.</p>`;
    },
  },
});
