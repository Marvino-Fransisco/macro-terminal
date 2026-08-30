import { SelectUsersTable } from "@/infrastructure/database/schemas/user.schema";
import { createCurrency, createLocale, createTimeZone } from "@/modules/shared";
import { createDisplayName, createEmail, createUsername, User } from "@/modules/user";

export function toUserEntity(row: SelectUsersTable): User {
  return {
    id: row.id,
    username: createUsername(row.username),
    email: createEmail(row.email),
    displayName: createDisplayName(row.displayName),
    locale: createLocale(row.locale),
    timeZone: createTimeZone(row.timeZone),
    defaultCurrency: createCurrency(row.defaultCurrency),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}
