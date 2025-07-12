import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addNotification({ key: 'registerPage_errorPasswordsMismatch' }, 'error');
      return;
    }
    if (formData.password.length < 8) {
      addNotification({ key: 'registerPage_errorPasswordMinLength' }, 'error');
      return;
    }

    try {
      const response = await authService.register(formData.username, formData.email, formData.password);
      const backendMessage = response.data?.message;
      const successMessageContent = backendMessage ? backendMessage + " " + t('auth_successRegistrationRedirect').split('. ')[1] : { key: 'auth_successRegistrationRedirect' };
      addNotification(successMessageContent, 'success', 5000);
      
      setTimeout(() => {
        navigate('/login');
      }, 0);
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else if (err.response?.data?.validationErrors && err.response.data.validationErrors[0]?.message) {
        messageContent = err.response.data.validationErrors[0].message;
      } else {
        messageContent = { key: 'auth_errorRegister' };
      }
      addNotification(messageContent, 'error');
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{t('registerPage_title')}</h2>
        </div>
        <div className="auth-card-body">
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">{t('registerPage_usernameLabel')}</label>
              <input
                type="text" id="username" name="username" value={formData.username}
                onChange={handleChange} required minLength="3" maxLength="50"
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('registerPage_emailLabel')}</label>
              <input
                type="email" id="email" name="email" value={formData.email}
                onChange={handleChange} required maxLength="100"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('registerPage_passwordLabel')}</label>
              <input
                type="password" id="password" name="password" value={formData.password}
                onChange={handleChange} required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('registerPage_confirmPasswordLabel')}</label>
              <input
                type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {t('registerPage_btnRegister')}
            </button>
          </form>
          <div className="auth-links-horizontal">
            <Link to="/login" className="btn btn-tertiary">{t('registerPage_loginLink')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;