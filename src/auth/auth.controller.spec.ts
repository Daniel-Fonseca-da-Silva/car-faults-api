import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { User } from '../users/entities/user.entity';
import { ACCESS_TOKEN_COOKIE_NAME } from './access-token-cookie.factory';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: {
    login: jest.Mock;
    resolveAccessTokenExpiryMs: jest.Mock;
  };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let res: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
    status: jest.Mock;
    send: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      resolveAccessTokenExpiryMs: jest.fn(),
    };
    config = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
    };
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = module.get(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('googleLogin', () => {
    it('does nothing itself, delegating the redirect to the guard', () => {
      expect(authController.googleLogin()).toBeUndefined();
    });
  });

  describe('googleCallback', () => {
    it('sets an httpOnly access token cookie and redirects to the web app with the state locale', () => {
      const user = { id: 'id-1' } as User;
      authService.login.mockReturnValue(
        new AuthResponseDto({ accessToken: 'signed-jwt', user: undefined }),
      );
      authService.resolveAccessTokenExpiryMs.mockReturnValue(604800000);
      const req = {
        user,
        query: { state: 'en-GB' },
      } as unknown as Request;

      authController.googleCallback(req, res as unknown as Response);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(authService.resolveAccessTokenExpiryMs).toHaveBeenCalledWith(
        'signed-jwt',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        'signed-jwt',
        expect.objectContaining({ httpOnly: true, maxAge: 604800000 }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/en-GB/auth/callback?token=signed-jwt',
      );
    });

    it('falls back to the default locale when state is missing or unsupported', () => {
      const user = { id: 'id-1' } as User;
      authService.login.mockReturnValue(
        new AuthResponseDto({ accessToken: 'signed-jwt', user: undefined }),
      );
      authService.resolveAccessTokenExpiryMs.mockReturnValue(604800000);
      const req = { user, query: {} } as unknown as Request;

      authController.googleCallback(req, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/pt-PT/auth/callback?token=signed-jwt',
      );
    });
  });

  describe('logout', () => {
    it('clears the access token cookie and returns no content', () => {
      authController.logout(res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
