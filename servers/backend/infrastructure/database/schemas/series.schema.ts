import { sql } from "drizzle-orm";
import { boolean, check, index, integer, snakeCase, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { Priority } from "@/modules/macro";
import { countriesTable } from "./country.schema";
import { frequencyEnum } from "./enumerations/frequency.enum";
import { providerEnum } from "./enumerations/provider.enum";
import { seasonalAdjustmentEnum } from "./enumerations/seasonal-adjustment.enum";
import { entity } from "./entity.schema";
import { indicatorsTable } from "./indicator.schema";

export const seriesTable = snakeCase.table("series", {
  ...entity,
  indicatorId: uuid().notNull().references(() => indicatorsTable.id),
  countryId: uuid().notNull().references(() => countriesTable.id),
  provider: providerEnum().notNull(),
  providerSeriesId: text().notNull(),
  priority: integer().$type<Priority>().notNull().default(1 as Priority),
  frequency: frequencyEnum().notNull(),
  unit: text().notNull(),
  seasonalAdjustment: seasonalAdjustmentEnum().notNull(),
  redistributable: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  lastPolledAt: timestamp({ withTimezone: true }),
  nextPollAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  providerLastUpdatedAt: timestamp({ withTimezone: true }),
  providerReleaseId: text(),
  methodology: text().notNull().default(""),
}, (t) => [
  unique().on(t.provider, t.providerSeriesId),
  unique().on(t.indicatorId, t.countryId, t.provider),
  index("series_due_idx").on(t.isActive, t.nextPollAt),
  check("series_positive_priority", sql`${t.priority} > 0`),
]);

export type SelectSeriesTable = typeof seriesTable.$inferSelect;
