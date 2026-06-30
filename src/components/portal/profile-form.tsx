"use client";

import { useState, useTransition } from "react";
import type { Jeweler } from "@/lib/types";
import { updateMyProfileAction, type ProfilePatch } from "@/app/portal-actions";

const FIELDS: { key: keyof ProfilePatch; label: string }[] = [
  { key: "name", label: "Nombre comercial" },
  { key: "legalName", label: "Razón social" },
  { key: "rfc", label: "RFC" },
  { key: "address", label: "Domicilio" },
  { key: "contactEmail", label: "Correo de contacto" },
  { key: "contactPhone", label: "Teléfono de contacto" },
];

export function ProfileForm({ jeweler }: { jeweler: Jeweler | null }) {
  const [form, setForm] = useState<ProfilePatch>(() => ({
    name: jeweler?.name ?? "",
    legalName: jeweler?.legalName ?? "",
    rfc: jeweler?.rfc ?? "",
    address: jeweler?.address ?? "",
    contactEmail: jeweler?.contactEmail ?? "",
    contactPhone: jeweler?.contactPhone ?? "",
  }));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!jeweler) {
    return (
      <p className="text-[14px] text-[var(--on-surface-variant)]">
        Tu cuenta no tiene un perfil de joyero asociado.
      </p>
    );
  }

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      await updateMyProfileAction(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="max-w-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label
            key={f.key}
            className={f.key === "address" ? "sm:col-span-2 block" : "block"}
          >
            <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
              {f.label}
            </span>
            <input
              type="text"
              value={form[f.key] ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[11.5px] text-[var(--on-surface-variant)]">
        Estado de la cuenta:{" "}
        <span
          className={
            jeweler.active ? "text-[#4f9d79]" : "text-[var(--secondary)]"
          }
        >
          {jeweler.active ? "activa" : "inactiva"}
        </span>{" "}
        · lo administra NewCo (tú no lo editas).
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-[8px] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved ? (
          <span className="text-[12.5px] text-[#4f9d79]">✓ Guardado</span>
        ) : null}
      </div>
    </div>
  );
}
