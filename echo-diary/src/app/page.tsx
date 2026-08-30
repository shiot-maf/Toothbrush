"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { ErrorNote, Loading, Pill } from "@/components/ui"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { FeedbackView } from "@/components/FeedbackView"
import { TextSizeControl, useTextSize } from "@/components/TextSizeControl"
import { getApiKey, requestFeedback, FeedbackError } from "@/lib/ai/client"
import { countWords, getEntry, listMistakes, saveEntry, saveFeedback } from "@/lib/firebase/db"
import { toDateKey, formatKoFull } from "@/lib/dates"
import type { Entry, Mistake, RawCorrection } from "@/lib/types"

const DRAFT_KEY = "echodiary.draft"

const NUDGES = [
  "What was the best part of today?",
  "Something small that annoyed you today.",
  "Describe someone you talked to today.",
  "What did you eat, and was it any good?",
  "One thing you're looking forward to.",
  "A decision you made today, and why.",
  "What would you do differently if today repeated?",
  "Something you noticed on your way somewhere.",
]

export default function WritePage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const { size, index: sizeIndex, set: setSize } = useTextSize()

  const [dateKey, setDateKey] = useState(() => toDateKey())
  const [text, setText] = useState("")
  const [entryId, setEntryId] = useState<string | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [corrections, setCorrections] = useState<RawCorrection[]>([])

  const [analyzing, setAnalyzing] = useState(false)
  const [needsKey, setNeedsKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const words = useMemo(() => countWords(text), [text])
  const nudge = useMemo(() => NUDGES[new Date().getDate() % NUDGES.length], [])

  // 새로고침하거나 실수로 탭을 닫아도 쓰던 글이 남도록 초안을 로컬에 둔다.
  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    if (draft) setText(draft)
  }, [])

  useEffect(() => {
    if (entry) return
    const id = window.setTimeout(() => window.localStorage.setItem(DRAFT_KEY, text), 400)
    return () => window.clearTimeout(id)
  }, [text, entry])

  useEffect(() => () => abortRef.current?.abort(), [])

  // 스크롤바 대신 입력창 자체가 자라게 한다 — 글이 길어져도 시야가 끊기지 않는다.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.max(el.scrollHeight, 256)}px`
  }, [text, size])

  if (!user) return null

  const analyze = async () => {
    if (words < 5) return
    if (!getApiKey()) {
      setNeedsKey(true)
      return
    }

    setAnalyzing(true)
    setError(null)
    setNeedsKey(false)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      // 지난 실수를 같이 넘겨서 "이거 저번에도 틀렸어요"를 짚어줄 수 있게 한다.
      const history = await listMistakes(user.uid, 60)
      const id = await saveEntry(user.uid, { id: entryId ?? undefined, dateKey, text })
      if (!entryId) setEntryId(id)

      const { feedback, model } = await requestFeedback({
        text,
        dateKey,
        recentMistakes: history,
        signal: controller.signal,
      })
      await saveFeedback(user.uid, id, dateKey, feedback, model)

      setEntry(await getEntry(user.uid, id))
      setCorrections(feedback.corrections)
      window.localStorage.removeItem(DRAFT_KEY)
      await refreshProfile()
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      if (e instanceof FeedbackError) {
        if (e.kind === "no_key") setNeedsKey(true)
        else setError(e.message)
      } else {
        console.error(e)
        setError("첨삭 중 문제가 생겼어요. 일기는 저장돼 있으니 다시 시도해보세요.")
      }
    } finally {
      setAnalyzing(false)
      abortRef.current = null
    }
  }

  const saveOnly = async () => {
    if (!text.trim()) return
    const id = await saveEntry(user.uid, { id: entryId ?? undefined, dateKey, text })
    window.localStorage.removeItem(DRAFT_KEY)
    await refreshProfile()
    router.push(`/history/entry?id=${id}`)
  }

  const startNew = () => {
    setEntry(null)
    setCorrections([])
    setEntryId(null)
    setText("")
    setDateKey(toDateKey())
  }

  // ── 첨삭 결과 ────────────────────────────────────────────────
  if (entry?.feedback) {
    const asMistakes = corrections.map(
      (c, i) =>
        ({
          ...c,
          id: `local-${i}`,
          entryId: entryId ?? "",
          dateKey,
          createdAt: Date.now(),
          reviewCount: 0,
        }) satisfies Mistake,
    )
    return (
      <div className="reveal space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-lg">Chapter II — Refined</p>
            <h1 className="display mt-3 text-5xl text-ink">
              Here&apos;s what <span className="italic">changed</span>.
            </h1>
            <p className="mt-2 text-sm text-ink/55">{formatKoFull(dateKey)}</p>
          </div>
          <Pill variant="outline" onClick={startNew}>
            새 일기
          </Pill>
        </header>

        <FeedbackView entry={entry} mistakes={asMistakes} entryId={entryId ?? ""} />

        <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-8">
          <Pill variant="outline" onClick={() => router.push("/report")}>
            리포트 보기
          </Pill>
          <Pill variant="outline" onClick={() => router.push("/review")}>
            복습하기
          </Pill>
        </div>
      </div>
    )
  }

  // ── 작성 ─────────────────────────────────────────────────────
  return (
    <div className="space-y-16">
      <header className="reveal space-y-4" style={{ animationDelay: "40ms" }}>
        <p className="eyebrow-lg">Chapter I — Write</p>
        <h1 className="display text-6xl text-ink sm:text-7xl">
          Echo <span className="italic">your</span> day.
        </h1>
      </header>

      <div className="reveal" style={{ animationDelay: "180ms" }}>
        <div className="relative">
          <div className="pointer-events-none absolute -left-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-ink/25 via-ink/5 to-transparent md:block" />

          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
            <input
              type="date"
              value={dateKey}
              max={toDateKey()}
              onChange={(e) => e.target.value && setDateKey(e.target.value)}
              aria-label="일기 날짜"
              className="eyebrow bg-transparent outline-none"
            />
            <div className="flex items-center gap-4">
              <p className="eyebrow tabnum" aria-live="polite">
                {words} words · {text.length} chars
              </p>
              <TextSizeControl index={sizeIndex} onChange={setSize} />
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Today…\n\n${nudge}`}
            rows={6}
            spellCheck={false}
            autoCapitalize="sentences"
            style={{
              maxWidth: "min(45ch, 100%)",
              fontSize: size,
              lineHeight: 1.5,
              fontFamily: "var(--font-content)",
            }}
            className="min-h-[16rem] w-full resize-none overflow-hidden bg-transparent text-ink caret-ink outline-none selection:bg-ink/10 placeholder:text-ink/25"
          />

          <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-ink/10 pt-8 sm:flex-row sm:items-center">
            <p className="max-w-xs text-xs leading-relaxed text-ink/45">
              완벽하게 쓰려고 멈추지 마세요. 틀린 채로 끝까지 쓰는 게 데이터가 됩니다.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Pill variant="quiet" onClick={saveOnly} disabled={!text.trim() || analyzing}>
                첨삭 없이 저장
              </Pill>
              <Pill onClick={analyze} disabled={words < 5} busy={analyzing}>
                <span>{analyzing ? "첨삭 중" : "Correct"}</span>
                {!analyzing && <span className="h-1.5 w-1.5 rounded-full bg-bg/80" />}
              </Pill>
            </div>
          </div>
        </div>
      </div>

      {needsKey && <ApiKeyPrompt onSaved={() => void analyze()} />}
      {error && <ErrorNote>{error}</ErrorNote>}
      {analyzing && <Loading label="첨삭하는 중… 20초쯤 걸려요" />}

      <p className="text-xs text-ink/35">
        지난 일기는{" "}
        <Link href="/history" className="underline underline-offset-2 hover:text-ink">
          기록
        </Link>
        에, 누적 취약점은{" "}
        <Link href="/report" className="underline underline-offset-2 hover:text-ink">
          리포트
        </Link>
        에 있어요.
      </p>
    </div>
  )
}
