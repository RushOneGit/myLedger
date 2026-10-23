import { type Currency } from './currency';
import { CurrencyMismatchError, InvalidMoneyError } from './money.errors';

// Plain decimal: optional minus, no leading zeros, no exponent, no "1." or ".5".
const AMOUNT_PATTERN = /^(-)?(0|[1-9]\d*)(?:\.(\d+))?$/;

/** Hard upper bound, mirrors the CHECK constraint on amount columns. */
export const MAX_SCALE = 18;

/**
 * Immutable amount + currency. Stored internally as an integer number of
 * 10^-scale units (bigint), so arithmetic is exact — no floats anywhere.
 *
 * The scale of the input string is preserved ("0.10" stays "0.10"),
 * which matches how Postgres `numeric` without precision/scale stores values.
 */
export class Money {
  private constructor(
    private readonly units: bigint,
    private readonly scale: number,
    readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  static of(amount: string, currency: Currency): Money {
    const match = AMOUNT_PATTERN.exec(amount);
    if (!match) {
      throw new InvalidMoneyError(`Invalid amount format: "${amount}"`);
    }

    const [, minus, integer = '', fraction = ''] = match;
    const scale = fraction.length;
    const limit = Math.min(currency.maxScale, MAX_SCALE);
    if (scale > limit) {
      throw new InvalidMoneyError(
        `${currency.code} allows at most ${String(limit)} decimal places, got ${String(scale)} in "${amount}"`,
      );
    }

    const units = BigInt(integer + fraction);
    return new Money(minus ? -units : units, scale, currency);
  }

  static zero(currency: Currency): Money {
    return new Money(0n, 0, currency);
  }

  get currencyCode(): string {
    return this.currency.code;
  }

  add(other: Money): Money {
    const [a, b, scale] = this.align(other);
    return new Money(a + b, scale, this.currency);
  }

  subtract(other: Money): Money {
    const [a, b, scale] = this.align(other);
    return new Money(a - b, scale, this.currency);
  }

  negate(): Money {
    return new Money(-this.units, this.scale, this.currency);
  }

  /** -1 | 0 | 1. Numeric comparison: "0.1" and "0.10" are equal. */
  compare(other: Money): -1 | 0 | 1 {
    const [a, b] = this.align(other);
    return a === b ? 0 : a > b ? 1 : -1;
  }

  equals(other: Money): boolean {
    return this.currencyCode === other.currencyCode && this.compare(other) === 0;
  }

  greaterThan(other: Money): boolean {
    return this.compare(other) === 1;
  }

  lessThan(other: Money): boolean {
    return this.compare(other) === -1;
  }

  isZero(): boolean {
    return this.units === 0n;
  }

  isNegative(): boolean {
    return this.units < 0n;
  }

  /** Decimal string suitable for a `numeric` column, e.g. "-12.50". */
  toString(): string {
    const negative = this.units < 0n;
    const digits = (negative ? -this.units : this.units).toString();
    if (this.scale === 0) return (negative ? '-' : '') + digits;

    const padded = digits.padStart(this.scale + 1, '0');
    const integer = padded.slice(0, -this.scale);
    const fraction = padded.slice(-this.scale);
    return `${negative ? '-' : ''}${integer}.${fraction}`;
  }

  toJSON(): { amount: string; currency: string } {
    return { amount: this.toString(), currency: this.currencyCode };
  }

  /** Brings both amounts to the same scale so their units can be combined. */
  private align(other: Money): [bigint, bigint, number] {
    if (this.currencyCode !== other.currencyCode) {
      throw new CurrencyMismatchError(this.currencyCode, other.currencyCode);
    }
    const scale = Math.max(this.scale, other.scale);
    return [
      this.units * 10n ** BigInt(scale - this.scale),
      other.units * 10n ** BigInt(scale - other.scale),
      scale,
    ];
  }
}
