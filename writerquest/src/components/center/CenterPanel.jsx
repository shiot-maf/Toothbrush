import { useGameStore } from '../../store/gameStore';
import useTimer from '../../hooks/useTimer';
import { useEffect, useState } from 'react';
import styles from './CenterPanel.module.css';

export default function CenterPanel({ focusMode = false, onFocusModeToggle }) {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);
  const { elapsed, running, start, pause } = useTimer();

  const expNeeded = player.level * 1000;
  const expPct = Math.min(100, Math.round((player.exp / expNeeded) * 100));

  function formatTime(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  return (
    <section className={styles.panel}>
      {/* Focus Mode Toggle */}
      <div className={styles.focusRow}>
        <button
          className={`${styles.focusBtn} ${focusMode ? styles.focusBtnActive : ''}`}
          onClick={onFocusModeToggle}
          title={focusMode ? '집중 모드 해제' : '집중 모드 켜기'}
        >
          {focusMode ? '✖ 집중 해제' : '🎯 집중 모드'}
        </button>
      </div>

      {/* Character */}
      <div className={styles.characterArea}>
        <div className={styles.characterWrap}>
          <img
            src={running ? '/assets/character_writing.png' : '/assets/character_idle.png'}
            alt="캐릭터"
            className={styles.character}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className={styles.characterFallback}>{running ? '✍️' : '💭'}</div>
        </div>
        {!running && <div className={styles.speechBubble}>...</div>}
      </div>

      {/* Timer */}
      <div className={styles.timerArea}>
        <div className={styles.timer}>{formatTime(elapsed)}</div>
        <button
          className={`${styles.timerBtn} ${running ? styles.timerBtnActive : ''}`}
          onClick={running ? pause : start}
        >
          {running ? '⏸ 일시정지' : '▶ 집필 시작'}
        </button>
      </div>

      {/* EXP Bar */}
      <div className={styles.expRow}>
        <span className={styles.expLabel}>Lv.{player.level}</span>
        <div className={styles.expBar}>
          <div className={styles.expFill} style={{ width: `${expPct}%` }} />
        </div>
        <span className={styles.expLabel}>{player.exp} / {expNeeded}</span>
      </div>

      {/* Energy */}
      <div className={styles.energyRow}>
        <span>⚡ 에너지</span>
        <div className={styles.energyBar}>
          <div
            className={styles.energyFill}
            style={{
              width: `${player.energy}%`,
              background: player.energy > 50 ? 'var(--color-success)' : player.energy > 20 ? 'var(--color-warning)' : 'var(--color-danger)',
            }}
          />
        </div>
        <span>{player.energy}%</span>
      </div>

      {/* Quests */}
      <div className={styles.questSection}>
        <h3 className={styles.questTitle}>오늘의 퀘스트</h3>
        {quests.filter((q) => !q.done || q.type === 'daily').slice(0, 4).map((q) => (
          <div key={q.id} className={`${styles.quest} ${q.done ? styles.questDone : ''}`}>
            <span className={styles.questCheck}>{q.done ? '✅' : '⬜'}</span>
            <span className={styles.questName}>{q.title}</span>
            <span className={styles.questProgress}>{Math.min(q.progress, q.target)}/{q.target}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
