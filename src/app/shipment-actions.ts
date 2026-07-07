"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import {
  computeQuote,
  resolveMargin,
  DEFAULT_OP,
  IVA_RATE,
} from "@/lib/quote";
import type {
  Order,
  Settings,
  ShipmentStatus,
  Stone,
  QuoteLineInput,
} from "@/lib/types";

/** Mis piedras dentro del embarque (sólo las propias — nunca las ajenas). */
export interface MyShipmentOrder {
  orderId: string;
  label: string;
  paidMxn: number;
  projectedMxn: number;
  /** Ajuste estimado a favor (+) o en contra (−) al cierre. */
  deltaMxn: number;
  finalCostConfirmed: boolean;
  // Desglose vivo de la simulación consolidada (sólo para piedras propias):
  landedMxn: number;
  serviceMxn: number;
  priceMxn: number;
  fixedShareMxn: number; // flete+agente prorrateado a esta piedra
}

/** Cotización agregada y ANÓNIMA de todo el embarque (mismo computeQuote). */
export interface ShipmentAggregate {
  allin: number;
  price: number;
  ivaOut: number;
  landedTotal: number;
  composition: { stone: number; logistics: number; customs: number; service: number };
}

/**
 * Tablero PÚBLICO del embarque: sólo agregados (nº de piedras, valor total,
 * costo prorrateado). NO identifica al joyero dueño de cada piedra.
 */
export interface ShipmentBoard {
  aggregate: ShipmentAggregate | null;
  shipmentId: string;
  weekLabel: string;
  cutoffAt: string;
  status: ShipmentStatus;
  settings: Settings;
  count: number;
  totalUsd: number;
  fixedCostMxn: number;
  avgFixedPerStoneMxn: number | null;
  nextAvgFixedPerStoneMxn: number;
  /** Ahorro total del embarque vs importar cada piedra por separado. */
  totalSavingsMxn: number;
  /** Costos fijos congelados (embarque cerrado). */
  frozen: boolean;
  myOrders: MyShipmentOrder[];
}

export async function getShipmentBoardAction(): Promise<ShipmentBoard | null> {
  const s = await auth();
  if (!s?.user) return null;
  const jewelerId = s.user.jewelerId;

  const settings = await repo.getSettings();
  const open = await repo.getOpenShipment();
  const shipment = open ?? (await repo.listShipments())[0];
  if (!shipment) return null;

  const orders = (
    await Promise.all(shipment.orderIds.map((id) => repo.getOrder(id)))
  ).filter((o): o is Order => Boolean(o));
  const bands = await repo.listBands();

  const frozen = shipment.frozenLogiMxn !== undefined;
  const op = {
    ...DEFAULT_OP,
    logiMxn: shipment.frozenLogiMxn ?? DEFAULT_OP.logiMxn,
    agenteMxn: shipment.frozenAgenteMxn ?? DEFAULT_OP.agenteMxn,
  };

  // Una línea por orden (key = orderId para no chocar ids de piedra repetidos).
  const lines: QuoteLineInput[] = orders.map((o) => {
    const usd = o.stoneSnapshot.supplierPriceUsd ?? o.totalUsd;
    return {
      stoneId: o.id,
      supplierPriceUsd: usd,
      marginPct: resolveMargin({ supplierPriceUsd: usd } as Stone, null, bands),
    };
  });

  const consolidated = lines.length ? computeQuote(lines, op) : null;
  const totalUsd = lines.reduce((x, l) => x + l.supplierPriceUsd, 0);
  const fixedCostMxn = op.logiMxn + op.agenteMxn;
  const standaloneTotal = lines.reduce(
    (x, l) => x + computeQuote([l], op).allin,
    0,
  );
  const totalSavingsMxn = consolidated
    ? standaloneTotal - consolidated.allin
    : 0;

  const myOrders: MyShipmentOrder[] = [];
  if (consolidated && jewelerId) {
    for (const o of orders) {
      if (o.jewelerId !== jewelerId) continue; // sólo lo propio
      const line = consolidated.lines.find((l) => l.stoneId === o.id);
      if (!line) continue;
      const projected = line.price * (1 + IVA_RATE);
      const paid = o.quoteSnapshot.allin;
      myOrders.push({
        orderId: o.id,
        label: `${(o.stoneSnapshot.carat ?? 0).toFixed(2)} ct · ${o.stoneSnapshot.shape ?? ""}`,
        paidMxn: paid,
        projectedMxn: projected,
        deltaMxn: paid - projected,
        finalCostConfirmed: Boolean(o.finalCostConfirmed),
        landedMxn: line.landed,
        serviceMxn: line.marginAmt,
        priceMxn: line.price,
        fixedShareMxn: line.logiShare + line.agenteShare,
      });
    }
  }

  return {
    aggregate: consolidated
      ? {
          allin: consolidated.allin,
          price: consolidated.price,
          ivaOut: consolidated.ivaOut,
          landedTotal: consolidated.landedTotal,
          composition: consolidated.composition,
        }
      : null,
    shipmentId: shipment.id,
    weekLabel: shipment.weekLabel,
    cutoffAt: shipment.cutoffAt,
    status: shipment.status,
    settings,
    count: lines.length,
    totalUsd,
    fixedCostMxn,
    avgFixedPerStoneMxn: lines.length ? fixedCostMxn / lines.length : null,
    nextAvgFixedPerStoneMxn: fixedCostMxn / (lines.length + 1),
    totalSavingsMxn,
    frozen,
    myOrders,
  };
}

/** Leyenda ligera del embarque abierto (para propuestas / urgencia sana). */
export interface ShipmentLegend {
  weekLabel: string;
  cutoffAt: string;
  shipmentDayLabel: string;
  transitWeeks: string;
}

export async function getShipmentLegendAction(): Promise<ShipmentLegend | null> {
  const s = await auth();
  if (!s?.user) return null;
  const settings = await repo.getSettings();
  const open = await repo.getOpenShipment();
  if (!open) return null;
  return {
    weekLabel: open.weekLabel,
    cutoffAt: open.cutoffAt,
    shipmentDayLabel: settings.shipmentDayLabel,
    transitWeeks: settings.transitWeeks,
  };
}

/** El joyero confirma su costo final al cierre (nunca se cobra sin confirmar). */
export async function confirmFinalCostAction(orderId: string): Promise<boolean> {
  const s = await auth();
  const jewelerId = s?.user?.jewelerId;
  if (!jewelerId) return false;
  const o = await repo.getOrder(orderId);
  if (!o || o.jewelerId !== jewelerId) return false;
  await repo.confirmFinalCost(orderId);
  return true;
}
