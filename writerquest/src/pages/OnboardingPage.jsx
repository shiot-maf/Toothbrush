import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import styles from './OnboardingPage.module.css';

const STEPS = ['nickname', 'novel', 'start'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [novelTitle, setNovelTitle] = useState('');
  const [animating, setAnimating] = useState(false);

  function next() {
    if (step === 0 && !nickname.trim()) return;
    if (step === STEPS.length - 1) {
      completeOnboarding(nickname, novelTitle);
      navigate('/');
      return;
    }
    setAnimating(true);
    setTimeout(() => { setStep((s) => s + 1); setAnimating(false); }, 300);
  }

  return (
    <div className={styles.root}>
      <div className={`${styles.card} ${animating ? styles.fadeOut : styles.fadeIn}`}>
        {step === 0 && (
          <>
            <div className={styles.emoji}>✍️</div>
            <h1 className={styles.title}>작가님의 이름은<br/>무엇인가요?</h1>
            <input
              className={styles.input}
              type="text"
              placeholder="닉네임 입력 (최대 10자)"
              maxLength={10}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              autoFocus
            />
          </>
        )}
        {step === 1 && (
          <>
            <div className={styles.emoji}>📖</div>
            <h1 className={styles.title}>첫 소설 제목을<br/>알려주세요</h1>
            <input
              className={styles.input}
              type="text"
              placeholder="나의 첫 이야기 (스킵 가능)"
              maxLength={30}
              value={novelTitle}
              onChange={(e) => setNovelTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              autoFocus
            />
          </>
        )}
        {step === 2 && (
          <>
            <div className={styles.characterWrap}>
              <img
                src="/assets/character_happy.svg"
                alt="캐릭터"
                className={styles.character}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {/* 에셋 없을 때 fallback */}
              <div className={styles.characterFallback}>🎉</div>
            </div>
            <h1 className={styles.title}>작가 여정을<br/>시작합니다!</h1>
            <p className={styles.sub}>{nickname} 작가님, 환영해요.</p>
          </>
        )}

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} />
          ))}
        </div>

        <button
          className={styles.btn}
          onClick={next}
          disabled={step === 0 && !nickname.trim()}
        >
          {step === STEPS.length - 1 ? '시작하기 🚀' : '다음'}
        </button>
        {step === 1 && (
          <button
            className={styles.skipBtn}
            onClick={() => {
              setNovelTitle('나의 첫 이야기');
              setAnimating(true);
              setTimeout(() => { setStep((s) => s + 1); setAnimating(false); }, 300);
            }}
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
