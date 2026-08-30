"use client"

import type { ReactNode } from "react"
import { Spinner as SpinnerIcon } from "./icons"

/** 레퍼런스의 journal-card에 해당 — 화면 전체가 이 카드 하나로 굴러간다. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`panel p-6 ${className}`}>{children}</div>
}

export function Section({
  title,
  description,
  children,
  className = "",
}: {
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={`panel space-y-4 p-6 ${className}`}>
      <div>
        <h2 className="text-sm font-semibold tracking-[0.18em] text-ink/70 uppercase">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink/55">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="eyebrow">{children}</h2>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: "default" | "good" | "warn"
}) {
  const color =
    tone === "good"
      ? "var(--color-good)"
      : tone === "warn"
        ? "var(--color-warn)"
        : undefined
  return (
    <div className="border-t border-ink/10 pt-4">
      <p className="eyebrow">{label}</p>
      <p className="display tabnum mt-2 text-3xl" style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-ink/50">{sub}</p>}
    </div>
  )
}

export function Empty({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="panel px-6 py-16 text-center">
      <p className="display text-2xl text-ink/70">{title}</p>
      {children && (
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink/50">
          {children}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Loading({ label = "…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink/50">
      <SpinnerIcon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  )
}

/** 알약 버튼 — 레퍼런스의 주 액션 스타일 */
export function Pill({
  children,
  onClick,
  disabled,
  variant = "solid",
  type = "button",
  className = "",
  busy,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "solid" | "outline" | "quiet"
  type?: "button" | "submit"
  className?: string
  busy?: boolean
}) {
  const styles = {
    solid:
      "bg-ink text-bg shadow-xl shadow-ink/10 hover:scale-[1.02] active:scale-[0.98]",
    outline: "border border-ink/30 bg-ink/5 text-ink hover:bg-ink/10",
    quiet: "text-ink/50 hover:text-ink",
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] uppercase transition-all disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 ${styles} ${className}`}
    >
      {busy && <SpinnerIcon className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

export function Tag({
  children,
  color,
}: {
  children: ReactNode
  color?: string
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase"
      style={{
        color: color ?? "rgb(var(--ink) / 0.6)",
        background: color
          ? `color-mix(in srgb, ${color} 12%, transparent)`
          : "rgb(var(--ink) / 0.07)",
      }}
    >
      {children}
    </span>
  )
}

/** 기간/필터 전환 — 레퍼런스의 SegmentedControl */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-full border border-ink/10 p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase transition-colors ${
              active ? "bg-ink text-bg" : "text-ink/45 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        borderColor: "color-mix(in srgb, var(--color-bad) 35%, transparent)",
        background: "color-mix(in srgb, var(--color-bad) 7%, transparent)",
        color: "var(--color-bad)",
      }}
    >
      {children}
    </p>
  )
}
