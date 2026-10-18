export class InvalidFrequencyError extends Error {
  constructor(value: string) {
    super(`Invalid frequency: ${value}`);
    this.name = "InvalidFrequencyError";
  }
}
