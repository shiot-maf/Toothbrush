"use client"

import { getCategory, categoryColor } from "@/lib/taxonomy"
import type { Mistake } from "@/lib/types"
import { Tag } from "./ui"
import { SaveButton } from "./SaveButton"

export function CorrectionCard({
  mistake,
  showDate,
  entryId,
}: {
  mistake: Mistake
  showDate?: string
  /** 저장함에 담을 때 어느 일기에서 나왔는지 기록하려고 받는다 */
  entryId?: string
}) {
  const cat = getCategory(mistake.category)
  const color = categoryColor(mistake.category)

  return (
    <article
      className="panel p-5"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Tag color={color}>{cat.ko}</Tag>
        {mistake.severity === "major" && <Tag>중요</Tag>}
        {showDate && (
          <span className="ml-auto text-[11px] text-ink/35">{showDate}</span>
        )}
        <SaveButton
          item={{
            kind: "correction",
            sourceId: mistake.id,
            entryId: entryId ?? mistake.entryId,
            dateKey: mistake.dateKey,
            front: mistake.original,
            back: mistake.corrected,
            note: mistake.explanation,
            category: mistake.category,
          }}
        />
      </div>

      <p className="content-text text-[15px]">
        <span
          className="line-through decoration-2"
          style={{ color: "var(--color-bad)", textDecorationColor: "currentColor" }}
        >
          {mistake.original}
        </span>
        <span className="mx-2 text-ink/30">→</span>
        <span className="font-medium" style={{ color: "var(--color-good)" }}>
          {mistake.corrected}
        </span>
      </p>

      {mistake.explanation && (
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{mistake.explanation}</p>
      )}
      {mistake.tip && (
        <p className="mt-2.5 border-l-2 border-ink/15 pl-3 text-sm text-ink/55">
          {mistake.tip}
        </p>
      )}
    </article>
  )
}
