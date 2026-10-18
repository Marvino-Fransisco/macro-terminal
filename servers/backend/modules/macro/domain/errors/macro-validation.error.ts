export class MacroValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MacroValidationError";
  }
}
