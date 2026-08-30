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
    throw new Error("Invalid time zone");
  }
}
