"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBrandingAction } from "@/app/portal-actions";

export function BrandingForm({
  initial,
}: {
  initial: { logoText: string; logoUrl?: string };
}) {
  const [logoText, setLogoText] = useState(initial.logoText ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      await updateBrandingAction({
        logoText: logoText.slice(0, 3),
        logoUrl: logoUrl.trim() || undefined,
      });
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-low)] p-4">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-[var(--gold)]/50 bg-[var(--surface)]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[20px] font-semibold text-[var(--warn-text)]">
              {logoText || "·"}
            </span>
          )}
        </div>
        <div className="text-[12px] text-[var(--on-surface-variant)]">
          Vista previa del sello. Se usará en la propuesta con tu marca
          (white-label) en el Capítulo 2.
        </div>
      </div>

      <label className="mt-5 block">
        <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
          Monograma (1–3 letras)
        </span>
        <input
          type="text"
          value={logoText}
          onChange={(e) => setLogoText(e.target.value)}
          maxLength={3}
          placeholder="V"
          className="w-32 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
        />
      </label>

      <label className="mt-4 block">
        <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
          URL del logo (opcional)
        </span>
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…/logo.png"
          className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
        />
        <span className="mt-1 block text-[10.5px] text-[var(--outline)]">
          En Cap.2 se habilita la subida de archivo; por ahora puedes pegar una
          URL.
        </span>
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-[8px] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar branding"}
        </button>
        {saved ? <span className="text-[12.5px] text-[#4f9d79]">✓ Guardado</span> : null}
      </div>
    </div>
  );
}
