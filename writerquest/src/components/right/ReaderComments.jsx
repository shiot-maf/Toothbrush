import { useGameStore } from '../../store/gameStore';
import styles from './ReaderComments.module.css';

export default function ReaderComments() {
  const comments = useGameStore((s) => s.comments);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>독자 메시지</h3>
      {comments.map((c) => (
        <div key={c.id} className={styles.card}>
          <div className={styles.avatarWrap}>
            <img
              src={`/assets/${c.avatar}`}
              alt={c.name}
              className={styles.avatar}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className={styles.avatarFallback}>{c.name[0]}</div>
          </div>
          <div className={styles.body}>
            <div className={styles.meta}>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.time}>{c.time}</span>
            </div>
            <p className={styles.message}>{c.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
