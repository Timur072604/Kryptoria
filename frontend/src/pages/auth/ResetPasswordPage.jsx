import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [pageErrorKey, setPageErrorKey] = useState('');

  useEffect(() => {
    if (!token) {
        setPageErrorKey("auth_tokenMissingError");
        setTokenValid(false);
    } else {
        setTokenValid(true);
    }
  }, [token]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      addNotification({ key: 'auth_tokenMissingError' }, 'error');
      return;
    }
    if (password !== confirmPassword) {
      addNotification({ key: 'infoPasswordsDoNotMatch' }, 'error');
      return;
    }
    if (password.length < 8) {
      addNotification({ key: 'infoPasswordMinLength' }, 'error');
      return;
    }

    try {
      const response = await authService.resetPassword(token, password);
      const backendMessage = response.data?.message;
      addNotification(backendMessage ? backendMessage + " " + t('auth_successPasswordResetRedirect').split('. ')[1] : { key: 'auth_successPasswordResetRedirect' }, 'success', 5000);
      setTimeout(() => {
        navigate('/login');
      }, 0);
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'auth_errorResettingPassword' };
      }
      addNotification(messageContent, 'error');
      setTokenValid(false);
    }
  };

  if (pageErrorKey) {
    return (
      <div className="auth-page-layout">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{t('pageTitle_resetPassword')}</h2>
          </div>
          <div className="auth-card-body">
            <p className="auth-page-error-message">{t(pageErrorKey)}</p>
            <div className="auth-links-horizontal mt-3">
              <Link to="/forgot-password" className="btn btn-primary">{t('common_requestNewToken')}</Link>
              <Link to="/login" className="btn btn-tertiary">{t('common_backToLogin')}</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-layout">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{t('resetPasswordPage_title')}</h2>
        </div>
        <div className="auth-card-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">{t('resetPasswordPage_newPasswordLabel')}</label>
              <input
                type="password" id="password" name="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required minLength="8"
                disabled={tokenValid === false}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('resetPasswordPage_confirmNewPasswordLabel')}</label>
              <input
                type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength="8"
                disabled={tokenValid === false}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={tokenValid === false}>
              {t('resetPasswordPage_btnSetNewPassword')}
            </button>
          </form>
           <div className="auth-links-horizontal mt-3">
              <Link to="/login" className="btn btn-tertiary">{t('common_backToLogin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;