"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { getMockStone } from "@/lib/inventory";
import {
  computeQuote,
  resolveMargin,
  DEFAULT_OP,
  IVA_RATE,
} from "@/lib/quote";
import type { QuoteLineInput, Stone } from "@/lib/types";

/** Un escenario de simulación por pieza (números de computeQuote). */
export interface SimScenario {
  priceMxn: number; // sin IVA (protagonista)
  allinMxn: number; // con IVA
  stoneMxn: number;
  fixedMxn: number; // flete + agente (completo o tu parte consolidada)
  aduanaMxn: number; // IGI + DTA
  serviceMxn: number;
  ivaMxn: number;
}

export interface StoneSimulation {
  individual: SimScenario;
  consolidado: SimScenario;
  /** Piedras del embarque abierto contando la tuya (base del prorrateo). */
  aboardCount: number;
  savingsMxn: number;
}

/**
 * Dos escenarios para una piedra:
 * - INDIVIDUAL: computeQuote standalone (costo fijo completo) — costo real.
 * - CONSOLIDADO: proyección repartiendo la CUOTA FIJA (flete + agente) entre
 *   las piezas del embarque abierto + la tuya. Si el barco va vacío, la piedra
 *   carga el fijo completo (conservador y honesto). Siempre "estimado"; el
 *   costo real se congela al corte.
 */
export async function simulateStoneAction(
  stoneId: string,
): Promise<StoneSimulation | null> {
  const s = await auth();
  if (!s?.user) return null;
  const stone = getMockStone(stoneId);
  if (!stone) return null;
  const bands = await repo.listBands();

  const line: QuoteLineInput = {
    stoneId: stone.id,
    supplierPriceUsd: stone.supplierPriceUsd,
    marginPct: resolveMargin(
      { supplierPriceUsd: stone.supplierPriceUsd } as Stone,
      null,
      bands,
    ),
  };

  const toScenario = (
    q: ReturnType<typeof computeQuote>,
  ): SimScenario | null => {
    const l = q.lines.find((x) => x.stoneId === stone.id);
    if (!l) return null;
    // IGI y DTA no causan IVA; la base grava piedra + flete + agente + servicio.
    const iva = (l.price - l.igiAmt - l.dtaAmt) * IVA_RATE;
    return {
      priceMxn: l.price,
      allinMxn: l.price + iva,
      stoneMxn: l.stoneMxn,
      fixedMxn: l.logiShare + l.agenteShare,
      aduanaMxn: l.igiAmt + l.dtaAmt,
      serviceMxn: l.marginAmt,
      ivaMxn: iva,
    };
  };

  // Individual — costo real standalone (fijo completo).
  const individual = toScenario(computeQuote([line], DEFAULT_OP));

  // Consolidado — cuota fija repartida entre las piezas a bordo + la tuya.
  // computeQuote de 1 línea da el 100% del fijo; dividirlo entre aboardCount
  // simula tu parte prorrateada del barco (por conteo, estimado).
  const open = await repo.getOpenShipment();
  const aboardCount = (open?.orderIds.length ?? 0) + 1;
  const opConsolidado = {
    ...DEFAULT_OP,
    logiMxn: DEFAULT_OP.logiMxn / aboardCount,
    agenteMxn: DEFAULT_OP.agenteMxn / aboardCount,
  };
  const consolidado = toScenario(computeQuote([line], opConsolidado));

  if (!individual || !consolidado) return null;
  return {
    individual,
    consolidado,
    aboardCount,
    savingsMxn: individual.allinMxn - consolidado.allinMxn,
  };
}
