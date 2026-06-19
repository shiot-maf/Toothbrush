# 끌어당김의 기록 — 디자인 핸드오프

## 앱 개요

끌어당김의 법칙(Law of Attraction) 기반 모바일 저널 앱.
**매일 3가지 루틴**을 기록하며 자기 정체성을 강화하는 PWA.

- 프레임: 390px 고정폭 phone-frame (데스크탑에서도 폰 UI로 표시)
- 모바일(≤430px)에서는 전체 화면
- Firebase 인증 + Firestore 기반
- 다크/라이트 모드 지원

---

## 페이지 구조 및 네비게이션

```
[로그인] index.html
    ↓ (첫 로그인)
[온보딩] onboarding.html (3단계)
    ↓
[홈] home.html  ←─── 하단 탭바 (4개 탭)
    ├── [자기증명 일기] today.html         ← 뒤로가기 → 홈
    ├── [감사 선행기법] gratitude.html     ← 뒤로가기 → 홈
    ├── [HARD 노트]    hard.html           ← 뒤로가기 → 홈
    ├── [기록 열람]    history.html        ← 탭바 탭
    ├── [주간 리포트]  report.html         ← 탭바 탭
    └── [5년 비전]    vision.html          ← 탭바 탭
```

### 하단 탭바 구성 (4탭)
| 아이콘 | 라벨 | 페이지 |
|--------|------|--------|
| ⌂ | 홈 | home.html |
| ◫ | 기록 | history.html |
| ◈ | 리포트 | report.html |
| ✦ | 비전 | vision.html |

> 현재 아이콘은 유니코드 심볼. 디자인 단계에서 SVG 아이콘으로 교체 권장.

---

## 컬러 시스템

### 라이트 모드
```
배경
  --bg:             #F8F5FF  (연보라빛 화이트)
  --frame-bg:       #FFFFFF
  --card-bg:        #FFFFFF
  --border:         #DDD5F5

텍스트
  --text:           #1A1428
  --text-secondary: #5A4E78
  --text-hint:      #9A8CB8

노트 컬러 (3가지 노트 + 실천)
  자기증명  --c17:    #6A3EC0  / --c17-bg: #EDE5FF  (보라)
  감사선행  --c21:    #C03060  / --c21-bg: #FFE8F0  (코랄)
  HARD노트  --c28:    #3050B0  / --c28-bg: #E0E8FF  (인디고)
  실천      --cd:     #A06010  / --cd-bg:  #FFF0D8  (앰버)

히어로 그라디언트
  linear-gradient(135deg, #F0EAFF 0%, #FFE8F2 50%, #F5EEFF 100%)
```

### 다크 모드
```
배경
  --bg:             #110E1A
  --frame-bg:       #1A1628
  --card-bg:        #221E30
  --border:         #2A2040

텍스트
  --text:           #EAE4F8
  --text-secondary: #A89CC8
  --text-hint:      #6A5E88

노트 컬러 (라이트보다 밝게)
  자기증명  --c17:    #7C50D0  / --c17-bg: #1E1438
  감사선행  --c21:    #D04870  / --c21-bg: #2A1428
  HARD노트  --c28:    #4060C0  / --c28-bg: #0E1430
  실천      --cd:     #C07820  / --cd-bg:  #201808
```

---

## 타이포그래피

- **폰트**: Pretendard Variable (CDN)
- **폴백**: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo"

| 용도 | 크기 | 굵기 |
|------|------|------|
| 페이지 제목 | 17px | 700 |
| 섹션 라벨 | 10px | 800 / 대문자 / letter-spacing 1.2px |
| 카드 제목 | 14px | 700 |
| 본문 | 15px | 400 |
| 힌트/보조 | 13px | 400 |
| 배지/칩 | 11-12px | 700 |
| 하단탭 라벨 | 10px | 700 |
| 날짜 히어로 | 44px | 800 |

---

## 컴포넌트 목록

