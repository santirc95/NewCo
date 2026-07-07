import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import type { Order } from "@/lib/types";
import { PortalHeader } from "@/components/portal/portal-header";
import { AdminPanel } from "@/components/portal/admin-panel";
import { AdminShipments } from "@/components/portal/admin-shipments";
import { AdminSettings } from "@/components/portal/admin-settings";
import type { AdminShipmentInfo } from "@/app/portal-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user;
  // Doble validación en servidor (además del middleware).
  if (!user || user.role !== "admin") redirect("/login");

  const bands = await repo.listBands();
  const jewelers = await repo.listJewelers();
  const settings = await repo.getSettings();
  const shipments: AdminShipmentInfo[] = await Promise.all(
    (await repo.listShipments()).map(async (s) => {
      const orders = (
        await Promise.all(s.orderIds.map((id) => repo.getOrder(id)))
      ).filter((o): o is Order => Boolean(o));
      return {
        shipment: s,
        orderCount: orders.length,
        confirmedCount: orders.filter((o) => o.finalCostConfirmed).length,
      };
    }),
  );
  const pendingApprovals = jewelers.filter((j) => !j.approved).length;

  return (
    <main className="flex-1">
      <PortalHeader user={user} active="admin" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
          Portal NewCo · Admin
        </h1>
        <p className="mt-1 mb-7 text-[12.5px] text-[var(--on-surface-variant)]">
          Embarques, configuración, márgenes y joyeros
          {pendingApprovals
            ? ` · ${pendingApprovals} solicitud${pendingApprovals === 1 ? "" : "es"} de registro pendiente${pendingApprovals === 1 ? "" : "s"}`
            : ""}
          . El joyero nunca accede aquí.
        </p>
        <div className="flex flex-col gap-8">
          <AdminShipments initial={shipments} />
          <AdminSettings initial={settings} />
          <AdminPanel initialBands={bands} initialJewelers={jewelers} />
        </div>
      </div>
    </main>
  );
}
