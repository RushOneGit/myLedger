import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    this.logger.log('Create new User', UserService);

    const exists = await this.userRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('User already exists');

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    this.logger.log('Find user by email', UserService);
    if (!email) new BadRequestException('Email is required');

    const user = await this.userRepository.findOneBy({ email });
    if (!user) new NotFoundException('User is not found');
    return user;
  }
}
