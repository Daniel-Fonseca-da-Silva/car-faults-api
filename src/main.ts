import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3005;
const SWAGGER_PATH = 'docs';
const API_TITLE = 'Car Faults API';
const API_DESCRIPTION =
  'API for chronic vehicle reliability by make, model, year and engine';
const API_VERSION = '1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(API_VERSION)
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument);

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}
void bootstrap();
