# Écrire ou modifier une page (kWh Today)

Une page = un fichier `src/content/outils/<id>.ts` (modèle : `vergleich.ts`). Le cœur du site (routes, menus, pied
de page, sitemap, hreflang, schémas JSON-LD, pages associées) lit ce fichier seul.

```ts
export default defineGuide({
  id: 'morgen',                 // = nom du fichier
  group: 'preise',              // 'preise' | 'tarif' | 'nutzen' | 'laender' | 'gas' (menu)
  order: 10,
  tool: 'morgen',               // calculateur en tête : preis | morgen | jetzt | fenster | laden | vergleich | verlauf | negativ | gas
  zone: { de: 'DE-LU', en: 'DE-LU', nl: 'NL' }, // zone de prix par défaut, par langue possible
  zonen: { de: ['AT', 'NL'] },  // autres zones proposées dans la liste du calculateur
  toolProps: { dauerH: 2 },     // valeurs de départ du calculateur
  related: ['preis', 'fenster'],
  sources: ['smard', 'stromstg'], // clés de src/data/params-2026.json → sources
  de: { … }, en: { … }, nl: { … }, // en obligatoire ; de et/ou nl là où ces lecteurs cherchent
});
```

Chaque langue : `slug`, `nav`, `card`, `title` (50 à 60 caractères, terme-clé en tête, jamais un pays ni un mot
d'outil en premier), `description` (150 à 160), `h1`, `intro`, `resume(h)` (UN paragraphe ≥ 120 mots),
`faqs(h)` (3 à 5 questions, réponses de 40 à 90 mots, jamais une question déjà posée ailleurs), `body(h)`.

## Les chiffres

Aucun prix écrit en dur. Les prix de bourse viennent de `src/lib/fakten.ts` (jour publié, 30 derniers jours,
moyennes mensuelles, fenêtres les moins chères) et de `src/lib/engine/markt.ts` (séries SMARD), formatés par
`h.spot` (EUR/MWh → ct/kWh), `h.ct`, `h.eur`, `h.num`, `h.date`, `h.monat`. Taxes et prélèvements : `h.P`
(params-2026.json, chaque valeur avec sa source). Autriche, Belgique, Pologne : prix de bourse + saisie de
l'utilisateur, jamais de taxe calculée par nous (non vérifiées). Toute hypothèse (profil de consommation, perte de
charge, kWh d'un appareil, majoration de 2 ct) est dite « Annahme / assumption / aanname ».

Attribution obligatoire partout où un prix SMARD apparaît : « Bundesnetzagentur | SMARD.de » (CC BY 4.0).

`npx vitest run` contrôle titres, descriptions, bloc citable, FAQ, mots et typographie sans build.
