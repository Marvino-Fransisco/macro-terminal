import { index, integer, snakeCase, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ingestionStatusEnum } from "./enumerations/ingestion-status.enum";
import { seriesTable } from "./series.schema";

export const ingestionRunsTable = snakeCase.table("ingestion_runs", {
  id: uuid().primaryKey().defaultRandom(),
  seriesId: uuid().notNull().references(() => seriesTable.id),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp({ withTimezone: true }),
  status: ingestionStatusEnum().notNull().default("running"),
  rowsFetched: integer().notNull().default(0),
  rowsInserted: integer().notNull().default(0),
  error: text(),
}, (t) => [index("ingestion_runs_series_started_idx").on(t.seriesId, t.startedAt.desc())]);

export type SelectIngestionRunsTable = typeof ingestionRunsTable.$inferSelect;
