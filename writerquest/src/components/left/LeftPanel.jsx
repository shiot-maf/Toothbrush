import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './LeftPanel.module.css';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const STATUS_ORDER = ['idea', 'draft', 'revising', 'done'];
const STATUS_ICONS = { idea: '🔵', draft: '✏️', revising: '🔄', done: '✅' };

function SynopsisField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  if (editing) {
    return (
      <textarea
        className={styles.synopsisInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onChange(draft);
            setEditing(false);
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        autoFocus
        rows={2}
      />
    );
  }

  return (
    <span
      className={styles.synopsis}
      onClick={() => { setDraft(value || ''); setEditing(true); }}
      title="클릭하여 시놉시스 편집"
    >
      {value || '시놉시스 추가...'}
    </span>
  );
}

function ChapterItem({ novel, chapter, navigate }) {
  const updateChapterMeta = useGameStore((s) => s.updateChapterMeta);
  const deleteChapter = useGameStore((s) => s.deleteChapter);

  function cycleStatus(e) {
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(chapter.status || 'draft');
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    updateChapterMeta(novel.id, chapter.id, { status: next });
  }

  const progress = chapter.wordGoal > 0
    ? Math.min(1, (chapter.wordCount || 0) / chapter.wordGoal)
    : null;

  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`"${chapter.title}"을 삭제하시겠습니까?\n(30일 후 자동 삭제됩니다)`)) {
      deleteChapter(novel.id, chapter.id);
    }
  }

  return (
    <div className={styles.chapterItem}>
      <div className={styles.chapterRow}>
        <button
          className={styles.statusIcon}
          onClick={cycleStatus}
          title="클릭하여 상태 변경"
        >
          {STATUS_ICONS[chapter.status || 'draft']}
        </button>
        <span className={styles.chapterTitle}>{chapter.title}</span>
        {progress !== null && (
          <div className={styles.progressWrap} title={`${chapter.wordCount || 0}/${chapter.wordGoal}자`}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        <button
          className={styles.writeBtn}
          onClick={() => navigate(`/editor/${chapter.id}`)}
        >
          집필
        </button>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="챕터 삭제 (휴지통으로 이동)"
        >
          🗑
        </button>
      </div>
      <SynopsisField
        value={chapter.synopsis}
        onChange={(val) => updateChapterMeta(novel.id, chapter.id, { synopsis: val })}
      />
    </div>
  );
}

function TrashDrawer({ onClose }) {
  const trash = useGameStore((s) => s.trash);
  const restoreChapter = useGameStore((s) => s.restoreChapter);
  const emptyTrash = useGameStore((s) => s.emptyTrash);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={styles.trashDrawer}>
      <div className={styles.trashHeader}>
        <span>🗑️ 휴지통</span>
        <div className={styles.trashActions}>
          {trash.length > 0 && (
            <button
              className={styles.emptyBtn}
              onClick={() => { if (window.confirm('휴지통을 비우시겠습니까?')) emptyTrash(); }}
            >
              전체 삭제
            </button>
          )}
          <button className={styles.trashCloseBtn} onClick={onClose}>✕</button>
        </div>
      </div>
      {trash.length === 0
        ? <p className={styles.trashEmpty}>휴지통이 비어 있습니다</p>
        : trash.map((item) => (
          <div key={item.id} className={styles.trashItem}>
            <div className={styles.trashItemInfo}>
              <span className={styles.trashChapterTitle}>{item.chapter.title}</span>
              <span className={styles.trashMeta}>{item.novelTitle} · {formatDate(item.deletedAt)} 삭제</span>
            </div>
            <button
              className={styles.restoreBtn}
              onClick={() => restoreChapter(item.id)}
            >
              복원
            </button>
          </div>
        ))
      }
    </div>
  );
}

function NovelItem({ novel, navigate }) {
  const [expanded, setExpanded] = useState(true);
  const addChapter = useGameStore((s) => s.addChapter);

  function handleAddChapter(e) {
    e.stopPropagation();
    const idx = novel.chapters.length + 1;
    const title = prompt(`새 챕터 제목을 입력하세요 (기본: "${idx}화. 제목"):`);
    if (title === null) return;
    addChapter(novel.id, title.trim() || `${idx}화. 제목`);
    setExpanded(true);
  }

  return (
    <div className={styles.novel}>
      <div className={styles.novelHeader} onClick={() => setExpanded((v) => !v)}>
        <span className={styles.novelEmoji}>{novel.emoji}</span>
        <div className={styles.novelInfo}>
          <span className={styles.novelTitle}>{novel.title}</span>
          <span className={styles.novelMeta}>{novel.chapters.length}화</span>
        </div>
        <button className={styles.addChapterBtn} onClick={handleAddChapter} title="챕터 추가">+</button>
        <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className={styles.chapterList}>
          {novel.chapters.length === 0
            ? <p className={styles.chapterEmpty}>챕터가 없습니다</p>
            : novel.chapters.map((ch) => (
              <ChapterItem key={ch.id} novel={novel} chapter={ch} navigate={navigate} />
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function LeftPanel() {
  const player = useGameStore((s) => s.player);
  const novels = useGameStore((s) => s.novels);
  const addNovel = useGameStore((s) => s.addNovel);
  const trash = useGameStore((s) => s.trash);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showTrash, setShowTrash] = useState(false);

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
          <button className={styles.addBtn} onClick={handleAddNovel}>+ 작품</button>
        </div>
        {novels.length === 0 && <p className={styles.empty}>작품이 없습니다</p>}
        {novels.map((novel) => (
          <NovelItem key={novel.id} novel={novel} navigate={navigate} />
        ))}
      </div>

      <button
        className={styles.trashBtn}
        onClick={() => setShowTrash((v) => !v)}
      >
        🗑️ 휴지통 {trash.length > 0 && `(${trash.length})`}
      </button>

      {showTrash && <TrashDrawer onClose={() => setShowTrash(false)} />}
    </aside>
  );
}
