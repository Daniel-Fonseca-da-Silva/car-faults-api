export interface SplitPageResult<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * Given rows fetched with `take(limit + 1)`, trims the lookahead row and
 * reports whether there is a next page.
 */
export function splitPage<T>(rows: T[], limit: number): SplitPageResult<T> {
  const hasMore = rows.length > limit;
  return { items: hasMore ? rows.slice(0, limit) : rows, hasMore };
}
