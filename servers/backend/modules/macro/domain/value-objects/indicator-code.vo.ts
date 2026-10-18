import { InvalidIndicatorCodeError } from "../errors/invalid-indicator-code.error";

export type IndicatorCode = string & { readonly __brand: "IndicatorCode" };

export function createIndicatorCode(value: string): IndicatorCode {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,79}$/.test(normalized)) {
    throw new InvalidIndicatorCodeError(value);
  }
  return normalized as IndicatorCode;
}
