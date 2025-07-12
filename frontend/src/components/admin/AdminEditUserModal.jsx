import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isPasswordComplex } from '../../utils/validationUtils';
import { useNotification } from '../../contexts/NotificationContext';

const AdminEditUserModal = ({ isOpen, onClose, userToEdit, onSave, currentAdminId }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (userToEdit) {
      const userData = {
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        newPassword: '',
        confirmNewPassword: '',
      };
      setFormData(userData);
      setInitialData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
      });
    } else {
      setFormData({ username: '', email: '', newPassword: '', confirmNewPassword: '' });
      setInitialData(null);
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    const changes = {};
    let passwordValidationErrorKey = null;

    if (initialData && formData.username !== initialData.username) {
      changes.username = formData.username;
    }
    if (initialData && formData.email !== initialData.email) {
      changes.email = formData.email;
    }
    
    if (formData.newPassword || formData.confirmNewPassword) {
      if (!formData.newPassword && formData.confirmNewPassword) {
        passwordValidationErrorKey = 'adminUserListPage_editModal_error_newPasswordRequired';
      } else if (formData.newPassword && !formData.confirmNewPassword) {
        passwordValidationErrorKey = 'adminUserListPage_editModal_error_confirmPasswordRequired';
      } else if (formData.newPassword.length < 8) {
        passwordValidationErrorKey = 'registerPage_errorPasswordMinLength';
      } else if (formData.newPassword !== formData.confirmNewPassword) {
        passwordValidationErrorKey = 'registerPage_errorPasswordsMismatch';
      } else if (!isPasswordComplex(formData.newPassword)) {
        passwordValidationErrorKey = 'registerPage_errorPasswordRequirements';
      } else {
        changes.newPassword = formData.newPassword;
      }
    }

    if (passwordValidationErrorKey) {
      addNotification({ key: passwordValidationErrorKey }, 'error');
      return;
    }
    
    if (Object.keys(changes).length > 0 && userToEdit) {
      onSave(userToEdit.id, changes);
    } else {
      onClose();
    }
  };

  if (!isOpen || !userToEdit) {
    return null;
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const isEditingSelf = currentAdminId === userToEdit.id;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="edit-user-modal-title">
      <div className="modal-content admin-edit-user-modal-content">
        <div className="modal-header">
          <h2 id="edit-user-modal-title" className="modal-title">
            {t('adminUserListPage_editModal_title', { username: userToEdit.username })}
          </h2>
          <button onClick={onClose} className="modal-close-btn" aria-label={t('common_close')}>×</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="modal-body admin-edit-user-modal-body">
            <div className="form-group">
              <label htmlFor="edit-username">{t('adminUserListPage_col_username')}</label>
              <input
                type="text"
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength="1"
                maxLength="50"
                disabled={isEditingSelf}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">{t('adminUserListPage_col_email')}</label>
              <input
                type="email"
                id="edit-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength="100"
                disabled={isEditingSelf}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-newPassword">{t('adminUserListPage_editModal_newPasswordLabel')}</label>
              <input
                type="password"
                id="edit-newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                maxLength="128"
                autoComplete="new-password"
                disabled={isEditingSelf}
                placeholder={isEditingSelf ? t('adminUserListPage_editModal_selfPasswordChangeDisabled') : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-confirmNewPassword">{t('adminUserListPage_editModal_confirmNewPasswordLabel')}</label>
              <input
                type="password"
                id="edit-confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                maxLength="128"
                autoComplete="new-password"
                disabled={isEditingSelf}
              />
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common_cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('common_saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditUserModal;