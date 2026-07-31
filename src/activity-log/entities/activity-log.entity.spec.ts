import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActivityLog } from './activity-log.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('ActivityLog entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === ActivityLog,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "activity_logs" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === ActivityLog,
    );

    expect(table?.name).toBe('activity_logs');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === ActivityLog && generation.propertyName === 'id',
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
      (r) => r.target === ActivityLog && r.propertyName === 'user',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(User);
  });

  it('defines type as a required enum column', () => {
    const column = findColumn('type');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps resourceId to a nullable resource_id uuid column', () => {
    const column = findColumn('resourceId');
    expect(column?.options.name).toBe('resource_id');
    expect(column?.options.type).toBe('uuid');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines metadata as a nullable jsonb column', () => {
    const column = findColumn('metadata');
    expect(column?.options.type).toBe('jsonb');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });

  it('maps deletedAt to a deleted_at column', () => {
    expect(findColumn('deletedAt')?.options.name).toBe('deleted_at');
  });
});
