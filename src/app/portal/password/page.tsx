import { PasswordForm } from "@/components/portal/password-form";

export const dynamic = "force-dynamic";

export default function PasswordPage() {
  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
        Contraseña
      </h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Actualiza tu contraseña de acceso.
      </p>
      <PasswordForm />
    </div>
  );
}
