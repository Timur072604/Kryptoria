import React, { createContext, useState, useContext } from 'react';

const PageTitleContext = createContext(undefined);

export const PageTitleProvider = ({ children }) => {
  const [pageTitle, setPageTitle] = useState('Kryptoria');
  const [pageEmoji, setPageEmoji] = useState(null);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle, pageEmoji, setPageEmoji }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return context;
};