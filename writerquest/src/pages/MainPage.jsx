import styles from './MainPage.module.css';
import LeftPanel from '../components/left/LeftPanel';
import CenterPanel from '../components/center/CenterPanel';
import RightPanel from '../components/right/RightPanel';
import BottomTabNav from '../components/common/BottomTabNav';
import { useState } from 'react';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState('center');
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className={styles.root}>
      <main className={`${styles.layout} ${focusMode ? styles.layoutFocus : ''}`}>
        <div className={`${styles.left} ${activeTab === 'novels' ? styles.tabVisible : ''} ${focusMode ? styles.panelHidden : ''}`}>
          <LeftPanel />
        </div>
        <div className={`${styles.center} ${activeTab === 'center' ? styles.tabVisible : ''}`}>
          <CenterPanel focusMode={focusMode} onFocusModeToggle={() => setFocusMode((v) => !v)} />
        </div>
        <div className={`${styles.right} ${activeTab === 'stats' ? styles.tabVisible : ''} ${focusMode ? styles.panelHidden : ''}`}>
          <RightPanel />
        </div>
      </main>
      <BottomTabNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
