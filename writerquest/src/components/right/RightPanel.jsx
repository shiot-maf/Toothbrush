import { useGameStore } from '../../store/gameStore';
import StatPanel from './StatPanel';
import ReaderComments from './ReaderComments';
import styles from './RightPanel.module.css';

export default function RightPanel() {
  const nickname = useGameStore((s) => s.player.nickname);
  const level = useGameStore((s) => s.player.level);
  const exp = useGameStore((s) => s.player.exp);
  const energy = useGameStore((s) => s.player.energy);
  const quests = useGameStore((s) => s.quests);

  const expNeeded = level * 1000;
  const expPct = Math.min(100, Math.round((exp / expNeeded) * 100));

  const energyColor = energy > 50
    ? 'var(--color-success)'
    : energy > 20
      ? 'var(--color-warning)'
      : 'var(--color-danger)';

  return (
    <aside className={styles.panel}>
      {/* Character */}
      <div className={styles.charSection}>
        <div className={styles.charEmoji}>✍️</div>
        <div className={styles.charInfo}>
          <span className={styles.charName}>{nickname} 작가</span>
          <span className={styles.charLevel}>Lv.{level}</span>
        </div>
      </div>

      {/* EXP */}
      <div className={styles.statRow}>
        <span className={styles.statLabel}>EXP</span>
        <div className={styles.bar}>
          <div className={styles.expFill} style={{ width: `${expPct}%` }} />
        </div>
        <span className={styles.statVal}>{exp}/{expNeeded}</span>
      </div>

      {/* Energy */}
      <div className={styles.statRow}>
        <span className={styles.statLabel}>⚡</span>
        <div className={styles.bar}>
          <div className={styles.energyFill} style={{ width: `${energy}%`, background: energyColor }} />
        </div>
        <span className={styles.statVal} style={{ color: energyColor }}>{Math.floor(energy)}%</span>
      </div>

      {/* Quests */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>오늘의 퀘스트</h3>
        {quests.filter((q) => !q.done || q.type === 'daily').slice(0, 4).map((q) => (
          <div key={q.id} className={`${styles.quest} ${q.done ? styles.questDone : ''}`}>
            <span className={styles.questCheck}>{q.done ? '✅' : '⬜'}</span>
            <span className={styles.questName}>{q.title}</span>
            <span className={styles.questProg}>{Math.min(q.progress, q.target)}/{q.target}</span>
          </div>
        ))}
      </div>

      <StatPanel />
      <ReaderComments />
    </aside>
  );
}
