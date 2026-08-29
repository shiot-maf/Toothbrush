import type { MetadataRoute } from "next"

/** PWA 매니페스트. 홈 화면에 추가하면 주소창 없이 앱처럼 뜬다. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Echo Diary — 영어일기 첨삭",
    short_name: "Echo Diary",
    description:
      "영어일기를 쓰고 첨삭받으며, 내가 반복해서 틀리는 지점을 데이터로 모읍니다.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf9f6",
    theme_color: "#fbf9f6",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
