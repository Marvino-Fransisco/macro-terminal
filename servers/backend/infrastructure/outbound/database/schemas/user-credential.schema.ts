import { varchar, uuid, snakeCase } from "drizzle-orm/pg-core";
import { entity } from "./entity.schema";
import { usersTable } from "./user.schema";

export const userCredentialsTable = snakeCase.table("user_credentials", {
  userId: uuid().notNull().references(() => usersTable.id),
  passwordHash: varchar({ length: 255 }).notNull(),
  ...entity,
})

export type SelectUserCredentialsTable = typeof userCredentialsTable.$inferSelect;
