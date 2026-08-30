import { char, varchar, snakeCase } from "drizzle-orm/pg-core";
import { entity } from "./entity.schema";

export const usersTable = snakeCase.table("users", {
  username: varchar({ length: 255 }).unique().notNull(),
  email: varchar({ length: 255 }).unique().notNull(),
  displayName: varchar({ length: 255 }).notNull(),
  locale: varchar({ length: 35 }).notNull(),
  timeZone: varchar({ length: 64 }).notNull(),
  defaultCurrency: char({ length: 3 }).notNull(),
  ...entity,
})
