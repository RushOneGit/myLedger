import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserAbstractRepository } from './user.abstract.repository';
import { TypeOrmUserRepository } from './typeorm-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [UserService, { provide: UserAbstractRepository, useClass: TypeOrmUserRepository }],
  exports: [UserService],
})
export class UserModule {}
