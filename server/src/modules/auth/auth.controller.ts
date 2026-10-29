import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService, JwtToken } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<JwtToken> {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto): Promise<JwtToken> {
    return this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<JwtToken> {
    return this.authService.refresh(refreshToken);
  }
}
