import { instanceToPlain } from 'class-transformer';
import { AuthResponseDto } from './auth-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

describe('AuthResponseDto', () => {
  it('assigns the given partial to its own properties', () => {
    const user = new UserResponseDto({
      id: 'id-1',
      email: 'ana@example.com',
      name: 'Ana Silva',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    } as never);

    const dto = new AuthResponseDto({ accessToken: 'token-1', user });

    expect(dto.accessToken).toBe('token-1');
    expect(dto.user).toBe(user);
  });

  it('serializes the nested user through the @Type(() => UserResponseDto) transform', () => {
    const user = new UserResponseDto({
      id: 'id-1',
      email: 'ana@example.com',
      name: 'Ana Silva',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    } as never);
    const dto = new AuthResponseDto({ accessToken: 'token-1', user });

    const plain = instanceToPlain(dto, { excludeExtraneousValues: true });

    expect(plain).toMatchObject({
      accessToken: 'token-1',
      user: { id: 'id-1', email: 'ana@example.com', name: 'Ana Silva' },
    });
  });
});
