import { getMetadataArgsStorage } from 'typeorm';
import { UserVehicle } from './user-vehicle.entity';

describe('UserVehicle entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === UserVehicle,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "user_vehicles" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === UserVehicle,
    );

    expect(table?.name).toBe('user_vehicles');
  });

  it('defines a unique constraint on userId, brand, model, year and engine', () => {
    const unique = getMetadataArgsStorage().uniques.find(
      (u) => u.target === UserVehicle,
    );

    expect(unique?.columns).toEqual([
      'userId',
      'brand',
      'model',
      'year',
      'engine',
    ]);
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === UserVehicle && generation.propertyName === 'id',
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
      (r) => r.target === UserVehicle && r.propertyName === 'user',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
  });

  it('maps vehicleModelId to a nullable vehicle_model_id column', () => {
    const column = findColumn('vehicleModelId');
    expect(column?.options.name).toBe('vehicle_model_id');
    expect(column?.options.nullable).toBe(true);
  });

  it('defines a many-to-one relation to VehicleModel with set null on delete', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) => r.target === UserVehicle && r.propertyName === 'vehicleModel',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.nullable).toBe(true);
    expect(relation?.options?.onDelete).toBe('SET NULL');
  });

  it('defines brand, model, year and engine as required columns', () => {
    expect(findColumn('brand')?.options.nullable).toBeFalsy();
    expect(findColumn('model')?.options.nullable).toBeFalsy();
    expect(findColumn('year')?.options.nullable).toBeFalsy();
    expect(findColumn('year')?.options.type).toBe('int');
    expect(findColumn('engine')?.options.nullable).toBeFalsy();
  });

  it('defines name as a nullable column', () => {
    expect(findColumn('name')?.options.nullable).toBe(true);
  });

  it('defines doors as a nullable int column', () => {
    const column = findColumn('doors');
    expect(column?.options.type).toBe('int');
    expect(column?.options.nullable).toBe(true);
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
