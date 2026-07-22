import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToUsers1784317671602 implements MigrationInterface {
  name = 'AddDeletedAtToUsers1784317671602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'deleted_at');
  }
}
