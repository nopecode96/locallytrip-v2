'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';

export interface PaginationState {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminPaginationProps {
  pagination: PaginationState;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  isPending?: boolean;
}

export function AdminPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  isPending = false,
}: AdminPaginationProps) {
  const { totalItems, totalPages, currentPage, pageSize } = pagination;

  if (totalItems === 0 && totalPages <= 1) {
    return null;
  }

  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${className}`}
    >
      {/* Left: Summary and Page Size Selector */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Menampilkan <strong className="font-bold text-gray-900 dark:text-white">{from}</strong> -{' '}
          <strong className="font-bold text-gray-900 dark:text-white">{to}</strong> dari{' '}
          <strong className="font-bold text-gray-900 dark:text-white">{totalItems}</strong> data
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="hidden md:inline">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isPending}
              className="py-1 px-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="dark:bg-[#1A1D21] text-gray-900 dark:text-white">
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold ml-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Memuat...</span>
          </div>
        )}
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page « */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isPending}
          title="Halaman Pertama"
          className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Page ‹ */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          title="Halaman Sebelumnya"
          className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-gray-400 select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={isPending}
                className={`min-w-8 h-8 px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page › */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          title="Halaman Berikutnya"
          className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page » */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isPending}
          title="Halaman Terakhir"
          className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
