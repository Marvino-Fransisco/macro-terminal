import { CURRENCY_LENGTH, SUPPORTED_CURRENCIES } from "../../constants/currency.const";
import { InvalidCurrencyLengthError, UnsupportedCurrencyError } from "../errors/currency.error";

export type Currency = typeof SUPPORTED_CURRENCIES[number];

export function createCurrency(value: string): Currency {
  const normalized = value.trim().toUpperCase();

  if (normalized.length !== CURRENCY_LENGTH) {
    throw new InvalidCurrencyLengthError();
  }

  if (!SUPPORTED_CURRENCIES.includes(normalized as Currency)) {
    throw new UnsupportedCurrencyError();
  }

  return normalized as Currency;
}
