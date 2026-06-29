"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "print-card relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_24px_48px_-24px_rgba(0,0,0,0.7)]",
        "transition-colors duration-300",
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
        "text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-faint)]",
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
/* Field + Input                                                              */
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[12px] font-medium text-[var(--text-muted)]"
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
  /** Alinea el valor a la derecha y usa cifras tabulares. */
  numeric?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ prefix, suffix, numeric, className, ...props }, ref) {
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
          "px-3 h-11 transition-colors duration-200",
          "hover:border-[var(--border-strong)] focus-within:border-[var(--gold-soft)]",
          "focus-within:bg-gradient-to-b focus-within:from-[rgba(230,201,138,0.05)] focus-within:to-transparent",
        )}
      >
        {prefix ? (
          <span className="tabular shrink-0 text-[12px] text-[var(--text-faint)] select-none">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]",
            "text-[14px]",
            numeric && "tabular text-right",
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="tabular shrink-0 text-[12px] text-[var(--text-faint)] select-none">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Switch (toggle)                                                            */
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
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
    >
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
              "relative rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-b from-[var(--gold)] to-[var(--gold-soft)] text-[#1a1205] shadow-[0_2px_8px_-2px_rgba(212,175,106,0.5)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
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
/* Button                                                                     */
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
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-[13px] font-medium",
          "transition-all duration-200 active:scale-[0.98]",
          variant === "ghost" &&
            "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--gold-soft)] hover:bg-[var(--surface-3)]",
          variant === "solid" &&
            "bg-gradient-to-b from-[var(--gold)] to-[var(--gold-soft)] text-[#1a1205] hover:brightness-105 shadow-[0_4px_16px_-6px_rgba(212,175,106,0.6)]",
          className,
        )}
        {...props}
      />
    );
  },
);
