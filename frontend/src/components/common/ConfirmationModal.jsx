import React from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText: confirmTextProp,
  cancelText: cancelTextProp,
  confirmButtonType = 'primary'
}) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const confirmButtonClass = confirmButtonType === 'danger' ? 'btn-danger' : 'btn-primary';
  const finalConfirmText = confirmTextProp 
    ? (typeof confirmTextProp === 'function' ? confirmTextProp(t) : t(confirmTextProp, { defaultValue: confirmTextProp })) 
    : t('common_confirm');
  const finalCancelText = cancelTextProp 
    ? (typeof cancelTextProp === 'function' ? cancelTextProp(t) : t(cancelTextProp, { defaultValue: cancelTextProp })) 
    : t('common_cancel');
  const finalTitle = typeof title === 'function' 
    ? title(t) 
    : t(title, { defaultValue: title });

  const titleId = `confirmation-modal-title-${Math.random().toString(36).substring(7)}`;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby={titleId}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{finalTitle}</h2>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {finalCancelText}
          </button>
          <button type="button" className={`btn ${confirmButtonClass}`} onClick={onConfirm}>
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;