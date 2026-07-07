import type { ShipmentTier } from "./types";

/**
 * Escalones de llenado por defecto (configurables por admin en cada embarque).
 * Comunican el costo logístico aproximado POR PIEZA según cuántas piedras
 * lleva el barco — el joyero paga sabiendo su escalón, no un número que se
 * mueve con cada piedra. // TODO Cap.2: ajustar con datos reales de la operadora.
 */
export const DEFAULT_TIERS: ShipmentTier[] = [
  { minStones: 1, maxStones: 2, costPerStoneMxn: 5000 },
  { minStones: 3, maxStones: 5, costPerStoneMxn: 3800 },
  { minStones: 6, maxStones: 8, costPerStoneMxn: 2900 },
  { minStones: 9, maxStones: 12, costPerStoneMxn: 1900 },
  { minStones: 13, maxStones: null, costPerStoneMxn: 1500 },
];

/** Escalón en el que cae un número de piedras. */
export function tierFor(
  count: number,
  tiers: ShipmentTier[],
): ShipmentTier | null {
  if (count <= 0) return null;
  return (
    tiers.find(
      (t) => count >= t.minStones && (t.maxStones === null || count <= t.maxStones),
    ) ?? tiers[tiers.length - 1] ?? null
  );
}

/** Cuántas piedras faltan para el siguiente escalón (motor de llenado). */
export function nextTierInfo(
  count: number,
  tiers: ShipmentTier[],
): { missing: number; tier: ShipmentTier } | null {
  const next = tiers.find((t) => t.minStones > Math.max(count, 0));
  if (!next) return null;
  return { missing: next.minStones - count, tier: next };
}

/** Etiqueta de rango de un escalón: "6–8" / "13+". */
export function tierRangeLabel(t: ShipmentTier): string {
  return t.maxStones === null
    ? `${t.minStones}+`
    : `${t.minStones}–${t.maxStones}`;
}
