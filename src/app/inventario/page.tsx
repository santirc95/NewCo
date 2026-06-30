import type { Metadata } from "next";
import { InventoryBrowser } from "@/components/inventory/inventory-browser";

export const metadata: Metadata = {
  title: "NewCo · Inventario de proveedor",
  description:
    "Explora el inventario del proveedor y arma una propuesta para tu cliente.",
};

export default function InventarioPage() {
  return (
    <main className="flex-1">
      <InventoryBrowser />
    </main>
  );
}
