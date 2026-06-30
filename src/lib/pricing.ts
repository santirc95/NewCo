import { computeQuote, type QuoteInputs, type QuoteResult } from "./compute";
import type { Stone } from "./types";

/**
 * Supuestos de importación por defecto para precios de catálogo.
 * Una sola fuente de verdad: el precio all-in del inventario y de la propuesta
 * sale de la misma `computeQuote` pura que el simulador.
 *
 * // TODO v2: estos supuestos vendrán por joyero/operación desde Airtable.
 */
export const PRICING_ASSUMPTIONS = {
  fx: 18.5,
  logi: 3500,
  igi: 0,
  dta: 0.8,
  agente: 6500,
  margin: 12,
} as const;

/** Cotización completa de una piedra a partir del costo del proveedor. */
export function stoneQuote(
  stone: Stone,
  assumptions = PRICING_ASSUMPTIONS,
): QuoteResult {
  const inputs: QuoteInputs = {
    stoneDesc: `${stone.shape} ${stone.carat.toFixed(2)} ct`,
    stoneCert: stone.certNumber,
    stoneUsd: stone.supplierPriceUsd,
    ...assumptions,
  };
  return computeQuote(inputs);
}

/** Precio all-in al joyero (con IVA) de una piedra. */
export function stoneAllIn(stone: Stone): number {
  return stoneQuote(stone).allin;
}
