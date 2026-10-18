import type { Frequency } from "../../value-objects/frequency.vo";
import type { Point } from "../../value-objects/point.vo";

export interface FeatureDefinition {
  code: string;
  inputs: string[];
  frequencies?: Record<string, Frequency>;
  compute: (inputs: Record<string, Point[]>) => Point[];
}
