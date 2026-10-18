export class ConfirmPasswordMismatchError extends Error {
  constructor() {
    super("Confirm password does not match");
    this.name = "ConfirmPasswordMismatchError";
  }
}
