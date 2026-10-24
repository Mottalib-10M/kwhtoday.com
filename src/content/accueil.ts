/** Startseite (Säulenseite) : Text der drei Sprachen in src/content/home/{de,en,nl}.ts. Darstellung : components/HomePage.astro.
 *  Alle Zahlen kommen aus den SMARD-Reihen und dem Motor ; kein Preis steht hier fest im Text. */
import type { PageText, Lang } from '../lib/guide-types';
import type { Zone } from '../lib/engine/tarif';
import { de } from './home/de';
import { en } from './home/en';
import { nl } from './home/nl';

export type Home = Omit<PageText, 'slug' | 'card' | 'nav'> & { zonen: Zone[] };

export const HOME: Record<Lang, Home> = { de, en, nl };
