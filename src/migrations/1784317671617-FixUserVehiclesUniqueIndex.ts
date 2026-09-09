import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same class of bug as `FixActivityLogsFavoriteUniqueIndex1784317671616`:
 * `uq_user_vehicles_user_brand_model_year_engine` (see
 * `CreateUserVehicles1784317671606`) predates the `deleted_at` column added
 * in `AddDeletedAtToSoftDeletableTables1784317671613`, so it never excluded
 * soft-deleted rows. Removing a vehicle from the garage (soft delete) and
 * then adding the same vehicle back collides with the deleted row and
 * throws a Postgres unique-violation.
 */
export class FixUserVehiclesUniqueIndex1784317671617 implements MigrationInterface {
  name = 'FixUserVehiclesUniqueIndex1784317671617';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_vehicles" DROP CONSTRAINT IF EXISTS "uq_user_vehicles_user_brand_model_year_engine"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_user_vehicles_user_brand_model_year_engine"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_user_vehicles_user_brand_model_year_engine"
      ON "user_vehicles" ("user_id", "brand", "model", "year", "engine")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_user_vehicles_user_brand_model_year_engine"',
    );
    await queryRunner.query(`
      ALTER TABLE "user_vehicles"
      ADD CONSTRAINT "uq_user_vehicles_user_brand_model_year_engine"
      UNIQUE ("user_id", "brand", "model", "year", "engine")
    `);
  }
}
