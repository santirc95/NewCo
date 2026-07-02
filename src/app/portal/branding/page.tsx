import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { BrandingForm } from "@/components/portal/branding-form";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const session = await auth();
  const jeweler = session?.user?.jewelerId
    ? await repo.getJeweler(session.user.jewelerId)
    : null;

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">Branding</h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Tu logo y marca. Se usará en el white-label de la propuesta (Capítulo 2).
      </p>
      <BrandingForm
        initial={{
          logoText: jeweler?.branding?.logoText ?? "",
          logoUrl: jeweler?.branding?.logoUrl,
        }}
      />
    </div>
  );
}
