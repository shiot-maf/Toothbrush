import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch (e) {
      const msgs = {
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다. 다시 시도해 주세요.',
        'auth/popup-blocked': '팝업이 차단됐습니다. 브라우저 설정에서 팝업을 허용해 주세요.',
        'auth/unauthorized-domain': '이 도메인은 Firebase 인증이 허용되지 않습니다. 콘솔에서 도메인을 추가해 주세요.',
        'auth/network-request-failed': '네트워크 오류입니다. 인터넷 연결을 확인해 주세요.',
        'auth/cancelled-popup-request': null, // 사용자가 취소한 것 — 에러 표시 안 함
      };
      const msg = msgs[e.code];
      if (msg !== null) setError(msg ?? `로그인 실패 (${e.code})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.icon}>✍️</div>
        <h1 className={styles.title}>WriterQuest</h1>
        <p className={styles.sub}>작가 여정을 시작하세요</p>

        <button className={styles.googleBtn} onClick={handleLogin} disabled={loading}>
          <GoogleIcon />
          {loading ? '로그인 중…' : 'Google로 시작하기'}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.note}>
          로그인하면 모든 기기에서 데이터가 동기화됩니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.13 17.64 11.82 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
