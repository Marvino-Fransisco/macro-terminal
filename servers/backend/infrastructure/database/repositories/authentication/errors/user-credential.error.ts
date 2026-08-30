export class FailedToCreateUserCredentialError extends Error {
  constructor() {
    super("Failed to create user credential");
    this.name = "FailedToCreateUserCredentialError";
  }
}
