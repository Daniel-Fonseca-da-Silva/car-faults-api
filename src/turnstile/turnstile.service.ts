import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errorMessage } from '../redis/redis-error.util';

export const TURNSTILE_REQUIRED_ERROR_CODE = 'TURNSTILE_REQUIRED';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService) {}

  async assertValid(
    token: string | undefined,
    remoteIp?: string,
  ): Promise<void> {
    if (this.config.get<string>('TURNSTILE_ENABLED') === 'false') {
      return;
    }

    if (!token) {
      throw this.forbidden();
    }

    const secret = this.config.getOrThrow<string>('TURNSTILE_SECRET_KEY');
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    let response: Response;
    try {
      response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch (error) {
      this.logger.warn(
        `Turnstile siteverify request failed: ${errorMessage(error)}`,
      );
      throw this.forbidden();
    }

    if (!response.ok) {
      this.logger.warn(
        `Turnstile siteverify responded with status ${response.status}`,
      );
      throw this.forbidden();
    }

    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) {
      throw this.forbidden();
    }
  }

  private forbidden(): ForbiddenException {
    return new ForbiddenException({
      message: 'A valid Turnstile token is required',
      code: TURNSTILE_REQUIRED_ERROR_CODE,
    });
  }
}
