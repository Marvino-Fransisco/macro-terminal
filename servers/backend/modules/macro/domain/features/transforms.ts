import type { Frequency } from "../value-objects/frequency.vo";
import type { Point } from "../value-objects/point.vo";
import { MacroValidationError } from "../errors/macro-validation.error";
import { difference, growth, yoy } from "./growth";
import { movingAverage, percentile, zscore } from "./rolling";

export function transform(points: readonly Point[], frequency: Frequency, feature: string): Point[] {
  if (feature === "yoy") return yoy(points, frequency);
  if (feature === "percentile") return percentile(points);
  if (feature === "mom" && frequency === "monthly") return growth(points, frequency, 1);
  if (feature === "qoq" && frequency === "quarterly") return growth(points, frequency, 1);
  if (feature === "qoq_ann" && frequency === "quarterly") return growth(points, frequency, 1, true);
  if (feature === "ann_3m" && frequency === "monthly") return growth(points, frequency, 3, true);
  if (feature === "ann_6m" && frequency === "monthly") return growth(points, frequency, 6, true);
  const match = /^(diff|ma|zscore|annualized)_(\d{1,4})$/.exec(feature);
  if (match) {
    const window = Number(match[2]);
    if (window > 0) {
      if (match[1] === "diff") return difference(points, frequency, window);
      if (match[1] === "ma") return movingAverage(points, window);
      if (match[1] === "zscore") {
        if (window < 2) throw new MacroValidationError("Z-score window must be at least 2");
        return zscore(points, window);
      }
      if (["monthly", "quarterly", "annual"].includes(frequency)) return growth(points, frequency, window, true);
    }
  }
  throw new MacroValidationError(`Unsupported feature or frequency: ${feature}/${frequency}`);
}
