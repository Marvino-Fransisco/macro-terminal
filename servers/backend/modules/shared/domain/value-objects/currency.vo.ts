import { SUPPORTED_CURRENCIES } from "../../constants/supported-currencies.const";

export type Currency = string & {
  readonly __brand: "Currency";
};

export function createCurrency(value: string): Currency {
  const normalized = value.trim().toUpperCase();

  if (!SUPPORTED_CURRENCIES.has(normalized)) {
    throw new Error("Unsupported currency");
  }

  return normalized as Currency;
}
