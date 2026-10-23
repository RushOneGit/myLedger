/**
 * The minimum Money needs to know about a currency.
 * Real instances come from CurrencyRegistry, which only hands out currencies
 * that exist in the `currencies` table — that is how "known currency" is enforced.
 */
export interface Currency {
  readonly code: string;
  /** Max digits after the decimal point allowed for this currency. */
  readonly maxScale: number;
}
