import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function onLevelUp(e) {
      add({ type: 'levelup', msg: `✨ Lv.${e.detail.level} 달성!` });
    }
    function onQuest(e) {
      add({ type: 'quest', msg: `✅ ${e.detail.title} 완료!` });
    }
    // P0-4: Firestore 저장 실패 경고
    function onError(e) {
      add({ type: 'error', msg: `⚠️ ${e.detail.message}` });
    }
    window.addEventListener('writerquest:levelup', onLevelUp);
    window.addEventListener('writerquest:quest', onQuest);
    window.addEventListener('writerquest:error', onError);
    return () => {
      window.removeEventListener('writerquest:levelup', onLevelUp);
      window.removeEventListener('writerquest:quest', onQuest);
      window.removeEventListener('writerquest:error', onError);
    };
  }, []);

  function add(toast) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
