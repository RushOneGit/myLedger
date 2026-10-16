import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly logger: CustomLoggerService) {}

  @Get()
  list() {
    this.logger.log('test console-log', UserController.name);
    return '';
  }
}
