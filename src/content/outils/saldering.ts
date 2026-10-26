import { defineGuide, type Helpers } from '../../lib/guide-types';
import { saldering, minVergoeding } from '../../lib/engine/eigen';
import { festVorgabe, kaleNl } from '../../lib/tool-props';
import { CBS } from '../../lib/engine/markt';

/** Einde salderingsregeling (NL, 1.1.2027) : voorbeeldhuishouden met de standaardwaarden van de rekenhulp. */
function D(h: Helpers) {
  const prijs = festVorgabe('NL');
  const kale = kaleNl();
  const verg = minVergoeding(kale);
  const s = h.P.nl.saldering;
  const ebIncl = h.P.nl.eb_stroom_eur_kwh * 100 * (1 + h.P.nl.btw);
  const vb = (opwek: number, direct: number, verbruik: number) => saldering({ opwek, direct, verbruik, prijsIncl: prijs, vergoeding: verg, kosten: 0 });
  const x = vb(3000, 0.3, 2500);
  const rijen = [
    { opwek: 2000, direct: 0.3, verbruik: 2500 },
    { opwek: 3000, direct: 0.3, verbruik: 2500 },
    { opwek: 3000, direct: 0.5, verbruik: 2500 },
    { opwek: 4500, direct: 0.3, verbruik: 3500 },
    { opwek: 6000, direct: 0.25, verbruik: 3500 },
  ].map((r) => ({ ...r, ...vb(r.opwek, r.direct, r.verbruik) }));
  return { prijs, kale, verg, s, ebIncl, x, rijen, maand: CBS.maanden.at(-1)!.maand };
}

