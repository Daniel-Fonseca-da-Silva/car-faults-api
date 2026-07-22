import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';

export interface GoogleProfileData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleProfile(profile: GoogleProfileData): Promise<User> {
    const existingUser = await this.usersService.findOptionalByGoogleId(
      profile.googleId,
    );
    if (existingUser) {
      return existingUser;
    }

    return this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
    });
  }

  login(user: User): AuthResponseDto {
    const accessToken = this.jwtService.sign({ sub: user.id });
    return new AuthResponseDto({
      accessToken,
      user: new UserResponseDto(user),
    });
  }
}
