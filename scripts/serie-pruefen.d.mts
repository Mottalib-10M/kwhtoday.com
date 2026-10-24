export declare const QUART_MS: number;
export declare function jourBerlin(ts: number): string;
export declare function trous(qh: Array<[number, number]>): Array<{ avant: string; apres: string; minutes: number }>;
export declare function quartsParJour(qh: Array<[number, number]>): Record<string, { n: number; debut: string; fin: string }>;
export declare function pruefeSerie(zone: string, qh: Array<[number, number]>, o?: { minJours?: number }): void;
export declare function frische(lastIso: string, now?: Date): { dernierJour: string; aujourdhui: string; perime: boolean; lendemainManquant: boolean };
