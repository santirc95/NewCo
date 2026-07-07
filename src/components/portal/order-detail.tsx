"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Order, Shape } from "@/lib/types";
import { formatMXN } from "@/lib/compute";
import { stagesForMethod, STAGE_LABEL } from "@/lib/order-stages";
import { GemTile } from "@/components/gem-icon";
import { advanceOrderAction } from "@/app/portal-actions";

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetail({ order: initial }: { order: Order }) {
  const [order, setOrder] = useState<Order>(initial);
  const [pending, startTransition] = useTransition();

  const stages = stagesForMethod(order.importMethod);
  const trackingMap = new Map(order.tracking.map((t) => [t.stage, t]));
  const complete = stages.every((s) => trackingMap.has(s.stage));
  // Eventos EXCEPCIONALES fuera del camino feliz (p. ej. pendiente_logistica).
  const stageSet = new Set(stages.map((s) => s.stage));
  const exceptions = order.tracking.filter((t) => !stageSet.has(t.stage));

  const advance = () => {
    startTransition(async () => {
      const updated = await advanceOrderAction(order.id);
      if (updated) setOrder(updated);
    });
  };

  const q = order.quoteSnapshot;

  return (
    <div>
      <Link
        href="/portal/compras"
        className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      >
        ← Compras
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="tabular text-[22px] font-bold text-[var(--on-surface)]">
            {order.folio ?? order.id}
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
            {fechaHora(order.createdAt)}
            {order.jewelerPaymentRef ? ` · pago ${order.jewelerPaymentRef}` : ""}
            {order.importMethod
              ? ` · importación ${order.importMethod}`
              : " · método por elegir"}
          </p>
        </div>
        <div className="text-right">
          <div className="tabular text-[20px] font-bold text-[var(--on-surface)]">
            {formatMXN(q.allin)}
          </div>
          <div className="label-caps text-[8.5px] text-[var(--outline)]">
            total con IVA
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trazabilidad — línea de vida */}
        <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <h2 className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            Trazabilidad
          </h2>
          <ol className="mt-4">
            {stages.map((s, i) => {
              const entry = trackingMap.get(s.stage);
              const done = Boolean(entry);
              const isLast = i === stages.length - 1;
              return (
                <li key={s.stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                        done
                          ? "border-[#4f9d79] bg-[#4f9d79]"
                          : "border-[var(--outline-variant)] bg-transparent"
                      }`}
                    >
                      {done ? (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    {!isLast ? (
                      <span
                        className={`w-0.5 flex-1 ${done ? "bg-[#4f9d79]" : "bg-[var(--hairline)]"}`}
                        style={{ minHeight: 26 }}
                      />
                    ) : null}
                  </div>
                  <div className={`pb-5 ${done ? "" : "opacity-55"}`}>
                    <div className="text-[13px] font-medium text-[var(--on-surface)]">
                      {s.label}
                    </div>
                    <div className="tabular text-[11px] text-[var(--on-surface-variant)]">
                      {entry ? fechaHora(entry.at) : "pendiente"}
                    </div>
                    {entry?.note ? (
                      <div className="mt-0.5 text-[10.5px] text-[var(--warn-text)]">
                        {entry.note}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {exceptions.length > 0 ? (
            <div className="mb-2 flex flex-col gap-1.5">
              {exceptions.map((e, i) => (
                <p
                  key={i}
                  className="rounded-[6px] border border-[rgba(158,68,39,0.35)] bg-[rgba(158,68,39,0.08)] px-3 py-2 text-[11.5px] leading-snug text-[var(--secondary)]"
                >
                  ⚠ {STAGE_LABEL[e.stage]} · {fechaHora(e.at)}
                  {e.note ? ` — ${e.note}` : ""}
                </p>
              ))}
            </div>
          ) : null}
          {order.importMethod === "consolidada" ? (
            <Link
              href="/embarques"
              className="mb-2 block rounded-[8px] border border-[var(--gold)] py-2 text-center text-[12px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
            >
              Ver embarque →
            </Link>
          ) : null}
          {!order.importMethod ? (
            <p className="mt-1 rounded-[6px] bg-[var(--warn-bg)] px-3 py-2 text-center text-[11.5px] text-[var(--warn-text)]">
              Elige el método de importación y paga para avanzar (en Propuestas).
            </p>
          ) : !order.finalCostConfirmed ? (
            <p className="mt-1 rounded-[6px] bg-[var(--warn-bg)] px-3 py-2 text-center text-[11.5px] leading-snug text-[var(--warn-text)]">
              Pago 2 pendiente: confirma y paga tu saldo logístico en Embarques
              ANTES del corte. Sin él, la piedra no entra al cierre y rebota.
            </p>
          ) : !complete ? (
            <button
              type="button"
              onClick={advance}
              disabled={pending}
              className="mt-1 w-full rounded-[8px] border border-[var(--hairline)] py-2 text-[12px] text-[var(--on-surface-variant)] transition-colors hover:border-[var(--gold)] hover:text-[var(--on-surface)] disabled:opacity-50"
            >
              {pending ? "Actualizando…" : "Avanzar estatus · demo"}
            </button>
          ) : (
            <p className="mt-1 text-center text-[11.5px] text-[#4f9d79]">
              ✓ Diamante entregado
            </p>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* Piezas (snapshot inmutable) */}
          <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <h2 className="label-caps text-[10px] text-[var(--on-surface-variant)]">
              Diamante
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <GemTile
                shape={(order.stoneSnapshot.shape ?? "Redondo") as Shape}
                size={30}
                className="h-14 w-14 shrink-0"
              />
              <div className="min-w-0">
                <div className="tabular text-[13px] text-[var(--on-surface)]">
                  {(order.stoneSnapshot.carat ?? 0).toFixed(2)} ct ·{" "}
                  {order.stoneSnapshot.shape} · {order.stoneSnapshot.color} ·{" "}
                  {order.stoneSnapshot.clarity}
                </div>
                <div className="tabular text-[11px] text-[var(--outline)]">
                  {order.stoneSnapshot.lab} {order.stoneSnapshot.certNumber}
                </div>
              </div>
            </div>
          </section>

          {/* Desglose inmutable */}
          <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <h2 className="label-caps text-[10px] text-[var(--on-surface-variant)]">
              Lo que pagaste
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <Row label="Costo aterrizado" value={q.landedTotal} />
              <Row label="Servicio de importación NewCo" value={q.marginAmt} />
              <Row label="Precio de venta (sin IVA)" value={q.price} />
              <Row label="IVA trasladado (16%)" value={q.ivaOut} tag="acreditable" />
              <div className="mt-1 flex items-center justify-between border-t border-[var(--hairline)] pt-2">
                <span className="font-semibold text-[var(--on-surface)]">
                  Precio de venta (con IVA incluido)
                </span>
                <span className="tabular text-[15px] font-bold text-[var(--on-surface)]">
                  {formatMXN(q.allin)}
                </span>
              </div>
              {order.finalCostConfirmed ? (
                <p className="mt-1 text-[11px] text-[#4f9d79]">
                  ✓ Ambos pagos cubiertos por adelantado (piedra + logística)
                </p>
              ) : order.importMethod === "consolidada" ? (
                <p className="mt-1 text-[10.5px] text-[var(--outline)]">
                  Pago 1 (piedra) cubierto · el saldo logístico se paga ANTES
                  del corte (Pago 2) — tu escalón queda garantizado al pagar.
                </p>
              ) : null}
            </div>
          </section>

          {/* Documentos */}
          <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
            <h2 className="label-caps text-[10px] text-[var(--on-surface-variant)]">
              Documentos
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-[12.5px]">
              <DocRow label="CFDI (folio)" value={order.folio} />
              <DocRow label="Pedimento" value={undefined} />
              <DocRow label="Guía / tracking" value={undefined} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tag,
}: {
  label: string;
  value: number;
  strong?: boolean;
  tag?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[var(--on-surface-variant)]">
        {label}
        {tag ? (
          <span className="label-caps rounded-[2px] bg-[rgba(95,163,130,0.15)] px-1 py-0.5 text-[8px] text-[#3f7a5e]">
            {tag}
          </span>
        ) : null}
      </span>
      <span
        className={`tabular ${strong ? "font-semibold text-[var(--on-surface)]" : "text-[var(--on-surface)]"}`}
      >
        {formatMXN(value)}
      </span>
    </div>
  );
}

function DocRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--on-surface-variant)]">{label}</span>
      {value ? (
        <span className="tabular text-[var(--on-surface)]">{value}</span>
      ) : (
        <span className="text-[var(--outline)]">pendiente</span>
      )}
    </div>
  );
}
