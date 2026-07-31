import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(
    context: ExecutionContext,
  ): { state: string } | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query.state;
    return typeof state === 'string' ? { state } : undefined;
  }
}
