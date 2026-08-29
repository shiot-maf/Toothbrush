"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { PageHeader } from "@/components/AppShell"
import { Empty, Loading, Panel, Pill, Tag } from "@/components/ui"
import { listMistakes, markReviewed } from "@/lib/firebase/db"
import { prioritizeForReview } from "@/lib/analysis/aggregate"
import { answersMatch, diffWords } from "@/lib/analysis/diff"
import { categoryColor, getCategory } from "@/lib/taxonomy"
import { formatKo } from "@/lib/dates"
import type { Mistake } from "@/lib/types"

/**
 * 복습은 내가 실제로 틀린 문장으로만 낸다. 시중 문제집이 아니라
 * 내 일기에서 나온 것이라 "왜 이걸 풀어야 하는지"가 자명하다.
 */
export default function ReviewPage() {
  const { user } = useAuth()
  const [deck, setDeck] = useState<Mistake[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [checked, setChecked] = useState<null | boolean>(null)
  const [score, setScore] = useState({ right: 0, wrong: 0 })

  useEffect(() => {
    if (!user) return
    listMistakes(user.uid, 2000)
      .then((all) => setDeck(prioritizeForReview(all, 15)))
      .catch(() => setDeck([]))
  }, [user])

  const current = deck?.[index]
  const finished = deck !== null && index >= deck.length

  const check = async () => {
    if (!current || !user || checked !== null) return
    const correct = answersMatch(answer, current.corrected)
    setChecked(correct)
    setScore((s) => ({
      right: s.right + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }))
    await markReviewed(user.uid, current.id, correct, current.reviewCount)
  }

  const next = () => {
    setIndex((i) => i + 1)
    setAnswer("")
    setChecked(null)
  }

  const restart = () => {
    setIndex(0)
    setAnswer("")
    setChecked(null)
    setScore({ right: 0, wrong: 0 })
  }

  if (!user) return null
  if (!deck) return <Loading />

  if (deck.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Drill" title="Review" />
        <Empty
          title="복습할 실수가 아직 없어요"
          action={
            <Link href="/">
              <Pill>일기 쓰러 가기</Pill>
            </Link>
          }
        >
          일기를 첨삭받으면 거기서 나온 실수로 문제가 만들어집니다.
        </Empty>
      </div>
    )
  }

  if (finished) {
    const total = score.right + score.wrong
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Drill" title="Review" />
        <section className="reveal border-y border-ink/12 py-12 text-center">
          <p className="eyebrow">오늘의 복습</p>
          <p className="display tabnum mt-4 text-6xl text-ink">
            {score.right}
            <span className="text-3xl opacity-40">/{total}</span>
          </p>
          <p className="mt-4 text-sm text-ink/60">
            {score.wrong === 0
              ? "전부 맞혔어요. 이 표현들은 이제 몸에 붙었네요."
              : `${score.wrong}개는 아직 헷갈려요. 다음 복습에 다시 나옵니다.`}
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <Pill onClick={restart}>다시 풀기</Pill>
            <Link href="/report">
              <Pill variant="outline">리포트 보기</Pill>
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const cat = getCategory(current!.category)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Drill"
        title="Review"
        description="내가 실제로 틀렸던 표현을 다시 고쳐보세요."
      />

      {/* 진행 */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink/10">
          <div
            className="h-px bg-ink transition-[width] duration-300"
            style={{ width: `${(index / deck.length) * 100}%` }}
          />
        </div>
        <span className="eyebrow tabnum">
          {index + 1} / {deck.length}
        </span>
      </div>

      <Panel key={current!.id} className="reveal space-y-5">
        <div className="flex items-center gap-2">
          <Tag color={categoryColor(current!.category)}>{cat.ko}</Tag>
          <span className="ml-auto text-[11px] text-ink/35">
            {formatKo(current!.dateKey)}에 쓴 일기
          </span>
        </div>

        <div>
          <p className="eyebrow mb-2">이 표현을 고쳐보세요</p>
          <p className="content-text text-2xl" style={{ color: "var(--color-bad)" }}>
            {current!.original}
          </p>
        </div>

        <div>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              if (checked === null) void check()
              else next()
            }}
            disabled={checked !== null}
            placeholder="고친 표현을 입력하세요"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="content-text w-full border-b border-ink/20 bg-transparent pb-2 text-lg outline-none focus:border-ink disabled:opacity-70"
          />
          <p className="mt-2 text-xs text-ink/35">
            대소문자와 구두점 차이는 맞은 것으로 봐요.
          </p>
        </div>

        {checked === null ? (
          <div className="flex flex-wrap gap-2">
            <Pill onClick={check} disabled={!answer.trim()}>
              확인
            </Pill>
            <Pill variant="quiet" onClick={() => { setChecked(false); setScore(s => ({...s, wrong: s.wrong + 1})) }}>
              모르겠어요
            </Pill>
          </div>
        ) : (
          <div className="space-y-4 border-t border-ink/10 pt-5">
            <p
              className="text-[11px] font-bold tracking-[0.18em] uppercase"
              style={{ color: checked ? "var(--color-good)" : "var(--color-bad)" }}
            >
              {checked ? "정답" : "다시 보기"}
            </p>

            <div>
              <p className="eyebrow mb-1.5">정답</p>
              <p className="content-text text-lg font-medium" style={{ color: "var(--color-good)" }}>
                {current!.corrected}
              </p>
            </div>

            {!checked && answer.trim() && (
              <div>
                <p className="eyebrow mb-1.5">내 답과의 차이</p>
                <p className="content-text text-sm">
                  {diffWords(answer, current!.corrected).map((t, i) =>
                    t.op === "same" ? (
                      <span key={i}>{t.text}</span>
                    ) : t.op === "remove" ? (
                      <span key={i} className="line-through" style={{ color: "var(--color-bad)" }}>
                        {t.text}
                      </span>
                    ) : (
                      <span key={i} className="font-medium" style={{ color: "var(--color-good)" }}>
                        {t.text}
                      </span>
                    ),
                  )}
                </p>
              </div>
            )}

            {current!.explanation && (
              <p className="text-sm leading-relaxed text-ink/60">{current!.explanation}</p>
            )}
            {current!.tip && (
              <p className="border-l-2 border-ink/15 pl-3 text-sm text-ink/55">
                {current!.tip}
              </p>
            )}

            <Pill onClick={next}>
              {index + 1 === deck.length ? "결과 보기" : "다음"}
            </Pill>
          </div>
        )}
      </Panel>
    </div>
  )
}
