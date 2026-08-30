import { MAX_TIME_ZONE_LENGTH } from "../../constants";

export class InvalidTimeZoneError extends Error {
  constructor() {
    super("Invalid time zone");
    this.name = "InvalidTimeZoneError";
  }
}

export class TimeZoneTooLongError extends Error {
  constructor() {
    super(`Time zone must be less than ${MAX_TIME_ZONE_LENGTH} characters long`);
    this.name = "TimeZoneTooLongError";
  }
}
