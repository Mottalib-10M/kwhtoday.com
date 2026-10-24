import type { Home } from '../accueil';
import { letzter, fenster, monate, endNl, vergleich30, eNl } from '../../lib/fakten';
import type { Zone } from '../../lib/engine/tarif';

const ZN: Record<Zone, string> = { NL: 'Nederland', BE: 'België', 'DE-LU': 'Duitsland/Luxemburg', AT: 'Oostenrijk', PL: 'Polen' };
import { CBS } from '../../lib/engine/markt';
import { verminderingMonat } from '../../lib/engine/tarif';

export const nl: Home = {
  zonen: ['NL', 'BE', 'DE-LU', 'AT', 'PL'],
  title: 'Stroomprijs vandaag: kwartierprijzen met energiebelasting',
  description: 'Stroomprijs vandaag en morgen per kwartier: de day-aheadprijs van de beurs voor Nederland en België, omgerekend naar je eindprijs met energiebelasting en btw.',
  h1: 'Stroomprijs vandaag: wat een kilowattuur nu en morgen kost',
  intro: 'De beursprijs van elk kwartier, zoals de Duitse Bundesnetzagentur hem publiceert, en daarnaast wat je met energiebelasting, btw en je inkoopvergoeding echt betaalt.',
  resume: (h) => {
    const f = letzter('NL');
    const w = fenster('NL', 30);
    const c = CBS.maanden.at(-1)!;
    return `De stroomprijs van vandaag op de beurs is voor Nederland geen enkel bedrag maar een prijs per kwartier, die de dag ervoor rond het middaguur voor alle 96 kwartieren van de volgende dag wordt vastgesteld. Voor ${h.date(f.d)} is het gemiddelde ${h.spot(f.mittel)}, met als laagste kwartier ${h.spot(f.min)} om ${f.minUhr} uur en als hoogste ${h.spot(f.max)} om ${f.maxUhr} uur. Dat is de kale groothandelsprijs. Met een dynamisch contract betaal je daarbovenop de inkoopvergoeding van je leverancier, de energiebelasting van ${h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)} per kWh en ${h.num(h.P.nl.btw * 100)} % btw; zonder inkoopvergoeding wordt het daggemiddelde zo ongeveer ${h.ct(endNl(f.mittel))}. Netbeheerkosten betaal je per aansluiting, los van het uur, en de vermindering energiebelasting trekt er elke maand ongeveer ${h.eur(verminderingMonat(), 2)} weer af. Ter vergelijking: volgens het CBS kostte stroom met een variabel contract in ${h.monat(c.maand)} gemiddeld ${h.ct((c.incl.stroomVariabel! + c.incl.stroomEb!) * 100)} inclusief belasting. Over de laatste ${h.num(w.n)} dagen lag tussen het goedkoopste en het duurste kwartier van een dag gemiddeld ${h.spot(w.spreizung)}.`;
  },
  faqs: (h) => {
    const w = fenster('NL', 30);
    const m = monate('NL');
    return [
      { q: 'Hoe laat zijn de stroomprijzen van morgen bekend?', a: 'De day-aheadveiling voor de volgende dag sluit om 12 uur; de uitkomst voor alle kwartieren volgt kort daarna en staat begin van de middag bij SMARD. Wij laden de reeks in de middag en de avond meermaals opnieuw. Vanaf ongeveer 14 uur toont de knop „Morgen” in de rekenhulp dus de prijzen van de volgende dag, daarvoor zie je nog vandaag.' },
      { q: 'Welk uur is meestal het goedkoopst?', a: `Over de laatste ${h.num(w.n)} dagen was in de Nederlandse biedzone gemiddeld het uur vanaf ${String(w.billigsteStunde).padStart(2, '0')}:00 het goedkoopst en het uur vanaf ${String(w.teuersteStunde).padStart(2, '0')}:00 het duurst. Op zonnige dagen duwen zonnepanelen de middagprijs omlaag, soms onder nul; de avondpiek in het verbruik duwt de prijs omhoog. In de winter bepaalt de wind meer dan de zon.` },
      { q: 'Wat was de gemiddelde beursprijs vorige maand?', a: `In ${h.monat(m.letzt[0])} was het maandgemiddelde van de day-aheadprijs voor Nederland ${h.spot(m.letzt[1], 2)}${m.vorjahr ? `, tegen ${h.spot(m.vorjahr[1], 2)} in dezelfde maand een jaar eerder` : ''}. Dat is de groothandelsprijs zonder energiebelasting, btw en inkoopvergoeding. Bij een vast of variabel contract merk je zo’n daling of stijging pas als je leverancier zijn tarieven aanpast.` },
      { q: 'Wat is het verschil tussen beursprijs en kale leveringsprijs?', a: 'De beursprijs is de groothandelsprijs van één kwartier, die producenten en leveranciers op de day-aheadmarkt afspreken. De leveringsprijs in je contract is wat je leverancier per kWh rekent; bij een dynamisch contract is dat de beursprijs plus een inkoopvergoeding. Daarbovenop komen nog energiebelasting en btw, en los daarvan de vaste netbeheerkosten per aansluiting.' },
      { q: 'Waarom staat de vermindering energiebelasting niet in de kwartierprijs?', a: 'Omdat je die korting per aansluiting krijgt, als vast bedrag per jaar, en niet per kilowattuur. Ze verlaagt je energierekening elke maand met ongeveer hetzelfde bedrag, hoeveel of wanneer je ook verbruikt. In een prijs per kwartier zou ze het beeld vertekenen. Je leverancier verrekent haar op je jaarafrekening en in je termijnbedrag.' },
      { q: 'Hoe vaak worden de prijzen op deze site bijgewerkt?', a: 'Vier keer per dag, om 14.30, 17.00, 20.00 en 23.00 uur: dan laden we de nieuwste kwartierwaarden van SMARD en bouwen we de pagina’s opnieuw. Na de ronde van begin van de middag staat meestal ook de volgende dag erin. De datum van de laatste ophaalronde staat onder elke rekenhulp, naast de bronvermelding.' },
      { q: 'Waarom verschillen de stroomprijzen in Nederland en België?', a: 'Omdat beide landen een eigen biedzone hebben. Zolang de verbindingen over de grens genoeg stroom kunnen vervoeren, trekken de prijzen naar elkaar toe; zitten ze vol, dan vormt elke zone haar eigen prijs. Op winderige dagen kan Nederland met zijn windparken op zee dan goedkoper zijn, op andere momenten België. De tabel hierboven toont beide zones voor de laatst gepubliceerde dag.' },
      { q: 'Heb ik een slimme meter nodig voor een dynamisch contract?', a: 'Ja. Een leverancier kan je verbruik alleen per uur of kwartier afrekenen als een slimme meter dat verbruik ook per uur of kwartier doorgeeft. Met een oude meter krijg je een vast of variabel tarief. De meeste huishoudens in Nederland hebben inmiddels een slimme meter; staat er bij jou nog een draaischijfmeter, dan kun je bij je netbeheerder een vervanging aanvragen.' },
    ];
  },
  body: (h) => {
    const f = letzter('NL');
    const b = letzter('BE');
    const w = fenster('NL', 30);
    const m = monate('NL');
    const c = CBS.maanden.at(-1)!;
    const j25 = m.jahr('2025'), j24 = m.jahr('2024');
    const netto = f.mittel / 10 + h.P.nl.eb_stroom_eur_kwh * 100;
    const festNl = (c.incl.stroomVariabel! + c.incl.stroomEb!) * 100;
    const dyn = vergleich30('NL', eNl(2), festNl, 2500, 'flach');
    const dynAvond = vergleich30('NL', eNl(2), festNl, 2500, 'abend');
    const rows = [
      ['Beursprijs (daggemiddelde)', h.spot(f.mittel, 2)],
      ['Inkoopvergoeding leverancier', 'uit je contract'],
      ['Energiebelasting 2026', h.ct(h.P.nl.eb_stroom_eur_kwh * 100, 3)],
      [`Btw ${h.num(h.P.nl.btw * 100)} %`, h.ct(netto * h.P.nl.btw, 2)],
      ['Eindprijs zonder inkoopvergoeding', h.ct(endNl(f.mittel), 2)],
    ];
    return `<h2>Van beursprijs naar de prijs op je rekening</h2>
<p>Wat apps en nieuwssites „de stroomprijs van vandaag” noemen, is bijna altijd de day-aheadprijs van de beurs: de groothandelsprijs waartegen producenten en leveranciers stroom verhandelen voor elk kwartier van de volgende dag. Hij staat in euro per megawattuur; deel door tien en je hebt cent per kilowattuur. De tabel zet het daggemiddelde van ${h.date(f.d)} om naar wat een huishouden met een dynamisch contract per kWh betaalt.</p>
${h.table(['Onderdeel', 'ct/kWh'], rows, `Eindprijs uit het beursgemiddelde van ${h.date(f.d)}, Nederland`, ['l', 'r'])}
<p>De energiebelasting voor 2026 staat in artikel 59 van de ${h.src('wbm')}: hetzelfde bedrag per kWh voor alle verbruik tot 10.000 kWh per jaar, daarboven een lager tarief. De vermindering energiebelasting van ${h.eur(h.P.nl.vermindering_eur, 2)} per jaar exclusief btw (artikel 63) krijg je per aansluiting, los van je verbruik. Het btw-tarief van ${h.num(h.P.nl.btw * 100)} % komt uit de ${h.src('wetob')}. De netbeheerkosten zijn een vast bedrag per dag en hangen niet van het uur af; ze staan dus niet in de kwartierprijs, wel op je jaarnota.</p>
<h2>Waarom de prijs elk kwartier verandert</h2>
<p>Sinds 1 oktober 2025 verhandelt de Europese day-aheadveiling kwartieren in plaats van uren. Een dag heeft daardoor 96 prijzen, en 92 of 100 op de dagen dat de klok verzet wordt. Hoe ver ze uit elkaar liggen, bepaalt het weer: op zonnige dagen drukken zonnepanelen de middagprijs vaak onder nul, op windstille winteravonden bepalen gascentrales de prijs. Over de laatste ${h.num(w.n)} dagen (${h.date(w.von)} tot ${h.date(w.bis)}) bereikte het duurste kwartier ${h.spot(w.max)} en het goedkoopste ${h.spot(w.min)}. ${w.negativViertel > 0 ? `Op ${h.num(w.negativTage)} van die dagen waren er samen ${h.num(w.negativViertel)} kwartieren met een negatieve prijs.` : 'Negatieve prijzen waren er in die periode niet.'} Meer daarover op ${h.a('negativ', 'negatieve stroomprijs')}.</p>
<h2>Dynamisch, variabel of vast</h2>
<p>Volgens ${h.src('cbs')} kostte stroom met een variabel contract in ${h.monat(c.maand)} gemiddeld ${h.ct(c.incl.stroomVariabel! * 100, 2)} leveringstarief plus ${h.ct(c.incl.stroomEb! * 100, 2)} energiebelasting, inclusief btw. Voor dynamische contracten noemt het CBS als gemiddeld leveringstarief ${h.ct(c.incl.stroomDynamisch! * 100, 2)} inclusief btw, en daar komt de energiebelasting nog bij. Of dynamisch voor jou goedkoper uitvalt, hangt af van wanneer je stroom gebruikt: ${h.a('vergleich', 'dynamisch energiecontract')} rekent het uit op de prijzen van de laatste dertig dagen, met je eigen vaste prijs en een verbruiksprofiel. Wanneer een apparaat het goedkoopst draait, zoekt ${h.a('fenster', 'goedkoopste uur')}; wat een laadbeurt van de auto kost, ${h.a('laden', 'auto laden')}.</p>
<h2>De beursprijs door de jaren</h2>
<p>${j25 && j24 ? `In de Nederlandse biedzone kostte een megawattuur op de day-aheadmarkt in 2025 gemiddeld ${h.eur(j25, 2)} en in 2024 ${h.eur(j24, 2)}, dus ${h.spot(j25, 2)} tegen ${h.spot(j24, 2)}.` : ''} In ${h.monat(m.letzt[0])} was het maandgemiddelde ${h.spot(m.letzt[1], 2)}. De hele reeks sinds 2018 staat op ${h.a('verlauf', 'EPEX-prijzen')}; de volgende dag apart op ${h.a('morgen', 'stroomprijs morgen')}, het huidige kwartier op ${h.a('jetzt', 'stroomprijs nu')}.</p>
<h2>België en de buurlanden</h2>
<p>Nederland en België hebben elk een eigen biedzone, net als Duitsland met Luxemburg, Oostenrijk en Polen. Ze zijn gekoppeld in één Europese markt, dus de prijzen liggen vaak dicht bij elkaar; voor ${h.date(b.d)} is het Belgische gemiddelde ${h.spot(b.mittel)}. Voor België rekenen we de belastingen niet zelf in, omdat we die nog niet regel voor regel nagelezen hebben: ${h.a('belgie', 'stroomprijs België')} toont de beursprijs en laat je de rest van je factuur toevoegen.</p>
<h2>Vier zones over 30 dagen</h2>
${h.table(['Biedzone', 'Gemiddelde', 'Gemiddelde dagspreiding', 'Negatieve kwartieren'], (['NL', 'BE', 'DE-LU', 'AT'] as Zone[]).map((z) => { const x = fenster(z, 30); return [ZN[z], h.spot(x.mittel, 2), h.spot(x.spreizung, 1), h.num(x.negativViertel)]; }), `Day-aheadbeursprijs ${h.date(w.von)} tot ${h.date(w.bis)}, bron SMARD`, ['l', 'r', 'r', 'r'])}
<p>De gemiddelde dagspreiding is het verschil tussen het goedkoopste en het duurste kwartier van een dag, gemiddeld over de periode. Hoe groter die spreiding, hoe meer het oplevert om verbruik te verschuiven, en hoe meer een dynamisch contract verschilt van een vaste prijs voor wie op dure momenten veel stroom gebruikt.</p>
<h2>Een dag huishoudstroom als voorbeeld</h2>
<p>Een huishouden met 2.500 kWh per jaar gebruikt gemiddeld bijna 7 kWh per dag. Verdeel je dat gelijkmatig over de kwartieren van de laatste 30 dagen, met energiebelasting, btw en een aangenomen inkoopvergoeding van 2 cent, dan kom je uit op een gemiddelde eindprijs van ${h.ct(dyn.prixMoyenDynamique)}. Met het voorbeeldprofiel „vooral ’s avonds” wordt dat ${h.ct(dynAvond.prixMoyenDynamique)}, omdat het verbruik dan in de dure uren valt. Die profielen zijn aannames en geen meting; met je eigen cijfers rekent ${h.a('vergleich', 'dynamisch energiecontract')}.</p>
<h2>Drie soorten huishoudens</h2>
<p><strong>Met een vast of variabel contract.</strong> Je betaalt elke kilowattuur hetzelfde, of de beursprijs nu op nul staat of op dertig cent. De grafiek hierboven toont dan niet je eigen kosten, wel wanneer er veel wind- en zonnestroom op het net is. Voor je rekening telt de volgende tariefwijziging van je leverancier, niet de beursprijs van vandaag.</p>
<p><strong>Dynamisch, zonder grote verbruikers.</strong> Een huishouden zonder elektrische auto en zonder warmtepomp kan maar weinig verschuiven: de wasmachine, de droger, de vaatwasser. Het verbruik volgt het dagritme, met een piek in de avond, precies wanneer de beursprijs vaak het hoogst is. Of dynamisch dan toch loont, hangt vooral af van de inkoopvergoeding en van de maanden waarover je rekent.</p>
<p><strong>Dynamisch, met auto of warmtepomp.</strong> Wie elke week 50 tot 100 kWh nodig heeft voor een auto of een warmtepomp met buffervat, en die hoeveelheid in de goedkoopste uren kan leggen, haalt het meeste uit de dagspreiding. Dan beslist de sturing: een laadpaal met tijdsinstelling of een energiemanager die de gepubliceerde prijzen inleest.</p>
<h2>Wanneer welke prijzen vastliggen</h2>
<p>Het verloop is elke dag hetzelfde. Tot 12 uur dienen producenten, handelaren en leveranciers hun biedingen in voor elk kwartier van de volgende dag. De veiling rekent alle gekoppelde Europese biedzones tegelijk door en houdt daarbij rekening met hoeveel stroom de verbindingen tussen de landen aankunnen. De uitkomst verschijnt begin van de middag, SMARD stelt haar beschikbaar en wij laden haar in de middag en de avond meermaals. Daarna liggen de prijzen van morgen vast: een dynamisch contract dat aan de day-aheadprijs gekoppeld is, rekent met precies deze bedragen af.</p>
<h2>Zo lees je de rekenhulp</h2>
<p>Bovenaan kies je de biedzone en de dag. Voor Nederland vul je de inkoopvergoeding van je contract in, het bedrag per kWh dat je leverancier bovenop de beursprijs rekent; energiebelasting en btw telt de rekenhulp zelf op. De uitkomst toont de eindprijs nu of als daggemiddelde, het goedkoopste en het duurste uur, de kale beursprijs en het aantal kwartieren met een negatieve prijs. Daaronder staan de grafiek met alle kwartieren en een tabel met elk uur. Kies je België, Duitsland, Oostenrijk of Polen, dan verschijnen de velden die voor dat land gelden.</p>
<h2>Wat er niet in zit</h2>
<p>Vaste leveringskosten en netbeheerkosten betaal je per dag en per aansluiting, los van je verbruik, en ze staan dus niet in de prijs per kWh. Hetzelfde geldt voor de vermindering energiebelasting. Teruglevering van zonnepanelen rekent deze pagina niet. Voor België, Oostenrijk en Polen tellen we geen belastingen mee, omdat we ze niet in de wet nagelezen hebben. En de rekenhulp kent alleen gepubliceerde prijzen: voorspellingen voor overmorgen of de volgende maand tonen we niet.</p>
<h2>Gas</h2>
<p>Voor gas bestaat geen openbare kwartierprijs zoals voor stroom. Wat een kubieke meter met energiebelasting en btw kost, en hoe het CBS-gemiddelde zich ontwikkelt, staat op ${h.a('gas', 'gasprijs vandaag')}.</p>
<h2>Waar de cijfers vandaan komen</h2>
<p>Alle beursprijzen komen van ${h.src('smard')}, het stroommarktplatform van de Duitse Bundesnetzagentur, dat de uitkomst van de day-aheadveiling voor alle Europese biedzones publiceert onder licentie CC BY 4.0. We laden ze vier keer per dag opnieuw en veranderen ze niet. De consumentengemiddelden komen van het CBS. Berekening, aannames en tests staan in de methode; wie de site uitgeeft, staat bij over ons. Belastingen en gemiddelden lezen we bij elke wijziging en bij elke jaarwisseling opnieuw na, en we zetten ze met bron en datum in één bestand. Zie je een bedrag dat niet klopt met je rekening of met de bron, laat het ons weten: we toetsen het aan de bron en verbeteren het als het fout is.</p>`;
  },
};
