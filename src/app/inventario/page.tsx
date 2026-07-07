import type { Metadata } from "next";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { PendingApproval } from "@/components/pending-approval";
import { InventoryBrowser } from "@/components/inventory/inventory-browser";

export const metadata: Metadata = {
  title: "NewCo · Inventario de proveedor",
  description:
    "Explora el inventario del proveedor y arma una propuesta para tu cliente.",
};

export default async function InventarioPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const jeweler = user?.jewelerId ? await repo.getJeweler(user.jewelerId) : null;

  // Cuenta registrada pero aún no aprobada por NewCo → sin inventario.
  if (user?.role === "jeweler" && jeweler && !jeweler.approved) {
    return <PendingApproval name={jeweler.name} />;
  }
  return (
    <main className="flex-1">
      <InventoryBrowser user={user} displayName={jeweler?.name} />
    </main>
  );
}
