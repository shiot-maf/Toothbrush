// 정해진 시나리오: ×10 계산, 시작일 상태별 화면, 다른 노트와의 연결,
// 두 기기 동시 편집, 열어 보기만 했을 때, 오프라인과 복구.
import { run, reset, ready, settle, setField, serverDoc, ymd, assert, BASE } from './harness.mjs';

const goReset = async (p, hash = '') => { await p.goto(`${BASE}/reset.html${hash}`); await ready(p); };

await run('×10 계산', async ({ page }) => {
  await reset(page);
  await goReset(page);
  const cases = {
    '300': '3,000', '월 300만원': '월 3,000만원', '1,000,000원': '10,000,000원', '1.5억': '15억',
    '-5kg': '-50kg', '10% 성장': '100% 성장', '책 12권 → 20권': '책 120권 → 20권',
    'abc': '현재 목표에 숫자를 넣으면 계산돼요', '': '현재 목표에 숫자를 넣으면 계산돼요',
  };
  for (const [input, want] of Object.entries(cases)) {
    await setField(page, 'tenx.0.now', input);
    assert.equal(await page.textContent('[data-x10="0"]'), want, `×10 of ${JSON.stringify(input)}`);
  }
});

await run('시작일 상태별: 워크북 · 홈 카드 · 오늘의 실천 · 리포트', async ({ ctx, page }) => {
  await reset(page);
  await goReset(page);
  await setField(page, 'system.0.action', '걷기');
  await setField(page, 'identity.statement', '꾸준');
  const table = [
    // 시작일, 워크북, 홈 카드, 오늘의 실천, 리포트 카드
    ['', '—', '90일 리셋', '', false],
    [ymd(5), 'D-5', 'D-5', '', false],
    [ymd(0), 'DAY 1/ 90', 'DAY 1/ 90', '걷기', true],
    [ymd(-89), 'DAY 90/ 90', 'DAY 90/ 90', '걷기', true],
    [ymd(-90), '완주', '90일 완주', '', false],
  ];
  for (const [start, wb, card, practice, report] of table) {
    await setField(page, 'startDate', start);
    await settle(page);
    assert.equal((await page.textContent('#progressHero .rs-hero-day')).trim(), wb, `workbook @${start}`);
    const p2 = await ctx.newPage();
    await p2.goto(`${BASE}/home.html`); await p2.waitForTimeout(700);
    assert.equal((await p2.textContent('#resetDay')).trim(), card, `home card @${start}`);
    assert.equal((await p2.textContent('#practiceList')).trim(), practice, `practice @${start}`);
    if (start) assert.equal((await p2.textContent('#resetIdentity')).trim(), '나는 꾸준 한 사람이다.');
    // 오늘의 실천은 그날 처음 만들어질 때만 채워지므로 다음 줄을 위해 지운다
    await p2.evaluate(() => { const s = JSON.parse(localStorage.__fakefs); for (const k in s) if (k.includes('daily_action')) delete s[k]; localStorage.__fakefs = JSON.stringify(s); });
    await p2.goto(`${BASE}/report.html`); await p2.waitForTimeout(700);
    assert.equal((await p2.textContent('#reportContent')).includes('90 DAY RESET'), report, `report card @${start}`);
    await p2.close();
  }
});

await run('자기증명 일기: 빈 날은 IDENTITY로 채우고, 쓴 날은 건드리지 않는다', async ({ page }) => {
  await reset(page);
  await goReset(page);
  await setField(page, 'identity.statement', '꾸준');
  await settle(page);
  await page.goto(`${BASE}/today.html`); await page.waitForTimeout(500);
  assert.equal(await page.inputValue('#declaration'), '꾸준');
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.__fakefs), t = new Date();
    s[`users/u1/identity_diary/${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`] = { declaration: '용감', evidence: [] };
    localStorage.__fakefs = JSON.stringify(s);
  });
  await page.reload(); await page.waitForTimeout(500);
  assert.equal(await page.inputValue('#declaration'), '용감');
});

await run('해시로 들어오면 그 주차를 펼친다', async ({ page }) => {
  await reset(page);
  await goReset(page, '#week-13');
  await page.waitForTimeout(800);
  assert.equal(await page.$eval('#week-13', d => d.open), true);
  assert.equal(await page.textContent('.rs-chip.active'), '06 WEEKLY');
});

await run('두 기기에서 서로 다른 칸을 고쳐도 둘 다 남는다', async ({ ctx, page }) => {
  await reset(page);
  const B = await ctx.newPage();
  await goReset(page); await goReset(B);
  await setField(page, 'finish.worried', 'A가 쓴 글'); await settle(page);
  await setField(B, 'finish.learned', 'B가 쓴 글'); await settle(B);
  const d = await serverDoc(page);
  assert.equal(d.finish.worried, 'A가 쓴 글');
  assert.equal(d.finish.learned, 'B가 쓴 글');
});

await run('열어 보기만 하면 시작되지 않고, 첫 편집에 시작일이 저장된다', async ({ page }) => {
  await reset(page);
  await goReset(page);
  await page.click('.bottom-nav a[href="home.html"]'); await page.waitForURL('**/home.html'); await page.waitForTimeout(600);
  assert.equal(await serverDoc(page), null);
  assert.equal((await page.textContent('#resetDay')).trim(), '90일 리셋');
  await goReset(page);
  await setField(page, 'vision.where', '바닷가');
  await page.click('.bottom-nav a[href="home.html"]'); await page.waitForURL('**/home.html'); await page.waitForTimeout(600);
  const d = await serverDoc(page);
  assert.equal(d.startDate, ymd(0));
  assert.equal(d.vision.where, '바닷가');
  assert.equal((await page.textContent('#resetDay')).trim(), 'DAY 1/ 90');
});

await run('오프라인: 임시본이 남고, 재시도로 저장된다', async ({ page }) => {
  await reset(page);
  await page.evaluate(() => { localStorage.__offline = '1'; });
  await goReset(page);
  await setField(page, 'vision.life', '가족과 함께');
  await page.waitForTimeout(1500);
  assert.equal(await page.textContent('#saveState'), '저장 실패');
  assert.equal((await serverDoc(page))?.vision?.life, undefined);
  assert.equal(await page.evaluate(() => localStorage['reset90-pending-u1']), '{"vision.life":"가족과 함께"}');
  // 그대로 두면 5초 뒤 재시도
  await page.evaluate(() => { localStorage.__offline = '0'; });
  await page.waitForTimeout(6000);
  assert.equal(await page.textContent('#saveState'), '저장됨');
  assert.equal((await serverDoc(page)).vision.life, '가족과 함께');
  assert.equal(await page.evaluate(() => localStorage['reset90-pending-u1'] ?? null), null);
});

await run('오프라인에서 닫았다가 다시 열면 이어서 저장한다', async ({ page }) => {
  await reset(page);
  await page.evaluate(() => { localStorage.__offline = '1'; });
  await goReset(page);
  await setField(page, 'vision.work', '글 쓰는 일');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { localStorage.__offline = '0'; });
  await goReset(page);
  assert.equal(await page.inputValue('[data-k="vision.work"]'), '글 쓰는 일');
  await settle(page);
  assert.equal((await serverDoc(page)).vision.work, '글 쓰는 일');
});
