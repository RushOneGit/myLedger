import { Check, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum CurrencyKindEnum {
  Fiat = 'Fiat',
  Crypto = 'Crypto',
}

@Entity('currencies')
@Check('CHK_max_scale_currencies', '"max_scale" BETWEEN 0 AND 18')
export class CurrencyEntity {
  @PrimaryColumn({
    name: 'code',
    type: 'varchar',
    length: 10,
    comment: 'UAH, USD, BTC, USDT',
  })
  code: string;

  @Column({
    name: 'name',
    type: 'text',
  })
  name: string;

  @Column({
    name: 'kind',
    type: 'enum',
    enum: CurrencyKindEnum,
  })
  kind: CurrencyKindEnum;

  @Column({
    name: 'max_scale',
    type: 'smallint',
    comment: 'max digits after the decimal point: UAH 2, BTC 8',
  })
  maxScale: number;

  @Column({
    name: 'iso_numeric',
    type: 'smallint',
    nullable: true,
    unique: true,
    comment: 'ISO 4217 numeric code, used by Mono (980 = UAH); null for crypto',
  })
  isoNumeric: number | null;

  @Column({
    name: 'symbol',
    type: 'text',
    nullable: true,
  })
  symbol: string | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
