import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The original `uq_activity_logs_user_favorite_resource` index (see
 * `CreateActivityLogs1784317671612`) keyed uniqueness on
 * `(user_id, resource_id)` only. It predates the `deleted_at` column added
 * in `AddDeletedAtToSoftDeletableTables1784317671613`, so it never excluded
 * soft-deleted rows: unfavoriting a vehicle (soft delete) and then
 * favoriting it again collides with the deleted row and throws a Postgres
 * unique-violation, surfaced to clients as a generic 500. It also ignored
 * `year`, even though a favorite is scoped to `(vehicleModelId, year)`
 * everywhere else (`ActivityLogRepository.findFavorite`), so favoriting the
 * same model for a second year hit the same collision.
 */
export class FixActivityLogsFavoriteUniqueIndex1784317671616 implements MigrationInterface {
  name = 'FixActivityLogsFavoriteUniqueIndex1784317671616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_activity_logs_user_favorite_resource"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_activity_logs_user_favorite_resource"
      ON "activity_logs" ("user_id", "resource_id", (("metadata"->>'year')))
      WHERE "type" = 'vehicle_favorite' AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_activity_logs_user_favorite_resource"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_activity_logs_user_favorite_resource"
      ON "activity_logs" ("user_id", "resource_id")
      WHERE "type" = 'vehicle_favorite'
    `);
  }
}
