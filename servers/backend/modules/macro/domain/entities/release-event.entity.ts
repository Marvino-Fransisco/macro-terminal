import type { Entity } from "@/modules/shared/domain/entities/entity";
import type { PeriodDate } from "../value-objects/period-date.vo";
import type { Provider } from "../value-objects/provider.vo";

export type ReleaseEvent = Entity & {
  provider: Provider;
  releaseId: string;
  releaseName: string;
  scheduledDate: PeriodDate;
  publishedAt: Date | null;
}

export type ReleaseEventInput = Omit<ReleaseEvent, keyof Entity>;
