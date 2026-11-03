import type { HTMLAttributes, Ref } from 'react';
import { useId } from 'react';
import { cx } from '../../internal/cx';
import { AnglesLeftIcon, AnglesRightIcon, ChevronLeftIcon, ChevronRightIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';
import { useControllable } from '../../internal/use-controllable';
import { getPaginatorState } from './paginator-utils';

export interface PaginatorProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Total records in the consumer-owned result set. */
  totalRecords?: number;
  /** Zero-based active page (controlled). */
  page?: number;
  defaultPage?: number;
  /** Records per page (controlled). */
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  disabled?: boolean;
  showCurrentPageReport?: boolean;
  showRowsPerPage?: boolean;
  /** Called with the requested zero-based page. */
  onPageChange?: (page: number) => void;
  /** Called with the requested page size. */
  onPageSizeChange?: (pageSize: number) => void;
  ref?: Ref<HTMLElement>;
}

const DEFAULT_OPTIONS = [10, 20, 50, 100, 200];

/** Page links with first/previous/next/last buttons, a result range report and a rows-per-page select. */
export function Paginator({
  totalRecords = 0,
  page,
  defaultPage = 0,
  pageSize,
  defaultPageSize = 50,
  pageSizeOptions = DEFAULT_OPTIONS,
  disabled = false,
  showCurrentPageReport = true,
  showRowsPerPage = true,
  onPageChange,
  onPageSizeChange,
  className,
  'aria-label': ariaLabel,
  ...rest
}: PaginatorProps) {
  const t = useTranslate();
  const selectId = useId();
  const [currentPage, setPage] = useControllable(page, defaultPage, onPageChange);
  const [size, setSize] = useControllable(pageSize, defaultPageSize, onPageSizeChange);
  const state = getPaginatorState(totalRecords, currentPage, size);

  const goTo = (target: number) => {
    if (!disabled && target !== currentPage && target >= 0 && target < state.totalPages) setPage(target);
  };

  return (
    <nav
      {...rest}
      aria-label={ariaLabel ?? t('tumAetUi.paginator.ariaLabel')}
      className={cx('tumaet-ui-paginator', className)}
    >
      {showCurrentPageReport && (
        <span className="tumaet-ui-paginator-report" aria-live="polite">
          {t('tumAetUi.paginator.currentPageReport', {
            first: state.rangeBegin,
            second: state.rangeEnd,
            total: totalRecords,
          })}
        </span>
      )}
      <button
        type="button"
        className="tumaet-ui-paginator-button"
        disabled={disabled || state.isFirst}
        onClick={() => goTo(0)}
        aria-label={t('tumAetUi.paginator.first')}
      >
        <AnglesLeftIcon />
      </button>
      <button
        type="button"
        className="tumaet-ui-paginator-button"
        disabled={disabled || state.isFirst}
        onClick={() => goTo(state.page - 1)}
        aria-label={t('tumAetUi.paginator.previous')}
      >
        <ChevronLeftIcon />
      </button>
      {state.visiblePages.map((p) => (
        <button
          key={p}
          type="button"
          className="tumaet-ui-paginator-button"
          data-selected={p === state.page || undefined}
          disabled={disabled}
          onClick={() => goTo(p)}
          aria-current={p === state.page ? 'page' : undefined}
        >
          {p + 1}
        </button>
      ))}
      <button
        type="button"
        className="tumaet-ui-paginator-button"
        disabled={disabled || state.isLast}
        onClick={() => goTo(state.page + 1)}
        aria-label={t('tumAetUi.paginator.next')}
      >
        <ChevronRightIcon />
      </button>
      <button
        type="button"
        className="tumaet-ui-paginator-button"
        disabled={disabled || state.isLast}
        onClick={() => goTo(state.totalPages - 1)}
        aria-label={t('tumAetUi.paginator.last')}
      >
        <AnglesRightIcon />
      </button>
      {showRowsPerPage && (
        <div className="tumaet-ui-paginator-rows">
          <label htmlFor={selectId}>{t('tumAetUi.paginator.rowsPerPage')}</label>
          <select
            id={selectId}
            className="tumaet-ui-paginator-select"
            value={size}
            disabled={disabled}
            onChange={(event) => setSize(Number(event.target.value))}
          >
            {(pageSizeOptions.includes(size) ? pageSizeOptions : [...pageSizeOptions, size].sort((a, b) => a - b)).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
        </div>
      )}
    </nav>
  );
}
