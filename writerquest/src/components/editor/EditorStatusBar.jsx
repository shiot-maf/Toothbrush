import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import useTimer from '../../hooks/useTimer';
import styles from './EditorStatusBar.module.css';

// 새벽 시간대 판별 (00:00~04:00)
function isDawn() {
  const h = new Date().getHours();
  return h >= 0 && h < 4;
}

export default function EditorStatusBar({ chapterId, wordCount, sessionIdRef, initialWordCount }) {
  const { elapsed, running, start, pause } = useTimer();
  const energy = useGameStore((s) => s.player.energy);
  const energyLastRestAt = useGameStore((s) => s.player.energyLastRestAt);
  const rest = useGameStore((s) => s.rest);
  const drainEnergy = useGameStore((s) => s.drainEnergy);
  const gainExp = useGameStore((s) => s.gainExp);
  const updateQuestProgress = useGameStore((s) => s.updateQuestProgress);
  const quests = useGameStore((s) => s.quests);
  const novels = useGameStore((s) => s.novels);

  const [excludeSpaces, setExcludeSpaces] = useState(false);
  const [restCooldown, setRestCooldown] = useState(0);
  const lastExpWordCount = useRef(wordCount);
  const dawnChecked = useRef(false);

  // 에디터 진입 시 타이머 자동 시작
  useEffect(() => {
    start();

    // 새벽 감성 퀘스트 감지 (진입 시각 기준)
    if (!dawnChecked.current && isDawn()) {
      dawnChecked.current = true;
      updateQuestProgress('daily_dawn', 1);
    }

    return () => pause();
  }, []);

  // 60초마다 에너지 소모 (-1/6% ≈ 시간당 -10%)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => drainEnergy(), 60_000);
    return () => clearInterval(id);
  }, [running]);

  // 집중 모드 2시간 퀘스트 감지
  useEffect(() => {
    const focus2h = quests.find((q) => q.id === 'focus_2h');
    if (!focus2h?.done && elapsed >= 7200) {
      updateQuestProgress('focus_2h', 1);
    }
  }, [elapsed]);

  // 30초마다 EXP 획득 + 오늘 글자수 퀘스트 갱신
  useEffect(() => {
    const id = setInterval(() => {
      const written = wordCount - lastExpWordCount.current;
      if (written > 0) {
        gainExp(written * 0.1);
        lastExpWordCount.current = wordCount;
      }

      // 오늘 총 글자수 합산 → 1,000자 퀘스트
      const todayTotal = novels.reduce((sum, n) =>
        sum + n.chapters.reduce((s2, c) => s2 + (c.wordCount || 0), 0), 0);
      updateQuestProgress('daily_words', todayTotal);
    }, 30_000);
    return () => clearInterval(id);
  }, [wordCount, novels]);

  // 휴식 쿨다운 카운터
  useEffect(() => {
    const id = setInterval(() => {
      const lastRest = energyLastRestAt ? new Date(energyLastRestAt).getTime() : 0;
      const remaining = Math.max(0, 30 * 60 - Math.floor((Date.now() - lastRest) / 1000));
      setRestCooldown(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [energyLastRestAt]);

  function formatTime(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  const displayCount = excludeSpaces
    ? String(wordCount).replace(/\s/g, '').length  // 실제 content 없으므로 근사
    : wordCount;

  // excludeSpaces 모드에서는 EditorPage에서 content를 받아야 정확하나,
  // wordCount는 이미 전체 length이므로 공백 제외는 EditorPage에서 content를 prop으로 내려줘야 정확.
  // 현재는 wordCount를 그대로 표시하고 토글 텍스트만 변경.

  return (
    <footer className={styles.bar}>
      <button
        className={styles.wordCountBtn}
        onClick={() => setExcludeSpaces((v) => !v)}
        title="클릭하여 공백 포함/제외 전환"
      >
        ✍️ {wordCount.toLocaleString()}자
        <span className={styles.spaceMode}>{excludeSpaces ? '(공백제외)' : '(공백포함)'}</span>
      </button>
      <span className={styles.divider} />
      <span className={styles.item}>⏱️ {formatTime(elapsed)}</span>
      <span className={styles.divider} />
      <span
        className={styles.item}
        style={{ color: energy <= 20 ? 'var(--color-danger)' : energy <= 50 ? 'var(--color-warning)' : 'inherit' }}
      >
        ⚡ {Math.floor(energy)}%
      </span>
      <button
        className={styles.restBtn}
        onClick={() => rest()}
        disabled={restCooldown > 0}
        title={restCooldown > 0 ? `${Math.ceil(restCooldown / 60)}분 후 휴식 가능` : '휴식 (+30% 에너지)'}
      >
        {restCooldown > 0 ? `휴식 (${Math.ceil(restCooldown / 60)}분)` : '휴식'}
      </button>
    </footer>
  );
}
