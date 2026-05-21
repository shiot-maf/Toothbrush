import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import useTimer from '../../hooks/useTimer';
import styles from './EditorStatusBar.module.css';

export default function EditorStatusBar({ chapterId }) {
  const { elapsed, running, start, pause } = useTimer();
  const player = useGameStore((s) => s.player);
  const rest = useGameStore((s) => s.rest);
  const [wordCount, setWordCount] = useState(0);
  const [restCooldown, setRestCooldown] = useState(0);

  useEffect(() => { start(); return () => pause(); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setWordCount(window.__editorWordCount || 0);
      const lastRest = player.energyLastRestAt ? new Date(player.energyLastRestAt).getTime() : 0;
      const remaining = Math.max(0, 30 * 60 - Math.floor((Date.now() - lastRest) / 1000));
      setRestCooldown(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [player.energyLastRestAt]);

  function formatTime(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function formatCooldown(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  }

  function handleRest() { rest(); }

  return (
    <footer className={styles.bar}>
      <span className={styles.item}>✍️ {wordCount.toLocaleString()}자</span>
      <span className={styles.divider} />
      <span className={styles.item}>⏱️ {formatTime(elapsed)}</span>
      <span className={styles.divider} />
      <span className={styles.item}>⚡ 에너지 {player.energy}%</span>
      <button
        className={styles.restBtn}
        onClick={handleRest}
        disabled={restCooldown > 0}
        title={restCooldown > 0 ? `${formatCooldown(restCooldown)} 후 휴식 가능` : '휴식 (+30% 에너지)'}
      >
        {restCooldown > 0 ? `휴식 (${Math.ceil(restCooldown / 60)}분)` : '휴식'}
      </button>
    </footer>
  );
}
