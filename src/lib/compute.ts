/**
 * NewCo — Simulador de costo aterrizado (importación B2B de diamante en México)
 *
 * Lógica pura, sin dependencias de UI. En v2 los `QuoteInputs` llegarán desde
 * Airtable (tablas Clientes / Ventas / Invoices) y el PDF se generará server-side
 * con un folio congelado. Mantener esta función SIN side effects y SIN imports
 * de React/UI es lo que permite ese reemplazo sin tocar la lógica de negocio.
 */

/** Entradas editables del simulador. Contrato estable para v1 (manual) y v2 (Airtable). */
export interface QuoteInputs {
  /** Descripción de la piedra (texto libre). */
  stoneDesc: string;
  /** Número de certificado GIA (texto libre). */
  stoneCert: string;
  /** Costo de la piedra en USD. */
  stoneUsd: number;
  /** Tipo de cambio MXN por USD. */
  fx: number;
  /** Flete + seguro internacional, en MXN. */
  logi: number;
  /** Arancel (IGI), en porcentaje. Confirmar con agente aduanal. */
  igi: number;
  /** DTA (Derecho de Trámite Aduanero), en porcentaje. */
  dta: number;
  /** Honorarios del agente aduanal, en MXN. */
  agente: number;
  /** Margen NewCo, en porcentaje sobre el costo aterrizado. */
  margin: number;
}

/** Desglose de la composición del precio (sin IVA), en MXN. */
export interface QuoteComposition {
  /** Valor de la piedra en MXN. */
  piedra: number;
  /** Flete + seguro internacional. */
  logistica: number;
  /** Costos de aduana: IGI + DTA + agente aduanal. */
  aduana: number;
  /** Servicio / margen NewCo. */
  servicio: number;
}

/** Resultado calculado de una cotización. Todos los montos en MXN salvo indicación. */
export interface QuoteResult {
  /** Valor de la piedra convertido a MXN (stoneUsd * fx). */
  stoneMxn: number;
  /** Valor en aduana (stoneMxn + logística). */
  aduana: number;
  /** Monto del arancel IGI. */
  igiAmt: number;
  /** Monto del DTA. */
  dtaAmt: number;
  /** Honorarios del agente aduanal (eco de la entrada). */
  agenteAmt: number;
  /** Costo aterrizado (aduana + IGI + DTA + agente). */
  landed: number;
  /** IVA de importación (16%). ACREDITABLE. */
  ivaImp: number;
  /** Monto del margen NewCo. */
  marginAmt: number;
  /** Precio de venta sin IVA (landed + margen). */
  price: number;
  /** IVA trasladado (16% sobre el precio). ACREDITABLE. */
  ivaOut: number;
  /** Precio all-in al joyero (price + IVA trasladado). */
  allin: number;
  /** Anticipo mínimo / capital de trabajo (landed + IVA importación). */
  float: number;
  /** Composición del precio (sin IVA), en MXN. */
  composition: QuoteComposition;
  /** Composición expresada como fracción de `price` (0–1). */
  compositionPct: QuoteComposition;
}

/** Tasa de IVA aplicable en México (16%). */
export const IVA_RATE = 0.16;

/** Garantiza un número finito; cualquier NaN/Infinity/undefined cae a 0. */
function num(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Calcula la cotización completa a partir de los supuestos.
 * Función PURA: misma entrada -> misma salida, sin efectos colaterales.
 */
export function computeQuote(inputs: QuoteInputs): QuoteResult {
  const stoneUsd = num(inputs.stoneUsd);
  const fx = num(inputs.fx);
  const logi = num(inputs.logi);
  const igi = num(inputs.igi);
  const dta = num(inputs.dta);
  const agente = num(inputs.agente);
  const margin = num(inputs.margin);

  const stoneMxn = stoneUsd * fx;
  const aduana = stoneMxn + logi; // Valor en aduana
  const igiAmt = aduana * (igi / 100);
  const dtaAmt = aduana * (dta / 100);
  const landed = aduana + igiAmt + dtaAmt + agente; // Costo aterrizado
  const ivaImp = (aduana + igiAmt + dtaAmt) * IVA_RATE; // IVA importación (acreditable)
  const marginAmt = landed * (margin / 100);
  const price = landed + marginAmt; // Precio de venta (sin IVA)
  const ivaOut = price * IVA_RATE; // IVA trasladado (acreditable)
  const allin = price + ivaOut; // Precio all-in al joyero
  const float = landed + ivaImp; // Anticipo mínimo (capital de trabajo)

  const composition: QuoteComposition = {
    piedra: stoneMxn,
    logistica: logi,
    aduana: igiAmt + dtaAmt + agente,
    servicio: marginAmt,
  };

  const denom = price > 0 ? price : 1;
  const compositionPct: QuoteComposition = {
    piedra: composition.piedra / denom,
    logistica: composition.logistica / denom,
    aduana: composition.aduana / denom,
    servicio: composition.servicio / denom,
  };

  return {
    stoneMxn,
    aduana,
    igiAmt,
    dtaAmt,
    agenteAmt: agente,
    landed,
    ivaImp,
    marginAmt,
    price,
    ivaOut,
    allin,
    float,
    composition,
    compositionPct,
  };
}

/** Supuestos por defecto para v1 (editables a mano en la UI). */
export const DEFAULT_INPUTS: QuoteInputs = {
  stoneDesc: "Diamante redondo 1.50 ct",
  stoneCert: "GIA 2456789012",
  stoneUsd: 8500,
  fx: 18.5,
  logi: 3500,
  igi: 0,
  dta: 0.8,
  agente: 6500,
  margin: 12,
};

const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto en pesos mexicanos (es-MX). */
export function formatMXN(value: number): string {
  return mxnFormatter.format(num(value));
}

/** Formatea un monto en dólares (es-MX). */
export function formatUSD(value: number): string {
  return usdFormatter.format(num(value));
}

/** Formatea una fracción (0–1) como porcentaje con un decimal. */
export function formatPct(fraction: number): string {
  return `${(num(fraction) * 100).toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
