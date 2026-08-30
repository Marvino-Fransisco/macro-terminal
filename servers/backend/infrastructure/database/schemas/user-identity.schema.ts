import { varchar, uuid, snakeCase } from "drizzle-orm/pg-core";
import { entity } from "./entity.schema";
import { usersTable } from "./user.schema";
import { authProviderEnum } from "../enumerations/auth-provider.enum";

export const userIdentitiesTable = snakeCase.table("user_identities", {
  userId: uuid().notNull().references(() => usersTable.id),
  provider: authProviderEnum().notNull(),
  providerUserId: varchar({ length: 255 }).notNull(),
  ...entity,
})
