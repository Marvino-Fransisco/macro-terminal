import type { ReleaseEvent } from "../../../domain/entities/release-event.entity";
import type { AttributionResponse } from "./attribution.response";

export type CalendarResponse = {
  events: ReleaseEvent[];
  attributions: AttributionResponse[];
}