### 공통 레이아웃
- **phone-frame**: 390px 고정폭, border-radius 44px, 1px border
- **header**: 상단 헤더 (뒤로가기 + 제목 + 액션 버튼)
- **page-content**: 스크롤 영역 (flex:1, padding 20px)
- **bottom-nav**: 4탭 하단 탭바 (safe-area-inset-bottom 적용)
- **toast**: 하단 중앙 고정 알림

### 카드류
- **card**: 기본 카드 (border 0.5px, radius 18px, padding 16px)
- **card-17 / card-21 / card-28**: 각 노트 컬러 카드
- **hero-card**: 홈 히어로 섹션 (그라디언트 배경, 글로우 효과 다크모드)
- **note-card**: 홈 노트 링크 카드 (아이콘 + 제목 + 미리보기 + 상태)
- **vision-category**: 비전 카테고리 카드
- **history-item**: 기록 목록 아이템

### 입력 요소
- **input[type="text"] / textarea**: 기본 입력 (focus 시 border 색 변경)
- **sentence-row**: 선언문 인라인 입력 ("나는 ___ 한 사람이다" 형태)
- **num-field**: 번호 + 입력 조합 (01, 02, 03...)
- **hard-line-input**: HARD 노트용 밑줄 입력 필드 (투명 배경)

### 버튼
- **btn-17 / btn-21 / btn-28**: 각 노트 컬러 주요 버튼 (box-shadow 포함)
- **btn-outline**: 테두리만 있는 보조 버튼
- **btn-danger**: 위험 액션 버튼 (빨강 텍스트)
- **btn-google**: 구글 로그인 버튼
- **icon-btn**: 아이콘 전용 소형 버튼
- **practice-check**: 체크박스형 원형 버튼
- **practice-add-btn**: 점선 테두리 추가 버튼

### 배지 & 칩
- **badge-17 / badge-21 / badge-28**: 노트 타입 태그
- **chip-17 / chip-21**: 키워드 칩 (리포트용)
- **streak-badge**: 🔥 연속 기록 뱃지

### 네비게이션
- **tabs**: 상단 탭 전환 (history.html 달력/목록)
- **bottom-nav**: 하단 4탭 네비게이션
- **cal-nav**: 달력 월 이동 버튼
- **filter-bar / filter-btn**: 목록 필터 버튼

### 모달
- **modal-overlay**: 반투명 배경 (rgba 0.45)
- **modal-sheet**: 바텀 시트 (border-radius 위쪽만, safe-area 적용)
- **modal-handle**: 드래그 핸들 (36×4px 회색 바)

### 특수 컴포넌트
- **streak-week**: 이번 주 7일 스트릭 바 (홈)
- **streak-dot**: 개별 날짜 원 (done / today-ring / today-done)
- **hard-grid**: HARD 노트 2×2 그리드
- **week-grid**: 리포트 요일별 점 그리드
- **stat-box**: 리포트 통계 박스

---

## 화면별 상세

### index.html — 로그인
- 중앙 정렬 (flex center)
- ✨ 로고 이모지 + 앱 이름 + 설명
- Google 로그인 버튼
- 테마 버튼: phone-frame 바깥 우상단 고정 (`position:fixed`)
- **디자인 이슈**: 테마 버튼 위치가 다른 페이지와 다름. 개선 필요.

### onboarding.html — 온보딩 (3단계)
- 전체 화면 그라디언트 배경 (다크 그린 → 다크 블루 → 다크 오렌지로 전환)
- 슬라이드 방식 (display:none / .active 토글)
- 하단: 이전/다음 버튼 + 도트 인디케이터
- **폰 프레임 없음** (온보딩 전용 .onb-frame 사용)

