export class InvalidPointError extends Error {
  constructor(value: number) {
    super(`Invalid point value: ${value}`);
    this.name = "InvalidPointError";
  }
}
