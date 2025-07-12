import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ItemCard = ({ icon, titleKey, descriptionKey, linkTo, linkTextKey = "common_goTo" }) => {
  const { t } = useTranslation();
  return (
    <div className="content-card settings-card">
      <div className="content-card-header">
        <h3>
          {icon && <span className="icon" role="img" aria-hidden="true" style={{ marginRight: 'var(--spacing-sm)' }}>{icon}</span>}
          {t(titleKey)}
        </h3>
      </div>
      <div className="content-card-body">
        <p>{t(descriptionKey)}</p>
      </div>
      <div className="item-card-footer" style={{ padding: 'var(--padding-card-header-vertical)' }}>
        <Link to={linkTo} className="btn btn-secondary">{t(linkTextKey)}</Link>
      </div>
    </div>
  );
};

const CaesarTasksOverviewPage = () => {
  const { t } = useTranslation();
  const tasks = [
    {
      id: 'find-key',
      icon: '🔑',
      titleKey: 'caesarTasksOverviewPage_findKey_title',
      descriptionKey: 'caesarTasksOverviewPage_findKey_description',
      link: '/ciphers/caesar/tasks/find-key',
    },
    {
      id: 'decrypt-text',
      icon: '🔓',
      titleKey: 'caesarTasksOverviewPage_decryptText_title',
      descriptionKey: 'caesarTasksOverviewPage_decryptText_description',
      link: '/ciphers/caesar/tasks/decrypt-text',
    },
    {
      id: 'encrypt-text',
      icon: '🔒',
      titleKey: 'caesarTasksOverviewPage_encryptText_title',
      descriptionKey: 'caesarTasksOverviewPage_encryptText_description',
      link: '/ciphers/caesar/tasks/encrypt-text',
    },
  ];

  return (
    <>
      <div className="content-card" aria-labelledby="tasks-overview-description-title">
        <div className="content-card-header">
          <h2 id="tasks-overview-description-title">
            <span role="img" aria-hidden="true" style={{ marginRight: '0.5em' }}>ℹ️</span>
            {t('pageTitle_caesarTasksOverview')}
          </h2>
        </div>
        <div className="content-card-body">
          <p>{t('caesarTasksOverviewPage_pageDescription')}</p>
        </div>
      </div>

      <div className="item-list">
        {tasks.map(task => (
          <ItemCard
            key={task.id}
            icon={task.icon}
            titleKey={task.titleKey}
            descriptionKey={task.descriptionKey}
            linkTo={task.link}
          />
        ))}
      </div>
    </>
  );
};

export default CaesarTasksOverviewPage;