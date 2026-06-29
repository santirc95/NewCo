"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Card — superficie papel, borde hairline, esquinas rounded-xl               */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "print-card relative rounded-xl border border-[var(--hairline)] bg-[var(--surface)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "label-caps text-[11px] text-[var(--on-surface)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Field + Ledger Input — label-caps arriba, sólo borde inferior              */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, children, hint, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={htmlFor}
        className="label-caps text-[10px] text-[var(--on-surface-variant)]"
      >
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Texto fijo a la izquierda (p.ej. "USD $"). */
  prefix?: string;
  /** Texto fijo a la derecha (p.ej. "%"). */
  suffix?: string;
  /** Alinea el valor a la derecha y usa cifras tabulares (estilo ledger). */
  numeric?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ prefix, suffix, numeric, className, ...props }, ref) {
    return (
      <div className="group flex items-baseline gap-2 border-b border-[var(--outline-variant)] py-1.5 transition-colors duration-200 focus-within:border-b-2 focus-within:border-[var(--primary)]">
        {prefix ? (
          <span className="tabular shrink-0 text-[12px] text-[var(--outline)] select-none">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)]",
            numeric
              ? "tabular text-right text-[18px] font-medium"
              : "text-[15px]",
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="tabular shrink-0 text-[12px] text-[var(--outline)] select-none">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Tabs subrayados (Interna / Cliente)                                        */
/* -------------------------------------------------------------------------- */

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "pb-1 text-[14px] transition-colors duration-200 border-b-2",
              active
                ? "border-[var(--primary)] font-bold text-[var(--primary)]"
                : "border-transparent font-medium text-[var(--outline)] hover:text-[var(--on-surface)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Button — primario onyx sólido (sharp + label-caps) / secundario outline    */
/* -------------------------------------------------------------------------- */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "solid";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "ghost", ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "label-caps inline-flex items-center justify-center gap-2 rounded-[2px] px-4 h-10 text-[11px]",
          "transition-all duration-200 active:scale-[0.98]",
          variant === "ghost" &&
            "border border-[var(--outline-variant)] bg-transparent text-[var(--on-surface)] hover:border-[var(--primary)]",
          variant === "solid" &&
            "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90",
          className,
        )}
        {...props}
      />
    );
  },
);
