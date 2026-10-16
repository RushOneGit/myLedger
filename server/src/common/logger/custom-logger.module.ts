import { Global, Module } from '@nestjs/common';
import { CustomLoggerService } from './custom-logger.service';

@Global() // hint don't need to import it everywhere
@Module({
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class CustomLoggerModule {}
