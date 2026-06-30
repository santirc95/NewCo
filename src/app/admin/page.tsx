import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { proposalStore } from "@/lib/store";
import { PortalHeader } from "@/components/portal/portal-header";
import { AdminPanel } from "@/components/portal/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user;
  // Doble validación en servidor (además del middleware).
  if (!user || user.role !== "admin") redirect("/login");

  const bands = proposalStore.listBands();
  const jewelers = proposalStore.listJewelers();

  return (
    <main className="flex-1">
      <PortalHeader user={user} active="admin" />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
          Portal NewCo · Admin
        </h1>
        <p className="mt-1 mb-7 text-[12.5px] text-[var(--on-surface-variant)]">
          Política de márgenes y gestión de joyeros. El joyero nunca accede aquí.
        </p>
        <AdminPanel initialBands={bands} initialJewelers={jewelers} />
      </div>
    </main>
  );
}