export default defineGuide({
  id: 'saldering',
  group: 'tarif',
  order: 40,
  tool: 'saldering',
  zone: 'NL',
  related: ['terugleververgoeding', 'thuisbatterij', 'vergleich', 'negativ'],
  sources: ['rijksSaldering', 'acmSalderen', 'cbs', 'wbm', 'wetob'],
  nl: {
    slug: 'salderingsregeling-2027',
    nav: 'Salderingsregeling 2027',
    card: 'Wat het einde van salderen op 1 januari 2027 je per jaar kost, met je eigen opwek.',
    title: 'Salderingsregeling 2027: wat het einde je per jaar kost',
    description: 'Salderingsregeling stopt op 1 januari 2027: wat er verandert voor zonnepanelen, de minimale terugleververgoeding en wat het jouw huishouden per jaar kost.',
    h1: 'Salderingsregeling stopt in 2027: wat het jou per jaar kost',
    intro: 'Vul je opwek, je verbruik en het deel dat je direct zelf gebruikt in. De rekenhulp vergelijkt 2026, met salderen, met 2027 zonder.',
    resume: (h) => {
      const { x, s, verg, kale, prijs, ebIncl } = D(h);
      return `De salderingsregeling stopt op ${h.date(s.einde)}. Tot en met 31 december 2026 mag je de stroom die je zonnepanelen aan het net teruggeven wegstrepen tegen de stroom die je van het net haalt, tegen de volle prijs met energiebelasting en btw. Vanaf 2027 betaal je over alle stroom uit het net weer energiebelasting en btw, en krijg je voor teruggeleverde stroom alleen nog een terugleververgoeding van je leverancier. Die moet volgens de Rijksoverheid en de ACM tot ${h.date(s.min_vergoeding_tot)} minstens ${h.num(s.min_vergoeding_aandeel * 100)} % zijn van de kale leveringsprijs, dus zonder energiebelasting en btw. Bij de CBS-prijs van nu is dat ongeveer ${h.ct(verg, 2)}, tegen ${h.ct(prijs, 2)} die je met salderen bespaarde; alleen de energiebelasting is al ${h.ct(ebIncl, 2)} inclusief btw. Een voorbeeldhuis met 3.000 kWh opwek, 2.500 kWh verbruik en 30 % direct eigen verbruik (aanname) levert ${h.num(x.terug)} kWh terug en verliest daardoor zo’n ${h.eur(x.verlies)} per jaar. Wat je direct zelf verbruikt blijft even veel waard, dus de grootste hefboom is meer stroom gebruiken op het moment dat de zon schijnt. Een kale prijs van ${h.ct(kale, 2)} is het CBS-gemiddelde, niet je eigen contract.`;
    },
    faqs: (h) => {
      const { s } = D(h);
      return [
        { q: 'Kan mijn energieleverancier het einde van salderen uitstellen?', a: `Nee. De salderingsregeling is een wettelijke regeling en stopt voor iedereen op ${h.date(s.einde)}, ook als je contract langer doorloopt. Een leverancier mag wel zelf bepalen hoe hoog de terugleververgoeding daarna is, binnen de wettelijke ondergrens. Lees bij een contractverlenging na 2026 dus vooral de regels over terugleververgoeding en terugleverkosten, want daar zitten de verschillen tussen leveranciers.` },
        { q: 'Telt de jaarafrekening van 2026 nog helemaal mee voor salderen?', a: 'Ja, alle stroom die je tot en met 31 december 2026 teruglevert mag je nog wegstrepen tegen je verbruik in dezelfde periode. Loopt je afrekenjaar door in 2027, dan geldt salderen alleen voor het deel tot en met 31 december 2026. Noteer daarom je meterstanden van die dag, ook die van teruglevering, zodat je de afrekening kunt controleren en het gesaldeerde deel niet te klein uitvalt.' },
        { q: 'Moet ik na 2027 mijn zonnepanelen uitzetten?', a: 'Nee, zonnestroom die je direct zelf gebruikt blijft net zo veel waard als nu, omdat je die kilowattuur niet hoeft te kopen. Alleen het deel dat je teruglevert brengt minder op. Uitzetten kan pas zinvol zijn op momenten met een negatieve stroomprijs als je een dynamisch contract hebt, want dan kost terugleveren je geld. Een omvormer met een instelbare begrenzing helpt daarbij.' },
        { q: 'Hoe verhoog ik mijn directe eigen verbruik?', a: 'Door stroomvreters naar de zonnige uren te verplaatsen: de vaatwasser en wasmachine met een starttijd rond het middaguur, de elektrische auto overdag laden, de boiler of warmtepomp in de middag laten opwarmen. Elke kilowattuur die je zo zelf gebruikt in plaats van teruglevert, bespaart je het verschil tussen je stroomprijs en de terugleververgoeding. Met de rekenhulp hierboven zie je wat tien procent meer eigen verbruik oplevert.' },
      ];
    },
    body: (h) => {
      const { rijen, verg, prijs, maand, s } = D(h);
      const rows = rijen.map((r) => [`${h.num(r.opwek)} kWh`, `${h.num(r.verbruik)} kWh`, h.pct(r.direct, 0), `${h.num(r.terug)} kWh`, h.eur(r.waarde2026), h.eur(r.waarde2027), h.eur(r.verlies)]);
      return `<h2>Vijf huishoudens voor en na 2027</h2>
${h.table(['Opwek', 'Verbruik', 'Direct', 'Teruglevering', '2026', '2027', 'Verschil'], rows, `Waarde van de teruglevering per jaar. Prijs ${h.ct(prijs, 2)} incl. belastingen, vergoeding ${h.ct(verg, 2)} (wettelijk minimum), CBS ${h.monat(maand)}. Opwek, verbruik en eigen verbruik zijn aannames.`, ['r', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>De tabel laat zien waarom het einde van salderen niet iedereen even hard raakt. Wie meer opwekt dan hij verbruikt, saldeerde het overschot ook nu al niet: dat deel kreeg altijd al alleen de terugleververgoeding. Het verlies zit in de kilowatturen die tot 2026 tegen de volle prijs wegvallen tegen je afname, en die vanaf 2027 alleen de vergoeding opleveren.</p>
<h2>Wat de wet vastlegt</h2>
<p>De ${h.src('rijksSaldering', 'Rijksoverheid')} en de ${h.src('acmSalderen', 'ACM')} noemen dezelfde drie regels. Salderen stopt op ${h.date(s.einde)}. Tot ${h.date(s.min_vergoeding_tot)} is de terugleververgoeding minstens ${h.num(s.min_vergoeding_aandeel * 100)} % van de prijs die je betaalt voor stroom zonder energiebelasting en btw. Terugleverkosten mogen blijven, maar alleen voor kosten die de leverancier echt maakt om teruggeleverde stroom te verwerken; de ACM houdt toezicht en schrijft dat die kosten soms hoger kunnen uitvallen dan de vergoeding. Bij een dynamisch contract hangt de vergoeding af van de actuele stroomprijs per uur of kwartier. Hoe dat uitpakt staat op ${h.a('terugleververgoeding', 'terugleververgoeding')}.</p>
<h2>Waarom de energiebelasting het verschil maakt</h2>
<p>Met salderen bespaarde elke teruggeleverde kilowattuur ook de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} plus ${h.num(h.P.nl.btw * 100)} % btw, zoals vastgelegd in de ${h.src('wbm')} en de ${h.src('wetob')}. Na 2026 betaal je die belasting over alles wat je van het net haalt, ook ’s avonds als je overdag meer hebt teruggeleverd dan je ’s avonds afneemt. De jaarlijkse vermindering energiebelasting per aansluiting blijft bestaan en staat los van salderen.</p>
<h2>Wat je nu kunt doen</h2>
<p>Bekijk in de app van je omvormer hoeveel je in de zomermaanden teruglevert en verschuif verbruik naar de middag. Een ${h.a('thuisbatterij', 'thuisbatterij')} kan zonnestroom vasthouden voor de avond, maar is duur in verhouding tot wat ze bespaart. Wie een ${h.a('vergleich', 'dynamisch energiecontract')} overweegt, ziet op ${h.a('negativ', 'negatieve stroomprijs')} hoe vaak terugleveren rond het middaguur geld kost.</p>`;
    },
  },
  en: {
    slug: 'net-metering-netherlands-2027',
    nav: 'Net metering ends 2027 (NL)',
    card: 'What the end of Dutch net metering on 1 January 2027 costs a solar household per year.',
    title: 'Net metering Netherlands 2027: what the end costs you',
    description: 'Net metering in the Netherlands (salderingsregeling) ends on 1 January 2027: what changes for solar panels, the minimum feed-in payment and the cost per year.',
    h1: 'Dutch net metering ends in 2027: what it costs you per year',
    intro: 'Enter your solar output, your use and the share you consume directly. The calculator compares 2026, with net metering, against 2027 without it.',
    resume: (h) => {
      const { x, s, verg, prijs, ebIncl } = D(h);
      return `The Dutch net metering scheme, the salderingsregeling, ends on ${h.date(s.einde)}. Until 31 December 2026 households may offset the power their solar panels feed into the grid against the power they draw from it, at the full price including energy tax and VAT. From 2027 they pay energy tax and VAT on every kilowatt-hour taken from the grid, and the power they feed back only earns a feed-in payment from their supplier. According to the Dutch government and the competition authority ACM, that payment must be at least ${h.num(s.min_vergoeding_aandeel * 100)}% of the bare supply price, without energy tax and VAT, until ${h.date(s.min_vergoeding_tot)}. At the current CBS price that is roughly ${h.ct(verg, 2)}, against ${h.ct(prijs, 2)} saved through net metering; energy tax alone is ${h.ct(ebIncl, 2)} including VAT. An example home with 3,000 kWh of solar output, 2,500 kWh of use and 30% direct own use (assumption) feeds back ${h.num(x.terug)} kWh and loses about ${h.eur(x.verlies)} a year. Power used directly keeps its full value, so the biggest lever is using more electricity while the sun shines.`;
    },
    faqs: (h) => {
      const { s } = D(h);
      return [
        { q: 'Can a Dutch supplier postpone the end of net metering?', a: `No. Net metering is set by law and ends for everyone on ${h.date(s.einde)}, even if your contract runs longer. Suppliers do decide how high the feed-in payment is after that, within the legal minimum. When you renew a contract that runs past 2026, read the terms on feed-in payments and feed-in fees closely, because that is where suppliers differ.` },
        { q: 'Does my 2026 annual statement still count fully for net metering?', a: 'Yes. Everything you feed back up to and including 31 December 2026 may still be offset against your use over the same period. If your billing year runs into 2027, net metering only covers the part up to 31 December 2026. Write down your meter readings for that day, including the export register, so you can check the statement and make sure the netted part is not understated.' },
        { q: 'Should I switch off my solar panels after 2027?', a: 'No. Solar power you use directly keeps its full value, because you do not have to buy that kilowatt-hour. Only the part you feed back earns less. Switching off can make sense during hours with a negative power price if you are on a dynamic contract, since feeding back then costs money. An inverter with an adjustable export limit helps with that.' },
      ];
    },
    body: (h) => {
      const { rijen, verg, prijs, maand, s } = D(h);
      const rows = rijen.map((r) => [`${h.num(r.opwek)} kWh`, `${h.num(r.verbruik)} kWh`, h.pct(r.direct, 0), `${h.num(r.terug)} kWh`, h.eur(r.waarde2026), h.eur(r.waarde2027), h.eur(r.verlies)]);
      return `<h2>Five households before and after 2027</h2>
${h.table(['Output', 'Use', 'Direct', 'Fed back', '2026', '2027', 'Difference'], rows, `Value of feed-in per year. Price ${h.ct(prijs, 2)} incl. taxes, payment ${h.ct(verg, 2)} (legal minimum), CBS ${h.monat(maand)}. Output, use and own use are assumptions.`, ['r', 'r', 'r', 'r', 'r', 'r', 'r'])}
<p>The table shows why the end of net metering does not hit everyone equally. A home that produces more than it uses was never able to net the surplus: that part always earned only the feed-in payment. The loss lies in the kilowatt-hours that were offset at the full price until 2026 and only earn the payment from 2027.</p>
<h2>What the law sets</h2>
<p>The ${h.src('rijksSaldering', 'Dutch government')} and the ${h.src('acmSalderen', 'ACM')} state the same three rules. Net metering ends on ${h.date(s.einde)}. Until ${h.date(s.min_vergoeding_tot)} the feed-in payment is at least ${h.num(s.min_vergoeding_aandeel * 100)}% of the price you pay for electricity without energy tax and VAT. Feed-in fees remain allowed, but only for costs the supplier actually incurs to handle the power fed back; the ACM supervises them and notes they can sometimes exceed the payment. On a dynamic contract the payment follows the current hourly or quarter-hourly price, as explained on ${h.a('terugleververgoeding', 'Dutch feed-in tariff')}.</p>
<h2>Why energy tax makes the difference</h2>
<p>Under net metering, every kilowatt-hour fed back also saved the energy tax of ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} plus ${h.num(h.P.nl.btw * 100)}% VAT, as set in the ${h.src('wbm')} and the ${h.src('wetob')}. After 2026 that tax applies to everything drawn from the grid, including the evening power you used to cover with the surplus your panels exported during the day. The fixed annual energy tax reduction per connection stays and has nothing to do with net metering.</p>
<h2>What to do now</h2>
<p>Check in your inverter app how much you export in summer and move use to midday. A ${h.a('thuisbatterij', 'home battery')} can hold solar power for the evening but costs a lot compared with what it saves. If you are weighing a ${h.a('vergleich', 'dynamic electricity tariff')}, ${h.a('negativ', 'negative electricity prices')} shows how often feeding back around noon costs money.</p>`;
    },
  },
});
