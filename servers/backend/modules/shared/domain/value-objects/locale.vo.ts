import { InvalidLocaleError } from "../errors/local.error";

export type Locale = string & {
  readonly __brand: "Locale";
}

const MAX_LOCALE_LENGTH = 35;

export function createLocale(value: string): Locale {
  try {
    const locale = new Intl.Locale(value.trim()).toString();

    if (locale.length > MAX_LOCALE_LENGTH) {
      throw new InvalidLocaleError();
    }

    return locale as Locale;
  } catch {
    throw new InvalidLocaleError();
  }
}
