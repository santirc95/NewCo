"use client";

import { useState, useTransition } from "react";
import type { Jeweler, JewelerProfilePatch } from "@/lib/types";
import { updateMyProfileAction } from "@/app/portal-actions";

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
      />
    </label>
  );
}

export function ProfileForm({ jeweler }: { jeweler: Jeweler | null }) {
  const [form, setForm] = useState(() => ({
    name: jeweler?.name ?? "",
    rfc: jeweler?.rfc ?? "",
    razonSocial: jeweler?.razonSocial ?? "",
    regimenFiscal: jeweler?.regimenFiscal ?? "",
    cpFiscal: jeweler?.cpFiscal ?? "",
    usoCfdi: jeweler?.usoCfdi ?? "",
    dom: {
      calle: jeweler?.domicilioFiscal?.calle ?? "",
      numExt: jeweler?.domicilioFiscal?.numExt ?? "",
      numInt: jeweler?.domicilioFiscal?.numInt ?? "",
      colonia: jeweler?.domicilioFiscal?.colonia ?? "",
      municipio: jeweler?.domicilioFiscal?.municipio ?? "",
      estado: jeweler?.domicilioFiscal?.estado ?? "",
      cp: jeweler?.domicilioFiscal?.cp ?? "",
    },
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

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  const setDom = (k: keyof typeof form.dom, v: string) =>
    setForm((p) => ({ ...p, dom: { ...p.dom, [k]: v } }));

  const save = () => {
    setSaved(false);
    const patch: JewelerProfilePatch = {
      name: form.name,
      rfc: form.rfc,
      razonSocial: form.razonSocial,
      regimenFiscal: form.regimenFiscal,
      cpFiscal: form.cpFiscal,
      usoCfdi: form.usoCfdi,
      domicilioFiscal: {
        calle: form.dom.calle,
        numExt: form.dom.numExt,
        numInt: form.dom.numInt || undefined,
        colonia: form.dom.colonia,
        municipio: form.dom.municipio,
        estado: form.dom.estado,
        cp: form.dom.cp,
      },
    };
    startTransition(async () => {
      await updateMyProfileAction(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="max-w-2xl">
      <section>
        <h2 className="label-caps mb-3 text-[10px] text-[var(--on-surface-variant)]">
          Datos generales y fiscales (CFDI 4.0)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="RFC" value={form.rfc} onChange={(v) => set("rfc", v)} />
          <Field label="Razón social" value={form.razonSocial} onChange={(v) => set("razonSocial", v)} className="sm:col-span-2" />
          <Field label="Régimen fiscal" value={form.regimenFiscal} onChange={(v) => set("regimenFiscal", v)} />
          <Field label="Uso de CFDI" value={form.usoCfdi} onChange={(v) => set("usoCfdi", v)} />
          <Field label="CP fiscal" value={form.cpFiscal} onChange={(v) => set("cpFiscal", v)} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="label-caps mb-3 text-[10px] text-[var(--on-surface-variant)]">
          Domicilio fiscal
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Calle" value={form.dom.calle} onChange={(v) => setDom("calle", v)} className="sm:col-span-2" />
          <Field label="Número exterior" value={form.dom.numExt} onChange={(v) => setDom("numExt", v)} />
          <Field label="Número interior" value={form.dom.numInt} onChange={(v) => setDom("numInt", v)} />
          <Field label="Colonia" value={form.dom.colonia} onChange={(v) => setDom("colonia", v)} />
          <Field label="Municipio / Alcaldía" value={form.dom.municipio} onChange={(v) => setDom("municipio", v)} />
          <Field label="Estado" value={form.dom.estado} onChange={(v) => setDom("estado", v)} />
          <Field label="Código postal" value={form.dom.cp} onChange={(v) => setDom("cp", v)} />
        </div>
      </section>

      <div className="mt-4 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[11.5px] text-[var(--on-surface-variant)]">
        Estado de la cuenta:{" "}
        <span className={jeweler.active ? "text-[#4f9d79]" : "text-[var(--secondary)]"}>
          {jeweler.active ? "activa" : "inactiva"}
        </span>{" "}
        · lo administra NewCo.
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
        {saved ? <span className="text-[12.5px] text-[#4f9d79]">✓ Guardado</span> : null}
      </div>
    </div>
  );
}
