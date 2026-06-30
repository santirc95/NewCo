"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMXN } from "@/lib/compute";
import { stoneAllIn } from "@/lib/pricing";
import { getMockStone } from "@/lib/inventory";
import { decodeProposal } from "@/lib/proposal-token";
import type { Stone } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";

interface HoldState {
  stoneId: string;
  startedAt: number;
  expiresAt: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ProposalView({ token }: { token: string }) {
  const payload = useMemo(() => decodeProposal(token), [token]);

  const stones = useMemo<Stone[]>(() => {
    if (!payload) return [];
    return payload.stoneIds
      .map((id) => getMockStone(id))
      .filter((s): s is Stone => Boolean(s));
  }, [payload]);

  const [hold, setHold] = useState<HoldState | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!payload || stones.length === 0) {
    return (
      <div className="relative z-10 mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="text-[22px] font-semibold text-[var(--on-surface)]">
          Propuesta no disponible
        </h1>
        <p className="mt-3 text-[14px] text-[var(--on-surface-variant)]">
          Este enlace no es válido o expiró. Pídele a tu asesor uno nuevo.
        </p>
      </div>
    );
  }

  const { jeweler, clientName } = payload;

  return (
    <div className="relative z-10">
      {/* Marca del joyero (white-label) */}
      <header className="flex flex-col items-center px-6 pt-12 pb-2 text-center">
        <div
          className="mb-3 grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-[var(--gold)] text-[22px] font-semibold text-[var(--warn-text)]"
          aria-hidden
        >
          {jeweler.logoText || jeweler.name.slice(0, 1)}
        </div>
        <div className="text-[26px] font-semibold uppercase tracking-[0.08em] text-[var(--on-surface)]">
          {jeweler.name}
        </div>
        {jeweler.tagline ? (
          <div className="label-caps mt-1.5 text-[10px] text-[var(--outline)]">
            {jeweler.tagline}
          </div>
        ) : null}
        <div className="mt-5 h-px w-12 bg-[var(--gold)] opacity-50" />
      </header>

      <div className="mx-auto max-w-[1000px] px-6">
        {/* Intro personal */}
        <div className="mx-auto mt-8 max-w-[560px] text-center">
          <span className="label-caps text-[10px] text-[var(--warn-text)]">
            Selección privada
          </span>
          <h1 className="mt-3 text-[clamp(1.7rem,4vw,2.2rem)] font-semibold leading-tight text-[var(--on-surface)]">
            {clientName ? `${clientName}, ` : ""}elegimos{" "}
            {stones.length === 1 ? "esta pieza" : `estas ${numberWord(stones.length)} piezas`}{" "}
            <span className="italic text-[var(--warn-text)]">
              pensando en ti
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-relaxed text-[var(--on-surface-variant)]">
            Cada diamante está certificado y su disponibilidad fue confirmada hoy
            con nuestro proveedor. Si alguno te enamora, podemos apartarlo para ti
            mientras lo decides con calma.
          </p>
        </div>

        {/* Piezas */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stones.map((s) => (
            <ProposalCard
              key={s.id}
              stone={s}
              held={hold?.stoneId === s.id}
              dim={Boolean(hold) && hold?.stoneId !== s.id}
              expiresAt={hold?.stoneId === s.id ? hold.expiresAt : undefined}
              onReserve={() => setPendingId(s.id)}
              onRelease={() => setHold(null)}
            />
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-[540px] text-center text-[16px] italic leading-relaxed text-[var(--on-surface-variant)]">
          No hay prisa. Tómate el tiempo que necesites — para esto estamos.
        </p>
      </div>

      {/* Footer del joyero */}
      <footer className="mt-12 border-t border-[var(--hairline)] px-6 py-12 text-center">
        <div className="text-[16px] font-semibold uppercase tracking-[0.06em] text-[var(--on-surface)]">
          {jeweler.name}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--outline)]">
          {jeweler.address}
          {jeweler.advisorName ? (
            <>
              <br />
              Tu asesor(a) personal: {jeweler.advisorName}
            </>
          ) : null}
        </p>
      </footer>

      {/* Modal de apartado */}
      {pendingId ? (
        <HoldModal
          stone={stones.find((s) => s.id === pendingId)!}
          onClose={() => setPendingId(null)}
          onConfirm={() => {
            const stone = stones.find((s) => s.id === pendingId)!;
            const startedAt = Date.now();
            // Regla: la ventana al cliente NUNCA excede la del proveedor.
            // TODO v2: aplicar colchón y consumir el hold upstream real.
            const windowMs = stone.holdWindowHours * 3600 * 1000;
            setHold({ stoneId: stone.id, startedAt, expiresAt: startedAt + windowMs });
            setPendingId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function numberWord(n: number): string {
  return ["", "una", "dos", "tres", "cuatro", "cinco", "seis"][n] ?? String(n);
}

function ProposalCard({
  stone,
  held,
  dim,
  expiresAt,
  onReserve,
  onRelease,
}: {
  stone: Stone;
  held: boolean;
  dim: boolean;
  expiresAt?: number;
  onReserve: () => void;
  onRelease: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-[var(--surface)] p-6 transition-all duration-300 ${
        held
          ? "border-[var(--gold)] shadow-[var(--shadow-card-hover)]"
          : "border-[var(--hairline)]"
      } ${dim ? "opacity-50" : ""}`}
    >
      <GemTile shape={stone.shape} size={64} className="h-28" />
      <div className="mt-3 text-center">
        <div className="tabular text-[28px] font-semibold leading-none text-[var(--on-surface)]">
          {stone.carat.toFixed(2)}{" "}
          <span className="text-[14px] font-normal text-[var(--on-surface-variant)]">
            ct
          </span>
        </div>
        <div className="tabular mt-2 text-[12px] text-[var(--on-surface-variant)]">
          {stone.shape} · Color {stone.color} · {stone.clarity}
        </div>
      </div>

      {held && expiresAt ? (
        <HeldBox expiresAt={expiresAt} onRelease={onRelease} />
      ) : (
        <>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#5fa382]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5fa382]" aria-hidden />
            Certificado {stone.lab} · disponible hoy
          </div>
          <div className="mt-4 border-t border-[var(--hairline)] pt-4 text-center">
            <div className="label-caps text-[9px] text-[var(--outline)]">
              Precio total
            </div>
            <div className="tabular mt-1 text-[22px] font-semibold text-[var(--on-surface)]">
              {formatMXN(stoneAllIn(stone))}
            </div>
            <div className="mt-1 text-[10.5px] text-[var(--outline)]">
              Incluye importación, impuestos y entrega segura
            </div>
          </div>
          <button
            type="button"
            onClick={onReserve}
            disabled={dim}
            className={`mt-4 rounded-[10px] border-[1.5px] py-3 text-[13px] font-medium transition-all ${
              dim
                ? "cursor-not-allowed border-[var(--hairline)] text-[var(--outline)]"
                : "border-[var(--gold)] text-[var(--warn-text)] hover:bg-[var(--gold)] hover:text-white"
            }`}
          >
            {dim ? "Ya apartaste una pieza" : "Apartar mientras lo decido"}
          </button>
        </>
      )}
    </div>
  );
}

function HeldBox({
  expiresAt,
  onRelease,
}: {
  expiresAt: number;
  onRelease: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, expiresAt - Date.now()),
  );
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    ref.current = window.setInterval(tick, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [expiresAt]);

  const totalSec = Math.floor(remaining / 1000);
  const h = pad(Math.floor(totalSec / 3600));
  const m = pad(Math.floor((totalSec % 3600) / 60));
  const s = pad(totalSec % 60);

  return (
    <div className="mt-4 text-center">
      <div className="label-caps mb-2.5 inline-flex items-center gap-1.5 text-[10.5px] text-[var(--warn-text)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Apartado para ti
      </div>
      <div className="tabular text-[28px] font-semibold text-[var(--on-surface)]">
        {h}:{m}:{s}
      </div>
      <div className="text-[11px] text-[var(--on-surface-variant)]">restantes</div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--on-surface-variant)]">
        Te enviaremos un recordatorio por WhatsApp. Cuando estés lista, tu
        asesora cierra la compra contigo.
      </p>
      <button
        type="button"
        onClick={onRelease}
        className="mt-2.5 text-[11px] text-[var(--outline)] underline underline-offset-2 hover:text-[var(--on-surface-variant)]"
      >
        Liberar esta pieza
      </button>
    </div>
  );
}

function HoldModal({
  stone,
  onClose,
  onConfirm,
}: {
  stone: Stone;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const valid = phone.replace(/\D/g, "").length >= 10 && consent;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.5)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[430px] rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card-hover)]">
        <div className="flex justify-center">
          <GemTile shape={stone.shape} size={42} className="h-16 w-16" />
        </div>
        <h3 className="mt-4 text-center text-[22px] font-semibold leading-tight text-[var(--on-surface)]">
          Te guardamos esta pieza {stone.holdWindowHours} horas
        </h3>
        <p className="mx-auto mt-2.5 max-w-[340px] text-center text-[13px] leading-relaxed text-[var(--on-surface-variant)]">
          Sin compromiso de compra. Queremos que la decisión la tomes con calma —
          mientras tanto, nadie más podrá llevarse este diamante.
        </p>

        <div className="mt-5">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Tu WhatsApp
          </span>
          <div className="flex items-center overflow-hidden rounded-[10px] border border-[var(--hairline)] bg-[var(--surface-low)] focus-within:border-[var(--gold)]">
            <span className="border-r border-[var(--hairline)] bg-[var(--surface-high)] px-3 py-3 text-[14px] text-[var(--on-surface-variant)]">
              🇲🇽 +52
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="55 0000 0000"
              maxLength={13}
              className="tabular flex-1 bg-transparent px-3 py-3 text-[15px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)]"
            />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--gold)]"
          />
          <span className="text-[11.5px] leading-relaxed text-[var(--on-surface-variant)]">
            Acepto recibir recordatorios por WhatsApp sobre esta pieza apartada y
            el <span className="text-[var(--warn-text)]">aviso de privacidad</span>.
          </span>
        </label>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!valid}
          className={`mt-5 w-full rounded-[10px] py-3.5 text-[14px] font-medium text-white transition-all ${
            valid
              ? "bg-[var(--gold)] hover:brightness-105"
              : "cursor-not-allowed bg-[var(--gold)] opacity-40"
          }`}
        >
          Apartar mi diamante
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full py-1.5 text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
