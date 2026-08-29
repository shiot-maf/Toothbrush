"use client"

import type { Entry, Mistake } from "@/lib/types"
import { Panel, SectionTitle, Tag } from "./ui"
import { DiffText } from "./DiffText"
import { CorrectionCard } from "./CorrectionCard"
import { SaveButton } from "./SaveButton"
import { SelectionSaver } from "./SelectionSaver"
import { getCategory, categoryColor } from "@/lib/taxonomy"

/** 첨삭 결과 전체. 작성 화면과 기록 상세가 같은 걸 쓴다. */
export function FeedbackView({
  entry,
  mistakes,
  entryId,
}: {
  entry: Entry
  mistakes: Mistake[]
  entryId: string
}) {
  const fb = entry.feedback
  if (!fb) return null

  const byCategory = new Map<string, number>()
  for (const m of mistakes) byCategory.set(m.category, (byCategory.get(m.category) ?? 0) + 1)

  return (
    <div className="space-y-12">
      {/* 총평 + 점수 */}
      <section className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <Score label="Grammar" value={fb.scores.grammar} />
          <Score label="Vocabulary" value={fb.scores.vocabulary} />
          <Score label="Fluency" value={fb.scores.fluency} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-6">
          <Tag>{fb.level}</Tag>
          <span className="tabnum text-xs text-ink/50">
            {entry.wordCount} words · 교정 {fb.correctionCount}개
          </span>
        </div>

        <p className="content-text max-w-prose text-[15px] leading-relaxed text-ink/80">
          {fb.overallComment}
        </p>

        {fb.praise.length > 0 && (
          <ul className="space-y-2 border-t border-ink/10 pt-6">
            {fb.praise.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink/65">
                <span className="eyebrow tabnum mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {byCategory.size > 0 && (
        <section>
          <SectionTitle>이번 일기의 실수 분포</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([slug, n]) => (
                <Tag key={slug} color={categoryColor(slug)}>
                  {getCategory(slug).ko} {n}
                </Tag>
              ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>교정된 일기</SectionTitle>
        <SelectionSaver
          entryId={entryId}
          dateKey={entry.dateKey}
          sourceText={fb.correctedText}
        >
          <Panel>
            <p className="content-text text-[17px] whitespace-pre-wrap">
              <DiffText before={entry.text} after={fb.correctedText} />
            </p>
          </Panel>
        </SelectionSaver>
        <p className="mt-2 text-xs text-ink/35">
          <span style={{ color: "var(--color-bad)" }}>취소선</span>은 빠진 부분,{" "}
          <span style={{ color: "var(--color-good)" }}>밑줄</span>은 새로 들어간 부분이에요.
          {" "}마음에 드는 표현을 <strong className="font-medium text-ink/55">드래그하면</strong>{" "}
          저장함에 담을 수 있어요.
        </p>
      </section>

      {mistakes.length > 0 && (
        <section>
          <SectionTitle>하나씩 짚어보기 ({mistakes.length})</SectionTitle>
          <div className="space-y-3">
            {mistakes.map((m) => (
              <CorrectionCard key={m.id} mistake={m} entryId={entryId} />
            ))}
          </div>
        </section>
      )}

      {fb.upgrades.length > 0 && (
        <section>
          <SectionTitle>이렇게 쓰면 더 자연스러워요</SectionTitle>
          <div className="space-y-3">
            {fb.upgrades.map((u, i) => (
              <Panel key={i} className="!p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="content-text text-[15px]">
                      <span className="text-ink/45">{u.original}</span>
                      <span className="mx-2 text-ink/30">→</span>
                      <span className="font-medium text-ink">{u.better}</span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{u.note}</p>
                  </div>
                  <SaveButton
                    item={{
                      kind: "phrase",
                      sourceId: `${entryId}-upgrade-${i}`,
                      entryId,
                      dateKey: entry.dateKey,
                      front: u.original,
                      back: u.better,
                      note: u.note,
                    }}
                  />
                </div>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t border-ink/10 pt-4">
      <p className="eyebrow">{label}</p>
      <p className="display tabnum mt-2 text-4xl italic text-ink">{value}</p>
      <div className="mt-3 h-px bg-ink/10">
        <div
          className="h-px bg-ink transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
