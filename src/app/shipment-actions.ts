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
  Shipment,
  ShipmentStatus,
  ShipmentTier,
  Stone,
  QuoteLineInput,
} from "@/lib/types";
import { tierFor, nextTierInfo } from "@/lib/tiers";

/** Mis piedras dentro del embarque (sólo las propias — nunca las ajenas). */
export interface MyShipmentOrder {
  orderId: string;
  label: string;
  /** Pago 1 ya realizado: costo de la piedra (sin IVA). */
  stoneMxn: number;
  /** Pago 1 total ya pagado: piedra + su IVA. */
  pago1Mxn: number;
  /**
   * Pago 2 GARANTIZADO si pagas ahora: saldo calculado sobre las piedras ya
   * PAGADAS + la tuya (cierre atómico). Sólo puede bajar si pagan más —
   * por construcción nunca cae en un escalón más caro al cierre.
   */
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

/**
 * Renglón por piedra del desglose del embarque. Las ajenas van ANÓNIMAS
 * (sin specs ni dueño) — sólo su costo por pieza, que es información del
 * inventario público prorrateada, no un dato comercial del joyero.
 */
export interface PerStoneRow {
  orderId: string;
  mine: boolean;
  /** Sólo para piedras propias; ajenas = null (anónimas). */
  label: string | null;
  priceMxn: number; // sin IVA
  serviceMxn: number; // servicio de importación de ESTA piedra
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
  /** Un renglón por piedra (propias con specs, ajenas anónimas). */
  perStone: PerStoneRow[];
  shipmentId: string;
  weekLabel: string;
  cutoffAt: string;
  status: ShipmentStatus;
  settings: Settings;
  count: number;
  /** Piedras con logística PAGADA (las únicas que entran al cierre atómico). */
  paidCount: number;
  /** Pago 2 pendiente del joyero: total, nº de piezas y desglose (estimado). */
  myPendingSaldoMxn: number;
  myPendingCount: number;
  myPendingFixedMxn: number; // flete + agente (tu parte)
  myPendingAduanaMxn: number; // IGI + DTA
  myPendingServiceMxn: number; // servicio de importación NewCo
  myPendingIvaMxn: number; // IVA de los gastos (acreditable)
  /** Pago 1 ya pagado (piedra + IVA) de esas piezas pendientes — contexto. */
  myPendingPago1Mxn: number;
  /** Escalones de llenado (admin) + posición actual y siguiente. */
  tiers: ShipmentTier[];
  currentTier: ShipmentTier | null;
  nextTier: { missing: number; tier: ShipmentTier } | null;
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

  // Cierre atómico: sólo las PAGADAS definen el costo garantizado.
  const paidSet = new Set(shipment.paidLogisticsOrderIds);
  const paidOrders = orders.filter((o) => paidSet.has(o.id));

  // Renglón por piedra: propias con specs; ajenas anónimas (sin specs/dueño).
  const perStone: PerStoneRow[] = consolidated
    ? orders.map((o) => {
        const l = consolidated.lines.find((x) => x.stoneId === o.id);
        const mine = o.jewelerId === jewelerId;
        return {
          orderId: o.id,
          mine,
          label: mine
            ? `${(o.stoneSnapshot.carat ?? 0).toFixed(2)} ct · ${o.stoneSnapshot.shape ?? ""}`
            : null,
          priceMxn: l?.price ?? 0,
          serviceMxn: l?.marginAmt ?? 0,
        };
      })
    : [];

