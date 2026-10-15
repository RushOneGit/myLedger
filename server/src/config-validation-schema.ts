import JOI from 'joi';
import { EnvironmentEnum } from './enums';

export const configValidationSchema = JOI.object({
  NODE_ENV: JOI.string().valid(EnvironmentEnum).default(EnvironmentEnum.Dev),
  APP_PORT: JOI.number().port().required(),
  DATABASE_HOST: JOI.string().hostname().required(),
  DATABASE_USER: JOI.string().required(),
  DATABASE_PASSWORD: JOI.string().required(),
  DATABASE_NAME: JOI.string().required(),
  REDIS_HOST: JOI.string().hostname().required(),
  REDIS_PORT: JOI.number().port().required(),
  RABBITMQ_HOST: JOI.string().hostname().required(),
  RABBITMQ_PORT: JOI.number().port().required(),
  RABBITMQ_USER: JOI.string().required(),
  RABBITMQ_PASSWORD: JOI.string().required(),
});
