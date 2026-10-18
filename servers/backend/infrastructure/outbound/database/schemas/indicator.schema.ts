import { snakeCase, text, varchar } from "drizzle-orm/pg-core";
import type { IndicatorCode } from "@/modules/macro";
import { NAME_MAX_LENGTH } from "@/modules/shared/constants/name.const";
import type { Name } from "@/modules/shared/domain/value-objects/name.vo";
import { categoryEnum } from "./enumerations/category.enum";
import { frequencyEnum } from "./enumerations/frequency.enum";
import { seasonalAdjustmentEnum } from "./enumerations/seasonal-adjustment.enum";
import { entity } from "./entity.schema";

export const indicatorsTable = snakeCase.table("indicators", {
  ...entity,
  code: text().$type<IndicatorCode>().notNull().unique(),
  name: varchar({ length: NAME_MAX_LENGTH }).$type<Name>().notNull(),
  category: categoryEnum().notNull(),
  unit: text().notNull(),
  frequency: frequencyEnum().notNull(),
  seasonalAdjustment: seasonalAdjustmentEnum().notNull(),
  description: text().notNull(),
});

export type SelectIndicatorsTable = typeof indicatorsTable.$inferSelect;
