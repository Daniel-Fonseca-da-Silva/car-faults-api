import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateReports1784317671619 implements MigrationInterface {
  name = 'CreateReports1784317671619';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'reporter_user_id',
            type: 'uuid',
          },
          {
            name: 'content_type',
            type: 'enum',
            enum: ['comment', 'review'],
            enumName: 'reports_content_type_enum',
          },
          {
            name: 'content_id',
            type: 'uuid',
          },
          {
            name: 'reason',
            type: 'enum',
            enum: [
              'spam',
              'offensive',
              'inappropriate_photo',
              'harassment',
              'other',
            ],
            enumName: 'reports_reason_enum',
          },
          {
            name: 'details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'reviewed', 'dismissed'],
            enumName: 'reports_status_enum',
            default: `'pending'`,
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
            name: 'uq_reports_reporter_content',
            columnNames: ['reporter_user_id', 'content_type', 'content_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        name: 'fk_reports_reporter_user_id',
        columnNames: ['reporter_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'idx_reports_content_type_content_id',
        columnNames: ['content_type', 'content_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'reports',
      'idx_reports_content_type_content_id',
    );
    await queryRunner.dropForeignKey('reports', 'fk_reports_reporter_user_id');
    await queryRunner.dropTable('reports');
  }
}
