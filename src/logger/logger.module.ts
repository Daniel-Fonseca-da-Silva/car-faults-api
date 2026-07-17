import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { createPinoHttpOptions } from './pino-http.options';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: createPinoHttpOptions(),
    }),
  ],
})
export class LoggerModule {}
