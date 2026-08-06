import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleToUsers1784317671615 implements MigrationInterface {
  name = 'AddRoleToUsers1784317671615';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['user', 'admin'],
        enumName: 'users_role_enum',
        isNullable: false,
        default: `'user'`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'role');
    await queryRunner.query('DROP TYPE IF EXISTS "users_role_enum"');
  }
}
