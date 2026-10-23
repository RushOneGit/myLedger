export class InvalidMoneyError extends Error {
  override readonly name = 'InvalidMoneyError';
}

export class CurrencyMismatchError extends Error {
  override readonly name = 'CurrencyMismatchError';

  constructor(left: string, right: string) {
    super(`Cannot combine ${left} with ${right}`);
  }
}

export class UnknownCurrencyError extends Error {
  override readonly name = 'UnknownCurrencyError';

  constructor(code: string | number) {
    super(`Unknown currency: ${String(code)}`);
  }
}
