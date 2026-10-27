import { defineGuide, type Helpers } from '../../lib/guide-types';
import { balkon } from '../../lib/engine/haus';
import { preisDe30 } from '../../lib/tool-props';

/** Balkonkraftwerk (DE, AT) : Ertrag × Eigenverbrauch × Strompreis ; Regeln aus EEG § 8 Abs. 5a, MaStRV, UStG, BGB, WEG. */
const VARIANTEN = [
  { wp: 400, ertrag: 800, kosten: 300 },
  { wp: 800, ertrag: 800, kosten: 500 },
  { wp: 800, ertrag: 600, kosten: 500 },
  { wp: 1600, ertrag: 800, kosten: 900 },
  { wp: 2000, ertrag: 800, kosten: 1100 },
];
function D(h: Helpers) {
  const p = preisDe30();
  const s = h.P.de.steckersolar;
  const bsp = balkon({ wp: 800, ertrag: 800, eigen: 0.7, preisCt: p.preis, kosten: 500 });
  const rows = VARIANTEN.map((v) => ({ ...v, r: balkon({ wp: v.wp, ertrag: v.ertrag, eigen: 0.7, preisCt: p.preis, kosten: v.kosten }) }));
  return { p, s, bsp, rows };
}
const jahre = (h: Helpers, x: number) => (Number.isFinite(x) ? h.num(x, 1) : '–');

