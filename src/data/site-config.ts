/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://kwhtoday.com";
export const SITE_NAMES: Record<string, string> = {"de": "kWh Today", "nl": "kWh Today", "en": "kWh Today"};
export const LANG_TAGS: Record<string, string> = {"de": "de-DE", "nl": "nl-NL", "en": "en-DE"};
export const OG_LOCALES: Record<string, string> = {"de": "de_DE", "nl": "nl_NL", "en": "en_GB"};
export const LOCALE_TAG = 'de-DE';
/** Formatierung der Zahlen je Sprache (RECETTE §4.1) : Deutsch 1.234 €, Englisch €1,234, Niederländisch € 1.234. */
export const LOCALE_BY_LANG: Record<string, string> = { de: 'de-DE', en: 'en-IE', nl: 'nl-NL' };
export const CURRENCY = 'EUR';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-10-24';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"de": "Herausgeber von Rechnern zum Börsenstrompreis je Viertelstunde in Deutschland, Österreich, den Niederlanden, Belgien und Polen", "nl": "Uitgever van rekenhulpen voor de day-aheadprijs per kwartier in Nederland, België, Duitsland, Oostenrijk en Polen", "en": "Publisher of calculators for the quarter-hourly day-ahead power price in Germany, the Netherlands, Belgium, Austria and Poland"};
export const AUTHOR_DESC: Record<string, string> = {"de": "Radif Partners holt die Day-Ahead-Preise jeder Gebotszone mehrmals täglich bei SMARD, der Strommarktplattform der Bundesnetzagentur, ab und rechnet sie mit den im Gesetz nachgelesenen Abgaben in einen Endpreis je Viertelstunde um: Stromsteuer, Umlagen, Konzessionsabgabe und Umsatzsteuer. Netzentgelt und Aufschlag Ihres Anbieters tragen Sie selbst ein. Wir verkaufen keinen Stromtarif und vermitteln keine Verträge.", "nl": "Radif Partners haalt de day-aheadprijzen van elke biedzone meermaals per dag op bij SMARD, het marktplatform van de Duitse toezichthouder Bundesnetzagentur, en rekent ze om naar een eindprijs per kwartier met de energiebelasting en btw zoals ze in de wet staan. De inkoopvergoeding van je leverancier vul je zelf in. Wij verkopen geen energiecontract en bemiddelen niet.", "en": "Radif Partners fetches the day-ahead price of each bidding zone several times a day from SMARD, the market data platform of Germany's Federal Network Agency, and turns it into an all-in price per quarter hour using the taxes and levies as written in the law of each country. Your supplier's markup and grid fee are yours to enter. We sell no tariff and pass on no enquiries."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"de": ["Day-Ahead-Börsenstrompreise je Viertelstunde", "Stromsteuer, Umlagen und Konzessionsabgabe", "Dynamische Stromtarife nach § 41a EnWG", "Negative Strompreise"], "nl": ["Day-aheadprijzen per kwartier", "Energiebelasting op elektriciteit", "Dynamische energiecontracten", "Negatieve stroomprijzen"], "en": ["Quarter-hourly day-ahead electricity prices", "Electricity taxes in the Netherlands and Germany", "Dynamic electricity contracts", "Negative power prices"]};
export const CONTACT_EMAIL = "contact@kwhtoday.com";
export const THEME_COLOR = '#1F5FA8';
export const LOGO_SYMBOL = 'kWh';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime : 'none' pour tous les sites (RECETTE §15.6, décision de l'éditeur du 2026-10-06) :
 *  aucun bandeau ; Clarity chargé en mode sans cookie (consentv2 denied) ; GA4 avec cookies si GA4_ID.
 *  'opt-in' / 'notice' ne servent plus qu'aux sites anciens qui les portent encore. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
/** Propriété Google Analytics 4 (décision de l'éditeur du 2026-10-17, RECETTE §15.6) : GA4 normal,
 *  avec cookies _ga / _ga_<ID> (390 jours), sans bandeau, publicité refusée. Créée par
 *  `seo-platform/scripts/create-ga4.ts accounts/372759688` (RECETTE §15.3, étape 15), puis
 *  pages légales régénérées : `python3 scripts/gen-legal-pages.py .`. Vide = pas de GA4. */
export const GA4_ID = 'G-7HQBEWVVSL';
/** Projet Microsoft Clarity (compte amradif), chargé sans cookie. Vide = aucune mesure. */
export const CLARITY_ID = 'z2wpgc8p6w';
export const INDEXNOW_KEY = '4b422d12b01e7abe4581b1ecfc8c9bc0';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',
  legalForm: '',  // vide : publication à titre personnel, pas de société
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "Frankreich / France",
  phone: '',
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "USt-IdNr.",
  vatNumber: '',
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];  // forme juridique non publiée, comme sur les autres sites du portefeuille

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
