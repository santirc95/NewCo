import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NewCo · Registro por invitación",
  robots: { index: false, follow: false },
};

/**
 * Registro por invitación — stub público. El formulario completo (alta +
 * aprobación de admin) se construye en la Fase 4.
 */
export default function RegistroPage() {
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
          Registro por invitación
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--on-surface-variant)]">
          NewCo es una plataforma de importación de diamantes para joyeros.
          El registro se valida con el equipo de NewCo antes de darte acceso
          al inventario.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-low)] px-6 py-8">
          <span className="label-caps text-[10px] text-[var(--warn-text)]">
            Muy pronto
          </span>
          <p className="mt-2 text-[12.5px] text-[var(--on-surface-variant)]">
            El formulario de alta está en construcción. Mientras tanto,
            responde el WhatsApp de quien te invitó para que NewCo te contacte.
          </p>
        </div>
      </div>
    </main>
  );
}
