"use server";

import { auth } from "@/auth";
import { proposalStore } from "@/lib/store";
import type { Jeweler, MarginBand } from "@/lib/types";

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

/* ------------------------------ bandas (read) ----------------------------- */

/** Lectura de bandas — la usa el simulador/inventario para cotizar. */
export async function getBandsAction(): Promise<MarginBand[]> {
  await requireSession();
  return proposalStore.listBands();
}

/* ------------------------------ perfil joyero ----------------------------- */

export type ProfilePatch = Partial<
  Pick<
    Jeweler,
    "name" | "legalName" | "rfc" | "address" | "contactEmail" | "contactPhone"
  >
>;

export async function getMyJewelerAction(): Promise<Jeweler | null> {
  const s = await requireSession();
  const id = s.user.jewelerId;
  if (!id) return null;
  return proposalStore.getJeweler(id) ?? null;
}

export async function updateMyProfileAction(
  patch: ProfilePatch,
): Promise<Jeweler | null> {
  const s = await requireSession();
  const id = s.user.jewelerId;
  if (!id) throw new Error("No autorizado");
  return proposalStore.updateJewelerProfile(id, patch) ?? null;
}

/* --------------------------------- admin ---------------------------------- */

export async function adminListJewelersAction(): Promise<Jeweler[]> {
  await requireAdmin();
  return proposalStore.listJewelers();
}

export async function adminSetJewelerActiveAction(
  id: string,
  active: boolean,
): Promise<Jeweler | null> {
  await requireAdmin();
  return proposalStore.setJewelerActive(id, active) ?? null;
}

export async function adminSaveBandsAction(
  bands: MarginBand[],
): Promise<MarginBand[]> {
  await requireAdmin();
  return proposalStore.saveBands(bands);
}
