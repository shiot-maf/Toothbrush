# WriterQuest QA 리포트

> 20년차 QA 관점 전수 점검 — 2026-05-25
> 해결 완료 항목은 `- [x]`로 체크

---

## 🔴 P0 — 데이터 유실 / 앱 크래시 위험

- [x] **P0-1. trash가 Firestore 문서 1MB 한도 초과 가능**
  - `trash` 배열이 챕터 `content` 전체를 포함한 채 `users/{uid}` 문서에 저장됨
  - 챕터 여러 개 삭제 시 문서 크기 초과 → 이후 모든 저장이 무음 실패
  - **Fix:** trash를 별도 `users/{uid}/trash/{id}` 서브컬렉션으로 분리

- [x] **P0-2. 스탯(style, imagination 등) 증가 로직 완전 미구현**
  - `StatPanel`에 5개 스탯 바가 표시되지만 어디에도 스탯을 올리는 코드가 없음
  - 게임 핵심 시스템이 껍데기만 존재
  - **Fix:** 집필 글자수/시간에 따라 스탯 증가 로직 구현 (`gainStats` 액션 추가, EditorStatusBar 30s/60s 인터벌에서 호출)

- [x] **P0-3. 온보딩 완료 시 데이터 불일치 위험**
  - `completeOnboarding`에서 `_saveMeta()`와 `saveNovel()`을 별개 쓰기로 처리
  - `saveNovel` 실패 시 → Firestore에 `onboarded: true`지만 소설 없는 상태
  - **Fix:** Firestore `writeBatch`로 원자적 쓰기 (`saveOnboardingData` 함수 추가)

- [x] **P0-4. 저장 실패를 사용자에게 알리지 않음**
  - `saveNovel(uid, novel).catch((e) => console.error(...))`
  - Firestore 쓰기 실패 시 콘솔에만 출력, UI 피드백 전혀 없음
  - **Fix:** 저장 실패 시 `writerquest:error` CustomEvent 발행 → Toast 경고 표시

- [x] **P0-5. 오프라인 지원 없음**
  - Firestore 오프라인 퍼시스턴스 비활성화 상태
  - 네트워크 끊기면 저장 요청 모두 실패, 데이터 유실
  - **Fix:** `initializeFirestore(app, { localCache: persistentLocalCache() })` 활성화

---

## 🟠 P1 — 핵심 기능 오작동

- [x] **P1-1. 인라인 에디터(CenterPanel)에서 스트릭이 쌓이지 않음**
  - `endSession` 호출이 `EditorPage`(전체화면)에서만 존재
  - 메인 화면 `CenterPanel`에서 집필해도 `lastWrittenDate` 미갱신
  - 인라인 에디터만 사용하는 사용자는 스트릭 영구 0
  - **Fix:** `CenterPanel`에 `startSession`/`endSession` 연결

- [x] **P1-2. EditorPage의 저장 상태 표시 작동 안 함**
  - `EditorPage`의 `WritingEditor`에 `onSaveStatusChange` prop 미전달
  - 집필 중에도 항상 "저장됨"으로 고정 표시
  - **Fix:** `EditorPage`에 `saveStatus` 상태 추가 및 prop 전달

- [x] **P1-3. 타임존 버그 — 한국 사용자 자정 전후 날짜 오기록**
  - `new Date().toISOString().slice(0, 10)` → UTC 기준 날짜
  - 한국(UTC+9) 기준 밤 12시~새벽 9시 사이 집필이 전날로 기록됨
  - **Fix:** `localDateStr()` 유틸로 로컬 시간 기반 YYYY-MM-DD 사용 (gameStore, LeftPanel)

- [x] **P1-4. `window.prompt()` / `window.confirm()` 남용**
  - 소설 추가, 챕터 추가, 챕터 삭제, 휴지통 비우기 모두 브라우저 기본 다이얼로그
  - 모바일에서 차단 또는 앱 디자인과 완전히 다른 UI 표시
  - **Fix:** 인라인 입력 폼 또는 인라인 확인 UI로 교체

- [x] **P1-5. 챕터 제목 수정 불가**
  - 최초 생성 시에만 입력 가능, 이후 변경 방법 없음
  - **Fix:** 챕터 제목 더블클릭으로 인라인 편집 기능 추가

- [x] **P1-6. 소설 삭제 기능 없음**
  - `firestoreSync.js`에 `deleteNovel`은 있지만 `gameStore.js` 액션 및 UI 없음
  - **Fix:** `removeNovel` 액션 추가 및 LeftPanel NovelItem에 삭제 버튼 + 인라인 확인 UI

- [x] **P1-7. Tab 삽입 시 글자수 카운트 미갱신**
  - `handleKeyDown`의 Tab 처리에서 `onWordCountChange` 호출 누락
  - Tab 들여쓰기 후 글자수가 즉시 업데이트되지 않음
  - **Fix:** Tab 처리 블록에 `onWordCountChange?.(newValue.length)` 추가

---

## 🟡 P2 — UX 크게 저하

