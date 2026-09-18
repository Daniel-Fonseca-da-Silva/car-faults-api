import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('Report entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === Report,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "reports" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === Report,
    );

    expect(table?.name).toBe('reports');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === Report && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('maps reporterUserId to a required reporter_user_id column', () => {
    const column = findColumn('reporterUserId');
    expect(column?.options.name).toBe('reporter_user_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to User with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === Report && r.propertyName === 'reporter',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(User);
  });

  it('maps contentType to a required content_type enum column', () => {
    const column = findColumn('contentType');
    expect(column?.options.name).toBe('content_type');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps contentId to a required content_id column', () => {
    const column = findColumn('contentId');
    expect(column?.options.name).toBe('content_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines reason as a required enum column', () => {
    const column = findColumn('reason');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines details as a nullable text column', () => {
    const column = findColumn('details');
    expect(column?.options.type).toBe('text');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines status as an enum column defaulting to pending', () => {
    const column = findColumn('status');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.default).toBe('pending');
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
