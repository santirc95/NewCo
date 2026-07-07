"use client";

import { useEffect, useState, useTransition } from "react";
import { formatMXN } from "@/lib/compute";
import type { ShipmentStatus } from "@/lib/types";
import {
  getShipmentBoardAction,
  confirmFinalCostAction,
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

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-4">
      <div className="label-caps text-[9px] text-[var(--outline)]">{label}</div>
      <div className="tabular mt-1.5 text-[20px] font-semibold text-[var(--on-surface)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-[10.5px] leading-snug text-[var(--outline)]">
          {hint}
        </div>
      ) : null}
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
  const confirmFinal = (orderId: string) => {
    startTransition(async () => {
      await confirmFinalCostAction(orderId);
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

      {/* El barco — piedras anónimas (las tuyas en oro) */}
      <div className="mt-6 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            El barco de esta semana
          </span>
          <span className="tabular text-[11px] text-[var(--outline)]">
            {board.count} {board.count === 1 ? "piedra" : "piedras"} a bordo
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
      </div>

      {/* Agregado público — sin identificar joyeros */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Piedras en el barco"
          value={String(board.count)}
          hint={board.count === 0 ? "Sé el primero en subir tu orden" : undefined}
        />
        <Stat label="Valor consolidado" value={formatUSD(board.totalUsd)} />
        <Stat
          label="Costos fijos del embarque"
          value={formatMXN(board.fixedCostMxn)}
          hint={
            board.frozen
              ? "Congelados al cierre"
              : "Flete + agente aduanal · se reparten por valor"
          }
        />
        <Stat
          label="Fijo promedio por piedra"
          value={
            board.avgFixedPerStoneMxn !== null
              ? formatMXN(board.avgFixedPerStoneMxn)
              : "—"
          }
          hint={
            board.status === "abierto"
              ? `Con una piedra más baja a ${formatMXN(board.nextAvgFixedPerStoneMxn)}`
              : undefined
          }
        />
      </div>

      {/* Ahorro agregado (proyección) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--warn-bg)] px-5 py-4">
        <div>
          <div className="label-caps text-[10px] text-[var(--warn-text)]">
            Ahorro del embarque vs importar por separado
          </div>
          <p className="mt-1 max-w-[420px] text-[11.5px] leading-snug text-[var(--on-surface-variant)]">
            {board.frozen
              ? "Costos congelados con el número real de piedras."
              : "Costo estimado según el embarque actual — proyección; se congela y la confirmas al cierre."}
          </p>
        </div>
        <span className="tabular text-[24px] font-bold text-[var(--warn-text)]">
          {formatMXN(board.totalSavingsMxn)}
        </span>
      </div>

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
                  </div>
                  <div className="tabular mt-0.5 text-[11px] text-[var(--on-surface-variant)]">
                    Pagaste {formatMXN(o.paidMxn)} ·{" "}
                    {board.frozen ? "costo final" : "proyección actual"}{" "}
                    {formatMXN(o.projectedMxn)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {o.deltaMxn > 1 ? (
                    <span className="label-caps rounded-[4px] bg-[rgba(95,163,130,0.15)] px-2 py-1 text-[9px] text-[#3f7a5e]">
                      {board.frozen ? "Ajuste a favor" : "Ajuste estimado a favor"}{" "}
                      {formatMXN(o.deltaMxn)}
                    </span>
                  ) : null}
                  {board.status === "cerrado" && !o.finalCostConfirmed ? (
                    <button
                      type="button"
                      onClick={() => confirmFinal(o.orderId)}
                      disabled={pending}
                      className="rounded-[8px] bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
                    >
                      Confirmar costo final
                    </button>
                  ) : null}
                  {o.finalCostConfirmed ? (
                    <span className="text-[11.5px] text-[#4f9d79]">
                      ✓ Costo confirmado
                    </span>
                  ) : null}
                </div>
                </div>

                {/* Simulación viva de ESTA piedra dentro del embarque */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--hairline)] pt-3 sm:grid-cols-4">
                  <MiniStat
                    label="Flete+agente (tu parte)"
                    value={formatMXN(o.fixedShareMxn)}
                  />
                  <MiniStat label="Costo aterrizado" value={formatMXN(o.landedMxn)} />
                  <MiniStat label="Servicio NewCo" value={formatMXN(o.serviceMxn)} />
                  <MiniStat
                    label={board.frozen ? "All-in final" : "All-in proyectado"}
                    value={formatMXN(o.projectedMxn)}
                    gold
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
