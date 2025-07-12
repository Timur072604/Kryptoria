import React from 'react';
import { useTranslation } from 'react-i18next';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePageButtons = 5,
  disabled = false,
}) => {
  const { t } = useTranslation();
  if (totalPages === 0) {
    return null;
  }

  const pageButtonElements = [];

  pageButtonElements.push(
    <button
      key="prev"
      className="btn btn-icon"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={disabled || currentPage === 0}
      aria-label={t('pagination_previous_aria')}
      title={t('pagination_previous_aria')}
    >
      «
    </button>
  );

  const pageNumbersToRender = [];

  if (totalPages <= maxVisiblePageButtons) {
    for (let i = 0; i < totalPages; i++) {
      pageNumbersToRender.push(i);
    }
  } else {
    pageNumbersToRender.push(0);

    const siblingCount = Math.max(0, Math.floor((maxVisiblePageButtons - 1 - 2) / 2));
    const leftEllipsisNeeded = currentPage > siblingCount + 1;
    const rightEllipsisNeeded = currentPage < totalPages - 2 - siblingCount;

    let rangeStart, rangeEnd;

    if (!leftEllipsisNeeded && rightEllipsisNeeded) {
      rangeStart = 1;
      rangeEnd = Math.min(totalPages - 2, maxVisiblePageButtons - 2);
    } else if (leftEllipsisNeeded && !rightEllipsisNeeded) {
      rangeStart = Math.max(1, totalPages - 1 - (maxVisiblePageButtons - 2));
      rangeEnd = totalPages - 2;
    } else if (leftEllipsisNeeded && rightEllipsisNeeded) {
      rangeStart = Math.max(1, currentPage - siblingCount);
      rangeEnd = Math.min(totalPages - 2, currentPage + siblingCount);
    } else {
      rangeStart = 1;
      rangeEnd = totalPages - 2;
    }
    
    if (leftEllipsisNeeded) {
      pageNumbersToRender.push(-1);
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i >= 1 && i <= totalPages - 2) {
         if (!pageNumbersToRender.includes(i)) {
            pageNumbersToRender.push(i);
         }
      }
    }

    if (rightEllipsisNeeded) {
      const lastPushed = pageNumbersToRender[pageNumbersToRender.length - 1];
      if (lastPushed !== -1 && lastPushed < totalPages - 2) {
        pageNumbersToRender.push(-1);
      }
    }

    if (!pageNumbersToRender.includes(totalPages - 1)) {
      pageNumbersToRender.push(totalPages - 1);
    }
  }

  const finalPageNumbers = [];
  let lastPushedPage = -2;

  for (const page of pageNumbersToRender) {
    if (page === -1) {
      if (lastPushedPage !== -1) {
        finalPageNumbers.push(page);
        lastPushedPage = page;
      }
    } else {
      if (!finalPageNumbers.includes(page)) {
        finalPageNumbers.push(page);
        lastPushedPage = page;
      }
    }
  }

  finalPageNumbers.forEach((pageIndex) => {
    if (pageIndex === -1) {
      pageButtonElements.push(<span key={`ellipsis-${pageButtonElements.length}`} className="pagination-ellipsis">...</span>);
    } else {
      pageButtonElements.push(
        <button
          key={pageIndex}
          className={`btn btn-icon ${currentPage === pageIndex ? 'active' : ''}`}
          onClick={() => onPageChange(pageIndex)}
          disabled={disabled}
          aria-current={currentPage === pageIndex ? 'page' : undefined}
          title={t('pagination_page_title', { pageNumber: pageIndex + 1 })}
        >
          {pageIndex + 1}
        </button>
      );
    }
  });

  pageButtonElements.push(
    <button
      key="next"
      className="btn btn-icon"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={disabled || currentPage === totalPages - 1}
      aria-label={t('pagination_next_aria')}
      title={t('pagination_next_aria')}
    >
      »
    </button>
  );

  return <div className="step-controls">{pageButtonElements}</div>;
};

export default PaginationControls;