export class InvalidCategoryError extends Error {
  constructor(value: string) {
    super(`Invalid category: ${value}`);
    this.name = "InvalidCategoryError";
  }
}
