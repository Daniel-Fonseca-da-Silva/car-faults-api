import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { createCorsOptions } from './common/cors/cors-options.factory';
import { isProductionEnvironment } from './logger/pino-http.options';

const SWAGGER_PATH = 'docs';
const API_TITLE = 'Auto Crónica API';
const API_DESCRIPTION =
  'API for chronic vehicle reliability by make, model, year and engine';
const API_VERSION = '1';
// Railway fronts the app with a single edge proxy. A hop count (instead of
// `true`) keeps clients from spoofing req.ip via their own X-Forwarded-For.
const DEFAULT_TRUST_PROXY_HOPS = 1;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  // Without this, req.ip is the proxy's address: every client would share the
  // same throttler bucket and Turnstile would receive the wrong remoteip.
  app.set(
    'trust proxy',
    Number(config.get<string>('TRUST_PROXY_HOPS') || DEFAULT_TRUST_PROXY_HOPS),
  );

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.enableCors(createCorsOptions(config.getOrThrow<string>('CORS_ORIGINS')));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger lists every route (admin included), so keep it out of production.
  if (!isProductionEnvironment()) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(API_TITLE)
      .setDescription(API_DESCRIPTION)
      .setVersion(API_VERSION)
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument);
  }

  await app.listen(config.getOrThrow<string>('PORT'));
}
void bootstrap();
