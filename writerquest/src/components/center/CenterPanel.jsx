import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import useTimer from '../../hooks/useTimer';
import WritingEditor from '../editor/WritingEditor';
import EditorStatusBar from '../editor/EditorStatusBar';
import styles from './CenterPanel.module.css';

function formatTime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function CenterPanel({ novelId, chapterId, onClose }) {
  const novels = useGameStore((s) => s.novels);
  const [wordCount, setWordCount] = useState(0);
  const { elapsed, running, start, pause, reset } = useTimer();
  const sessionIdRef = useRef(null);

  const novel = novels.find((n) => n.id === novelId);
  const chapter = novel?.chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    if (chapterId) {
      reset();
      start();
    }
    return () => pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  if (!chapterId || !chapter) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>✍️</div>
          <p className={styles.emptyTitle}>오늘도 이야기를 써볼까요?</p>
          <p className={styles.emptySub}>
            왼쪽 패널에서 챕터를 선택하면<br />
            바로 여기서 집필할 수 있어요
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panelActive}>
      <div className={styles.editorHeader}>
        <span className={styles.editorBreadcrumb}>
          {novel.emoji} {novel.title}
          <span className={styles.sep}> › </span>
          {chapter.title}
        </span>
        <span className={styles.editorTimer}>{formatTime(elapsed)}</span>
        <span id="save-status" className={styles.saveStatus} />
        <button
          className={styles.closeBtn}
          onClick={() => { pause(); onClose(); }}
          title="닫기"
        >
          ✕
        </button>
      </div>
      <div className={styles.editorBody}>
        <WritingEditor
          key={chapterId}
          novelId={novelId}
          chapterId={chapterId}
          initialContent={chapter.content || ''}
          onWordCountChange={setWordCount}
        />
      </div>
      <EditorStatusBar
        chapterId={chapterId}
        wordCount={wordCount}
        elapsed={elapsed}
        running={running}
        sessionIdRef={sessionIdRef}
        initialWordCount={chapter.wordCount || 0}
      />
    </section>
  );
}
