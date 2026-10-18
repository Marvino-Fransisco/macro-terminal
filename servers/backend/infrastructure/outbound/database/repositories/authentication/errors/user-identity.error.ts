export class FailedToCreateUserIdentityError extends Error {
  constructor() {
    super("Failed to create user identity");
    this.name = "FailedToCreateUserIdentityError";
  }
}
