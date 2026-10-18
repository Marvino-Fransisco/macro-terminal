import { ADJUSTMENTS } from "../../constants/seasonal-adjustment.const";
import { InvalidSeasonalAdjustmentError } from "../errors/invalid-seasonal-adjustment.error";

export type SeasonalAdjustment = typeof ADJUSTMENTS[number];

export function createSeasonalAdjustment(value: string): SeasonalAdjustment {
  if (!ADJUSTMENTS.includes(value as SeasonalAdjustment)) {
    throw new InvalidSeasonalAdjustmentError(value);
  }
  return value as SeasonalAdjustment;
}
