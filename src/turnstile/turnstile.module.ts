import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

@Module({
  imports: [ConfigModule],
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class TurnstileModule {}
