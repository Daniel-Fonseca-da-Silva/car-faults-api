import { splitPage } from './paginate.util';

describe('splitPage', () => {
  it('reports hasMore and trims the lookahead row when limit+1 rows are returned', () => {
    const rows = [1, 2, 3];

    const result = splitPage(rows, 2);

    expect(result).toEqual({ items: [1, 2], hasMore: true });
  });

  it('reports hasMore as false when exactly limit rows are returned', () => {
    const rows = [1, 2];

    const result = splitPage(rows, 2);

    expect(result).toEqual({ items: [1, 2], hasMore: false });
  });

  it('reports hasMore as false when fewer than limit rows are returned', () => {
    const rows = [1];

    const result = splitPage(rows, 2);

    expect(result).toEqual({ items: [1], hasMore: false });
  });

  it('handles an empty result set', () => {
    const result = splitPage([], 2);

    expect(result).toEqual({ items: [], hasMore: false });
  });
});
