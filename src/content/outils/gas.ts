import { defineGuide, type Helpers } from '../../lib/guide-types';
import { CBS } from '../../lib/engine/markt';
import { gasPrijs } from '../../lib/engine/tarif';

/** Gasprijs vandaag (NL) : CBS-maandgemiddelde leveringstarief + energiebelasting (Wbm art. 59 a) + btw. Geen dagprijs uit beursdata. */
function D(_h: Helpers) {
  const m = CBS.maanden;
  const l = m.at(-1)!;
  const jaar = m.find((x) => x.maand === `${Number(l.maand.slice(0, 4)) - 1}${l.maand.slice(4)}`) ?? null;
  const g = gasPrijs(l.excl.gasVariabel as number);
  const rij = m.slice(-13);
  return { l, jaar, g, rij, transport: l.incl.gasTransport as number, totaalIncl: (l.incl.gasVariabel as number) + (l.incl.gasEb as number) };
}

export default defineGuide({
  id: 'gas',
  group: 'gas',
  order: 10,
  tool: 'gas',
  zone: 'NL',
  toolProps: { verbruik: 1000 },
  related: ['vergleich', 'preis', 'morgen'],
  sources: ['cbs', 'cbsLizenz', 'wbm', 'wetob'],
  nl: {
    slug: 'gasprijs-vandaag',
    nav: 'Gasprijs vandaag',
    card: 'Wat een kuub gas kost met energiebelasting en btw, naast het CBS-gemiddelde.',
    title: 'Gasprijs vandaag: prijs per m³ met energiebelasting en btw',
    description: 'Gasprijs vandaag per kubieke meter: leveringstarief, energiebelasting 2026 en btw opgeteld, naast het CBS-maandgemiddelde, met je eigen maandbedrag erbij.',
    h1: 'Gasprijs vandaag: wat een kubieke meter gas kost',
    intro: 'Vul de leveringsprijs van je contract en je jaarverbruik in. De rekenhulp telt energiebelasting en btw erbij en zet het naast het CBS-gemiddelde.',
    resume: (h) => {
      const { l, jaar, g, totaalIncl } = D(h);
      return `De gasprijs van vandaag bestaat voor een Nederlands huishouden uit drie delen per kubieke meter: de leveringsprijs van je leverancier, de energiebelasting en de btw. De energiebelasting is in 2026 ${h.eur(h.P.nl.eb_gas_eur_m3, 5)} per m³ exclusief btw, hetzelfde bedrag voor alle verbruik tot 170.000 m³ per jaar, zoals artikel 59 van de Wet belastingen op milieugrondslag bepaalt. Over het geheel komt ${h.num(h.P.nl.btw * 100)} % btw. Volgens het CBS was het gemiddelde leveringstarief voor een variabel gascontract in ${h.monat(l.maand)} ${h.eur(l.excl.gasVariabel as number, 4)} per m³ exclusief btw; met energiebelasting en btw wordt dat ${h.eur(g.totaal, 3)} per m³${jaar ? `, tegen ${h.eur((jaar.incl.gasVariabel as number) + (jaar.incl.gasEb as number), 3)} een jaar eerder` : ''}. Het CBS zelf komt inclusief btw op ${h.eur(totaalIncl, 3)}. Bij 1.000 m³ per jaar is dat ongeveer ${h.eur((1000 * g.totaal) / 12, 0)} per maand, zonder de vaste leveringskosten en het netbeheer, die je per aansluiting betaalt. Een dagelijkse beursprijs voor gas publiceren we niet: de dagprijzen van de gasbeurs zijn niet vrij te hergebruiken, en een dynamisch gascontract rekent met de dagprijs die je leverancier vaststelt.`;
    },
    faqs: () => [
      { q: 'Wat is een dynamische gasprijs?', a: 'Bij een dynamisch gascontract verandert de leveringsprijs elke dag. De leverancier leidt die af van de groothandelsprijs op de Nederlandse gasmarkt en telt er een vaste opslag bij; energiebelasting en btw komen daar nog bovenop. Anders dan bij stroom verandert de prijs per dag en niet per kwartier. Welke dagprijs en welke opslag gelden, staat in je contract en in de app van je leverancier.' },
      { q: 'Waarom is de energiebelasting op gas zo hoog?', a: 'Omdat de overheid met de energiebelasting het gebruik van aardgas duurder maakt dan dat van stroom, om de overstap naar elektrisch verwarmen aantrekkelijker te maken. In 2026 is de belasting op een kubieke meter gas hoger dan de gemiddelde leveringsprijs. Het tarief staat in artikel 59 van de wet; voor verbruik boven 170.000 m³ geldt een lager tarief.' },
      { q: 'Hoe reken ik de gasprijs om naar mijn maandbedrag?', a: 'Vermenigvuldig je jaarverbruik in m³ met de prijs per m³ inclusief belastingen en deel door twaalf. Tel daar de vaste leveringskosten en de netbeheerkosten per maand bij op, die op je contract staan. Het voorschot dat je leverancier vraagt, houdt bovendien rekening met de winter, waarin je veel meer verbruikt dan in de zomer.' },
    ],
    body: (h) => {
      const { l, g, rij, transport } = D(h);
      const r1 = [
        ['Leveringstarief (CBS, variabel)', h.eur(g.levering, 4)],
        ['Energiebelasting 2026', h.eur(g.eb, 5)],
        [`Btw ${h.num(h.P.nl.btw * 100)} %`, h.eur(g.btw, 4)],
        ['Totaal per m³', h.eur(g.totaal, 3)],
      ];
      const r2 = rij.slice().reverse().map((x) => [h.monat(x.maand), h.eur(x.incl.gasVariabel as number, 4), h.eur((x.incl.gasVariabel as number) + (x.incl.gasEb as number), 3)]);
      return `<h2>Opbouw van de gasprijs, ${h.monat(l.maand)}</h2>
${h.table(['Onderdeel', 'Per m³'], r1, 'Leveringstarief volgens CBS, energiebelasting volgens artikel 59 Wbm, btw 21 %', ['l', 'r'])}
<p>Het leveringstarief komt uit ${h.src('cbs')}, gepubliceerd onder licentie CC BY 4.0 (${h.src('cbsLizenz', 'voorwaarden')}). De energiebelasting staat in de ${h.src('wbm')}, de btw in de ${h.src('wetob')}. Daarnaast rekent het CBS voor het netbeheer van gas gemiddeld ${h.eur(transport, 2)} per jaar inclusief btw; dat bedrag hangt niet van je verbruik af.</p>
<h2>De laatste 13 maanden</h2>
${h.table(['Maand', 'Levering incl. btw', 'Met energiebelasting'], r2, 'Gemiddelde variabele gastarieven voor consumenten, CBS StatLine 85592NED', ['l', 'r', 'r'])}
<h2>Gas en stroom</h2>
<p>Voor stroom bestaat wel een openbare prijs per kwartier: die staat op ${h.a('preis', 'stroomprijs per uur')} en ${h.a('morgen', 'stroomprijs morgen')}. Of een dynamisch stroomcontract voor jou goedkoper is dan een variabel, rekent ${h.a('vergleich', 'dynamisch energiecontract')} uit.</p>`;
    },
  },
  en: {
    slug: 'dutch-gas-price',
    nav: 'Dutch gas price',
    card: 'What a cubic metre of gas costs with Dutch energy tax and VAT, next to the CBS average.',
    title: 'Gas price Netherlands today: per m³ with tax and VAT',
    description: 'Gas price in the Netherlands per cubic metre: supply rate, 2026 energy tax and VAT, next to the monthly CBS average, with a monthly amount for your use.',
    h1: 'Dutch gas price: what a cubic metre of gas costs',
    intro: 'Enter your contract’s supply price and annual use. The calculator adds energy tax and VAT and sets the result against the CBS average.',
    resume: (h) => {
      const { l, jaar, g } = D(h);
      return `The price of gas for a Dutch household has three parts per cubic metre: the supplier’s delivery price, the energy tax and VAT. In 2026 the energy tax is ${h.eur(h.P.nl.eb_gas_eur_m3, 5)} per m³ before VAT, the same rate for all use up to 170,000 m³ a year, as set by article 59 of the Environmental Taxes Act, and ${h.num(h.P.nl.btw * 100)}% VAT is charged on the total. According to Statistics Netherlands (CBS), the average delivery rate on a variable gas contract in ${h.monat(l.maand)} was ${h.eur(l.excl.gasVariabel as number, 4)} per m³ before VAT; with energy tax and VAT that comes to ${h.eur(g.totaal, 3)} per m³${jaar ? `, against ${h.eur((jaar.incl.gasVariabel as number) + (jaar.incl.gasEb as number), 3)} a year earlier` : ''}. At 1,000 m³ a year that is about ${h.eur((1000 * g.totaal) / 12, 0)} a month, before the fixed supply charge and network costs paid per connection. We do not publish a daily gas exchange price: daily prices from the gas exchange are not free to reuse, and a dynamic gas contract bills at the daily price the supplier sets. In the Netherlands the tax on a cubic metre is currently larger than the supply price itself.`;
    },
    faqs: () => [
      { q: 'What is a dynamic gas price in the Netherlands?', a: 'On a dynamic gas contract the delivery price changes every day. The supplier derives it from the wholesale price on the Dutch gas market and adds a fixed margin, with energy tax and VAT on top. Unlike electricity, the price changes per day rather than per quarter hour. The daily price and margin that apply are shown in your contract and your supplier’s app.' },
      { q: 'Why is the Dutch energy tax on gas so high?', a: 'Because the government uses energy tax to make natural gas more expensive than electricity, so that switching to electric heating becomes more attractive. In 2026 the tax on a cubic metre of gas is higher than the average delivery price. The rate is set in article 59 of the Environmental Taxes Act, with a lower rate above 170,000 m³.' },
      { q: 'How do I turn the gas price into a monthly amount?', a: 'Multiply your annual use in cubic metres by the price per m³ including taxes and divide by twelve. Add the fixed supply charge and network costs per month from your contract. The advance payment your supplier asks for also allows for winter, when you use far more gas than in summer, so it is evened out across the year.' },
    ],
    body: (h) => {
      const { l, g, rij, transport } = D(h);
      const r1 = [
        ['Delivery rate (CBS, variable)', h.eur(g.levering, 4)],
        ['Energy tax 2026', h.eur(g.eb, 5)],
        [`VAT ${h.num(h.P.nl.btw * 100)}%`, h.eur(g.btw, 4)],
        ['Total per m³', h.eur(g.totaal, 3)],
      ];
      const r2 = rij.slice().reverse().map((x) => [h.monat(x.maand), h.eur(x.incl.gasVariabel as number, 4), h.eur((x.incl.gasVariabel as number) + (x.incl.gasEb as number), 3)]);
      return `<h2>Gas price breakdown, ${h.monat(l.maand)}</h2>
${h.table(['Component', 'Per m³'], r1, 'Delivery rate from CBS, energy tax under article 59 Wbm, 21% VAT', ['l', 'r'])}
<p>The delivery rate comes from ${h.src('cbs')}, published under the CC BY 4.0 licence (${h.src('cbsLizenz', 'terms')}). The energy tax is in the ${h.src('wbm')}, VAT in the ${h.src('wetob')}. CBS also gives an average gas network charge of ${h.eur(transport, 2)} a year including VAT, which does not depend on use.</p>
<h2>The last 13 months</h2>
${h.table(['Month', 'Delivery incl. VAT', 'With energy tax'], r2, 'Average variable gas rates for consumers, CBS StatLine 85592NED', ['l', 'r', 'r'])}
<h2>Gas and electricity</h2>
<p>Electricity does have a public price per quarter hour: see ${h.a('preis', 'hourly electricity prices')} and ${h.a('morgen', 'electricity price tomorrow')}. Whether a dynamic power contract beats a variable one for you is worked out on ${h.a('vergleich', 'dynamic electricity tariff')}.</p>`;
    },
  },
});
