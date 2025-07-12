import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../hooks/useSidebar';
import ConfirmationModal from '../common/ConfirmationModal';
import { useTranslation } from 'react-i18next';

const sidebarNavigationConfig = {
  main: {
    mainPath: '/',
    titleKey: 'sidebar_home',
    icon: '🏠',
    items: [
      {
        mainPath: '/ciphers/caesar',
        titleKey: 'sidebar_caesarCipher',
        icon: '📜',
        items: [
          { path: '/ciphers/caesar/visualizer', icon: '👁️‍🗨️', labelKey: 'sidebar_visualizer' },
          { path: '/ciphers/caesar/example', icon: '📖', labelKey: 'sidebar_example' },
          {
            mainPath: '/ciphers/caesar/tasks',
            titleKey: 'sidebar_tasks',
            icon: '🎯',
            items: [
              { path: '/ciphers/caesar/tasks/find-key', icon: '🔑', labelKey: 'sidebar_task_findKey' },
              { path: '/ciphers/caesar/tasks/decrypt-text', icon: '🔓', labelKey: 'sidebar_task_decryptText' },
              { path: '/ciphers/caesar/tasks/encrypt-text', icon: '🔒', labelKey: 'sidebar_task_encryptText' },
            ],
          },
        ],
      },
    ],
  },
  admin: {
    mainPath: '/admin',
    titleKey: 'sidebar_admin',
    icon: '🛡️',
    items: [
      { path: '/admin/users', icon: '👥', labelKey: 'sidebar_admin_users' },
    ],
  },
  userGuest: [
    { path: '/login', icon: '🔑', labelKey: 'sidebar_login' },
    { path: '/register', icon: '👤', labelKey: 'sidebar_register' },
  ],
};

const EXCLUDED_PATHS_FOR_MAIN_SUBITEMS = [
  '/profile',
  '/settings',
  '/admin',
];