  const myOrders: MyShipmentOrder[] = [];
  let myPendingSaldoMxn = 0;
  let myPendingCount = 0;
  let myPendingFixedMxn = 0;
  let myPendingAduanaMxn = 0;
  let myPendingServiceMxn = 0;
  let myPendingIvaMxn = 0;
  let myPendingPago1Mxn = 0;
  if (consolidated && jewelerId) {
    for (const o of orders) {
      if (o.jewelerId !== jewelerId) continue; // sólo lo propio
      const line = consolidated.lines.find((l) => l.stoneId === o.id);
      if (!line) continue;
      const projected = line.price * (1 + IVA_RATE);
      // PAGO 1 (ya pagado) = piedra + su IVA. PAGO 2 = gastos de importación
      // (flete+agente + aduana + servicio) + IVA de esos gastos.
      const pago1 = line.stoneMxn * (1 + IVA_RATE);
      const saldo = o.finalCostConfirmed ? 0 : projected - pago1;
      if (!o.finalCostConfirmed) {
        myPendingSaldoMxn += saldo;
        myPendingCount += 1;
        myPendingFixedMxn += line.logiShare + line.agenteShare;
        myPendingAduanaMxn += line.igiAmt + line.dtaAmt;
        myPendingServiceMxn += line.marginAmt;
        myPendingIvaMxn += (line.price - line.stoneMxn) * IVA_RATE;
        myPendingPago1Mxn += pago1;
      }
      myOrders.push({
        orderId: o.id,
        label: `${(o.stoneSnapshot.carat ?? 0).toFixed(2)} ct · ${o.stoneSnapshot.shape ?? ""}`,
        stoneMxn: line.stoneMxn,
        pago1Mxn: pago1,
        saldoMxn: saldo,
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
    perStone,
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
    paidCount: paidOrders.length,
    myPendingSaldoMxn,
    myPendingCount,
    myPendingFixedMxn,
    myPendingAduanaMxn,
    myPendingServiceMxn,
    myPendingIvaMxn,
    myPendingPago1Mxn,
    tiers: shipment.tiers,
    currentTier: tierFor(lines.length, shipment.tiers),
    nextTier: nextTierInfo(lines.length, shipment.tiers),
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
 * PAGO 2 — ANTES del corte (cierre atómico): el joyero confirma y paga el
 * saldo de su ESCALÓN garantizado, calculado sobre las piedras ya pagadas +
 * la suya. Como los siguientes pagos sólo reparten más el costo fijo, el
 * número final al cierre nunca puede ser más caro que lo pagado (el caso
 * "escalón más caro al cierre" es imposible por construcción → cualquier
 * diferencia es ajuste a favor). Sólo con Pago 2 la piedra entra al corte.
 */
/**
 * PAGO 2 GLOBAL — el joyero paga la logística de TODAS sus piezas pendientes
 * en el embarque abierto, en un solo cargo. Saldo por pieza = gastos de
 * importación + su IVA = all-in − Pago 1(piedra + IVA de la piedra). Sólo con
 * Pago 2 las piezas entran al corte.
 */
export async function payAllLogisticsAction(): Promise<boolean> {
  const s = await auth();
  const jewelerId = s?.user?.jewelerId;
  if (!jewelerId) return false;
  const shipment = await repo.getOpenShipment();
  if (!shipment || shipment.status !== "abierto") return false;

  const orders = (
    await Promise.all(shipment.orderIds.map((id) => repo.getOrder(id)))
  ).filter((x): x is Order => Boolean(x));
  const bands = await repo.listBands();
  const lines: QuoteLineInput[] = orders.map((x) => {
    const usd = x.stoneSnapshot.supplierPriceUsd ?? x.totalUsd;
    return {
      stoneId: x.id,
      supplierPriceUsd: usd,
      marginPct: resolveMargin({ supplierPriceUsd: usd } as Stone, null, bands),
    };
  });
  const q = computeQuote(lines, DEFAULT_OP);

  const mine = orders.filter(
    (o) => o.jewelerId === jewelerId && !o.finalCostConfirmed,
  );
  if (mine.length === 0) return false;

  // Pago 2 = all-in − Pago 1(piedra + su IVA) = gastos + IVA de gastos.
  let total = 0;
  for (const o of mine) {
    const line = q.lines.find((l) => l.stoneId === o.id);
    if (line)
      total += (line.price - line.stoneMxn) * (1 + IVA_RATE);
  }
  const pay = await payments.charge(total);
  if (pay.status !== "confirmado") return false;
  for (const o of mine) await repo.payLogistics(o.id, pay.ref);
  return true;
}
