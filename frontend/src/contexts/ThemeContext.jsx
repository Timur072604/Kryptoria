import React, { createContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialValueForLocalStorage = () => {
    const root = document.documentElement;
    if (root.classList.contains('theme-dark')) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useLocalStorage('theme', getInitialValueForLocalStorage());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};