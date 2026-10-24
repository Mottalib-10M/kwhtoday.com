/**
 * Verzeichnis der Mini-Rechner (RECETTE §9.3). Auf dieser Seite trägt jede Themenseite einen vollen
 * Rechner (components/outils/Tools.tsx) : es gibt keine Mini-Rechner, das Verzeichnis bleibt leer.
 */
import type { MiniSpec } from './mini-types';
export type Lang = 'de' | 'en' | 'nl';
type Factory = (l: Lang) => MiniSpec;
const mods = import.meta.glob<{ default: Factory }>(['./minis/*.ts', '!./minis/_*.ts'], { eager: true });
export const MINIS: Record<string, Factory> = Object.fromEntries(
  Object.entries(mods).map(([f, m]) => [f.split('/').pop()!.replace(/\.ts$/, ''), m.default]),
);
export function getSpec(kind: string, lang: string): MiniSpec {
  const f = MINIS[kind];
  if (!f) throw new Error(`Mini-Rechner unbekannt : ${kind}`);
  return f(lang === 'en' ? 'en' : lang === 'nl' ? 'nl' : 'de');
}
