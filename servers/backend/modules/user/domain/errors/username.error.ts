import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from "../../constants";

export class InvalidUsernameError extends Error {
  constructor() {
    super(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters long`);
    this.name = "InvalidUsernameError"
  }
}
