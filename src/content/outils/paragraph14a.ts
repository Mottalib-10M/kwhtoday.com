import { defineGuide, type Helpers } from '../../lib/guide-types';
import { modul14a } from '../../lib/engine/eigen';

/** § 14a EnWG : Modul 1 (Pauschale), Modul 2 (Arbeitspreis auf 40 %), Modul 3 (zeitvariabel), für Wärmepumpe und Wallbox. */
function D(h: Helpers) {
  const p = h.P.de.p14a;
  const ap = h.P.de.netzentgelt2025_ct.DE;
  const mitte = (p.modul1_min_eur + p.modul1_max_eur) / 2;
  const faelle = [1500, 2500, 4000, 6000, 8000].map((kwh) => ({ kwh, ...modul14a({ kwh, arbeitspreis: ap, pauschale: mitte, zaehler: 0 }) }));
  // Verbrauch, ab dem Modul 2 (ohne Zählerkosten) die Pauschale schlägt
  const schwelle = mitte / ((ap * (1 - p.modul2_restfaktor) * (1 + h.P.de.ust)) / 100);
  return { p, ap, mitte, faelle, schwelle };
}

export default defineGuide({
  id: 'paragraph14a',
  group: 'nutzen',
  order: 35,
  tool: 'modul14a',
  zone: 'DE-LU',
  related: ['waermepumpe', 'laden', 'netzentgelte', 'zusammensetzung'],
  sources: ['bnetza14a', 'enwg14a', 'monitoring', 'ustg'],
  de: {
    slug: '14a-enwg',
    nav: '§ 14a EnWG',
    card: 'Reduziertes Netzentgelt für Wärmepumpe und Wallbox: Modul 1, 2 oder 3 im Vergleich.',
    title: '§ 14a EnWG 2026: Modul 1, 2 und 3 für Wärmepumpe, Wallbox',
    description: '§ 14a EnWG 2026: weniger Netzentgelt für Wärmepumpe, Wallbox und Speicher. Modul 1, 2 und 3 erklärt, mit Rechner, welches Modul bei Ihrem Verbrauch mehr spart.',
    h1: '§ 14a EnWG: welches Modul spart bei Wärmepumpe und Wallbox mehr?',
    intro: 'Tragen Sie den Jahresverbrauch des Geräts, den Arbeitspreis Ihres Netzbetreibers und dessen Pauschale ein. Der Rechner stellt Modul 1 und Modul 2 gegenüber.',
    resume: (h) => {
      const { p, ap, mitte, schwelle } = D(h);
      return `Paragraf 14a des Energiewirtschaftsgesetzes regelt, dass Netzbetreiber steuerbare Verbrauchseinrichtungen bei drohender Überlastung des Netzes vorübergehend dimmen dürfen, und dass deren Betreiber dafür ein reduziertes Netzentgelt erhalten. Steuerbar sind seit dem ${h.date(p.ab)} neu angeschlossene Wallboxen, Wärmepumpen, Klimageräte und Batteriespeicher mit mehr als 4,2 kW Anschlussleistung; beim Dimmen bleiben nach Angabe der Bundesnetzagentur mindestens 4,2 kW. Modul 1 ist eine Pauschale, die je nach Netzgebiet zwischen ${h.eur(p.modul1_min_eur)} und ${h.eur(p.modul1_max_eur)} im Jahr liegt (Stand ${p.modul1_stand}) und ohne eigenen Zähler gilt. Modul 2 senkt den Arbeitspreis des Netzentgelts auf ${h.num(p.modul2_restfaktor * 100)} %, verlangt aber einen separaten Zähler für das Gerät. Modul 3 gibt es seit dem ${h.date(p.modul3_ab)} nur zusätzlich zu Modul 1: zeitvariable Netzentgelte in drei Preisstufen, mit intelligentem Messsystem. Wer nichts wählt, bekommt Modul 1. Mit einem Arbeitspreis von ${h.ct(ap, 2)} netto, dem Bundesmittel 2025, und einer Pauschale von ${h.eur(mitte)} schlägt Modul 2 die Pauschale ab etwa ${h.num(schwelle, 0)} kWh im Jahr, sofern der zweite Zähler nichts zusätzlich kostet. Mit realistischen Zählerkosten liegt die Schwelle höher.`;
    },
    faqs: () => [
      { q: 'Für welche Geräte gilt Paragraf 14a EnWG?', a: 'Für private Ladepunkte für Elektroautos, Wärmepumpen einschließlich Heizstab, Klimageräte und Stromspeicher, soweit sie Strom aus dem Netz beziehen, jeweils mit mehr als 4,2 kW Anschlussleistung. Mehrere kleine Wärmepumpen oder Klimageräte derselben Art werden zusammengezählt. Öffentliche Ladepunkte fallen nicht darunter. Erfasst sind Geräte, die seit dem 1. Januar 2024 in Betrieb gehen; ältere Anlagen können freiwillig wechseln.' },
      { q: 'Darf der Netzbetreiber meine Wallbox oder Wärmepumpe ablehnen?', a: 'Nein. Nach Angabe der Bundesnetzagentur darf der Netzbetreiber den Anschluss neuer Wärmepumpen, Wallboxen, Speicher und Klimageräte nicht mehr mit dem Hinweis auf eine mögliche Überlastung seines Netzes ablehnen oder verzögern. Im Gegenzug darf er die Leistung bei Engpässen vorübergehend auf 4,2 kW je Gerät begrenzen. Laden und Heizen bleiben dabei möglich, nur langsamer.' },
      { q: 'Kann ich später von Modul 1 zu Modul 2 wechseln?', a: 'Ja. Laut Bundesnetzagentur ist ein Wechsel zwischen Modul 1 und Modul 2 möglich, aber nicht rückwirkend. Für Modul 2 braucht das Gerät einen eigenen Zähler, dessen Einbau Ihr Elektriker und der Messstellenbetreiber übernehmen. Modul 2 und Modul 3 lassen sich nicht kombinieren. Die Wahl gilt für Sie persönlich und geht bei einem Umzug oder Eigentümerwechsel nicht automatisch auf den Nachfolger über.' },
      { q: 'Lohnt sich Modul 3 mit zeitvariablen Netzentgelten?', a: 'Wenn Sie Laden oder Heizen in die Niedrigtarif-Zeiten Ihres Netzbetreibers legen können, ja: Modul 3 kommt zu der Pauschale aus Modul 1 hinzu. Voraussetzung ist ein intelligentes Messsystem. Die Zeitfenster und die drei Preisstufen legt jeder Netzbetreiber für ein Kalenderjahr fest, und sie gelten mindestens in zwei Quartalen. Das Preisblatt Ihres Netzbetreibers nennt die Stufen und Uhrzeiten.' },
    ],
    body: (h) => {
      const { p, ap, mitte, faelle } = D(h);
      const rows = faelle.map((f) => [`${h.num(f.kwh)} kWh`, h.eur(f.modul1), h.eur(f.modul2), `Modul ${f.besser}`]);
      return `<h2>Modul 1 oder Modul 2 nach Verbrauch</h2>
${h.table(['Verbrauch des Geräts', 'Modul 1', 'Modul 2', 'Günstiger'], rows, `Pauschale ${h.eur(mitte)} (Annahme, Mitte der Spanne), Arbeitspreis ${h.ct(ap, 2)} netto (Bundesmittel 2025), Modul 2 mit Umsatzsteuer, ohne Kosten für den zweiten Zähler`, ['r', 'r', 'r', 'l'])}
<p>Eine Wallbox für ein E-Auto mit 10.000 bis 15.000 km im Jahr braucht grob 1.500 bis 2.500 kWh, eine Wärmepumpe im Einfamilienhaus oft deutlich mehr. Je höher der Verbrauch, desto eher lohnt Modul 2. Zieht man die Kosten für den zweiten Zähler und dessen Einbau ab, verschiebt sich die Schwelle nach oben. Die Verbrauchswerte sind Annahmen; Ihr Gerät zeigt den tatsächlichen Wert.</p>
<h2>Die drei Module im Überblick</h2>
<p><strong>Modul 1</strong>: eine pauschale Reduzierung des Netzentgelts je Marktlokation, nach Angabe der ${h.src('bnetza14a', 'Bundesnetzagentur')} zwischen ${h.eur(p.modul1_min_eur)} und ${h.eur(p.modul1_max_eur)} im Jahr je nach Netzgebiet. Sie bleibt gleich, wenn mehrere steuerbare Geräte am selben Anschluss hängen. Kein zusätzlicher Zähler nötig.</p>
<p><strong>Modul 2</strong>: der Arbeitspreis des Netzentgelts für den Verbrauch am separaten Zähler sinkt auf ${h.num(p.modul2_restfaktor * 100)} %, und für diesen Zähler darf der Netzbetreiber keinen Netzentgelt-Grundpreis verlangen. Es betrifft nur den Netzanteil, nicht den Energiepreis Ihres Liefervertrags.</p>
<p><strong>Modul 3</strong>: seit dem ${h.date(p.modul3_ab)} müssen Netzbetreiber zeitvariable Netzentgelte mit Hochtarif, Standardtarif und Niedrigtarif anbieten. Wählbar nur zusammen mit Modul 1 und mit intelligentem Messsystem.</p>
<p>Die gesetzliche Grundlage steht in ${h.src('enwg14a', '§ 14a EnWG')}, die Einzelheiten in der Festlegung BK8-22/010-A der Bundesnetzagentur.</p>
<h2>Was das mit dynamischen Tarifen zu tun hat</h2>
<p>Das Netzentgelt ist ein fester Teil des Endpreises, wie ${h.a('netzentgelte', 'Netzentgelte 2026')} und ${h.a('zusammensetzung', 'Strompreis-Zusammensetzung')} zeigen. Wer es über Paragraf 14a senkt und zusätzlich günstige Börsenstunden nutzt, spart doppelt. Wann die ${h.a('waermepumpe', 'Wärmepumpe')} am günstigsten läuft und wann sich das ${h.a('laden', 'E-Auto laden')} lohnt, rechnen die Seiten dazu.</p>`;
    },
  },
  en: {
    slug: 'section-14a-enwg',
    nav: 'Section 14a EnWG',
    card: 'Reduced German grid fee for heat pumps and wallboxes: Module 1, 2 or 3 compared.',
    title: 'Section 14a EnWG 2026: Modules 1 to 3, heat pump and wallbox',
    description: 'Section 14a EnWG 2026: reduced German grid fees for heat pumps, wallboxes and batteries, Modules 1, 2 and 3, and a calculator for the module that saves most.',
    h1: 'Section 14a EnWG: which module saves more for a heat pump or wallbox?',
    intro: 'Enter the device’s annual use, your grid operator’s energy rate and its flat amount. The calculator sets Module 1 against Module 2.',
    resume: (h) => {
      const { p, ap, mitte, schwelle } = D(h);
      return `Section 14a of Germany’s Energy Industry Act lets grid operators temporarily dim controllable devices when the local grid risks overload, and gives their owners a reduced grid fee in return. Since ${h.date(p.ab)}, newly connected wallboxes, heat pumps, air conditioners and batteries with more than 4.2 kW of connected load count as controllable; according to the Federal Network Agency at least 4.2 kW remain available while dimmed. Module 1 is a flat reduction of between ${h.eur(p.modul1_min_eur)} and ${h.eur(p.modul1_max_eur)} a year depending on the grid area (as of ${p.modul1_stand}) and needs no separate meter. Module 2 cuts the energy rate of the grid fee to ${h.num(p.modul2_restfaktor * 100)}%, but requires a separate meter for the device. Module 3, available since ${h.date(p.modul3_ab)}, only comes on top of Module 1: time-of-use grid fees in three price levels, with a smart meter. If you choose nothing, you get Module 1. With an energy rate of ${h.ct(ap, 2)} net, the 2025 national average, and a flat amount of ${h.eur(mitte)}, Module 2 beats the flat amount from about ${h.num(schwelle, 0)} kWh a year, as long as the second meter costs nothing extra. Realistic meter costs push that threshold higher.`;
    },
    faqs: () => [
      { q: 'Which devices fall under section 14a EnWG?', a: 'Private charging points for electric cars, heat pumps including backup heaters, air conditioners and batteries when they draw from the grid, each with more than 4.2 kW of connected load. Several small heat pumps or air conditioners of the same type are added together. Public charging points are excluded. The rules cover devices commissioned from 1 January 2024; older ones can opt in.' },
      { q: 'Can a German grid operator refuse my wallbox or heat pump?', a: 'No. According to the Federal Network Agency, grid operators may no longer refuse or delay connecting new heat pumps, wallboxes, batteries and air conditioners by pointing to possible overload of their grid. In return they may temporarily limit power to 4.2 kW per device during congestion. Charging and heating remain possible, only slower.' },
      { q: 'Can I switch from Module 1 to Module 2 later?', a: 'Yes. The Federal Network Agency says switching between Module 1 and Module 2 is possible, but not retroactively. Module 2 needs a separate meter for the device, installed by your electrician and the metering operator. Modules 2 and 3 cannot be combined. The choice is personal and does not pass automatically to a new occupant or owner.' },
      { q: 'Is Module 3 with time-of-use grid fees worth it?', a: 'If you can move charging or heating into your grid operator’s low-rate hours, yes: Module 3 comes on top of the Module 1 flat amount. It requires a smart meter. Each grid operator sets the time windows and three price levels for a calendar year, applying in at least two quarters. Your operator’s price sheet lists the levels and times.' },
    ],
    body: (h) => {
      const { p, ap, mitte, faelle } = D(h);
      const rows = faelle.map((f) => [`${h.num(f.kwh)} kWh`, h.eur(f.modul1), h.eur(f.modul2), `Module ${f.besser}`]);
      return `<h2>Module 1 or Module 2 by consumption</h2>
${h.table(['Device use', 'Module 1', 'Module 2', 'Better'], rows, `Flat amount ${h.eur(mitte)} (assumption, midpoint of the range), energy rate ${h.ct(ap, 2)} net (2025 national average), Module 2 with VAT, no second meter cost`, ['r', 'r', 'r', 'l'])}
<p>A wallbox for an electric car driven 10,000 to 15,000 km a year uses roughly 1,500 to 2,500 kWh; a heat pump in a detached house often a good deal more. The higher the use, the more likely Module 2 pays. Subtracting the cost of the second meter and its installation moves the threshold up. The usage figures are assumptions; your device shows the real value.</p>
<h2>The three modules at a glance</h2>
<p><strong>Module 1</strong>: a flat grid fee reduction per metering location, between ${h.eur(p.modul1_min_eur)} and ${h.eur(p.modul1_max_eur)} a year depending on the grid area according to the ${h.src('bnetza14a', 'Federal Network Agency')}. It stays the same when several controllable devices share one connection. No extra meter needed.</p>
<p><strong>Module 2</strong>: the energy rate of the grid fee for use on the separate meter drops to ${h.num(p.modul2_restfaktor * 100)}%, and the operator may not charge a grid standing charge for that meter. It only affects the grid share, not the energy price of your supply contract.</p>
<p><strong>Module 3</strong>: since ${h.date(p.modul3_ab)} grid operators must offer time-of-use grid fees with high, standard and low rates. Only available together with Module 1 and a smart meter.</p>
<p>The legal basis is ${h.src('enwg14a', 'section 14a EnWG')}, with the details in the Federal Network Agency’s determination BK8-22/010-A.</p>
<h2>How this ties in with dynamic tariffs</h2>
<p>The grid fee is a fixed part of the all-in price, as ${h.a('netzentgelte', 'grid fees Germany 2026')} and ${h.a('zusammensetzung', 'German electricity price breakdown')} show. Lowering it through section 14a and also using cheap exchange hours saves twice. When a ${h.a('waermepumpe', 'heat pump')} runs cheapest and when ${h.a('laden', 'EV charging')} pays off are covered on their own pages.</p>`;
    },
  },
});
