import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreateReviews1784317671607 implements MigrationInterface {
  name = 'CreateReviews1784317671607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'known_issue_id',
            type: 'uuid',
          },
          {
            name: 'rating',
            type: 'int',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'uq_reviews_user_id_known_issue_id',
            columnNames: ['user_id', 'known_issue_id'],
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_reviews_rating_range',
            expression: 'rating >= 1 AND rating <= 5',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'fk_reviews_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'fk_reviews_known_issue_id',
        columnNames: ['known_issue_id'],
        referencedTableName: 'known_issues',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('reviews', 'fk_reviews_known_issue_id');
    await queryRunner.dropForeignKey('reviews', 'fk_reviews_user_id');
    await queryRunner.dropTable('reviews');
  }
}
