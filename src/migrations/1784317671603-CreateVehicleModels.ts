import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateVehicleModels1784317671603 implements MigrationInterface {
  name = 'CreateVehicleModels1784317671603';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vehicle_models',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'brand',
            type: 'varchar',
          },
          {
            name: 'model',
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'year_from',
            type: 'int',
          },
          {
            name: 'year_to',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'engine',
            type: 'varchar',
          },
          {
            name: 'doors',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tech_specs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        indices: [
          {
            name: 'idx_vehicle_models_lookup',
            columnNames: ['brand', 'model', 'engine', 'year_from'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vehicle_models');
  }
}
