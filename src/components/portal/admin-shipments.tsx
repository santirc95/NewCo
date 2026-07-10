"use client";

import { useState, useTransition } from "react";
import { formatMXN } from "@/lib/compute";
import { DEFAULT_OP } from "@/lib/quote";
import type { ShipmentStatus } from "@/lib/types";
import {
  adminCreateShipmentAction,
  adminCloseShipmentAction,
  adminAdvanceShipmentAction,
  type AdminShipmentInfo,
} from "@/app/portal-actions";

const STATUS_META: Record<ShipmentStatus, { label: string; cls: string }> = {
  abierto: { label: "Abierto", cls: "border-[#3f7a5e] text-[#4f9d79] bg-[rgba(79,157,121,0.08)]" },
  cerrado: { label: "Cerrado", cls: "border-[var(--gold)] text-[var(--warn-text)] bg-[var(--warn-bg)]" },
  en_transito: { label: "En tránsito", cls: "border-[#3c5a6b] text-[#5e87a0]" },
  entregado: { label: "Entregado", cls: "border-[var(--hairline)] text-[var(--on-surface-variant)]" },
};

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO → valor para input datetime-local (hora local). */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function AdminShipments({ initial }: { initial: AdminShipmentInfo[] }) {
  const [list, setList] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [cutoff, setCutoff] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(18, 0, 0, 0);
    return toLocalInput(d);
  });
  const [pending, startTransition] = useTransition();

  const replace = (info: AdminShipmentInfo) =>
    setList((prev) =>
      prev.map((x) => (x.shipment.id === info.shipment.id ? info : x)),
    );

  const create = () => {
    if (!label.trim() || !cutoff) return;
    startTransition(async () => {
      const info = await adminCreateShipmentAction(
        label.trim(),
        new Date(cutoff).toISOString(),
      );
      setList((prev) => [info, ...prev]);
      setCreating(false);
      setLabel("");
    });
  };

  const close = (id: string) => {
    setError(null);
    startTransition(async () => {
      const info = await adminCloseShipmentAction(id);
      if (info) replace(info);
    });
  };


  const advance = (id: string, status: ShipmentStatus) => {
    setError(null);
    startTransition(async () => {
      const r = await adminAdvanceShipmentAction(id, status);
      if (!r.ok) setError(r.error ?? "No se pudo avanzar el embarque.");
      else if (r.info) replace(r.info);
    });
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--on-surface)]">
            Embarques
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
            Cierre ATÓMICO al corte: sólo entran las piedras con logística
            pagada (Pago 2) y con ésas se congela el costo — las demás rebotan
            al siguiente embarque. La logística (flete + agente) es cuota fija,
            se reparte entre las piezas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[12.5px] text-[var(--on-surface)] hover:border-[var(--gold)]"
        >
          {creating ? "Cancelar" : "+ Nuevo embarque"}
        </button>
      </div>

      {creating ? (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface-low)] p-4 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Embarque · corte 16 de julio"
            className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          />
          <input
            type="datetime-local"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            className="tabular rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          />
          <button
            type="button"
            onClick={create}
            disabled={pending || !label.trim()}
            className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-[6px] border border-[rgba(158,68,39,0.35)] bg-[rgba(158,68,39,0.08)] px-3 py-2 text-[12px] text-[var(--secondary)]">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {list.map(({ shipment: s, orderCount, confirmedCount }) => {
          const meta = STATUS_META[s.status];
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-[var(--on-surface)]">
                    {s.weekLabel}
                  </span>
                  <span
                    className={`label-caps rounded-[4px] border px-1.5 py-0.5 text-[8.5px] ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="tabular mt-0.5 text-[11px] text-[var(--on-surface-variant)]">
                  Corte {fechaHora(s.cutoffAt)} · {orderCount}{" "}
                  {orderCount === 1 ? "piedra" : "piedras"} · logística pagada{" "}
                  {confirmedCount}/{orderCount}
                  {s.frozenLogiMxn !== undefined
                    ? ` · congelado: flete ${formatMXN(s.frozenLogiMxn)} + agente ${formatMXN(s.frozenAgenteMxn ?? 0)}`
                    : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.status === "abierto" ? (
                  <button
                    type="button"
                    onClick={() => close(s.id)}
                    disabled={pending}
                    title={`Cierre atómico: entran las ${confirmedCount} pagadas y se congela flete ${formatMXN(DEFAULT_OP.logiMxn)} + agente ${formatMXN(DEFAULT_OP.agenteMxn)}; las demás rebotan`}
                    className="rounded-[8px] bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
                  >
                    Cerrar corte
                  </button>
                ) : null}
                {s.status === "cerrado" ? (
                  <button
                    type="button"
                    onClick={() => advance(s.id, "en_transito")}
                    disabled={pending}
                    title="Sólo viajan piedras con logística pagada; las demás rebotan al siguiente embarque (límite 3)"
                    className="rounded-[8px] bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
                  >
                    Zarpar
                  </button>
                ) : null}
                {s.status === "en_transito" ? (
                  <button
                    type="button"
                    onClick={() => advance(s.id, "entregado")}
                    disabled={pending}
                    className="rounded-[8px] border border-[var(--hairline)] px-3 py-1.5 text-[12px] text-[var(--on-surface)] hover:border-[var(--gold)] disabled:opacity-50"
                  >
                    Marcar entregado
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
