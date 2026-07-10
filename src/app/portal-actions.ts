"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { stagesForMethod } from "@/lib/order-stages";
import type {
  Jeweler,
  JewelerProfilePatch,
  MarginBand,
  Order,
  ShippingAddress,
  PaymentMethod,
  Settings,
  Shipment,
  ShipmentStatus,
} from "@/lib/types";
import { DEFAULT_OP } from "@/lib/quote";

/* --------------------------- guards (servidor) ---------------------------- */

async function requireAdmin() {
  const s = await auth();
  if (s?.user?.role !== "admin") throw new Error("No autorizado");
  return s;
}

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("No autorizado");
  return s;
}

async function requireJewelerId(): Promise<string> {
  const s = await requireSession();
  const id = s.user.jewelerId;
  if (!id) throw new Error("No autorizado");
  return id;
}

/* ------------------------------ bandas (read) ----------------------------- */

/** Lectura de bandas — la usa el cotizador/inventario para cotizar. */
export async function getBandsAction(): Promise<MarginBand[]> {
  await requireSession();
  return repo.listBands();
}

/* ------------------------------ perfil joyero ----------------------------- */

export async function getMyJewelerAction(): Promise<Jeweler | null> {
  const s = await requireSession();
  const id = s.user.jewelerId;
  if (!id) return null;
  return (await repo.getJeweler(id)) ?? null;
}

export async function updateMyProfileAction(
  patch: JewelerProfilePatch,
): Promise<Jeweler | null> {
  const s = await requireSession();
  const id = s.user.jewelerId;
  if (!id) throw new Error("No autorizado");
  return (await repo.updateJewelerProfile(id, patch)) ?? null;
}

/* --------------------------------- admin ---------------------------------- */

export async function adminListJewelersAction(): Promise<Jeweler[]> {
  await requireAdmin();
  return repo.listJewelers();
}

export async function adminSetJewelerActiveAction(
  id: string,
  active: boolean,
): Promise<Jeweler | null> {
  await requireAdmin();
  return (await repo.setJewelerActive(id, active)) ?? null;
}

export async function adminSaveBandsAction(
  bands: MarginBand[],
): Promise<MarginBand[]> {
  await requireAdmin();
  return repo.saveBands(bands);
}

export async function adminSetJewelerApprovedAction(
  id: string,
  approved: boolean,
): Promise<Jeweler | null> {
  await requireAdmin();
  return (await repo.setJewelerApproved(id, approved)) ?? null;
}

/* ----------------------------- admin: config ------------------------------ */

export async function adminSaveSettingsAction(
  patch: Partial<Settings>,
): Promise<Settings> {
  await requireAdmin();
  return repo.saveSettings(patch);
}

/* --------------------------- admin: embarques ----------------------------- */

/** Embarque enriquecido para el panel (conteos, confirmaciones). */
export interface AdminShipmentInfo {
  shipment: Shipment;
  orderCount: number;
  confirmedCount: number;
}

async function enrich(s: Shipment): Promise<AdminShipmentInfo> {
  const orders = (
    await Promise.all(s.orderIds.map((id) => repo.getOrder(id)))
  ).filter((o): o is Order => Boolean(o));
  return {
    shipment: s,
    orderCount: orders.length,
    confirmedCount: orders.filter((o) => o.finalCostConfirmed).length,
  };
}

export async function adminListShipmentsAction(): Promise<AdminShipmentInfo[]> {
  await requireAdmin();
  const list = await repo.listShipments();
  return Promise.all(list.map(enrich));
}

export async function adminCreateShipmentAction(
  weekLabel: string,
  cutoffAt: string,
): Promise<AdminShipmentInfo> {
  await requireAdmin();
  return enrich(await repo.createShipment(weekLabel, cutoffAt));
}

/**
 * Corte semanal: cierra el embarque y CONGELA los costos fijos con el número
 * real de piedras. Después cada joyero confirma su costo final.
 */
export async function adminCloseShipmentAction(
  id: string,
  frozenLogiMxn?: number,
  frozenAgenteMxn?: number,
): Promise<AdminShipmentInfo | null> {
  await requireAdmin();
  const s = await repo.closeShipment(id, {
    frozenLogiMxn: frozenLogiMxn ?? DEFAULT_OP.logiMxn,
    frozenAgenteMxn: frozenAgenteMxn ?? DEFAULT_OP.agenteMxn,
  });
  return s ? enrich(s) : null;
}

