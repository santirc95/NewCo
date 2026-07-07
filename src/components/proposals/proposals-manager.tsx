"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ImportMethod, ProposalStatus } from "@/lib/types";
import type { ProposalView as TrackedProposal } from "@/lib/repo";
import { getMockStone, getMockStones } from "@/lib/inventory";
import { STAGE_LABEL } from "@/lib/order-stages";
import { GemTile } from "@/components/gem-icon";
import {
  listProposalsAction,
  updateProposalAction,
  confirmOrderAction,
  payOrderAction,
} from "@/app/actions";
import {
  getShipmentLegendAction,
  type ShipmentLegend,
} from "@/app/shipment-actions";

/* ------------------------------- metadatos -------------------------------- */

const STATUS_META: Record<ProposalStatus, { label: string; cls: string }> = {
  enviada: { label: "Enviada", cls: "border-[var(--hairline)] text-[var(--on-surface-variant)]" },
  señalada: { label: "Señalada", cls: "border-[var(--gold)] text-[var(--warn-text)] bg-[var(--warn-bg)]" },
  confirmada: { label: "Confirmada", cls: "border-[#3c5a6b] text-[#5e87a0]" },
  en_embarque: { label: "En embarque", cls: "border-[#3c5a6b] text-[#5e87a0] bg-[rgba(94,135,160,0.08)]" },
  importando: { label: "Importando", cls: "border-[#3f7a5e] text-[#4f9d79]" },
  entregada: { label: "Entregada", cls: "border-[#3f7a5e] text-[#4f9d79] bg-[rgba(79,157,121,0.08)]" },
};

type Filter = "todas" | "activas" | "confirmadas" | "importacion";

const FILTERS: { key: Filter; label: string; match: (s: ProposalStatus) => boolean }[] = [
  { key: "todas", label: "Todas", match: () => true },
  { key: "activas", label: "Activas", match: (s) => s === "enviada" || s === "señalada" },
  { key: "confirmadas", label: "Confirmadas", match: (s) => s === "confirmada" },
  {
    key: "importacion",
    label: "En importación",
    match: (s) => s === "en_embarque" || s === "importando" || s === "entregada",
  },
];

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const r = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const h = String(Math.floor(r / 3600)).padStart(2, "0");
  const m = String(Math.floor((r % 3600) / 60)).padStart(2, "0");
  const s = String(r % 60).padStart(2, "0");
  return (
    <span className="tabular">
      {h}:{m}:{s}
    </span>
  );
}

/* -------------------------------- gestor ---------------------------------- */

