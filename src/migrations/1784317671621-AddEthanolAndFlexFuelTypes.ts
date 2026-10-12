import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEthanolAndFlexFuelTypes1784317671621 implements MigrationInterface {
  name = 'AddEthanolAndFlexFuelTypes1784317671621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "vehicle_models_fuel_type_enum" ADD VALUE IF NOT EXISTS 'ethanol'`,
    );
    await queryRunner.query(
      `ALTER TYPE "vehicle_models_fuel_type_enum" ADD VALUE IF NOT EXISTS 'flex'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot drop enum values, so the type is rebuilt without them.
    // Rows using the removed values lose their fuel type (column is nullable).
    await queryRunner.query(
      `UPDATE "vehicle_models" SET "fuel_type" = NULL WHERE "fuel_type" IN ('ethanol', 'flex')`,
    );
    await queryRunner.query(
      `ALTER TYPE "vehicle_models_fuel_type_enum" RENAME TO "vehicle_models_fuel_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "vehicle_models_fuel_type_enum" AS ENUM('gasoline', 'diesel', 'electric', 'gpl', 'hybrid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_models" ALTER COLUMN "fuel_type" TYPE "vehicle_models_fuel_type_enum" USING "fuel_type"::text::"vehicle_models_fuel_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "vehicle_models_fuel_type_enum_old"`);
  }
}
