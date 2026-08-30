import { createEmail, Email } from "../value-objects/email.vo";
import { createCurrency, createLocale, createTimeZone, Currency, Entity, Locale, TimeZone } from "../../../shared";
import { CreateUserInput } from "../types/create-user.input";

export type User = Entity & {
  username: string;
  email: Email;
  displayName: string;
  locale: Locale;
  timeZone: TimeZone;
  defaultCurrency: Currency;
}

export function createUser(input: CreateUserInput): User {
  const email: Email = createEmail(input.email);
  const locale: Locale = createLocale(input.locale);
  const timeZone: TimeZone = createTimeZone(input.timeZone);
  const defaultCurrency: Currency = createCurrency(input.defaultCurrency);

  return {
    username: input.username,
    email,
    displayName: input.displayName,
    locale,
    timeZone,
    defaultCurrency,
  } as User;
}
