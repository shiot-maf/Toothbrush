import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const pause = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    pause();
    setElapsed(0);
  }, [pause]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { elapsed, running, start, pause, reset };
}
