import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = [
  'vehicle_models',
  'user_vehicles',
  'reviews',
  'known_issues',
  'fixes',
  'fix_votes',
  'comments',
  'activity_logs',
];

export class AddDeletedAtToSoftDeletableTables1784317671613 implements MigrationInterface {
  name = 'AddDeletedAtToSoftDeletableTables1784317671613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.dropColumn(table, 'deleted_at');
    }
  }
}
