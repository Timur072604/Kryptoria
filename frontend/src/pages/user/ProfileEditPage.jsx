import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const ProfileEditPage = () => {
  const { t } = useTranslation();
  const { user, updateUserContext, accessToken, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const isInitializedRef = useRef(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (authIsLoading) return;

      if (!accessToken) {
        addNotification({ key: 'auth_userNotAuthenticated' }, 'error');
        navigate('/login');
        return;
      }

      if (user && (!isInitializedRef.current || (formData.username === '' && formData.email === ''))) {
          setFormData({
              username: user.username || '',
              email: user.email || '',
          });
          isInitializedRef.current = true;
      } else if (!user) {
        try {
          const response = await userService.getCurrentUserProfile();
          const profile = response.data;
          setFormData({
            username: profile.username || '',
            email: profile.email || '',
          });
          updateUserContext(profile);
          isInitializedRef.current = true;
        } catch (err) {
          let messageContent;
          if (err.message === 'Network Error' || !err.response) {
            messageContent = { key: 'networkError' };
          } else if (err.response && err.response.data && err.response.data.message) {
            messageContent = err.response.data.message;
          } else {
            messageContent = { key: 'errorLoadingProfile' };
          }
          addNotification(messageContent, 'error');
          isInitializedRef.current = true;
        }
      }
    };

    loadInitialData();
  }, [authIsLoading, accessToken, navigate, user, updateUserContext, addNotification, formData.username, formData.email]);
  
  const prevUserRef = useRef();
  useEffect(() => {
    if (prevUserRef.current && user && JSON.stringify(prevUserRef.current) !== JSON.stringify(user)) {
        const formMatchesPrevUser = formData.username === prevUserRef.current.username && formData.email === prevUserRef.current.email;
        const formMatchesCurrentUser = formData.username === user.username && formData.email === user.email;

        if ((formMatchesPrevUser && !formMatchesCurrentUser) || formMatchesCurrentUser) {
             if (formData.username !== user.username || formData.email !== user.email) {
                setFormData({
                    username: user.username || '',
                    email: user.email || '',
                });
             }
        }
    }
    prevUserRef.current = user;
  }, [user, formData.username, formData.email]);


  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (formData.username === user?.username && formData.email === user?.email) {
      addNotification({ key: 'profileEditPage_infoNoChanges' }, 'info');
      return;
    }
    try {
      const updateData = {};
      if (formData.username !== user?.username) updateData.username = formData.username;
      if (formData.email !== user?.email) updateData.email = formData.email;

      if (Object.keys(updateData).length > 0) {
        const response = await userService.updateUserProfile(updateData);
        updateUserContext(response.data.profile);
        addNotification(response.data.message || { key: 'profileEditPage_successProfileUpdated' }, 'success');
      }
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'profileEditPage_errorUpdatingProfile' };
      }
      addNotification(messageContent, 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      addNotification({ key: 'infoPasswordsDoNotMatch' }, 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
        addNotification({ key: 'infoPasswordMinLength' }, 'error');
        return;
    }
    try {
      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      addNotification(response.data.message || { key: 'profileEditPage_successPasswordChanged' }, 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'profileEditPage_errorChangingPassword' };
      }
      addNotification(messageContent, 'error');
    }
  };

  const isActionDisabled = authIsLoading;
  const showFieldPlaceholders = authIsLoading && !isInitializedRef.current;

  return (
    <div className="settings-layout-horizontal">
      <div className="content-card settings-card profile-edit-card" aria-labelledby="personal-data-title">
        <div className="content-card-header">
          <h2 id="personal-data-title">
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">🆔</span>
            {t('profileEditPage_personalDataTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="edit-username">{t('profileEditPage_usernameLabel')}</label>
              {showFieldPlaceholders ? (
                <div className="placeholder-animated-field"></div>
              ) : (
                <input
                  type="text" id="edit-username" name="username"
                  value={formData.username} onChange={handleProfileChange}
                  disabled={isActionDisabled}
                  required minLength="3" maxLength="50"
                />
              )}
            </div>
            <div className="form-group">
              <label htmlFor="edit-email">{t('profileEditPage_emailLabel')}</label>
              {showFieldPlaceholders ? (
                <div className="placeholder-animated-field"></div>
              ) : (
                <input
                  type="email" id="edit-email" name="email"
                  value={formData.email} onChange={handleProfileChange}
                  disabled={isActionDisabled}
                  required maxLength="100"
                />
              )}
            </div>
            <div className="action-buttons">
              <button type="submit" className="btn btn-primary" disabled={isActionDisabled || showFieldPlaceholders}>
                {t('common_saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="content-card settings-card profile-edit-card" aria-labelledby="change-password-title">
        <div className="content-card-header">
          <h2 id="change-password-title">
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">🔑</span>
            {t('profileEditPage_changePasswordTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">{t('profileEditPage_currentPasswordLabel')}</label>
              <input
                type="password" id="currentPassword" name="currentPassword"
                value={passwordData.currentPassword} onChange={handlePasswordChange}
                disabled={isActionDisabled || showFieldPlaceholders}
                required autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">{t('profileEditPage_newPasswordLabel')}</label>
              <input
                type="password" id="newPassword" name="newPassword"
                value={passwordData.newPassword} onChange={handlePasswordChange}
                disabled={isActionDisabled || showFieldPlaceholders}
                required minLength="8" maxLength="128" autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">{t('profileEditPage_confirmNewPasswordLabel')}</label>
              <input
                type="password" id="confirmNewPassword" name="confirmNewPassword"
                value={passwordData.confirmNewPassword} onChange={handlePasswordChange}
                disabled={isActionDisabled || showFieldPlaceholders}
                required minLength="8" maxLength="128" autoComplete="new-password"
              />
            </div>
            <div className="action-buttons">
              <button type="submit" className="btn btn-primary" disabled={isActionDisabled || showFieldPlaceholders}>
                {t('profileEditPage_btn_changePassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;