import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="error-page-layout">
      <div className="error-card">
        <h1>{t('notFoundPage_title')}</h1>
        <h2>{t('notFoundPage_subtitle')}</h2>
        <p>{t('notFoundPage_desc1')}</p>
        <p>{t('notFoundPage_desc2')}</p>
        <div className="action-buttons mt-3">
          <Link to="/" className="btn btn-primary">{t('notFoundPage_btn_home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;