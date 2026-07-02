"use server";

import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { getMockStone } from "@/lib/inventory";
import type { Favorite } from "@/lib/types";

async function jewelerId(): Promise<string | undefined> {
  const s = await auth();
  return s?.user?.jewelerId;
}

/** Ids de piedras marcadas como favoritas por el joyero. */
export async function listFavoriteIdsAction(): Promise<string[]> {
  const id = await jewelerId();
  if (!id) return [];
  return (await repo.listFavorites(id)).map((f) => f.stoneId);
}

/** Favoritos completos (con snapshot) — para la página de favoritos. */
export async function listFavoritesAction(): Promise<Favorite[]> {
  const id = await jewelerId();
  if (!id) return [];
  return repo.listFavorites(id);
}

/** Marca favorito guardando un snapshot de la piedra (el inventario es vivo). */
export async function addFavoriteAction(stoneId: string): Promise<void> {
  const id = await jewelerId();
  if (!id) return;
  const stone = getMockStone(stoneId);
  if (!stone) return;
  await repo.addFavorite(id, { ...stone });
}

export async function removeFavoriteAction(stoneId: string): Promise<void> {
  const id = await jewelerId();
  if (!id) return;
  await repo.removeFavorite(id, stoneId);
}
