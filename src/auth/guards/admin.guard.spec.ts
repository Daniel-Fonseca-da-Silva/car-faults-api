import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  function contextWithUser(user: Partial<User> | undefined): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access for an admin user', () => {
    const context = contextWithUser({ role: UserRole.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException for a non-admin user', () => {
    const context = contextWithUser({ role: UserRole.USER });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when there is no user on the request', () => {
    const context = contextWithUser(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
