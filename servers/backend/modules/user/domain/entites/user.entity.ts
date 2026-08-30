import { createEmail, Email } from "../value-objects/email.vo";
import { createUsername, Username } from "../value-objects/username.vo";
import { createDisplayName, DisplayName } from "../value-objects/display-name.vo";
import { createCurrency, createLocale, createTimeZone, Currency, Entity, Locale, TimeZone } from "../../../shared";
import { CreateUserInput } from "../types/create-user.input";

export type User = Entity & {
  username: Username;
  email: Email;
  displayName: DisplayName;
  locale: Locale;
  timeZone: TimeZone;
  defaultCurrency: Currency;
}

export function createUser(input: CreateUserInput): User {
  const username: Username = createUsername(input.username);
  const email: Email = createEmail(input.email);
  const displayName: DisplayName = createDisplayName(input.displayName);
  const locale: Locale = createLocale(input.locale);
  const timeZone: TimeZone = createTimeZone(input.timeZone);
  const defaultCurrency: Currency = createCurrency(input.defaultCurrency);

  return {
    username,
    email,
    displayName,
    locale,
    timeZone,
    defaultCurrency,
  } as User;
}
