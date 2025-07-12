import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { PageTitleProvider } from './contexts/PageTitleContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Notification from './components/common/Notification';

import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback="Загрузка...">
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <ThemeProvider>
              <SidebarProvider>
                <PageTitleProvider>
                  <Notification />
                  <App />
                </PageTitleProvider>
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </Suspense>
  </React.StrictMode>
);