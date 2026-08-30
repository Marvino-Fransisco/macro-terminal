export class UnsupportedCurrencyError extends Error {
  constructor() {
    super("Unsupported currency");
    this.name = "UnsupportedCurrencyError";
  }
}
