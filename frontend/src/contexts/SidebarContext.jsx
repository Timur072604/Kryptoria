import React, { createContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const SidebarContext = createContext();

const MOBILE_WIDTH_THRESHOLD = 768;

export const SidebarProvider = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(
    'sidebarCollapsed',
    window.innerWidth <= MOBILE_WIDTH_THRESHOLD 
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_WIDTH_THRESHOLD);

  useEffect(() => {
    const handleResize = () => {
      const currentIsMobile = window.innerWidth <= MOBILE_WIDTH_THRESHOLD;
      setIsMobile(currentIsMobile);

      if (currentIsMobile) {
        if (!isSidebarCollapsed) {
             setIsSidebarCollapsed(true);
        }
      } else {
        const storedState = localStorage.getItem('sidebarCollapsed');
        setIsSidebarCollapsed(storedState === 'true');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  useEffect(() => {
    if (isMobile && !isSidebarCollapsed) {
    }
  }, [isMobile]);


  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, toggleSidebar, isMobile, setIsSidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};