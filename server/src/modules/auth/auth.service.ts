import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { randomUUID } from 'node:crypto';
import { JwtPayload } from './jwt.strategy';

export interface JwtToken {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshSecret = this.config.getOrThrow<string>('AUTH_REFRESH_SECRET');
  }

  async register(dto: RegisterDto): Promise<JwtToken> {
    const exists = await this.userService.findByEmailWithPassword(dto.email);
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.userService.create({
      email: dto.email,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<JwtToken> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const check = await argon2.verify(user.passwordHash, dto.password);
    if (!check) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<JwtToken> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userService.findByIdWithRefreshToken(payload.sub);

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const check = await argon2.verify(user.refreshToken, refreshToken);
    if (!check) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  private async issueTokens(user: UserEntity): Promise<JwtToken> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, type: 'access' });
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        type: 'refresh',
        jti: randomUUID(),
      },
      {
        secret: this.refreshSecret,
        expiresIn: '7d',
      },
    );

    const hashRefreshToken = await argon2.hash(refreshToken);
    await this.userService.saveRefreshToken(user.id, hashRefreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