export default defineGuide({
  id: 'balkonkraftwerk',
  group: 'nutzen',
  order: 60,
  tool: 'balkon',
  zone: 'DE-LU',
  related: ['photovoltaik', 'geraete', 'einspeiseverguetung', 'fenster'],
  sources: ['eeg8', 'bnetzaBalkon', 'mastrv', 'ustg', 'bgb554', 'weg20', 'oesterreichBalkon', 'bmfAtPv', 'smard', 'smardLizenz'],
  de: {
    slug: 'balkonkraftwerk-rechner',
    nav: 'Balkonkraftwerk',
    card: 'Was ein Steckersolargerät im Jahr erzeugt, spart und wann es sich bezahlt macht.',
    title: 'Balkonkraftwerk Rechner 2026: Ertrag und Amortisation',
    description: 'Balkonkraftwerk 2026 berechnen: Modulleistung, Ausrichtung und Eigenverbrauch eintragen, Ersparnis pro Jahr und Amortisation sehen. Mit den Regeln für 800 VA.',
    h1: 'Balkonkraftwerk: was es erzeugt, spart und wann es sich lohnt',
    intro: 'Tragen Sie Modulleistung, Ertrag und Kaufpreis ein. Der Rechner bewertet den selbst verbrauchten Solarstrom mit dem aktuellen Strompreis und zeigt die Amortisation.',
    resume: (h) => {
      const { p, s, bsp } = D(h);
      return `Ein Balkonkraftwerk, im Gesetz Steckersolargerät genannt, ist eine kleine Solaranlage mit Wechselrichter, die über eine Steckdose ins Hausnetz einspeist. Nach § 8 Abs. 5a EEG gelten die vereinfachten Regeln bis ${h.num(s.wp_max)} Watt Modulleistung und ${h.num(s.va_max)} Voltampere Wechselrichterleistung: Eine Meldung beim Netzbetreiber entfällt, der Eintrag im Marktstammdatenregister bleibt Pflicht und muss binnen eines Monats nach Inbetriebnahme erfolgen. Für Kauf und Montage gilt ein Umsatzsteuersatz von null Prozent. Gespart wird nur, was im Haushalt sofort verbraucht wird, denn Kühlschrank, Router und Geräte im Standby laufen tagsüber ohnehin. Mit 800 Watt Modulen, 800 kWh Ertrag je Kilowatt Peak und 70 % Eigenverbrauch (Annahmen) erzeugt das Gerät ${h.num(bsp.erzeugt)} kWh im Jahr; davon ersetzen ${h.num(bsp.eigenKwh)} kWh Netzstrom. Beim Endpreis von ${h.ct(p.preis, 2)}, der sich aus den Börsenpreisen vom ${h.date(p.von)} bis ${h.date(p.bis)} ergibt, sind das ${h.eur(bsp.ersparnis)} pro Jahr; ein Gerät für 500 Euro (Annahme) hat sich damit nach ${jahre(h, bsp.amortisation)} Jahren bezahlt gemacht. Ein Balkon nach Norden oder Schatten senkt den Ertrag deutlich.`;
    },
    faqs: () => [
      { q: 'Muss ich mein Balkonkraftwerk anmelden?', a: 'In Deutschland ja, aber nur noch an einer Stelle: im Marktstammdatenregister der Bundesnetzagentur, binnen eines Monats nach Inbetriebnahme. Die frühere Meldung beim Netzbetreiber entfällt für Steckersolargeräte. Der Eintrag ist kostenlos und online in wenigen Minuten erledigt. Sie brauchen dafür die Modulleistung, die Leistung des Wechselrichters und das Datum der Inbetriebnahme. Ohne Eintrag verstoßen Sie gegen die Registrierungspflicht der Marktstammdatenregisterverordnung.' },
      { q: 'Darf der Vermieter ein Balkonkraftwerk verbieten?', a: 'Nicht mehr ohne Weiteres. Seit der Reform von § 554 BGB können Mieter verlangen, dass der Vermieter Steckersolargeräten zustimmt. Ablehnen darf er nur, wenn ihm die Veränderung nach Abwägung aller Umstände nicht zuzumuten ist, und über die Art der Befestigung kann er mitreden. In einer Eigentümergemeinschaft gilt nach § 20 WEG dasselbe: Der einzelne Eigentümer hat einen Anspruch, die Gemeinschaft entscheidet über das Wie.' },
      { q: 'Lohnen sich zwei Kilowatt Module an einem 800-VA-Wechselrichter?', a: 'Oft ja, wenn die Module nicht optimal ausgerichtet sind. Mehr Modulfläche liefert morgens, abends und an trüben Tagen mehr Strom, während der Wechselrichter die Mittagsspitze auf 800 Voltampere kappt. Der Mehrertrag fällt also kleiner aus, als die doppelte Modulleistung vermuten lässt. Bei Südausrichtung ohne Schatten bringt die zusätzliche Fläche am wenigsten.' },
      { q: 'Was gilt für Balkonkraftwerke in Österreich?', a: 'In Österreich liegt die Grenze bei 800 Watt, und der Netzbetreiber muss zwei Wochen vor der Inbetriebnahme informiert werden. In Eigentümergemeinschaften gilt die Zustimmung als erteilt, solange niemand widerspricht. Die Umsatzsteuerbefreiung für Photovoltaikmodule ist in Österreich ausgelaufen; 2026 gilt der normale Satz von 20 Prozent. Den Strompreis tragen Sie im Rechner selbst ein.' },
    ],
    body: (h) => {
      const { p, s, rows } = D(h);
      const t = rows.map((x) => [`${h.num(x.wp)} Wp`, `${h.num(x.ertrag)} kWh`, `${h.num(x.r.erzeugt)} kWh`, h.eur(x.r.ersparnis), h.eur(x.kosten), jahre(h, x.r.amortisation)]);
      return `<h2>Ertrag und Amortisation im Vergleich</h2>
${h.table(['Module', 'Ertrag je kWp', 'Erzeugung', 'Ersparnis pro Jahr', 'Kaufpreis', 'Jahre'], t, `Eigenverbrauch 70 %, Kaufpreise und Erträge sind Annahmen. Strompreis ${h.ct(p.preis, 2)}: Börsenmittel ${h.date(p.von)} bis ${h.date(p.bis)} plus Netzentgelt, Steuern und Umlagen`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Der Ertrag je Kilowatt Peak hängt vor allem von Ausrichtung und Neigung ab. Ein Balkon nach Süden mit leicht schrägen Modulen kommt auf mehr als ein senkrecht montiertes Gerät am Geländer; Ost- und Westbalkone liefern über den Tag verteilt, aber insgesamt weniger. Die Zeile mit 600 kWh zeigt, wie stark ein schlechter Standort die Amortisation streckt. Wie viel Ihr Gerät wirklich liefert, zeigt nach einigen Wochen die App des Wechselrichters; diesen Wert tragen Sie dann oben ein.</p>
<h2>Die Regeln in Deutschland</h2>
<p>Die Grenze von ${h.num(s.wp_max)} Watt Modulleistung und ${h.num(s.va_max)} Voltampere Wechselrichterleistung steht in ${h.src('eeg8', '§ 8 Abs. 5a EEG')}. Bis zu diesen Werten darf ein Steckersolargerät ohne Meldung beim Netzbetreiber angeschlossen werden; die ${h.src('bnetzaBalkon', 'Bundesnetzagentur')} beschreibt das Verfahren. Pflicht bleibt der Eintrag im Marktstammdatenregister binnen eines Monats nach ${h.src('mastrv', '§ 5 MaStRV')}. Für Lieferung und Montage gilt nach ${h.src('ustg', '§ 12 Abs. 3 UStG')} ein Umsatzsteuersatz von null Prozent, weil die Anlage unter ${h.num(s.ust_bis_kwp)} kWp bleibt. Mieter haben nach ${h.src('bgb554', '§ 554 BGB')} und Wohnungseigentümer nach ${h.src('weg20', '§ 20 WEG')} einen Anspruch auf Zustimmung.</p>
<h2>Mehr Eigenverbrauch, kürzere Amortisation</h2>
<p>Jede selbst verbrauchte Kilowattstunde spart den vollen Endpreis; der Überschuss fließt im Rechner ohne Vergütung ins Netz (Annahme). Wer Waschmaschine oder Geschirrspüler mittags laufen lässt, hebt den Eigenverbrauch. Was einzelne Geräte brauchen, zeigt ${h.a('geraete', 'Stromverbrauch Geräte')}; wann der Börsenstrom am billigsten ist, ${h.a('fenster', 'günstigste Stunde')}. Wer über eine größere Dachanlage nachdenkt, rechnet mit ${h.a('photovoltaik', 'Photovoltaik-Rechner')} und der ${h.a('einspeiseverguetung', 'Einspeisevergütung 2026')}.</p>
<h2>Österreich</h2>
<p>Laut ${h.src('oesterreichBalkon', 'oesterreich.gv.at')} dürfen Balkonkraftwerke dort höchstens ${h.num(h.P.at.steckersolar_w)} Watt haben, und der Netzbetreiber ist zwei Wochen vor der Inbetriebnahme zu informieren. Die Befreiung von der Umsatzsteuer für Photovoltaikmodule endete nach Angabe des ${h.src('bmfAtPv', 'Finanzministeriums')} grundsätzlich am 31. März 2025. Steuern und Netzentgelte in Österreich rechnen wir nicht ein: Tragen Sie Ihren Bruttopreis je Kilowattstunde selbst in den Rechner ein.</p>`;
    },
  },
  en: {
    slug: 'balcony-solar-germany',
    nav: 'Balcony solar',
    card: 'What a plug-in solar kit produces and saves each year, and when it pays back.',
    title: 'Balcony solar Germany 2026: yield and payback calculator',
    description: 'Balcony solar in Germany 2026: enter panel power, orientation and own use to see the yearly saving and payback period, with the rules for 800 VA plug-in kits.',
    h1: 'Balcony solar in Germany: output, savings and payback',
    intro: 'Enter panel power, yield and the price of your kit. The calculator values the solar power you use yourself at the current German power price and shows the payback.',
    resume: (h) => {
      const { p, s, bsp } = D(h);
      return `A balcony power plant, called a Steckersolargerät or plug-in solar device in German law, is a small solar kit with an inverter that feeds into the home circuit through a socket. Under section 8(5a) of the Renewable Energy Sources Act the simplified rules apply up to ${h.num(s.wp_max)} watts of panels and ${h.num(s.va_max)} volt-amperes of inverter output: there is no need to notify the grid operator, but entry in the Federal Network Agency’s market master data register remains mandatory within one month of switching on. Purchase and installation carry a zero VAT rate. The saving comes only from power used in the home at that moment, such as the fridge, router and devices on standby that run all day anyway. With 800 watts of panels, 800 kWh of yield per kilowatt peak and 70% own use (assumptions), the kit produces ${h.num(bsp.erzeugt)} kWh a year, of which ${h.num(bsp.eigenKwh)} kWh replace grid power. At an all-in price of ${h.ct(p.preis, 2)}, based on exchange prices from ${h.date(p.von)} to ${h.date(p.bis)}, that is ${h.eur(bsp.ersparnis)} a year, so a 500-euro kit (assumption) pays for itself after ${jahre(h, bsp.amortisation)} years. A north-facing or shaded balcony cuts the yield sharply.`;
    },
    faqs: () => [
      { q: 'Do I need to register balcony solar in Germany?', a: 'Yes, but only in one place: the Federal Network Agency’s market master data register, within one month of switching on. The earlier notice to the grid operator no longer applies to plug-in solar devices. Registration is free and takes a few minutes online. You need the panel power, the inverter output and the date the kit went live. Skipping it breaches the registration duty in the register ordinance.' },
      { q: 'Can a German landlord refuse a balcony solar kit?', a: 'Not simply. Since the reform of section 554 of the Civil Code, tenants can require their landlord to approve plug-in solar devices. The landlord may only refuse if, weighing all circumstances, the change cannot reasonably be expected of them, and may have a say in how the kit is mounted. In a condominium, section 20 of the Condominium Act gives each owner the same right, while the owners decide how it is done.' },
      { q: 'Are 2 kW of panels on an 800 VA inverter worth it?', a: 'Often, if the panels are not ideally placed. More panel area produces more power in the morning, the evening and on dull days, while the inverter clips the midday peak at 800 volt-amperes. The extra yield is therefore smaller than doubling the panel power suggests. On an unshaded south-facing balcony the extra panels add the least.' },
      { q: 'What are the balcony solar rules in Austria?', a: 'Austria caps balcony solar at 800 watts, and the grid operator must be told two weeks before the kit goes live. In condominiums, consent is presumed unless another owner objects. Austria’s VAT exemption for solar panels has expired, so the standard 20 percent rate applies in 2026. Enter your own Austrian price per kilowatt-hour in the calculator.' },
    ],
    body: (h) => {
      const { p, s, rows } = D(h);
      const t = rows.map((x) => [`${h.num(x.wp)} Wp`, `${h.num(x.ertrag)} kWh`, `${h.num(x.r.erzeugt)} kWh`, h.eur(x.r.ersparnis), h.eur(x.kosten), jahre(h, x.r.amortisation)]);
      return `<h2>Yield and payback compared</h2>
${h.table(['Panels', 'Yield per kWp', 'Output', 'Saving per year', 'Kit price', 'Years'], t, `Own use 70%; prices and yields are assumptions. Power price ${h.ct(p.preis, 2)}: exchange average ${h.date(p.von)} to ${h.date(p.bis)} plus grid fee, taxes and levies`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>Yield per kilowatt peak depends mainly on orientation and tilt. A south-facing balcony with slightly tilted panels beats a kit hung vertically on the railing; east and west balconies spread their output over the day but produce less in total. The 600 kWh row shows how much a poor spot stretches the payback. After a few weeks the inverter app shows what your kit really delivers, and that is the figure to enter above.</p>
<h2>The German rules</h2>
<p>The limit of ${h.num(s.wp_max)} watts of panels and ${h.num(s.va_max)} volt-amperes of inverter output is set in ${h.src('eeg8', 'section 8(5a) of the EEG')}. Up to these values a plug-in kit may be connected without notifying the grid operator, as the ${h.src('bnetzaBalkon', 'Federal Network Agency')} explains. Registration in the market master data register within one month under ${h.src('mastrv', 'section 5 of the register ordinance')} remains mandatory. Supply and installation carry a zero VAT rate under ${h.src('ustg', 'section 12(3) of the VAT Act')}, since the system stays below ${h.num(s.ust_bis_kwp)} kWp. Tenants under ${h.src('bgb554', 'section 554 of the Civil Code')} and flat owners under ${h.src('weg20', 'section 20 of the Condominium Act')} have a right to approval.</p>
<h2>More own use, faster payback</h2>
<p>Each kilowatt-hour used at home saves the full all-in price; in the calculator the surplus goes to the grid unpaid (assumption). Running the washing machine or dishwasher at midday raises own use. What individual appliances draw is on ${h.a('geraete', 'appliance electricity use')}; when exchange power is cheapest, on ${h.a('fenster', 'cheapest hour')}. For a larger rooftop system, use ${h.a('photovoltaik', 'solar panel payback')} and the ${h.a('einspeiseverguetung', 'German feed-in tariff 2026')}.</p>
<h2>Austria</h2>
<p>According to ${h.src('oesterreichBalkon', 'oesterreich.gv.at')}, balcony kits in Austria may have at most ${h.num(h.P.at.steckersolar_w)} watts, and the grid operator must be informed two weeks before commissioning. The VAT exemption for solar panels ended in principle on 31 March 2025, according to the ${h.src('bmfAtPv', 'Austrian Ministry of Finance')}. We do not add Austrian taxes and grid fees: enter your own gross price per kilowatt-hour in the calculator.</p>`;
    },
  },
});
