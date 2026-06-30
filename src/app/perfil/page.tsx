import { auth } from "@/auth";
import { proposalStore } from "@/lib/store";
import { PortalHeader } from "@/components/portal/portal-header";
import { ProfileForm } from "@/components/portal/profile-form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  const user = session?.user;
  const jeweler = user?.jewelerId
    ? (proposalStore.getJeweler(user.jewelerId) ?? null)
    : null;

  return (
    <main className="flex-1">
      {user ? <PortalHeader user={user} active="perfil" /> : null}
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-[20px] font-bold text-[var(--on-surface)]">Mi perfil</h1>
        <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
          Tu información comercial y fiscal. Aparecerá en tu facturación.
        </p>
        <ProfileForm jeweler={jeweler} />
      </div>
    </main>
  );
}
