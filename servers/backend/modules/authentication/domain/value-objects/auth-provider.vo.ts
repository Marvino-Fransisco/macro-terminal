import { InvalidAuthProviderError } from "../errors/auth-provider.error";

export type AuthProvider = "google";

export function createProvider(value: string): AuthProvider {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue !== "google") {
    throw new InvalidAuthProviderError();
  }

  return normalizedValue as AuthProvider;
}
