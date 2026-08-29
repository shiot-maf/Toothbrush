"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { PageHeader } from "@/components/AppShell"
import { Empty, Loading, Panel, Pill, Segmented, Tag } from "@/components/ui"
import { listSaved, removeSaved } from "@/lib/firebase/db"
import { categoryColor, getCategory } from "@/lib/taxonomy"
import { formatKo } from "@/lib/dates"
import { invalidateSaved } from "@/components/SaveButton"
import type { SavedItem } from "@/lib/types"

type Filter = "all" | "correction" | "phrase"

export default function SavedPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<SavedItem[] | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    listSaved(user.uid)
      .then(setItems)
      .catch(() => setItems([]))
  }, [user])

  const filtered = useMemo(
    () => items?.filter((i) => filter === "all" || i.kind === filter) ?? null,
    [items, filter],
  )

  const drop = async (id: string) => {
    if (!user) return
    await removeSaved(user.uid, id)
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null)
    invalidateSaved()
  }

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (!user) return null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Keepsafe"
        title="Saved"
        description="교정과 표현 제안 중 따로 담아둔 것들. 답을 가려놓고 스스로 떠올려볼 수 있어요."
        action={
          items && items.length > 0 ? (
            <Segmented
              label="종류"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "전체" },
                { value: "correction", label: "교정" },
                { value: "phrase", label: "표현" },
              ]}
            />
          ) : undefined
        }
      />

      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          title="저장함이 비어 있어요"
          action={
            <Link href="/history">
              <Pill variant="outline">기록 보기</Pill>
            </Link>
          }
        >
          첨삭 결과에서 북마크 아이콘을 누르면 여기에 담깁니다. 꼭 외우고 싶은 것만
          골라 담아두세요.
        </Empty>
      ) : filtered?.length === 0 ? (
        <Empty title="이 종류로 담아둔 게 없어요" />
      ) : (
        <div className="space-y-3">
          {filtered?.map((item) => {
            const open = revealed.has(item.id)
            return (
              <Panel key={item.id} className="!p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {item.category ? (
                    <Tag color={categoryColor(item.category)}>
                      {getCategory(item.category).ko}
                    </Tag>
                  ) : (
                    <Tag>표현</Tag>
                  )}
                  <span className="ml-auto text-[11px] text-ink/35">
                    {item.dateKey && formatKo(item.dateKey)}
                  </span>
                  <button
                    onClick={() => drop(item.id)}
                    aria-label="저장함에서 빼기"
                    className="text-[11px] font-bold tracking-[0.14em] text-ink/35 uppercase hover:text-ink"
                  >
                    빼기
                  </button>
                </div>

                <p className="content-text text-[15px] text-ink/70">{item.front}</p>

                <button
                  onClick={() => toggleReveal(item.id)}
                  className="mt-3 block w-full text-left"
                  aria-expanded={open}
                >
                  {open ? (
                    <p className="content-text text-[15px] font-medium" style={{ color: "var(--color-good)" }}>
                      {item.back}
                    </p>
                  ) : (
                    <p className="eyebrow rounded-lg bg-ink/[0.04] px-3 py-2 text-center">
                      눌러서 정답 보기
                    </p>
                  )}
                </button>

                {open && item.note && (
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.note}</p>
                )}

                {item.entryId && (
                  <Link
                    href={`/history/${item.entryId}`}
                    className="mt-3 inline-block text-[11px] text-ink/35 underline underline-offset-2 hover:text-ink"
                  >
                    원래 일기 보기
                  </Link>
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}
