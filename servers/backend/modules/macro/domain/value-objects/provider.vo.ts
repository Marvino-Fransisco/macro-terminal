import { PROVIDERS } from "../../constants/provider.const";
import { InvalidProviderError } from "../errors/invalid-provider.error";

export type Provider = typeof PROVIDERS[number];

export function createProvider(value: string): Provider {
  if (!PROVIDERS.includes(value as Provider)) {
    throw new InvalidProviderError(value);
  }
  return value as Provider;
}
