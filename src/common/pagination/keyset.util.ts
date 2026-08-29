export type KeysetDirection = 'ASC' | 'DESC';

export interface KeysetColumn {
  /** Raw SQL column or expression, e.g. "activity_log.created_at" or "COUNT(c.id)". */
  expr: string;
  direction: KeysetDirection;
  /** Key into the cursor payload holding this column's last-seen value. */
  param: string;
}

export interface KeysetWhere {
  sql: string;
  params: Record<string, string | number>;
}

/**
 * Builds the standard lexicographic keyset ("seek") predicate for a multi-column
 * sort, e.g. for columns (a DESC, b ASC, c DESC):
 *   (a < :a) OR (a = :a AND b > :b) OR (a = :a AND b = :b AND c < :c)
 * Works for both WHERE (plain columns) and HAVING (aggregate expressions) clauses.
 */
export function buildKeysetWhere(
  columns: KeysetColumn[],
  cursorValues: Record<string, string | number>,
): KeysetWhere {
  const params: Record<string, string | number> = {};
  const clauses: string[] = [];

  columns.forEach((column, index) => {
    const equalityTerms: string[] = [];
    for (let j = 0; j < index; j++) {
      const eqColumn = columns[j];
      const eqParam = `${eqColumn.param}_eq${j}`;
      params[eqParam] = cursorValues[eqColumn.param];
      equalityTerms.push(`${eqColumn.expr} = :${eqParam}`);
    }

    const op = column.direction === 'ASC' ? '>' : '<';
    const cmpParam = `${column.param}_cmp${index}`;
    params[cmpParam] = cursorValues[column.param];
    const comparisonTerm = `${column.expr} ${op} :${cmpParam}`;

    clauses.push(`(${[...equalityTerms, comparisonTerm].join(' AND ')})`);
  });

  return { sql: clauses.join(' OR '), params };
}
