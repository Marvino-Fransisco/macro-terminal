import type { Entity } from "@/modules/shared/domain/entities/entity";
import type { Frequency } from "../value-objects/frequency.vo";
import type { Priority } from "../value-objects/priority.vo";
import type { Provider } from "../value-objects/provider.vo";
import type { SeasonalAdjustment } from "../value-objects/seasonal-adjustment.vo";

export type Series = Entity & {
  indicatorId: string;
  countryId: string;
  provider: Provider;
  providerSeriesId: string;
  priority: Priority;
  frequency: Frequency;
  unit: string;
  seasonalAdjustment: SeasonalAdjustment;
  redistributable: boolean;
  isActive: boolean;
  lastPolledAt: Date | null;
  nextPollAt: Date;
  providerLastUpdatedAt: Date | null;
  providerReleaseId: string | null;
  methodology: string;
}

export type SeriesInput = Omit<Series, keyof Entity>;
