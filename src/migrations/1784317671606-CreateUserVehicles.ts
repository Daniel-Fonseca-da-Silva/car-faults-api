import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateUserVehicles1784317671606 implements MigrationInterface {
  name = 'CreateUserVehicles1784317671606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_vehicles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'vehicle_model_id',
            type: 'uuid',
            isNullable: true,
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
            name: 'year',
            type: 'int',
          },
          {
            name: 'engine',
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'doors',
            type: 'int',
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
        uniques: [
          {
            name: 'uq_user_vehicles_user_brand_model_year_engine',
            columnNames: ['user_id', 'brand', 'model', 'year', 'engine'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_vehicles',
      new TableForeignKey({
        name: 'fk_user_vehicles_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_vehicles',
      new TableForeignKey({
        name: 'fk_user_vehicles_vehicle_model_id',
        columnNames: ['vehicle_model_id'],
        referencedTableName: 'vehicle_models',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'user_vehicles',
      'fk_user_vehicles_vehicle_model_id',
    );
    await queryRunner.dropForeignKey(
      'user_vehicles',
      'fk_user_vehicles_user_id',
    );
    await queryRunner.dropTable('user_vehicles');
  }
}
