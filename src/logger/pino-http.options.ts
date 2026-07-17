import { IncomingMessage } from 'node:http';
import type { Options } from 'pino-http';

const PRODUCTION_ENV = 'production';
const HEALTH_PATH_SEGMENT = '/health';

const SENSITIVE_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
] as const;

export const isProductionEnvironment = (
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean => nodeEnv === PRODUCTION_ENV;

export const shouldIgnoreHttpAutoLog = (req: IncomingMessage): boolean =>
  req.url?.includes(HEALTH_PATH_SEGMENT) ?? false;

export const createPinoHttpOptions = (
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Options => {
  const isProduction = isProductionEnvironment(nodeEnv);

  return {
    level: isProduction ? 'info' : 'debug',
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
          },
        },
    redact: [...SENSITIVE_PATHS],
    autoLogging: {
      ignore: shouldIgnoreHttpAutoLog,
    },
    serializers: {
      req: (req: IncomingMessage & { id?: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode?: number }) => ({
        statusCode: res.statusCode,
      }),
    },
  };
};
