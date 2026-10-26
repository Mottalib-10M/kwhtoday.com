import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster } from '../../lib/fakten';
import { minVergoeding } from '../../lib/engine/eigen';
import { kaleNl } from '../../lib/tool-props';

/** Terugleververgoeding (NL) : mechanisme, terugleverkosten, en wat de uurprijs rond de middag de laatste 30 dagen gaf. */
const ZON = [11, 12, 13, 14, 15];
function D(h: Helpers) {
  const w = fenster('NL', 30);
  const gem = (uren: number[]) => uren.reduce((s, u) => s + w.stunde[u], 0) / uren.length;
  const zon = gem(ZON);
  const avond = gem([18, 19, 20, 21]);
  const kale = kaleNl();
  const minimum = minVergoeding(kale);
  const blok = Array.from({ length: 8 }, (_, i) => ({ van: i * 3, gem: gem([i * 3, i * 3 + 1, i * 3 + 2]) }));
  return { w, zon, avond, kale, minimum, blok, s: h.P.nl.saldering };
}
const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

export default defineGuide({
  id: 'terugleververgoeding',
  group: 'tarif',
  order: 45,
  tool: 'negativ',
  zone: 'NL',
  zonen: ['BE', 'DE-LU'],
  related: ['saldering', 'thuisbatterij', 'negativ', 'vergleich'],
  sources: ['acmSalderen', 'rijksSaldering', 'smard', 'smardLizenz', 'cbs'],
  nl: {
    slug: 'terugleververgoeding',
    nav: 'Terugleververgoeding',
    card: 'Wat leveranciers betalen voor teruggeleverde stroom, terugleverkosten en de uurprijs.',
    title: 'Terugleververgoeding 2027: minimum, kosten en de uurprijs',
    description: 'Terugleververgoeding na het einde van salderen: het wettelijke minimum tot 2030, wat terugleverkosten zijn en wat je met een dynamisch contract per uur krijgt.',
    h1: 'Terugleververgoeding: wat je krijgt voor teruggeleverde stroom',
    intro: 'De teller hieronder toont hoe vaak de Nederlandse uurprijs onder nul zakte. Met een dynamisch contract kost terugleveren je op die momenten geld.',
    resume: (h) => {
      const { w, zon, avond, minimum, s } = D(h);
      return `De terugleververgoeding is het bedrag per kilowattuur dat je energieleverancier betaalt voor stroom die je zonnepanelen aan het net teruggeven. Tot en met 2026 valt het grootste deel daarvan weg tegen je verbruik door salderen; vanaf ${h.date(s.einde)} krijg je voor elke teruggeleverde kilowattuur alleen nog deze vergoeding. De leverancier bepaalt de hoogte zelf, maar volgens de ACM moet die redelijk zijn, en tot ${h.date(s.min_vergoeding_tot)} minstens ${h.num(s.min_vergoeding_aandeel * 100)} % van de prijs die je betaalt voor stroom zonder energiebelasting en btw. Bij de gemiddelde kale prijs van het CBS komt dat neer op ongeveer ${h.ct(minimum, 2)}. Daar tegenover staan terugleverkosten: een vast bedrag of een bedrag per teruggeleverde kilowattuur, dat volgens de ACM soms hoger kan uitvallen dan de vergoeding zelf. Met een dynamisch contract volgt de vergoeding de beursprijs per uur of kwartier. In de laatste ${h.num(w.n)} dagen was die tussen 11 en 16 uur, als panelen het meest leveren, gemiddeld ${h.spot(zon, 2)}, tegen ${h.spot(avond, 2)} tussen 18 en 22 uur. Op ${h.num(w.negativTage)} dagen zakte de prijs onder nul, samen ${h.num(w.negativViertel)} kwartieren.`;
    },
    faqs: () => [
      { q: 'Wat is het verschil tussen terugleververgoeding en terugleverkosten?', a: 'De vergoeding is wat de leverancier jou betaalt per teruggeleverde kilowattuur. Terugleverkosten zijn wat de leverancier jou in rekening brengt omdat je teruglevert, als vast bedrag per maand of per teruggeleverde kilowattuur. Voor je opbrengst telt het verschil tussen de twee. Vergelijk contracten daarom altijd op beide bedragen samen, en reken met je eigen teruglevering van vorig jaar uit de app van je omvormer of je jaarafrekening.' },
      { q: 'Mag mijn leverancier terugleverkosten rekenen?', a: 'Ja. Volgens de ACM mogen leveranciers die kosten doorberekenen aan klanten met zonnepanelen, zolang ze redelijk zijn en horen bij kosten die de leverancier maakt om de teruggeleverde stroom te verwerken. De ACM houdt daar toezicht op. Vind je de kosten onredelijk, dan kun je dat melden bij ConsuWijzer, het loket van de ACM voor consumenten, en overstappen naar een leverancier met lagere kosten.' },
      { q: 'Kost terugleveren met een dynamisch contract soms geld?', a: 'Ja, als de beursprijs onder nul zakt. De vergoeding volgt dan de negatieve prijs, zodat je betaalt voor elke kilowattuur die je op dat moment teruglevert. Dat gebeurt vooral op zonnige middagen in het voorjaar en de zomer met veel wind. Een omvormer die terugleveren tijdelijk kan begrenzen, of slim verbruik op die momenten, voorkomt dat. De teller bovenaan laat zien hoe vaak het de laatste tijd gebeurde.' },
    ],
    body: (h) => {
      const { w, blok, minimum, kale, s } = D(h);
      const rows = blok.map((b) => [`${hh(b.van)} tot ${hh(b.van + 3)}`, h.spot(b.gem, 2), b.gem / 10 < minimum ? 'lager' : 'hoger']);
      return `<h2>Wat een uur terugleveren opbracht</h2>
${h.table(['Tijdstip', 'Gemiddelde beursprijs', 'Tegen het minimum van een vast contract'], rows, `Nederland, ${h.date(w.von)} tot en met ${h.date(w.bis)}, day-aheadprijs zonder btw, bron SMARD. Minimum: ${h.num(s.min_vergoeding_aandeel * 100)} % van de kale CBS-prijs, ${h.ct(minimum, 2)}.`, ['l', 'r', 'l'])}
<p>De beursprijs is wat een dynamisch contract per uur als basis neemt. Of je leverancier daar btw bij optelt of een vergoeding van aftrekt, staat in je contract. Juist in de uren dat zonnepanelen het meest leveren, ligt de prijs vaak het laagst, omdat dan heel Nederland tegelijk teruglevert. Zakt de prijs in die uren onder het wettelijke minimum van een vast contract, de helft van de kale prijs (nu ${h.ct(kale, 2)} gemiddeld volgens het ${h.src('cbs', 'CBS')}), dan levert zo’n vast contract per teruggeleverde kilowattuur meer op dan de uurprijs. In de tabel staat per blok of dat de laatste 30 dagen zo was. Of die ondergrens ook voor dynamische contracten geldt en hoe die dan wordt berekend, beschrijven de ${h.src('rijksSaldering', 'Rijksoverheid')} en de ACM niet apart; vraag het je leverancier.</p>
<h2>Waar je op let bij een nieuw contract</h2>
<p>Kijk naar drie bedragen samen: de vergoeding per teruggeleverde kilowattuur, de terugleverkosten per kilowattuur of per maand, en de vaste leveringskosten. Een contract met een hoge vergoeding en hoge terugleverkosten kan slechter uitpakken dan een met een lage vergoeding zonder kosten. De ${h.src('acmSalderen', 'ACM')} schrijft dat leveranciers terugleverkosten alleen mogen rekenen aan de groep klanten met zonnepanelen en dat ze redelijk moeten zijn.</p>
<h2>Minder terugleveren loont</h2>
<p>Elke kilowattuur die je zelf gebruikt, levert je de volle stroomprijs op in plaats van de vergoeding. Wat het einde van salderen voor jouw huishouden betekent, reken je uit op ${h.a('saldering', 'salderingsregeling 2027')}. Of een ${h.a('thuisbatterij', 'thuisbatterij')} het verschil kan opvangen, staat op de pagina daarover; de uren met een prijs onder nul vind je op ${h.a('negativ', 'negatieve stroomprijs')}.</p>`;
    },
  },
  en: {
    slug: 'feed-in-tariff-netherlands',
    nav: 'Feed-in payment (NL)',
    card: 'What Dutch suppliers pay for exported solar power, feed-in fees and the hourly price.',
    title: 'Feed-in tariff Netherlands 2027: minimum, fees, hourly price',
    description: 'Feed-in tariff in the Netherlands after net metering ends: the legal minimum until 2030, what feed-in fees are, and what a dynamic contract pays you per hour.',
    h1: 'Dutch feed-in tariff: what you get for exported solar power',
    intro: 'The counter below shows how often the Dutch hourly price fell below zero. On a dynamic contract, exporting power costs money at those moments.',
    resume: (h) => {
      const { w, zon, avond, minimum, s } = D(h);
      return `The Dutch feed-in payment, the terugleververgoeding, is the amount per kilowatt-hour your supplier pays for the power your solar panels export to the grid. Until the end of 2026 most of it disappears into net metering; from ${h.date(s.einde)} every exported kilowatt-hour earns only this payment. Suppliers set it themselves, but according to the competition authority ACM it must be reasonable and, until ${h.date(s.min_vergoeding_tot)}, at least ${h.num(s.min_vergoeding_aandeel * 100)}% of the price you pay for electricity without energy tax and VAT. At the average bare price published by CBS, that comes to about ${h.ct(minimum, 2)}. Against it stand feed-in fees: a fixed amount or a charge per exported kilowatt-hour, which the ACM says can sometimes exceed the payment itself. On a dynamic contract the payment follows the hourly or quarter-hourly exchange price. Over the last ${h.num(w.n)} days that averaged ${h.spot(zon, 2)} between 11 am and 4 pm, when panels produce most, against ${h.spot(avond, 2)} between 6 and 10 pm. On ${h.num(w.negativTage)} days the price fell below zero, ${h.num(w.negativViertel)} quarter hours in all.`;
    },
    faqs: () => [
      { q: 'What is the difference between a feed-in payment and a feed-in fee?', a: 'The payment is what your supplier pays you for each exported kilowatt-hour. The fee is what the supplier charges you because you export, either as a fixed monthly amount or per exported kilowatt-hour. What you earn is the difference between the two. Always compare contracts on both amounts together, using your own export figure from last year’s statement or your inverter app.' },
      { q: 'Are Dutch suppliers allowed to charge feed-in fees?', a: 'Yes. According to the ACM, suppliers may pass these costs on to customers with solar panels as long as they are reasonable and relate to costs the supplier incurs to handle the exported power. The ACM supervises this. If you think the fees are unreasonable, you can report it to ConsuWijzer, the ACM’s consumer desk, and switch to a supplier with lower fees.' },
      { q: 'Can exporting cost money on a dynamic contract?', a: 'Yes, when the exchange price drops below zero. The payment then follows the negative price, so you pay for every kilowatt-hour you export at that moment. It happens mostly on sunny, windy afternoons in spring and summer. An inverter that can limit exports temporarily, or shifting use into those hours, avoids it. The counter at the top shows how often it happened recently.' },
    ],
    body: (h) => {
      const { w, blok, minimum, kale, s } = D(h);
      const rows = blok.map((b) => [`${hh(b.van)} to ${hh(b.van + 3)}`, h.spot(b.gem, 2), b.gem / 10 < minimum ? 'lower' : 'higher']);
      return `<h2>What an hour of exporting earned</h2>
${h.table(['Time of day', 'Average exchange price', 'Against a fixed contract’s minimum'], rows, `Netherlands, ${h.date(w.von)} to ${h.date(w.bis)}, day-ahead price without VAT, source SMARD. Minimum: ${h.num(s.min_vergoeding_aandeel * 100)}% of the bare CBS price, ${h.ct(minimum, 2)}.`, ['l', 'r', 'l'])}
<p>The exchange price is the hourly basis of a dynamic contract. Whether your supplier adds VAT or deducts a fee is in your contract. In exactly the hours when solar panels produce most, the price is often lowest, because the whole country exports at once. When the price in those hours drops below the legal minimum of a fixed contract, half the bare price (currently ${h.ct(kale, 2)} on average according to ${h.src('cbs', 'CBS')}), such a fixed contract earns more per exported kilowatt-hour than the hourly price. The table shows for each block whether that was the case over the last 30 days. Whether that floor also applies to dynamic contracts, and how it would be calculated, is not spelled out separately by the ${h.src('rijksSaldering', 'Dutch government')} or the ACM; ask your supplier.</p>
<h2>What to check in a new contract</h2>
<p>Look at three amounts together: the payment per exported kilowatt-hour, the feed-in fee per kilowatt-hour or per month, and the fixed supply charge. A contract with a high payment and high fees can work out worse than one with a low payment and no fees. The ${h.src('acmSalderen', 'ACM')} states that suppliers may only charge feed-in fees to the group of customers with solar panels and that the fees must be reasonable.</p>
<h2>Exporting less pays</h2>
<p>Every kilowatt-hour you use yourself earns you the full power price instead of the payment. What the end of net metering means for your household is on ${h.a('saldering', 'net metering Netherlands 2027')}. Whether a ${h.a('thuisbatterij', 'home battery')} can bridge the gap is covered on its own page; hours with a price below zero are on ${h.a('negativ', 'negative electricity prices')}.</p>`;
    },
  },
});
