import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Keyset cursors carry `createdAt` as a JS Date (millisecond precision), but
 * Postgres stored microseconds. A row created in the same millisecond as the
 * page's last row, with more microseconds, compared greater than the cursor
 * and was skipped on the next page. Storing milliseconds makes the cursor
 * value and the column value identical.
 */
const CURSOR_PAGINATED_TABLES = [
  'activity_logs',
  'comments',
  'fixes',
  'known_issues',
  'reports',
  'reviews',
  'user_vehicles',
];

export class UseMillisecondPrecisionForCreatedAt1784317671623 implements MigrationInterface {
  name = 'UseMillisecondPrecisionForCreatedAt1784317671623';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of CURSOR_PAGINATED_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "created_at" TYPE timestamp(3)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Values already rounded to milliseconds stay rounded.
    for (const table of CURSOR_PAGINATED_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "created_at" TYPE timestamp`,
      );
    }
  }
}
