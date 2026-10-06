import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropFixesEstimatedCostEur1784317671620 implements MigrationInterface {
  name = 'DropFixesEstimatedCostEur1784317671620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('fixes', 'estimated_cost_eur');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'fixes',
      new TableColumn({
        name: 'estimated_cost_eur',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
  }
}
