import { defineGuide, type Helpers } from '../../lib/guide-types';
import { energiebelasting } from '../../lib/engine/haus';
import { nlCbs } from '../../lib/tool-props';

/** Energiebelasting 2026 (NL) : tarieven per schijf (Belastingdienst), vermindering per aansluiting, btw ; voorstel 2027 afgerond. */
function D(h: Helpers) {
  const P = h.P;
  const e = P.nl.eb2026;
  const btw = 1 + P.nl.btw;
  const c = P.nl.verbruik_cbs2024.totaal;
  const gem = energiebelasting({ kwh: c.stroom, m3: c.gas, vermindering: true });
  const voorbeelden = [[1500, 600], [2500, 1000], [3500, 1300], [5000, 1800]].map(([kwh, m3]) => ({ kwh, m3, r: energiebelasting({ kwh, m3, vermindering: true }) }));
  const n = nlCbs();
  const k27 = P.nl.eb2027_ct;
  return { e, btw, c, gem, voorbeelden, n, k27, verm: P.nl.vermindering_eur, verm25: P.nl.vermindering_2025_eur };
}
const grens = (h: Helpers, van: number, tot: number | null, eenheid: string) => (tot === null ? `${h.T('über', 'over', 'boven')} ${h.num(van)} ${eenheid}` : `${h.num(van)} ${h.T('bis', 'to', 'tot')} ${h.num(tot)} ${eenheid}`);

