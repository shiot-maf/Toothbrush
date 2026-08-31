"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { Entry } from "@/lib/types"
import { useAuth } from "./AuthProvider"
import { signInWithGoogle, signOutUser } from "@/lib/firebase/auth"
import { WeeklyGoal } from "./WeeklyGoal"
import { MonthCalendar } from "./MonthCalendar"
import { QuestPanel } from "./QuestPanel"
import { listEntries, refreshQuests } from "@/lib/firebase/db"
import { currentWeekKeys } from "@/lib/dates"
import {
  Bookmark,
  ChartColumn,
  Clock,
  Flame,
  PenLine,
  Repeat,
  Settings as SettingsIcon,
  Spinner,
} from "./icons"

const NAV = [
  { href: "/", label: "쓰기", en: "Write", Icon: PenLine },
  { href: "/history", label: "기록", en: "History", Icon: Clock },
  { href: "/saved", label: "저장함", en: "Saved", Icon: Bookmark },
  { href: "/report", label: "리포트", en: "Report", Icon: ChartColumn },
  { href: "/review", label: "복습", en: "Review", Icon: Repeat },
  { href: "/settings", label: "설정", en: "Settings", Icon: SettingsIcon },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, demo } = useAuth()
  const pathname = usePathname()
  const [entries, setEntries] = useState<Entry[]>([])

  // 주간 목표와 캘린더가 같은 목록을 쓰므로 한 번만 읽는다.
  // 일기를 쓰면 profile.totalEntries가 바뀌므로 그때 다시 읽는다.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    listEntries(user.uid, 400)
      .then((list) => {
        if (!cancelled) setEntries(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, profile?.totalEntries])

  // 자정에 도는 스케줄러가 없으니 앱을 열 때 지난 퀘스트를 되돌린다.
  useEffect(() => {
    if (!user) return
    void refreshQuests(user.uid).catch(() => {})
  }, [user])

  const weekDone = useMemo(() => {
    const week = new Set(currentWeekKeys())
    return new Set(entries.filter((e) => week.has(e.dateKey)).map((e) => e.dateKey)).size
  }, [entries])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-ink/40">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  if (!user) return <Landing />

  return (
    <div className="min-h-dvh">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-6 md:grid-cols-12 md:gap-16 md:py-16">
        {/*
          데스크톱 사이드바.
          주간목표 + 캘린더 + 퀘스트가 쌓이면 화면 높이를 넘는데, sticky만 걸면
          넘친 부분에 영원히 닿을 수 없다. 안쪽에서 따로 스크롤되게 한다.
        */}
        <aside className="hidden md:sticky md:top-16 md:col-span-3 md:block md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto md:pr-2 md:[scrollbar-width:none]">
          <nav aria-label="주 메뉴" className="flex flex-col gap-8">
            <Link href="/" className="inline-flex items-baseline gap-2">
              <span className="display text-3xl italic text-ink">Echo</span>
            </Link>
            <div className="flex flex-col gap-4">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block pl-4 text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors ${
                      active
                        ? "-ml-[2px] border-l-2 border-ink text-ink"
                        : "text-ink/40 hover:text-ink"
                    }`}
                  >
                    {item.en}
                  </Link>
                )
              })}
            </div>
          </nav>
          <div className="mt-12 space-y-8">
            <WeeklyGoal done={weekDone} variant="sidebar" />
            <MonthCalendar entries={entries} />
            <QuestPanel />
          </div>
          <div className="mt-8 border-t border-ink/10 pt-6">
            <p className="truncate text-xs text-ink/50">{user.email}</p>
            {demo ? (
              <a
                href="/?demo=0"
                className="mt-1.5 inline-block text-xs text-ink/40 underline-offset-2 hover:text-ink hover:underline"
              >
                데모 나가기
              </a>
            ) : (
              <button
                onClick={() => signOutUser()}
                className="mt-1.5 text-xs text-ink/40 underline-offset-2 hover:text-ink hover:underline"
              >
                로그아웃
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0 pb-24 md:col-span-9 md:pb-0">
          {/* 모바일 헤더 */}
          <header className="md:hidden">
            <div className="flex items-center justify-between px-1 pb-4">
              <Link href="/" className="display text-3xl italic text-ink">
                Echo
              </Link>
              <div className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/5 px-3 py-1">
                <Flame className="h-3.5 w-3.5 text-ink" />
                <span className="tabnum text-xs font-semibold text-ink">
                  {profile?.streak ? `${profile.streak}일` : "기록 없음"}
                </span>
              </div>
            </div>
            <WeeklyGoal done={weekDone} variant="mobile" />
            {pathname === "/" && (
              <details className="mb-8 rounded-2xl border border-ink/10 px-4 py-3">
                <summary className="eyebrow cursor-pointer">기록 캘린더</summary>
                <div className="pt-2">
                  <MonthCalendar entries={entries} />
                </div>
              </details>
            )}
          </header>

          {demo && <DemoBanner />}

          {children}
        </main>
      </div>

      {/* 모바일 하단 탭 — 네이티브로 감쌌을 때도 그대로 쓰는 구조 */}
      <nav
        aria-label="주 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink/10 bg-bg/95 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-md md:hidden"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                active ? "text-ink" : "text-ink/40"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function DemoBanner() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
      <span className="eyebrow">데모 모드</span>
      <p className="text-sm text-ink/60">
        샘플 일기로 둘러보는 중이에요. 바꾼 내용은 저장되지 않습니다.
      </p>
      <a
        href="/?demo=0"
        className="ml-auto text-xs text-ink/40 underline underline-offset-2 hover:text-ink"
      >
        나가기
      </a>
    </div>
  )
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

/** 페이지 머리말 — 모든 화면이 같은 리듬으로 시작하도록. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow-lg mb-2">{eyebrow}</p>}
        <h1 className="display text-4xl text-ink sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-prose text-sm text-ink/60">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

function Landing() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      const code = (e as { code?: string }).code
      setError(
        code === "auth/popup-closed-by-user"
          ? "로그인 창이 닫혔어요."
          : code === "auth/unauthorized-domain"
            ? "이 도메인이 Firebase에 등록되지 않았어요. 콘솔의 승인된 도메인에 추가해주세요."
            : "로그인에 실패했어요. 잠시 후 다시 시도해주세요.",
      )
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <div className="reveal">
        <p className="eyebrow-lg">영어일기 · 첨삭 · 취약점 분석</p>
        <h1 className="display mt-5 text-6xl text-ink sm:text-7xl">
          Echo <span className="italic">your</span>
          <br />
          mistakes.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink/65">
          영어로 하루를 적으면 바로 첨삭을 받고,
          <br />
          <strong className="font-medium text-ink">내가 반복해서 틀리는 지점</strong>이
          데이터로 쌓입니다.
        </p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          <Feature n="01" title="쓰면 바로 첨삭">
            무엇이 왜 틀렸는지 한국어로 설명합니다.
          </Feature>
          <Feature n="02" title="모든 실수에 태그">
            시제·관사·전치사 등 26개 카테고리로 자동 분류됩니다.
          </Feature>
          <Feature n="03" title="취약점 리포트">
            무엇을 가장 많이 틀리는지, 나아지고 있는지 추이로 봅니다.
          </Feature>
          <Feature n="04" title="내 오답으로 복습">
            자주 틀린 것부터 골라 다시 물어봅니다.
          </Feature>
        </ul>

        <button
          onClick={signIn}
          disabled={busy}
          className="mt-12 inline-flex items-center gap-3 rounded-full bg-ink px-8 py-3.5 text-[11px] font-bold tracking-[0.22em] text-bg uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <span>{busy ? "연결 중" : "Google로 시작하기"}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-bg/80" />
        </button>
        {error && <p className="mt-4 text-sm text-[var(--color-bad)]">{error}</p>}

        <p className="mt-5 text-xs text-ink/40">
          일기는 내 계정에만 저장되고, API 키는 브라우저를 벗어나지 않습니다.
        </p>

        <p className="mt-8 border-t border-ink/10 pt-6 text-sm text-ink/50">
          그냥 어떤 앱인지 보고 싶다면{" "}
          <a
            href="/?demo=1"
            className="font-medium text-ink underline underline-offset-2"
          >
            샘플 데이터로 둘러보기
          </a>
          {" "}— 로그인도 API 키도 필요 없습니다.
        </p>
      </div>
    </div>
  )
}

function Feature({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: ReactNode
}) {
  return (
    <li className="border-t border-ink/10 pt-4">
      <span className="eyebrow tabnum">{n}</span>
      <p className="mt-2 font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/60">{children}</p>
    </li>
  )
}
