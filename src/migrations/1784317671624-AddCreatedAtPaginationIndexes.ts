import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Each index matches one cursor-paginated list: its equality filter followed
 * by the (created_at, id) sort, so Postgres seeks straight to the cursor
 * through the row comparison instead of sorting every matching row. A B-tree
 * scanned backward serves the DESC, DESC order, so the columns stay ASC.
 */
const INDEXES: { name: string; table: string; columns: string[] }[] = [
  {
    name: 'idx_comments_known_issue_id_created_at',
    table: 'comments',
    columns: ['known_issue_id', 'created_at', 'id'],
  },
  {
    name: 'idx_reviews_known_issue_id_created_at',
    table: 'reviews',
    columns: ['known_issue_id', 'created_at', 'id'],
  },
  {
    name: 'idx_known_issues_vehicle_model_id_created_at',
    table: 'known_issues',
    columns: ['vehicle_model_id', 'created_at', 'id'],
  },
  {
    name: 'idx_user_vehicles_user_id_created_at',
    table: 'user_vehicles',
    columns: ['user_id', 'created_at', 'id'],
  },
  {
    name: 'idx_activity_logs_user_id_type_created_at',
    table: 'activity_logs',
    columns: ['user_id', 'type', 'created_at', 'id'],
  },
  {
    name: 'idx_reports_created_at',
    table: 'reports',
    columns: ['created_at', 'id'],
  },
];

export class AddCreatedAtPaginationIndexes1784317671624 implements MigrationInterface {
  name = 'AddCreatedAtPaginationIndexes1784317671624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { name, table, columns } of INDEXES) {
      const columnList = columns.map((column) => `"${column}"`).join(', ');
      await queryRunner.query(
        `CREATE INDEX "${name}" ON "${table}" (${columnList})`,
      );
    }

    // Superseded: (user_id, type) is a prefix of the new activity_logs index.
    await queryRunner.query(`DROP INDEX "idx_activity_logs_user_id_type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_user_id_type" ON "activity_logs" ("user_id", "type")`,
    );

    for (const { name } of INDEXES) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }
}
