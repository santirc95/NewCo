import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { AddressManager } from "@/components/portal/address-manager";

export const dynamic = "force-dynamic";

export default async function DireccionesPage() {
  const session = await auth();
  const jewelerId = session?.user?.jewelerId;
  const addresses = jewelerId ? await repo.listAddresses(jewelerId) : [];

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
        Direcciones de envío
      </h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Administra tus direcciones y marca una como predeterminada para tus
        entregas.
      </p>
      <AddressManager initial={addresses} />
    </div>
  );
}
