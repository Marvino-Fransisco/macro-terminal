import type { Entity } from "@/modules/shared/domain/entities/entity";
import { createName, type Name } from "@/modules/shared/domain/value-objects/name.vo";
import { createIndicatorCode, type IndicatorCode } from "../value-objects/indicator-code.vo";
import type { Category } from "../value-objects/category.vo";
import type { Frequency } from "../value-objects/frequency.vo";
import type { SeasonalAdjustment } from "../value-objects/seasonal-adjustment.vo";
import { US_CATALOG } from "../../constants/us-catalog.const";
import { WORLD_BANK_CATALOG } from "../../constants/world-bank-catalog.const";

export type Indicator = Entity & {
  code: IndicatorCode;
  name: Name;
  category: Category;
  unit: string;
  frequency: Frequency;
  seasonalAdjustment: SeasonalAdjustment;
  description: string;
}

export type IndicatorInput = Omit<Indicator, keyof Entity>;

export const INDICATORS: IndicatorInput[] = [
  ...US_CATALOG.map((entry): IndicatorInput => ({ code: createIndicatorCode(entry.code), name: createName(entry.code.replaceAll("_", " ")), category: entry.category, frequency: entry.frequency, unit: "provider-defined", seasonalAdjustment: "unknown", description: "See selected series methodology and units" })),
  ...WORLD_BANK_CATALOG.filter(([code]) => !US_CATALOG.some((entry) => entry.code === code)).map(([code, , category, unit]): IndicatorInput => ({ code: createIndicatorCode(code), name: createName(code.replaceAll("_", " ")), category, frequency: "annual", unit, seasonalAdjustment: "nsa", description: "World Bank annual indicator; see series methodology" })),
];
