export type AuthProvider = "google";

export function createProvider(value: string): AuthProvider {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue !== "google") {
    throw new Error("Invalid provider");
  }

  return normalizedValue as AuthProvider;
}
