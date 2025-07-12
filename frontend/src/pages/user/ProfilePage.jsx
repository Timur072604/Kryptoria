import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useTranslation } from 'react-i18next';

const ProfileDataDisplay = React.memo(({ profileData, formatDateFunc }) => {
  const { t } = useTranslation();
  
  const profileFields = [
    { key: 'username', labelKey: 'profilePage_usernameLabel' },
    { key: 'email', labelKey: 'profilePage_emailLabel' },
    { key: 'createdAt', labelKey: 'profilePage_registrationDateLabel', formatter: formatDateFunc },
  ];

  const dataToDisplay = profileData || {};

  return (
    <div className="profile-data-content">
      {profileFields.map(field => {
        const value = dataToDisplay[field.key];
        const displayValue = value
          ? (field.formatter ? field.formatter(value) : value)
          : (profileData === null ? '...' : 'N/A');

        return (
          <div className="profile-info-item" key={field.key}>
            <span className="profile-info-label">{t(field.labelKey)}</span>
            <span className="profile-info-value">
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ProfileDataDisplay.displayName = 'ProfileDataDisplay';

const ProfilePage = () => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);

  const { user: contextUser, accessToken, isLoading: authIsLoading, logout } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const rafRef = useRef(0);
  const timeoutRef = useRef(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (contextUser && !profileData) {
      setProfileData(contextUser);
    }
  }, [contextUser, profileData]);

  const fetchProfileDataFromServer = useCallback(async () => {
    if (authIsLoading || !accessToken) {
      if (!authIsLoading && !accessToken) {
        addNotification({ key: 'auth_userNotAuthenticated' }, 'error');
        setProfileData(null);
      }
      return;
    }

    cancelAnimationFrame(rafRef.current);
    clearTimeout(timeoutRef.current);

    try {
      const response = await userService.getCurrentUserProfile();
      rafRef.current = requestAnimationFrame(() => {
        timeoutRef.current = setTimeout(() => {
          setProfileData(response.data);
        }, 0);
      });
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'errorDefault' };
      }
      addNotification(messageContent, 'error');
      if (!contextUser) {
        setProfileData(null);
      }
    }
  }, [accessToken, authIsLoading, addNotification, contextUser]);

  useEffect(() => {
    if (!authIsLoading) {
        fetchProfileDataFromServer();
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [authIsLoading, accessToken, fetchProfileDataFromServer]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  }, []);

  const dataIsAvailableForDisplay = !!profileData;

  const handleOpenDeleteModal = () => setIsDeleteModalOpen(true);
  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = async () => {
    try {
      await userService.deleteCurrentUserAccount();
      addNotification({ key: 'profilePage_successProfileDeleted' }, 'success');
      logout();
      navigate('/');
      setIsDeleteModalOpen(false);
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'profilePage_errorDeletingProfile' };
      }
      addNotification(messageContent, 'error');
    } finally {
      if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
      }
    }
  };

  return (
    <>
      <div className="settings-layout-horizontal">
        <div className="content-card settings-card" aria-labelledby="profile-data-title">
          <div className="content-card-header">
            <h2 id="profile-data-title">
              <span role="img" aria-hidden="true" className="icon-mr-0_5em">🆔</span>
              {t('profilePage_title')}
            </h2>
          </div>
          <div className="content-card-body">
            <ProfileDataDisplay
              profileData={profileData}
              formatDateFunc={formatDate}
            />
            <div
              className="action-buttons profile-action-buttons-wrapper profile-actions-flex-between"
            >
              {!authIsLoading && dataIsAvailableForDisplay ? (
                <Link to="/profile/edit" className="btn btn-primary">
                  {t('profilePage_btnEdit')}
                </Link>
              ) : (
                !authIsLoading && <div className="btn-placeholder" style={{ opacity: 0.5, cursor: 'default', width: '130px', height: '43px' }} aria-hidden="true"></div>
              )}

              {!authIsLoading && dataIsAvailableForDisplay && (
                <button
                  onClick={handleOpenDeleteModal}
                  className="btn btn-danger"
                >
                  {t('profilePage_btnDelete')}
                </button>
              )}
              {!authIsLoading && !dataIsAvailableForDisplay && (
                  <div className="btn-placeholder" aria-hidden="true" style={{width: '150px', height: '43px', opacity: 0.5 }}></div>
               )}
            </div>
          </div>
        </div>

        <div className="content-card settings-card" aria-labelledby="general-settings-title">
          <div className="content-card-header">
            <h2 id="general-settings-title">
              <span role="img" aria-hidden="true" className="icon-mr-0_5em">🛠️</span>
              {t('settingsPage_generalTitle')}
            </h2>
          </div>
          <div className="content-card-body">
            <p>{t('settingsPage_generalDescription')}</p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={t('profilePage_confirmDeleteTitle')}
        confirmText={t('common_delete')}
        cancelText={t('common_cancel')}
        confirmButtonType="danger"
      >
        <p>{t('profilePage_confirmDeleteMsg1')}</p>
        <p>{t('profilePage_confirmDeleteMsg2')}</p>
      </ConfirmationModal>
    </>
  );
};

export default ProfilePage;