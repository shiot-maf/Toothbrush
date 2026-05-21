import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGameStore } from './store/gameStore';
import MainPage from './pages/MainPage';
import EditorPage from './pages/EditorPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import styles from './App.module.css';

export default function App() {
  const { uid, loading } = useAuth();
  const onboarded = useGameStore((s) => s.player.onboarded);

  if (loading) {
    return (
      <div className={styles.splash}>
        <span className={styles.splashIcon}>✍️</span>
        <p className={styles.splashText}>불러오는 중…</p>
      </div>
    );
  }

  if (!uid) return <LoginPage />;

  if (!onboarded) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/editor/:chapterId" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
