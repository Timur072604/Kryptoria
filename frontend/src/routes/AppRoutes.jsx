import React, { useLayoutEffect } from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/core/ProtectedRoute';
import { usePageTitle } from '../contexts/PageTitleContext';

import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProfilePage from '../pages/user/ProfilePage';
import ProfileEditPage from '../pages/user/ProfileEditPage';
import SettingsPage from '../pages/user/SettingsPage';
import CipherInfoPage from '../pages/cipher/CipherInfoPage';
import CaesarExamplePage from '../pages/cipher/caesar/CaesarExamplePage';
import CaesarTasksOverviewPage from '../pages/cipher/caesar/CaesarTasksOverviewPage';
import CaesarTaskPage from '../pages/cipher/caesar/CaesarTaskPage';
import CaesarVisualizerPage from '../pages/cipher/caesar/CaesarVisualizerPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUserListPage from '../pages/admin/AdminUserListPage';

const ROUTE_EMOJIS = {
  '/ciphers/caesar/tasks/find-key': '🔑',
  '/ciphers/caesar/tasks/decrypt-text': '🔓',
  '/ciphers/caesar/tasks/encrypt-text': '🔒',
  '/ciphers/caesar/visualizer': '👁️‍🗨️',
  '/ciphers/caesar/example': '📖',
  '/ciphers/caesar/tasks': '🎯',
  '/ciphers/caesar': '📜',
  '/profile/edit': '✏️',
  '/profile': '👤',
  '/settings': '⚙️',
  '/admin/users': '👥',
  '/admin': '🛡️',
  '/login': '🔑',
  '/register': '👤',
  '/forgot-password': '❓',
  '/reset-password': '🔑',
  '/': '🏠',
};

