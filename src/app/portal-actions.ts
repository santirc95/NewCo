"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import type { Jeweler, JewelerProfilePatch, MarginBand } from "@/lib/types";

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