/**
 * Avanza el embarque. Al ZARPAR (en_transito), sólo viajan las piedras con
 * logística pagada (Pago 2); las no pagadas REBOTAN al siguiente embarque
 * (recalculan logística; límite 3 → "pendiente de logística").
 */
export async function adminAdvanceShipmentAction(
  id: string,
  status: ShipmentStatus,
): Promise<{ ok: boolean; error?: string; info?: AdminShipmentInfo; bounced?: number }> {
  await requireAdmin();
  const current = await repo.getShipment(id);
  if (!current) return { ok: false, error: "Embarque no encontrado." };
  let bounced = 0;
  if (status === "en_transito") {
    const info = await enrich(current);
    bounced = info.orderCount - info.confirmedCount;
  }
  const s = await repo.advanceShipmentStatus(id, status);
  return s ? { ok: true, info: await enrich(s), bounced } : { ok: false };
}

/* -------------------------------- compras --------------------------------- */

export async function listMyOrdersAction(): Promise<Order[]> {
  const id = await requireJewelerId();
  return repo.listOrders(id);
}

export async function getMyOrderAction(orderId: string): Promise<Order | null> {
  const id = await requireJewelerId();
  const order = await repo.getOrder(orderId);
  if (!order || order.jewelerId !== id) return null; // sólo la propia
  return order;
}

/**
 * Avanza el estatus de la orden a la siguiente etapa. En producción lo dispara
 * logística/NewCo; aquí es un control de DEMO para ver la trazabilidad.
 * // TODO Cap.2: eventos reales (carrier, pedimento, CFDI).
 */
export async function advanceOrderAction(orderId: string): Promise<Order | null> {
  const id = await requireJewelerId();
  const order = await repo.getOrder(orderId);
  if (!order || order.jewelerId !== id) return null;
  // Sólo avanza con método elegido y AMBOS pagos cubiertos (nunca sin Pago 2).
  if (!order.importMethod || !order.finalCostConfirmed) return order;
  const done = new Set(order.tracking.map((t) => t.stage));
  const next = stagesForMethod(order.importMethod).find(
    (s) => !done.has(s.stage),
  );
  if (!next) return order;
  return (await repo.advanceOrder(orderId, next.stage)) ?? null;
}

/* ------------------------------ direcciones ------------------------------- */

export async function listAddressesAction(): Promise<ShippingAddress[]> {
  const id = await requireJewelerId();
  return repo.listAddresses(id);
}

export async function addAddressAction(
  data: Omit<ShippingAddress, "id" | "jewelerId" | "isDefault">,
): Promise<ShippingAddress[]> {
  const id = await requireJewelerId();
  await repo.addAddress(id, data);
  return repo.listAddresses(id);
}

export async function removeAddressAction(
  addressId: string,
): Promise<ShippingAddress[]> {
  const id = await requireJewelerId();
  await repo.removeAddress(addressId);
  return repo.listAddresses(id);
}

export async function setDefaultAddressAction(
  addressId: string,
): Promise<ShippingAddress[]> {
  const id = await requireJewelerId();
  await repo.setDefaultAddress(id, addressId);
  return repo.listAddresses(id);
}

/* ---------------------------- métodos de pago ----------------------------- */

export async function listPaymentMethodsAction(): Promise<PaymentMethod[]> {
  const id = await requireJewelerId();
  return repo.listPaymentMethods(id);
}

export async function addPaymentMethodAction(
  data: Omit<PaymentMethod, "id" | "jewelerId" | "isDefault">,
): Promise<PaymentMethod[]> {
  const id = await requireJewelerId();
  await repo.addPaymentMethod(id, data);
  return repo.listPaymentMethods(id);
}

export async function removePaymentMethodAction(
  methodId: string,
): Promise<PaymentMethod[]> {
  const id = await requireJewelerId();
  await repo.removePaymentMethod(methodId);
  return repo.listPaymentMethods(id);
}

export async function setDefaultPaymentMethodAction(
  methodId: string,
): Promise<PaymentMethod[]> {
  const id = await requireJewelerId();
  await repo.setDefaultPaymentMethod(id, methodId);
  return repo.listPaymentMethods(id);
}

/* -------------------------------- branding -------------------------------- */

export async function updateBrandingAction(branding: {
  logoText: string;
  logoUrl?: string;
}): Promise<Jeweler | null> {
  const id = await requireJewelerId();
  return (await repo.updateJewelerProfile(id, { branding })) ?? null;
}
