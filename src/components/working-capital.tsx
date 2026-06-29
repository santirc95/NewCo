"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { formatMXN } from "@/lib/compute";
import { AnimatedNumber } from "@/components/animated-number";

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
    <Card className="card-surface card-lift" data-animate="card">
      <CardHeader>
        <CardTitle>Capital de trabajo: cero</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-[13.5px] leading-relaxed text-[var(--on-surface-variant)]">
          El joyero paga de contado por adelantado. Su anticipo cubre la
          totalidad del desembolso de la operación, de modo que NewCo no aporta
          capital de trabajo propio.
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--hairline)] pt-4">
          <span className="label-caps text-[10px] text-[var(--on-surface-variant)]">
            Anticipo mínimo
            <br />
            para el desembolso
          </span>
          <AnimatedNumber
            value={float}
            format={formatMXN}
            className="tabular text-[22px] font-semibold text-[var(--on-surface)]"
          />
        </div>
      </CardBody>
    </Card>
  );
}
