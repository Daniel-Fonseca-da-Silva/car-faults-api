import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateActivityLogs1784317671612 implements MigrationInterface {
  name = 'CreateActivityLogs1784317671612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'activity_logs',
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
            name: 'type',
            type: 'enum',
            enum: ['search', 'defect_consulted', 'vehicle_favorite'],
            enumName: 'activity_logs_type_enum',
          },
          {
            name: 'resource_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
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
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'activity_logs',
      new TableForeignKey({
        name: 'fk_activity_logs_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'idx_activity_logs_user_id_type',
        columnNames: ['user_id', 'type'],
      }),
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_activity_logs_user_favorite_resource"
      ON "activity_logs" ("user_id", "resource_id")
      WHERE "type" = 'vehicle_favorite'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_activity_logs_user_favorite_resource"',
    );
    await queryRunner.dropIndex(
      'activity_logs',
      'idx_activity_logs_user_id_type',
    );
    await queryRunner.dropForeignKey(
      'activity_logs',
      'fk_activity_logs_user_id',
    );
    await queryRunner.dropTable('activity_logs');
  }
}
