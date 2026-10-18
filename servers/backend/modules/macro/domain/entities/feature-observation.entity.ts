import type { Entity } from "@/modules/shared/domain/entities/entity";
import type { FeatureCode } from "../value-objects/feature-code.vo";
import type { Point } from "../value-objects/point.vo";

export type FeatureObservation = Entity & Point & {
  countryId: string;
  featureCode: FeatureCode;
  sourceSeriesIds: string[];
  computedAt: Date;
}

export type FeatureObservationInput = Omit<FeatureObservation, keyof Entity>;
