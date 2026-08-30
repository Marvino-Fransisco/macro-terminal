export class InvalidLocaleError extends Error {
  constructor() {
    super("Invalid locale");
    this.name = "InvalidLocaleError";
  }
}
