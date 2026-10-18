import { date, snakeCase, text, timestamp, unique } from "drizzle-orm/pg-core";
import type { PeriodDate } from "@/modules/macro";
import { entity } from "./entity.schema";
import { providerEnum } from "./enumerations/provider.enum";

export const releaseEventsTable = snakeCase.table("release_events", {
  ...entity,
  provider: providerEnum().notNull(),
  releaseId: text().notNull(),
  releaseName: text().notNull(),
  scheduledDate: date().$type<PeriodDate>().notNull(),
  publishedAt: timestamp({ withTimezone: true }),
}, (t) => [unique().on(t.provider, t.releaseId, t.scheduledDate)]);

export type SelectReleaseEventsTable = typeof releaseEventsTable.$inferSelect;
