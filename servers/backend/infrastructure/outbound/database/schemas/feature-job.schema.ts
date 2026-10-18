import { snakeCase, timestamp, uuid } from "drizzle-orm/pg-core";
import { countriesTable } from "./country.schema";

export const featureJobsTable = snakeCase.table("macro_feature_jobs", {
  countryId: uuid().primaryKey().references(() => countriesTable.id),
  requestedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type SelectFeatureJobsTable = typeof featureJobsTable.$inferSelect;
