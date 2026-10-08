// 공통 준비: attraction-journal 정적 파일을 가짜 주소(http://app.test/)로 서빙하고,
// Firebase SDK 요청은 fake-firebase.js로 바꿔치기한다. 그 밖의 외부 요청은 막는다.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../attraction-journal');
export const BASE = 'http://app.test';
const fake = fs.readFileSync(path.join(here, 'fake-firebase.js'), 'utf8');
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

export async function open({ tz = 'Asia/Seoul' } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: tz });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('gstatic.com/firebasejs')) return r.fulfill({ contentType: 'text/javascript', body: fake });
    if (u.startsWith(BASE + '/')) {
      const p = path.join(ROOT, new URL(u).pathname);
      if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ contentType: TYPES[path.extname(p)] || 'text/html', body: fs.readFileSync(p) });
    }
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load')) errors.push(m.text()); });
  return { browser, ctx, page, errors };
}

// 깨끗한 저장소에서 시작한다
export async function reset(page, { lat = 100 } = {}) {
  await page.goto(BASE + '/icon.svg');
  await page.evaluate(lat => { localStorage.clear(); localStorage.__lat = String(lat); }, lat);
}

export const ready = p => p.waitForSelector('#progressHero .rs-hero-day');
export const settle = p => p.waitForFunction(() => document.getElementById('saveState').textContent === '저장됨', null, { timeout: 10000 });
export const setField = (p, k, v) => p.$eval(`[data-k="${k}"]`, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
export const serverDoc = p => p.evaluate(() => JSON.parse(localStorage.__fakefs || '{}')['users/u1/reset90/current'] || null);
export const ymd = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

// 결정적 난수 — 실패한 seed로 그대로 재현할 수 있다
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 테스트 하나를 실행하고 브라우저를 닫는다. 콘솔 오류도 실패로 친다.
export async function run(name, fn, opts) {
  const env = await open(opts);
  try {
    await fn(env);
    assert.deepEqual(env.errors.filter(e => !e.includes('offline')), [], 'console errors');
    console.log(`  ✓ ${name}`);
  } finally {
    await env.browser.close();
  }
}
export { assert };
