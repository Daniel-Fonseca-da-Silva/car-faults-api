import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  createOAuthStateCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_MS,
  oauthStatesMatch,
  parseOAuthState,
} from '../oauth-state';

const CALLBACK_PATH_SUFFIX = '/callback';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const state = request.query.state;
    const cookieOptions = createOAuthStateCookieOptions(this.config);

    if (request.path.endsWith(CALLBACK_PATH_SUFFIX)) {
      const expectedState = request.cookies?.[OAUTH_STATE_COOKIE_NAME] as
        string | undefined;
      response.clearCookie(OAUTH_STATE_COOKIE_NAME, cookieOptions);

      if (!parseOAuthState(state) || !oauthStatesMatch(expectedState, state)) {
        throw new UnauthorizedException('Invalid OAuth state');
      }
    } else {
      if (!parseOAuthState(state)) {
        throw new BadRequestException('Invalid OAuth state');
      }

      response.cookie(OAUTH_STATE_COOKIE_NAME, state, {
        ...cookieOptions,
        maxAge: OAUTH_STATE_MAX_AGE_MS,
      });
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions(
    context: ExecutionContext,
  ): { state: string } | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query.state;
    return typeof state === 'string' ? { state } : undefined;
  }
}
