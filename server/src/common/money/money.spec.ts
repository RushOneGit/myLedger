import { type Currency } from './currency';
import { Money } from './money';
import { CurrencyMismatchError, InvalidMoneyError } from './money.errors';

const UAH: Currency = { code: 'UAH', maxScale: 2 };
const USD: Currency = { code: 'USD', maxScale: 2 };
const BNB: Currency = { code: 'BNB', maxScale: 18 };

describe('Money', () => {
  describe('creation', () => {
    it.each(['0', '450', '-450', '0.10', '12.5', '-0.01', '999999999999999999.99'])(
      'accepts "%s"',
      (amount) => {
        expect(Money.of(amount, UAH).toString()).toBe(amount);
      },
    );

    it('accepts many decimals when the currency allows it', () => {
      expect(Money.of('0.99798707695', BNB).toString()).toBe('0.99798707695');
    });

    it.each([
      '',
      ' ',
      'abc',
      '1,5',
      '1.',
      '.5',
      '+1',
      '01',
      '1e3',
      ' 1',
      '1 ',
      '--1',
      'NaN',
      'Infinity',
    ])('rejects malformed "%s"', (amount) => {
      expect(() => Money.of(amount, UAH)).toThrow(InvalidMoneyError);
    });

    it('rejects more decimals than the currency max_scale', () => {
      expect(() => Money.of('0.001', UAH)).toThrow(InvalidMoneyError);
    });

    it('rejects more than 18 decimals even if the currency claims more', () => {
      const weird: Currency = { code: 'XXX', maxScale: 30 };
      expect(() => Money.of(`0.${'1'.repeat(19)}`, weird)).toThrow(InvalidMoneyError);
    });

    it('normalizes negative zero', () => {
      expect(Money.of('-0', UAH).toString()).toBe('0');
    });
  });

  describe('arithmetic', () => {
    it('0.10 + 0.20 = 0.30 exactly', () => {
      const sum = Money.of('0.10', USD).add(Money.of('0.20', USD));
      expect(sum.toString()).toBe('0.30');
      expect(sum.equals(Money.of('0.3', USD))).toBe(true);
    });

    it('adds amounts with different scales', () => {
      expect(Money.of('1', BNB).add(Money.of('0.000000000000000001', BNB)).toString()).toBe(
        '1.000000000000000001',
      );
    });

    it('subtracts into negative values', () => {
      expect(Money.of('0.10', UAH).subtract(Money.of('0.25', UAH)).toString()).toBe('-0.15');
    });

    it('stays exact beyond Number.MAX_SAFE_INTEGER', () => {
      const big = Money.of('9007199254740993.01', UAH);
      expect(big.add(Money.of('0.01', UAH)).toString()).toBe('9007199254740993.02');
    });

    it('negates', () => {
      expect(Money.of('12.50', UAH).negate().toString()).toBe('-12.50');
    });
  });

  describe('comparison', () => {
    it('compares numerically regardless of scale', () => {
      expect(Money.of('0.1', UAH).compare(Money.of('0.10', UAH))).toBe(0);
      expect(Money.of('0.2', UAH).compare(Money.of('0.10', UAH))).toBe(1);
      expect(Money.of('-1', UAH).compare(Money.of('0', UAH))).toBe(-1);
    });

    it('has readable helpers', () => {
      const a = Money.of('5', UAH);
      const b = Money.of('7', UAH);
      expect(a.lessThan(b)).toBe(true);
      expect(b.greaterThan(a)).toBe(true);
      expect(Money.zero(UAH).isZero()).toBe(true);
      expect(Money.of('-0.01', UAH).isNegative()).toBe(true);
    });

    it('is not equal across currencies', () => {
      expect(Money.of('1', UAH).equals(Money.of('1', USD))).toBe(false);
    });
  });

  describe('different currencies', () => {
    it.each([
      ['add', (a: Money, b: Money) => a.add(b)],
      ['subtract', (a: Money, b: Money) => a.subtract(b)],
      ['compare', (a: Money, b: Money) => a.compare(b)],
    ])('%s throws CurrencyMismatchError', (_, op) => {
      expect(() => op(Money.of('1', UAH), Money.of('1', USD))).toThrow(CurrencyMismatchError);
    });
  });

  describe('immutability', () => {
    it('operations return new instances and leave the original untouched', () => {
      const original = Money.of('1.00', UAH);
      const sum = original.add(Money.of('2.00', UAH));
      expect(sum).not.toBe(original);
      expect(original.toString()).toBe('1.00');
    });

    it('is frozen', () => {
      const money = Money.of('1.00', UAH);
      expect(Object.isFrozen(money)).toBe(true);
      expect(() => {
        (money as unknown as { units: bigint }).units = 999n;
      }).toThrow(TypeError);
    });
  });

  describe('round-trip string <-> Money', () => {
    it.each([
      '0',
      '450',
      '0.10',
      '-12.50',
      '0.99798707695',
      '123456789012345678.123456789012345678',
    ])('"%s" survives toString()', (amount) => {
      expect(Money.of(Money.of(amount, BNB).toString(), BNB).toString()).toBe(amount);
    });

    it('serializes to JSON as strings', () => {
      expect(JSON.stringify(Money.of('0.10', USD))).toBe('{"amount":"0.10","currency":"USD"}');
    });
  });
});
