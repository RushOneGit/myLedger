import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAbstractRepository } from './user.abstract.repository';
import { UserEntity } from './user.entity';

@Injectable()
export class TypeOrmUserRepository extends UserAbstractRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  findOneById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOneBy({ email });
  }

  findOneByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  findOneByIdWithRefreshToken(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      select: { id: true, email: true, refreshToken: true },
    });
  }

  create(data: Pick<UserEntity, 'email' | 'passwordHash'>): Promise<UserEntity> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.userRepository.update(id, { refreshToken });
  }
}
