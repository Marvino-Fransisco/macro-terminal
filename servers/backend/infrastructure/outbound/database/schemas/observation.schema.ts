import { sql } from "drizzle-orm";
import { check, date, doublePrecision, index, primaryKey, snakeCase, uuid } from "drizzle-orm/pg-core";
import type { PeriodDate } from "@/modules/macro";
import { entity } from "./entity.schema";
import { seriesTable } from "./series.schema";

export const observationsTable = snakeCase.table("observations", {
  ...entity,
  id: uuid().notNull().defaultRandom().unique(),
  seriesId: uuid().notNull().references(() => seriesTable.id),
  periodDate: date().$type<PeriodDate>().notNull(),
  value: doublePrecision().notNull(),
  realtimeStart: date().$type<PeriodDate>().notNull(),
}, (t) => [
  primaryKey({ columns: [t.seriesId, t.periodDate, t.realtimeStart] }),
  index("observations_latest_idx").on(t.seriesId, t.periodDate.desc(), t.realtimeStart.desc()),
  check("observations_finite_value", sql`${t.value} > '-Infinity'::float8 AND ${t.value} < 'Infinity'::float8`),
]);

export type SelectObservationsTable = typeof observationsTable.$inferSelect;
