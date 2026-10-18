import { MAX_EMAIL_LENGTH } from "../../constants/email.const";

export class InvalidEmailError extends Error {
  constructor() {
    super("Invalid email");
    this.name = "InvalidEmailError"
  }
}

export class EmailTooLongError extends Error {
  constructor() {
    super(`Email must be less than ${MAX_EMAIL_LENGTH} characters long`);
    this.name = "EmailTooLongError"
  }
}
