import { getMetadataArgsStorage } from 'typeorm';
import { KnownIssue } from './known-issue.entity';
import { Fix } from '../../fixes/entities/fix.entity';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('KnownIssue entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === KnownIssue,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "known_issues" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === KnownIssue,
    );

    expect(table?.name).toBe('known_issues');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === KnownIssue && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('maps vehicleModelId to a required vehicle_model_id column', () => {
    const column = findColumn('vehicleModelId');
    expect(column?.options.name).toBe('vehicle_model_id');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines a many-to-one relation to VehicleModel with cascade delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === KnownIssue && r.propertyName === 'vehicleModel',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(resolveRelationType(relation?.type)).toBe(VehicleModel);

    expect(typeof relation?.inverseSideProperty).toBe('function');
    const inverseSide = relation!.inverseSideProperty as (
      entity: VehicleModel,
    ) => unknown;
    const stub = { knownIssues: [] } as unknown as VehicleModel;
    expect(inverseSide(stub)).toBe(stub.knownIssues);
  });

  it('defines title as required and description as text', () => {
    expect(findColumn('title')?.options.nullable).toBeFalsy();
    expect(findColumn('description')?.options.type).toBe('text');
    expect(findColumn('description')?.options.nullable).toBeFalsy();
  });

  it('defines severity as a required enum column', () => {
    const column = findColumn('severity');
    expect(column?.options.type).toBe('enum');
    expect(column?.options.nullable).toBeFalsy();
  });

  it('maps typicalKm to a nullable typical_km column', () => {
    const column = findColumn('typicalKm');
    expect(column?.options.name).toBe('typical_km');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines sources as a nullable jsonb column', () => {
    const column = findColumn('sources');
    expect(column?.options.type).toBe('jsonb');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps aiGeneratedAt to a nullable ai_generated_at column', () => {
    const column = findColumn('aiGeneratedAt');
    expect(column?.options.name).toBe('ai_generated_at');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines a one-to-many relation to Fix', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === KnownIssue && r.propertyName === 'fixes',
    );
    expect(relation?.relationType).toBe('one-to-many');
    expect(resolveRelationType(relation?.type)).toBe(Fix);

    expect(typeof relation?.inverseSideProperty).toBe('function');
    const inverseSide = relation!.inverseSideProperty as (
      entity: Fix,
    ) => unknown;
    const stub = { knownIssue: {} } as unknown as Fix;
    expect(inverseSide(stub)).toBe(stub.knownIssue);
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
