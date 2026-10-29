import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

export type CreateUserInput = Pick<UserEntity, 'email' | 'passwordHash'>;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(dto: CreateUserInput): Promise<UserEntity> {
    this.logger.log('Create new User', UserService);

    const exists = await this.userRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('User already exists');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    this.logger.log('Find user by email', UserService);
    if (!email) throw new BadRequestException('Email is required');

    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new NotFoundException('User is not found');
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  async findByIdWithRefreshToken(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      select: { id: true, email: true, refreshToken: true },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User is not found');
    return user;
  }

  async saveRefreshToken(id: string, refreshToken: string): Promise<void> {
    this.logger.log('Save refresh token', UserService);

    await this.userRepository.update(id, { refreshToken });
  }
}
