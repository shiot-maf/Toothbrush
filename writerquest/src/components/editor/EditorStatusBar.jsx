import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './EditorStatusBar.module.css';

// 새벽 시간대 판별 (00:00~04:00)
function isDawn() {
  const h = new Date().getHours();
  return h >= 0 && h < 4;
}

export default function EditorStatusBar({ chapterId, wordCount, content, elapsed, running, sessionIdRef, initialWordCount }) {
  const energy = useGameStore((s) => s.player.energy);
  const energyLastRestAt = useGameStore((s) => s.player.energyLastRestAt);
  const rest = useGameStore((s) => s.rest);
  const drainEnergy = useGameStore((s) => s.drainEnergy);
  const gainExp = useGameStore((s) => s.gainExp);
  const updateQuestProgress = useGameStore((s) => s.updateQuestProgress);
  const quests = useGameStore((s) => s.quests);

  const [excludeSpaces, setExcludeSpaces] = useState(false);
  const [restCooldown, setRestCooldown] = useState(0);
  const lastExpWordCount = useRef(wordCount);
  const dawnChecked = useRef(false);

  // refs — interval 클로저가 최신 값을 읽되 deps로 등록하지 않기 위함
  const wordCountRef = useRef(wordCount);
  useEffect(() => { wordCountRef.current = wordCount; }, [wordCount]);

  // 세션 중 누적 글자수 추적 (daily_words 퀘스트용)
  const sessionWordsRef = useRef(0);
  // 오늘 이미 저장된 daily_words 진행도 (세션 시작 시점 기준)
  const dailyWordsBaseRef = useRef(
    quests.find((q) => q.id === 'daily_words')?.progress ?? 0
  );

  // 새벽 감성 퀘스트 감지 (진입 시각 기준)
  useEffect(() => {
    if (!dawnChecked.current && isDawn()) {
      dawnChecked.current = true;
      updateQuestProgress('daily_dawn', 1);
    }
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
  // deps 없음 — wordCountRef로 최신 값 읽어 interval 재시작 방지
  useEffect(() => {
    const id = setInterval(() => {
      const written = wordCountRef.current - lastExpWordCount.current;
      if (written > 0) {
        gainExp(written * 0.1);
        sessionWordsRef.current += written;
        lastExpWordCount.current = wordCountRef.current;
        // 오늘 글자수 = 이전 세션까지 저장된 진행도 + 이번 세션 추가분
        updateQuestProgress('daily_words', dailyWordsBaseRef.current + sessionWordsRef.current);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // 휴식 쿨다운 카운터
  useEffect(() => {
    const id = setInterval(() => {
      const lastRest = energyLastRestAt ? new Date(energyLastRestAt).getTime() : 0;
      const remaining = Math.max(0, 30 * 60 - Math.floor((Date.now() - lastRest) / 1000));
      setRestCooldown(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [energyLastRestAt]);

  // 공백 포함/제외 글자수 — content prop이 있을 때 정확하게 계산
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
      >
        {restCooldown > 0 ? `휴식 (${Math.ceil(restCooldown / 60)}분)` : '휴식'}
      </button>
    </footer>
  );
}
