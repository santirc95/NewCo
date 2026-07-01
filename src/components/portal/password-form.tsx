"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/auth-actions";

function PwInput({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
        {label}
      </span>
      <input
        name={name}
        type="password"
        required
        autoComplete="off"
        className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
      />
    </label>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <PwInput name="current" label="Contraseña actual" />
        <PwInput name="next" label="Nueva contraseña" />
        <PwInput name="confirm" label="Confirmar nueva contraseña" />
      </div>

      {state?.error ? (
        <p className="mt-3 rounded-[6px] border border-[rgba(158,68,39,0.35)] bg-[rgba(158,68,39,0.08)] px-3 py-2 text-[12px] text-[var(--secondary)]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-3 rounded-[6px] border border-[#3f7a5e] bg-[rgba(79,157,121,0.08)] px-3 py-2 text-[12px] text-[#4f9d79]">
          ✓ Contraseña actualizada.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-[8px] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
