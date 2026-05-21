import { useEffect, useRef } from 'react';

export default function useAutoSave(value, onSave, delay = 30_000) {
  const savedValue = useRef(value);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (value !== savedValue.current) {
        savedValue.current = value;
        onSave(value);
      }
    }, delay);
    return () => clearTimeout(timer.current);
  }, [value, onSave, delay]);
}
