import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  let service: TurnstileService;
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    config = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue('secret-key'),
    };
    service = new TurnstileService(config as unknown as ConfigService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('assertValid', () => {
    it('resolves when siteverify returns success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as unknown as Response);

      await expect(service.assertValid('good-token')).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'secret=secret-key&response=good-token',
        },
      );
    });

    it('includes the remote IP when provided', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as unknown as Response);

      await service.assertValid('good-token', '203.0.113.1');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'secret=secret-key&response=good-token&remoteip=203.0.113.1',
        },
      );
    });

    it('throws ForbiddenException when no token is given', async () => {
      await expect(service.assertValid(undefined)).rejects.toThrow(
        ForbiddenException,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when siteverify returns success: false', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: false }),
      } as unknown as Response);

      await expect(service.assertValid('bad-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when siteverify responds with a non-ok status', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: jest.fn(),
      } as unknown as Response);

      await expect(service.assertValid('any-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when the siteverify request rejects', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));

      await expect(service.assertValid('any-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('bypasses verification when TURNSTILE_ENABLED is "false"', async () => {
      config.get.mockReturnValue('false');

      await expect(service.assertValid(undefined)).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
