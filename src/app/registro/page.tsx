"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/auth-actions";

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2.5 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
      />
    </label>
  );
}

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registerAction, {});

  return (
    <main className="relative z-10 flex min-h-[80vh] flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-3 grid h-11 w-11 place-items-center rounded-[6px] bg-[var(--primary)] text-[17px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30"
            aria-hidden
          >
            N
          </div>
          <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
            Registro por invitación
          </h1>
          <p className="label-caps mt-1 text-[10px] text-[var(--on-surface-variant)]">
            Importación de diamantes · sólo joyeros
          </p>
        </div>

        {state?.ok ? (
          <div className="card-surface rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 text-center">
            <span className="label-caps text-[10px] text-[#3f7a5e]">
              ✓ Solicitud enviada
            </span>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--on-surface-variant)]">
              Tu cuenta quedó registrada y{" "}
              <b className="text-[var(--on-surface)]">
                pendiente de aprobación por NewCo
              </b>
              . Validamos que seas joyero antes de abrirte el inventario — te
              avisamos en cuanto esté lista.
            </p>
            <Link
              href="/login"
              className="mt-5 block w-full rounded-[8px] bg-[var(--primary)] py-3 text-[13px] font-medium text-[var(--on-primary)] hover:opacity-90"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form
            action={action}
            className="card-surface rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6"
          >
            <div className="flex flex-col gap-4">
              <Field name="name" label="Nombre de tu joyería" placeholder="Vecchia Jewelry" />
              <Field name="email" label="Correo" type="email" placeholder="tucorreo@joyeria.mx" />
              <Field name="password" label="Contraseña" type="password" placeholder="••••••••" />
            </div>

            {state?.error ? (
              <p className="mt-3 rounded-[6px] border border-[rgba(158,68,39,0.35)] bg-[rgba(158,68,39,0.08)] px-3 py-2 text-[12px] text-[var(--secondary)]">
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-5 w-full rounded-[8px] bg-[var(--primary)] py-3 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Solicitar acceso"}
            </button>
            <p className="mt-3 text-[10.5px] leading-snug text-[var(--outline)]">
              Las cuentas nuevas requieren aprobación del equipo NewCo antes de
              entrar al inventario.
            </p>
            <Link
              href="/login"
              className="mt-2 block text-center text-[12px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
