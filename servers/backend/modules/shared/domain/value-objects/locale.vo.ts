import { InvalidLocaleError } from "../errors/local.error";

export type Locale = string & {
  readonly __brand: "Locale";
}

export function createLocale(value: string): Locale {
  try {
    const locale = new Intl.Locale(value.trim()).toString();
    return locale as Locale;
  } catch {
    throw new InvalidLocaleError();
  }
}
