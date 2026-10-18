import type { Entity } from "@/modules/shared/domain/entities/entity";
import type { PeriodDate } from "../value-objects/period-date.vo";
import type { Point } from "../value-objects/point.vo";

export type Observation = Entity & Point & {
  seriesId: string;
  realtimeStart: PeriodDate;
}

export type ObservationInput = Omit<Observation, keyof Entity>;
