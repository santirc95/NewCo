"use client";

import { useState, useTransition } from "react";
import type { Settings } from "@/lib/types";
import { adminSaveSettingsAction } from "@/app/portal-actions";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function AdminSettings({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const s = await adminSaveSettingsAction(form);
      setForm(s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <section>
      <h2 className="text-[16px] font-bold text-[var(--on-surface)]">
        Configuración
      </h2>
      <p className="mt-1 mb-3 text-[12.5px] text-[var(--on-surface-variant)]">
        Leyendas y corte del embarque — se muestran tal cual en la plataforma.
      </p>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Leyenda de pedidos
          </span>
          <input
            type="text"
            value={form.shipmentDayLabel}
            onChange={(e) =>
              setForm((p) => ({ ...p, shipmentDayLabel: e.target.value }))
            }
            className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="block">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Leyenda de tránsito
          </span>
          <input
            type="text"
            value={form.transitWeeks}
            onChange={(e) =>
              setForm((p) => ({ ...p, transitWeeks: e.target.value }))
            }
            className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          />
          <span className="mt-1 block text-[10.5px] text-[var(--warn-text)]">
            Confirmar con la operadora logística antes de fijarla.
          </span>
        </label>
        <label className="block">
          <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
            Día de corte
          </span>
          <select
            value={form.cutoffDayOfWeek}
            onChange={(e) =>
              setForm((p) => ({ ...p, cutoffDayOfWeek: Number(e.target.value) }))
            }
            className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar configuración"}
        </button>
        {saved ? (
          <span className="text-[12.5px] text-[#4f9d79]">✓ Guardado</span>
        ) : null}
      </div>
    </section>
  );
}
