# WriterQuest — 작가 여정

글 쓰는 RPG 앱. 소설을 집필하면 캐릭터가 성장하는 게임화된 집필 도우미.

## Run & Operate

- `npm run dev` — 개발 서버 시작 (Vite, 기본 포트 5173)
- `npm run build` — 프로덕션 빌드
- `npm run typecheck` — TypeScript 타입 검사
- `npm run lint` — ESLint 검사
- `npm run format` — Prettier 포맷팅

## Stack

- React 19 + Vite 8, JavaScript (JSX) — TypeScript 준비됨 (tsconfig 구성 완료)
- 상태 관리: Zustand (gameStore.js)
- 라우팅: react-router-dom v7
- 인증 + DB: Firebase Auth (signInWithRedirect) + Firestore
- 스타일: CSS Modules + CSS 커스텀 프로퍼티 (tokens.css)
- 날짜 유틸리티: date-fns

## Where things live

```
src/
├── pages/          — 라우트 단위 페이지 (Main, Editor, Onboarding, Login)
├── components/
│   ├── left/       — LeftPanel (소설/챕터 목록, 다크모드 토글)
│   ├── center/     — CenterPanel (인라인 집필 에디터)
│   ├── right/      — RightPanel (캐릭터, EXP/에너지, 퀘스트, 스탯, 댓글)
│   ├── editor/     — WritingEditor, EditorStatusBar
│   └── common/     — Toast (레벨업/퀘스트 알림)
├── hooks/          — useTimer, useAutoSave, useAuth, useTheme
├── store/          — gameStore.js (Zustand — 전체 게임 상태)
└── styles/         — tokens.css (CSS 변수, 다크모드 [data-theme="dark"])
```

소스 오브 트루스: `src/store/gameStore.js` — 플레이어/소설/퀘스트 상태 및 액션 전체 포함

## Architecture decisions

- **Zustand 셀렉터는 반드시 원시값 반환** — 객체 리터럴 반환 시 무한 루프 발생 (React Strict Mode + 참조 동등성)
- **인라인 에디터** — 별도 페이지 없이 CenterPanel 안에서 챕터 선택/집필 (selected 상태를 MainPage에서 lift)
- **다크모드 플래시 방지** — App.jsx 모듈 최상단에서 localStorage 읽어 `data-theme` 즉시 적용 (React 렌더 전)
- **Toast 디커플링** — gameStore → `window.dispatchEvent(CustomEvent)` → ToastContainer 구독 (store가 UI를 직접 참조하지 않음)
- **Firestore 오프라인** — 네트워크 없을 때 기본 상태(`onboarded: false`)로 폴백, 온보딩 페이지 진입

## Product

- 소설/챕터 목록 관리 (좌측 패널)
- 인라인 집필 에디터 — 자동저장(2초 디바운스), 실시간 글자수, 타이머
- 캐릭터 성장 시스템 — EXP, 레벨업, 능력치 5종 (스타일/상상력/대화/묘사/집중)
- 에너지 시스템 — 집필 중 소모, 30분 쿨다운 휴식 버튼
- 퀘스트 시스템 — 일별/주별 자정 리셋, 달성 시 Toast 알림
- 온보딩 — 닉네임 + 첫 소설 제목 입력

## Gotchas

- `npm run dev` 전 Firebase 환경변수 필요: `src/firebase.js`에 config 객체 하드코딩 (또는 `.env` 사용)
- Zustand selector에서 `(s) => ({ a: s.a })` 형태 절대 금지 — `(s) => s.a` 처럼 원시값만
- 챕터 전환 시 WritingEditor에 `key={chapterId}` 필수 — 없으면 이전 챕터 내용 잔류
- Firebase Auth `signInWithRedirect`는 localhost에서 팝업으로 폴백됨

## Pointers

- 기획서 전체: `/root/.claude/plans/root-claude-uploads-94200e60-4979-4395-parallel-journal.md`
- 배포 브랜치: `claude/review-planning-doc-k2Zn3`
- git push: `GH_TOKEN=$(gh auth token) && git remote set-url origin "https://shiot-maf:${GH_TOKEN}@github.com/shiot-maf/Toothbrush.git" && git push -u origin claude/review-planning-doc-k2Zn3`
