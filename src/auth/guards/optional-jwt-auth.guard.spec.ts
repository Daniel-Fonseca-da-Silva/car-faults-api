import { User } from '../../users/entities/user.entity';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('returns the user when authentication succeeds', () => {
    const user = { id: 'user-1' } as User;

    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('returns null instead of throwing when there is no user', () => {
    expect(guard.handleRequest(null, false)).toBeNull();
  });

  it('returns null instead of throwing when authentication errors', () => {
    expect(guard.handleRequest(new Error('invalid token'), false)).toBeNull();
  });
});
