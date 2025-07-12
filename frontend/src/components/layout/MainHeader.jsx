import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { usePageTitle } from '../../contexts/PageTitleContext';
import { useTranslation } from 'react-i18next';

const MainHeader = () => {
  const { t } = useTranslation();
  const { toggleSidebar, isSidebarCollapsed } = useSidebar();
  const { pageTitle, pageEmoji } = usePageTitle();

  return (
    <header className="main-header">
      <button
        id="menu-toggle"
        className="menu-toggle-button"
        aria-label={t('sidebar_menuToggle_aria')}
        aria-expanded={!isSidebarCollapsed}
        onClick={toggleSidebar}
      >
        ☰
      </button>
      <h1>
        {pageEmoji && <span role="img" aria-label="page emoji" className="icon-mr-0_5em">{pageEmoji}</span>}
        {pageTitle}
      </h1>
    </header>
  );
};

export default MainHeader;