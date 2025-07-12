import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login(emailOrUsername, password);
      login(response.data);
      addNotification({ key: 'auth_successLogin' }, 'success');
      navigate('/');
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'auth_errorLogin' };
      }
      addNotification(messageContent, 'error');
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{t('loginPage_title')}</h2>
        </div>
        <div className="auth-card-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">{t('loginPage_usernameOrEmailLabel')}</label>
              <input
                type="text"
                id="username"
                name="username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('loginPage_passwordLabel')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {t('loginPage_btnLogin')}
            </button>
          </form>
          <div className="auth-links-horizontal">
            <Link to="/forgot-password" className="btn btn-tertiary">{t('loginPage_forgotPasswordLink')}</Link>
            <Link to="/register" className="btn btn-tertiary">{t('loginPage_registerLink')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;