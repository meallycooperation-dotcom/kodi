import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clientStorage } from '../lib/clientStorage';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'kodi_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());
  const [hydrated, setHydrated] = useState(false);
  const handleSetTheme = useCallback((value: Theme) => {
    setTheme(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      const stored = await clientStorage.getString(STORAGE_KEY);

      if (!active) {
        return;
      }

      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      }

      setHydrated(true);
    };

    void loadTheme();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void clientStorage.setString(STORAGE_KEY, theme);
  }, [theme, hydrated]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
      toggleTheme
    }),
    [theme, handleSetTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
