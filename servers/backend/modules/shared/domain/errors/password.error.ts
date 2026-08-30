export class InvalidPasswordError extends Error {
  constructor() {
    super("Password must contain at least one letter, one number, and one symbol");
    this.name = "InvalidPasswordError";
  }
}
