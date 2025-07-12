import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminCard = ({ icon, titleKey, descriptionKey, linkTo, linkTextKey, children }) => {
  const { t } = useTranslation();
  return (
    <div className="content-card settings-card">
      <div className="content-card-header">
        <h2>
          {icon && <span className="icon icon-mr-spacing-sm" role="img" aria-hidden="true">{icon}</span>}
          {t(titleKey)}
        </h2>
      </div>
      <div className="content-card-body">
        {descriptionKey && <p>{t(descriptionKey)}</p>}
        {children}
      </div>
      {linkTo && (
        <div
          className="item-card-footer item-card-footer-custom-padding"
        >
          <Link to={linkTo} className="btn btn-secondary">
            {t(linkTextKey || 'common_goTo')}
          </Link>
        </div>
      )}
    </div>
  );
};

const AdminDashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className="settings-layout-horizontal">
      <AdminCard
        icon="👥"
        titleKey="adminPage_usersCard_title"
        descriptionKey="adminPage_usersCard_description"
        linkTo="/admin/users"
        linkTextKey="common_goTo"
      />
      <AdminCard
        icon="⚙️"
        titleKey="adminPage_generalCard_title"
      >
        <p>{t('adminPage_generalCard_description')}</p>
      </AdminCard>
    </div>
  );
};

export default AdminDashboardPage;