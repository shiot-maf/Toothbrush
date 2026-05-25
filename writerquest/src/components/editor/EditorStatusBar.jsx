import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './EditorStatusBar.module.css';

function isDawn() {
  const h = new Date().getHours();
  return h >= 0 && h < 4;
}

// P3-4: sessionIdRef, initialWordCount props 제거 (사용하지 않음)
export default function EditorStatusBar({ chapterId, wordCount, content, elapsed, running }) {
  const energy = useGameStore((s) => s.player.energy);
  const energyLastRestAt = useGameStore((s) => s.player.energyLastRestAt);
  const rest = useGameStore((s) => s.rest);
  const drainEnergy = useGameStore((s) => s.drainEnergy);
  const gainExp = useGameStore((s) => s.gainExp);
  const gainStats = useGameStore((s) => s.gainStats);
  const updateQuestProgress = useGameStore((s) => s.updateQuestProgress);
  const quests = useGameStore((s) => s.quests);

  const [excludeSpaces, setExcludeSpaces] = useState(false);
  const [restCooldown, setRestCooldown] = useState(0);
  const lastExpWordCount = useRef(wordCount);
  const dawnChecked = useRef(false);

  const wordCountRef = useRef(wordCount);
  useEffect(() => { wordCountRef.current = wordCount; }, [wordCount]);

  // P3-7: 마지막 타이핑 시각 추적 — wordCount 변화 = 타이핑
  const lastTypedAt = useRef(0);
  const prevWordCount = useRef(wordCount);
  useEffect(() => {
    if (wordCount !== prevWordCount.current) {
      lastTypedAt.current = Date.now();
      prevWordCount.current = wordCount;
    }
  });

  const sessionWordsRef = useRef(0);
  const dailyWordsBaseRef = useRef(
    quests.find((q) => q.id === 'daily_words')?.progress ?? 0
  );

  useEffect(() => {
    if (!dawnChecked.current && isDawn()) {
      dawnChecked.current = true;
      updateQuestProgress('daily_dawn', 1);
    }
  }, []);

  // P3-7: 에너지 소모 — 최근 5분 내 타이핑 없으면 소모 안 함
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const idleSec = (Date.now() - lastTypedAt.current) / 1000;
      if (idleSec < 300) drainEnergy();
    }, 60_000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const focus2h = quests.find((q) => q.id === 'focus_2h');
    if (!focus2h?.done && elapsed >= 7200) {
      updateQuestProgress('focus_2h', 1);
    }
  }, [elapsed]);

  // 30초마다 EXP + 스탯 획득 + 오늘 글자수 퀘스트 갱신
  useEffect(() => {
    const id = setInterval(() => {
      const written = wordCountRef.current - lastExpWordCount.current;
      if (written > 0) {
        gainExp(written * 0.1);
        // P0-2: 집필 글자수에 따라 문체력/대화술/묘사력 증가
        gainStats({ style: written * 0.01, dialogue: written * 0.01, description: written * 0.01 });
        sessionWordsRef.current += written;
        lastExpWordCount.current = wordCountRef.current;
        updateQuestProgress('daily_words', dailyWordsBaseRef.current + sessionWordsRef.current);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // 60초마다 집중력 스탯 증가 (타이핑 여부 무관)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      // P0-2: 집필 시간에 따라 집중력 증가
      gainStats({ focus: 0.1 });
    }, 60_000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const id = setInterval(() => {
      const lastRest = energyLastRestAt ? new Date(energyLastRestAt).getTime() : 0;
      const remaining = Math.max(0, 30 * 60 - Math.floor((Date.now() - lastRest) / 1000));
      setRestCooldown(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [energyLastRestAt]);

  const displayCount = excludeSpaces && content
    ? content.replace(/\s/g, '').length
    : wordCount;

  return (
    <footer className={styles.bar}>
      <button
        className={styles.wordCountBtn}
        onClick={() => setExcludeSpaces((v) => !v)}
        title="클릭하여 공백 포함/제외 전환"
      >
        ✍️ {displayCount.toLocaleString()}자
        <span className={styles.spaceMode}>{excludeSpaces ? '(공백제외)' : '(공백포함)'}</span>
      </button>
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
        aria-label={restCooldown > 0 ? `${Math.ceil(restCooldown / 60)}분 후 휴식 가능` : '휴식'}
      >
        {restCooldown > 0 ? `휴식 (${Math.ceil(restCooldown / 60)}분)` : '휴식'}
      </button>
    </footer>
  );
}
