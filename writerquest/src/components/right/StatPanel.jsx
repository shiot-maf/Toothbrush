import { useGameStore } from '../../store/gameStore';
import styles from './StatPanel.module.css';

const STAT_LABELS = {
  style: '문체력',
  imagination: '상상력',
  dialogue: '대화술',
  description: '묘사력',
  focus: '집중력',
};

const STAT_MAX = 200;

export default function StatPanel() {
  const stats = useGameStore((s) => s.player.stats);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>스탯</h3>
      {Object.entries(STAT_LABELS).map(([key, label]) => (
        <div key={key} className={styles.row}>
          <span className={styles.label}>{label}</span>
          <div className={styles.bar}>
            <div
              className={styles.fill}
              style={{ width: `${Math.min(100, Math.round((stats[key] / STAT_MAX) * 100))}%` }}
            />
          </div>
          <span className={styles.value}>{stats[key]}</span>
        </div>
      ))}
    </div>
  );
}
