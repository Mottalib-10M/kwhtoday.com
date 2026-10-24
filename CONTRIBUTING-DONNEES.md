# Données (kWh Today)

| Fichier | Contenu | Source, licence | Mise à jour |
|---|---|---|---|
| `src/data/prices/<zone>.json` | Day-ahead au quart d'heure (42 jours), moyennes journalières, mensuelles ; DE-LU, AT, NL, BE, PL | SMARD.de, Bundesnetzagentur, CC BY 4.0, mention « Bundesnetzagentur \| SMARD.de » | `scripts/update-data.mjs`, 4 fois par jour |
| `src/data/fx-eur-pln.json` | Cours de référence EUR/PLN | BCE (Data Portal) | idem |
| `src/data/cbs-nl.json` | Tarifs moyens consommateurs NL (stroom, gas, energiebelasting) | CBS StatLine 85592NED, CC BY 4.0 | idem |
| `src/data/meta.json` | Date de collecte, filtres SMARD | — | idem |
| `src/data/params-2026.json` | Taxes et prélèvements DE et NL, moyennes Netzentgelt, prix ménages 2025, sources | lois (StromStG, UStG, KAV, EnWG, Wbm, Wet OB), Monitoringbericht 2025, gestionnaires de réseau (via IHK) | à la main, à chaque changement et au 1er janvier |

`node scripts/update-data.mjs [dossier]` (Node 22, sans dépendance). Le workflow `.github/workflows/update-data.yml`
tourne à 14 h 30, 17 h, 20 h et 23 h heure de Berlin (deux cron UTC par créneau, filtre sur l'heure de Berlin),
committe les données si elles changent ; `deploy.yml` republie après chaque relevé réussi.

Rien n'est repris d'ENTSO-E, d'EPEX Spot ni d'une bourse de gaz (licences non libres) : pas de prix du gaz au jour.
