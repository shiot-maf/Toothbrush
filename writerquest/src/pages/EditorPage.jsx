import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import WritingEditor from '../components/editor/WritingEditor';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import useTimer from '../hooks/useTimer';
import { formatTime } from '../utils/formatTime';
import styles from './EditorPage.module.css';

export default function EditorPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const novels = useGameStore((s) => s.novels);
  const updateChapter = useGameStore((s) => s.updateChapterContent);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);

  const [wordCount, setWordCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ text: '저장됨', ok: true });
  const contentRef = useRef('');
  const sessionIdRef = useRef(null);
  const initialWordCount = useRef(0);
  const { elapsed, running, start, pause } = useTimer();

  // P4-2: IIFE → useMemo
  const { novel, chapter } = useMemo(() => {
    for (const n of novels) {
      const c = n.chapters.find((ch) => ch.id === chapterId);
      if (c) return { novel: n, chapter: c };
    }
    return { novel: null, chapter: null };
  }, [novels, chapterId]);

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
        {/* P1-2: saveStatus prop으로 실시간 저장 상태 표시 */}
        <span
          className={styles.saveStatus}
          style={{ color: saveStatus.ok ? 'var(--color-success)' : 'var(--color-text-sub)' }}
        >
          {saveStatus.text}
        </span>
        <button
          className={`${styles.focusBtn} ${focusMode ? styles.focusBtnActive : ''}`}
          onClick={() => setFocusMode((v) => !v)}
          title={focusMode ? 'ESC 또는 클릭으로 집중 모드 해제' : '집중 모드 켜기'}
          aria-label={focusMode ? '집중 모드 해제' : '집중 모드 켜기'}
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
        onSaveStatusChange={setSaveStatus}
      />

      <div className={focusMode ? styles.statusHidden : ''}>
        <EditorStatusBar
          chapterId={chapter.id}
          wordCount={wordCount}
          elapsed={elapsed}
          running={running}
        />
      </div>
    </div>
  );
}
