export class InvalidAuthProviderError extends Error {
  constructor() {
    super("Invalid auth provider");
    this.name = "InvalidAuthProviderError";
  }
}
