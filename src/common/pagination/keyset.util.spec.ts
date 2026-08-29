import { buildKeysetWhere } from './keyset.util';

describe('buildKeysetWhere', () => {
  it('builds a single-column DESC predicate', () => {
    const { sql, params } = buildKeysetWhere(
      [{ expr: 'activity_log.id', direction: 'DESC', param: 'id' }],
      { id: 'abc' },
    );

    expect(sql).toBe('(activity_log.id < :id_cmp0)');
    expect(params).toEqual({ id_cmp0: 'abc' });
  });

  it('builds a two-column DESC,DESC predicate with an equality tiebreaker', () => {
    const { sql, params } = buildKeysetWhere(
      [
        {
          expr: 'activity_log.created_at',
          direction: 'DESC',
          param: 'createdAt',
        },
        { expr: 'activity_log.id', direction: 'DESC', param: 'id' },
      ],
      { createdAt: '2026-01-01', id: 'abc' },
    );

    expect(sql).toBe(
      '(activity_log.created_at < :createdAt_cmp0) OR ' +
        '(activity_log.created_at = :createdAt_eq0 AND activity_log.id < :id_cmp1)',
    );
    expect(params).toEqual({
      createdAt_cmp0: '2026-01-01',
      createdAt_eq0: '2026-01-01',
      id_cmp1: 'abc',
    });
  });

  it('builds a mixed-direction, multi-column predicate (fixes-style)', () => {
    const { sql, params } = buildKeysetWhere(
      [
        { expr: 'likes', direction: 'DESC', param: 'likes' },
        { expr: 'dislikes', direction: 'ASC', param: 'dislikes' },
        { expr: 'fix.created_at', direction: 'ASC', param: 'createdAt' },
        { expr: 'fix.id', direction: 'ASC', param: 'id' },
      ],
      { likes: 5, dislikes: 1, createdAt: '2026-01-01', id: 'fix-1' },
    );

    expect(sql).toBe(
      '(likes < :likes_cmp0) OR ' +
        '(likes = :likes_eq0 AND dislikes > :dislikes_cmp1) OR ' +
        '(likes = :likes_eq0 AND dislikes = :dislikes_eq1 AND fix.created_at > :createdAt_cmp2) OR ' +
        '(likes = :likes_eq0 AND dislikes = :dislikes_eq1 AND fix.created_at = :createdAt_eq2 AND fix.id > :id_cmp3)',
    );
    expect(params).toMatchObject({
      likes_cmp0: 5,
      likes_eq0: 5,
      dislikes_cmp1: 1,
      dislikes_eq1: 1,
      createdAt_cmp2: '2026-01-01',
      createdAt_eq2: '2026-01-01',
      id_cmp3: 'fix-1',
    });
  });
});
