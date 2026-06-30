"use client";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  TextInput,
} from "@/components/ui/primitives";
import type { OpParams, LineQuote, Stone } from "@/lib/types";

export type RawOp = Record<keyof OpParams, string>;

/**
 * Orden + parámetros de operación. El precio de la piedra viene de la API (no
 * editable) y el margen lo resuelve la política de bandas (visible, no editable).
 * Solo los OpParams son editables (FX del día, flete, IGI, DTA, agente).
 */
export function OperationCard({
  rawOp,
  update,
  stones,
  lines,
}: {
  rawOp: RawOp;
  update: (k: keyof OpParams, v: string) => void;
  stones: Stone[];
  lines: LineQuote[];
}) {
  const marginById = new Map(lines.map((l) => [l.stoneId, l.marginPct]));
  return (
    <Card className="card-surface" data-animate="card">
      <CardHeader>
        <CardTitle>Orden y operación</CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        <div>
          <p className="label-caps mb-2 text-[10px] text-[var(--on-surface-variant)]">
            Piedras en la orden
          </p>
          <div className="flex flex-col gap-2">
            {stones.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="tabular truncate text-[13px] text-[var(--on-surface)]">
                    {s.carat.toFixed(2)} ct · {s.shape} · {s.color} · {s.clarity}
                  </div>
                  <div className="tabular truncate text-[11px] text-[var(--outline)]">
                    {s.certNumber}
                  </div>
                </div>
                <span className="label-caps shrink-0 rounded-[3px] border border-[var(--gold)]/50 bg-[var(--warn-bg)] px-1.5 py-0.5 text-[9px] text-[var(--warn-text)]">
                  {marginById.get(s.id) ?? 0}% servicio
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10.5px] leading-snug text-[var(--outline)]">
            Precio de la piedra: de la API del proveedor (no editable). Margen:
            política de bandas por valor.
          </p>
        </div>

        <div className="space-y-4">
          <p className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            Parámetros de operación
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de cambio" htmlFor="op-fx">
              <TextInput
                id="op-fx"
                numeric
                inputMode="decimal"
                suffix="MXN/USD"
                value={rawOp.fx}
                onChange={(e) => update("fx", e.target.value)}
              />
            </Field>
            <Field label="Flete + seguro" htmlFor="op-logi">
              <TextInput
                id="op-logi"
                numeric
                inputMode="decimal"
                prefix="MXN $"
                value={rawOp.logiMxn}
                onChange={(e) => update("logiMxn", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Arancel (IGI)"
            htmlFor="op-igi"
            hint={
              <p className="mt-1 rounded-[2px] border-l-2 border-[var(--warn-border)] bg-[var(--warn-bg)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--warn-text)]">
                Confirmar con agente aduanal — el diamante pulido (7102.39) suele
                ser bajo o 0%, pero verificar contra el decreto vigente.
              </p>
            }
          >
            <TextInput
              id="op-igi"
              numeric
              inputMode="decimal"
              suffix="%"
              value={rawOp.igiPct}
              onChange={(e) => update("igiPct", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="DTA" htmlFor="op-dta">
              <TextInput
                id="op-dta"
                numeric
                inputMode="decimal"
                suffix="%"
                value={rawOp.dtaPct}
                onChange={(e) => update("dtaPct", e.target.value)}
              />
            </Field>
            <Field label="Honorarios agente" htmlFor="op-agente">
              <TextInput
                id="op-agente"
                numeric
                inputMode="decimal"
                prefix="MXN $"
                value={rawOp.agenteMxn}
                onChange={(e) => update("agenteMxn", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