### home.html — 홈
레이아웃 순서 (위→아래):
1. **hero-card**: 오늘의 명언 + 🔥 N일 연속 뱃지
2. **streak-week**: 이번 주 7일 스트릭 바
3. **TODAY'S PRACTICE**: 실천 체크리스트 카드 (인디고)
4. **TODAY'S NOTES**: 3개 노트 링크 카드 (자기증명/감사/HARD)
5. **MANIFESTATION**: HARD 노트의 "이미 이룬 것" 미리보기
6. **5 YEAR VISION**: 1년 후 비전 미리보기 → vision.html 링크
7. **하단 탭바**

### today.html — 자기증명 일기
- 힌트 박스 (상단)
- 날짜 선택 input
- "나는 ___ 한 사람이다" sentence-row
- 증거 3개 (num-field + textarea, auto-resize)
- "오늘의 나는 분명히 ___ 한 사람이었다" sentence-row
- 보라색(c17) 저장 버튼

### gratitude.html — 감사 선행기법
- 힌트 박스 2개 (상단/하단)
- 날짜 선택 input
- 감사 항목 5개 (JS 동적 생성, 각 항목 끝에 "감사합니다." 표시)
- "지금 이 순간의 감정" textarea
- 코랄색(c21) 저장 버튼

### hard.html — HARD 노트
- 날짜 + 이번 주 키워드 (2열)
- 2×2 그리드: H(보라)/A(코랄)/R(인디고)/D(앰버)
- 각 셀에 5개 줄 입력 필드
- 인디고색(c28) 저장 버튼

### history.html — 기록 열람
- 상단 탭: 달력 / 목록
- 달력 탭: 월 이동 + 7열 그리드 + 날짜별 컬러 점
- 목록 탭: 전체/자기증명/감사선행/HARD 필터 + 날짜별 그룹 목록
- 날짜 클릭 시 바텀 시트 모달

### report.html — 주간 리포트
- 기간 표시
- 통계 박스 3개 (자기증명 횟수 / 감사 횟수 / 감사 항목 수)
- 요일별 작성 현황 점 그리드
- 이번 주 정체성 키워드 칩
- 감사 키워드 칩
- 격려 메시지

### vision.html — 5년 비전
- 힌트 박스
- 5개 카테고리 (커리어/재정/관계/건강/성장), 각 1년/3년/5년 입력
- 보라색(c17) 저장 버튼

---

## Border Radius 시스템

```
--r-sm:    10px  (필터 버튼, 캘린더 셀)
--r:       14px  (입력 필드, 히스토리 아이템)
--r-lg:    18px  (카드, 버튼)
--r-hero:  24px  (히어로 카드)
--r-frame: 44px  (phone-frame, 모달 시트 상단)
```

---

## 현재 디자인 개선 포인트 (디자이너에게)

1. **하단 탭바 아이콘**: 현재 유니코드 심볼(⌂ ◫ ◈ ✦) → SVG 아이콘으로 교체
2. **로그인 화면**: 테마 버튼이 phone-frame 밖에 있음 → 일관된 위치로 통합
3. **온보딩 배경**: 단순 다크 그라디언트 → 브랜드 감성 강화
4. **홈 히어로**: 명언 카드와 스트릭 배지의 계층 구조 개선 여지
5. **HARD 노트 2×2 그리드**: 모바일에서 텍스트 크기(10px)가 너무 작음
6. **모달**: 바텀 시트가 단순함 → 헤더/구분선 추가 고려
7. **실천 카드**: 체크 상태의 시각적 피드백 강화 여지
8. **전반적**: 섀도우/글로우를 다크모드에 더 적극적으로 활용

---

## 파일 목록

```
attraction-journal/
├── index.html        로그인
├── onboarding.html   온보딩
├── home.html         홈
├── today.html        자기증명 일기
├── gratitude.html    감사 선행기법
├── hard.html         HARD 노트
├── history.html      기록 열람
├── report.html       주간 리포트
├── vision.html       5년 비전
├── style.css         전체 스타일
├── utils.js          공통 유틸 (initTheme, showToast)
├── firebase.js       Firebase 연동
├── manifest.json     PWA 매니페스트
└── icon.svg          앱 아이콘
```
