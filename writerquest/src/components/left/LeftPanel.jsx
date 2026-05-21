import { useGameStore } from '../../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './LeftPanel.module.css';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function LeftPanel() {
  const { player, novels, addNovel } = useGameStore((s) => ({
    player: s.player, novels: s.novels, addNovel: s.addNovel,
  }));
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const todayIdx = (new Date().getDay() + 6) % 7;

  function handleAddNovel() {
    const title = prompt('새 소설 제목을 입력하세요:');
    if (title?.trim()) addNovel(title.trim());
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.nickname}>{player.nickname} 작가</span>
        <span className={styles.level}>Lv.{player.level}</span>
        <button className={styles.logoutBtn} onClick={logout} title="로그아웃">↩</button>
      </div>

      <div className={styles.streak}>
        {DAYS.map((d, i) => (
          <div key={d} className={`${styles.dot} ${i <= todayIdx ? styles.dotDone : ''}`}>
            {d}
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>내 작품</span>
          <button className={styles.addBtn} onClick={handleAddNovel}>+</button>
        </div>
        {novels.length === 0 && <p className={styles.empty}>작품이 없습니다</p>}
        {novels.map((novel) => (
          <div key={novel.id} className={styles.novel}>
            <span className={styles.novelEmoji}>{novel.emoji}</span>
            <div className={styles.novelInfo}>
              <span className={styles.novelTitle}>{novel.title}</span>
              <span className={styles.novelMeta}>{novel.chapters.length}화</span>
            </div>
            <button
              className={styles.writeBtn}
              onClick={() => navigate(`/editor/${novel.chapters[novel.chapters.length - 1].id}`)}
            >
              집필
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
