import React, { createContext, useState, useCallback, useContext, useRef, useEffect } from 'react';

const NotificationContext = createContext();
const MAX_VISIBLE_NOTIFICATIONS = 3;

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const autoHideTimeouts = useRef(new Map());

  const removeNotificationFromState = useCallback((idToRemove) => {
    setNotifications(prev => prev.filter(n => n.id !== idToRemove));
    if (autoHideTimeouts.current.has(idToRemove)) {
      clearTimeout(autoHideTimeouts.current.get(idToRemove));
      autoHideTimeouts.current.delete(idToRemove);
    }
  }, []);

  const markForRemoval = useCallback((idToMark) => {
    setNotifications(prev =>
      prev.map(n => (n.id === idToMark ? { ...n, isBeingRemoved: true } : n))
    );
    if (autoHideTimeouts.current.has(idToMark)) {
        clearTimeout(autoHideTimeouts.current.get(idToMark));
        autoHideTimeouts.current.delete(idToMark);
    }
  }, []);

  const addNotification = useCallback((content, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    let message = null;
    let messageKey = null;
    let messageParams = {};

    if (typeof content === 'string') {
        message = content;
    } else if (typeof content === 'object' && content !== null && typeof content.key === 'string') {
        messageKey = content.key;
        messageParams = content.params || {};
    } else {
        console.error("Invalid content for addNotification. Expected string or object with key property:", content);
        message = "Некорректное содержимое уведомления";
    }

    const newNotification = {
        id,
        message,
        messageKey,
        messageParams,
        type,
        duration,
        isBeingRemoved: false
    };

    setNotifications(prev => {
      let currentNotifications = [...prev];
      currentNotifications.push(newNotification);

      const visibleNotifications = currentNotifications.filter(n => !n.isBeingRemoved);
      if (visibleNotifications.length > MAX_VISIBLE_NOTIFICATIONS) {
        const numToRemove = visibleNotifications.length - MAX_VISIBLE_NOTIFICATIONS;
        const oldestVisible = visibleNotifications.slice(0, numToRemove);
        
        currentNotifications = currentNotifications.map(n => {
          if (oldestVisible.find(ov => ov.id === n.id) && !n.isBeingRemoved) {
            if (autoHideTimeouts.current.has(n.id)) {
                clearTimeout(autoHideTimeouts.current.get(n.id));
                autoHideTimeouts.current.delete(n.id);
            }
            return { ...n, isBeingRemoved: true };
          }
          return n;
        });
      }
      return currentNotifications;
    });

    if (duration && duration > 0) {
      if (autoHideTimeouts.current.has(id)) {
        clearTimeout(autoHideTimeouts.current.get(id));
      }
      const autoHideTimeoutId = setTimeout(() => {
        markForRemoval(id);
      }, duration);
      autoHideTimeouts.current.set(id, autoHideTimeoutId);
    }
  }, [markForRemoval]);

  useEffect(() => {
    const autoHideMap = autoHideTimeouts.current;
    return () => {
      autoHideMap.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, markForRemoval, removeNotificationFromState, notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};