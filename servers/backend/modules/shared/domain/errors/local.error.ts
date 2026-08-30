import { MAX_LOCALE_LENGTH } from "../../constants";

export class InvalidLocaleError extends Error {
  constructor() {
    super("Invalid locale");
    this.name = "InvalidLocaleError";
  }
}

export class LocaleTooLongError extends Error {
  constructor() {
    super(`Locale must be less than ${MAX_LOCALE_LENGTH} characters long`);
    this.name = "LocaleTooLongError";
  }
}
