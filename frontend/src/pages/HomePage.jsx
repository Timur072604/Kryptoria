import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ItemCard = ({ icon, titleKey, descriptionKey, linkTo, linkTextKey = "common_goTo", disabled = false }) => {
  const { t } = useTranslation();
  const linkContent = (
    <button
      className={`btn btn-secondary ${disabled ? 'btn-disabled' : ''}`}
      disabled={disabled}
    >
      {t(linkTextKey)}
    </button>
  );

  return (
    <div className={`content-card settings-card ${disabled ? 'disabled-card' : ''}`}>
      <div className="content-card-header">
        <h3>
          {icon && <span className="icon icon-mr-spacing-sm">{icon}</span>}
          {t(titleKey)}
        </h3>
      </div>
      <div className="content-card-body">
        <p>{t(descriptionKey)}</p>
      </div>
      <div className="item-card-footer item-card-footer-custom-padding">
        {disabled ? (
          <div>{linkContent}</div>
        ) : (
          <Link to={linkTo}>
            {linkContent}
          </Link>
        )}
      </div>
    </div>
  );
};


const HomePage = () => {
  const { t } = useTranslation();
  const ciphers = [
    {
      id: 'caesar',
      icon: '📜',
      titleKey: 'homePage_caesar_title',
      descriptionKey: 'homePage_caesar_desc',
      link: '/ciphers/caesar'
    },
    {
      id: 'vigenere',
      icon: '🗝️',
      titleKey: 'homePage_vigenere_title',
      descriptionKey: 'homePage_vigenere_desc',
      link: '#',
      disabled: true,
    },
    {
      id: 'playfair',
      icon: '🎲',
      titleKey: 'homePage_playfair_title',
      descriptionKey: 'homePage_playfair_desc',
      link: '#',
      disabled: true,
    }
  ];

  return (
    <div className="item-list">
      {ciphers.map(cipher => (
        <ItemCard
          key={cipher.id}
          icon={cipher.icon}
          titleKey={cipher.titleKey}
          descriptionKey={cipher.descriptionKey}
          linkTo={cipher.link}
          linkTextKey={cipher.linkTextKey || "common_goTo"}
          disabled={cipher.disabled}
        />
      ))}
      {ciphers.length === 0 && <p>{t('homePage_noCiphers')}</p>}
    </div>
  );
};

export default HomePage;