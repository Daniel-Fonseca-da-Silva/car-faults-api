import { ExecutionContext } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(() => {
    guard = new GoogleAuthGuard();
  });

  function contextWithQuery(query: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ query }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('getAuthenticateOptions', () => {
    it('forwards the state query param to Google so it round-trips to the callback', () => {
      const context = contextWithQuery({ state: 'en-GB' });

      expect(guard.getAuthenticateOptions(context)).toEqual({
        state: 'en-GB',
      });
    });

    it('returns undefined when there is no state query param', () => {
      const context = contextWithQuery({});

      expect(guard.getAuthenticateOptions(context)).toBeUndefined();
    });

    it('returns undefined when state is not a string', () => {
      const context = contextWithQuery({ state: ['en-GB'] });

      expect(guard.getAuthenticateOptions(context)).toBeUndefined();
    });
  });
});
