import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageUrlToComments1784317671614 implements MigrationInterface {
  name = 'AddImageUrlToComments1784317671614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'comments',
      new TableColumn({
        name: 'image_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('comments', 'image_url');
  }
}
