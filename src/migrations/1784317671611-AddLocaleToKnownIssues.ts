import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddLocaleToKnownIssues1784317671611 implements MigrationInterface {
  name = 'AddLocaleToKnownIssues1784317671611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'known_issues',
      new TableColumn({
        name: 'locale',
        type: 'varchar',
        isNullable: false,
        default: `'en-GB'`,
      }),
    );

    await queryRunner.createIndex(
      'known_issues',
      new TableIndex({
        name: 'idx_known_issues_vehicle_model_id_locale',
        columnNames: ['vehicle_model_id', 'locale'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'known_issues',
      'idx_known_issues_vehicle_model_id_locale',
    );
    await queryRunner.dropColumn('known_issues', 'locale');
  }
}
