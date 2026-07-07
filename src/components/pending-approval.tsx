import { logoutAction } from "@/app/auth-actions";

/**
 * Pantalla para cuentas registradas pero AÚN NO aprobadas por NewCo.
 * El inventario (y precios) se liberan cuando el admin aprueba.
 */
export function PendingApproval({ name }: { name?: string | null }) {
  return (
    <main className="relative z-10 flex min-h-[80vh] flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-[6px] bg-[var(--primary)] text-[17px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30"
          aria-hidden
        >
          N
        </div>
        <h1 className="text-[22px] font-bold text-[var(--on-surface)]">
          {name ? `${name}, tu` : "Tu"} cuenta está en revisión
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--on-surface-variant)]">
          NewCo valida que cada cuenta pertenezca a un joyero real antes de
          abrir el inventario y los precios. Normalmente toma menos de un día
          hábil — te avisamos en cuanto quede lista.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-[var(--gold)]/40 bg-[var(--warn-bg)] px-6 py-5">
          <span className="label-caps text-[10px] text-[var(--warn-text)]">
            Pendiente de aprobación
          </span>
        </div>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-[8px] border border-[var(--hairline)] px-4 py-2 text-[12.5px] text-[var(--on-surface-variant)] hover:border-[var(--gold)] hover:text-[var(--on-surface)]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
