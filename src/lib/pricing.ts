import { quoteStones, DEFAULT_OP, DEFAULT_BANDS } from "./quote";
import type { Stone } from "./types";

/**
 * Precio de catálogo de una piedra (standalone, N=1) con la misma `computeQuote`
 * y política de bandas que el simulador. Una sola fuente de verdad.
 *
 * // TODO Cap.2: pasar OpParams/bandas del joyero/operación en vez de defaults.
 */

/** Precio all-in (MXN, con IVA) de una piedra. */
export function stoneAllIn(stone: Stone): number {
  return quoteStones([stone], DEFAULT_OP, null, DEFAULT_BANDS).allin;
}

/** Precio all-in en USD (estándar de la industria del diamante). */
export function stoneAllInUsd(stone: Stone): number {
  return stoneAllIn(stone) / DEFAULT_OP.fx;
}
