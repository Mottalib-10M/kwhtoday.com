/** Verzeichnis der Seiten : jede Datei in `src/content/outils/` wird hier geladen. */
import type { PageDef, Group } from './guide-types';
const mods = import.meta.glob<{ default: PageDef }>(['../content/outils/*.ts'], { eager: true });
export const PAGES: PageDef[] = Object.entries(mods)
  .map(([file, m]) => {
    const g = m.default;
    const base = file.split('/').pop()!.replace(/\.ts$/, '');
    if (g.id !== base) throw new Error(`${file} : id « ${g.id} » weicht vom Dateinamen ab`);
    return g;
  })
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const GROUPS: Group[] = ['preise', 'tarif', 'nutzen', 'laender', 'gas'];
export const pageById = (id: string) => PAGES.find((p) => p.id === id);
