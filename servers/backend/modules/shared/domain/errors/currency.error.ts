import { CURRENCY_LENGTH } from "../../constants";

export class UnsupportedCurrencyError extends Error {
  constructor() {
    super("Unsupported currency");
    this.name = "UnsupportedCurrencyError";
  }
}

export class InvalidCurrencyLengthError extends Error {
  constructor() {
    super(`Currency must be exactly ${CURRENCY_LENGTH} characters long`);
    this.name = "InvalidCurrencyLengthError";
  }
}
