/** Placeholder de sección del portal aún no construida (Fase E/F). */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">{title}</h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        {description}
      </p>
      <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-low)] px-6 py-12 text-center">
        <span className="label-caps text-[10px] text-[var(--warn-text)]">
          Próximamente · {phase}
        </span>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-[var(--on-surface-variant)]">
          Esta sección se construye en {phase}. El menú ya está listo para
          cuando llegue.
        </p>
      </div>
    </div>
  );
}
