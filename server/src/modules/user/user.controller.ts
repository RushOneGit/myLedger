import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly userService: UserService,
  ) {}

  @Post('create')
  create(@Body() dto: CreateUserDto): Promise<UserEntity> {
    return this.userService.create(dto);
  }

  // @Get()
  // list() {
  //   this.logger.log('test console-log', UserController.name);
  //   return '';
  // }
}
