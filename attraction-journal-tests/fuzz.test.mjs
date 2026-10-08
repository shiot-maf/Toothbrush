// 저장 퍼즈 (모델 기반): 무작위 편집 · 탭 이동 · 새로고침을 반복하고,
// 다시 열었을 때의 화면 값과 마지막에 서버에 남은 값이 '마지막으로 입력한 값'과 같은지 본다.
//
//   node fuzz.test.mjs                 # seed 1–10, 80단계
//   node fuzz.test.mjs 7               # seed 7만 (실패 재현용)
//   FUZZ_SEEDS=50 FUZZ_STEPS=120 node fuzz.test.mjs
import { run, reset, ready, serverDoc, rng, assert, BASE } from './harness.mjs';

const POOL = ['꾸준', '아침 20분 걷기', '월 300만원', '<script>alert(1)</script>', 'A&B > C', '🔥 이모지 ✨', '  앞뒤 공백  ', '줄\n바꿈', 'ㅋ'.repeat(400), ''];
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);

async function fuzz(page, seed, steps, lat) {
  const R = rng(seed), pick = a => a[Math.floor(R() * a.length)];
  const go = async () => { await page.goto(BASE + '/reset.html'); await ready(page); };
  await reset(page, { lat });
  await go();
  const fields = await page.$$eval('#workbook [data-k]', els => els.map(e => ({ k: e.dataset.k, type: e.type })));
  const model = {}, lost = [];

  const check = async step => {
    await go();
    const now = await page.$$eval('#workbook [data-k]', els => Object.fromEntries(els.map(e => [e.dataset.k, e.type === 'checkbox' ? e.checked : e.value.trim()])));
    for (const [k, v] of Object.entries(model)) if (now[k] !== v) lost.push({ step, k, expected: v, got: now[k] });
    for (const [k, v] of Object.entries(now)) if (k !== 'startDate' && !(k in model) && v !== '' && v !== false) lost.push({ step, k, unexpected: v });
  };

  for (let i = 0; i < steps; i++) {
    const r = R();
    if (r < 0.7) {
      const f = pick(fields);
      if (f.type === 'checkbox') {
        model[f.k] = await page.$eval(`[data-k="${f.k}"]`, e => { e.checked = !e.checked; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return e.checked; });
      } else if (f.type === 'date') {
        const d = new Date(); d.setDate(d.getDate() + Math.floor(R() * 300) - 150);
        model[f.k] = d.toISOString().slice(0, 10);
        await page.$eval(`[data-k="${f.k}"]`, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, model[f.k]);
      } else {
        // 붙여넣기처럼: maxlength만큼 잘리고, 앱이 <>&를 지운다
        const v = await page.$eval(`[data-k="${f.k}"]`, (e, raw) => { e.value = raw.slice(0, e.maxLength > 0 ? e.maxLength : undefined); e.dispatchEvent(new Event('input', { bubbles: true })); return e.value; }, pick(POOL));
        model[f.k] = v.trim();
      }
    } else if (r < 0.8) {
      await page.waitForTimeout(Math.floor(R() * 1500));
    } else if (r < 0.9) {
      // 입력 직후 곧바로 다른 탭으로 갔다가 돌아온다
      await page.waitForTimeout(Math.floor(R() * 400));
      // 앱은 저장을 마친 뒤에 이동하므로, 주소가 실제로 바뀔 때까지 기다린다
      const target = pick(['home.html', 'report.html', 'vision.html']);
      await page.click(`.bottom-nav a[href="${target}"]`);
      await page.waitForURL(`**/${target}`, { timeout: 10000 });
      await page.waitForTimeout(150);
      await go();
    } else {
      await page.waitForTimeout(Math.floor(R() * 400));
      await page.reload(); await ready(page);
    }
    if (i % 10 === 9) await check(i);
  }
  await check(steps);

  // 저장이 끝난 뒤 서버 값도 같아야 하고, 임시본은 비어 있어야 한다
  await page.waitForFunction(() => document.getElementById('saveState').textContent !== '저장 중…', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const server = (await serverDoc(page)) || {};
  for (const [k, v] of Object.entries(model)) {
    const got = getPath(server, k) ?? (typeof v === 'boolean' ? false : '');
    if (got !== v) lost.push({ server: true, k, expected: v, got });
  }
  const pendingLeft = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('reset90-pending')).length);
  const htmlChars = /[<>&]/.test(JSON.stringify(server));
  return { lost, pendingLeft, htmlChars };
}

const only = process.argv[2] ? [Number(process.argv[2])] : null;
const seeds = only || Array.from({ length: Number(process.env.FUZZ_SEEDS || 10) }, (_, i) => i + 1);
const steps = Number(process.env.FUZZ_STEPS || 80);

for (const seed of seeds) {
  const lat = (seed % 4) * 300 + 50; // 50 / 350 / 650 / 950ms
  await run(`fuzz · seed ${seed} · ${steps} steps · latency ${lat}ms`, async ({ page }) => {
    const { lost, pendingLeft, htmlChars } = await fuzz(page, seed, steps, lat);
    assert.deepEqual(lost.slice(0, 5), [], `seed ${seed}: 값이 사라지거나 바뀜 (총 ${lost.length}건) — node fuzz.test.mjs ${seed} 로 재현`);
    assert.equal(pendingLeft, 0, '저장이 끝났는데 임시본이 남음');
    assert.equal(htmlChars, false, '저장된 값에 < > & 가 남음');
  });
}
