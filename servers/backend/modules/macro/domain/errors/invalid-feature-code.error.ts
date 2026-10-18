export class InvalidFeatureCodeError extends Error {
  constructor(value: string) {
    super(`Invalid feature code: ${value}`);
    this.name = "InvalidFeatureCodeError";
  }
}
