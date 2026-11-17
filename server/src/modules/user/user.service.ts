import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from './user.entity';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { UserAbstractRepository } from './user.abstract.repository';

export type CreateUserInput = Pick<UserEntity, 'email' | 'passwordHash'>;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserAbstractRepository,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(dto: CreateUserInput): Promise<UserEntity> {
    this.logger.log('Create new User', UserService);

    const exists = await this.userRepository.findOneByEmail(dto.email);
    if (exists) throw new ConflictException('User already exists');

    return this.userRepository.create(dto);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    this.logger.log('Find user by email', UserService);
    if (!email) throw new BadRequestException('Email is required');

    const user = await this.userRepository.findOneByEmail(email);
    if (!user) throw new NotFoundException('User is not found');
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOneByEmailWithPassword(email);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOneByIdWithRefreshToken(id);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOneById(id);
    if (!user) throw new NotFoundException('User is not found');
    return user;
  }

  async saveRefreshToken(id: string, refreshToken: string): Promise<void> {
    this.logger.log('Save refresh token', UserService);

    await this.userRepository.updateRefreshToken(id, refreshToken);
  }
}
