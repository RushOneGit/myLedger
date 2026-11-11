import { PickType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';

export class UpdateNameAccountDto extends PickType(CreateAccountDto, ['name']) {}
