import { useGameStore } from '../../store/gameStore';
import StatPanel from './StatPanel';
import ReaderComments from './ReaderComments';
import styles from './RightPanel.module.css';

export default function RightPanel() {
  return (
    <aside className={styles.panel}>
      <StatPanel />
      <ReaderComments />
    </aside>
  );
}
