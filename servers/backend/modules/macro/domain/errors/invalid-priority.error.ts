export class InvalidPriorityError extends Error {
  constructor(value: number) {
    super(`Invalid priority: ${value}`);
    this.name = "InvalidPriorityError";
  }
}
