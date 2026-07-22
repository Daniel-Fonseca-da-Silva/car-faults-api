import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { login: jest.Mock };

  beforeEach(async () => {
    authService = { login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
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
    it('returns the auth response for the authenticated user', () => {
      const user = { id: 'id-1' } as User;
      const authResponse = new AuthResponseDto({
        accessToken: 'signed-jwt',
        user: undefined,
      });
      authService.login.mockReturnValue(authResponse);
      const req = { user } as unknown as Request;

      const result = authController.googleCallback(req);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toBe(authResponse);
    });
  });
});
