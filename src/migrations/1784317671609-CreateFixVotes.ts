import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFixVotes1784317671609 implements MigrationInterface {
  name = 'CreateFixVotes1784317671609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fix_votes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'fix_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'value',
            type: 'enum',
            enum: ['like', 'dislike'],
            enumName: 'fix_votes_value_enum',
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
            name: 'uq_fix_votes_fix_id_user_id',
            columnNames: ['fix_id', 'user_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'fix_votes',
      new TableForeignKey({
        name: 'fk_fix_votes_fix_id',
        columnNames: ['fix_id'],
        referencedTableName: 'fixes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'fix_votes',
      new TableForeignKey({
        name: 'fk_fix_votes_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('fix_votes', 'fk_fix_votes_user_id');
    await queryRunner.dropForeignKey('fix_votes', 'fk_fix_votes_fix_id');
    await queryRunner.dropTable('fix_votes');
  }
}
