import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { ProfileForm } from "@/components/portal/profile-form";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const session = await auth();
  const jeweler = session?.user?.jewelerId
    ? ((await repo.getJeweler(session.user.jewelerId)) ?? null)
    : null;

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
        Facturación
      </h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Tu información comercial y fiscal (CFDI 4.0). Con estos datos NewCo emite
        tu factura.
      </p>
      <ProfileForm jeweler={jeweler} />
    </div>
  );
}
