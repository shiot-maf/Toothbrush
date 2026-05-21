import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import useAutoSave from '../../hooks/useAutoSave';
import styles from './WritingEditor.module.css';

export default function WritingEditor({ novelId, chapterId, initialContent }) {
  const [content, setContent] = useState(initialContent || '');
  const updateChapter = useGameStore((s) => s.updateChapterContent);
  const textareaRef = useRef(null);

  const save = useCallback((text) => {
    updateChapter(novelId, chapterId, text);
    const el = document.getElementById('save-status');
    if (el) { el.textContent = '저장됨'; el.style.color = 'var(--color-success)'; }
  }, [novelId, chapterId, updateChapter]);

  useAutoSave(content, save, 30_000);

  function onChange(e) {
    const text = e.target.value;
    setContent(text);
    const el = document.getElementById('save-status');
    if (el) { el.textContent = '저장 중…'; el.style.color = 'var(--color-text-sub)'; }
    window.__editorWordCount = text.length;
  }

  useEffect(() => {
    textareaRef.current?.focus();
    window.__editorWordCount = initialContent?.length || 0;
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className={styles.textarea}
      value={content}
      onChange={onChange}
      placeholder="여기서부터 이야기를 시작하세요..."
      spellCheck={false}
    />
  );
}
