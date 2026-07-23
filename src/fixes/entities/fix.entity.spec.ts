import { getMetadataArgsStorage } from 'typeorm';
import { Fix } from './fix.entity';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('Fix entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === Fix,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "fixes" table', () => {
    const table = getMetadataArgsStorage().tables.find((t) => t.target === Fix);

    expect(table?.name).toBe('fixes');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === Fix && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('maps knownIssueId to a required known_issue_id column', () => {
    const column = findColumn('knownIssueId');
    expect(column?.options.name).toBe('known_issue_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to KnownIssue with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === Fix && r.propertyName === 'knownIssue',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(KnownIssue);

    expect(typeof relation?.inverseSideProperty).toBe('function');
    const inverseSide = relation!.inverseSideProperty as (
      entity: KnownIssue,
    ) => unknown;
    const stub = { fixes: [] } as unknown as KnownIssue;
    expect(inverseSide(stub)).toBe(stub.fixes);
  });

  it('maps userId to a nullable user_id column', () => {
    const column = findColumn('userId');
    expect(column?.options.name).toBe('user_id');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines summary as required and steps as text', () => {
    expect(findColumn('summary')?.options.nullable).toBeFalsy();
    expect(findColumn('steps')?.options.type).toBe('text');
    expect(findColumn('steps')?.options.nullable).toBeFalsy();
  });

  it('maps estimatedCostEur to a nullable decimal column', () => {
    const column = findColumn('estimatedCostEur');
    expect(column?.options.name).toBe('estimated_cost_eur');
    expect(column?.options.type).toBe('decimal');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines source as a required enum column', () => {
    const column = findColumn('source');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
