"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { payments } from "@/lib/payments";
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
  /** Pago 1 ya realizado: el costo de la piedra. */
  stoneMxn: number;
  /** Pago 2: saldo logístico + impuestos + servicio + IVA (proyección/congelado). */
  saldoMxn: number;
  logisticsPaid: boolean;
  reboteCount: number;
  projectedMxn: number; // all-in por pieza (con IVA)
  // Desglose vivo de la simulación consolidada (sólo para piedras propias):
  landedMxn: number;
  serviceMxn: number;
  priceMxn: number; // por pieza SIN IVA (price_i)
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
      myOrders.push({
        orderId: o.id,
        label: `${(o.stoneSnapshot.carat ?? 0).toFixed(2)} ct · ${o.stoneSnapshot.shape ?? ""}`,
        stoneMxn: line.stoneMxn,
        saldoMxn: projected - line.stoneMxn,
        logisticsPaid: Boolean(o.finalCostConfirmed),
        reboteCount: o.reboteCount ?? 0,
        projectedMxn: projected,
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

/**
 * PAGO 2 — al corte: el joyero confirma y paga su saldo logístico congelado
 * (nunca se cobra un costo no confirmado; nunca viaja sin pagar).
 */
export async function payLogisticsAction(orderId: string): Promise<boolean> {
  const s = await auth();
  const jewelerId = s?.user?.jewelerId;
  if (!jewelerId) return false;
  const o = await repo.getOrder(orderId);
  if (!o || o.jewelerId !== jewelerId || o.finalCostConfirmed) return false;
  const shipment = o.shipmentId ? await repo.getShipment(o.shipmentId) : null;
  if (!shipment || shipment.status !== "cerrado") return false; // sólo al corte

  // Saldo con costos CONGELADOS: all-in de su línea consolidada − piedra ya pagada.
  const orders = (
    await Promise.all(shipment.orderIds.map((id) => repo.getOrder(id)))
  ).filter((x): x is Order => Boolean(x));
  const bands = await repo.listBands();
  const op = {
    ...DEFAULT_OP,
    logiMxn: shipment.frozenLogiMxn ?? DEFAULT_OP.logiMxn,
    agenteMxn: shipment.frozenAgenteMxn ?? DEFAULT_OP.agenteMxn,
  };
  const lines: QuoteLineInput[] = orders.map((x) => {
    const usd = x.stoneSnapshot.supplierPriceUsd ?? x.totalUsd;
    return {
      stoneId: x.id,
      supplierPriceUsd: usd,
      marginPct: resolveMargin({ supplierPriceUsd: usd } as Stone, null, bands),
    };
  });
  const q = computeQuote(lines, op);
  const line = q.lines.find((l) => l.stoneId === o.id);
  if (!line) return false;
  const saldo = line.price * (1 + IVA_RATE) - line.stoneMxn;

  const pay = await payments.charge(saldo);
  if (pay.status !== "confirmado") return false;
  await repo.payLogistics(orderId, pay.ref);
  return true;
}
