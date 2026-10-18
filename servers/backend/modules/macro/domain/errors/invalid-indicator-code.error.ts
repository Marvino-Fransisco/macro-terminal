export class InvalidIndicatorCodeError extends Error {
  constructor(value: string) {
    super(`Invalid indicator code: ${value}`);
    this.name = "InvalidIndicatorCodeError";
  }
}
