// 전부 실행: 날짜 퍼즈 → 시나리오 → 저장 퍼즈. 하나라도 실패하면 종료 코드 1.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let failed = 0;
for (const f of ['dates.test.mjs', 'scenarios.test.mjs', 'fuzz.test.mjs']) {
  console.log(`\n▶ ${f}`);
  const r = spawnSync(process.execPath, [path.join(here, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n✗ ${failed}개 파일 실패` : '\n✓ 모두 통과');
process.exit(failed ? 1 : 0);
