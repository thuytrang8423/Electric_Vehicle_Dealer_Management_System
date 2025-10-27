import React from 'react';
import 'boxicons/css/boxicons.min.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  totalItems,
  showItemsPerPage = true 
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 4;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible (4)
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 2) {
        // Show first 2 pages + ellipsis + last page
        for (let i = 1; i <= 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 1) {
        // Show first page + ellipsis + last 2 pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current + ellipsis + last page
        pages.push(1);
        pages.push('...');
        pages.push(currentPage);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      padding: '16px 0',
      borderTop: '1px solid var(--color-border)'
    }}>
      {/* Items info */}
      <div style={{
        fontSize: '14px',
        color: 'var(--color-text-muted)'
      }}>
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </div>

      {/* Pagination controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            background: currentPage === 1 ? 'var(--color-bg)' : 'var(--color-surface)',
            color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.color = 'var(--color-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.color = 'var(--color-text)';
            }
          }}
        >
          <i className="bx bx-chevron-left"></i>
          Previous
        </button>

        {/* Page numbers */}
        <div style={{
          display: 'flex',
          gap: '4px'
        }}>
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              style={{
                padding: '8px 12px',
                border: page === currentPage ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: '6px',
                background: page === currentPage ? 'var(--color-primary)' : 'var(--color-surface)',
                color: page === currentPage ? 'white' : 'var(--color-text)',
                cursor: page === '...' ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: page === currentPage ? '600' : '400',
                transition: 'all 0.2s ease',
                minWidth: '40px',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (page !== '...' && page !== currentPage) {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.color = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== '...' && page !== currentPage) {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.color = 'var(--color-text)';
                }
              }}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            background: currentPage === totalPages ? 'var(--color-bg)' : 'var(--color-surface)',
            color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.color = 'var(--color-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.color = 'var(--color-text)';
            }
          }}
        >
          Next
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
