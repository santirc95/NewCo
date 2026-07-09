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
import type { Order, QuoteLineInput, Stone } from "@/lib/types";

/** Un escenario de simulación por pieza (números de computeQuote). */
export interface SimScenario {
  priceMxn: number; // sin IVA (protagonista)
  allinMxn: number; // con IVA
  stoneMxn: number;
  fixedMxn: number; // flete + agente (completo o prorrateado)
  aduanaMxn: number; // IGI + DTA
  serviceMxn: number;
  ivaMxn: number;
}

export interface StoneSimulation {
  individual: SimScenario;
  consolidado: SimScenario;
  /** Nº de piedras del embarque usado para la proyección consolidada. */
  basisCount: number;
  /** true si se completó con un embarque típico (no había volumen real). */
  typical: boolean;
  savingsMxn: number;
}

const TYPICAL_FILL = 6; // embarque típico para la proyección cuando falta volumen

function toScenario(
  q: ReturnType<typeof computeQuote>,
  stoneId: string,
): SimScenario | null {
  const l = q.lines.find((x) => x.stoneId === stoneId);
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
}

/**
 * Dos escenarios para una piedra:
 * - INDIVIDUAL: computeQuote standalone (costo fijo completo) — costo real.
 * - CONSOLIDADO: proyección con el embarque abierto actual (+ relleno hasta un
 *   embarque típico si falta volumen) — SIEMPRE etiquetado "estimado".
 */
export async function simulateStoneAction(
  stoneId: string,
): Promise<StoneSimulation | null> {
  const s = await auth();
  if (!s?.user) return null;
  const stone = getMockStone(stoneId);
  if (!stone) return null;
  const bands = await repo.listBands();

  const line = (id: string, usd: number): QuoteLineInput => ({
    stoneId: id,
    supplierPriceUsd: usd,
    marginPct: resolveMargin({ supplierPriceUsd: usd } as Stone, null, bands),
  });

  // Individual — costo real standalone.
  const qInd = computeQuote([line(stone.id, stone.supplierPriceUsd)], DEFAULT_OP);
  const individual = toScenario(qInd, stone.id);

  // Consolidado — embarque abierto real + relleno típico si hace falta.
  const open = await repo.getOpenShipment();
  const aboard = open
    ? (
        await Promise.all(open.orderIds.map((id) => repo.getOrder(id)))
      ).filter((o): o is Order => Boolean(o))
    : [];
  const lines: QuoteLineInput[] = [
    line(stone.id, stone.supplierPriceUsd),
    ...aboard.map((o, i) =>
      line(`aboard-${i}`, o.stoneSnapshot.supplierPriceUsd ?? o.totalUsd),
    ),
  ];
  let typical = false;
  while (lines.length < TYPICAL_FILL) {
    // Relleno con piedras de valor similar — proyección de embarque típico.
    lines.push(line(`typ-${lines.length}`, stone.supplierPriceUsd));
    typical = true;
  }
  const qCon = computeQuote(lines, DEFAULT_OP);
  const consolidado = toScenario(qCon, stone.id);

  if (!individual || !consolidado) return null;
  return {
    individual,
    consolidado,
    basisCount: lines.length,
    typical,
    savingsMxn: individual.allinMxn - consolidado.allinMxn,
  };
}
