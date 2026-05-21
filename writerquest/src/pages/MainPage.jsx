import { useState } from 'react';
import styles from './MainPage.module.css';
import LeftPanel from '../components/left/LeftPanel';
import CenterPanel from '../components/center/CenterPanel';
import RightPanel from '../components/right/RightPanel';
import BottomTabNav from '../components/common/BottomTabNav';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState('center');
  const [selected, setSelected] = useState(null); // { novelId, chapterId }

  function handleSelectChapter(novelId, chapterId) {
    setSelected((prev) =>
      prev?.chapterId === chapterId ? null : { novelId, chapterId }
    );
  }

  return (
    <div className={styles.root}>
      <main className={styles.layout}>
        <div className={`${styles.left} ${activeTab === 'novels' ? styles.tabVisible : ''}`}>
          <LeftPanel
            onSelectChapter={handleSelectChapter}
            selectedChapterId={selected?.chapterId}
          />
        </div>
        <div className={`${styles.center} ${activeTab === 'center' ? styles.tabVisible : ''}`}>
          <CenterPanel
            novelId={selected?.novelId}
            chapterId={selected?.chapterId}
            onClose={() => setSelected(null)}
          />
        </div>
        <div className={`${styles.right} ${activeTab === 'stats' ? styles.tabVisible : ''}`}>
          <RightPanel />
        </div>
      </main>
      <BottomTabNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
