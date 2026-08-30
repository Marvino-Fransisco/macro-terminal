export class InvalidTimeZoneError extends Error {
  constructor() {
    super("Invalid time zone");
    this.name = "InvalidTimeZoneError";
  }
}
