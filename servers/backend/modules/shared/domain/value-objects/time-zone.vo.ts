import { InvalidTimeZoneError } from "../errors/time-zone.error";

export type TimeZone = string & {
  readonly __brand: "TimeZone";
};

export function createTimeZone(value: string): TimeZone {
  const normalized = value.trim();

  try {
    Intl.DateTimeFormat(undefined, {
      timeZone: normalized,
    });

    return normalized as TimeZone;
  } catch {
    throw new InvalidTimeZoneError();
  }
}
