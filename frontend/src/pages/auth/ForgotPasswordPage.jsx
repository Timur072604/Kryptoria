import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.requestPasswordReset(emailOrUsername);
      const backendMessage = response.data?.message;
      addNotification(backendMessage || { key: 'auth_successPasswordResetRequest' }, 'success', 5000);
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'auth_errorRequestPasswordReset' };
      }
      addNotification(messageContent, 'error');
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{t('forgotPasswordPage_title')}</h2>
        </div>
        <div className="auth-card-body">
          <p className="text-secondary mb-3">{t('forgotPasswordPage_description')}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="emailOrUsername">{t('forgotPasswordPage_emailOrUsernameLabel')}</label>
              <input
                type="text"
                id="emailOrUsername"
                name="emailOrUsername"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {t('forgotPasswordPage_btnSend')}
            </button>
          </form>
          <div className="auth-links-horizontal">
            <Link to="/login" className="btn btn-tertiary">{t('common_backToLogin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;