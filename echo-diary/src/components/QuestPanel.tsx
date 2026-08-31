"use client"

import { useAuth } from "./AuthProvider"
import { expToNext, type Quest } from "@/lib/game"

/**
 * 레벨과 퀘스트. WriterQuest의 우측 패널에 있던 것을 사이드바로 옮겼다.
 * 숫자를 크게 보여주기보다 "다음 한 걸음이 뭔지"가 보이게 두는 쪽을 택했다.
 */
export function QuestPanel() {
  const { profile } = useAuth()
  if (!profile) return null

  const level = profile.level ?? 1
  const exp = profile.exp ?? 0
  const need = expToNext(level)
  const pct = Math.min(100, Math.round((exp / need) * 100))
  const title = profile.titles?.[profile.titles.length - 1]

  const quests = (profile.quests ?? []).filter((q) => q.type !== "once" || !q.done)
  const active = quests.filter((q) => !q.done)
  const doneCount = quests.length - active.length

  return (
    <section aria-label="레벨과 퀘스트" className="space-y-4 border-t border-ink/10 pt-8">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="eyebrow">여정</h3>
        {title && (
          <span className="text-[10px] font-medium text-ink/50">{title}</span>
        )}
      </div>

      <div>
        <div className="flex items-end justify-between gap-2">
          <span className="display text-3xl italic text-ink">Lv.{level}</span>
          <span className="tabnum text-[10px] text-ink/45">
            {exp} / {need}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {quests.length > 0 && (
        <ul className="space-y-2.5">
          {quests.slice(0, 5).map((q) => (
            <QuestRow key={q.id} quest={q} />
          ))}
        </ul>
      )}

      {active.length === 0 && quests.length > 0 && (
        <p className="text-[11px] text-ink/45">퀘스트를 전부 끝냈어요.</p>
      )}
      {doneCount > 0 && active.length > 0 && (
        <p className="tabnum text-[10px] text-ink/35">
          {doneCount}개 완료 · {active.length}개 남음
        </p>
      )}
    </section>
  )
}

function QuestRow({ quest }: { quest: Quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100))

  return (
    <li className={quest.done ? "opacity-45" : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`text-[11px] leading-snug ${
            quest.done ? "text-ink/60 line-through" : "text-ink/75"
          }`}
        >
          {quest.title}
        </span>
        <span className="tabnum shrink-0 text-[10px] text-ink/40">
          {quest.done ? "완료" : `${quest.progress}/${quest.target}`}
        </span>
      </div>
      {!quest.done && (
        <div className="mt-1 h-px bg-ink/10">
          <div
            className="h-px bg-ink/50 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </li>
  )
}
