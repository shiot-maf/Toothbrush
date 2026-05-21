import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import WritingEditor from '../components/editor/WritingEditor';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import styles from './EditorPage.module.css';

export default function EditorPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const novels = useGameStore((s) => s.novels);

  const { novel, chapter } = (() => {
    for (const n of novels) {
      const c = n.chapters.find((ch) => ch.id === chapterId);
      if (c) return { novel: n, chapter: c };
    }
    return { novel: null, chapter: null };
  })();

  if (!chapter) {
    return (
      <div className={styles.notFound}>
        <p>챕터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>← 뒤로</button>
        <span className={styles.breadcrumb}>
          {novel.emoji} {novel.title} &gt; {chapter.title}
        </span>
        <span className={styles.saveStatus} id="save-status">저장됨</span>
      </header>

      <WritingEditor novelId={novel.id} chapterId={chapter.id} initialContent={chapter.content} />

      <EditorStatusBar chapterId={chapter.id} />
    </div>
  );
}
