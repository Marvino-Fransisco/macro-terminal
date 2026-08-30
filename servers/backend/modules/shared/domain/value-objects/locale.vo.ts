import { InvalidLocaleError, LocaleTooLongError } from "../errors/local.error";
import { MAX_LOCALE_LENGTH } from "../../constants";

export type Locale = string & {
  readonly __brand: "Locale";
}

export function createLocale(value: string): Locale {
  let locale: string;

  try {
    locale = new Intl.Locale(value.trim()).toString();
  } catch {
    throw new InvalidLocaleError();
  }

  if (locale.length > MAX_LOCALE_LENGTH) {
    throw new LocaleTooLongError();
  }

  return locale as Locale;
}
