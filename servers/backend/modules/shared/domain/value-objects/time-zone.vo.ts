import { InvalidTimeZoneError, TimeZoneTooLongError } from "../errors/time-zone.error";
import { MAX_TIME_ZONE_LENGTH } from "../../constants";

export type TimeZone = string & {
  readonly __brand: "TimeZone";
};

export function createTimeZone(value: string): TimeZone {
  const normalized = value.trim();

  if (normalized.length > MAX_TIME_ZONE_LENGTH) {
    throw new TimeZoneTooLongError();
  }

  try {
    Intl.DateTimeFormat(undefined, {
      timeZone: normalized,
    });

    return normalized as TimeZone;
  } catch {
    throw new InvalidTimeZoneError();
  }
}
