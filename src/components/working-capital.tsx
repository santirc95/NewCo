"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { formatMXN } from "@/lib/compute";

interface WorkingCapitalProps {
  /** Anticipo mínimo para cubrir el desembolso. */
  float: number;
}

/**
 * Capital de trabajo: cero. Sólo vista Interna. El joyero paga de contado por
 * adelantado; su anticipo cubre todo el desembolso, NewCo no aporta capital.
 */
export function WorkingCapitalCard({ float }: WorkingCapitalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capital de trabajo: cero</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">
          El joyero paga de contado por adelantado. Su anticipo cubre la
          totalidad del desembolso de la operación, de modo que NewCo no aporta
          capital de trabajo propio.
        </p>
        <div className="mt-5 flex items-end justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5">
          <span className="text-[12px] leading-snug text-[var(--text-muted)]">
            Anticipo mínimo para
            <br className="hidden sm:block" /> cubrir el desembolso
          </span>
          <span className="tabular text-[20px] font-semibold text-[var(--gold)]">
            {formatMXN(float)}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
