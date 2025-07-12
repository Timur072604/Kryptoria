import { useState, useMemo, useCallback, useEffect } from 'react';

export const usePagination = (
  allItems,
  initialItemsPerPage = 3,
  minItemsPerPage = 1,
  maxItemsPerPage = 10
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPageInput, setItemsPerPageInput] = useState(String(initialItemsPerPage));

  const totalItems = allItems.length;

  const getValidItemsPerPage = useCallback(() => {
    const parsed = parseInt(itemsPerPageInput, 10);
    if (isNaN(parsed) || parsed < minItemsPerPage) {
      return Math.max(minItemsPerPage, Math.min(initialItemsPerPage, maxItemsPerPage));
    }
    return Math.min(maxItemsPerPage, Math.max(minItemsPerPage, parsed));
  }, [itemsPerPageInput, minItemsPerPage, maxItemsPerPage, initialItemsPerPage]);

  const validItemsPerPage = useMemo(() => getValidItemsPerPage(), [getValidItemsPerPage]);

  const totalPages = useMemo(() => {
    if (totalItems === 0) return 0;
    if (validItemsPerPage === 0) return 0;
    return Math.ceil(totalItems / validItemsPerPage);
  }, [totalItems, validItemsPerPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 0) setCurrentPage(0);
    } else if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    } else if (currentPage < 0 && totalPages > 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const displayedItems = useMemo(() => {
    if (totalItems === 0 || validItemsPerPage === 0) return [];
    return allItems.slice(
      currentPage * validItemsPerPage,
      (currentPage + 1) * validItemsPerPage
    );
  }, [allItems, currentPage, validItemsPerPage, totalItems]);

  const currentItemsStart = useMemo(() => {
    if (totalItems === 0 || validItemsPerPage === 0) return 0;
    return currentPage * validItemsPerPage + 1;
  }, [currentPage, validItemsPerPage, totalItems]);

  const currentItemsEnd = useMemo(() => {
    if (totalItems === 0 || validItemsPerPage === 0) return 0;
    return Math.min((currentPage + 1) * validItemsPerPage, totalItems);
  }, [currentPage, validItemsPerPage, totalItems]);

  const goToPage = useCallback((pageIndex) => {
    if (totalPages === 0) {
        if (pageIndex === 0) setCurrentPage(0);
        return;
    }
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
    }
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((e) => {
    const rawValue = e.target.value;
    setItemsPerPageInput(rawValue);
  }, []);
  
  const setItemsPerPageInputDirectly = useCallback((value) => {
    setItemsPerPageInput(String(value));
  }, []);

  return {
    currentPage,
    totalPages,
    currentItemsStart,
    currentItemsEnd,
    displayedItems,
    goToPage,
    itemsPerPageInput,
    handleItemsPerPageChange,
    validItemsPerPage,
    setItemsPerPageInputDirectly,
  };
};