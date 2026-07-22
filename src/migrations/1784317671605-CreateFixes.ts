import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFixes1784317671605 implements MigrationInterface {
  name = 'CreateFixes1784317671605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fixes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'known_issue_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'varchar',
          },
          {
            name: 'steps',
            type: 'text',
          },
          {
            name: 'estimated_cost_eur',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['ai', 'user'],
            enumName: 'fixes_source_enum',
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
      'fixes',
      new TableForeignKey({
        name: 'fk_fixes_known_issue_id',
        columnNames: ['known_issue_id'],
        referencedTableName: 'known_issues',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'fixes',
      new TableForeignKey({
        name: 'fk_fixes_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('fixes', 'fk_fixes_user_id');
    await queryRunner.dropForeignKey('fixes', 'fk_fixes_known_issue_id');
    await queryRunner.dropTable('fixes');
  }
}
