import { getMetadataArgsStorage } from 'typeorm';
import { Review } from './review.entity';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { User } from '../../users/entities/user.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('Review entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === Review,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "reviews" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === Review,
    );

    expect(table?.name).toBe('reviews');
  });

  it('defines a unique constraint on userId and knownIssueId', () => {
    const unique = getMetadataArgsStorage().uniques.find(
      (u) => u.target === Review,
    );

    expect(unique?.columns).toEqual(['userId', 'knownIssueId']);
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === Review && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('maps userId to a required user_id column', () => {
    const column = findColumn('userId');
    expect(column?.options.name).toBe('user_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to User with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === Review && r.propertyName === 'user',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(User);
  });

  it('maps knownIssueId to a required known_issue_id column', () => {
    const column = findColumn('knownIssueId');
    expect(column?.options.name).toBe('known_issue_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to KnownIssue with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === Review && r.propertyName === 'knownIssue',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(KnownIssue);
  });

  it('defines rating as a required int column', () => {
    const column = findColumn('rating');
    expect(column?.options.type).toBe('int');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines comment as a nullable text column', () => {
    const column = findColumn('comment');
    expect(column?.options.type).toBe('text');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
