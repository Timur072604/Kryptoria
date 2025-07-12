import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { addNotification } = useNotification();

  const handleThemeChange = (event) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
    const themeName = newTheme === 'light' ? t('settingsPage_themeLight') : t('settingsPage_themeDark');
    addNotification({ key: 'notification_themeChanged', params: { themeName } }, 'info', 2000);
  };

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    const languageName = newLang === 'ru' ? t('settingsPage_languageOptionRussian') : t('settingsPage_languageOptionEnglish');
    addNotification({ key: 'notification_languageChanged', params: { languageName } }, 'info', 2000);
  };

  return (
    <div className="settings-layout-horizontal">
      <div className="content-card settings-card" aria-labelledby="appearance-settings-title">
        <div className="content-card-header">
          <h2 id="appearance-settings-title">
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">🎨</span>
            {t('settingsPage_appearanceTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <div className="form-group">
            <label htmlFor="theme-select">{t('settingsPage_themeLabel')}</label>
            <select
              id="theme-select"
              name="theme"
              value={theme}
              onChange={handleThemeChange}
            >
              <option value="light">{t('settingsPage_themeLight')}</option>
              <option value="dark">{t('settingsPage_themeDark')}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="language-select">{t('settingsPage_languageControlLabel')}</label>
            <select
              id="language-select"
              name="language"
              value={i18n.resolvedLanguage}
              onChange={handleLanguageChange}
            >
              <option value="ru">{t('settingsPage_languageOptionRussian')}</option>
              <option value="en">{t('settingsPage_languageOptionEnglish')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="content-card settings-card" aria-labelledby="general-app-settings-title">
        <div className="content-card-header">
          <h2 id="general-app-settings-title">
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">🛠️</span>
            {t('settingsPage_generalTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <p>{t('settingsPage_generalDescription')}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;