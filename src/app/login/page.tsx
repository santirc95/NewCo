"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/auth-actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});

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
          <h1 className="text-[20px] font-bold text-[var(--on-surface)]">NewCo</h1>
          <p className="label-caps mt-1 text-[10px] text-[var(--on-surface-variant)]">
            Importación de diamantes · acceso
          </p>
        </div>

        <form
          action={action}
          className="card-surface rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6"
        >
          <label className="block">
            <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
              Correo
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="joyero@demo.mx"
              className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2.5 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
            />
          </label>
          <label className="mt-3 block">
            <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
              Contraseña
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2.5 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
            />
          </label>

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
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="mt-4 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] p-3 text-[11.5px] leading-relaxed text-[var(--on-surface-variant)]">
          <span className="label-caps text-[9px] text-[var(--outline)]">
            Cuentas demo
          </span>
          <div className="tabular mt-1">
            Joyero — joyero@demo.mx / joyero123
            <br />
            Admin — admin@newco.mx / newco123
          </div>
        </div>
      </div>
    </main>
  );
}
