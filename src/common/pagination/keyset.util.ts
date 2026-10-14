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
 * Builds the lexicographic keyset ("seek") predicate for a multi-column sort.
 * Works for both WHERE (plain columns) and HAVING (aggregate expressions)
 * clauses. Assumes the sort columns are NOT NULL, as every caller's are.
 *
 * When every column sorts in the same direction it emits a row comparison,
 * e.g. for (a ASC, b ASC): (a, b) > (:a, :b). Postgres turns that into an
 * index condition and seeks straight to the cursor; the expanded OR form below
 * makes it read and discard every row before the cursor instead, so deep
 * pages got slower the further in they were.
 *
 * Mixed directions, e.g. (a DESC, b ASC, c DESC), have no row-comparison
 * equivalent and use the expanded form:
 *   (a < :a) OR (a = :a AND b > :b) OR (a = :a AND b = :b AND c < :c)
 */
export function buildKeysetWhere(
  columns: KeysetColumn[],
  cursorValues: Record<string, string | number>,
): KeysetWhere {
  const direction = columns[0]?.direction;
  if (columns.every((column) => column.direction === direction)) {
    return buildRowComparison(columns, cursorValues, direction);
  }

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

function buildRowComparison(
  columns: KeysetColumn[],
  cursorValues: Record<string, string | number>,
  direction: KeysetDirection,
): KeysetWhere {
  const params: Record<string, string | number> = {};
  const placeholders = columns.map((column, index) => {
    const cmpParam = `${column.param}_cmp${index}`;
    params[cmpParam] = cursorValues[column.param];
    return `:${cmpParam}`;
  });

  const op = direction === 'ASC' ? '>' : '<';
  const exprs = columns.map((column) => column.expr).join(', ');
  return { sql: `((${exprs}) ${op} (${placeholders.join(', ')}))`, params };
}
