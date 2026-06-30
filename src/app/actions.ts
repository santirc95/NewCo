"use server";

import { proposalStore, type ProposalView } from "@/lib/store";
import { notifier, supplier } from "@/lib/notify";
import { payments } from "@/lib/payments";
import { getMockStone } from "@/lib/inventory";
import { stoneAllIn } from "@/lib/pricing";
import type { Proposal } from "@/lib/types";

/** El joyero arma la propuesta y obtiene el link público. */
export async function createProposalAction(
  clientName: string,
  stoneIds: string[],
  jewelerWhatsapp?: string,
): Promise<Proposal> {
  const digits = (jewelerWhatsapp ?? "").replace(/\D/g, "");
  return proposalStore.create(clientName.trim(), stoneIds, digits || undefined);
}

/** El cliente final señala interés → notifica al joyero (mock). */
export async function signalInterestAction(
  token: string,
  stoneId: string,
): Promise<Proposal | null> {
  const p = proposalStore.signal(token, stoneId);
  if (p) notifier.jewelerSignaled(p.id, stoneId, p.clientName);
  return p ?? null;
}

/** El joyero dispara el hold sobre la piedra señalada. */
export async function triggerHoldAction(
  token: string,
  stoneId: string,
): Promise<ProposalView | null> {
  const r = proposalStore.hold(token, stoneId);
  if (!r) return null;
  return proposalStore.view(token) ?? null;
}

/**
 * Cobra al joyero y, SOLO DESPUÉS, confirma la orden con el proveedor.
 * Secuencia obligatoria: nunca confirmar con el proveedor sin el pago.
 */
export async function payJewelerAction(
  token: string,
  stoneId: string,
): Promise<ProposalView | null> {
  const stone = getMockStone(stoneId);
  const amountMxn = stone ? stoneAllIn(stone) : 0;

  // 1) Cobro al joyero (NewCo como principal).
  const pay = await payments.charge(amountMxn);
  if (pay.status !== "confirmado") return null;

  // 2) Pago confirmado → crear Order.
  const r = proposalStore.recordPayment(token, stoneId, pay.ref);
  if (!r) return null;

  // 3) Con el pago en mano, confirmar con el proveedor.
  supplier.confirmOrder(stoneId);
  proposalStore.markOrdered(token);

  return proposalStore.view(token) ?? null;
}

/** Seguimiento del joyero: lista enriquecida (propuesta + hold + order). */
export async function listProposalsAction(): Promise<ProposalView[]> {
  return proposalStore.list();
}

/** Estado de una propuesta (para el cliente final). */
export async function getProposalAction(
  token: string,
): Promise<Proposal | null> {
  return proposalStore.get(token) ?? null;
}
