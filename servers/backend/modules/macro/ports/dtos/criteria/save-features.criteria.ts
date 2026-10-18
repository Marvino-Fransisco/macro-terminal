import type { FeatureObservationInput } from "../../../domain/entities/feature-observation.entity";

export type SaveFeaturesCriteria = {
  countryId: string;
  features: FeatureObservationInput[];
  requestedAt: Date;
}
