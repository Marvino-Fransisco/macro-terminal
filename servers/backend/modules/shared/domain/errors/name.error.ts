import { NAME_MAX_LENGTH } from "../../constants/name.const";

export class InvalidNameError extends Error {
  constructor(value: string) {
    super(`Name must be between 1 and ${NAME_MAX_LENGTH} characters: ${value}`);
    this.name = "InvalidNameError";
  }
}
