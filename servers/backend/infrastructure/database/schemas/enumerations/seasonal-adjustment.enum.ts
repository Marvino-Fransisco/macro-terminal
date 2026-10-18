import { pgEnum } from "drizzle-orm/pg-core";
import { ADJUSTMENTS } from "@/modules/macro";

export const seasonalAdjustmentEnum = pgEnum("macro_adjustment", ADJUSTMENTS);
