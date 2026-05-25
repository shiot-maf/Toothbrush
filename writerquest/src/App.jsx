import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGameStore } from './store/gameStore';
import MainPage from './pages/MainPage';
import EditorPage from './pages/EditorPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import ToastContainer from './components/common/Toast';
import styles from './App.module.css';

const savedTheme = localStorage.getItem('writerquest_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

export default function App() {
  const { uid, loading } = useAuth();
  const onboarded = useGameStore((s) => s.player.onboarded);
  const loadError = useGameStore((s) => s.loadError);

  if (loading) {
    return (
      <div className={styles.splash}>
        <span className={styles.splashIcon}>✍️</span>
        <p className={styles.splashText}>불러오는 중…</p>
        {/* P2-6: 로딩 실패 시 재시도 버튼 */}
        {loadError && (
          <button
            className={styles.retryBtn}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (!uid) return <LoginPage />;

  // P2-2: 단일 BrowserRouter로 통합 (이전에는 onboarded 여부에 따라 두 개 분리됨)
  return (
    <BrowserRouter>
      <Routes>
        {!onboarded
          ? <Route path="*" element={<OnboardingPage />} />
          : (
            <>
              <Route path="/" element={<MainPage />} />
              <Route path="/editor/:chapterId" element={<EditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )
        }
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
