import styles from './BottomTabNav.module.css';

const TABS = [
  { id: 'novels', label: '작품', icon: '📚' },
  { id: 'center', label: '메인', icon: '🏠' },
  { id: 'stats', label: '스탯', icon: '📊' },
];

export default function BottomTabNav({ active, onChange }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${active === tab.id ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
