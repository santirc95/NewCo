/**
 * Formateadores de moneda/porcentaje (es-MX).
 *
 * El cálculo de cotizaciones vive en `quote.ts` (computeQuote multi-piedra +
 * resolveMargin). Aquí solo quedan los helpers de formato compartidos.
 */

function num(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto en pesos mexicanos (es-MX). */
export function formatMXN(value: number): string {
  return mxnFormatter.format(num(value));
}

/** Formatea una fracción (0–1) como porcentaje con un decimal. */
export function formatPct(fraction: number): string {
  return `${(num(fraction) * 100).toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
