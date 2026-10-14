import { buildKeysetWhere } from './keyset.util';

describe('buildKeysetWhere', () => {
  it('builds a single-column DESC predicate', () => {
    const { sql, params } = buildKeysetWhere(
      [{ expr: 'activity_log.id', direction: 'DESC', param: 'id' }],
      { id: 'abc' },
    );

    expect(sql).toBe('((activity_log.id) < (:id_cmp0))');
    expect(params).toEqual({ id_cmp0: 'abc' });
  });

  it('builds a row comparison for a DESC,DESC sort', () => {
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
      '((activity_log.created_at, activity_log.id) < (:createdAt_cmp0, :id_cmp1))',
    );
    expect(params).toEqual({ createdAt_cmp0: '2026-01-01', id_cmp1: 'abc' });
  });

  it('builds a row comparison with > for an all-ASC sort (catalog-style)', () => {
    const { sql, params } = buildKeysetWhere(
      [
        { expr: 'vehicle_model.brand', direction: 'ASC', param: 'brand' },
        { expr: 'vehicle_model.model', direction: 'ASC', param: 'model' },
        {
          expr: 'vehicle_model.year_from',
          direction: 'ASC',
          param: 'yearFrom',
        },
        { expr: 'vehicle_model.id', direction: 'ASC', param: 'id' },
      ],
      { brand: 'Volkswagen', model: 'Polo', yearFrom: 2001, id: 'vm-1' },
    );

    expect(sql).toBe(
      '((vehicle_model.brand, vehicle_model.model, vehicle_model.year_from, vehicle_model.id) > ' +
        '(:brand_cmp0, :model_cmp1, :yearFrom_cmp2, :id_cmp3))',
    );
    expect(params).toEqual({
      brand_cmp0: 'Volkswagen',
      model_cmp1: 'Polo',
      yearFrom_cmp2: 2001,
      id_cmp3: 'vm-1',
    });
  });

  it('builds a row comparison over aggregate expressions for HAVING', () => {
    const { sql } = buildKeysetWhere(
      [
        { expr: 'COUNT(c.id)', direction: 'DESC', param: 'reportCount' },
        { expr: 'ki.id', direction: 'DESC', param: 'id' },
      ],
      { reportCount: 3, id: 'ki-1' },
    );

    expect(sql).toBe('((COUNT(c.id), ki.id) < (:reportCount_cmp0, :id_cmp1))');
  });

  it('falls back to the expanded OR form when directions are mixed', () => {
    const { sql } = buildKeysetWhere(
      [
        { expr: 'a', direction: 'DESC', param: 'a' },
        { expr: 'b', direction: 'ASC', param: 'b' },
      ],
      { a: 1, b: 2 },
    );

    expect(sql).toBe('(a < :a_cmp0) OR (a = :a_eq0 AND b > :b_cmp1)');
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
