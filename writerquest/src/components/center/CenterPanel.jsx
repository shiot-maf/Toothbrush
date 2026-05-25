import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import useTimer from '../../hooks/useTimer';
import WritingEditor from '../editor/WritingEditor';
import EditorStatusBar from '../editor/EditorStatusBar';
import { formatTime } from '../../utils/formatTime';
import styles from './CenterPanel.module.css';

export default function CenterPanel({ novelId, chapterId, onClose }) {
  const novels = useGameStore((s) => s.novels);
  const updateChapter = useGameStore((s) => s.updateChapterContent);
  const startSession = useGameStore((s) => s.startSession);
  const endSession = useGameStore((s) => s.endSession);
  const [wordCount, setWordCount] = useState(0);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState({ text: '', ok: true });
  const { elapsed, running, start, pause, reset } = useTimer();
  const sessionIdRef = useRef(null);
  // P2-3: contentRef로 beforeunload 핸들러가 content state에 의존하지 않도록 함
  const contentRef = useRef('');
  // P1-1: 세션 시작 시 초기 글자수 기록 (streak 계산용)
  const initialWordCountRef = useRef(0);

  const novel = novels.find((n) => n.id === novelId);
  const chapter = novel?.chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    if (chapterId && chapter) {
      reset();
      start();
      const initialContent = chapter.content || '';
      contentRef.current = initialContent;
      setContent(initialContent);
      initialWordCountRef.current = initialContent.length;
      // P1-1: 챕터 진입 시 세션 시작 → streak 업데이트를 위해 endSession 필수
      sessionIdRef.current = startSession(chapterId);
    }
    return () => {
      pause();
      // P1-1: 챕터 이탈 시 세션 종료
      if (sessionIdRef.current) {
        const written = Math.max(0, contentRef.current.length - initialWordCountRef.current);
        endSession(sessionIdRef.current, written);
        sessionIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // P2-3: contentRef 패턴 — content 변경마다 리스너 재등록하지 않음
  useEffect(() => {
    if (!chapterId) return;
    function handleUnload() {
      updateChapter(novelId, chapterId, contentRef.current);
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [chapterId, novelId, updateChapter]);

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
        <span
          className={styles.saveStatus}
          style={{ color: saveStatus.ok ? 'var(--color-success)' : 'var(--color-text-sub)' }}
        >
          {saveStatus.text}
        </span>
        <button
          className={styles.closeBtn}
          onClick={() => { pause(); onClose(); }}
          title="닫기"
          aria-label="에디터 닫기"
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
          onContentChange={(text) => { contentRef.current = text; setContent(text); }}
          onSaveStatusChange={setSaveStatus}
        />
      </div>
      <EditorStatusBar
        chapterId={chapterId}
        wordCount={wordCount}
        content={content}
        elapsed={elapsed}
        running={running}
      />
    </section>
  );
}
