import type { Metadata } from "next";
import { auth } from "@/auth";
import { InventoryBrowser } from "@/components/inventory/inventory-browser";

export const metadata: Metadata = {
  title: "NewCo · Inventario de proveedor",
  description:
    "Explora el inventario del proveedor y arma una propuesta para tu cliente.",
};

export default async function InventarioPage() {
  const session = await auth();
  return (
    <main className="flex-1">
      <InventoryBrowser user={session?.user ?? null} />
    </main>
  );
}
