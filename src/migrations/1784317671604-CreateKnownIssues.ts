import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateKnownIssues1784317671604 implements MigrationInterface {
  name = 'CreateKnownIssues1784317671604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'known_issues',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'vehicle_model_id',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            enumName: 'known_issues_severity_enum',
          },
          {
            name: 'typical_km',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'sources',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ai_generated_at',
            type: 'timestamp',
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
      'known_issues',
      new TableForeignKey({
        name: 'fk_known_issues_vehicle_model_id',
        columnNames: ['vehicle_model_id'],
        referencedTableName: 'vehicle_models',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'known_issues',
      'fk_known_issues_vehicle_model_id',
    );
    await queryRunner.dropTable('known_issues');
  }
}
