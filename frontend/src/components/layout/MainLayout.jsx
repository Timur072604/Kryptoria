import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { useSidebar } from '../../hooks/useSidebar';
import { usePageTitle } from '../../contexts/PageTitleContext';

const MainLayout = () => {
  const { isSidebarCollapsed } = useSidebar();
  const { pageTitle } = usePageTitle();

  return (
    <div className="main-layout-container">
      <Sidebar />
      <div
        className={`main-content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        id="mainContentWrapper"
      >
        <MainHeader pageTitle={pageTitle} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;