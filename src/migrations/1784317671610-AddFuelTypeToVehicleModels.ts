import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFuelTypeToVehicleModels1784317671610 implements MigrationInterface {
  name = 'AddFuelTypeToVehicleModels1784317671610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'vehicle_models',
      new TableColumn({
        name: 'fuel_type',
        type: 'enum',
        enum: ['gasoline', 'diesel', 'electric', 'gpl', 'hybrid'],
        enumName: 'vehicle_models_fuel_type_enum',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('vehicle_models', 'fuel_type');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "vehicle_models_fuel_type_enum"',
    );
  }
}
