import { getMetadataArgsStorage } from 'typeorm';
import { Comment } from './comment.entity';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { User } from '../../users/entities/user.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('Comment entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === Comment,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "comments" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === Comment,
    );

    expect(table?.name).toBe('comments');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === Comment && generation.propertyName === 'id',
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
      (r) => r.target === Comment && r.propertyName === 'user',
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
      (r) => r.target === Comment && r.propertyName === 'knownIssue',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(KnownIssue);
  });

  it('defines body as a required text column', () => {
    const column = findColumn('body');
    expect(column?.options.type).toBe('text');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
