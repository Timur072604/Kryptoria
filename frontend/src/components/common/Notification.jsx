import React, { useEffect, useRef, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const NotificationToast = ({ notification, onAnimationEnd }) => {
  const { t, i18n } = useTranslation();
  const { id, message, type, isBeingRemoved, messageKey, messageParams } = notification;
  const toastRef = useRef(null);
  
  const [isToastVisible, setIsToastVisible] = useState(false);

  let displayMessage;
  if (messageKey) {
    if (i18n.exists(messageKey)) {
      displayMessage = t(messageKey, messageParams);
    } else {
      console.warn(`i18next: ключ перевода "${messageKey}" не найден. Отображается ключ.`);
      displayMessage = messageKey;
    }
  } else {
    displayMessage = message;
  }

  useEffect(() => {
    const node = toastRef.current;
    if (node) {
      node.offsetHeight;
    }
    
    const appearTimeout = setTimeout(() => {
      setIsToastVisible(true);
    }, 20);

    return () => clearTimeout(appearTimeout);
  }, []);

  useEffect(() => {
    if (isBeingRemoved) {
      setIsToastVisible(false);
    }
  }, [isBeingRemoved]);

  useEffect(() => {
    const node = toastRef.current;
    if (!node) return;

    const handleTransitionEnd = (event) => {
      if (event.propertyName === 'opacity' && !isToastVisible && isBeingRemoved) {
        onAnimationEnd(id);
      }
    };

    node.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      node.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [isToastVisible, id, onAnimationEnd, isBeingRemoved]);

  const notificationTypeClass = `notification-${type}`;
  const visibilityClass = isToastVisible ? 'visible' : '';

  return (
    <div
      ref={toastRef}
      className={`notification-toast ${notificationTypeClass} ${visibilityClass}`}
    >
      <div className="notification-message">{displayMessage}</div>
      <button
        className="notification-close-btn"
        onClick={() => onAnimationEnd(id, true)}
        aria-label={t('notification_close_aria')}
      >
        ×
      </button>
    </div>
  );
};


const Notification = () => {
  const { notifications, removeNotificationFromState, markForRemoval } = useNotification();

  const handleToastAnimationEnd = (id, shouldMarkFirst = false) => {
    if (shouldMarkFirst) {
      markForRemoval(id);
    } else {
      removeNotificationFromState(id);
    }
  };

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onAnimationEnd={handleToastAnimationEnd}
        />
      ))}
    </div>
  );
};

export default React.memo(Notification);