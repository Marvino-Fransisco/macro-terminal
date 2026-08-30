import { SUPPORTED_CURRENCIES } from "../../constants/currency.const";
import { UnsupportedCurrencyError } from "../errors/currency.error";

export type Currency = typeof SUPPORTED_CURRENCIES[number];

export function createCurrency(value: string): Currency {
  const normalized = value.trim().toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(normalized as Currency)) {
    throw new UnsupportedCurrencyError();
  }

  return normalized as Currency;
}
