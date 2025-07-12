import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ItemCard = ({ icon, titleKey, descriptionKey, linkTo, linkTextKey = "common_goTo" }) => {
  const { t } = useTranslation();
  return (
    <div className="content-card settings-card">
      <div className="content-card-header">
        <h3>
          {icon && <span className="icon icon-mr-spacing-sm" role="img" aria-hidden="true">{icon}</span>}
          {t(titleKey)}
        </h3>
      </div>
      <div className="content-card-body">
        <p>{t(descriptionKey)}</p>
      </div>
      <div className="item-card-footer item-card-footer-custom-padding">
        <Link to={linkTo} className="btn btn-secondary">{t(linkTextKey)}</Link>
      </div>
    </div>
  );
};

const CipherInfoPage = () => {
  const { t } = useTranslation();
  const { cipherId } = useParams();

  if (cipherId !== 'caesar') {
    return <p>{t('cipherInfoPage_notFound', { cipherId })}</p>;
  }

  const descriptionParagraphs = [
    t('cipherInfoPage_caesar_desc1'),
    t('cipherInfoPage_caesar_desc2')
  ];

  return (
    <>
      <div className="content-card">
        <div className="content-card-header">
          <h2>
            <span role="img" aria-hidden="true" className="icon-mr-0_5em">ℹ️</span>
            {t('cipherInfoPage_aboutTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          {descriptionParagraphs.map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
      </div>

      <div className="item-list">
        <ItemCard
          icon="👁️‍🗨️"
          titleKey="cipherInfoPage_visualizer_title"
          descriptionKey="cipherInfoPage_visualizer_desc"
          linkTo={`/ciphers/${cipherId}/visualizer`}
        />
        <ItemCard
          icon="📖"
          titleKey="cipherInfoPage_example_title"
          descriptionKey="cipherInfoPage_example_desc"
          linkTo={`/ciphers/${cipherId}/example`}
        />
        <ItemCard
          icon="🎯"
          titleKey="cipherInfoPage_tasks_title"
          descriptionKey="cipherInfoPage_tasks_desc"
          linkTo={`/ciphers/${cipherId}/tasks`}
        />
      </div>
    </>
  );
};

export default CipherInfoPage;