"use server";

import { auth } from "@/auth";
import { repo, type ProposalView } from "@/lib/repo";
import { notifier, supplier } from "@/lib/notify";
import { payments } from "@/lib/payments";
import { getMockStone } from "@/lib/inventory";
import { computeQuote, lineFromStone, DEFAULT_OP } from "@/lib/quote";
import type { Proposal } from "@/lib/types";

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

/** El cliente final señala interés → notifica al joyero (mock). */
export async function signalInterestAction(
  token: string,
  stoneId: string,
): Promise<Proposal | null> {
  const p = await repo.signalInterest(token, stoneId);
  if (p) notifier.jewelerSignaled(p.id, stoneId, p.clientName);
  return p ?? null;
}

/** El joyero dispara el hold sobre la piedra señalada. */
export async function triggerHoldAction(
  token: string,
  stoneId: string,
): Promise<ProposalView | null> {
  return (await repo.triggerHold(token, [stoneId])) ?? null;
}

/**
 * Cobra al joyero y, SOLO DESPUÉS, confirma la orden con el proveedor.
 * Crea la Order con snapshots inmutables (piedra + cotización) + folio.
 */
export async function payJewelerAction(
  token: string,
  stoneId: string,
): Promise<ProposalView | null> {
  const stone = getMockStone(stoneId);
  if (!stone) return null;

  // Cotización inmutable al momento del pago (bandas vivas del store).
  const bands = await repo.listBands();
  const quote = computeQuote(
    [lineFromStone(stone, null, bands)],
    DEFAULT_OP,
  );

  // 1) Cobro al joyero (NewCo como principal).
  const pay = await payments.charge(quote.allin);
  if (pay.status !== "confirmado") return null;

  // 2) Pago confirmado → crear Order con snapshots + folio.
  const r = await repo.recordPaymentAndOrder({
    token,
    stoneIds: [stoneId],
    paymentRef: pay.ref,
    totalUsd: stone.supplierPriceUsd,
    quoteSnapshot: quote,
    stoneSnapshots: [{ ...stone }],
  });
  if (!r) return null;

  // 3) Con el pago en mano, confirmar con el proveedor.
  supplier.confirmOrder(stoneId);
  await repo.confirmOrderWithSupplier(r.order.id);

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