- [x] **P2-1. 에러 바운더리 없음**
  - Firestore 잘못된 데이터 또는 컴포넌트 렌더링 예외 시 앱 전체 흰 화면 크래시
  - **Fix:** `ErrorBoundary` 클래스 컴포넌트 생성, `main.jsx`에서 `<App />` 감쌈

- [x] **P2-2. BrowserRouter를 두 개 마운트 (App.jsx)**
  - `onboarded` 상태에 따라 두 개의 분리된 `<BrowserRouter>` 조건부 렌더링
  - 상태 전환 시 라우터 히스토리 초기화, 예상치 못한 동작 가능
  - **Fix:** 단일 `<BrowserRouter>`로 통합, 내부에서 조건부 라우팅

- [x] **P2-3. beforeunload 리스너가 키입력마다 재등록됨 (CenterPanel)**
  - `content`가 deps에 있어 키입력마다 이벤트 리스너 추가/제거 반복
  - **Fix:** `contentRef` 패턴 사용, `content` deps 제거

- [x] **P2-4. 소설 이모지 변경 불가**
  - 첫 소설 🌙, 이후 소설 📖로 고정
  - **Fix:** 소설 이모지 클릭 시 15종 프리셋 이모지 피커 표시 (`updateNovel` 액션 추가)

- [x] **P2-5. 퀘스트 표시 로직 불일치**
  - 완료된 일별 퀘스트는 계속 표시, 완료된 주별/1회성 퀘스트는 사라짐
  - **Fix:** 모든 퀘스트 표시 (미완료 우선 → 완료 후)

- [x] **P2-6. 로딩 타임아웃 후 재시도 방법 없음**
  - 10초 타임아웃 시 온보딩 화면으로 이동, 재시도 버튼 없음
  - **Fix:** `loadError` 스토어 플래그 추가, App.jsx 스플래시에 "다시 시도" 버튼 표시

- [x] **P2-7. SynopsisField Escape 시 편집 내용 소실**
  - 시놉시스 편집 중 Escape → 변경사항 미저장 닫힘
  - **Fix:** Escape 시 초안 저장 후 닫기

---

## 🔵 P3 — 마이너 버그 / 개선

- [x] **P3-1. getRedirectResult와 onAuthStateChanged가 initUser 중복 호출 가능**
  - 두 경로가 거의 동시에 같은 uid로 `initUser` 호출 시 레이스 컨디션 가능
  - **Fix:** `initializingUid` 모듈 변수로 동시 초기화 방지

- [x] **P3-2. firestoreSync.js 미사용 import 6개**
  - `addDoc`, `updateDoc` import됐지만 미사용 (writeBatch는 P0-3에서 활용)
  - **Fix:** `addDoc`, `updateDoc` 제거

- [x] **P3-3. formatTime 함수 중복 정의**
  - `EditorPage.jsx`와 `CenterPanel.jsx`에 동일 함수 두 번 정의
  - **Fix:** `src/utils/formatTime.js`로 추출, 두 파일에서 import

- [x] **P3-4. EditorStatusBar props sessionIdRef, initialWordCount 미사용**
  - Props 시그니처에 있지만 컴포넌트 내부에서 전혀 사용 안 함
  - **Fix:** 두 prop 제거 (컴포넌트 정의 및 호출부)

- [x] **P3-5. sessions 배열이 메모리에서 무한 증가**
  - `startSession`으로 추가만 되고 메모리에서 제거 안 됨
  - **Fix:** `endSession`에서 Firestore 저장 후 메모리 배열에서 제거

- [x] **P3-6. PWA 아이콘이 SVG만 존재**
  - iOS는 SVG PWA 아이콘 미지원, 홈 화면 추가 시 기본 아이콘 표시
  - **Fix:** PNG 192×192, 512×512 생성 (퍼플 #9b7fd4), manifest.json 업데이트

- [x] **P3-7. 에너지 소모가 집필 여부와 무관**
  - 에디터 열어놓고 타이핑 안 해도 에너지 소모됨
  - **Fix:** 마지막 타이핑으로부터 5분 이상 경과 시 에너지 소모 중단

---

## ⚪ P4 — 코드 품질

- [x] **P4-1. initUser 얼리 리턴이 loading: true 상태 방치 가능**
  - `if (get().uid === uid) return` 시 loading이 true인 채로 스피너 무한 표시 가능
  - **Fix:** `initializingUid` 가드로 교체, 로딩 중인 경우 제외하고 얼리 리턴

- [x] **P4-2. EditorPage 챕터 탐색이 IIFE로 매 렌더마다 실행**
  - `const { novel, chapter } = (() => { ... })()` → `useMemo`로 교체
  - **Fix:** `useMemo([novels, chapterId])`로 변경

- [x] **P4-3. 접근성 — 기능 버튼에 aria-label 없음**
  - 삭제(🗑), 상태 아이콘(🔵✏️🔄✅), 로그아웃(↩) 버튼에 `aria-label` 없음
  - **Fix:** LeftPanel 내 상태 아이콘, 삭제, 로그아웃, 소설 이모지 버튼에 `aria-label` 추가

---

## 진행 현황

```
P0: 5/5 완료
P1: 7/7 완료
P2: 7/7 완료
P3: 7/7 완료
P4: 3/3 완료
────────────
전체: 29/29 완료
```
