import { timestamp, uuid } from "drizzle-orm/pg-core";

export const entity = {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
}
