/** Pièces communes des simulateurs : cadre deux colonnes, carte de résultat, lignes de détail. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { formatMoney } from '../../lib/format';

export type L = 'de' | 'en' | 'nl';
/** Text in der Sprache der Seite : Reihenfolge immer de, en, nl. */
export const T = <A,>(l: L, de: A, en: A, nl: A) => (l === 'en' ? en : l === 'nl' ? nl : de);
export const eur = (x: number, l: L, d = 0) => formatMoney(x, d, l);

/** Le chiffre clé du résultat, remonté par <Head> pour la barre collante du téléphone. */
const KeyFigure = createContext<((k: { label: string; value: string }) => void) | null>(null);

export function Shell({ form, result, id, after }: { form: ReactNode; result: ReactNode; id: string; after?: ReactNode }) {
  // Téléphone : tant que la carte du résultat est sous l'écran, une barre en bas montre le chiffre
  // clé (RECETTE §5, 2026-10-11). Rendue côté client seulement : aucun texte en double dans le HTML.
  const card = useRef<HTMLDivElement>(null);
  const [below, setBelow] = useState(false);
  const [key, setKey] = useState<{ label: string; value: string } | null>(null);
  useEffect(() => {
    const el = card.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setBelow(!e.isIntersecting && e.boundingClientRect.top > 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="rechner not-prose rounded-xl border border-navy-200 bg-white p-4 sm:p-6" data-chrome data-calc={id}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-6">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">{form}</form>
        <div ref={card} aria-live="polite" data-resultat className="mt-6 rounded-xl border border-accent-200 bg-accent-50/60 p-4 sm:p-5 lg:sticky lg:top-20 lg:mt-0"><KeyFigure.Provider value={setKey}>{result}</KeyFigure.Provider></div>
      </div>
      {after}
      {below && key && (
        <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="fixed inset-x-0 bottom-0 z-40 flex items-baseline justify-between gap-3 border-t border-accent-200 bg-accent-50 px-4 py-3 text-left shadow-lg lg:hidden">
          <span className="text-sm font-medium text-navy-700">{key.label}</span>
          <span className="tabular-nums text-xl font-bold text-navy-900">{key.value}</span>
        </button>
      )}
    </div>
  );
}
export const Row2 = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{children}</div>;

export function Head({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const report = useContext(KeyFigure);
  useEffect(() => { report?.({ label, value }); }, [report, label, value]);
  return (
    <>
      <p className="text-sm font-medium text-navy-700">{label}</p>
      <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-navy-700">{sub}</p>}
    </>
  );
}
export function Rows({ rows }: { rows: Array<[string, string] | [string, string, boolean]> }) {
  return (
    <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-navy-200">
      {rows.map(([l, v, strong]) => (
        <tr key={l} className={strong ? 'font-semibold' : ''}><td className="py-1.5 pr-3 text-navy-700">{l}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{v}</td></tr>
      ))}
    </tbody></table>
  );
}
export const Note = ({ children }: { children: ReactNode }) => <p className="mt-3 text-sm text-navy-700">{children}</p>;
export function MethodLink({ href, lang }: { href?: string; lang: L }) {
  if (!href) return null;
  return <p className="mt-3 text-sm"><a href={href} className="font-medium text-accent-700 underline">{T(lang, 'Methode und Quellen der Berechnung', 'Calculation method and sources', 'Methode en bronnen van de berekening')}</a></p>;
}
