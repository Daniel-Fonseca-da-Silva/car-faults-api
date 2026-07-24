import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Fix } from './fix.entity';
import { FixVote } from './fix-vote.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('FixVote entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === FixVote,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "fix_votes" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === FixVote,
    );

    expect(table?.name).toBe('fix_votes');
  });

  it('defines a unique constraint on fixId and userId', () => {
    const unique = getMetadataArgsStorage().uniques.find(
      (u) => u.target === FixVote,
    );

    expect(unique?.columns).toEqual(['fixId', 'userId']);
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === FixVote && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('maps fixId to a required fix_id column', () => {
    const column = findColumn('fixId');
    expect(column?.options.name).toBe('fix_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to Fix with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === FixVote && r.propertyName === 'fix',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(Fix);
  });

  it('maps userId to a required user_id column', () => {
    const column = findColumn('userId');
    expect(column?.options.name).toBe('user_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to User with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === FixVote && r.propertyName === 'user',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(User);
  });

  it('defines value as a required enum column', () => {
    const column = findColumn('value');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
