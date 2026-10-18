export class FailedToCreateUserError extends Error {
  constructor() {
    super("Failed to create user");
    this.name = 'FailedToCreateUserError';
  }
}
