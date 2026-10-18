export class InvalidProviderError extends Error {
  constructor(value: string) {
    super(`Invalid provider: ${value}`);
    this.name = "InvalidProviderError";
  }
}
