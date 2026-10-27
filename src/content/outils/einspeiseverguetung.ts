import { defineGuide, type Helpers } from '../../lib/guide-types';
import { fenster } from '../../lib/fakten';
import { einspeiseSatz, einspeisung } from '../../lib/engine/eigen';
import { preisDe30 } from '../../lib/tool-props';

/** Einspeisevergütung 2026 (EEG 2023) : Sätze der Bundesnetzagentur, anteilige Rechnung, Solarspitzengesetz. */
function D(h: Helpers) {
  const v = h.P.de.einspeiseverguetung_ct;
  const w = fenster('DE-LU', 30);
  const mittag = [11, 12, 13, 14, 15].reduce((s, u) => s + w.stunde[u], 0) / 5;
  const p = preisDe30();
  const bsp = einspeisung({ kwp: 8, ertrag: 950, art: 'teil', eigen: 0.3, preisCt: p.preis });
  const groessen = [5, 10, 15, 30, 60].map((k) => ({ k, teil: einspeiseSatz(k, 'teil'), voll: einspeiseSatz(k, 'voll') }));
  return { v, w, mittag, p, bsp, groessen };
}

export default defineGuide({
  id: 'einspeiseverguetung',
  group: 'tarif',
  order: 50,
  tool: 'einspeisung',
  zone: 'DE-LU',
  related: ['negativ', 'zusammensetzung', 'netzentgelte', 'laden', 'photovoltaik', 'balkonkraftwerk'],
  sources: ['bnetzaEeg', 'eeg51', 'eeg51a', 'eeg9', 'eeg100', 'bmwkSpitzen', 'smard'],
  de: {
    slug: 'einspeiseverguetung-2026',
    nav: 'Einspeisevergütung 2026',
    card: 'Vergütung je kWh für Solarstrom nach EEG, Teil- und Volleinspeisung, mit Rechner.',
    title: 'Einspeisevergütung 2026: Sätze für Solaranlagen nach EEG',
    description: 'Einspeisevergütung 2026 laut Bundesnetzagentur: Sätze je Leistungsstufe für Teil- und Volleinspeisung, die Regel bei negativen Preisen und Ihr Ertrag pro Jahr.',
    h1: 'Einspeisevergütung 2026: was Solarstrom ins Netz einbringt',
    intro: 'Tragen Sie Leistung, Ertrag und Eigenverbrauch Ihrer Dachanlage ein. Der Rechner wendet die Sätze der Bundesnetzagentur anteilig je Leistungsstufe an.',
    resume: (h) => {
      const { v, w, mittag, bsp } = D(h);
      return `Die Einspeisevergütung ist der feste Betrag je Kilowattstunde, den der Netzbetreiber für Solarstrom zahlt, der ins Netz fließt. Für Anlagen auf Gebäuden, die zwischen dem ${h.date(v.ab)} und dem ${h.date(v.bis)} in Betrieb gehen, nennt die Bundesnetzagentur bei Teileinspeisung ${h.ct(v.teil.bis10, 2)} für die ersten 10 kW, ${h.ct(v.teil.bis40, 2)} für den Teil bis 40 kW und ${h.ct(v.teil.bis100, 2)} bis 100 kW. Wer den gesamten Strom einspeist, erhält ${h.ct(v.voll.bis10, 2)} bis 10 kW und ${h.ct(v.voll.bis40, 2)} darüber. Der Satz gilt 20 Jahre fest, und eine größere Anlage erhält einen anteiligen Mischsatz. Eine Anlage mit 8 kWp, 950 kWh Ertrag je kWp und 30 % Eigenverbrauch (Annahmen) speist ${h.num(bsp.eingespeist)} kWh ein und erhält dafür ${h.eur(bsp.verguetung)} im Jahr; der selbst verbrauchte Strom spart beim aktuellen Endpreis dieser Seite weitere ${h.eur(bsp.ersparnis)}. Seit dem Solarspitzengesetz entfällt für neue Anlagen die Vergütung in Viertelstunden mit negativem Börsenpreis, bei kleinen Anlagen ab dem Jahr nach dem Einbau eines intelligenten Messsystems. In den letzten ${h.num(w.n)} Tagen gab es ${h.num(w.negativViertel)} solche Viertelstunden; mittags lag der Börsenpreis im Schnitt bei ${h.spot(mittag, 2)}. Die Sätze beruhen auf dem EEG 2023, das bis Ende 2026 gilt.`;
    },
    faqs: () => [
      { q: 'Lohnt sich Volleinspeisung oder Teileinspeisung mehr?', a: 'Das hängt vom Eigenverbrauch ab. Selbst verbrauchter Strom spart den vollen Arbeitspreis von meist über 30 Cent, während die Volleinspeisung nur den höheren Vergütungssatz bringt. Wer tagsüber zu Hause ist, eine Wärmepumpe oder ein E-Auto hat, fährt mit Teileinspeisung fast immer besser. Volleinspeisung passt eher zu großen Dächern mit wenig Verbrauch im Gebäude. Der Rechner zeigt beide Varianten mit Ihren Werten.' },
      { q: 'Ab wann zählt der Satz für meine Anlage?', a: 'Maßgeblich ist das Datum der Inbetriebnahme, nicht der Kauf oder die Anmeldung. Ab diesem Tag gilt der Satz 20 Jahre lang, bis zum 31. Dezember des zwanzigsten Zahlungsjahres. Die Sätze für neue Anlagen sinken alle sechs Monate leicht. Die Anlage muss im Marktstammdatenregister der Bundesnetzagentur eingetragen sein, sonst verlangt § 52 EEG eine Zahlung je Kilowatt und Monat.' },
      { q: 'Muss ich meine neue Anlage auf 60 Prozent drosseln?', a: 'Neue Anlagen mit Einspeisevergütung zwischen 2 und 100 kW dürfen nach § 9 EEG am Netzanschluss höchstens 60 Prozent ihrer Leistung einspeisen, bis ein intelligentes Messsystem mit Steuerungseinrichtung eingebaut und getestet ist. Mit einem Speicher oder hohem Eigenverbrauch zur Mittagszeit geht dabei wenig verloren. Steckersolargeräte bis 2 kW sind ausgenommen, ebenso Anlagen, die schon vorher liefen.' },
    ],
    body: (h) => {
      const { v, groessen, w } = D(h);
      const satz = [
        ['bis 10 kW', h.ct(v.teil.bis10, 2), h.ct(v.voll.bis10, 2)],
        ['über 10 bis 40 kW', h.ct(v.teil.bis40, 2), h.ct(v.voll.bis40, 2)],
        ['über 40 bis 100 kW', h.ct(v.teil.bis100, 2), h.ct(v.voll.bis100, 2)],
        ['Sonstige Anlagen bis 100 kW', h.ct(v.sonstige, 2), h.ct(v.sonstige, 2)],
      ];
      const misch = groessen.map((g) => [`${h.num(g.k)} kWp`, h.ct(g.teil, 2), h.ct(g.voll, 2)]);
      return `<h2>Die Sätze der Bundesnetzagentur</h2>
${h.table(['Leistungsstufe', 'Teileinspeisung', 'Volleinspeisung'], satz, `Feste Einspeisevergütung für Inbetriebnahme ${h.date(v.ab)} bis ${h.date(v.bis)}, Gebäude und Lärmschutzwände (§ 48 Abs. 2 und 2a EEG 2023)`, ['l', 'r', 'r'])}
<p>Die Werte stammen von der ${h.src('bnetzaEeg')}. Sie enthalten nicht die im Solarpaket I vorgesehene Erhöhung um 1,5 ct für Anlagen ab 40 kW, weil die Europäische Kommission sie nach Angabe der Bundesnetzagentur beihilferechtlich nicht genehmigt hat. Das EEG 2023 gilt bis zum ${h.date(v.bis)}; eine Nachfolgeregelung ist laut Bundesnetzagentur in der parlamentarischen Beratung. Für Anlagen, die ab 2027 ans Netz gehen, können also andere Regeln gelten.</p>
<h2>Der Mischsatz einer Anlage</h2>
${h.table(['Anlage', 'Teileinspeisung', 'Volleinspeisung'], misch, 'Anteilig: die ersten 10 kW zum ersten Satz, die nächsten 30 kW zum zweiten, der Rest zum dritten', ['l', 'r', 'r'])}
<p>Eine Anlage mit 15 kWp erhält also nicht den Satz der Stufe bis 40 kW für alles, sondern zwei Drittel ihres Stroms zum Satz bis 10 kW und ein Drittel zum niedrigeren Satz. Der Rechner oben macht dieselbe Rechnung für jede Größe.</p>
<h2>Negative Preise und das Solarspitzengesetz</h2>
<p>Nach ${h.src('eeg51', '§ 51 EEG')} sinkt der Anspruch in Zeiträumen mit negativem Spotmarktpreis auf null. Für Anlagen unter 100 kW gilt das erst ab dem Ende des Kalenderjahres, in dem ein intelligentes Messsystem eingebaut wird. Die ausgefallenen Viertelstunden werden nach ${h.src('eeg51a', '§ 51a EEG')} am Ende des Vergütungszeitraums angehängt, bei Solaranlagen zur Hälfte gewichtet. Anlagen, die vor dem 25. Februar 2025 in Betrieb gingen, behalten nach ${h.src('eeg100', '§ 100 EEG')} die alte Regel; ihre Betreiber können freiwillig wechseln und erhalten dann ${h.ct(v.optInAufschlag, 1)} mehr. Die Hintergründe erklärt das ${h.src('bmwkSpitzen', 'Bundeswirtschaftsministerium')}. Wie oft der Preis unter null fällt, zeigt ${h.a('negativ', 'negative Strompreise')}: in den letzten ${h.num(w.n)} Tagen an ${h.num(w.negativTage)} Tagen.</p>
<h2>Eigenverbrauch zuerst</h2>
<p>Jede selbst verbrauchte Kilowattstunde spart den Endpreis, der sich nach ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')} aus Börsenpreis, ${h.a('netzentgelte', 'Netzentgelten')}, Steuern und Umlagen zusammensetzt. Das ist meist ein Vielfaches der Vergütung. Ein E-Auto, das mittags lädt, rechnet ${h.a('laden', 'E-Auto laden')}.</p>`;
    },
  },
  en: {
    slug: 'feed-in-tariff-germany-2026',
    nav: 'Feed-in tariff Germany 2026',
    card: 'German EEG feed-in rate per kWh for solar power, partial and full export, with calculator.',
    title: 'Feed-in tariff Germany 2026: EEG rates for solar panels',
    description: 'Feed-in tariff in Germany for 2026 per the Federal Network Agency: rates by size band for partial and full export, the negative price rule and yearly income.',
    h1: 'German feed-in tariff 2026: what solar exports earn',
    intro: 'Enter the size, yield and own use of your rooftop system. The calculator applies the Federal Network Agency rates proportionally to each size band.',
    resume: (h) => {
      const { v, w, mittag, bsp } = D(h);
      return `The German feed-in tariff, the Einspeisevergütung, is the fixed amount per kilowatt-hour the grid operator pays for solar power that flows into the grid. For rooftop systems commissioned between ${h.date(v.ab)} and ${h.date(v.bis)}, the Federal Network Agency lists ${h.ct(v.teil.bis10, 2)} for the first 10 kW with partial export, ${h.ct(v.teil.bis40, 2)} for the share up to 40 kW and ${h.ct(v.teil.bis100, 2)} up to 100 kW. Systems that export everything receive ${h.ct(v.voll.bis10, 2)} up to 10 kW and ${h.ct(v.voll.bis40, 2)} above. The rate is fixed for 20 years, and a larger system gets a blended rate. An 8 kWp system yielding 950 kWh per kWp with 30% own use (assumptions) exports ${h.num(bsp.eingespeist)} kWh and earns ${h.eur(bsp.verguetung)} a year; the power used on site saves another ${h.eur(bsp.ersparnis)} at this site’s current all-in price. Since the solar peak law, new systems get nothing for quarter hours with a negative exchange price, small ones from the year after a smart meter is fitted. The last ${h.num(w.n)} days had ${h.num(w.negativViertel)} such quarter hours; at midday the exchange price averaged ${h.spot(mittag, 2)}. The rates rest on the EEG 2023, which runs until the end of 2026.`;
    },
    faqs: () => [
      { q: 'Is full export or partial export better in Germany?', a: 'It depends on your own use. Power you use yourself saves the full energy price, usually over 30 cents, while full export only brings the higher feed-in rate. Households at home during the day, or with a heat pump or an electric car, almost always do better with partial export. Full export suits large roofs on buildings with little consumption. The calculator shows both with your figures.' },
      { q: 'Which date fixes the rate for my system?', a: 'The commissioning date, not the purchase or the registration. From that day the rate applies for 20 years, until 31 December of the twentieth year of payment. Rates for new systems fall slightly every six months. The system must be entered in the Federal Network Agency’s market master data register, otherwise section 52 EEG imposes a payment per kilowatt and month.' },
      { q: 'Must a new German system be capped at 60 percent?', a: 'New systems on the feed-in tariff between 2 and 100 kW may export at most 60 percent of their capacity at the grid connection under section 9 of the EEG, until a smart meter with a control unit is installed and tested. With a battery or high own use at midday, little is lost. Plug-in solar devices up to 2 kW are exempt, as are systems that were already running.' },
    ],
    body: (h) => {
      const { v, groessen, w } = D(h);
      const satz = [
        ['up to 10 kW', h.ct(v.teil.bis10, 2), h.ct(v.voll.bis10, 2)],
        ['over 10 to 40 kW', h.ct(v.teil.bis40, 2), h.ct(v.voll.bis40, 2)],
        ['over 40 to 100 kW', h.ct(v.teil.bis100, 2), h.ct(v.voll.bis100, 2)],
        ['Other systems up to 100 kW', h.ct(v.sonstige, 2), h.ct(v.sonstige, 2)],
      ];
      const misch = groessen.map((g) => [`${h.num(g.k)} kWp`, h.ct(g.teil, 2), h.ct(g.voll, 2)]);
      return `<h2>The Federal Network Agency rates</h2>
${h.table(['Size band', 'Partial export', 'Full export'], satz, `Fixed feed-in tariff for commissioning ${h.date(v.ab)} to ${h.date(v.bis)}, buildings and noise barriers (EEG 2023 s. 48(2) and (2a))`, ['l', 'r', 'r'])}
<p>The values come from the ${h.src('bnetzaEeg')}. They exclude the 1.5 ct increase for systems from 40 kW planned in Solar Package I, because according to the agency the European Commission has not approved it under state aid rules. The EEG 2023 applies until ${h.date(v.bis)}; the agency says a successor is under parliamentary debate, so systems connected from 2027 may face different rules.</p>
<h2>The blended rate of a system</h2>
${h.table(['System', 'Partial export', 'Full export'], misch, 'Proportional: the first 10 kW at the first rate, the next 30 kW at the second, the rest at the third', ['l', 'r', 'r'])}
<p>A 15 kWp system therefore does not get the up-to-40 kW rate for everything: two thirds of its power earn the up-to-10 kW rate and one third the lower one. The calculator above does the same sum for any size.</p>
<h2>Negative prices and the solar peak law</h2>
<p>Under ${h.src('eeg51', 'section 51 EEG')} the payment drops to zero in periods with a negative spot price. For systems under 100 kW this only applies from the end of the calendar year in which a smart meter is installed. The lost quarter hours are added to the end of the payment period under ${h.src('eeg51a', 'section 51a EEG')}, weighted at one half for solar. Systems commissioned before 25 February 2025 keep the old rule under ${h.src('eeg100', 'section 100 EEG')}; their owners can opt in and then receive ${h.ct(v.optInAufschlag, 1)} more. The ${h.src('bmwkSpitzen', 'Federal Ministry for Economic Affairs')} explains the background. How often prices drop below zero is on ${h.a('negativ', 'negative electricity prices')}: on ${h.num(w.negativTage)} of the last ${h.num(w.n)} days.</p>
<h2>Own use first</h2>
<p>Each kilowatt-hour used on site saves the all-in price, made up of the exchange price, ${h.a('netzentgelte', 'grid fees')}, taxes and levies as shown on ${h.a('zusammensetzung', 'German electricity price breakdown')}. That is usually several times the feed-in rate. Charging an electric car at midday is covered on ${h.a('laden', 'EV charging cost')}.</p>`;
    },
  },
});
