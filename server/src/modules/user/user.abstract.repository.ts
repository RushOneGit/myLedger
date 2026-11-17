import { type UserEntity } from './user.entity';

export abstract class UserAbstractRepository {
  abstract findOneById(id: string): Promise<UserEntity | null>;
  abstract findOneByEmail(email: string): Promise<UserEntity | null>;
  /** Includes `passwordHash`, which is not selected by default. */
  abstract findOneByEmailWithPassword(email: string): Promise<UserEntity | null>;
  /** Includes `refreshToken`, which is not selected by default. */
  abstract findOneByIdWithRefreshToken(id: string): Promise<UserEntity | null>;
  abstract create(data: Pick<UserEntity, 'email' | 'passwordHash'>): Promise<UserEntity>;
  abstract updateRefreshToken(id: string, refreshToken: string): Promise<void>;
}
