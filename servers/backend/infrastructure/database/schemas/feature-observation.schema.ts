import { date, doublePrecision, jsonb, primaryKey, snakeCase, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { FeatureCode, PeriodDate } from "@/modules/macro";
import { countriesTable } from "./country.schema";
import { entity } from "./entity.schema";

export const featureObservationsTable = snakeCase.table("feature_observations", {
  ...entity,
  id: uuid().notNull().defaultRandom().unique(),
  countryId: uuid().notNull().references(() => countriesTable.id),
  featureCode: text().$type<FeatureCode>().notNull(),
  periodDate: date().$type<PeriodDate>().notNull(),
  value: doublePrecision().notNull(),
  sourceSeriesIds: jsonb().$type<string[]>().notNull(),
  computedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.countryId, t.featureCode, t.periodDate] })]);

export type SelectFeatureObservationsTable = typeof featureObservationsTable.$inferSelect;
