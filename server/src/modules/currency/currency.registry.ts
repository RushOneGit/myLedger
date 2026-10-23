import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Money, UnknownCurrencyError } from '../../common/money';
import { CurrencyEntity, type CurrencyKindEnum } from './currency.entity';

export interface RegisteredCurrency {
  readonly code: string;
  readonly name: string;
  readonly kind: CurrencyKindEnum;
  readonly maxScale: number;
  readonly isoNumeric: number | null;
  readonly symbol: string | null;
}

/**
 * In-memory copy of the `currencies` table, loaded once at startup.
 * Currencies change only via migrations, so there is no need to hit the DB per lookup.
 */
@Injectable()
export class CurrencyRegistry implements OnModuleInit {
  private readonly logger = new Logger(CurrencyRegistry.name);
  private byCode = new Map<string, RegisteredCurrency>();
  private byIsoNumeric = new Map<number, RegisteredCurrency>();

  constructor(
    @InjectRepository(CurrencyEntity)
    private readonly currencyRepository: Repository<CurrencyEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    const rows = await this.currencyRepository.find();
    const byCode = new Map<string, RegisteredCurrency>();
    const byIsoNumeric = new Map<number, RegisteredCurrency>();

    for (const row of rows) {
      const currency: RegisteredCurrency = Object.freeze({
        code: row.code,
        name: row.name,
        kind: row.kind,
        maxScale: row.maxScale,
        isoNumeric: row.isoNumeric,
        symbol: row.symbol,
      });
      byCode.set(currency.code, currency);
      if (currency.isoNumeric !== null) byIsoNumeric.set(currency.isoNumeric, currency);
    }

    this.byCode = byCode;
    this.byIsoNumeric = byIsoNumeric;
    this.logger.log(`Loaded ${String(byCode.size)} currencies`);
  }

  get(code: string): RegisteredCurrency {
    const currency = this.byCode.get(code);
    if (!currency) throw new UnknownCurrencyError(code);
    return currency;
  }

  has(code: string): boolean {
    return this.byCode.has(code);
  }

  /** Mono sends ISO 4217 numeric codes: 980 → UAH, 840 → USD. */
  getByIsoNumeric(isoNumeric: number): RegisteredCurrency {
    const currency = this.byIsoNumeric.get(isoNumeric);
    if (!currency) throw new UnknownCurrencyError(isoNumeric);
    return currency;
  }

  all(): RegisteredCurrency[] {
    return [...this.byCode.values()];
  }

  /** Preferred way to build Money: guarantees the currency is known. */
  money(amount: string, code: string): Money {
    return Money.of(amount, this.get(code));
  }
}
