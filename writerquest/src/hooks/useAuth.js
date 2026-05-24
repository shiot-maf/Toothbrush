import { useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useGameStore } from '../store/gameStore';

export function useAuth() {
  const initUser = useGameStore((s) => s.initUser);
  const clearUser = useGameStore((s) => s.clearUser);
  const uid = useGameStore((s) => s.uid);
  const loading = useGameStore((s) => s.loading);

  useEffect(() => {
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
    login: () => signInWithPopup(auth, googleProvider),
    logout: () => signOut(auth),
  };
}
