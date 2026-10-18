import { InvalidFeatureCodeError } from "../errors/invalid-feature-code.error";

export type FeatureCode = string & { readonly __brand: "FeatureCode" };

export function createFeatureCode(value: string): FeatureCode {
  if (!/^[A-Z][A-Z0-9_]{1,79}(:[a-z][a-z0-9_]{0,39})?$/.test(value)) {
    throw new InvalidFeatureCodeError(value);
  }
  return value as FeatureCode;
}
