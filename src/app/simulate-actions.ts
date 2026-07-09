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
import { tierFor, tierRangeLabel, DEFAULT_TIERS } from "@/lib/tiers";
import type { QuoteLineInput, Stone } from "@/lib/types";

/** Un escenario de simulación por pieza (números de computeQuote). */
export interface SimScenario {
  priceMxn: number; // sin IVA (protagonista)
  allinMxn: number; // con IVA
  stoneMxn: number;
  fixedMxn: number; // flete + agente (completo o del escalón)
  aduanaMxn: number; // IGI + DTA
  serviceMxn: number;
  ivaMxn: number;
}

export interface StoneSimulation {
  individual: SimScenario;
  consolidado: SimScenario;
  /** Piedras del embarque abierto contando la tuya (base del escalón). */
  aboardCount: number;
  /** Escalón usado para la proyección (p. ej. "1–2", "6–8"). */
  tierLabel: string;
  tierCostMxn: number;
  savingsMxn: number;
}

/**
 * Dos escenarios para una piedra:
 * - INDIVIDUAL: computeQuote standalone (costo fijo completo) — costo real.
 * - CONSOLIDADO: proyección con el ESCALÓN ACTUAL del embarque abierto
 *   (piedras a bordo + la tuya). Sin relleno ficticio: si el barco va vacío,
 *   el estimado es el escalón bajo — conservador y honesto para cotizar.
 *   Siempre etiquetado "estimado"; el costo real se congela al corte.
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
    return {
      priceMxn: l.price,
      allinMxn: l.price * (1 + IVA_RATE),
      stoneMxn: l.stoneMxn,
      fixedMxn: l.logiShare + l.agenteShare,
      aduanaMxn: l.igiAmt + l.dtaAmt,
      serviceMxn: l.marginAmt,
      ivaMxn: l.price * IVA_RATE,
    };
  };

  // Individual — costo real standalone (fijo completo).
  const individual = toScenario(computeQuote([line], DEFAULT_OP));

  // Consolidado — escalón vigente del embarque abierto, contando esta piedra.
  const open = await repo.getOpenShipment();
  const aboardCount = (open?.orderIds.length ?? 0) + 1;
  const tiers = open?.tiers ?? DEFAULT_TIERS;
  const tier = tierFor(aboardCount, tiers) ?? tiers[0];
  // El costo del escalón sustituye el pool fijo, repartido en la proporción
  // flete/agente de la operación — así computeQuote sigue siendo la fuente.
  const fixedTotal = DEFAULT_OP.logiMxn + DEFAULT_OP.agenteMxn;
  const opTier = {
    ...DEFAULT_OP,
    logiMxn: (tier.costPerStoneMxn * DEFAULT_OP.logiMxn) / fixedTotal,
    agenteMxn: (tier.costPerStoneMxn * DEFAULT_OP.agenteMxn) / fixedTotal,
  };
  const consolidado = toScenario(computeQuote([line], opTier));

  if (!individual || !consolidado) return null;
  return {
    individual,
    consolidado,
    aboardCount,
    tierLabel: tierRangeLabel(tier),
    tierCostMxn: tier.costPerStoneMxn,
    savingsMxn: individual.allinMxn - consolidado.allinMxn,
  };
}