export default defineGuide({
  id: 'energiebelasting',
  group: 'tarif',
  order: 25,
  tool: 'eb',
  zone: 'NL',
  related: ['gas', 'jetzt', 'haushalt', 'wpkosten', 'saldering'],
  sources: ['belastingdienstEb', 'wbm', 'wetob', 'rijksEb', 'sleutel2027', 'cbs', 'cbsVerbruik', 'cbsLizenz'],
  nl: {
    slug: 'energiebelasting-2026',
    nav: 'Energiebelasting 2026',
    card: 'Tarieven per schijf voor stroom en gas, de vermindering en wat je per jaar betaalt.',
    title: 'Energiebelasting 2026: tarieven stroom en gas per schijf',
    description: 'Energiebelasting 2026 op stroom en gas: alle tarieven per schijf van de Belastingdienst, de vermindering per aansluiting en wat je per jaar zelf betaalt.',
    h1: 'Energiebelasting 2026: wat je per kWh en per m³ betaalt',
    intro: 'Vul je jaarverbruik van stroom en gas in. De rekenhulp rekent de energiebelasting per schijf uit, trekt de vermindering af en telt de btw erbij.',
    resume: (h) => {
      const { e, btw, c, gem, verm } = D(h);
      return `Energiebelasting is de belasting die je leverancier per kilowattuur stroom en per kubieke meter gas int en aan de Belastingdienst afdraagt. In 2026 is het tarief voor stroom ${h.eur(e.stroom[0].tarief, 5)} per kWh tot 10.000 kWh per jaar en voor gas ${h.eur(e.gas[0].tarief, 5)} per m³ tot 170.000 m³, beide exclusief btw. Daarboven gelden lagere tarieven, die voor huishoudens zelden van belang zijn. Met ${h.num(h.P.nl.btw * 100)} % btw kost een kilowattuur dus ${h.eur(e.stroom[0].tarief * btw, 4)} aan belasting en een kuub gas ${h.eur(e.gas[0].tarief * btw, 4)}. Daartegenover staat de vermindering energiebelasting van ${h.eur(verm, 2)} per elektriciteitsaansluiting met een verblijfsfunctie, inclusief btw ${h.eur(verm * btw, 2)}, die je leverancier in mindering brengt. Een gemiddeld huishouden met ${h.num(c.stroom)} kWh en ${h.num(c.gas)} m³ volgens het CBS betaalt ${h.eur(gem.stroomIncl)} op stroom en ${h.eur(gem.gasIncl)} op gas; na de vermindering blijft ${h.eur(gem.incl)} per jaar over, ongeveer ${h.eur(gem.maand)} per maand. Wie weinig stroom gebruikt, krijgt via de vermindering meer terug dan hij op stroom betaalt. De tarieven staan in artikel 59 van de Wet belastingen op milieugrondslag.`;
    },
    faqs: () => [
      { q: 'Wie krijgt de vermindering energiebelasting?', a: 'Iedereen met een elektriciteitsaansluiting op een adres met een verblijfsfunctie, zoals een woning. De leverancier verrekent haar automatisch op je energierekening, verdeeld over het jaar. Een aansluiting zonder verblijfsfunctie, zoals een losse garagebox met een eigen meter, valt erbuiten. Het bedrag is per aansluiting, niet per persoon: een groot huishouden krijgt dus evenveel als een alleenstaande.' },
      { q: 'Betaal ik energiebelasting over teruggeleverde zonnestroom?', a: 'Je betaalt energiebelasting over de stroom die je van het net afneemt. Tot en met 2026 trekt de salderingsregeling teruggeleverde stroom daar eerst van af, zodat je over het verschil belasting betaalt. Vanaf 2027 betaal je over alle afgenomen stroom belasting, ook als je evenveel teruglevert, en krijg je voor teruglevering alleen de vergoeding van je leverancier.' },
      { q: 'Gaat de energiebelasting in 2027 omhoog of omlaag?', a: 'Volgens het Belastingplan 2027 gaat het tarief op stroom omlaag en dat op gas omhoog. De fiscale sleuteltabel noemt afgerond 8,80 cent per kWh en 61,63 cent per m³ voor de eerste schijf, exclusief btw. Het wetsvoorstel is nog niet aangenomen; pas als de wet is aangenomen, staan de tarieven vast.' },
    ],
    body: (h) => {
      const { e, btw, voorbeelden, n, k27, verm, verm25 } = D(h);
      const sch = (t: typeof e.stroom, eenheid: string) => { let van = 0; return t.map((s) => { const r = [grens(h, van, s.tot, eenheid), h.eur(s.tarief, 5), h.eur(s.tarief * btw, 5)]; van = s.tot ?? van; return r; }); };
      const vb = voorbeelden.map((v) => [`${h.num(v.kwh)} kWh`, `${h.num(v.m3)} m³`, h.eur(v.r.stroomIncl), h.eur(v.r.gasIncl), h.eur(-v.r.verminderingIncl), h.eur(v.r.incl)]);
      return `<h2>Tarieven 2026 per schijf</h2>
${h.table(['Stroom per jaar', 'Excl. btw', 'Incl. btw'], sch(e.stroom, 'kWh'), 'Energiebelasting op elektriciteit 2026 per kWh; boven 10 mln kWh het tarief voor niet-zakelijk verbruik', ['l', 'r', 'r'])}
${h.table(['Gas per jaar', 'Excl. btw', 'Incl. btw'], sch(e.gas, 'm³'), 'Energiebelasting op aardgas 2026 per m³', ['l', 'r', 'r'])}
<p>De tarieven staan in de ${h.src('belastingdienstEb', 'aangifte energiebelasting 2026 van de Belastingdienst')} en in de ${h.src('wbm')}. De vermindering is in 2026 ${h.eur(verm, 2)} exclusief btw, tegen ${h.eur(verm25, 2)} in 2025; de ${h.src('rijksEb', 'Rijksoverheid')} noemt ${h.eur(Math.round(verm * btw))} inclusief btw. De btw van 21 % staat in de ${h.src('wetob')}.</p>
<h2>Wat je per jaar betaalt</h2>
${h.table(['Stroom', 'Gas', 'Op stroom', 'Op gas', 'Vermindering', 'Totaal'], vb, 'Energiebelasting per jaar inclusief btw, met de vermindering voor één woning', ['r', 'r', 'r', 'r', 'r', 'r'])}
<h2>Energieprijzen 2026 en het voorstel voor 2027</h2>
<p>Volgens ${h.src('cbs', 'CBS StatLine 85592NED')} kostte stroom met een variabel contract in ${h.monat(n.maand)} gemiddeld ${h.ct(n.stroomCt, 2)} en gas ${h.eur(n.gasM3, 3)} per m³, telkens inclusief energiebelasting en btw. Voor 2027 noemt de ${h.src('sleutel2027', 'fiscale sleuteltabel bij het Belastingplan 2027')} afgerond ${h.num(k27.stroom1, 2)} cent per kWh en ${h.num(k27.gas1, 2)} cent per m³ in de eerste schijf, en een vermindering van ${h.eur(k27.vermindering_eur, 2)}, nog onder voorbehoud van de behandeling in het parlement. Wat de belasting bij jouw uurprijs betekent, zie je op ${h.a('jetzt', 'stroomprijs nu')}; de gasprijs per kuub op ${h.a('gas', 'gasprijs vandaag')}. Hoeveel een huishouden gemiddeld verbruikt, staat op ${h.a('haushalt', 'gemiddeld stroomverbruik')}, en wat een warmtepomp met deze tarieven bespaart op ${h.a('wpkosten', 'warmtepomp kosten')}.</p>`;
    },
  },
  en: {
    slug: 'energy-tax-netherlands-2026',
    nav: 'Energy tax Netherlands',
    card: 'Dutch energy tax rates on power and gas by band, the tax reduction and your yearly total.',
    title: 'Energy tax Netherlands 2026: power and gas rates by band',
    description: 'Dutch energy tax 2026 on electricity and gas: every rate by band from the Tax Administration, the reduction per connection and what your use costs each year.',
    h1: 'Dutch energy tax 2026: what you pay per kWh and per m³',
    intro: 'Enter your yearly electricity and gas use. The calculator applies the energy tax band by band, deducts the tax reduction and adds VAT.',
    resume: (h) => {
      const { e, btw, c, gem, verm } = D(h);
      return `The Dutch energy tax, energiebelasting, is charged by your supplier on every kilowatt-hour of electricity and every cubic metre of gas and passed on to the Tax Administration. In 2026 the rate is ${h.eur(e.stroom[0].tarief, 5)} per kWh up to 10,000 kWh a year and ${h.eur(e.gas[0].tarief, 5)} per m³ of gas up to 170,000 m³, both before VAT. Lower rates apply above those bands, which rarely matter for households. With ${h.num(h.P.nl.btw * 100)}% VAT a kilowatt-hour therefore carries ${h.eur(e.stroom[0].tarief * btw, 4)} of tax and a cubic metre of gas ${h.eur(e.gas[0].tarief * btw, 4)}. Against this stands the energy tax reduction of ${h.eur(verm, 2)} per electricity connection at a home, ${h.eur(verm * btw, 2)} including VAT, which your supplier deducts. An average household using ${h.num(c.stroom)} kWh and ${h.num(c.gas)} m³ according to CBS pays ${h.eur(gem.stroomIncl)} on electricity and ${h.eur(gem.gasIncl)} on gas; after the reduction ${h.eur(gem.incl)} a year remains, about ${h.eur(gem.maand)} a month. A household using little electricity gets more back through the reduction than it pays on power. The rates are set in article 59 of the Environmental Taxes Act.`;
    },
    faqs: () => [
      { q: 'Who gets the Dutch energy tax reduction?', a: 'Anyone with an electricity connection at an address with a residential function, such as a home. The supplier deducts it automatically from your energy bill, spread over the year. A connection without a residential function, such as a separate garage with its own meter, does not qualify. The amount is per connection, not per person, so a large household gets the same as someone living alone.' },
      { q: 'Do I pay Dutch energy tax on solar power I export?', a: 'You pay energy tax on the power you take from the grid. Until the end of 2026 net metering first subtracts what you exported, so you pay tax on the difference. From 2027 you pay tax on all power taken from the grid, even if you export as much, and exports earn only your supplier’s feed-in payment.' },
      { q: 'Will Dutch energy tax rise or fall in 2027?', a: 'Under the 2027 Tax Plan the rate on electricity goes down and the rate on gas goes up. The fiscal key table gives a rounded 8.80 cents per kWh and 61.63 cents per cubic metre for the first band, before VAT. The bill has not yet passed; the rates are only final once it is law.' },
    ],
    body: (h) => {
      const { e, btw, voorbeelden, n, k27, verm, verm25 } = D(h);
      const sch = (t: typeof e.stroom, eenheid: string) => { let van = 0; return t.map((s) => { const r = [grens(h, van, s.tot, eenheid), h.eur(s.tarief, 5), h.eur(s.tarief * btw, 5)]; van = s.tot ?? van; return r; }); };
      const vb = voorbeelden.map((v) => [`${h.num(v.kwh)} kWh`, `${h.num(v.m3)} m³`, h.eur(v.r.stroomIncl), h.eur(v.r.gasIncl), h.eur(-v.r.verminderingIncl), h.eur(v.r.incl)]);
      return `<h2>2026 rates by band</h2>
${h.table(['Electricity per year', 'Excl. VAT', 'Incl. VAT'], sch(e.stroom, 'kWh'), 'Energy tax on electricity 2026 per kWh; above 10 million kWh the non-business rate', ['l', 'r', 'r'])}
${h.table(['Gas per year', 'Excl. VAT', 'Incl. VAT'], sch(e.gas, 'm³'), 'Energy tax on natural gas 2026 per m³', ['l', 'r', 'r'])}
<p>The rates are in the ${h.src('belastingdienstEb', 'Dutch Tax Administration’s 2026 energy tax return')} and in the ${h.src('wbm')}. The reduction is ${h.eur(verm, 2)} before VAT in 2026, against ${h.eur(verm25, 2)} in 2025; the ${h.src('rijksEb', 'Dutch government')} gives ${h.eur(Math.round(verm * btw))} including VAT. The 21% VAT is set in the ${h.src('wetob')}.</p>
<h2>What you pay per year</h2>
${h.table(['Electricity', 'Gas', 'On power', 'On gas', 'Reduction', 'Total'], vb, 'Energy tax per year including VAT, with the reduction for one home', ['r', 'r', 'r', 'r', 'r', 'r'])}
<h2>Energy prices in 2026 and the 2027 proposal</h2>
<p>According to ${h.src('cbs', 'CBS StatLine 85592NED')}, power on a variable contract averaged ${h.ct(n.stroomCt, 2)} in ${h.monat(n.maand)} and gas ${h.eur(n.gasM3, 3)} per m³, energy tax and VAT included. For 2027 the ${h.src('sleutel2027', 'fiscal key table of the 2027 Tax Plan')} gives a rounded ${h.num(k27.stroom1, 2)} cents per kWh and ${h.num(k27.gas1, 2)} cents per m³ in the first band, and a reduction of ${h.eur(k27.vermindering_eur, 2)}, still subject to parliament. What the tax means at the current hourly price is on ${h.a('jetzt', 'electricity price now')}; the gas price per cubic metre on ${h.a('gas', 'Dutch gas price')}. Typical household use is on ${h.a('haushalt', 'average electricity consumption')}, and what a heat pump saves at these rates on ${h.a('wpkosten', 'heat pump costs')}.</p>`;
    },
  },
});
