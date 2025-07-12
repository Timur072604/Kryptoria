import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useTheme } from './hooks/useTheme';
import { useTranslation } from 'react-i18next';

function App() {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language.split('-')[0];
    
    const handleLanguageChange = (lng) => {
      document.documentElement.lang = lng || i18n.language.split('-')[0];
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, i18n.language, i18n.resolvedLanguage]);


  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;