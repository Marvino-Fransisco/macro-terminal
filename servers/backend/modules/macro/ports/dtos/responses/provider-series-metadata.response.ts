import type { Frequency } from "../../../domain/value-objects/frequency.vo";
import type { SeasonalAdjustment } from "../../../domain/value-objects/seasonal-adjustment.vo";

export type ProviderSeriesMetadataResponse = {
  id: string;
  title: string;
  unit: string;
  frequency: Frequency;
  seasonalAdjustment: SeasonalAdjustment;
  notes: string;
  lastUpdated: Date | null;
  releaseId: string | null;
}
