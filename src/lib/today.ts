/** Tag des Builds in Berliner Zeit (Konstante aus astro.config.mjs, gleich auf Server und im Browser).
 *  Erste Darstellung der Rechner = Werte dieses Tages (RECETTE §17.5). */
const TZ = 'Europe/Berlin';
export function berlinToday(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
// Außerhalb des Astro-Builds (vitest) gibt es die Konstante nicht : dann die Uhr.
export const BUILD_TODAY: string = typeof __BUILD_DAY__ !== 'undefined' ? __BUILD_DAY__ : berlinToday();
