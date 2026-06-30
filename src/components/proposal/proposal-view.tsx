"use client";

import { useState, useTransition } from "react";
import type { Stone } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";
import { signalInterestAction } from "@/app/actions";

interface ProposalData {
  clientName: string;
  signaledStoneId?: string;
  jewelerWhatsapp?: string;
}

/** Número a formato wa.me (con lada MX si vienen 10 dígitos). */
function waNumber(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `52${d}` : d;
}

function waMessage(clientName: string, s: Stone): string {
  const quien = clientName ? `Soy ${clientName}. ` : "";
  return `${quien}Me interesó este diamante de la selección que me enviaste: ${s.carat.toFixed(
    2,
  )} ct · ${s.shape} · color ${s.color} · ${s.clarity} · cert ${s.lab} (ref ${s.id}). ¿Podemos platicar?`;
}

/**
 * Superficie B — cliente final. Vista ligera y neutral (white-label = Cap.2).
 * Solo VE y SEÑALA: sin precio, sin pago, sin login, sin hold.
 */
export function ProposalView({
  token,
  proposal,
  stones,
}: {
  token: string;
  proposal: ProposalData | null;
  stones: Stone[];
}) {
  const [signaled, setSignaled] = useState<string | undefined>(
    proposal?.signaledStoneId,
  );
  const [pending, startTransition] = useTransition();

  if (!proposal || stones.length === 0) {
    return (
      <div className="relative z-10 mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="text-[22px] font-semibold text-[var(--on-surface)]">
          Selección no disponible
        </h1>
        <p className="mt-3 text-[14px] text-[var(--on-surface-variant)]">
          Este enlace no es válido o expiró. Pídele uno nuevo a tu asesor.
        </p>
      </div>
    );
  }

  const signal = (stone: Stone) => {
    setSignaled(stone.id); // optimista
    // Aviso al joyero por WhatsApp (click-to-chat) — dentro del gesto del click
    // para que el navegador no lo bloquee. // TODO Cap.2: push automático.
    if (proposal.jewelerWhatsapp) {
      const url = `https://wa.me/${waNumber(proposal.jewelerWhatsapp)}?text=${encodeURIComponent(
        waMessage(proposal.clientName, stone),
      )}`;
      window.open(url, "_blank", "noopener");
    }
    startTransition(async () => {
      await signalInterestAction(token, stone.id);
    });
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1000px] px-6">
      {/* Encabezado sobrio y neutral */}
      <header className="flex flex-col items-center px-6 pt-14 pb-2 text-center">
        <div className="mb-4 h-px w-10 bg-[var(--gold)] opacity-60" />
        <span className="label-caps text-[10px] text-[var(--warn-text)]">
          Selección privada
        </span>
        <h1 className="mt-3 text-[clamp(1.7rem,4vw,2.3rem)] font-semibold leading-tight text-[var(--on-surface)]">
          {proposal.clientName ? `${proposal.clientName}, ` : ""}una selección{" "}
          <span className="italic text-[var(--warn-text)]">para ti</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[500px] text-[14px] leading-relaxed text-[var(--on-surface-variant)]">
          Estas piezas fueron elegidas pensando en ti. Marca la que más te
          enamora y tu asesor te contacta para continuar — sin compromiso.
        </p>
      </header>

      {/* Piezas — imagen + specs, SIN precio */}
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stones.map((s) => {
          const isSignaled = signaled === s.id;
          return (
            <div
              key={s.id}
              className={`flex flex-col rounded-2xl border bg-[var(--surface)] p-6 transition-all duration-300 ${
                isSignaled
                  ? "border-[var(--gold)] shadow-[var(--shadow-card-hover)]"
                  : "border-[var(--hairline)]"
              }`}
            >
              <GemTile
                shape={s.shape}
                size={104}
                photoUrl={s.photoUrl}
                className="aspect-square w-full"
              />
              <div className="mt-3 text-center">
                <div className="tabular text-[28px] font-semibold leading-none text-[var(--on-surface)]">
                  {s.carat.toFixed(2)}{" "}
                  <span className="text-[14px] font-normal text-[var(--on-surface-variant)]">
                    ct
                  </span>
                </div>
                <div className="tabular mt-2 text-[12px] text-[var(--on-surface-variant)]">
                  {s.shape} · Color {s.color} · {s.clarity}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#5fa382]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5fa382]" aria-hidden />
                  Certificado {s.lab}
                </div>
              </div>

              <button
                type="button"
                onClick={() => signal(s)}
                disabled={pending && isSignaled}
                className={`mt-5 rounded-[10px] border-[1.5px] py-3 text-[13px] font-medium transition-all ${
                  isSignaled
                    ? "border-[var(--gold)] bg-[var(--gold)] text-white"
                    : "border-[var(--gold)] text-[var(--warn-text)] hover:bg-[var(--gold)] hover:text-white"
                }`}
              >
                {isSignaled ? "✓ Te interesa esta" : "Me interesa esta"}
              </button>
            </div>
          );
        })}
      </div>

      {signaled ? (
        <p className="mx-auto mt-8 max-w-[520px] text-center text-[14px] italic leading-relaxed text-[var(--on-surface-variant)]">
          Tu asesor ya recibió tu interés. Te contactará para continuar con calma
          — sin prisa.
        </p>
      ) : (
        <p className="mx-auto mt-8 max-w-[540px] text-center text-[16px] italic leading-relaxed text-[var(--on-surface-variant)]">
          Tómate el tiempo que necesites. Marca la que más te guste.
        </p>
      )}

      <footer className="mt-12 border-t border-[var(--hairline)] py-10 text-center">
        <p className="text-[11.5px] leading-relaxed text-[var(--outline)]">
          Cada diamante está certificado e importado oficialmente a México.
          <br />
          Tu asesor coordina entrega y detalles contigo.
        </p>
      </footer>
    </div>
  );
}
