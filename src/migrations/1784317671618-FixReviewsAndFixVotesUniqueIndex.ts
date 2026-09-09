import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same class of bug as `FixActivityLogsFavoriteUniqueIndex1784317671616` and
 * `FixUserVehiclesUniqueIndex1784317671617`: `uq_reviews_user_id_known_issue_id`
 * (see `CreateReviews1784317671607`) and `uq_fix_votes_fix_id_user_id` (see
 * `CreateFixVotes1784317671609`) predate the `deleted_at` column added in
 * `AddDeletedAtToSoftDeletableTables1784317671613`, so neither excludes
 * soft-deleted rows. Deleting a review/vote and then recreating it on the
 * same known issue/fix collides with the deleted row and throws a Postgres
 * unique-violation.
 */
export class FixReviewsAndFixVotesUniqueIndex1784317671618 implements MigrationInterface {
  name = 'FixReviewsAndFixVotesUniqueIndex1784317671618';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "uq_reviews_user_id_known_issue_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_reviews_user_id_known_issue_id"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_reviews_user_id_known_issue_id"
      ON "reviews" ("user_id", "known_issue_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(
      'ALTER TABLE "fix_votes" DROP CONSTRAINT IF EXISTS "uq_fix_votes_fix_id_user_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_fix_votes_fix_id_user_id"',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_fix_votes_fix_id_user_id"
      ON "fix_votes" ("fix_id", "user_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_fix_votes_fix_id_user_id"',
    );
    await queryRunner.query(`
      ALTER TABLE "fix_votes"
      ADD CONSTRAINT "uq_fix_votes_fix_id_user_id"
      UNIQUE ("fix_id", "user_id")
    `);

    await queryRunner.query(
      'DROP INDEX IF EXISTS "uq_reviews_user_id_known_issue_id"',
    );
    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD CONSTRAINT "uq_reviews_user_id_known_issue_id"
      UNIQUE ("user_id", "known_issue_id")
    `);
  }
}
