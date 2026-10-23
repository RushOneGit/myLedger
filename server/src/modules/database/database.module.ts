import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ReadableNamingStrategy } from '../../database/naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        autoLoadEntities: true, // tells NestJS to automatically collect all the entities you register via TypeOrmModule.forFeature([...])
        namingStrategy: new ReadableNamingStrategy(), // keep in sync with src/database/data-source.ts
        synchronize: false, // ⚠️ never true — schema changes ONLY through migrations
      }),
    }),
  ],
})
export class DatabaseModule {}
