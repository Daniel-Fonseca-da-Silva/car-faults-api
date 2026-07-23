import { getMetadataArgsStorage } from 'typeorm';
import { VehicleModel } from './vehicle-model.entity';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';

const resolveRelationType = (relationType: unknown): unknown =>
  typeof relationType === 'function'
    ? (relationType as () => unknown)()
    : relationType;

describe('VehicleModel entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === VehicleModel,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "vehicle_models" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === VehicleModel,
    );

    expect(table?.name).toBe('vehicle_models');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === VehicleModel && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('defines brand, model and engine as required columns', () => {
    expect(findColumn('brand')?.options.nullable).toBeFalsy();
    expect(findColumn('model')?.options.nullable).toBeFalsy();
    expect(findColumn('engine')?.options.nullable).toBeFalsy();
  });

  it('defines name as nullable', () => {
    expect(findColumn('name')?.options.nullable).toBe(true);
  });

  it('maps yearFrom/yearTo to snake_case columns', () => {
    expect(findColumn('yearFrom')?.options.name).toBe('year_from');
    expect(findColumn('yearFrom')?.options.nullable).toBeFalsy();
    expect(findColumn('yearTo')?.options.name).toBe('year_to');
    expect(findColumn('yearTo')?.options.nullable).toBe(true);
  });

  it('defines doors as a nullable int column', () => {
    const column = findColumn('doors');
    expect(column?.options.type).toBe('int');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps imageUrl to a nullable image_url column', () => {
    const column = findColumn('imageUrl');
    expect(column?.options.name).toBe('image_url');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps techSpecs to a nullable jsonb tech_specs column', () => {
    const column = findColumn('techSpecs');
    expect(column?.options.name).toBe('tech_specs');
    expect(column?.options.type).toBe('jsonb');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines a one-to-many relation to KnownIssue', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === VehicleModel && r.propertyName === 'knownIssues',
    );
    expect(relation?.relationType).toBe('one-to-many');
    expect(resolveRelationType(relation?.type)).toBe(KnownIssue);

    expect(typeof relation?.inverseSideProperty).toBe('function');
    const inverseSide = relation!.inverseSideProperty as (
      entity: KnownIssue,
    ) => unknown;
    const stub = { vehicleModel: {} } as unknown as KnownIssue;
    expect(inverseSide(stub)).toBe(stub.vehicleModel);
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
