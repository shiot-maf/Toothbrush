"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { PageHeader } from "@/components/AppShell"
import { Empty, Loading, Panel, Pill, Segmented, Tag } from "@/components/ui"
import { listEntries } from "@/lib/firebase/db"
import { formatKo } from "@/lib/dates"
import type { Entry } from "@/lib/types"

type Filter = "all" | "corrected" | "pending"

export default function HistoryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    if (!user) return
    listEntries(user.uid, 300)
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [user])

  const filtered = useMemo(() => {
    if (!entries) return null
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (filter === "corrected" && !e.feedback) return false
      if (filter === "pending" && e.feedback) return false
      if (!q) return true
      return (
        e.text.toLowerCase().includes(q) ||
        (e.feedback?.correctedText.toLowerCase().includes(q) ?? false)
      )
    })
  }, [entries, query, filter])

  // 월 단위로 묶어야 일기가 쌓여도 스크롤이 막막하지 않다.
  const grouped = useMemo(() => {
    if (!filtered) return []
    const map = new Map<string, Entry[]>()
    for (const e of filtered) {
      const month = e.dateKey.slice(0, 7)
      map.set(month, [...(map.get(month) ?? []), e])
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  if (!user) return null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Archive"
        title="History"
        description="지금까지 쓴 일기를 날짜순으로 모아뒀어요."
        action={
          <Link href="/">
            <Pill variant="outline">새 일기</Pill>
          </Link>
        }
      />

      {!entries ? (
        <Loading />
      ) : entries.length === 0 ? (
        <Empty
          title="아직 일기가 없어요"
          action={
            <Link href="/">
              <Pill>첫 일기 쓰기</Pill>
            </Link>
          }
        >
          세 문장이어도 충분해요. 쓰기 시작하면 여기에 쌓입니다.
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="내용으로 검색"
              className="min-w-0 flex-1 rounded-full border border-ink/12 bg-transparent px-4 py-2 text-sm outline-none focus:border-ink/35"
            />
            <Segmented
              label="첨삭 여부"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "전체" },
                { value: "corrected", label: "첨삭됨" },
                { value: "pending", label: "대기" },
              ]}
            />
          </div>

          {filtered?.length === 0 ? (
            <Empty title="찾는 일기가 없어요">
              검색어나 필터를 바꿔보세요.
            </Empty>
          ) : (
            grouped.map(([month, list]) => (
              <section key={month} className="space-y-3">
                <h2 className="eyebrow border-t border-ink/10 pt-5">
                  {month.slice(0, 4)}. {month.slice(5, 7)} — {list.length}편
                </h2>
                {list.map((e) => (
                  <EntryRow key={e.id} entry={e} />
                ))}
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}

function EntryRow({ entry }: { entry: Entry }) {
  const preview = entry.text.replace(/\s+/g, " ").slice(0, 120)
  const clean = entry.feedback?.correctionCount === 0

  return (
    <Link href={`/history/${entry.id}`} className="block">
      <Panel className="!p-5 transition-colors hover:border-ink/25">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{formatKo(entry.dateKey)}</span>
          <span className="tabnum text-xs text-ink/35">{entry.wordCount} words</span>
          <span className="ml-auto">
            {entry.feedback ? (
              <Tag color={clean ? "var(--color-good)" : undefined}>
                {clean ? "무결점" : `교정 ${entry.feedback.correctionCount}`}
              </Tag>
            ) : (
              <Tag>첨삭 대기</Tag>
            )}
          </span>
        </div>
        <p className="content-text line-clamp-2 text-sm text-ink/55">
          {preview}
          {entry.text.length > 120 && "…"}
        </p>
      </Panel>
    </Link>
  )
}
