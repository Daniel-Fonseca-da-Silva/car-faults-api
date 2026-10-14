import { MigrationInterface, QueryRunner } from 'typeorm';
import { slugify } from '../common/utils/slugify.util';

interface VehicleModelNameRow {
  id: string;
  brand: string;
  model: string;
  engine: string;
}

const SLUG_COLUMNS = ['brand_slug', 'model_slug', 'engine_slug'];
const TRIGRAM_COLUMNS = ['brand', 'model', 'engine'];

/**
 * - Slug columns let the path lookup filter in Postgres through an index
 *   instead of loading every candidate and comparing slugs in memory.
 * - Trigram GIN indexes let the `ILIKE '%term%'` catalog/faults filters use
 *   an index (a B-tree cannot serve a leading wildcard).
 */
export class AddVehicleModelSearchIndexes1784317671622 implements MigrationInterface {
  name = 'AddVehicleModelSearchIndexes1784317671622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of SLUG_COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "vehicle_models" ADD COLUMN "${column}" varchar`,
      );
    }

    // Backfilled with the application's slugify so stored slugs match the
    // ones computed from request paths byte for byte.
    const rows = (await queryRunner.query(
      `SELECT "id", "brand", "model", "engine" FROM "vehicle_models"`,
    )) as VehicleModelNameRow[];
    for (const row of rows) {
      await queryRunner.query(
        `UPDATE "vehicle_models"
         SET "brand_slug" = $1, "model_slug" = $2, "engine_slug" = $3
         WHERE "id" = $4`,
        [slugify(row.brand), slugify(row.model), slugify(row.engine), row.id],
      );
    }

    for (const column of SLUG_COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "vehicle_models" ALTER COLUMN "${column}" SET NOT NULL`,
      );
    }
    await queryRunner.query(
      `CREATE INDEX "idx_vehicle_models_path_lookup"
       ON "vehicle_models" ("brand_slug", "model_slug", "engine_slug", "year_from")`,
    );

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    for (const column of TRIGRAM_COLUMNS) {
      await queryRunner.query(
        `CREATE INDEX "idx_vehicle_models_${column}_trgm"
         ON "vehicle_models" USING GIN ("${column}" gin_trgm_ops)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The pg_trgm extension is left installed: other objects may depend on it.
    for (const column of TRIGRAM_COLUMNS) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "idx_vehicle_models_${column}_trgm"`,
      );
    }
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_vehicle_models_path_lookup"`,
    );
    for (const column of SLUG_COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "vehicle_models" DROP COLUMN "${column}"`,
      );
    }
  }
}
