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
import { AuthResponseDto } from './dto/auth-response.dto';
import { ExchangeSessionCodeDto } from './dto/exchange-session-code.dto';
import { GoogleMobileLoginDto } from './dto/google-mobile-login.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { resolveLocale } from './locale.util';
import { parseOAuthState } from './oauth-state';

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
    // GoogleAuthGuard has already checked the state against the browser cookie.
    const state = req.query.state as string;
    const locale = resolveLocale(parseOAuthState(state)?.locale);
    const webAppUrl = this.config.getOrThrow<string>('WEB_APP_URL');
    // The web app re-checks `state` against its own cookie before exchanging
    // the code, so a leaked callback URL cannot log another browser in.
    res.redirect(
      `${webAppUrl}/${locale}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    );
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

  @Post('google/mobile')
  @ApiOperation({
    summary: 'Log in with a Google ID token issued to the mobile app',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid Google ID token' })
  async googleMobileLogin(
    @Body() dto: GoogleMobileLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogleMobileIdToken(dto.idToken);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Log out, revoke the access token and clear its cookie',
  })
  @ApiOkResponse({ description: 'Access token revoked and cookie cleared' })
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const accessToken = this.extractAccessToken(req);
    if (accessToken) {
      await this.authService.revokeAccessToken(accessToken);
    }

    res.clearCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      createAccessTokenCookieOptions(this.config),
    );
    res.status(HttpStatus.NO_CONTENT).send();
  }

  private extractAccessToken(req: Request): string | null {
    const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME] as
      string | undefined;
    if (cookieToken) {
      return cookieToken;
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    return null;
  }
}
