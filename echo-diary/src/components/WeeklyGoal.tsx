"use client"

import { useState } from "react"
import { useAuth } from "./AuthProvider"
import { setWeeklyGoal } from "@/lib/firebase/db"
import { Pencil } from "./icons"

/**
 * 주간 목표. 스트릭이 "하루라도 빠지면 0"이라 부담스러운 데 비해,
 * 주 단위 목표는 하루 건너뛰어도 회복할 수 있어서 계속 쓰게 만든다.
 */
export function WeeklyGoal({
  done,
  variant,
}: {
  done: number
  variant: "sidebar" | "mobile"
}) {
  const { profile, refreshProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const goal = profile?.weeklyGoal ?? 3
  const remaining = Math.max(0, goal - done)
  const pct = Math.min(100, Math.round((done / goal) * 100))

  const changeGoal = async (next: number) => {
    if (!user) return
    setEditing(false)
    await setWeeklyGoal(user.uid, next)
    await refreshProfile()
  }

  if (variant === "mobile") {
    return (
      <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="eyebrow">주간 목표</span>
          <span className="mt-0.5 truncate text-sm font-medium text-ink/90">
            {done}편 / 목표 {goal}편
          </span>
        </div>
        <div
          className="flex shrink-0 gap-1.5"
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          {Array.from({ length: goal }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i < done ? "bg-ink" : "bg-ink/15"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section aria-label="주간 목표" className="space-y-5 border-t border-ink/10 pt-8">
      <h3 className="eyebrow">주간 목표</h3>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <span className="display text-4xl italic text-ink">
            {done}
            <span className="text-xl opacity-40">/</span>
            {editing ? (
              <select
                autoFocus
                value={goal}
                onChange={(e) => void changeGoal(Number(e.target.value))}
                onBlur={() => setEditing(false)}
                className="ml-1 rounded border border-ink/20 bg-transparent px-1 text-lg not-italic"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setEditing(true)}
                aria-label="목표 수정"
                className="group ml-0.5 inline-flex items-baseline gap-1.5 text-ink/50 transition-colors hover:text-ink"
              >
                <span className="border-b border-transparent pb-px transition-all group-hover:border-ink/40">
                  {goal}
                </span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink/8 transition-all group-hover:bg-ink/15">
                  <Pencil className="h-2.5 w-2.5 opacity-40 transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            )}
          </span>
          <span className="eyebrow tabnum !text-ink/80">{pct}% 달성</span>
        </div>

        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          {Array.from({ length: goal }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                i < done ? "bg-ink" : "bg-ink/10"
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            />
          ))}
        </div>

        <p className="text-sm leading-relaxed text-ink/70">
          {remaining === 0
            ? "이번 주 목표를 채웠어요. 여기서 한 편 더 쓰면 그냥 이득이에요."
            : `이번 주 목표까지 ${remaining}편 남았어요.`}
        </p>
        <p className="eyebrow tabnum">
          {profile?.streak ? `${profile.streak}일 연속` : "연속 기록 없음"}
        </p>
      </div>
    </section>
  )
}
