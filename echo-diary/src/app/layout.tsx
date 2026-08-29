import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { AppShell } from "@/components/AppShell"
import { ServiceWorker } from "@/components/ServiceWorker"

export const metadata: Metadata = {
  title: {
    default: "Echo Diary — 영어일기 첨삭 & 취약점 분석",
    template: "Echo Diary — %s",
  },
  description:
    "영어로 일기를 쓰면 AI가 첨삭하고, 내가 반복해서 틀리는 지점을 26개 카테고리로 분류해 데이터로 모아 보여줍니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Echo Diary" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 빌드 때 폰트를 받아오지 않도록 런타임 <link>로 붙인다 — 폐쇄망 빌드에서도 실패하지 않는다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
