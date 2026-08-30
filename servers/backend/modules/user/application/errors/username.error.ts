export class UsernameAlreadyTakenError extends Error {
  constructor() {
    super("Username already taken");
    this.name = "UsernameAlreadyTakenError"
  }
}