const Sidebar = () => {
  const { t } = useTranslation();
  const { user, logout, isLoading: authIsLoading } = useAuth();
  const { isSidebarCollapsed } = useSidebar();
  const location = useLocation();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isOnExcludedPathForMainSubitems = EXCLUDED_PATHS_FOR_MAIN_SUBITEMS.some(excludedPath =>
    location.pathname.startsWith(excludedPath)
  );
  const shouldDisplayMainSubitems = !isOnExcludedPathForMainSubitems &&
                                    sidebarNavigationConfig.main.items &&
                                    sidebarNavigationConfig.main.items.length > 0;

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const shouldShowProfileEditSubmenu = location.pathname === '/profile' || location.pathname === '/profile/edit';
  const isAdmin = !authIsLoading && user && user.roles && Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN');

  const isPathOrSubpathActive = (itemPath, subItems) => {
    if (location.pathname === itemPath) return true;
    if (subItems && subItems.length > 0) {
      return subItems.some(subItem => isPathOrSubpathActive(subItem.path || subItem.mainPath, subItem.items || subItem.subItems));
    }
    return false;
  };

  const renderNavItemsRecursive = (items, parentPath = "", level = 1) => {
    return items.map(item => {
      const fullPath = item.path || item.mainPath;
      const isCurrentPathActive = location.pathname.startsWith(fullPath);

      let isBranchActive = false;
      if (item.items && item.items.length > 0) {
        isBranchActive = item.items.some(sub => location.pathname.startsWith(sub.path || sub.mainPath));
      } else if (item.subItems && item.subItems.length > 0) {
         isBranchActive = item.subItems.some(sub => location.pathname.startsWith(sub.path));
      }
      const isActiveOrParentOfActive = location.pathname === fullPath || isBranchActive;

      let NavLinkClass = "";
      if (isActiveOrParentOfActive && (item.items || item.subItems) && (item.items?.length > 0 || item.subItems?.length > 0) ) {
         NavLinkClass = level === 1 ? 'active-parent-link' : `active-parent-link-l${level}`;
      }

      let liClassName = "";
      if (level === 2) liClassName = "sidebar-submenu-item";
      else if (level === 3) liClassName = "sidebar-sub-submenu-item";
      else if (level === 4) liClassName = "sidebar-sub-sub-submenu-item";
      else if (level > 4) liClassName = `sidebar-sub-submenu-item-l${level}`;

      return (
        <React.Fragment key={fullPath}>
          <li className={liClassName}>
            <NavLink
              to={fullPath}
              end={item.end ?? (!(item.items && item.items.length > 0) && !(item.subItems && item.subItems.length > 0)) }
              className={NavLinkClass}
            >
              <span className="icon">{item.icon}</span>
              {!isSidebarCollapsed && t(item.titleKey || item.labelKey)}
            </NavLink>
          </li>
          {item.items && isCurrentPathActive && !isSidebarCollapsed && renderNavItemsRecursive(item.items, fullPath, level + 1)}
          {item.subItems && isCurrentPathActive && !isSidebarCollapsed && renderNavItemsRecursive(item.subItems, fullPath, level + 1)}
        </React.Fragment>
      );
    });
  };

  if (authIsLoading && !user) {
    return null;
  }

  const isMainSectionActive = isPathOrSubpathActive(
    sidebarNavigationConfig.main.mainPath,
    sidebarNavigationConfig.main.items
  );

  return (
    <>
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <h2>{t('appName')}</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink
                to={sidebarNavigationConfig.main.mainPath}
                className={isMainSectionActive && sidebarNavigationConfig.main.items && sidebarNavigationConfig.main.items.length > 0 ? "active-parent-link" : ""}
              >
                <span className="icon">{sidebarNavigationConfig.main.icon}</span>
                {!isSidebarCollapsed && t(sidebarNavigationConfig.main.titleKey)}
              </NavLink>
            </li>
            {shouldDisplayMainSubitems && isMainSectionActive && !isSidebarCollapsed &&
              renderNavItemsRecursive(sidebarNavigationConfig.main.items, sidebarNavigationConfig.main.mainPath, 2)
            }

            {isAdmin && sidebarNavigationConfig.admin && (
              <>
                <li className="sidebar-divider"></li>
                <li>
                  <NavLink
                    to={sidebarNavigationConfig.admin.mainPath}
                    className={location.pathname.startsWith(sidebarNavigationConfig.admin.mainPath) && sidebarNavigationConfig.admin.items && sidebarNavigationConfig.admin.items.length > 0 ? "active-parent-link" : ""}
                    end={!sidebarNavigationConfig.admin.items || sidebarNavigationConfig.admin.items.length === 0}
                  >
                    <span className="icon">{sidebarNavigationConfig.admin.icon}</span>
                    {!isSidebarCollapsed && t(sidebarNavigationConfig.admin.titleKey)}
                  </NavLink>
                </li>
                {sidebarNavigationConfig.admin.items && location.pathname.startsWith(sidebarNavigationConfig.admin.mainPath) && !isSidebarCollapsed &&
                  renderNavItemsRecursive(sidebarNavigationConfig.admin.items, sidebarNavigationConfig.admin.mainPath, 2)
                }
              </>
            )}

            <li className="sidebar-divider"></li>

            {user ? (
              <>
                <li className="sidebar-user-profile-item">
                  <NavLink
                    to="/profile"
                    className={location.pathname.startsWith('/profile') ? 'active-parent-link' : ''}
                  >
                    <span className="icon sidebar-user-icon">👤</span>
                    {!isSidebarCollapsed && <span className="sidebar-username">{user.username}</span>}
                  </NavLink>
                </li>
                {shouldShowProfileEditSubmenu && !isSidebarCollapsed && (
                  <li className="sidebar-submenu-item">
                    <NavLink to="/profile/edit" end>
                      <span className="icon">✏️</span>
                      {t('sidebar_profileEdit')}
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink to="/settings" end>
                    <span className="icon">⚙️</span>
                    {!isSidebarCollapsed && t('sidebar_settings')}
                  </NavLink>
                </li>

                <li>
                  <Link
                    to="#"
                    onClick={handleLogoutClick}
                    className={isLogoutModalOpen ? 'active-parent-link' : ''}
                  >
                    <span className="icon">🚪</span>
                    {!isSidebarCollapsed && t('sidebar_logout')}
                  </Link>
                </li>
              </>
            ) : (
              sidebarNavigationConfig.userGuest.map(item => (
                 <li key={item.path}>
                    <NavLink to={item.path} end={item.end ?? true}>
                        <span className="icon">{item.icon}</span>
                        {!isSidebarCollapsed && t(item.labelKey)}
                    </NavLink>
                 </li>
              ))
            )}
          </ul>
        </nav>
      </aside>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title={t('sidebar_confirmLogoutTitle')}
        confirmText={t('sidebar_btn_logout')}
        cancelText={t('common_cancel')}
        confirmButtonType="danger"
      >
        <p>{t('sidebar_confirmLogoutMessage')}</p>
      </ConfirmationModal>
    </>
  );
};

export default Sidebar;