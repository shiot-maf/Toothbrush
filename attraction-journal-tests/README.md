# attraction-journal-tests

끌어당김의 기록(`../attraction-journal`) 브라우저 테스트. 지금은 90 DAY RESET을 중심으로 본다.

`attraction-journal/` 폴더는 통째로 GitHub Pages에 올라가므로 테스트는 이 폴더에 따로 둔다.

## 실행

```bash
cd attraction-journal-tests
npm install          # playwright만 설치한다
npm test             # 전부: 날짜 퍼즈 → 시나리오 → 저장 퍼즈
```

| 명령 | 내용 |
|---|---|
| `npm run test:dates` | 날짜 계산 퍼즈. 시간대 5곳(서머타임 포함) × 무작위 시작일 4,000개로 DAY N, 주차, 13주 범위, DAY 90을 검사한다 |
| `npm run test:scenarios` | 정해진 시나리오: ×10 계산, 시작일 상태별 화면, 일기·홈·리포트 연결, 두 기기 동시 편집, 열어 보기만 할 때, 오프라인과 복구 |
| `npm run test:fuzz` | 저장 퍼즈. 무작위 편집 · 탭 이동 · 새로고침을 반복한 뒤, 화면과 서버에 남은 값이 마지막 입력과 같은지 본다 |

퍼즈의 양은 환경 변수로 조절한다.

```bash
FUZZ_SEEDS=50 FUZZ_STEPS=120 npm run test:fuzz   # seed 1–50, 각 120단계
node fuzz.test.mjs 7                             # 실패한 seed 하나만 다시 (같은 순서로 재현된다)
DATE_CASES=20000 npm run test:dates
```

## 원리

- 진짜 Firebase에는 붙지 않는다. `harness.mjs`가 Firebase SDK 요청을 `fake-firebase.js`로 바꿔치기한다.
- 가짜 Firebase는 쓰기를 순서대로, **지연 뒤에** 반영한다(seed마다 50/350/650/950ms). 그래서 저장 중에 페이지를 떠나면 그 쓰기는 실제처럼 사라진다.
- `localStorage.__offline = '1'`이면 쓰기가 실패한다.
- 퍼즈는 seed를 정하면 같은 동작을 그대로 되풀이한다.

## 한계

- 실제 Firestore와 보안 규칙은 검사하지 않는다.
- 로그인은 항상 `u1` 사용자로 되어 있다고 가정한다.
