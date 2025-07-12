import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      try {
        return JSON.parse(item);
      } catch (parseError) {
        if (key === 'theme' && (item === 'light' || item === 'dark')) {
          return item;
        }
        console.error(`[useLocalStorage] Error parsing localStorage key "${key}" as JSON. Value: "${item}". Falling back to initialValue.`, parseError);
        return initialValue;
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(prevStoredValue => {
        const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`[useLocalStorage] Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        try {
          if (event.newValue === null) {
            setStoredValue(initialValue);
          } else {
            const parsedNewValue = JSON.parse(event.newValue);
            setStoredValue(parsedNewValue);
          }
        } catch (error) {
          console.error(`[useLocalStorage] Error parsing localStorage change for key "${key}":`, error);
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}