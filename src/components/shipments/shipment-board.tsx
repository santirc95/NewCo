"use client";

import { useEffect, useState, useTransition } from "react";
import { formatMXN } from "@/lib/compute";
import { HeroCard } from "@/components/hero-card";
import { IvaExplainer } from "@/components/iva-explainer";
import { AnimatedNumber } from "@/components/animated-number";
import { tierRangeLabel } from "@/lib/tiers";
import type { ShipmentStatus } from "@/lib/types";
import {
  getShipmentBoardAction,
  payLogisticsAction,
  type ShipmentBoard as Board,
} from "@/app/shipment-actions";

const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;

const SHIP_STATUS: Record<ShipmentStatus, { label: string; cls: string }> = {
  abierto: { label: "Abierto", cls: "border-[#3f7a5e] text-[#4f9d79] bg-[rgba(79,157,121,0.08)]" },
  cerrado: { label: "Cerrado · corte realizado", cls: "border-[var(--gold)] text-[var(--warn-text)] bg-[var(--warn-bg)]" },
  en_transito: { label: "En tránsito", cls: "border-[#3c5a6b] text-[#5e87a0]" },
  entregado: { label: "Entregado", cls: "border-[var(--hairline)] text-[var(--on-surface-variant)]" },
};

function CutoffCountdown({ cutoffAt }: { cutoffAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const r = Math.max(0, Math.floor((new Date(cutoffAt).getTime() - now) / 1000));
  const d = Math.floor(r / 86400);
  const h = Math.floor((r % 86400) / 3600);
  const m = Math.floor((r % 3600) / 60);
  return (
    <span className="tabular">
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m
    </span>
  );
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function LedgerRow({
  label,
  value,
  marker,
  total,
  savings,
  tag,
}: {
  label: string;
  value: number;
  marker?: string;
  total?: boolean;
  savings?: boolean;
  tag?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-2 py-2.5 ${
        total ? "bg-[var(--primary)] text-[var(--on-primary)] rounded-[6px] px-3" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {marker ? (
          <span
            aria-hidden
            className="h-3.5 w-[3px] shrink-0 rounded-[1px]"
            style={{ background: marker }}
          />
        ) : null}
        <span
          className={`truncate ${
            total
              ? "text-[13.5px] font-semibold"
              : savings
                ? "text-[13px] font-medium text-[#3f7a5e]"
                : "text-[13px] text-[var(--on-surface)]"
          }`}
        >
          {label}
        </span>
        {tag ? (
          <span className="label-caps shrink-0 rounded-[2px] bg-[rgba(95,163,130,0.15)] px-1.5 py-0.5 text-[9px] text-[#3f7a5e]">
            {tag}
          </span>
        ) : null}
      </div>
      <span
        className={`tabular shrink-0 text-right ${
          total
            ? "text-[14px] font-bold"
            : savings
              ? "text-[13.5px] font-semibold text-[#3f7a5e]"
              : "text-[13px] text-[var(--on-surface)]"
        }`}
      >
        {formatMXN(value)}
      </span>
    </div>
  );
}

export function ShipmentBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = () =>
    getShipmentBoardAction()
      .then((b) => {
        setBoard(b);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, []);

  if (!loaded) {
    return (
      <p className="py-20 text-center text-[13px] text-[var(--on-surface-variant)]">
        Cargando embarque…
      </p>
    );
  }
  if (!board) {
    return (
      <p className="py-20 text-center text-[13px] text-[var(--on-surface-variant)]">
        No hay embarques por ahora. NewCo abre uno cada semana.
      </p>
    );
  }

  const st = SHIP_STATUS[board.status];
  const payLogistics = (orderId: string) => {
    startTransition(async () => {
      await payLogisticsAction(orderId);
      refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 sm:px-8">
      {/* Leyendas configurables (Settings, admin) */}
      <div className="label-caps flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-[var(--warn-text)]">
        <span>{board.settings.shipmentDayLabel}</span>
        <span aria-hidden className="text-[var(--outline)]">·</span>
        <span>{board.settings.transitWeeks}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
            {board.weekLabel}
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
            Próximo embarque: {fechaCorta(board.cutoffAt)} · corte{" "}
            {board.status === "abierto" ? (
              <>
                en <CutoffCountdown cutoffAt={board.cutoffAt} />
              </>
            ) : (
              "realizado"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`label-caps rounded-[4px] border px-2 py-1 text-[9px] ${st.cls}`}
          >
            {st.label}
          </span>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="label-caps rounded-[6px] border border-[var(--gold)] px-3 py-1.5 text-[9px] text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
          >
            Invitar a un embarque
          </button>
        </div>
      </div>

      {/* El embarque ES el simulador: héroe con el quote consolidado en vivo */}
      {board.aggregate ? (
        <div className="mt-6">
          <HeroCard
            allin={board.aggregate.allin}
            price={board.aggregate.price}
            composition={board.aggregate.composition}
            servicioLabel="Servicio de importación NewCo"
            label={
              board.frozen
                ? "All-in del embarque · costos congelados"
                : "All-in del embarque · proyección en vivo"
            }
            subline={
              <>
                <span className="tabular text-white/90">
                  {board.count} {board.count === 1 ? "piedra" : "piedras"}
                </span>
                <span aria-hidden className="text-white/35">·</span>
                <span className="tabular text-white/90">
                  {formatUSD(board.totalUsd)}
                </span>
                <span aria-hidden className="text-white/35">·</span>
                <span>
                  ahorro vs importar por separado{" "}
                  <span className="tabular text-[var(--h-servicio)]">
                    {formatMXN(board.totalSavingsMxn)}
                  </span>
                </span>
              </>
            }
          />
          <p className="label-caps mt-2 text-center text-[8.5px] text-[var(--outline)]">
            Agregado anónimo del embarque ·{" "}
            {board.frozen
              ? "costos congelados al cierre"
              : "proyección — se congela y la confirmas al cierre"}
          </p>
        </div>
      ) : null}

      {/* El barco — piedras anónimas (las tuyas en oro) */}
      <div className="mt-6 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            El barco de esta semana
          </span>
          <span className="tabular text-[11px] text-[var(--outline)]">
            {board.count} {board.count === 1 ? "piedra" : "piedras"} a bordo ·{" "}
            {board.paidCount} con logística pagada
          </span>
        </div>
        {board.count === 0 ? (
          <p className="mt-4 text-center text-[12.5px] text-[var(--on-surface-variant)]">
            El barco está vacío — la primera piedra paga el costo fijo completo;
            cada nueva lo reparte.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: board.count - board.myOrders.length }).map(
              (_, i) => (
                <div
                  key={`anon-${i}`}
                  title="Piedra de otro joyero (anónima)"
                  className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] text-[16px] text-[var(--outline)]"
                >
                  ◈
                </div>
              ),
            )}
            {board.myOrders.map((o) => (
              <div
                key={o.orderId}
                title={`Tuya: ${o.label}`}
                className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--gold)] bg-[var(--warn-bg)] text-[16px] text-[var(--warn-text)] shadow-[0_0_0_1px_var(--gold)]"
              >
                ◆
              </div>
            ))}
            <div
              title="Espacio libre — invita a más joyeros"
              className="grid h-11 w-11 place-items-center rounded-lg border border-dashed border-[var(--outline-variant)] text-[14px] text-[var(--outline-variant)]"
            >
              +
            </div>
          </div>
        )}
        <p className="mt-3 text-[10.5px] text-[var(--outline)]">
          Las piedras ajenas se muestran anónimas — sin specs ni dueño.
        </p>

        {/* Escalones de llenado — el costo se comunica por bandas, no por
            número móvil: un rebote dentro del escalón no cambia el costo. */}
        {board.tiers.length ? (
          <div className="mt-3 border-t border-[var(--hairline)] pt-3">
            <div className="label-caps text-[8.5px] text-[var(--outline)]">
              Escalones de llenado · costo logístico por pieza
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {board.tiers.map((t) => {
                const active =
                  board.currentTier &&
                  t.minStones === board.currentTier.minStones;
                return (
                  <span
                    key={t.minStones}
                    className={`tabular rounded-[6px] border px-2 py-1 text-[11px] ${
                      active
                        ? "border-[var(--gold)] bg-[var(--warn-bg)] font-semibold text-[var(--warn-text)]"
                        : "border-[var(--hairline)] text-[var(--on-surface-variant)]"
                    }`}
                  >
                    {tierRangeLabel(t)} → ~{formatMXN(t.costPerStoneMxn)} c/u
                  </span>
                );
              })}
            </div>
            {board.status === "abierto" && board.nextTier ? (
              <p className="mt-2 text-[11px] text-[var(--warn-text)]">
                ⚓ Estás a {board.nextTier.missing}{" "}
                {board.nextTier.missing === 1 ? "piedra" : "piedras"} del
                siguiente escalón (~
                {formatMXN(board.nextTier.tier.costPerStoneMxn)} c/u) — invita a
                más joyeros.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Desglose del embarque — mismo lenguaje que el cotizador (agregado) */}
      {board.aggregate ? (
        <div className="mt-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
          <div className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            Desglose del embarque · agregado anónimo
            {board.frozen ? " · congelado" : " · proyección"}
          </div>
          <div className="mt-3 flex flex-col divide-y divide-[var(--hairline)]">
            <LedgerRow label="Piedras" value={board.aggregate.composition.stone} marker="var(--c-stone)" />
            <LedgerRow label="Flete + seguro internacional" value={board.aggregate.composition.logistics} marker="var(--c-logi)" />
            <LedgerRow label="Aduana (IGI + DTA + agente)" value={board.aggregate.composition.customs} marker="var(--c-aduana)" />
            {/* Renglón POR PIEDRA (propias con specs, ajenas anónimas). El
                servicio va por pieza como COMPONENTE incluido en el precio —
                sin suma global (percepción §7.3). */}
            <div className="px-2 py-2.5">
              <div className="label-caps mb-1.5 text-[8.5px] text-[var(--outline)]">
                Precio por pieza · sin IVA{" "}
                {board.frozen ? "· congelado" : "· proyección"} · el servicio ya
                está incluido
              </div>
              <div className="flex flex-col gap-2">
                {board.perStone.map((r, i) => (
                  <div
                    key={r.orderId}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div
                        className={`tabular truncate text-[12px] ${
                          r.mine
                            ? "font-medium text-[var(--warn-text)]"
                            : "text-[var(--on-surface-variant)]"
                        }`}
                      >
                        {r.mine ? `◆ ${r.label} (tuya)` : `◈ Piedra ${i + 1} · anónima`}
                      </div>
                      <div className="tabular text-[10px] text-[var(--outline)]">
                        incluye servicio NewCo {formatMXN(r.serviceMxn)}
                      </div>
                    </div>
                    <span className="tabular shrink-0 text-[13px] font-medium text-[var(--on-surface)]">
                      {formatMXN(r.priceMxn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <LedgerRow label="Precio de venta (sin IVA)" value={board.aggregate.price} />
            <LedgerRow label="IVA trasladado (16%)" value={board.aggregate.ivaOut} tag="acreditable" />
            <LedgerRow
              label="Precio de venta (con IVA incluido)"
              value={board.aggregate.allin}
              total
            />
            <LedgerRow
              label="Ahorro vs importar por separado"
              value={board.totalSavingsMxn}
              savings
            />
          </div>
        </div>
      ) : null}

      {/* Mis piedras */}
      <section className="mt-6">
        <h2 className="label-caps text-[10px] text-[var(--on-surface-variant)]">
          Tus piedras en este embarque
        </h2>
        {board.myOrders.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-[var(--on-surface-variant)]">
            Aún no tienes piedras aquí. Confirma una orden en{" "}
            <a href="/propuestas" className="text-[var(--warn-text)] underline underline-offset-2">
              Propuestas
            </a>{" "}
            y elige “Agregar a embarque”.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {board.myOrders.map((o) => (
              <div
                key={o.orderId}
                className="rounded-xl border border-[var(--gold)]/40 bg-[var(--surface)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="tabular text-[13.5px] font-medium text-[var(--on-surface)]">
                    ◆ {o.label}
                    {o.reboteCount > 0 ? (
                      <span className="label-caps ml-2 rounded-[3px] border border-[var(--gold)] bg-[var(--warn-bg)] px-1.5 py-0.5 text-[8px] text-[var(--warn-text)]">
                        Rebotó ×{o.reboteCount} · logística ajustada a este embarque
                      </span>
                    ) : null}
                  </div>
                  <div className="tabular mt-0.5 text-[11px] text-[var(--on-surface-variant)]">
                    Pago 1 · piedra pagada {formatMXN(o.stoneMxn)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!o.logisticsPaid && board.status === "abierto" ? (
                    <button
                      type="button"
                      onClick={() => payLogistics(o.orderId)}
                      disabled={pending}
                      className="tabular rounded-[8px] bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
                    >
                      {pending
                        ? "Procesando…"
                        : `Pagar logística — estimado ${formatMXN(o.saldoMxn)} según el embarque actual`}
                    </button>
                  ) : null}
                  {o.logisticsPaid ? (
                    <span className="text-[11.5px] text-[#4f9d79]">
                      ✓ Logística pagada — entra al corte
                    </span>
                  ) : null}
                </div>
                </div>

                {/* Costo POR PIEZA — prorrateo vivo (price_i de computeQuote).
                    Sin IVA protagonista: es el costo real del joyero (el IVA
                    se acredita); el con IVA es el desembolso, de apoyo. */}
                <div className="mt-3 border-t border-[var(--hairline)] pt-3">
                  <div className="label-caps text-[8.5px] text-[var(--outline)]">
                    {board.frozen
                      ? "Costo por pieza · congelado al cierre"
                      : "Costo por pieza · estimado según el embarque actual"}
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <AnimatedNumber
                      value={o.priceMxn}
                      format={formatMXN}
                      className="tabular text-[21px] font-bold text-[var(--warn-text)]"
                    />
                    <span className="text-[11px] text-[var(--on-surface-variant)]">
                      sin IVA
                    </span>
                    <span aria-hidden className="text-[var(--outline)]">·</span>
                    <AnimatedNumber
                      value={o.projectedMxn}
                      format={formatMXN}
                      duration={0.5}
                      className="tabular text-[13px] text-[var(--on-surface-variant)]"
                    />
                    <span className="text-[11px] text-[var(--outline)]">
                      con IVA
                    </span>
                  </div>
                </div>

                {!o.logisticsPaid && board.status === "abierto" ? (
                  <p className="mt-2 rounded-[6px] bg-[var(--warn-bg)] px-2.5 py-1.5 text-[10.5px] leading-snug text-[var(--warn-text)]">
                    Tu escalón queda garantizado al pagar — sólo puede bajar si
                    entran más piedras (ajuste a favor al cierre). Si no pagas
                    antes del corte, tu piedra rebota al siguiente embarque
                    (límite: 3).
                  </p>
                ) : null}

                {/* Desglose de la pieza dentro del embarque */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--hairline)] pt-3">
                  <MiniStat
                    label="Flete+agente (tu parte)"
                    value={formatMXN(o.fixedShareMxn)}
                  />
                  <MiniStat label="Costo aterrizado" value={formatMXN(o.landedMxn)} />
                  <MiniStat label="Servicio NewCo" value={formatMXN(o.serviceMxn)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {board.aggregate ? (
        <div className="mt-6">
          <IvaExplainer
            allin={board.aggregate.allin}
            ivaOut={board.aggregate.ivaOut}
            price={board.aggregate.price}
          />
        </div>
      ) : null}

      <p className="mt-6 text-center text-[10.5px] text-[var(--outline)]">
        El embarque muestra sólo el agregado del envío — nunca se identifica al
        joyero dueño de cada piedra ni sus datos comerciales.
      </p>

      {inviteOpen ? <InviteModal onClose={() => setInviteOpen(false)} /> : null}
    </div>
  );
}

function MiniStat({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div>
      <div className="label-caps text-[8.5px] text-[var(--outline)]">{label}</div>
      <div
        className={`tabular mt-0.5 text-[13px] font-semibold ${
          gold ? "text-[var(--warn-text)]" : "text-[var(--on-surface)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/registro` : "/registro";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };
  const wa = () => {
    const msg = `Te invito a NewCo: importamos diamantes a México con factura (CFDI) y nacionalización resuelta, y consolidamos embarques semanales para bajar el costo. Regístrate aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="text-[18px] font-semibold text-[var(--on-surface)]">
          Invitar a un embarque
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--on-surface-variant)]">
          Entre más piedras suban al barco, más baja el costo fijo por piedra —
          para todos. Comparte tu invitación:
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2">
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
          onClick={wa}
          className="mt-3 w-full rounded-[8px] bg-[#1fa855] py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Compartir por WhatsApp
        </button>
        <p className="mt-3 text-[10.5px] leading-snug text-[var(--outline)]">
          Los nuevos usuarios se registran por invitación y requieren aprobación
          del equipo NewCo antes de entrar al inventario.
        </p>
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
