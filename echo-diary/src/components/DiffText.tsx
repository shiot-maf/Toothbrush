"use client"

import { diffWords } from "@/lib/analysis/diff"

/**
 * 원문 → 교정본의 변화를 한 덩어리 안에서 보여준다.
 * 지운 부분은 취소선, 더한 부분은 강조. 색만으로 구분하지 않도록
 * 취소선/밑줄을 같이 준다.
 */
export function DiffText({
  before,
  after,
  className = "",
}: {
  before: string
  after: string
  className?: string
}) {
  const tokens = diffWords(before, after)
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.op === "same") return <span key={i}>{t.text}</span>
        if (t.op === "remove")
          return (
            <span
              key={i}
              className="text-rose-500/70 line-through decoration-rose-400/60"
            >
              {t.text}
            </span>
          )
        return (
          <span
            key={i}
            className="rounded bg-emerald-500/12 font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 dark:text-emerald-300"
          >
            {t.text}
          </span>
        )
      })}
    </span>
  )
}

/** 짧은 구 단위 비교 — 교정 카드 안에서 쓴다. */
export function InlineFix({ before, after }: { before: string; after: string }) {
  return (
    <p className="text-[15px] leading-relaxed">
      <span className="text-rose-500 line-through decoration-rose-400/60">{before}</span>
      <span className="mx-2 text-[var(--color-ink-faint)]">→</span>
      <span className="font-medium text-emerald-700 dark:text-emerald-300">{after}</span>
    </p>
  )
}
