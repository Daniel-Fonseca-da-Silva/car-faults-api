import { getMetadataArgsStorage } from 'typeorm';
import { User } from './user.entity';

describe('User entity', () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === User,
  );

  const findColumn = (propertyName: string) =>
    columns.find((column) => column.propertyName === propertyName);

  it('maps to the "users" table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === User,
    );

    expect(table?.name).toBe('users');
  });

  it('defines id as a generated uuid primary column', () => {
    const idColumn = findColumn('id');
    expect(idColumn?.options.primary).toBe(true);

    const generated = getMetadataArgsStorage().generations.find(
      (generation) =>
        generation.target === User && generation.propertyName === 'id',
    );
    expect(generated?.strategy).toBe('uuid');
  });

  it('defines email as a required unique column', () => {
    const column = findColumn('email');
    expect(column).toBeDefined();
    expect(column?.options.unique).toBe(true);
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines name as a plain required column', () => {
    const column = findColumn('name');
    expect(column).toBeDefined();
    expect(column?.options.unique).toBeFalsy();
    expect(column?.options.nullable).toBeFalsy();
  });

  it('defines googleId as a nullable unique column mapped to google_id', () => {
    const column = findColumn('googleId');
    expect(column?.options.name).toBe('google_id');
    expect(column?.options.nullable).toBe(true);
    expect(column?.options.unique).toBe(true);
  });

  it('defines avatarUrl as a nullable column mapped to avatar_url', () => {
    const column = findColumn('avatarUrl');
    expect(column?.options.name).toBe('avatar_url');
    expect(column?.options.nullable).toBe(true);
  });

  it('does not define a gender column', () => {
    expect(findColumn('gender')).toBeUndefined();
  });

  it('maps createdAt/updatedAt to snake_case columns', () => {
    expect(findColumn('createdAt')?.options.name).toBe('created_at');
    expect(findColumn('updatedAt')?.options.name).toBe('updated_at');
  });
});
