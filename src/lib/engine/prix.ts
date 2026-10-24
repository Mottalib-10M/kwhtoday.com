// Prix final d'un kWh à partir du prix day-ahead (EUR/MWh) et des composantes d'un pays.
// Toutes les composantes sont exprimées HORS TVA, dans la sous-unité de la devise par kWh
// (centimes d'euro pour la zone euro, grosze pour la Pologne). Aucune valeur n'est en dur :
// elles viennent du fichier de paramètres du pays (engine/params/<pays>.json), lui-même sourcé.

export interface Composante {
  cle: string; // identifiant stable (ex. « energiebelasting », « stromsteuer »)
  sousUniteParKwh: number; // ct/kWh ou gr/kWh, hors TVA
}

export interface EntreePrix {
  spotEurMwh: number; // prix day-ahead publié (peut être négatif)
  tauxChange?: number; // unités de devise pour 1 EUR (1 pour la zone euro)
  majoration?: number; // marge ou frais d'achat du fournisseur, sous-unité/kWh hors TVA
  composantes?: Composante[]; // taxes et réseau proportionnels au kWh, hors TVA
  tva: number; // taux décimal (0,21 = 21 %)
}

export interface DetailPrix {
  spot: number; // sous-unité/kWh
  majoration: number;
  composantes: { cle: string; montant: number }[];
  horsTva: number;
  tva: number;
  total: number;
}

/** EUR/MWh → sous-unité de devise par kWh (1 EUR/MWh = 0,1 ct/kWh). */
export function spotEnSousUnite(spotEurMwh: number, tauxChange = 1): number {
  if (!Number.isFinite(spotEurMwh)) throw new Error('prix spot invalide');
  if (!(tauxChange > 0)) throw new Error('taux de change invalide');
  return (spotEurMwh * tauxChange) / 10;
}

export function prixFinal(e: EntreePrix): DetailPrix {
  if (!(e.tva >= 0 && e.tva < 1)) throw new Error('taux de TVA invalide');
  const spot = spotEnSousUnite(e.spotEurMwh, e.tauxChange ?? 1);
  const majoration = e.majoration ?? 0;
  const composantes = (e.composantes ?? []).map((c) => ({ cle: c.cle, montant: c.sousUniteParKwh }));
  const horsTva = spot + majoration + composantes.reduce((s, c) => s + c.montant, 0);
  const tva = horsTva * e.tva; // une TVA négative suit un prix total négatif (cas des heures très négatives)
  return { spot, majoration, composantes, horsTva, tva, total: horsTva + tva };
}

/** Coût d'une consommation (kWh) à un prix final donné, en unité de devise (euros, złotys). */
export function cout(kwh: number, prixSousUniteKwh: number): number {
  if (!(kwh >= 0)) throw new Error('consommation invalide');
  return (kwh * prixSousUniteKwh) / 100;
}

/** Part fixe annuelle (abonnement, réseau fixe, réduction forfaitaire) ramenée au mois, TVA comprise. */
export function fixeMensuel(montantAnnuelHorsTva: number, tva: number): number {
  return (montantAnnuelHorsTva * (1 + tva)) / 12;
}
