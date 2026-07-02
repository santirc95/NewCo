"use client";

import { useState, useTransition } from "react";
import type { ShippingAddress } from "@/lib/types";
import {
  addAddressAction,
  removeAddressAction,
  setDefaultAddressAction,
} from "@/app/portal-actions";

type Form = Omit<ShippingAddress, "id" | "jewelerId" | "isDefault">;

const EMPTY: Form = {
  label: "",
  calle: "",
  numExt: "",
  numInt: "",
  colonia: "",
  municipio: "",
  estado: "",
  cp: "",
};

export function AddressManager({ initial }: { initial: ShippingAddress[] }) {
  const [list, setList] = useState(initial);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(initial.length === 0);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.label && form.calle && form.numExt && form.cp && form.municipio;

  const save = () => {
    if (!valid) return;
    startTransition(async () => {
      const next = await addAddressAction({ ...form, numInt: form.numInt || undefined });
      setList(next);
      setForm(EMPTY);
      setOpen(false);
    });
  };
  const remove = (id: string) =>
    startTransition(async () => setList(await removeAddressAction(id)));
  const makeDefault = (id: string) =>
    startTransition(async () => setList(await setDefaultAddressAction(id)));

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-3">
        {list.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl border bg-[var(--surface)] p-4 ${
              a.isDefault ? "border-[var(--gold)]" : "border-[var(--hairline)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[var(--on-surface)]">
                    {a.label}
                  </span>
                  {a.isDefault ? (
                    <span className="label-caps rounded-[4px] border border-[var(--gold)]/40 bg-[var(--warn-bg)] px-1.5 py-0.5 text-[8px] text-[var(--warn-text)]">
                      Predeterminada
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
                  {a.calle} {a.numExt}
                  {a.numInt ? ` int. ${a.numInt}` : ""}, {a.colonia}, {a.municipio},{" "}
                  {a.estado}, CP {a.cp}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {!a.isDefault ? (
                  <button
                    type="button"
                    onClick={() => makeDefault(a.id)}
                    disabled={pending}
                    className="text-[11.5px] text-[var(--warn-text)] hover:underline"
                  >
                    Predeterminada
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  className="text-[11.5px] text-[var(--outline)] hover:text-[var(--secondary)]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <div className="mt-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-low)] p-4">
          <h3 className="label-caps mb-3 text-[10px] text-[var(--on-surface-variant)]">
            Nueva dirección
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <F label="Etiqueta (ej. Taller)" v={form.label} on={(x) => set("label", x)} full />
            <F label="Calle" v={form.calle} on={(x) => set("calle", x)} full />
            <F label="Número exterior" v={form.numExt} on={(x) => set("numExt", x)} />
            <F label="Número interior" v={form.numInt ?? ""} on={(x) => set("numInt", x)} />
            <F label="Colonia" v={form.colonia} on={(x) => set("colonia", x)} />
            <F label="Municipio / Alcaldía" v={form.municipio} on={(x) => set("municipio", x)} />
            <F label="Estado" v={form.estado} on={(x) => set("estado", x)} />
            <F label="Código postal" v={form.cp} on={(x) => set("cp", x)} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!valid || pending}
              className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar dirección"}
            </button>
            {list.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setForm(EMPTY);
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
          + Agregar dirección
        </button>
      )}
    </div>
  );
}

function F({
  label,
  v,
  on,
  full,
}: {
  label: string;
  v: string;
  on: (x: string) => void;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
        {label}
      </span>
      <input
        type="text"
        value={v}
        onChange={(e) => on(e.target.value)}
        className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
      />
    </label>
  );
}
