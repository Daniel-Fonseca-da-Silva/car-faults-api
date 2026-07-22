import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  authThrottlerOptions,
  THROTTLER_DEFAULT_NAME,
} from '../common/throttler/throttler-options.factory';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
@Throttle({ [THROTTLER_DEFAULT_NAME]: authThrottlerOptions })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Start Google OAuth login',
    description: 'Redirects the client to the Google OAuth consent screen.',
  })
  @ApiOkResponse({ description: 'Redirects to Google OAuth consent screen' })
  googleLogin(): void {
    // Request handling is delegated to GoogleAuthGuard, which redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiOkResponse({
    description: 'User authenticated, returns access token and profile',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Google authentication failed' })
  googleCallback(@Req() req: Request): AuthResponseDto {
    return this.authService.login(req.user as User);
  }
}
