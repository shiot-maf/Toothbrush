import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import WritingEditor from '../components/editor/WritingEditor';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import useTimer from '../hooks/useTimer';
import styles from './EditorPage.module.css';

function formatTime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function EditorPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const novels = useGameStore((s) => s.novels);
  const updateChapter = useGameStore((s) => s.updateChapterContent);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);

  const [wordCount, setWordCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const contentRef = useRef('');
  const sessionIdRef = useRef(null);
  const initialWordCount = useRef(0);
  const { elapsed, running, start, pause } = useTimer();

  const { novel, chapter } = (() => {
    for (const n of novels) {
      const c = n.chapters.find((ch) => ch.id === chapterId);
      if (c) return { novel: n, chapter: c };
    }
    return { novel: null, chapter: null };
  })();

  useEffect(() => {
    if (!focusMode) return;
    function onKey(e) { if (e.key === 'Escape') setFocusMode(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode]);

  useEffect(() => {
    if (!chapter) return;

    initialWordCount.current = chapter.content?.length || 0;
    sessionIdRef.current = startSession(chapterId);
    start();

    function handleBeforeUnload() {
      updateChapter(novel.id, chapterId, contentRef.current);
      if (sessionIdRef.current) {
        const written = Math.max(0, contentRef.current.length - initialWordCount.current);
        endSession(sessionIdRef.current, written);
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      pause();
      if (sessionIdRef.current) {
        const written = Math.max(0, contentRef.current.length - initialWordCount.current);
        endSession(sessionIdRef.current, written);
        sessionIdRef.current = null;
      }
    };
  }, [chapter?.id]);

  if (!chapter) {
    return (
      <div className={styles.notFound}>
        <p>챕터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${focusMode ? styles.rootFocus : ''}`}>
      <header className={`${styles.header} ${focusMode ? styles.headerFocus : ''}`}>
        {!focusMode && (
          <button className={styles.back} onClick={() => navigate('/')}>← 뒤로</button>
        )}
        {!focusMode && (
          <span className={styles.breadcrumb}>
            {novel.emoji} {novel.title} &gt; {chapter.title}
          </span>
        )}
        <span className={styles.timer}>⏱️ {formatTime(elapsed)}</span>
        <span className={styles.saveStatus} id="save-status">저장됨</span>
        <button
          className={`${styles.focusBtn} ${focusMode ? styles.focusBtnActive : ''}`}
          onClick={() => setFocusMode((v) => !v)}
          title={focusMode ? 'ESC 또는 클릭으로 집중 모드 해제' : '집중 모드 켜기'}
        >
          🎯
        </button>
      </header>

      <WritingEditor
        novelId={novel.id}
        chapterId={chapter.id}
        initialContent={chapter.content}
        onWordCountChange={setWordCount}
        onContentChange={(text) => { contentRef.current = text; }}
      />

      <div className={focusMode ? styles.statusHidden : ''}>
        <EditorStatusBar
          chapterId={chapter.id}
          wordCount={wordCount}
          elapsed={elapsed}
          running={running}
          sessionIdRef={sessionIdRef}
          initialWordCount={initialWordCount}
        />
      </div>
    </div>
  );
}
