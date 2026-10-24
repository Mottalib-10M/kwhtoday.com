/** Feste Parameter (RECETTE §4) : Steuern, Abgaben, Quellen. Gelesen am `retrieved_at`. Keine Marktpreise. */
import raw from '../../data/params-2026.json';
export const P = raw;
export type Params = typeof raw;
export type SourceKey = keyof typeof raw.sources;
export type Lang = 'de' | 'en' | 'nl';
export const sourceUrl = (key: SourceKey, _lang?: Lang): string => (raw.sources[key] as { url: string }).url;
export const PARAM_STAND = raw.retrieved_at;
