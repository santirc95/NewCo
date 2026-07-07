"use server";

import { auth } from "@/auth";
import { repo, type ProposalView, type ProposalPatch } from "@/lib/repo";
import { notifier, supplier } from "@/lib/notify";
import { payments } from "@/lib/payments";
import { getMockStone } from "@/lib/inventory";
import { quoteStones, DEFAULT_OP } from "@/lib/quote";
import type { ImportMethod, Proposal } from "@/lib/types";

async function currentJewelerId(): Promise<string | undefined> {
  const s = await auth();
  return s?.user?.jewelerId;
}

/** El joyero arma la propuesta y obtiene el link público. */
export async function createProposalAction(
  clientName: string,
  stoneIds: string[],
  jewelerWhatsapp?: string,
): Promise<Proposal> {
  const jewelerId = (await currentJewelerId()) ?? "jwl-vecchia";
  const digits = (jewelerWhatsapp ?? "").replace(/\D/g, "");
  return repo.createProposal({
    jewelerId,
    clientName: clientName.trim(),
    stoneIds,
    jewelerWhatsapp: digits || undefined,
  });
}

/** El cliente final señala interés (puede cambiar dentro del mismo set). */
export async function signalInterestAction(
  token: string,
  stoneId: string,
): Promise<Proposal | null> {
  const p = await repo.signalInterest(token, stoneId);
  if (p) notifier.jewelerSignaled(p.id, stoneId, p.clientName);
  return p ?? null;
}

/**
 * Edita una propuesta del joyero en sesión (validado en servidor). El set de
 * piedras y la señal sólo se editan mientras la orden NO está en firme;
 * el nombre del cliente siempre.
 */
export async function updateProposalAction(
  token: string,
  patch: ProposalPatch,
): Promise<ProposalView | null> {
  const jewelerId = await currentJewelerId();
  const p = await repo.getProposal(token);
  if (!p || p.jewelerId !== jewelerId) return null;
  const editable = p.status === "enviada" || p.status === "señalada";
  const safe: ProposalPatch = editable
    ? patch
    : { clientName: patch.clientName };
  await repo.updateProposal(token, safe);
  return (await repo.viewProposal(token)) ?? null;
}

/**
 * El joyero pone la ORDEN EN FIRME: crea la Order (etapa "confirmada") con
 * snapshots y deja la piedra en hold. Elegir método y pagar es el paso
 * siguiente (Opción A).
 */
export async function confirmOrderAction(
  token: string,
  stoneId: string,
): Promise<ProposalView | null> {
  const stone = getMockStone(stoneId);
  if (!stone) return null;
  const bands = await repo.listBands();
  const quote = quoteStones([stone], DEFAULT_OP, null, bands);
  await repo.confirmOrder({
    token,
    stoneId,
    stoneSnapshot: { ...stone },
    quoteSnapshot: quote,
    totalUsd: stone.supplierPriceUsd,
  });
  return (await repo.viewProposal(token)) ?? null;
}

/**
 * PAGO 1 (Opción A): al elegir el método el joyero paga POR ADELANTADO; con el
 * pago confirmado NewCo compra al proveedor (regla de oro) y se suelta el hold.
 * - Consolidada: paga SÓLO el costo de la piedra; la logística se congela y se
 *   paga al corte (Pago 2). La piedra queda resguardada con el proveedor.
 * - Directa: paga piedra + logística en el mismo momento (no hay corte).
 */
export async function payOrderAction(
  token: string,
  method: ImportMethod,
): Promise<ProposalView | null> {
  const view = await repo.viewProposal(token);
  const order = view?.order;
  if (!order) return null;

  const shipment =
    method === "consolidada" ? await repo.getOpenShipment() : undefined;
  if (method === "consolidada" && !shipment) return null; // sin barco abierto

  // 1) Cobro al joyero (NewCo como principal). NewCo nunca financia.
  const line = order.quoteSnapshot.lines[0];
  const amount =
    method === "consolidada"
      ? (line?.stoneMxn ?? order.quoteSnapshot.allin) // Pago 1: la piedra
      : order.quoteSnapshot.allin; // directa: piedra + logística
  const pay = await payments.charge(amount);
  if (pay.status !== "confirmado") return null;

  // 2) Pago confirmado → método + folio + compra al proveedor + hold suelto.
  const paid = await repo.payOrder({
    orderId: order.id,
    method,
    paymentRef: pay.ref,
    shipmentId: shipment?.id,
  });
  if (!paid) return null;
  supplier.confirmOrder(order.stoneSnapshot.id ?? "");

  return (await repo.viewProposal(token)) ?? null;
}

/** Seguimiento del joyero: sus propuestas (o todas si admin). */
export async function listProposalsAction(): Promise<ProposalView[]> {
  const jewelerId = await currentJewelerId();
  return repo.listProposals(jewelerId);
}

/** Estado de una propuesta (para el cliente final). */
export async function getProposalAction(
  token: string,
): Promise<Proposal | null> {
  return (await repo.getProposal(token)) ?? null;
}
