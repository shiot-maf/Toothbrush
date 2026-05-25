import { useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import styles from './LeftPanel.module.css';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const STATUS_ORDER = ['idea', 'draft', 'revising', 'done'];
const STATUS_ICONS = { idea: '🔵', draft: '✏️', revising: '🔄', done: '✅' };
const NOVEL_EMOJIS = ['🌙', '📖', '🌸', '⭐', '🔥', '💎', '🌊', '🌿', '🌹', '🎭', '🗡️', '🏰', '🌌', '🦋', '🌺'];

// P2-7: Escape 시 초안을 버리지 않고 저장
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
          // P2-7: Escape → 저장 후 닫기 (소실 방지)
          if (e.key === 'Escape') { onChange(draft); setEditing(false); }
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

function ChapterItem({ novel, chapter, onSelectChapter, selectedChapterId }) {
  const updateChapterMeta = useGameStore((s) => s.updateChapterMeta);
  const deleteChapter = useGameStore((s) => s.deleteChapter);
  const isSelected = chapter.id === selectedChapterId;
  // P1-5: 챕터 제목 인라인 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(chapter.title);
  // P1-4: window.confirm 대체 — 인라인 확인
  const [confirmDelete, setConfirmDelete] = useState(false);

  function cycleStatus(e) {
    e.stopPropagation();
    const idx = STATUS_ORDER.indexOf(chapter.status || 'draft');
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    updateChapterMeta(novel.id, chapter.id, { status: next });
  }

  const progress = chapter.wordGoal > 0
    ? Math.min(1, (chapter.wordCount || 0) / chapter.wordGoal)
    : null;

  function submitTitle() {
    const t = titleDraft.trim();
    if (t) updateChapterMeta(novel.id, chapter.id, { title: t });
    setEditingTitle(false);
  }

  return (
    <div className={`${styles.chapterItem} ${isSelected ? styles.chapterSelected : ''}`}>
      <div className={styles.chapterRow}>
        <button
          className={styles.statusIcon}
          onClick={cycleStatus}
          title="클릭하여 상태 변경"
          aria-label={`상태: ${STATUS_ICONS[chapter.status || 'draft']} — 클릭하여 변경`}
        >
          {STATUS_ICONS[chapter.status || 'draft']}
        </button>

        {/* P1-5: 더블클릭하여 제목 편집 */}
        {editingTitle ? (
          <input
            className={styles.titleInput}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            autoFocus
          />
        ) : (
          <span
            className={styles.chapterTitle}
            onDoubleClick={() => { setTitleDraft(chapter.title); setEditingTitle(true); }}
            title="더블클릭하여 제목 편집"
          >
            {chapter.title}
          </span>
        )}

        {progress !== null && (
          <div className={styles.progressWrap} title={`${chapter.wordCount || 0}/${chapter.wordGoal}자`}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        <button
          className={`${styles.writeBtn} ${isSelected ? styles.writeBtnActive : ''}`}
          onClick={() => onSelectChapter(novel.id, chapter.id)}
        >
          {isSelected ? '집필 중' : '집필'}
        </button>

        {/* P1-4: window.confirm 대체 */}
        {confirmDelete ? (
          <div className={styles.deleteConfirm}>
            <span>삭제?</span>
            <button
              className={styles.deleteConfirmYes}
              onClick={() => { deleteChapter(novel.id, chapter.id); setConfirmDelete(false); }}
            >
              예
            </button>
            <button
              className={styles.deleteConfirmNo}
              onClick={() => setConfirmDelete(false)}
            >
              취소
            </button>
          </div>
        ) : (
          <button
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            title="챕터 삭제 (휴지통으로 이동)"
            aria-label="챕터 삭제"
          >
            🗑
          </button>
        )}
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
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={styles.trashDrawer}>
      <div className={styles.trashHeader}>
        <span>🗑️ 휴지통</span>
        <div className={styles.trashActions}>
          {/* P1-4: window.confirm 대체 */}
          {trash.length > 0 && (
            confirmEmpty ? (
              <div className={styles.confirmBtns}>
                <span>전체 삭제?</span>
                <button className={styles.confirmYes} onClick={() => { emptyTrash(); setConfirmEmpty(false); }}>예</button>
                <button className={styles.confirmNo} onClick={() => setConfirmEmpty(false)}>취소</button>
              </div>
            ) : (
              <button
                className={styles.emptyBtn}
                onClick={() => setConfirmEmpty(true)}
              >
                전체 삭제
              </button>
            )
          )}
          <button className={styles.trashCloseBtn} onClick={onClose} aria-label="휴지통 닫기">✕</button>
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

function NovelItem({ novel, onSelectChapter, selectedChapterId }) {
  const [expanded, setExpanded] = useState(true);
  const addChapter = useGameStore((s) => s.addChapter);
  const removeNovel = useGameStore((s) => s.removeNovel);
  const updateNovel = useGameStore((s) => s.updateNovel);
  // P1-4: 챕터 추가 인라인 폼
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterFormTitle, setChapterFormTitle] = useState('');
  // P1-6: 소설 삭제 확인
  const [confirmDeleteNovel, setConfirmDeleteNovel] = useState(false);
  // P2-4: 이모지 피커
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  function handleAddChapter(e) {
    e.stopPropagation();
    setShowChapterForm(true);
    setChapterFormTitle('');
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submitChapterForm() {
    const idx = novel.chapters.length + 1;
    addChapter(novel.id, chapterFormTitle.trim() || `${idx}화. 제목`);
    setShowChapterForm(false);
    setChapterFormTitle('');
  }

  return (
    <div className={styles.novel}>
      <div className={styles.novelHeader} onClick={() => setExpanded((v) => !v)}>
        {/* P2-4: 이모지 클릭 시 피커 표시 */}
        <div className={styles.emojiPickerWrap} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.novelEmojiBtn}
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="이모지 변경"
            aria-label="소설 이모지 변경"
          >
            {novel.emoji}
          </button>
          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              {NOVEL_EMOJIS.map((em) => (
                <button
                  key={em}
                  className={styles.emojiOption}
                  onClick={() => { updateNovel(novel.id, { emoji: em }); setShowEmojiPicker(false); }}
                  aria-label={em}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.novelInfo}>
          <span className={styles.novelTitle}>{novel.title}</span>
          <span className={styles.novelMeta}>{novel.chapters.length}화</span>
        </div>
        <button className={styles.addChapterBtn} onClick={handleAddChapter} title="챕터 추가" aria-label="챕터 추가">+</button>
        {/* P1-6: 소설 삭제 버튼 */}
        <button
          className={styles.novelDeleteBtn}
          onClick={(e) => { e.stopPropagation(); setConfirmDeleteNovel(true); }}
          title="소설 삭제"
          aria-label="소설 삭제"
        >
          🗑
        </button>
        <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* P1-6: 소설 삭제 확인 */}
      {confirmDeleteNovel && (
        <div className={styles.novelDeleteConfirm}>
          <span>"{novel.title}" 소설을 삭제하시겠습니까?</span>
          <div className={styles.novelDeleteConfirmBtns}>
            <button onClick={() => { removeNovel(novel.id); setConfirmDeleteNovel(false); }}>삭제</button>
            <button onClick={() => setConfirmDeleteNovel(false)}>취소</button>
          </div>
        </div>
      )}

      {expanded && (
        <div className={styles.chapterList}>
          {/* P1-4: 챕터 추가 인라인 폼 */}
          {showChapterForm && (
            <div className={styles.inlineForm} style={{ margin: '4px' }}>
              <input
                ref={inputRef}
                className={styles.inlineInput}
                value={chapterFormTitle}
                onChange={(e) => setChapterFormTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitChapterForm();
                  if (e.key === 'Escape') setShowChapterForm(false);
                }}
                placeholder={`${novel.chapters.length + 1}화. 제목`}
              />
              <div className={styles.inlineFormBtns}>
                <button className={styles.inlineSubmit} onClick={submitChapterForm}>추가</button>
                <button className={styles.inlineCancel} onClick={() => setShowChapterForm(false)}>취소</button>
              </div>
            </div>
          )}
          {novel.chapters.length === 0 && !showChapterForm
            ? <p className={styles.chapterEmpty}>챕터가 없습니다</p>
            : novel.chapters.map((ch) => (
              <ChapterItem
                key={ch.id}
                novel={novel}
                chapter={ch}
                onSelectChapter={onSelectChapter}
                selectedChapterId={selectedChapterId}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function LeftPanel({ onSelectChapter, selectedChapterId }) {
  const nickname = useGameStore((s) => s.player.nickname);
  const level = useGameStore((s) => s.player.level);
  const streakDays = useGameStore((s) => s.player.streakDays);
  const lastWrittenDate = useGameStore((s) => s.player.lastWrittenDate);
  const novels = useGameStore((s) => s.novels);
  const addNovel = useGameStore((s) => s.addNovel);
  const trash = useGameStore((s) => s.trash);
  const [showTrash, setShowTrash] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  // P1-4: 소설 추가 인라인 폼
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelFormTitle, setNovelFormTitle] = useState('');

  const todayIdx = (new Date().getDay() + 6) % 7;
  // P1-3: 타임존 버그 수정 — 로컬 날짜 사용
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const activeStreak = lastWrittenDate === today ? streakDays : 0;

  function submitNovelForm() {
    if (novelFormTitle.trim()) {
      addNovel(novelFormTitle.trim());
      setShowNovelForm(false);
      setNovelFormTitle('');
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.nickname}>{nickname} 작가</span>
        <span className={styles.level}>Lv.{level}</span>
        <button
          className={styles.themeBtn}
          onClick={toggleTheme}
          title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
        {/* P4-3: aria-label 추가 */}
        <button
          className={styles.logoutBtn}
          onClick={() => signOut(auth)}
          title="로그아웃"
          aria-label="로그아웃"
        >
          ↩
        </button>
      </div>

      <div className={styles.streak}>
        {DAYS.map((d, i) => {
          const daysAgo = (todayIdx - i + 7) % 7;
          const filled = daysAgo < activeStreak;
          return (
            <div key={d} className={`${styles.dot} ${filled ? styles.dotDone : ''}`}>
              {d}
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>내 작품</span>
          {/* P1-4: window.prompt 대체 — 인라인 폼 토글 */}
          <button className={styles.addBtn} onClick={() => { setShowNovelForm((v) => !v); setNovelFormTitle(''); }}>
            + 작품
          </button>
        </div>

        {showNovelForm && (
          <div className={styles.inlineForm}>
            <input
              className={styles.inlineInput}
              value={novelFormTitle}
              onChange={(e) => setNovelFormTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNovelForm();
                if (e.key === 'Escape') setShowNovelForm(false);
              }}
              placeholder="소설 제목을 입력하세요"
              autoFocus
            />
            <div className={styles.inlineFormBtns}>
              <button className={styles.inlineSubmit} onClick={submitNovelForm}>추가</button>
              <button className={styles.inlineCancel} onClick={() => setShowNovelForm(false)}>취소</button>
            </div>
          </div>
        )}

        {novels.length === 0 && <p className={styles.empty}>작품이 없습니다</p>}
        {novels.map((novel) => (
          <NovelItem
            key={novel.id}
            novel={novel}
            onSelectChapter={onSelectChapter}
            selectedChapterId={selectedChapterId}
          />
        ))}
      </div>

      <button
        className={styles.trashBtn}
        onClick={() => setShowTrash((v) => !v)}
        aria-label={`휴지통 ${trash.length > 0 ? `(${trash.length}개)` : ''}`}
      >
        🗑️ 휴지통 {trash.length > 0 && `(${trash.length})`}
      </button>

      {showTrash && <TrashDrawer onClose={() => setShowTrash(false)} />}
    </aside>
  );
}
