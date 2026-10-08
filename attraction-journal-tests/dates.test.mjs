// 날짜 계산 퍼즈: 무작위 시작일 × 무작위 '오늘'로 DAY/주차/13주 범위를 검사한다.
// 서머타임이 있는 시간대에서도 하루가 어긋나지 않는지 본다.
import { run, reset, assert } from './harness.mjs';

const CASES = Number(process.env.DATE_CASES || 4000);
const ZONES = ['Asia/Seoul', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'Pacific/Auckland'];

for (const tz of ZONES) {
  await run(`dates · ${tz} · ${CASES} cases`, async ({ page }) => {
    await reset(page);
    const fails = await page.evaluate(async CASES => {
      const m = await import('/firebase.js');
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fails = [];
      for (let i = 0; i < CASES; i++) {
        const start = new Date(2024, 0, 1 + Math.floor(Math.random() * 1600));
        const off = Math.floor(Math.random() * 150) - 30;
        const today = new Date(start); today.setDate(start.getDate() + off);
        today.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        const sd = fmt(start), exp = off + 1, p = m.getResetProgress(sd, today);
        const end = new Date(start); end.setDate(start.getDate() + 89);
        if (p.day !== exp) fails.push({ sd, off, day: p.day });
        if (p.endDate !== fmt(end)) fails.push({ sd, endDate: p.endDate });
        if (p.started !== exp >= 1 || p.finished !== exp > 90) fails.push({ sd, off, flags: [p.started, p.finished] });
        if (p.week !== Math.min(13, Math.max(1, Math.ceil(exp / 7)))) fails.push({ sd, off, week: p.week });
        if (p.percent < 0 || p.percent > 100) fails.push({ sd, off, percent: p.percent });
        if (p.started && !p.finished) {
          const r = m.getResetWeekRange(sd, p.week), t = fmt(today);
          if (!(r.start <= t && t <= r.end)) fails.push({ sd, off, r, t });
        }
        if (i % 20 === 0) {
          // 13주가 빈틈없이 이어지고 DAY 90에서 끝나야 한다
          let prev = null;
          for (let w = 1; w <= 13; w++) {
            const r = m.getResetWeekRange(sd, w);
            if (prev) { const d = new Date(prev + 'T12:00'); d.setDate(d.getDate() + 1); if (fmt(d) !== r.start) fails.push({ sd, w, gap: [prev, r.start] }); }
            prev = r.end;
          }
          if (prev !== fmt(end)) fails.push({ sd, week13end: prev });
        }
      }
      return fails;
    }, CASES);
    assert.deepEqual(fails.slice(0, 5), []);
  }, { tz });
}
