import { useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useGameStore } from '../store/gameStore';

async function loginWithGoogle() {
  // 팝업 시도 → 차단 시 redirect로 폴백
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-cancelled-by-browser') {
      return signInWithRedirect(auth, googleProvider);
    }
    throw e;
  }
}

export function useAuth() {
  const initUser = useGameStore((s) => s.initUser);
  const clearUser = useGameStore((s) => s.clearUser);
  const uid = useGameStore((s) => s.uid);
  const loading = useGameStore((s) => s.loading);

  useEffect(() => {
    // redirect 방식 폴백 결과 처리
    getRedirectResult(auth).then((result) => {
      if (result?.user) initUser(result.user.uid);
    }).catch(() => {});

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        initUser(user.uid);
      } else {
        clearUser();
      }
    });
    return unsub;
  }, []);

  return {
    uid,
    loading,
    user: auth.currentUser,
    login: loginWithGoogle,
    logout: () => signOut(auth),
  };
}
