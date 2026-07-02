"use client";

import { useState, useTransition } from "react";
import type { PaymentMethod } from "@/lib/types";
import {
  addPaymentMethodAction,
  removePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from "@/app/portal-actions";

export function PaymentManager({ initial }: { initial: PaymentMethod[] }) {
  const [list, setList] = useState(initial);
  const [type, setType] = useState<"card" | "spei">("card");
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(initial.length === 0);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!label.trim()) return;
    startTransition(async () => {
      // Nunca datos crudos: se guarda solo una referencia/token simulado.
      const token = `tok_${Math.random().toString(36).slice(2, 10)}`;
      const next = await addPaymentMethodAction({
        type,
        label: label.trim(),
        token: type === "card" ? token : undefined,
        reference: type === "spei" ? token : undefined,
      });
      setList(next);
      setLabel("");
      setOpen(false);
    });
  };
  const remove = (id: string) =>
    startTransition(async () => setList(await removePaymentMethodAction(id)));
  const makeDefault = (id: string) =>
    startTransition(async () => setList(await setDefaultPaymentMethodAction(id)));

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-3">
        {list.map((m) => (
          <div
            key={m.id}
            className={`flex items-center justify-between gap-3 rounded-xl border bg-[var(--surface)] p-4 ${
              m.isDefault ? "border-[var(--gold)]" : "border-[var(--hairline)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="label-caps rounded-[4px] border border-[var(--hairline)] px-1.5 py-0.5 text-[9px] text-[var(--on-surface-variant)]">
                {m.type === "card" ? "Tarjeta" : "SPEI"}
              </span>
              <div>
                <div className="text-[14px] font-medium text-[var(--on-surface)]">
                  {m.label}
                  {m.isDefault ? (
                    <span className="label-caps ml-2 text-[8px] text-[var(--warn-text)]">
                      predeterminado
                    </span>
                  ) : null}
                </div>
                <div className="tabular text-[10.5px] text-[var(--outline)]">
                  {m.token ?? m.reference}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {!m.isDefault ? (
                <button
                  type="button"
                  onClick={() => makeDefault(m.id)}
                  disabled={pending}
                  className="text-[11.5px] text-[var(--warn-text)] hover:underline"
                >
                  Predeterminar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(m.id)}
                disabled={pending}
                className="text-[11.5px] text-[var(--outline)] hover:text-[var(--secondary)]"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <div className="mt-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-low)] p-4">
          <h3 className="label-caps mb-3 text-[10px] text-[var(--on-surface-variant)]">
            Nuevo método
          </h3>
          <div className="flex gap-2">
            {(["card", "spei"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-[6px] border px-3 py-1.5 text-[12px] transition-colors ${
                  type === t
                    ? "border-[var(--gold)] bg-[var(--warn-bg)] text-[var(--warn-text)]"
                    : "border-[var(--hairline)] text-[var(--on-surface-variant)]"
                }`}
              >
                {t === "card" ? "Tarjeta" : "SPEI"}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
              Etiqueta
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={type === "card" ? "Visa terminación 4242" : "SPEI BBVA · empresa"}
              className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
            />
          </label>
          <p className="mt-2 text-[10.5px] text-[var(--outline)]">
            Nunca guardamos datos crudos de tu tarjeta ni cuenta: solo una
            referencia tokenizada. El cobro real se conecta en Cap.2.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!label.trim() || pending}
              className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar método"}
            </button>
            {list.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setLabel("");
                }}
                className="text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-[8px] border border-[var(--hairline)] px-4 py-2 text-[12.5px] text-[var(--on-surface)] hover:border-[var(--gold)]"
        >
          + Agregar método
        </button>
      )}
    </div>
  );
}
