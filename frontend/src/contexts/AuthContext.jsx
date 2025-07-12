import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import apiClient from '../services/apiClient';
import { useNotification } from './NotificationContext';
import { useTranslation } from 'react-i18next';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('user', null);
  const [accessToken, setAccessToken] = useLocalStorage('accessToken', null);
  const [refreshToken, setRefreshToken] = useLocalStorage('refreshToken', null);
  const [isLoading, setIsLoading] = useState(true);

  const { addNotification } = useNotification();
  const { t } = useTranslation();

  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  const performLogout = useCallback((showNotification = true) => {
    apiClient.post('/auth/logout').catch(err => console.error("Logout API call failed", err));
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    if (showNotification) {
      addNotification({ key: 'successLogout' }, 'info');
    }
    setIsLoading(false);
  }, [setUser, setAccessToken, setRefreshToken, addNotification]);


  const attemptTokenRefreshAndUpdateUser = useCallback(async (isInitialAttempt = false) => {
    if (!refreshToken) {
      if (!isInitialAttempt) {
        addNotification({ key: 'errorTokenRefreshMissing' }, 'error');
      }
      performLogout(false);
      return null;
    }
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      const newAccessToken = response.data.accessToken;
      setAccessToken(newAccessToken);

      const userResponse = await apiClient.get('/users/me');
      setUser(userResponse.data);
      
      if (!isInitialAttempt) {
        addNotification({ key: 'successSessionRefreshed' }, 'success', 2000);
      }
      return newAccessToken;
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError);
      addNotification({ key: 'errorSessionExpired' }, 'error');
      performLogout(false);
      return null;
    }
  }, [refreshToken, setAccessToken, setUser, addNotification, performLogout]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const initializeAuth = async () => {
      const storedAccessToken = window.localStorage.getItem('accessToken');
      const storedRefreshTokenString = window.localStorage.getItem('refreshToken');

      const cleanStoredAccessToken = storedAccessToken ? JSON.parse(storedAccessToken) : null;
      const cleanStoredRefreshToken = storedRefreshTokenString ? JSON.parse(storedRefreshTokenString) : null;


      if (!cleanStoredAccessToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${cleanStoredAccessToken}`;
      try {
        const response = await apiClient.get('/users/me');
        if (isMounted) {
          setUser(response.data);
          if (accessToken !== cleanStoredAccessToken) setAccessToken(cleanStoredAccessToken);
          if (refreshToken !== cleanStoredRefreshToken) setRefreshToken(cleanStoredRefreshToken);
        }
      } catch (error) {
        console.error("Auth token verification failed during init:", error);
        if (error.response && error.response.status === 401) {
          if (cleanStoredRefreshToken && isMounted) {
            try {
                const currentRefreshTokenForAttempt = refreshToken === cleanStoredRefreshToken ? refreshToken : cleanStoredRefreshToken;
                
                if (!currentRefreshTokenForAttempt) {
                     if (isMounted) performLogout(false);
                } else {
                    const attemptRefreshWithCorrectToken = async (isInitial) => {
                        if (!currentRefreshTokenForAttempt) {
                          if (!isInitial) addNotification({ key: 'errorTokenRefreshMissing' }, 'error');
                          performLogout(false); return null;
                        }
                        try {
                          const res = await apiClient.post('/auth/refresh', { refreshToken: currentRefreshTokenForAttempt });
                          const newAT = res.data.accessToken;
                          setAccessToken(newAT);
                          const uRes = await apiClient.get('/users/me');
                          setUser(uRes.data);
                          if (!isInitial) addNotification({ key: 'successSessionRefreshed' }, 'success', 2000);
                          return newAT;
                        } catch (err) {
                          console.error("Failed to refresh token (direct call):", err);
                          addNotification({ key: 'errorSessionExpired' }, 'error');
                          performLogout(false); return null;
                        }
                    };
                    await attemptRefreshWithCorrectToken(true);
                }
            } catch (refreshErrorDuringInit) {
              if (isMounted) performLogout(false);
            }
          } else if (isMounted) {
            performLogout(false);
          }
        } else if (isMounted) {
          performLogout(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (authData) => {
    const userData = {
      id: authData.userId,
      username: authData.username,
      email: authData.email,
      roles: authData.roles,
    };
    setUser(userData);
    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);
    setIsLoading(false);
  };

  const updateUserContext = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData, roles: updatedUserData.roles || prevUser?.roles || [] }));
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, isLoading, login, logout: performLogout, updateUserContext, attemptTokenRefresh: attemptTokenRefreshAndUpdateUser }}>
      {children}
    </AuthContext.Provider>
  );
};