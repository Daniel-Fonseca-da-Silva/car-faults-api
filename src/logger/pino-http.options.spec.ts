import { IncomingMessage } from 'node:http';
import {
  createPinoHttpOptions,
  isProductionEnvironment,
  shouldIgnoreHttpAutoLog,
} from './pino-http.options';

describe('pino-http.options', () => {
  describe('isProductionEnvironment', () => {
    it('returns true when NODE_ENV is production', () => {
      expect(isProductionEnvironment('production')).toBe(true);
    });

    it('returns false for non-production environments', () => {
      expect(isProductionEnvironment('development')).toBe(false);
      expect(isProductionEnvironment(undefined)).toBe(false);
    });
  });

  describe('shouldIgnoreHttpAutoLog', () => {
    it('ignores health check requests', () => {
      const request = { url: '/v1/health' } as IncomingMessage;

      expect(shouldIgnoreHttpAutoLog(request)).toBe(true);
    });

    it('does not ignore other requests', () => {
      const request = { url: '/v1/vehicles' } as IncomingMessage;

      expect(shouldIgnoreHttpAutoLog(request)).toBe(false);
    });

    it('does not ignore when url is missing', () => {
      const request = {} as IncomingMessage;

      expect(shouldIgnoreHttpAutoLog(request)).toBe(false);
    });
  });

  describe('createPinoHttpOptions', () => {
    it('uses debug level and pino-pretty outside production', () => {
      const options = createPinoHttpOptions('development');

      expect(options.level).toBe('debug');
      expect(options.transport).toEqual({
        target: 'pino-pretty',
        options: {
          singleLine: true,
          colorize: true,
        },
      });
    });

    it('uses info level and no transport in production', () => {
      const options = createPinoHttpOptions('production');

      expect(options.level).toBe('info');
      expect(options.transport).toBeUndefined();
    });

    it('redacts sensitive request headers', () => {
      const options = createPinoHttpOptions('production');

      expect(options.redact).toEqual([
        'req.headers.authorization',
        'req.headers.cookie',
      ]);
    });

    it('serializes requests to id, method and url', () => {
      const options = createPinoHttpOptions('production');
      const request = {
        id: 'req-1',
        method: 'GET',
        url: '/v1/health',
      } as IncomingMessage & { id?: string };

      expect(
        (
          options.serializers as {
            req: (req: typeof request) => unknown;
          }
        ).req(request),
      ).toEqual({
        id: 'req-1',
        method: 'GET',
        url: '/v1/health',
      });
    });

    it('serializes responses to statusCode', () => {
      const options = createPinoHttpOptions('production');
      const response = { statusCode: 200 };

      expect(
        (
          options.serializers as {
            res: (res: typeof response) => unknown;
          }
        ).res(response),
      ).toEqual({ statusCode: 200 });
    });
  });
});
