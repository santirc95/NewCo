"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSelection } from "@/components/selection-provider";
import { getMockStone } from "@/lib/inventory";
import { GemTile } from "@/components/gem-icon";
import { createProposalAction } from "@/app/actions";

/**
 * Bandeja de selección GLOBAL. La selección vive en el layout raíz y persiste
 * entre páginas, así que la bandeja acompaña al joyero en todas: puede llevar
 * las piezas al cotizador o armar la propuesta desde donde esté (inventario,
 * favoritos, detalle).
 */
export function SelectionTray() {
  const sel = useSelection();
  const [genOpen, setGenOpen] = useState(false);

  if (sel.selected.length === 0) return null;

  const href = `/cotizador?stones=${encodeURIComponent(sel.selected.join(","))}`;

  return (
    <>
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--surface)]/95 px-5 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex">
              {sel.selected.slice(0, 5).map((id, i) => {
                const s = getMockStone(id);
                return s ? (
                  <div
                    key={id}
                    className="rounded-md border border-[var(--hairline)]"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                  >
                    <GemTile shape={s.shape} size={22} className="h-9 w-9" />
                  </div>
                ) : null;
              })}
            </div>
            <div className="text-[13px] text-[var(--on-surface-variant)]">
              <b className="text-[var(--on-surface)]">{sel.selected.length}</b> de{" "}
              {sel.max}{" "}
              {sel.selected.length === 1
                ? "piedra seleccionada"
                : "piedras seleccionadas"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => sel.clear()}
              className="hidden text-[11.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)] sm:block"
            >
              Vaciar
            </button>
            <Link
              href={href}
              className="label-caps rounded-[6px] border border-[var(--gold)] px-3.5 py-2.5 text-[11px] text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
            >
              Ver en cotizador ({sel.selected.length})
            </Link>
            <button
              type="button"
              onClick={() => setGenOpen(true)}
              className="label-caps inline-flex items-center gap-2 rounded-[6px] bg-[var(--primary)] px-4 py-2.5 text-[11px] text-[var(--on-primary)] transition-opacity hover:opacity-90"
            >
              Armar propuesta →
            </button>
          </div>
        </div>
      </div>

      {genOpen ? (
        <GenerateModal
          stoneIds={sel.selected}
          onClose={() => setGenOpen(false)}
          onCreated={() => sel.clear()}
        />
      ) : null}
    </>
  );
}

function GenerateModal({
  stoneIds,
  onClose,
  onCreated,
}: {
  stoneIds: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    startTransition(async () => {
      const p = await createProposalAction(clientName, stoneIds, whatsapp);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setUrl(`${origin}/p/${p.token}`);
      onCreated();
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  const sendWhatsApp = () => {
    const hola = clientName.trim() ? `Hola ${clientName.trim()}, ` : "Hola, ";
    const msg = `${hola}te comparto una selección de diamantes que preparé para ti. Puedes verla aquí: ${url}`;
    // Sin número: WhatsApp deja elegir al contacto (el cliente).
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="text-[18px] font-semibold text-[var(--on-surface)]">
          Armar propuesta
        </h3>
        <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
          {stoneIds.length}{" "}
          {stoneIds.length === 1 ? "piedra seleccionada" : "piedras seleccionadas"}.
          Tu cliente verá imagen y specs (sin precio) y podrá señalar la que le
          interese.
        </p>

        {!url ? (
          <>
            <label className="mt-4 block">
              <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
                Nombre del cliente
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Andrea"
                className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
              />
            </label>
            <label className="mt-3 block">
              <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
                Tu WhatsApp · para el aviso del cliente
              </span>
              <div className="flex items-center overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] focus-within:border-[var(--gold)]">
                <span className="border-r border-[var(--hairline)] px-3 py-2 text-[13px] text-[var(--on-surface-variant)]">
                  🇲🇽 +52
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="55 0000 0000"
                  className="tabular w-full bg-transparent px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)]"
                />
              </div>
              <span className="mt-1 block text-[10.5px] text-[var(--outline)]">
                Cuando tu cliente marque una pieza, te llega un WhatsApp con cuál
                le gustó.
              </span>
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={pending}
              className="mt-5 w-full rounded-[8px] bg-[var(--primary)] py-3 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Generando…" : "Generar link"}
            </button>
          </>
        ) : (
          <div className="mt-4">
            <p className="label-caps text-[9px] text-[var(--outline)]">
              Link para tu cliente
            </p>
            <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2">
              <span className="tabular flex-1 truncate text-[12px] text-[var(--on-surface)]">
                {url}
              </span>
              <button
                type="button"
                onClick={copy}
                className="label-caps shrink-0 rounded-[5px] border border-[var(--hairline)] px-2 py-1 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <button
              type="button"
              onClick={sendWhatsApp}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1fa855] py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <WhatsAppIcon />
              Enviar por WhatsApp
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full rounded-[8px] border border-[var(--gold)] py-2.5 text-center text-[13px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
            >
              Abrir como lo verá tu cliente →
            </a>
            <Link
              href="/inventario"
              onClick={onClose}
              className="mt-2 block w-full rounded-[8px] py-2 text-center text-[12.5px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Ir a Propuestas
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-1.5 text-center text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.8-.9-2.07-1-.28-.1-.48-.15-.68.15-.2.3-.78 1-.96 1.2-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.5-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.03-1.06 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.16 4.56.72.3 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.08 1.8-.73 2.05-1.44.25-.7.25-1.3.18-1.44-.07-.13-.27-.2-.57-.35ZM12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2Z" />
    </svg>
  );
}
