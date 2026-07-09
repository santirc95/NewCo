/**
 * Núcleo de cálculo — Etapa 1.1 (función PURA, fuera de la UI).
 *
 * - `resolveMargin`: el margen NO es fijo; lo resuelve una política de bandas
 *   GLOBALES por valor de piedra (USD). Preparado para apilar lealtad en Cap.2.
 * - `computeQuote`: cotiza 1+ piedras. Los costos por piedra (piedra/IGI/IVA/
 *   margen de su banda) ESCALAN; el flete+seguro y el agente aduanal se
 *   PRORRATEAN POR VALOR entre las piedras de la orden.
 */

import type {
  Stone,
  Jeweler,
  MarginBand,
  OpParams,
  QuoteLineInput,
  LineQuote,
  Quote,
} from "./types";

/** Tasa de IVA en México (16%). Acreditable, no es pasivo. */
export const IVA_RATE = 0.16;

/** Parámetros de operación por defecto (ajustables por NewCo). */
export const DEFAULT_OP: OpParams = {
  fx: 18.5,
  logiMxn: 3500,
  igiPct: 0,
  dtaPct: 0.8,
  agenteMxn: 6500,
};

/** Bandas de margen por defecto (configurables por admin). */
export const DEFAULT_BANDS: MarginBand[] = [
  { id: "band-1", minValueUsd: 0, maxValueUsd: 8000, marginPct: 12 },
  { id: "band-2", minValueUsd: 8000, maxValueUsd: 20000, marginPct: 9 },
  { id: "band-3", minValueUsd: 20000, maxValueUsd: null, marginPct: 7 },
];

function num(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

/**
 * Resuelve el margen de una piedra según la banda en la que cae su valor (USD).
 * Etapa 1: bandas GLOBALES (el `jeweler` no influye todavía).
 */
export function resolveMargin(
  stone: Stone,
  _jeweler: Jeweler | null,
  bands: MarginBand[],
): number {
  const usd = num(stone.supplierPriceUsd);
  const band = bands.find(
    (b) =>
      usd >= b.minValueUsd && (b.maxValueUsd === null || usd < b.maxValueUsd),
  );
  const margin = band
    ? band.marginPct
    : bands.length
      ? bands[bands.length - 1].marginPct
      : 0;
  // TODO Cap.2: apilar descuento por lealtad según volumen acumulado del joyero.
  return margin;
}

/** Construye la línea de cotización de una piedra (margen ya resuelto). */
export function lineFromStone(
  stone: Stone,
  jeweler: Jeweler | null,
  bands: MarginBand[],
): QuoteLineInput {
  return {
    stoneId: stone.id,
    supplierPriceUsd: stone.supplierPriceUsd,
    marginPct: resolveMargin(stone, jeweler, bands),
  };
}

/**
 * Cotización de una orden de 1+ piedras.
 * N=1 → la piedra recibe 100% del flete y agente (costo standalone, piso
 * conservador). El prorrateo es POR VALOR, no por número de piedras.
 */
export function computeQuote(lines: QuoteLineInput[], op: OpParams): Quote {
  const fx = num(op.fx);
  const logiMxn = num(op.logiMxn);
  const igiPct = num(op.igiPct);
  const dtaPct = num(op.dtaPct);
  const agenteMxn = num(op.agenteMxn);

  const valorTotalUsd =
    lines.reduce((s, l) => s + num(l.supplierPriceUsd), 0) || 1;

  const lq: LineQuote[] = lines.map((l) => {
    const usd = num(l.supplierPriceUsd);
    const share = usd / valorTotalUsd;
    const stoneMxn = usd * fx;
    const logiShare = logiMxn * share;
    const agenteShare = agenteMxn * share;
    const aduana = stoneMxn + logiShare;
    const igiAmt = aduana * (igiPct / 100);
    const dtaAmt = aduana * (dtaPct / 100);
    const landed = aduana + igiAmt + dtaAmt + agenteShare;
    const marginPct = num(l.marginPct);
    const marginAmt = landed * (marginPct / 100);
    const price = landed + marginAmt;
    return {
      stoneId: l.stoneId,
      stoneMxn,
      logiShare,
      aduana,
      igiAmt,
      dtaAmt,
      agenteShare,
      landed,
      marginPct,
      marginAmt,
      price,
    };
  });

  const landedTotal = lq.reduce((s, l) => s + l.landed, 0);
  const marginAmt = lq.reduce((s, l) => s + l.marginAmt, 0);
  const price = landedTotal + marginAmt;
  // IGI y DTA son derechos aduaneros: NO causan IVA. La base del IVA excluye
  // esos montos (grava piedra + flete + agente + servicio).
  const igiDtaTotal = lq.reduce((s, l) => s + l.igiAmt + l.dtaAmt, 0);
  const ivaImp =
    lq.reduce((s, l) => s + l.aduana, 0) * IVA_RATE;
  const ivaOut = (price - igiDtaTotal) * IVA_RATE;
  const allin = price + ivaOut;
  const float = landedTotal + ivaImp;

  const composition = {
    stone: lq.reduce((s, l) => s + l.stoneMxn, 0),
    logistics: logiMxn,
    customs: lq.reduce((s, l) => s + l.igiAmt + l.dtaAmt, 0) + agenteMxn,
    service: marginAmt,
  };

  return {
    lines: lq,
    landedTotal,
    marginAmt,
    price,
    ivaImp,
    ivaOut,
    allin,
    float,
    composition,
  };
}

/** Conveniencia: cotiza un conjunto de piedras resolviendo el margen de cada una. */
export function quoteStones(
  stones: Stone[],
  op: OpParams,
  jeweler: Jeweler | null,
  bands: MarginBand[],
): Quote {
  return computeQuote(
    stones.map((s) => lineFromStone(s, jeweler, bands)),
    op,
  );
}
