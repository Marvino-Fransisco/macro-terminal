export class InvalidPeriodDateError extends Error {
  constructor(value: string) {
    super(`Invalid date: ${value}`);
    this.name = "InvalidPeriodDateError";
  }
}
