export const PAGE_LINK_SIZE = 5;

export interface PaginatorState {
  totalPages: number;
  /** Zero-based page, clamped into the valid range. */
  page: number;
  isFirst: boolean;
  isLast: boolean;
  /** One-based first record on the page, 0 when there are no records. */
  rangeBegin: number;
  rangeEnd: number;
  /** Zero-based indexes of the page links to show, a window of at most `PAGE_LINK_SIZE` around the active page. */
  visiblePages: number[];
}

export function getPaginatorState(totalRecords: number, page: number, pageSize: number): PaginatorState {
  const size = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalRecords / size));
  const clamped = Math.min(Math.max(0, page), totalPages - 1);
  const count = Math.min(PAGE_LINK_SIZE, totalPages);
  let start = Math.max(0, clamped - Math.floor(count / 2));
  const end = Math.min(totalPages, start + count);
  start = Math.max(0, end - count);
  return {
    totalPages,
    page: clamped,
    isFirst: clamped <= 0,
    isLast: clamped >= totalPages - 1,
    rangeBegin: totalRecords === 0 ? 0 : clamped * pageSize + 1,
    rangeEnd: Math.min(totalRecords, (clamped + 1) * pageSize),
    visiblePages: Array.from({ length: end - start }, (_, i) => start + i),
  };
}