export function ProposalsManager() {
  const [proposals, setProposals] = useState<TrackedProposal[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [editing, setEditing] = useState<TrackedProposal | null>(null);
  const [legend, setLegend] = useState<ShipmentLegend | null>(null);

  const refresh = () => listProposalsAction().then(setProposals).catch(() => {});
  useEffect(() => {
    refresh();
    getShipmentLegendAction().then(setLegend).catch(() => {});
    const i = setInterval(refresh, 3500);
    return () => clearInterval(i);
  }, []);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return proposals.filter((p) => f.match(p.proposal.status));
  }, [proposals, filter]);

  const countFor = (f: (typeof FILTERS)[number]) =>
    proposals.filter((p) => f.match(p.proposal.status)).length;

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 sm:px-8">
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">Propuestas</h1>
      <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
        Edita el set, comparte el link, refleja la señal de tu cliente y avanza:
        orden en firme → método (directa o embarque) → pago.
      </p>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-[6px] border px-2.5 py-1 text-[11.5px] transition-colors ${
              filter === f.key
                ? "border-[var(--gold)] bg-[var(--warn-bg)] text-[var(--warn-text)]"
                : "border-[var(--hairline)] bg-[var(--surface-low)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            }`}
          >
            {f.label} ({countFor(f)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-[13.5px] text-[var(--on-surface-variant)]">
          {proposals.length === 0
            ? "Aún no hay propuestas. Arma una desde el inventario."
            : "Ninguna propuesta en este filtro."}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {visible.map((p) => (
            <ProposalRow
              key={p.proposal.id}
              data={p}
              legend={legend}
              onChanged={refresh}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <EditModal
          data={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------- fila ----------------------------------- */

function ProposalRow({
  data,
  legend,
  onChanged,
  onEdit,
}: {
  data: TrackedProposal;
  legend: ShipmentLegend | null;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const { proposal, hold, order } = data;
  const meta = STATUS_META[proposal.status];
  const signaled = proposal.signaledStoneId
    ? getMockStone(proposal.signaledStoneId)
    : undefined;
  const editable =
    proposal.status === "enviada" || proposal.status === "señalada";
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${proposal.token}`
      : `/p/${proposal.token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  const changeSignal = (stoneId: string) => {
    startTransition(async () => {
      await updateProposalAction(proposal.token, { signaledStoneId: stoneId });
      onChanged();
    });
  };
  const doConfirm = () => {
    if (!proposal.signaledStoneId) return;
    startTransition(async () => {
      await confirmOrderAction(proposal.token, proposal.signaledStoneId!);
      onChanged();
    });
  };
  const doPay = (method: ImportMethod) => {
    startTransition(async () => {
      await payOrderAction(proposal.token, method);
      onChanged();
    });
  };

  const lastStage = order?.tracking[order.tracking.length - 1];

  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
      {/* Encabezado de la fila */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex">
            {proposal.stoneIds.slice(0, 4).map((id, i) => {
              const s = getMockStone(id);
              return s ? (
                <div
                  key={id}
                  className={`rounded-md border ${
                    id === proposal.signaledStoneId
                      ? "border-[var(--gold)]"
                      : "border-[var(--hairline)]"
                  }`}
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <GemTile shape={s.shape} size={22} className="h-9 w-9" />
                </div>
              ) : null;
            })}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--on-surface)]">
              {proposal.clientName || "Cliente"}
            </div>
            <div className="tabular text-[11px] text-[var(--on-surface-variant)]">
              {fecha(proposal.createdAt)} · {proposal.stoneIds.length}{" "}
              {proposal.stoneIds.length === 1 ? "pieza" : "piezas"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order && lastStage ? (
            <span className="label-caps rounded-[4px] border border-[var(--hairline)] px-2 py-1 text-[9px] text-[var(--on-surface-variant)]">
              {STAGE_LABEL[lastStage.stage]}
            </span>
          ) : null}
          <span
            className={`label-caps rounded-[4px] border px-2 py-1 text-[9px] ${meta.cls}`}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Link al cliente */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="tabular max-w-[340px] truncate rounded-[6px] border border-[var(--hairline)] bg-[var(--surface-low)] px-2.5 py-1.5 text-[11px] text-[var(--on-surface-variant)]">
          {url}
        </span>
        <button
          type="button"
          onClick={copy}
          className="label-caps rounded-[5px] border border-[var(--hairline)] px-2 py-1.5 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="label-caps rounded-[5px] border border-[var(--hairline)] px-2 py-1.5 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
        >
          Abrir ↗
        </a>
        {editable ? (
          <button
            type="button"
            onClick={onEdit}
            className="label-caps rounded-[5px] border border-[var(--hairline)] px-2 py-1.5 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
          >
            Editar propuesta
          </button>
        ) : null}
      </div>

      {/* Señal del cliente (editable dentro del mismo set) */}
      {editable ? (
        <div className="mt-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] p-3">
          <div className="label-caps text-[9px] text-[var(--outline)]">
            {signaled ? "El cliente señaló" : "Sin señal todavía"}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {proposal.stoneIds.map((id) => {
              const s = getMockStone(id);
              if (!s) return null;
              const active = id === proposal.signaledStoneId;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={pending}
                  onClick={() => changeSignal(id)}
                  className={`tabular rounded-[6px] border px-2.5 py-1.5 text-[11.5px] transition-colors disabled:opacity-50 ${
                    active
                      ? "border-[var(--gold)] bg-[var(--warn-bg)] text-[var(--warn-text)]"
                      : "border-[var(--hairline)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                  }`}
                >
                  {s.carat.toFixed(2)} ct · {s.shape}
                  {active ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10.5px] text-[var(--outline)]">
            Tu cliente puede cambiar de opinión dentro del mismo set; aquí lo
            reflejas tú también.
          </p>
        </div>
      ) : signaled ? (
        <div className="mt-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] p-3">
          <div className="label-caps text-[9px] text-[var(--outline)]">
            Pieza confirmada
          </div>
          <div className="tabular mt-1 text-[13px] text-[var(--on-surface)]">
            {signaled.carat.toFixed(2)} ct · {signaled.shape} · {signaled.color} ·{" "}
            {signaled.clarity} · {signaled.lab}
          </div>
        </div>
      ) : null}

      {/* Acciones según estado (Opción A) */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {proposal.status === "señalada" ? (
          <button
            type="button"
            onClick={doConfirm}
            disabled={pending}
            className="rounded-[8px] bg-[var(--primary)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Confirmando…" : "Poner orden en firme"}
          </button>
        ) : null}

        {hold && proposal.status === "confirmada" ? (
          <>
            <span className="rounded-[8px] border border-[#3c5a6b] px-3 py-2 text-[12.5px] text-[#5e87a0]">
              Hold vence en <Countdown expiresAt={hold.expiresAt} />
            </span>
            {signaled ? (
              <Link
                href={`/cotizador?stones=${signaled.id}`}
                className="rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[12.5px] text-[var(--on-surface)] transition-colors hover:border-[var(--gold)]"
              >
                Cotizar →
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => doPay("directa")}
              disabled={pending}
              className="rounded-[8px] bg-[var(--primary)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Procesando…" : "Realizar importación"}
            </button>
            <button
              type="button"
              onClick={() => doPay("consolidada")}
              disabled={pending}
              className="rounded-[8px] border border-[var(--gold)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)] disabled:opacity-50"
            >
              {pending ? "Procesando…" : "Agregar a embarque"}
            </button>
            {legend ? (
              <span className="basis-full text-[10.5px] text-[var(--outline)]">
                ⚓ {legend.weekLabel} · corte{" "}
                {new Date(legend.cutoffAt).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}{" "}
                · {legend.transitWeeks.toLowerCase()}
              </span>
            ) : null}
          </>
        ) : null}

        {order?.importMethod ? (
          <span className="tabular rounded-[8px] border border-[#3f7a5e] bg-[rgba(79,157,121,0.08)] px-3 py-2 text-[12px] text-[#4f9d79]">
            Piedra pagada · {order.jewelerPaymentRef} ·{" "}
            {order.importMethod === "consolidada"
              ? "en embarque · logística al corte"
              : "importación directa"}
          </span>
        ) : null}
        {order?.importMethod === "consolidada" ? (
          <Link
            href="/embarques"
            className="rounded-[8px] border border-[var(--gold)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
          >
            Ver embarque →
          </Link>
        ) : null}
        {order ? (
          <Link
            href={`/portal/compras/${order.id}`}
            className="rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[12.5px] text-[var(--on-surface)] transition-colors hover:border-[var(--gold)]"
          >
            Ver orden →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------ editar modal ------------------------------ */

function EditModal({
  data,
  onClose,
  onSaved,
}: {
  data: TrackedProposal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { proposal } = data;
  const [clientName, setClientName] = useState(proposal.clientName);
  const [stoneIds, setStoneIds] = useState<string[]>(proposal.stoneIds);
  const [pending, startTransition] = useTransition();

  const available = getMockStones().filter((s) => !stoneIds.includes(s.id));

  const save = () => {
    startTransition(async () => {
      await updateProposalAction(proposal.token, { clientName, stoneIds });
      onSaved();
    });
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="text-[18px] font-semibold text-[var(--on-surface)]">
          Editar propuesta
        </h3>

        <label className="mt-4 block">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Nombre del cliente
          </span>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          />
        </label>

        <div className="mt-4">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Piedras del set ({stoneIds.length}/4)
          </span>
          <div className="flex flex-col gap-2">
            {stoneIds.map((id) => {
              const s = getMockStone(id);
              if (!s) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2"
                >
                  <span className="tabular text-[12.5px] text-[var(--on-surface)]">
                    {s.carat.toFixed(2)} ct · {s.shape} · {s.color} · {s.clarity}
                  </span>
                  <button
                    type="button"
                    disabled={stoneIds.length <= 1}
                    onClick={() =>
                      setStoneIds((prev) => prev.filter((x) => x !== id))
                    }
                    className="rounded-[6px] border border-[var(--hairline)] px-2 py-1 text-[11px] text-[var(--on-surface-variant)] hover:border-[var(--secondary)] hover:text-[var(--secondary)] disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {stoneIds.length < 4 ? (
          <div className="mt-4">
            <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
              Agregar del inventario
            </span>
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
              {available.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStoneIds((prev) => [...prev, s.id])}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] px-3 py-2 text-left transition-colors hover:border-[var(--gold)]"
                >
                  <span className="tabular text-[12.5px] text-[var(--on-surface-variant)]">
                    {s.carat.toFixed(2)} ct · {s.shape} · {s.color} · {s.clarity}
                  </span>
                  <span className="label-caps text-[9px] text-[var(--warn-text)]">
                    + Agregar
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending || stoneIds.length === 0}
            className="rounded-[8px] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
