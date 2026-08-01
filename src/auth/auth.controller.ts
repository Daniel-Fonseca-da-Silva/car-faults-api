import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  authThrottlerOptions,
  THROTTLER_DEFAULT_NAME,
} from '../common/throttler/throttler-options.factory';
import { User } from '../users/entities/user.entity';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  createAccessTokenCookieOptions,
} from './access-token-cookie.factory';
import { AuthService } from './auth.service';
import { AccessTokenResponseDto } from './dto/access-token-response.dto';
import { ExchangeSessionCodeDto } from './dto/exchange-session-code.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { resolveLocale } from './locale.util';

@ApiTags('auth')
@Controller('auth')
@Throttle({ [THROTTLER_DEFAULT_NAME]: authThrottlerOptions })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

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
    description:
      'Sets an httpOnly access token cookie and redirects to the web app',
  })
  @ApiUnauthorizedResponse({ description: 'Google authentication failed' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken } = this.authService.login(req.user as User);
    const maxAge = this.authService.resolveAccessTokenExpiryMs(accessToken);

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      ...createAccessTokenCookieOptions(this.config),
      maxAge,
    });

    const code = await this.authService.createExchangeCode(accessToken);
    const locale = resolveLocale(req.query.state);
    const webAppUrl = this.config.getOrThrow<string>('WEB_APP_URL');
    res.redirect(`${webAppUrl}/${locale}/auth/callback?code=${code}`);
  }

  @Post('session/exchange')
  @ApiOperation({
    summary: 'Exchange a one-time OAuth code for the access token',
  })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired code' })
  async exchangeSessionCode(
    @Body() dto: ExchangeSessionCodeDto,
  ): Promise<AccessTokenResponseDto> {
    const accessToken = await this.authService.consumeExchangeCode(dto.code);
    return new AccessTokenResponseDto({ accessToken });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and clear the access token cookie' })
  @ApiOkResponse({ description: 'Access token cookie cleared' })
  logout(@Res() res: Response): void {
    res.clearCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      createAccessTokenCookieOptions(this.config),
    );
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
