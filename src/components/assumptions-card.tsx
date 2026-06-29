"use client";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  TextInput,
} from "@/components/ui/primitives";
import type { RawInputs } from "@/components/simulator";

interface AssumptionsCardProps {
  raw: RawInputs;
  update: (key: keyof RawInputs, value: string) => void;
}

/**
 * Tarjeta de Supuestos — todos los campos son editables a mano (v1 standalone).
 * En v2 estos valores llegarán desde Airtable y la tarjeta pasa a sólo lectura.
 */
export function AssumptionsCard({ raw, update }: AssumptionsCardProps) {
  return (
    <Card className="card-surface" data-animate="card">
      <CardHeader>
        <CardTitle>Supuestos</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <Field label="Descripción de la piedra" htmlFor="stoneDesc">
          <TextInput
            id="stoneDesc"
            value={raw.stoneDesc}
            onChange={(e) => update("stoneDesc", e.target.value)}
            placeholder="Diamante redondo 1.50 ct"
          />
        </Field>

        <Field label="Certificado GIA" htmlFor="stoneCert">
          <TextInput
            id="stoneCert"
            value={raw.stoneCert}
            onChange={(e) => update("stoneCert", e.target.value)}
            placeholder="GIA 0000000000"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Costo de la piedra" htmlFor="stoneUsd">
            <TextInput
              id="stoneUsd"
              inputMode="decimal"
              numeric
              prefix="USD $"
              value={raw.stoneUsd}
              onChange={(e) => update("stoneUsd", e.target.value)}
            />
          </Field>

          <Field label="Tipo de cambio" htmlFor="fx">
            <TextInput
              id="fx"
              inputMode="decimal"
              numeric
              suffix="MXN/USD"
              value={raw.fx}
              onChange={(e) => update("fx", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Flete + seguro internacional" htmlFor="logi">
          <TextInput
            id="logi"
            inputMode="decimal"
            numeric
            prefix="MXN $"
            value={raw.logi}
            onChange={(e) => update("logi", e.target.value)}
          />
        </Field>

        <Field
          label="Arancel (IGI)"
          htmlFor="igi"
          hint={
            <p className="mt-1 rounded-[2px] border-l-2 border-[var(--warn-border)] bg-[var(--warn-bg)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--warn-text)]">
              Confirmar con agente aduanal — el diamante pulido (7102.39) suele
              ser bajo o 0%, pero verificar contra el decreto vigente.
            </p>
          }
        >
          <TextInput
            id="igi"
            inputMode="decimal"
            numeric
            suffix="%"
            value={raw.igi}
            onChange={(e) => update("igi", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="DTA" htmlFor="dta">
            <TextInput
              id="dta"
              inputMode="decimal"
              numeric
              suffix="%"
              value={raw.dta}
              onChange={(e) => update("dta", e.target.value)}
            />
          </Field>

          <Field label="Margen NewCo" htmlFor="margin">
            <TextInput
              id="margin"
              inputMode="decimal"
              numeric
              suffix="%"
              value={raw.margin}
              onChange={(e) => update("margin", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Honorarios agente aduanal" htmlFor="agente">
          <TextInput
            id="agente"
            inputMode="decimal"
            numeric
            prefix="MXN $"
            value={raw.agente}
            onChange={(e) => update("agente", e.target.value)}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
