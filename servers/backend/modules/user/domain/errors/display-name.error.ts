import { MAX_DISPLAY_NAME_LENGTH, MIN_DISPLAY_NAME_LENGTH } from "../../constants";

export class InvalidDisplayNameError extends Error {
  constructor() {
    super(`Display name must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters long`);
    this.name = "InvalidDisplayNameError"
  }
}
