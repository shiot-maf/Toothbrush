import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('writerquest_theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('writerquest_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}
