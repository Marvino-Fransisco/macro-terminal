import { Email } from "../value-objects/email.vo";
import { Currency, Entity, Locale, TimeZone } from "../../../shared";

export type User = Entity & {
  username: string;
  email: Email;
  displayName: string;
  locale: Locale;
  timeZone: TimeZone;
  defaultCurrency: Currency;
}
