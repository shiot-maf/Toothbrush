import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import MainPage from './pages/MainPage';
import EditorPage from './pages/EditorPage';
import OnboardingPage from './pages/OnboardingPage';

export default function App() {
  const player = useGameStore((s) => s.player);
  const checkMidnightReset = useGameStore((s) => s.checkMidnightReset);

  useEffect(() => { checkMidnightReset(); }, []);

  if (!player.onboarded) {
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
