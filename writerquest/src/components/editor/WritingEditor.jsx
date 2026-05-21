import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import useAutoSave from '../../hooks/useAutoSave';
import styles from './WritingEditor.module.css';

export default function WritingEditor({ novelId, chapterId, initialContent, onWordCountChange, onContentChange }) {
  const [content, setContent] = useState(initialContent || '');
  const updateChapter = useGameStore((s) => s.updateChapterContent);
  const textareaRef = useRef(null);
  const isComposing = useRef(false);
  const cursorAfterTab = useRef(null);

  const save = useCallback((text) => {
    updateChapter(novelId, chapterId, text);
    const el = document.getElementById('save-status');
    if (el) { el.textContent = '저장됨'; el.style.color = 'var(--color-success)'; }
  }, [novelId, chapterId, updateChapter]);

  useAutoSave(content, save, 2_000);

  function handleChange(e) {
    const text = e.target.value;
    setContent(text);
    onContentChange?.(text);

    const el = document.getElementById('save-status');
    if (el) { el.textContent = '저장 중…'; el.style.color = 'var(--color-text-sub)'; }

    // 한국어 IME 조합 중에는 카운트/EXP 갱신 보류
    if (!isComposing.current) {
      onWordCountChange?.(text.length);
    }
  }

  function handleCompositionStart() {
    isComposing.current = true;
  }

  function handleCompositionEnd(e) {
    isComposing.current = false;
    // 조합 완료 후 최종 카운트 반영
    onWordCountChange?.(e.target.value.length);
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const { selectionStart, selectionEnd, value } = ta;
      const indent = '  '; // 공백 2칸
      const newValue = value.slice(0, selectionStart) + indent + value.slice(selectionEnd);
      setContent(newValue);
      onContentChange?.(newValue);
      cursorAfterTab.current = selectionStart + indent.length;
    }
  }

  // Tab 삽입 후 커서 위치 복원
  useEffect(() => {
    if (cursorAfterTab.current !== null) {
      const ta = textareaRef.current;
      ta.selectionStart = cursorAfterTab.current;
      ta.selectionEnd = cursorAfterTab.current;
      cursorAfterTab.current = null;
    }
  }, [content]);

  useEffect(() => {
    textareaRef.current?.focus();
    const initial = initialContent?.length || 0;
    onWordCountChange?.(initial);
    onContentChange?.(initialContent || '');
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className={styles.textarea}
      value={content}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder="여기서부터 이야기를 시작하세요..."
      spellCheck={false}
    />
  );
}
