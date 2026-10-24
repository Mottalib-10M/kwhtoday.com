import type { Locale } from './routes';
const de = {
  updatedOn: 'Aktualisiert am', editorialPolicy: 'Redaktionelle Grundsätze', contactLabel: 'Kontakt', reviewedBy: 'Geprüft von',
  skipToContent: 'Zum Inhalt', mainNav: 'Hauptnavigation', breadcrumbLabel: 'Brotkrumen', breadcrumbHome: 'Startseite', menuOpen: 'Menü öffnen',
  faqTitle: 'Häufige Fragen', relatedCalculators: 'Verwandte Seiten und Rechner', sourcesTitle: 'Quellen', writtenBy: 'Geschrieben von',
  asOf: 'Preise', lastUpdated: 'geladen am', footerValidated: 'Börsenpreise: Bundesnetzagentur | SMARD.de (CC BY 4.0) · Verbraucherpreise NL: CBS', footerBrowser: 'Rechnet in Ihrem Browser · keine Anmeldung, keine E-Mail · kostenlos',
  footerDisclaimer: 'Unabhängige Seite von Radif Partners, ohne Verbindung zu einer Behörde, einer Strombörse oder einem Stromanbieter. Die Day-Ahead-Preise stammen von SMARD (Bundesnetzagentur), Lizenz CC BY 4.0; Steuern und Umlagen sind im Gesetz nachgelesen. Netzentgelt und Anbieteraufschlag sind Annahmen, die Sie überschreiben können. Die Berechnung ist unverbindlich und ersetzt nicht die Abrechnung Ihres Anbieters. Keine Daten gespeichert, keine Vermittlung.', footerPopular: '', notFound: 'Diese Seite gibt es nicht.',
  readMore: 'Weiterlesen',
};
const en: typeof de = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Frequently asked questions', relatedCalculators: 'Related pages and calculators', sourcesTitle: 'Sources', writtenBy: 'Written by',
  asOf: 'Prices', lastUpdated: 'loaded on', footerValidated: 'Exchange prices: Bundesnetzagentur | SMARD.de (CC BY 4.0) · Dutch consumer prices: CBS', footerBrowser: 'Runs in your browser · no sign-up, no email · free',
  footerDisclaimer: 'Independent site published by Radif Partners, with no link to any authority, power exchange or electricity supplier. Day-ahead prices come from SMARD (Federal Network Agency) under the CC BY 4.0 licence; taxes and levies were read in the law. Grid fees and supplier markups are assumptions you can overwrite. The calculation is for guidance only and does not replace your supplier’s bill. No data stored, no referrals.', footerPopular: '', notFound: 'This page does not exist.',
  readMore: 'Read more',
};
const nl: typeof de = {
  updatedOn: 'Bijgewerkt op', editorialPolicy: 'Redactiestatuut', contactLabel: 'Contact', reviewedBy: 'Nagekeken door',
  skipToContent: 'Naar de inhoud', mainNav: 'Hoofdnavigatie', breadcrumbLabel: 'Kruimelpad', breadcrumbHome: 'Home', menuOpen: 'Menu openen',
  faqTitle: 'Veelgestelde vragen', relatedCalculators: 'Verwante pagina’s en rekenhulpen', sourcesTitle: 'Bronnen', writtenBy: 'Geschreven door',
  asOf: 'Prijzen', lastUpdated: 'geladen op', footerValidated: 'Beursprijzen: Bundesnetzagentur | SMARD.de (CC BY 4.0) · Consumentenprijzen: CBS', footerBrowser: 'Rekent in je browser · geen registratie, geen e-mail · gratis',
  footerDisclaimer: 'Onafhankelijke site van Radif Partners, zonder band met een overheid, een stroombeurs of een energieleverancier. De day-aheadprijzen komen van SMARD (Bundesnetzagentur), licentie CC BY 4.0; belastingen en heffingen zijn in de wet nagelezen. Netkosten en de opslag van de leverancier zijn aannames die je kunt aanpassen. De berekening is indicatief en vervangt niet de afrekening van je leverancier. Geen gegevens bewaard, geen bemiddeling.', footerPopular: '', notFound: 'Deze pagina bestaat niet.',
  readMore: 'Lees verder',
};
export function t(lang: Locale) { return lang === 'en' ? en : lang === 'nl' ? nl : de; }