const PageContextSetter = ({ titleKey, titleParams, emoji: directEmoji, emojiKey, children }) => {
  const { setPageTitle, setPageEmoji } = usePageTitle();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  useLayoutEffect(() => {
    const appBaseTitle = t('appName', 'Kryptoria');
    let pageSpecificTitle = '';

    if (titleKey) {
      pageSpecificTitle = t(titleKey, titleParams);
    }
    
    let finalDocumentTitle;
    let finalPageContextTitle;

    if (pageSpecificTitle &&
        typeof pageSpecificTitle === 'string' &&
        pageSpecificTitle.trim() !== '' &&
        pageSpecificTitle !== titleKey) {
      finalDocumentTitle = pageSpecificTitle;
      finalPageContextTitle = pageSpecificTitle;
    } else {
      finalDocumentTitle = appBaseTitle;
      finalPageContextTitle = appBaseTitle;
      if (titleKey && pageSpecificTitle === titleKey) {
        console.warn(`PageContextSetter: Translation for title key '${titleKey}' not found. Using default app title "${appBaseTitle}".`);
      }
    }
    
    document.title = finalDocumentTitle;
    setPageTitle(finalPageContextTitle);
    
    let finalEmoji = null;
    if (directEmoji) {
      finalEmoji = directEmoji;
    } else if (emojiKey && ROUTE_EMOJIS[emojiKey]) {
      finalEmoji = ROUTE_EMOJIS[emojiKey];
    } else {
      const sortedEmojiRoutes = Object.keys(ROUTE_EMOJIS).sort((a, b) => b.length - a.length);
      for (const route of sortedEmojiRoutes) {
        if (location.pathname.startsWith(route)) {
          finalEmoji = ROUTE_EMOJIS[route];
          break;
        }
      }
    }
    setPageEmoji(finalEmoji);

  }, [titleKey, titleParams, directEmoji, emojiKey, location.pathname, setPageTitle, setPageEmoji, t, i18n.language]);

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={<PageContextSetter titleKey="pageTitle_home" emojiKey="/"><HomePage /></PageContextSetter>}
          />
          <Route
            path="/profile"
            element={<PageContextSetter titleKey="pageTitle_profile" emojiKey="/profile"><ProfilePage /></PageContextSetter>}
          />
          <Route
            path="/profile/edit"
            element={<PageContextSetter titleKey="pageTitle_profileEdit" emojiKey="/profile/edit"><ProfileEditPage /></PageContextSetter>}
          />
          <Route
            path="/settings"
            element={<PageContextSetter titleKey="pageTitle_settings" emojiKey="/settings"><SettingsPage /></PageContextSetter>}
          />
          
          <Route
            path="/ciphers/:cipherId"
            element={
              (() => {
                const DynamicTitleCipherInfoPage = () => {
                  const { cipherId } = useParams();
                  const { t: tDynamic } = useTranslation();
                  let titleKey = "pageTitle_cipherInfo_default";
                  let params = {};
                  let emojiForPage = null;

                  if (cipherId === 'caesar') {
                    titleKey = "pageTitle_cipherInfo_caesar";
                    emojiForPage = ROUTE_EMOJIS['/ciphers/caesar'];
                  } else if (cipherId) {
                    titleKey = "pageTitle_cipherInfo_param";
                    const translatedCipherId = tDynamic(`cipherName_${cipherId}`, { defaultValue: cipherId });
                    params = { cipherId: translatedCipherId };
                    emojiForPage = ROUTE_EMOJIS[`/ciphers/${cipherId}`] || null;
                  }
                  return (
                    <PageContextSetter titleKey={titleKey} titleParams={params} emoji={emojiForPage}>
                      <CipherInfoPage />
                    </PageContextSetter>
                  );
                };
                return <DynamicTitleCipherInfoPage />;
              })()
            }
          />
          <Route
            path="/ciphers/caesar/example"
            element={<PageContextSetter titleKey="pageTitle_caesarExample" emojiKey="/ciphers/caesar/example"><CaesarExamplePage /></PageContextSetter>}
          />
          <Route
            path="/ciphers/caesar/tasks"
            element={<PageContextSetter titleKey="pageTitle_caesarTasksOverview" emojiKey="/ciphers/caesar/tasks"><CaesarTasksOverviewPage /></PageContextSetter>}
          />
          <Route
            path="/ciphers/caesar/tasks/:taskType"
            element={
              (() => {
                const DynamicTitleCaesarTaskPage = () => {
                  const { taskType } = useParams();
                  const { t: tDynamic } = useTranslation();
                  let titleKey = "pageTitle_caesarTask_default";
                  let params = {};
                  let emojiForPage = null;

                  const taskPathKey = `/ciphers/caesar/tasks/${taskType}`;
                  emojiForPage = ROUTE_EMOJIS[taskPathKey] || ROUTE_EMOJIS['/ciphers/caesar/tasks'];

                  if (taskType === 'find-key') titleKey = "pageTitle_caesarTask_findKey";
                  else if (taskType === 'encrypt-text') titleKey = "pageTitle_caesarTask_encryptText";
                  else if (taskType === 'decrypt-text') titleKey = "pageTitle_caesarTask_decryptText";
                  else if (taskType) {
                    titleKey = "pageTitle_caesarTask_param";
                    const taskTypeTranslationKey = `sidebar_task_${taskType.replace(/-/g, '')}`;
                    const translatedTaskType = tDynamic(taskTypeTranslationKey, { defaultValue: taskType.replace('-', ' ') });
                    params = { taskType: translatedTaskType };
                  }
                  
                  return (
                    <PageContextSetter titleKey={titleKey} titleParams={params} emoji={emojiForPage}>
                      <CaesarTaskPage />
                    </PageContextSetter>
                  );
                };
                return <DynamicTitleCaesarTaskPage />;
              })()
            }
          />
          <Route
            path="/ciphers/caesar/visualizer"
            element={<PageContextSetter titleKey="pageTitle_caesarVisualizer" emojiKey="/ciphers/caesar/visualizer"><CaesarVisualizerPage /></PageContextSetter>}
          />
          <Route
            path="/admin"
            element={<PageContextSetter titleKey="pageTitle_admin" emojiKey="/admin"><AdminDashboardPage /></PageContextSetter>}
          />
          <Route
            path="/admin/users"
            element={<PageContextSetter titleKey="pageTitle_adminUsers" emojiKey="/admin/users"><AdminUserListPage /></PageContextSetter>}
          />
        </Route>
      </Route>

      <Route
        path="/login"
        element={<PageContextSetter titleKey="pageTitle_login" emojiKey="/login"><LoginPage /></PageContextSetter>}
      />
      <Route
        path="/register"
        element={<PageContextSetter titleKey="pageTitle_register" emojiKey="/register"><RegisterPage /></PageContextSetter>}
      />
      <Route
        path="/forgot-password"
        element={<PageContextSetter titleKey="pageTitle_forgotPassword" emojiKey="/forgot-password"><ForgotPasswordPage /></PageContextSetter>}
      />
      <Route
        path="/reset-password/:token"
        element={<PageContextSetter titleKey="pageTitle_resetPassword" emojiKey="/reset-password"><ResetPasswordPage /></PageContextSetter>}
      />
      
      <Route
        path="*"
        element={<PageContextSetter titleKey="pageTitle_notFound" emoji="❓"><NotFoundPage /></PageContextSetter>}
      />
    </Routes>
  );
};

export default AppRoutes;