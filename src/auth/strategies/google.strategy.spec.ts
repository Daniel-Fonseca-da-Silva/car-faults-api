import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from 'passport-google-oauth20';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';
import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;
  let authService: { validateGoogleProfile: jest.Mock };

  const baseProfile = {
    id: 'google-1',
    displayName: 'Ana Silva',
    emails: [{ value: 'ana@example.com', verified: true }],
    photos: [{ value: 'https://cdn.example.com/ana.jpg' }],
  } as unknown as Profile;

  beforeEach(async () => {
    authService = { validateGoogleProfile: jest.fn() };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('config-value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    googleStrategy = module.get(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(googleStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('validates the profile and calls done with the resolved user', async () => {
      const user = { id: 'id-1' } as User;
      authService.validateGoogleProfile.mockResolvedValue(user);
      const done = jest.fn();

      await googleStrategy.validate(
        'access-token',
        'refresh-token',
        baseProfile,
        done,
      );

      expect(authService.validateGoogleProfile).toHaveBeenCalledWith({
        googleId: 'google-1',
        email: 'ana@example.com',
        name: 'Ana Silva',
        avatarUrl: 'https://cdn.example.com/ana.jpg',
      });
      expect(done).toHaveBeenCalledWith(null, user);
    });

    it('falls back to a null avatarUrl when the Google profile has no photos', async () => {
      const profileWithoutPhotos = {
        ...baseProfile,
        photos: [],
      } as unknown as Profile;
      const user = { id: 'id-1' } as User;
      authService.validateGoogleProfile.mockResolvedValue(user);
      const done = jest.fn();

      await googleStrategy.validate(
        'access-token',
        'refresh-token',
        profileWithoutPhotos,
        done,
      );

      expect(authService.validateGoogleProfile).toHaveBeenCalledWith({
        googleId: 'google-1',
        email: 'ana@example.com',
        name: 'Ana Silva',
        avatarUrl: null,
      });
      expect(done).toHaveBeenCalledWith(null, user);
    });

    it('calls done with an error when the Google profile has no email', async () => {
      const profileWithoutEmail = {
        ...baseProfile,
        emails: [],
      } as unknown as Profile;
      const done = jest.fn();

      await googleStrategy.validate(
        'access-token',
        'refresh-token',
        profileWithoutEmail,
        done,
      );

      expect(authService.validateGoogleProfile).not.toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
